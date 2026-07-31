const RefereeRepository = require('../repositories/RefereeRepository');
const TransactionRepository = require('../repositories/TransactionRepository');
const RaceReferee = require('../entities/RaceReferee');
const RaceRound = require('../entities/RaceRound');
const Violation = require('../entities/Violation');

class StatisticsService {
    // ─── Wallet ──────────────────────────────────────────────────────────────

    async getWalletInfo(refereeId) {
        try {
            const referee = await RefereeRepository.findByRefereeId(refereeId);
            if (!referee) return { code: 404, msg: 'Referee not found' };

            const totalFeesReceived = await TransactionRepository.sumAmountByParty(
                refereeId, 'referee', 'payee', { paymentStatus: 'paid' }
            );

            return {
                code: 200,
                data: {
                    referee: { _id: referee._id, wallet: referee.wallet },
                    stats: { totalFeesReceived },
                },
                msg: 'Wallet info retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Flat statistics snapshot — no time-series data (no backend precedent for
    // real aggregation exists yet), just current totals.
    async getStatistics(refereeId) {
        try {
            const referee = await RefereeRepository.findByRefereeId(refereeId);
            if (!referee) return { code: 404, msg: 'Referee not found' };

            const [
                totalInvitations,
                assignedAssignments,
                rejectedCount,
                pendingCount,
                totalFeesEarned,
                pendingFeesAmount,
            ] = await Promise.all([
                RaceReferee.countDocuments({ refereeId }),
                RaceReferee.find({ refereeId, status: 'assigned' }, '_id raceRoundId').lean(),
                RaceReferee.countDocuments({ refereeId, status: 'rejected' }),
                RaceReferee.countDocuments({ refereeId, status: 'pending' }),
                TransactionRepository.sumAmountByParty(refereeId, 'referee', 'payee', { paymentStatus: 'paid' }),
                TransactionRepository.sumAmountByParty(refereeId, 'referee', 'payee', { paymentStatus: { $ne: 'paid' } }),
            ]);

            const acceptedCount = assignedAssignments.length;
            const assignmentIds = assignedAssignments.map(a => a._id);
            const raceRoundIds = assignedAssignments.map(a => a.raceRoundId);

            // "Officiated" means the race actually happened, not merely that the
            // invitation was accepted — an 'assigned' race may still be upcoming.
            const [totalRacesOfficiated, violationCounts] = await Promise.all([
                RaceRound.countDocuments({ _id: { $in: raceRoundIds }, status: 'completed' }),
                Violation.aggregate([
                    { $match: { raceRefereeId: { $in: assignmentIds } } },
                    { $group: { _id: '$violationStatus', count: { $sum: 1 } } },
                ]),
            ]);

            const violationsByStatus = Object.fromEntries(violationCounts.map(v => [v._id, v.count]));
            const totalViolationsFiled = violationCounts.reduce((sum, v) => sum + v.count, 0);

            return {
                code: 200,
                data: {
                    wallet: referee.wallet,
                    totalInvitations,
                    totalRacesOfficiated,
                    acceptedCount,
                    rejectedCount,
                    pendingCount,
                    totalFeesEarned,
                    pendingFeesAmount,
                    totalViolationsFiled,
                    confirmedViolationsCount: violationsByStatus.confirmed ?? 0,
                    dismissedViolationsCount: violationsByStatus.dismissed ?? 0,
                },
                msg: 'Referee statistics retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Fees earned over time (day/week/month/year), gap-filled so charts always
    // render a contiguous line. Mirrors AdminService.getDashboardHouseEarnings
    // and HorseOwnerService.getFinancialEarningsSeries.
    async getFeesEarningsSeries(refereeId, groupBy = 'day') {
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
                        payeeId: new mongoose.Types.ObjectId(String(refereeId)),
                        payeeRole: 'referee',
                        paymentType: 'referee_fee',
                        paymentStatus: 'paid',
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: dateFormat, date: '$date' } },
                        feesEarned: { $sum: '$amount' },
                    },
                },
                { $sort: { _id: 1 } },
            ]);

            let result = series.map(row => ({ date: row._id, feesEarned: parseFloat(row.feesEarned.toFixed(2)) }));

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
                    result.push({ date, feesEarned: 0 });
                    dbMap.set(date, true);
                }
            }
            result.sort((a, b) => a.date.localeCompare(b.date));

            const totalFeesEarned = parseFloat(result.reduce((s, r) => s + r.feesEarned, 0).toFixed(2));

            return { code: 200, data: { totalFeesEarned, series: result }, msg: 'Fees earnings series retrieved successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Referee's own completed-race work history — race rounds they were assigned
    // to and that have actually finished, each with the violations logged
    // against that assignment. Mirrors AdminService.getUsersDetail's referee
    // branch, scoped to the caller and to completed races only.
    async getWorkHistory(refereeId, page = 1, limit = 10, sortBy = 'raceDate', order = 'desc') {
        try {
            const assignments = await RaceReferee.find({ refereeId, status: 'assigned' })
                .populate('raceRoundId')
                .lean();

            const completed = assignments.filter(a => a.raceRoundId?.status === 'completed');

            completed.sort((a, b) => {
                const aVal = sortBy === 'assignedAt' ? new Date(a.assignedAt) : new Date(a.raceRoundId?.raceDate ?? 0);
                const bVal = sortBy === 'assignedAt' ? new Date(b.assignedAt) : new Date(b.raceRoundId?.raceDate ?? 0);
                return order === 'asc' ? aVal - bVal : bVal - aVal;
            });

            const totalItems = completed.length;
            const skip = (page - 1) * limit;
            const pageSlice = completed.slice(skip, skip + limit);

            const CurrencyConverter = require('./CurrencyConverter');
            const Transaction = require('../entities/Transaction');

            // RaceReferee.paymentStatus is legacy and never written to — the
            // Transaction-backed payment-verification flow is authoritative
            // (same convention as getRefereeInvitations above).
            const payments = pageSlice.length
                ? await Transaction.find({
                    sourceType: 'RaceReferee',
                    sourceId: { $in: pageSlice.map(a => a._id) },
                    paymentType: 'referee_fee',
                }).lean()
                : [];
            const paymentBySourceId = new Map(payments.map(p => [String(p.sourceId), p]));

            const items = await Promise.all(pageSlice.map(async (a) => {
                const raceRound = a.raceRoundId;
                const violations = await Violation.find({ raceRefereeId: a._id })
                    .populate('violationTypeId')
                    .lean();
                const matchedPayment = paymentBySourceId.get(String(a._id));

                return {
                    assignmentId: a._id,
                    raceRoundId: raceRound?._id ?? null,
                    roundName: raceRound?.roundName ?? null,
                    raceDate: raceRound?.raceDate ?? null,
                    location: raceRound?.location ?? null,
                    raceGround: raceRound?.raceGround ?? null,
                    trackLength: raceRound?.trackLength ?? null,
                    paymentStatus: matchedPayment?.paymentStatus || 'unpaid',
                    fee: matchedPayment
                        ? matchedPayment.amount
                        : CurrencyConverter.convertToVnd(a.fee ?? 0, raceRound?.currencyType),
                    assignedAt: a.assignedAt,
                    violations: violations.map(v => ({
                        violationId: v._id,
                        typeName: v.violationTypeId?.violationName ?? null,
                        description: v.description ?? null,
                        severity: v.severity ?? null,
                        stewardAction: v.stewardAction ?? null,
                        violationStatus: v.violationStatus,
                        reportedAt: v.created_at,
                    })),
                };
            }));

            return {
                code: 200,
                data: {
                    items,
                    pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit },
                },
                msg: 'Work history retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new StatisticsService();
