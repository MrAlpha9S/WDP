const SpectatorRepository = require('../repositories/SpectatorRepository');
const TransactionRepository = require('../repositories/TransactionRepository');
const PredictionMethod = require('../entities/PredictionMethod');

class StatisticsService {
    // Prediction win rate, rewards earned/staked, and method-type breakdown.
    // Win rate is computed over settled predictions only (correct + incorrect) —
    // unlike getSpectatorProfile's inline stats, which use all statuses as the
    // denominator and so get diluted by pending/cancelled/refunded rows.
    async getStatistics(spectatorId) {
        try {
            const spectator = await SpectatorRepository.findBySpectatorId(spectatorId);
            if (!spectator) return { code: 404, msg: 'Spectator not found' };

            const mongoose = require('mongoose');
            const Prediction = require('../entities/Prediction');
            const spectatorObjectId = new mongoose.Types.ObjectId(String(spectatorId));

            const [statusAgg, methodAgg, totalRewardsEarned, totalStakedRaw] = await Promise.all([
                Prediction.aggregate([
                    { $match: { spectatorId: spectatorObjectId } },
                    { $group: { _id: '$predictionStatus', count: { $sum: 1 } } },
                ]),
                Prediction.aggregate([
                    { $match: { spectatorId: spectatorObjectId } },
                    { $group: { _id: '$predictionMethodId', count: { $sum: 1 } } },
                ]),
                TransactionRepository.sumAmountByUserId(spectatorId, { transactionType: 'reward', amount: { $gt: 0 } }),
                TransactionRepository.sumAmountByUserId(spectatorId, { transactionType: 'reward', amount: { $lt: 0 } }),
            ]);

            const statusCounts = Object.fromEntries(statusAgg.map(r => [r._id, r.count]));
            const pending = statusCounts.pending ?? 0;
            const correct = statusCounts.correct ?? 0;
            const incorrect = statusCounts.incorrect ?? 0;
            const cancelled = statusCounts.cancelled ?? 0;
            const refunded = statusCounts.refunded ?? 0;
            const totalPredictions = pending + correct + incorrect + cancelled + refunded;
            const settled = correct + incorrect;
            const winRate = settled > 0 ? parseFloat(((correct / settled) * 100).toFixed(2)) : 0;

            const methodDocs = await PredictionMethod.find({}, 'methodType').lean();
            const methodTypeMap = new Map(methodDocs.map(m => [String(m._id), m.methodType]));
            const methodTotals = {};
            for (const row of methodAgg) {
                const type = methodTypeMap.get(String(row._id)) ?? 'unknown';
                methodTotals[type] = (methodTotals[type] ?? 0) + row.count;
            }
            const predictionsByMethodType = {};
            for (const [type, count] of Object.entries(methodTotals)) {
                predictionsByMethodType[type] = {
                    count,
                    pct: totalPredictions > 0 ? Math.round((count / totalPredictions) * 100) : 0,
                };
            }

            const totalStaked = Math.abs(totalStakedRaw || 0);
            const netProfit = parseFloat(((totalRewardsEarned || 0) - totalStaked).toFixed(2));

            return {
                code: 200,
                data: {
                    wallet: spectator.wallet,
                    totalPredictions,
                    correct,
                    incorrect,
                    pending,
                    cancelled,
                    refunded,
                    winRate,
                    totalRewardsEarned: totalRewardsEarned || 0,
                    totalStaked,
                    netProfit,
                    predictionsByMethodType,
                },
                msg: 'Spectator statistics retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Rewards earned over time (day/week/month/year), gap-filled so charts
    // always render a contiguous line. Mirrors RefereeService.getFeesEarningsSeries.
    async getRewardsEarningsSeries(spectatorId, groupBy = 'day') {
        try {
            const mongoose = require('mongoose');
            const Transaction = require('../entities/Transaction');

            let dateFormat = '%Y-%m-%d';
            if (groupBy === 'week') dateFormat = '%Y-%U';
            else if (groupBy === 'month') dateFormat = '%Y-%m';
            else if (groupBy === 'year') dateFormat = '%Y';

            const series = await Transaction.aggregate([
                {
                    $match: {
                        userId: new mongoose.Types.ObjectId(String(spectatorId)),
                        transactionType: 'reward',
                        amount: { $gt: 0 },
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: dateFormat, date: '$date' } },
                        rewardsEarned: { $sum: '$amount' },
                    },
                },
                { $sort: { _id: 1 } },
            ]);

            let result = series.map(row => ({ date: row._id, rewardsEarned: parseFloat(row.rewardsEarned.toFixed(2)) }));

            const getPastPeriods = (type) => {
                const pad = n => n.toString().padStart(2, '0');
                const periods = [];
                const count = type === 'year' ? 3 : type === 'month' ? 6 : type === 'week' ? 4 : 7;
                for (let i = count - 1; i >= 0; i--) {
                    const d = new Date();
                    if (type === 'year') {
                        d.setFullYear(d.getFullYear() - i);
                        periods.push(`${d.getFullYear()}`);
                    } else if (type === 'month') {
                        d.setMonth(d.getMonth() - i);
                        periods.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
                    } else if (type === 'week') {
                        d.setDate(d.getDate() - (i * 7));
                        const startOfYear = new Date(d.getFullYear(), 0, 1);
                        const days = Math.floor((d - startOfYear) / (24 * 60 * 60 * 1000));
                        const weekNum = Math.floor((days + startOfYear.getDay()) / 7);
                        periods.push(`${d.getFullYear()}-${pad(weekNum)}`);
                    } else {
                        d.setDate(d.getDate() - i);
                        periods.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
                    }
                }
                return periods;
            };

            const dbMap = new Map(result.map(r => [r.date, r]));
            for (const date of getPastPeriods(groupBy)) {
                if (!dbMap.has(date)) {
                    result.push({ date, rewardsEarned: 0 });
                    dbMap.set(date, true);
                }
            }
            result.sort((a, b) => a.date.localeCompare(b.date));

            const totalRewardsEarned = parseFloat(result.reduce((s, r) => s + r.rewardsEarned, 0).toFixed(2));

            return { code: 200, data: { totalRewardsEarned, series: result }, msg: 'Rewards earnings series retrieved successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new StatisticsService();
