const AdminRepository = require('../repositories/AdminRepository');
const UserRepository = require('../repositories/UserRepository');
const HorseOwnerRepository = require('../repositories/HorseOwnerRepository');
const JockeyRepository = require('../repositories/JockeyRepository');
const TournamentRepository = require('../repositories/TournamentRepository');
const Horse = require('../entities/Horse');
const Tournament = require('../entities/Tournament');
const RaceRound = require('../entities/RaceRound');
const Referee = require('../entities/Referee');
const Jockey = require('../entities/Jockey');
const Prediction = require('../entities/Prediction');
const PredictionMethod = require('../entities/PredictionMethod');
const RaceResult = require('../entities/RaceResult');
const HorseOwner = require('../entities/HorseOwner');
const User = require('../entities/User');
const Violation = require('../entities/Violation');
const Registration = require('../entities/Registration');
const Invitation = require('../entities/Invitation');

// Comprehensive, system-wide statistics snapshot for the admin statistics page.
// Every section degrades to 0 / [] rather than throwing when a collection is empty.
function countMap(aggResult) {
    const map = {};
    for (const row of aggResult) {
        map[row._id ?? 'unknown'] = row.count;
    }
    return map;
}

class StatisticsService {
    // Get admin dashboard statistics
    async getStatistics() {
        try {
            // Users
            const countUserActive = await UserRepository.count({ status: 'active' });

            // Horse owners
            const countHorseOwner = await HorseOwnerRepository.count();
            const horseOwnerPending = await HorseOwnerRepository.countByLicenseStatus('pending');
            const horseOwnerApproved = await HorseOwnerRepository.countByLicenseStatus('approved');

            // Jockeys
            const countJockey = await JockeyRepository.count();
            const jockeyPending = await JockeyRepository.countByLicenseStatus('pending');
            const jockeyApproved = await JockeyRepository.countByLicenseStatus('approved');

            // Tournaments
            const countTournament = await TournamentRepository.count();
            const tournamentScheduled = await TournamentRepository.countByStatus('scheduled');
            const tournamentOngoing = await TournamentRepository.countByStatus('ongoing');

            // Finance (wallet statistics — "thống kê" only, no real money movement)
            const [horseOwnerWalletAgg, jockeyWalletAgg, refereeWalletAgg, mainAdmin] = await Promise.all([
                HorseOwner.aggregate([{ $group: { _id: null, total: { $sum: '$wallet' } } }]),
                Jockey.aggregate([{ $group: { _id: null, total: { $sum: '$wallet' } } }]),
                Referee.aggregate([{ $group: { _id: null, total: { $sum: '$wallet' } } }]),
                AdminRepository.findMainAdmin(),
            ]);

            return {
                code: 200,
                data: {
                    users: { countActive: countUserActive },
                    horseOwners: {
                        count: countHorseOwner,
                        pending: horseOwnerPending,
                        approved: horseOwnerApproved,
                    },
                    jockeys: {
                        count: countJockey,
                        pending: jockeyPending,
                        approved: jockeyApproved,
                    },
                    tournaments: {
                        count: countTournament,
                        scheduled: tournamentScheduled,
                        ongoing: tournamentOngoing,
                    },
                    finance: {
                        totalHorseOwnerWallets: horseOwnerWalletAgg[0]?.total || 0,
                        totalJockeyWallets: jockeyWalletAgg[0]?.total || 0,
                        totalRefereeWallets: refereeWalletAgg[0]?.total || 0,
                        mainAdminWallet: mainAdmin?.wallet || 0,
                    },
                },
                msg: 'Statistics retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getSystemStatistics() {
        try {
            const Transaction = require('../entities/Transaction');
            const ViolationType = require('../entities/ViolationType');

            const [
                totalUsers, usersByRoleAgg, usersByStatusAgg,
                horseOwnerLicenseAgg, jockeyLicenseAgg, refereeLicenseAgg,
                totalHorses, horsesByStatusAgg, horsesByHealthAgg,
                totalTournaments, tournamentsByStatusAgg,
                totalRaceRounds, raceRoundsByStatusAgg,
                totalRegistrations, registrationsByStatusAgg,
                totalInvitations, invitationsByStatusAgg,
                totalViolations, violationsByStatusAgg, violationsBySeverityAgg, topViolationTypesAgg,
                totalPredictions, predictionsByStatusAgg, predictionsByMethodAgg, correctRewardAgg, predictionMethods,
                horseOwnerWalletAgg, jockeyWalletAgg, refereeWalletAgg, mainAdmin,
                transactionsByTypeAgg,
                paymentsByStatusAgg, paymentsByTypeAgg,
                topHorsesRaw, topJockeysRaw,
            ] = await Promise.all([
                User.countDocuments(),
                User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
                User.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
                HorseOwner.aggregate([{ $group: { _id: '$licenseStatus', count: { $sum: 1 } } }]),
                Jockey.aggregate([{ $group: { _id: '$licenseStatus', count: { $sum: 1 } } }]),
                Referee.aggregate([{ $group: { _id: '$licenseStatus', count: { $sum: 1 } } }]),
                Horse.countDocuments(),
                Horse.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
                Horse.aggregate([{ $group: { _id: '$healthStatus', count: { $sum: 1 } } }]),
                Tournament.countDocuments(),
                Tournament.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
                RaceRound.countDocuments(),
                RaceRound.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
                Registration.countDocuments(),
                Registration.aggregate([{ $group: { _id: '$registrationStatus', count: { $sum: 1 } } }]),
                Invitation.countDocuments(),
                Invitation.aggregate([{ $group: { _id: '$invitationStatus', count: { $sum: 1 } } }]),
                Violation.countDocuments(),
                Violation.aggregate([{ $group: { _id: '$violationStatus', count: { $sum: 1 } } }]),
                Violation.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
                Violation.aggregate([
                    { $group: { _id: '$violationTypeId', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 5 },
                ]),
                Prediction.countDocuments(),
                Prediction.aggregate([{ $group: { _id: '$predictionStatus', count: { $sum: 1 } } }]),
                Prediction.aggregate([{ $group: { _id: '$predictionMethodId', count: { $sum: 1 } } }]),
                Prediction.aggregate([
                    { $match: { predictionStatus: 'correct' } },
                    { $group: { _id: null, total: { $sum: '$rewardPoints' } } },
                ]),
                PredictionMethod.find().lean(),
                HorseOwner.aggregate([{ $group: { _id: null, total: { $sum: '$wallet' } } }]),
                Jockey.aggregate([{ $group: { _id: null, total: { $sum: '$wallet' } } }]),
                Referee.aggregate([{ $group: { _id: null, total: { $sum: '$wallet' } } }]),
                AdminRepository.findMainAdmin(),
                Transaction.aggregate([
                    { $match: { transactionType: { $ne: null } } },
                    { $group: { _id: '$transactionType', count: { $sum: 1 }, total: { $sum: '$amount' } } },
                ]),
                Transaction.aggregate([
                    { $match: { paymentType: { $ne: null } } },
                    { $group: { _id: '$paymentStatus', count: { $sum: 1 }, total: { $sum: '$amount' } } },
                ]),
                Transaction.aggregate([
                    { $match: { paymentType: { $ne: null } } },
                    { $group: { _id: '$paymentType', count: { $sum: 1 }, total: { $sum: '$amount' } } },
                ]),
                RaceResult.aggregate([
                    { $match: { finishPosition: 1, resultStatus: 'official' } },
                    { $lookup: { from: 'registrations', localField: 'registrationId', foreignField: '_id', as: 'reg' } },
                    { $unwind: '$reg' },
                    { $match: { 'reg.horseId': { $ne: null } } },
                    { $group: { _id: '$reg.horseId', wins: { $sum: 1 } } },
                    { $sort: { wins: -1 } },
                    { $limit: 5 },
                ]),
                Jockey.find().sort({ totalWins: -1 }).limit(5).lean(),
            ]);

            // Top violation types — resolve names for the top-5 IDs
            const topTypeIds = topViolationTypesAgg.map(r => r._id).filter(Boolean);
            const topTypes = topTypeIds.length
                ? await ViolationType.find({ _id: { $in: topTypeIds } }, 'violationName category').lean()
                : [];
            const typeNameMap = new Map(topTypes.map(t => [String(t._id), t]));
            const topViolationTypes = topViolationTypesAgg.map(r => ({
                violationTypeId: r._id,
                violationName: typeNameMap.get(String(r._id))?.violationName ?? 'Unknown',
                category: typeNameMap.get(String(r._id))?.category ?? null,
                count: r.count,
            }));

            // Predictions by method type — resolve methodType for each predictionMethodId
            const methodTypeMap = new Map(predictionMethods.map(m => [String(m._id), m.methodType]));
            const predictionsByMethodType = {};
            for (const row of predictionsByMethodAgg) {
                const methodType = methodTypeMap.get(String(row._id)) ?? 'unknown';
                predictionsByMethodType[methodType] = (predictionsByMethodType[methodType] ?? 0) + row.count;
            }

            // Top horses — resolve names + owner for the top-5 horseIds
            const topHorseIds = topHorsesRaw.map(r => r._id).filter(Boolean);
            const topHorseDocs = topHorseIds.length
                ? await Horse.find({ _id: { $in: topHorseIds } }, 'horseName img ownerId').lean()
                : [];
            const horseDocMap = new Map(topHorseDocs.map(h => [String(h._id), h]));
            const topHorses = topHorsesRaw.map(r => {
                const h = horseDocMap.get(String(r._id));
                return { horseId: r._id, horseName: h?.horseName ?? 'Unknown', img: h?.img ?? null, wins: r.wins };
            });

            // Top jockeys — resolve fullName from User
            const jockeyUserIds = topJockeysRaw.map(j => j._id);
            const jockeyUsers = jockeyUserIds.length
                ? await User.find({ _id: { $in: jockeyUserIds } }, 'fullName').lean()
                : [];
            const jockeyUserMap = new Map(jockeyUsers.map(u => [String(u._id), u.fullName]));
            const topJockeys = topJockeysRaw.map(j => ({
                jockeyId: j._id,
                fullName: jockeyUserMap.get(String(j._id)) ?? 'Unknown',
                totalWins: j.totalWins ?? 0,
            }));

            return {
                code: 200,
                data: {
                    users: {
                        total: totalUsers,
                        byRole: countMap(usersByRoleAgg),
                        byStatus: countMap(usersByStatusAgg),
                    },
                    licensing: {
                        horseOwner: countMap(horseOwnerLicenseAgg),
                        jockey: countMap(jockeyLicenseAgg),
                        referee: countMap(refereeLicenseAgg),
                    },
                    horses: {
                        total: totalHorses,
                        byStatus: countMap(horsesByStatusAgg),
                        byHealthStatus: countMap(horsesByHealthAgg),
                    },
                    tournaments: {
                        total: totalTournaments,
                        byStatus: countMap(tournamentsByStatusAgg),
                    },
                    raceRounds: {
                        total: totalRaceRounds,
                        byStatus: countMap(raceRoundsByStatusAgg),
                    },
                    registrations: {
                        total: totalRegistrations,
                        byStatus: countMap(registrationsByStatusAgg),
                    },
                    invitations: {
                        total: totalInvitations,
                        byStatus: countMap(invitationsByStatusAgg),
                    },
                    violations: {
                        total: totalViolations,
                        byStatus: countMap(violationsByStatusAgg),
                        bySeverity: countMap(violationsBySeverityAgg),
                        topViolationTypes,
                    },
                    predictions: {
                        total: totalPredictions,
                        byStatus: countMap(predictionsByStatusAgg),
                        byMethodType: predictionsByMethodType,
                        totalRewardPointsPaid: correctRewardAgg[0]?.total || 0,
                    },
                    finance: {
                        totalHorseOwnerWallets: horseOwnerWalletAgg[0]?.total || 0,
                        totalJockeyWallets: jockeyWalletAgg[0]?.total || 0,
                        totalRefereeWallets: refereeWalletAgg[0]?.total || 0,
                        mainAdminWallet: mainAdmin?.wallet || 0,
                        transactionsByType: transactionsByTypeAgg.reduce((acc, r) => {
                            acc[r._id] = { count: r.count, total: r.total };
                            return acc;
                        }, {}),
                    },
                    payments: {
                        byStatus: paymentsByStatusAgg.reduce((acc, r) => {
                            acc[r._id ?? 'unknown'] = { count: r.count, total: r.total };
                            return acc;
                        }, {}),
                        byType: paymentsByTypeAgg.reduce((acc, r) => {
                            acc[r._id ?? 'unknown'] = { count: r.count, total: r.total };
                            return acc;
                        }, {}),
                    },
                    topPerformers: {
                        horses: topHorses,
                        jockeys: topJockeys,
                    },
                },
                msg: 'System statistics retrieved successfully',
            };
        } catch (error) {
            console.error('Error fetching system statistics:', error);
            return { code: 500, msg: error.message };
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // DASHBOARD PANEL ENDPOINTS
    // Each method feeds exactly one panel group. They are designed to be called
    // in parallel from the frontend so no panel blocks another.
    // ─────────────────────────────────────────────────────────────────────────────

    // ── 1. KPI cards (Row 1) ─────────────────────────────────────────────────────
    async getDashboardKpi() {
        try {
            const Transaction = require('../entities/Transaction');

            const [
                countUserActive,
                countHorseOwner, horseOwnerPending, horseOwnerApproved,
                countJockey, jockeyPending, jockeyApproved,
                countTournament, tournamentScheduled, tournamentOngoing,
                mainAdmin,
                predictionPayoutAgg,
            ] = await Promise.all([
                require('../entities/User').countDocuments({ status: 'active' }),
                require('../repositories/HorseOwnerRepository').count(),
                require('../repositories/HorseOwnerRepository').countByLicenseStatus('pending'),
                require('../repositories/HorseOwnerRepository').countByLicenseStatus('approved'),
                require('../repositories/JockeyRepository').count(),
                require('../repositories/JockeyRepository').countByLicenseStatus('pending'),
                require('../repositories/JockeyRepository').countByLicenseStatus('approved'),
                require('../repositories/TournamentRepository').count(),
                require('../repositories/TournamentRepository').countByStatus('scheduled'),
                require('../repositories/TournamentRepository').countByStatus('ongoing'),
                AdminRepository.findMainAdmin(),
                Transaction.aggregate([
                    { $match: { transactionType: 'reward', referenceType: 'prediction', status: 'completed' } },
                    { $group: { _id: null, totalPaidOut: { $sum: '$amount' }, totalWinnersPaid: { $sum: 1 } } },
                ]),
            ]);

            return {
                code: 200,
                data: {
                    users: { countActive: countUserActive },
                    horseOwners: { count: countHorseOwner, pending: horseOwnerPending, approved: horseOwnerApproved },
                    jockeys: { count: countJockey, pending: jockeyPending, approved: jockeyApproved },
                    tournaments: { count: countTournament, scheduled: tournamentScheduled, ongoing: tournamentOngoing },
                    finance: { mainAdminWallet: mainAdmin?.wallet || 0 },
                    predictionPayouts: {
                        totalPaidOut: predictionPayoutAgg[0]?.totalPaidOut || 0,
                        totalWinnersPaid: predictionPayoutAgg[0]?.totalWinnersPaid || 0,
                    },
                },
                msg: 'Dashboard KPI retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // ── 2. House earnings time-series (Row 2 chart) ───────────────────────────────
    // houseEarning is read directly from the same transactions that fund
    // mainAdminWallet (PayoutService.distributeRacePayouts/distributeTournamentPayouts
    // call AdminRepository.incrementMainAdminWallet + log a matching deposit/payment
    // Transaction). Deriving it from reward payouts with a flat takeout rate would
    // drift from the real wallet balance (tournament_champion uses 22%, not 17%,
    // and pools with no winning prediction still credit the house but log no reward
    // transaction at all).

    async getDashboardHouseEarnings(groupBy = 'day') {
        try {
            const Transaction = require('../entities/Transaction');
            const mainAdmin = await AdminRepository.findMainAdmin();
            let dateFormat = '%Y-%m-%d';
            if (groupBy === 'year') dateFormat = '%Y';
            else if (groupBy === 'month') dateFormat = '%Y-%m';
            else if (groupBy === 'week') dateFormat = '%Y-%U';

            const [houseTakeSeries, payoutSeries] = await Promise.all([
                Transaction.aggregate([
                    { $match: { userId: mainAdmin?._id, transactionType: 'deposit', referenceType: 'payment', status: 'completed' } },
                    {
                        $group: {
                            _id: { $dateToString: { format: dateFormat, date: '$date' } },
                            houseEarning: { $sum: '$amount' },
                        },
                    },
                ]),
                Transaction.aggregate([
                    { $match: { transactionType: 'reward', referenceType: 'prediction', status: 'completed', amount: { $gt: 0 } } },
                    {
                        $group: {
                            _id: { $dateToString: { format: dateFormat, date: '$date' } },
                            payoutToWinners: { $sum: '$amount' },
                        },
                    },
                ]),
            ]);

            const houseTakeMap = new Map(houseTakeSeries.map(r => [r._id, r.houseEarning]));
            const payoutMap = new Map(payoutSeries.map(r => [r._id, r.payoutToWinners]));
            const allDates = new Set([...houseTakeMap.keys(), ...payoutMap.keys()]);

            const result = [...allDates].map(date => {
                const H = parseFloat((houseTakeMap.get(date) || 0).toFixed(2));
                const N = parseFloat((payoutMap.get(date) || 0).toFixed(2));
                return { date, houseEarning: H, payoutToWinners: N, grossPool: parseFloat((H + N).toFixed(2)) };
            });

            // Ensure we always have at least a baseline of recent periods (e.g. last 7 days)
            // to draw a proper line chart, even if there is no data for some dates.
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
                    result.push({ date, houseEarning: 0, payoutToWinners: 0, grossPool: 0 });
                    dbMap.set(date, true);
                }
            }
            result.sort((a, b) => a.date.localeCompare(b.date));

            const totalPayoutToWinners = parseFloat(result.reduce((s, r) => s + r.payoutToWinners, 0).toFixed(2));
            const totalHouseEarning = parseFloat(result.reduce((s, r) => s + r.houseEarning, 0).toFixed(2));
            const totalGrossPool = parseFloat((totalHouseEarning + totalPayoutToWinners).toFixed(2));

            return {
                code: 200,
                data: { totalHouseEarning, totalPayoutToWinners, totalGrossPool, series: result },
                msg: 'House earnings retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // ── 3. Top performers (Row 3: left 3 cards) ───────────────────────────────────
    async getDashboardTopPerformers() {
        try {
            const Transaction = require('../entities/Transaction');

            // Top earning horses: race_prize transactions → RaceResult → Registration.horseId
            const topHorsesTx = await Transaction.aggregate([
                { $match: { paymentType: 'race_prize', paymentStatus: 'paid' } },
                // sourceType = RaceResult, sourceId = RaceResult._id
                { $lookup: { from: 'raceresults', localField: 'sourceId', foreignField: '_id', as: 'result' } },
                { $unwind: { path: '$result', preserveNullAndEmptyArrays: false } },
                { $lookup: { from: 'registrations', localField: 'result.registrationId', foreignField: '_id', as: 'reg' } },
                { $unwind: { path: '$reg', preserveNullAndEmptyArrays: false } },
                { $match: { 'reg.horseId': { $ne: null } } },
                { $group: { _id: '$reg.horseId', totalEarnings: { $sum: '$amount' }, wins: { $sum: 1 } } },
                { $sort: { totalEarnings: -1 } },
                { $limit: 5 },
            ]);

            const horseIds = topHorsesTx.map(r => r._id).filter(Boolean);//Safe guard for null case
            const horseDocs = horseIds.length ? await Horse.find({ _id: { $in: horseIds } }, 'horseName img').lean() : [];
            const horseMap = new Map(horseDocs.map(h => [String(h._id), h]));
            const topEarningHorses = topHorsesTx.map(r => ({
                horseId: r._id,
                horseName: horseMap.get(String(r._id))?.horseName ?? 'Unknown',
                img: horseMap.get(String(r._id))?.img ?? null,
                totalEarnings: r.totalEarnings,
                wins: r.wins,
            }));

            // Top earning jockeys: jockey_payout transactions grouped by payeeId
            const topJockeysTx = await Transaction.aggregate([
                { $match: { paymentType: 'jockey_payout', payeeRole: 'jockey', paymentStatus: 'paid' } },
                { $group: { _id: '$payeeId', totalEarnings: { $sum: '$amount' } } },
                { $sort: { totalEarnings: -1 } },
                { $limit: 5 },
            ]);

            const jockeyIds = topJockeysTx.map(r => r._id).filter(Boolean);
            const [jockeyUserDocs, jockeyProfileDocs] = await Promise.all([
                jockeyIds.length ? User.find({ _id: { $in: jockeyIds } }, 'fullName').lean() : [],
                jockeyIds.length ? Jockey.find({ _id: { $in: jockeyIds } }, 'totalWins matchesRaced').lean() : [],
            ]);
            const jockeyUserMap = new Map(jockeyUserDocs.map(u => [String(u._id), u.fullName]));
            const jockeyProfileMap = new Map(jockeyProfileDocs.map(j => [String(j._id), j]));
            const topEarningJockeys = topJockeysTx.map(r => {
                const profile = jockeyProfileMap.get(String(r._id));
                const wins = profile?.totalWins ?? 0;
                const races = profile?.matchesRaced ?? 0;
                return {
                    jockeyId: r._id,
                    fullName: jockeyUserMap.get(String(r._id)) ?? 'Unknown',
                    totalEarnings: r.totalEarnings,
                    totalWins: wins,
                    matchesRaced: races,
                    winRate: races > 0 ? parseFloat((wins / races * 100).toFixed(1)) : null,
                };
            });

            // Win rate leaders: jockeys sorted by winRate
            const jockeyProfiles = await Jockey.find({ matchesRaced: { $gt: 0 } }, 'totalWins matchesRaced').lean();
            jockeyProfiles.sort((a, b) => (b.totalWins / b.matchesRaced) - (a.totalWins / a.matchesRaced));
            const topFiveIds = jockeyProfiles.slice(0, 5).map(j => j._id);
            const winLeaderUsers = topFiveIds.length ? await User.find({ _id: { $in: topFiveIds } }, 'fullName').lean() : [];
            const winLeaderUserMap = new Map(winLeaderUsers.map(u => [String(u._id), u.fullName]));
            const winRateLeaders = jockeyProfiles.slice(0, 5).map(j => ({
                jockeyId: j._id,
                fullName: winLeaderUserMap.get(String(j._id)) ?? 'Unknown',
                totalWins: j.totalWins,
                matchesRaced: j.matchesRaced,
                winRate: parseFloat((j.totalWins / j.matchesRaced * 100).toFixed(1)),
            }));

            return {
                code: 200,
                data: { topEarningHorses, topEarningJockeys, winRateLeaders },
                msg: 'Top performers retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // ── 4. Prediction insights (Row 3: right 2 cards) ─────────────────────────────
    async getDashboardPredictions() {
        try {
            // Method breakdown (3 types: race_winner, race_rank, tournament_champion)
            const methodAgg = await Prediction.aggregate([
                { $group: { _id: '$predictionMethodId', count: { $sum: 1 } } },
            ]);
            const methodDocs = await PredictionMethod.find({}, 'methodType').lean();
            const methodTypeMap = new Map(methodDocs.map(m => [String(m._id), m.methodType]));
            const methodTotals = {};
            for (const row of methodAgg) {
                const type = methodTypeMap.get(String(row._id)) ?? 'unknown';
                methodTotals[type] = (methodTotals[type] ?? 0) + row.count;
            }
            const totalPredictions = Object.values(methodTotals).reduce((s, c) => s + c, 0);
            const predictionMethods = {};
            for (const [type, count] of Object.entries(methodTotals)) {
                predictionMethods[type] = {
                    count,
                    pct: totalPredictions > 0 ? Math.round(count / totalPredictions * 100) : 0,
                };
            }

            // Most predicted horses: group by predictedHorseId, cross-ref actual wins via RaceResult → Registration
            const pickAgg = await Prediction.aggregate([
                { $match: { predictedHorseId: { $ne: null } } },
                { $group: { _id: '$predictedHorseId', totalPicks: { $sum: 1 } } },
                { $sort: { totalPicks: -1 } },
                { $limit: 10 },
            ]);

            const predictedHorseIds = pickAgg.map(r => r._id);

            // Actual wins: RaceResult (finishPosition=1, official) → Registration.horseId
            const winResults = predictedHorseIds.length
                ? await RaceResult.aggregate([
                    { $match: { finishPosition: 1, resultStatus: 'official' } },
                    { $lookup: { from: 'registrations', localField: 'registrationId', foreignField: '_id', as: 'reg' } },
                    { $unwind: '$reg' },
                    { $match: { 'reg.horseId': { $in: predictedHorseIds } } },
                    { $group: { _id: '$reg.horseId', actualWins: { $sum: 1 } } },
                ])
                : [];
            const winsMap = new Map(winResults.map(r => [String(r._id), r.actualWins]));

            const horseDocs2 = predictedHorseIds.length
                ? await Horse.find({ _id: { $in: predictedHorseIds } }, 'horseName img').lean()
                : [];
            const horseMap2 = new Map(horseDocs2.map(h => [String(h._id), h]));

            // Compute median picks for 🔥 hot badge
            const pickCounts = pickAgg.map(r => r.totalPicks);
            const median = pickCounts.length > 0
                ? pickCounts[Math.floor(pickCounts.length / 2)]
                : 0;

            const mostPredictedHorses = pickAgg.map(r => {
                const actualWins = winsMap.get(String(r._id)) ?? 0;
                return {
                    horseId: r._id,
                    horseName: horseMap2.get(String(r._id))?.horseName ?? 'Unknown',
                    img: horseMap2.get(String(r._id))?.img ?? null,
                    totalPicks: r.totalPicks,
                    actualWins,
                    crowdAccuracy: r.totalPicks > 0 ? parseFloat((actualWins / r.totalPicks * 100).toFixed(1)) : 0,
                    isHot: r.totalPicks > median,
                };
            });

            return {
                code: 200,
                data: { predictionMethods, mostPredictedHorses },
                msg: 'Prediction statistics retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // ── 5. Spectator leaderboard (Row 4 table) ────────────────────────────────────
    async getDashboardSpectatorLeaderboard() {
        try {
            const leaderboardAgg = await Prediction.aggregate([
                {
                    $group: {
                        _id: '$spectatorId',
                        total: { $sum: 1 },
                        correct: { $sum: { $cond: [{ $eq: ['$predictionStatus', 'correct'] }, 1, 0] } },
                        incorrect: { $sum: { $cond: [{ $eq: ['$predictionStatus', 'incorrect'] }, 1, 0] } },
                    },
                },
                { $sort: { correct: -1 } },
                { $limit: 20 },
            ]);

            // Spectator._id === User._id (1:1 relation) — resolve fullName directly from User
            const spectatorIds = leaderboardAgg.map(r => r._id).filter(Boolean);
            const userDocs = spectatorIds.length
                ? await User.find({ _id: { $in: spectatorIds } }, 'fullName').lean()
                : [];
            const userMap = new Map(userDocs.map(u => [String(u._id), u.fullName]));

            const spectatorLeaderboard = leaderboardAgg.map((r, idx) => ({
                rank: idx + 1,
                spectatorId: r._id,
                fullName: userMap.get(String(r._id)) ?? 'Unknown',
                total: r.total,
                correct: r.correct,
                incorrect: r.incorrect,
                winRate: r.total > 0 ? parseFloat((r.correct / r.total * 100).toFixed(1)) : 0,
            }));

            return {
                code: 200,
                data: { spectatorLeaderboard },
                msg: 'Spectator leaderboard retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getImportantEvents() {
        try {
            const [
                pendingOwners,
                pendingJockeys,
                pendingReferees,
                racesReadyToStart,
                activeTournaments,
                pendingRegistrations,
            ] = await Promise.all([
                HorseOwner.find({ licenseStatus: 'pending' }, '_id').lean(),
                Jockey.find({ licenseStatus: 'pending' }, '_id').lean(),
                Referee.find({ licenseStatus: 'pending' }, '_id').lean(),
                RaceRound.find({ status: 'prepared' }, '_id roundName raceDate location').lean(),
                Tournament.find({ status: { $in: ['running', 'scheduled'] } }, '_id tournamentName startDate endDate status').lean(),
                Registration.find({ registrationStatus: 'pending' }, '_id raceRoundId horseOwnerId createdAt').lean(),
            ]);

            const pendingCertifications = [...pendingOwners, ...pendingJockeys, ...pendingReferees];

            return {
                code: 200,
                data: {
                    pendingCertifications,
                    racesReadyToStart,
                    activeTournaments,
                    pendingRegistrations,
                },
                msg: 'Important events retrieved successfully.',
            };
        } catch (error) {
            console.error('Error fetching important events:', error);
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new StatisticsService();
