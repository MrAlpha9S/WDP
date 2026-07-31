const HorseOwnerRepository = require('../repositories/HorseOwnerRepository');
const Registration = require('../entities/Registration');
const RaceRound = require('../entities/RaceRound');
const Invitation = require('../entities/Invitation');
const RaceResult = require('../entities/RaceResult');
const Violation = require('../entities/Violation');
const CurrencyConverter = require('./CurrencyConverter');

class FinancialService {
    // Financial summary: wins, losses, prize totals, jockey payouts
    async getFinancialSummary(ownerId) {
        try {
            if (!ownerId) return { code: 400, msg: 'ownerId is required' };

            const registrations = await Registration.find({ horseOwnerId: ownerId }).lean();
            const regIds = registrations.map(r => r._id);

            const [results, invitations, violations] = await Promise.all([
                regIds.length > 0 ? RaceResult.find({ registrationId: { $in: regIds } }).lean() : [],
                regIds.length > 0
                    ? Invitation.find({ registrationId: { $in: regIds }, invitationStatus: 'accepted' }).lean()
                    : [],
                regIds.length > 0 ? Violation.find({ registrationId: { $in: regIds } }).lean() : [],
            ]);

            // prizeMoney is stored in each race round's own currency — convert to VND
            // (the single currency this page displays in) before summing across races.
            const raceRoundIds = [...new Set(registrations.map(r => String(r.raceRoundId)))];
            const raceRounds = raceRoundIds.length
                ? await RaceRound.find({ _id: { $in: raceRoundIds } }, 'currencyType').lean()
                : [];
            const currencyByRoundId = new Map(raceRounds.map(rr => [String(rr._id), rr.currencyType || 'VND']));
            const regById = new Map(registrations.map(r => [String(r._id), r]));
            const currencyForReg = (regId) => {
                const reg = regById.get(String(regId));
                return reg ? currencyByRoundId.get(String(reg.raceRoundId)) : 'VND';
            };

            const officialResults = results.filter(r => r.finishPosition != null && r.resultStatus === 'official');
            const wins = officialResults.filter(r => r.finishPosition === 1).length;
            const losses = officialResults.filter(r => r.finishPosition !== 1).length;
            const totalPrize = officialResults.reduce((sum, r) =>
                sum + CurrencyConverter.convertToVnd(r.prizeMoney || 0, currencyForReg(r.registrationId)), 0);

            const resultByRegId = new Map(officialResults.map(r => [String(r.registrationId), r]));
            let totalJockeyPayout = 0;
            for (const inv of invitations) {
                const result = resultByRegId.get(String(inv.registrationId));
                if (result && inv.percentagePayout) {
                    const shareOriginal = (inv.percentagePayout / 100) * (result.prizeMoney || 0);
                    totalJockeyPayout += CurrencyConverter.convertToVnd(shareOriginal, currencyForReg(inv.registrationId));
                }
            }
            totalJockeyPayout = Math.round(totalJockeyPayout);

            const horseOwner = await HorseOwnerRepository.findById(ownerId);

            return {
                code: 200,
                data: {
                    totalRaces: officialResults.length,
                    totalWins: wins,
                    totalLosses: losses,
                    totalPrize,
                    totalJockeyPayout,
                    netProfit: totalPrize - totalJockeyPayout,
                    totalViolations: violations.length,
                    wallet: horseOwner?.wallet || 0,
                },
                msg: 'Financial summary retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Paginated race activity for financials table
    async getFinancialRaceResults(ownerId, page = 1, limit = 10, search = null) {
        try {
            if (!ownerId) return { code: 400, msg: 'ownerId is required' };

            const allRegs = await Registration.find({ horseOwnerId: ownerId })
                .populate('horseId', 'horseName')
                .populate('raceRoundId', 'roundName raceDate location currencyType')
                .sort({ createdAt: -1 })
                .lean();

            const filteredRegs = search
                ? allRegs.filter(r => {
                    const sl = search.toLowerCase();
                    return (r.raceRoundId?.roundName ?? '').toLowerCase().includes(sl)
                        || (r.horseId?.horseName ?? '').toLowerCase().includes(sl);
                })
                : allRegs;

            const totalItems = filteredRegs.length;
            const skip = (page - 1) * limit;
            const pagedRegs = filteredRegs.slice(skip, skip + limit);
            const pagedRegIds = pagedRegs.map(r => r._id);

            const [results, invitations, violations] = await Promise.all([
                pagedRegIds.length > 0 ? RaceResult.find({ registrationId: { $in: pagedRegIds } }).lean() : [],
                pagedRegIds.length > 0
                    ? Invitation.find({ registrationId: { $in: pagedRegIds }, invitationStatus: 'accepted' })
                        .populate({ path: 'jockeyId', model: 'User', select: 'fullName' })
                        .lean()
                    : [],
                pagedRegIds.length > 0
                    ? Violation.find({ registrationId: { $in: pagedRegIds } })
                        .populate('violationTypeId', 'violationName category severity defaultPenalty')
                        .lean()
                    : [],
            ]);

            const resultByRegId = new Map(results.map(r => [String(r.registrationId), r]));
            const invByRegId = new Map(invitations.map(inv => [String(inv.registrationId), inv]));
            const violsByRegId = {};
            for (const v of violations) {
                const key = String(v.registrationId);
                if (!violsByRegId[key]) violsByRegId[key] = [];
                violsByRegId[key].push(v);
            }

            const items = pagedRegs.map(reg => {
                const result = resultByRegId.get(String(reg._id));
                const inv = invByRegId.get(String(reg._id));
                const regViolations = violsByRegId[String(reg._id)] ?? [];
                const currency = reg.raceRoundId?.currencyType || 'VND';
                const prizeMoney = CurrencyConverter.convertToVnd(result?.prizeMoney ?? 0, currency);
                const jockeyPayout = inv?.percentagePayout
                    ? CurrencyConverter.convertToVnd((inv.percentagePayout / 100) * (result?.prizeMoney ?? 0), currency)
                    : 0;

                return {
                    registrationId: reg._id,
                    race: {
                        id: reg.raceRoundId?._id ?? null,
                        name: reg.raceRoundId?.roundName ?? 'Unknown',
                        date: reg.raceRoundId?.raceDate ?? null,
                        location: reg.raceRoundId?.location ?? null,
                    },
                    horse: { id: reg.horseId?._id ?? null, name: reg.horseId?.horseName ?? 'Unknown' },
                    jockey: inv
                        ? { id: inv.jockeyId?._id ?? null, name: inv.jockeyId?.fullName ?? 'Unknown', percentagePayout: inv.percentagePayout, payout: jockeyPayout }
                        : null,
                    finishPosition: result?.finishPosition ?? null,
                    prizeMoney,
                    jockeyPayout,
                    netOutcome: prizeMoney - jockeyPayout,
                    resultStatus: result?.resultStatus ?? null,
                    registrationStatus: reg.registrationStatus,
                    violations: regViolations.map(v => ({
                        type: v.violationTypeId?.violationName ?? 'Unknown',
                        category: v.violationTypeId?.category ?? null,
                        severity: v.severity,
                        penalty: v.actualPenalty,
                        stewardAction: v.stewardAction,
                        status: v.violationStatus,
                    })),
                };
            });

            return {
                code: 200,
                data: { items, pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit } },
                msg: 'Financial race results retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getFinancialEarningsSeries(ownerId, groupBy = 'day') {
        try {
            if (!ownerId) return { code: 400, msg: 'ownerId is required' };

            let dateFormat = '%Y-%m-%d';

            if (groupBy === 'week') {
                dateFormat = '%Y-%U';
            } else if (groupBy === 'month') {
                dateFormat = '%Y-%m';
            } else if (groupBy === 'year') {
                dateFormat = '%Y';
            }

            const mongoose = require('mongoose');
            const pipeline = [
                { $match: { horseOwnerId: new mongoose.Types.ObjectId(ownerId) } },
                { $lookup: { from: 'raceresults', localField: '_id', foreignField: 'registrationId', as: 'result' } },
                { $unwind: { path: '$result', preserveNullAndEmptyArrays: false } },
                { $match: { 'result.resultStatus': 'official', 'result.prizeMoney': { $gt: 0 } } },
                { $lookup: { from: 'racerounds', localField: 'raceRoundId', foreignField: '_id', as: 'raceRound' } },
                { $unwind: { path: '$raceRound', preserveNullAndEmptyArrays: false } },
                {
                    $group: {
                        _id: { $dateToString: { format: dateFormat, date: '$raceRound.raceDate' } },
                        grossPrize: { $sum: '$result.prizeMoney' }
                    }
                },
                { $sort: { _id: 1 } }
            ];

            const rawSeries = await Registration.aggregate(pipeline);

            let result = rawSeries.map(row => ({
                date: row._id,
                grossPrize: parseFloat(row.grossPrize.toFixed(2))
            }));

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
                    result.push({ date, grossPrize: 0 });
                    dbMap.set(date, true);
                }
            }
            result.sort((a, b) => a.date.localeCompare(b.date));

            return { code: 200, data: result, msg: 'Earnings series retrieved successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new FinancialService();
