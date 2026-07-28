const SpectatorRepository = require('../repositories/SpectatorRepository');
const UserRepository = require('../repositories/UserRepository');
const TransactionRepository = require('../repositories/TransactionRepository');
const PredictionRepository = require('../repositories/PredictionRepository');
const RaceRound = require('../entities/RaceRound');
const Registration = require('../entities/Registration');
const RaceResult = require('../entities/RaceResult');
const Invitation = require('../entities/Invitation');
const Horse = require('../entities/Horse');
const Jockey = require('../entities/Jockey');
const PredictionMethod = require('../entities/PredictionMethod');
const ProfileUpdateUtil = require('../utils/ProfileUpdateUtil');

// Shared by getHomeFeed's 'running' and 'prepared' race lists — enriches a
// raw RaceRound doc with its registrations (lane number + horse), matching
// the shape the mobile home-feed carousel renders per card.
async function enrichRace(raceRaw) {
    const regs = await Registration.find({
        raceRoundId: raceRaw._id,
        registrationStatus: { $in: ['approved', 'verified'] },
    }).lean();

    const enrichedRegs = await Promise.all(regs.map(async reg => {
        let horse = null;
        if (reg.jockeyInRaceId) {
            const inv = await Invitation.findById(reg.jockeyInRaceId).lean();
            if (inv?.horseId) {
                const h = await Horse.findById(inv.horseId).lean();
                if (h) horse = { _id: h._id, horseName: h.horseName, img: h.img || null };
            }
        }
        return {
            _id: reg._id,
            laneNumber: reg.laneNumber || null,
            horse,
        };
    }));

    const t = raceRaw.tournamentId;
    return {
        _id: raceRaw._id,
        roundName: raceRaw.roundName,
        raceDate: raceRaw.raceDate,
        location: raceRaw.location || null,
        status: raceRaw.status,
        livestreamUrl: raceRaw.muxPlaybackId
            ? `https://stream.mux.com/${raceRaw.muxPlaybackId}.m3u8`
            : null,
        tournament: t ? { _id: t._id, tournamentName: t.tournamentName } : null,
        registrations: enrichedRegs,
    };
}

class SpectatorService {
    // Self-service profile update — spectator has no role-specific editable
    // fields (only `wallet`, which is system-managed via deposit/withdraw),
    // so this only ever touches the shared User fields.
    async updateProfile(spectatorId, updateData) {
        try {
            const { userFields, error } = ProfileUpdateUtil.buildUserFieldUpdates(updateData);
            if (error) return { code: 400, msg: error };
            if (Object.keys(userFields).length) {
                await UserRepository.updateById(spectatorId, userFields);
            }
            return this.getSpectatorProfile(spectatorId);
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getSpectatorProfile(spectatorId) {
        try {
            const spectator = await SpectatorRepository.findBySpectatorId(spectatorId);
            if (!spectator) {
                return { code: 404, msg: 'Spectator profile not found' };
            }

            const user = await UserRepository.findById(spectatorId);

            const Prediction = require('../entities/Prediction');
            const [totalPredictions, totalCorrectPredictions] = await Promise.all([
                Prediction.countDocuments({ spectatorId }),
                Prediction.countDocuments({ spectatorId, predictionStatus: 'correct' }),
            ]);
            const winRate = totalPredictions > 0
                ? parseFloat(((totalCorrectPredictions / totalPredictions) * 100).toFixed(2))
                : 0;

            return {
                code: 200,
                data: {
                    spectator: { _id: spectator._id, wallet: spectator.wallet },
                    user: user ? {
                        fullName: user.fullName,
                        username: user.username,
                        email: user.email,
                        dateOfBirth: user.dateOfBirth || null,
                        phoneNumber: user.phoneNumber || null,
                        image: user.image || null,
                        address: user.address || null,
                        status: user.status,
                    } : null,
                    stats: { totalPredictions, totalCorrectPredictions, winRate },
                },
                msg: 'Spectator profile retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // ─── Wallet ──────────────────────────────────────────────────────────────

    async getWalletInfo(userId) {
        try {
            const spectator = await SpectatorRepository.findBySpectatorId(userId);
            if (!spectator) return { code: 404, msg: 'Spectator not found' };

            const totalEarned = await TransactionRepository.sumAmountByUserId(userId, { transactionType: 'deposit' });

            return {
                code: 200,
                data: {
                    spectator: { _id: spectator._id, wallet: spectator.wallet },
                    stats: { totalEarned: totalEarned || 0 },
                },
                msg: 'Wallet info retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

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

    async getTransactionHistory(userId, page = 1, limit = 10, transactionType = null, status = null, sortBy = 'date', order = 'desc') {
        try {
            const spectator = await SpectatorRepository.findBySpectatorId(userId);
            if (!spectator) return { code: 404, msg: 'Spectator not found' };

            const filter = {
                ...(transactionType && { transactionType }),
                ...(status && { status }),
            };

            const VALID_SORT = new Set(['date', 'createdAt', 'amount']);
            const safeSort = VALID_SORT.has(sortBy) ? sortBy : 'date';
            const sortObj = { [safeSort]: order === 'asc' ? 1 : -1 };
            const skip = (page - 1) * limit;

            const [items, totalItems] = await Promise.all([
                TransactionRepository.findByUserId(userId, filter, limit, skip, sortObj),
                TransactionRepository.countByUserId(userId, filter),
            ]);

            return {
                code: 200,
                data: {
                    transactions: items,
                    meta: {
                        total: totalItems,
                        hasMore: page * limit < totalItems,
                        page,
                        limit,
                    },
                },
                msg: 'Transaction history retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async depositPoints(userId, body) {
        try {
            const { amount, description } = body || {};
            if (!amount || amount <= 0) return { code: 400, msg: 'Amount must be greater than 0' };

            const spectator = await SpectatorRepository.findBySpectatorId(userId);
            if (!spectator) return { code: 404, msg: 'Spectator not found' };

            await TransactionRepository.create({
                userId,
                transactionType: 'deposit',
                amount,
                description,
                status: 'completed',
            });

            const updated = await SpectatorRepository.addRewardPoints(userId, amount);
            return {
                code: 201,
                data: { newBalance: updated.wallet },
                msg: `${amount} points deposited successfully`,
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async withdrawPoints(userId, body) {
        try {
            const { amount, description } = body || {};
            if (!amount || amount <= 0) return { code: 400, msg: 'Amount must be greater than 0' };

            const spectator = await SpectatorRepository.findBySpectatorId(userId);
            if (!spectator) return { code: 404, msg: 'Spectator not found' };

            if (spectator.wallet < amount) {
                return { code: 400, msg: 'Insufficient balance' };
            }

            await TransactionRepository.create({
                userId,
                transactionType: 'withdrawal',
                amount,
                description,
                status: 'completed',
            });

            const updated = await SpectatorRepository.addRewardPoints(userId, -amount);
            return {
                code: 201,
                data: { newBalance: updated.wallet },
                msg: `${amount} points withdrawn successfully`,
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // ─── Race Viewing ─────────────────────────────────────────────────────────

    async getHomeFeed(userId) {
        try {
            const spectator = await SpectatorRepository.findBySpectatorId(userId);
            if (!spectator) return { code: 404, msg: 'Spectator not found' };

            const [liveRacesRaw, preparingRacesRaw, upcomingRacesRaw, featuredHorsesRaw] = await Promise.all([
                RaceRound.find({ status: 'running' })
                    .sort({ raceDate: 1 })
                    .limit(10)
                    .populate('tournamentId', 'tournamentName prizePool')
                    .lean(),
                RaceRound.find({ status: 'prepared' })
                    .sort({ raceDate: 1 })
                    .limit(10)
                    .populate('tournamentId', 'tournamentName prizePool')
                    .lean(),
                RaceRound.find({ status: 'scheduled' })
                    .sort({ raceDate: 1 })
                    .limit(5)
                    .populate('tournamentId', 'tournamentName prizePool startDate endDate')
                    .lean(),
                Horse.aggregate([
                    { $match: { status: 'active' } },
                    { $lookup: { from: 'invitations', localField: '_id', foreignField: 'horseId', as: 'invitations' } },
                    { $addFields: { invitationIds: '$invitations._id' } },
                    { $lookup: { from: 'registrations', localField: 'invitationIds', foreignField: 'jockeyInRaceId', as: 'confirmedRegs' } },
                    { $addFields: { confirmedRegIds: '$confirmedRegs._id' } },
                    { $lookup: { from: 'raceresults', localField: 'confirmedRegIds', foreignField: 'registrationId', as: 'results' } },
                    {
                        $addFields: {
                            totalRaces: { $size: '$results' },
                            totalWins: {
                                $size: {
                                    $filter: {
                                        input: '$results',
                                        cond: { $eq: ['$$this.finishPosition', 1] },
                                    },
                                },
                            },
                        },
                    },
                    {
                        $addFields: {
                            winRate: {
                                $cond: [{ $gt: ['$totalRaces', 0] }, { $divide: ['$totalWins', '$totalRaces'] }, 0],
                            },
                        },
                    },
                    { $sort: { winRate: -1 } },
                    { $limit: 4 },
                    { $project: { horseName: 1, img: 1, healthStatus: 1, totalRaces: 1, totalWins: 1, winRate: 1 } },
                ]),
            ]);

            // Enrich live + preparing races with registrations (lane number + horse)
            const [liveRaces, preparingRaces] = await Promise.all([
                Promise.all(liveRacesRaw.map(enrichRace)),
                Promise.all(preparingRacesRaw.map(enrichRace)),
            ]);

            const upcomingRaces = upcomingRacesRaw.map(r => {
                const t = r.tournamentId;
                return {
                    _id: r._id,
                    roundName: r.roundName,
                    raceDate: r.raceDate,
                    location: r.location || null,
                    address: r.address || null,
                    status: r.status,
                    tournament: t ? {
                        _id: t._id,
                        tournamentName: t.tournamentName,
                        prizePool: t.prizePool || null,
                    } : null,
                };
            });

            const featuredHorses = featuredHorsesRaw.map(h => ({
                _id: h._id,
                horseName: h.horseName,
                img: h.img || null,
                healthStatus: h.healthStatus || null,
                totalRaces: h.totalRaces,
                totalWins: h.totalWins,
                winRate: h.winRate,
            }));

            return {
                code: 200,
                data: {
                    liveRaces,
                    preparingRaces,
                    upcomingRaces,
                    featuredHorses,
                    spectator: { wallet: spectator.wallet },
                },
                msg: 'Home feed retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getRaceSchedule(userId, page = 1, limit = 10, status = null, sortBy = 'raceDate', order = 'asc') {
        const spectator = await SpectatorRepository.findBySpectatorId(userId);
        if (!spectator) return { code: 404, msg: 'Spectator not found' };
        return this._listAllRaceRounds(page, limit, status, sortBy, order);
    }

    // Role-agnostic race-round listing — no user-specific filtering. Shared
    // by spectator's race schedule and jockey's "view all races" browser.
    async _listAllRaceRounds(page = 1, limit = 10, status = null, sortBy = 'raceDate', order = 'asc') {
        try {
            const filter = { ...(status && { status }) };

            const VALID_SORT = new Set(['raceDate', 'createdAt', 'updatedAt']);
            const safeSort = VALID_SORT.has(sortBy) ? sortBy : 'raceDate';
            const sortObj = { [safeSort]: order === 'asc' ? 1 : -1 };
            const skip = (page - 1) * limit;

            const [raceRounds, totalItems] = await Promise.all([
                RaceRound.find(filter)
                    .sort(sortObj)
                    .skip(skip)
                    .limit(limit)
                    .populate('tournamentId', 'tournamentName')
                    .lean(),
                RaceRound.countDocuments(filter),
            ]);

            // Enrich with currentParticipants count
            const raceRoundIds = raceRounds.map(r => r._id);
            const participantCounts = await Registration.aggregate([
                { $match: { raceRoundId: { $in: raceRoundIds }, registrationStatus: { $in: ['approved', 'verified'] } } },
                { $group: { _id: '$raceRoundId', count: { $sum: 1 } } },
            ]);
            const countMap = {};
            participantCounts.forEach(p => { countMap[p._id.toString()] = p.count; });

            const raceRoundsMapped = raceRounds.map(r => {
                const t = r.tournamentId;
                return {
                    _id: r._id,
                    roundName: r.roundName,
                    raceDate: r.raceDate,
                    trackLength: r.trackLength || null,
                    location: r.location || null,
                    address: r.address || null,
                    raceGround: r.raceGround || null,
                    status: r.status,
                    maxParticipants: r.maxParticipants || null,
                    requireEntranceFees: r.requireEntranceFees || null,
                    baseFee: r.baseFee || null,
                    currentParticipants: countMap[r._id.toString()] || 0,
                    tournament: t ? {
                        _id: t._id,
                        tournamentName: t.tournamentName,
                        startDate: t.startDate || null,
                        endDate: t.endDate || null,
                        prizePool: t.prizePool || null,
                    } : null,
                };
            });

            return {
                code: 200,
                data: {
                    raceRounds: raceRoundsMapped,
                    meta: {
                        total: totalItems,
                        hasMore: page * limit < totalItems,
                        page,
                        limit,
                    },
                },
                msg: 'Race schedule retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Shared helper: batch-fetch invitations, horses, and jockeys for a set of registrations.
    // Primary: jockeyInRaceId → Invitation (referee-verified races).
    // Fallback: registrationId → main Invitation (scheduled/approved, no jockey locked yet).
    async _enrichRegistrationsWithInvitationData(registrations) {
        const allRegIds = registrations.map(r => r._id);
        const lockedInvIds = registrations.filter(r => r.jockeyInRaceId).map(r => r.jockeyInRaceId);

        // Fetch locked invitations (by id) + all main invitations for this set of registrations
        const [lockedInvitations, mainInvitations] = await Promise.all([
            lockedInvIds.length > 0
                ? Invitation.find({ _id: { $in: lockedInvIds } }).lean()
                : Promise.resolve([]),
            Invitation.find({ registrationId: { $in: allRegIds }, isBackup: false }).lean(),
        ]);

        // Build maps: invId → inv (locked), regId → inv (main fallback)
        const lockedInvMap = {};
        lockedInvitations.forEach(inv => { lockedInvMap[inv._id.toString()] = inv; });
        const mainInvByRegMap = {};
        mainInvitations.forEach(inv => { mainInvByRegMap[inv.registrationId.toString()] = inv; });

        // Collect all horse + jockey ids to batch-fetch
        const allInvs = [...lockedInvitations, ...mainInvitations];
        const horseIds = [...new Set(allInvs.map(inv => inv.horseId).filter(Boolean).map(String))];
        const jockeyIds = [...new Set(allInvs.map(inv => inv.jockeyId).filter(Boolean).map(String))];

        const [horses, jockeys] = await Promise.all([
            horseIds.length > 0 ? Horse.find({ _id: { $in: horseIds } }).lean() : Promise.resolve([]),
            jockeyIds.length > 0 ? Jockey.find({ _id: { $in: jockeyIds } }).lean() : Promise.resolve([]),
        ]);

        const horseMap = {};
        horses.forEach(h => { horseMap[h._id.toString()] = h; });
        const jockeyMap = {};
        jockeys.forEach(j => { jockeyMap[j._id.toString()] = j; });

        return registrations.map(reg => {
            let horse = null;
            let jockey = null;
            // Prefer the referee-locked invitation; fall back to the main invitation by registrationId
            const inv = reg.jockeyInRaceId
                ? lockedInvMap[reg.jockeyInRaceId.toString()]
                : mainInvByRegMap[reg._id.toString()];
            if (inv) {
                horse = inv.horseId ? horseMap[inv.horseId.toString()] || null : null;
                jockey = inv.jockeyId ? jockeyMap[inv.jockeyId.toString()] || null : null;
            }
            return { ...reg, horse, jockey };
        });
    }

    async getLiveRaceDetail(userId, raceRoundId) {
        try {
            const spectator = await SpectatorRepository.findBySpectatorId(userId);
            if (!spectator) return { code: 404, msg: 'Spectator not found' };

            const raceRound = await RaceRound.findById(raceRoundId).populate('tournamentId').lean();
            if (!raceRound) return { code: 404, msg: 'Race round not found' };

            raceRound.livestreamUrl = raceRound.muxPlaybackId
                ? `https://stream.mux.com/${raceRound.muxPlaybackId}.m3u8`
                : null;

            const registrations = await Registration.find({
                raceRoundId,
                registrationStatus: { $in: ['approved', 'verified'] },
            }).lean();

            const registrationIds = registrations.map(r => r._id);

            const [enriched, rawPredictions, raceResults] = await Promise.all([
                this._enrichRegistrationsWithInvitationData(registrations),
                registrationIds.length > 0
                    ? PredictionRepository.findBySpectatorAndRegistrations(userId, registrationIds)
                    : Promise.resolve([]),
                registrationIds.length > 0
                    ? RaceResult.find({ registrationId: { $in: registrationIds } }).lean()
                    : Promise.resolve([]),
            ]);

            // Build registrationId → enriched reg map for fast horse lookup
            const regMap = {};
            enriched.forEach(r => { regMap[r._id.toString()] = r; });

            // Enrich predictions: populate predictionMethod + build registration.horse
            const userPredictions = await Promise.all(rawPredictions.map(async pred => {
                const method = pred.predictionMethodId
                    ? await PredictionMethod.findById(pred.predictionMethodId).lean()
                    : null;
                const reg = pred.registrationId ? regMap[pred.registrationId.toString()] : null;
                return {
                    _id: pred._id,
                    predictedRank: pred.predictedRank ?? null,
                    predictionStatus: pred.predictionStatus,
                    rewardPoints: pred.rewardPoints,
                    created_at: pred.created_at,
                    predictionMethod: method ? {
                        _id: method._id,
                        methodName: method.methodName,
                        methodDescription: method.methodDescription,
                        methodType: method.methodType,
                    } : null,
                    registration: reg ? {
                        _id: reg._id,
                        laneNumber: reg.laneNumber ?? null,
                        horse: reg.horse ? { _id: reg.horse._id, horseName: reg.horse.horseName, img: reg.horse.img || null } : null,
                    } : null,
                    tournament: null,
                    predictedHorse: null,
                };
            }));

            // Keep per-registration embed for backwards compatibility
            const predMap = {};
            userPredictions.forEach(p => {
                if (p.registration?._id) predMap[p.registration._id.toString()] = p;
            });

            const resultMap = {};
            raceResults.forEach(r => { resultMap[r.registrationId.toString()] = r; });

            const enrichedRegistrations = enriched.map(reg => ({
                ...reg,
                userPrediction: predMap[reg._id.toString()] || null,
                raceResult: resultMap[reg._id.toString()] || null,
            }));

            return {
                code: 200,
                data: { raceRound, registrations: enrichedRegistrations, userPredictions },
                msg: 'Live race detail retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // ─── Predictions ──────────────────────────────────────────────────────────

    async getAvailablePredictionMethods(userId, raceRoundId = null) {
        try {
            const spectator = await SpectatorRepository.findBySpectatorId(userId);
            if (!spectator) return { code: 404, msg: 'Spectator not found' };

            const methods = await PredictionMethod.find({ isActive: true }).lean();

            // When called without raceRoundId, return all methods without usage info
            if (!raceRoundId) {
                return { code: 200, data: methods, msg: 'Prediction methods retrieved successfully' };
            }

            const raceRound = await RaceRound.findById(raceRoundId).lean();
            if (!raceRound) return { code: 404, msg: 'Race round not found' };

            const registrationDocs = await Registration.find({ raceRoundId }).select('_id').lean();
            const registrationIds = registrationDocs.map(r => r._id);
            const existingPredictions = registrationIds.length > 0
                ? await PredictionRepository.findBySpectatorAndRegistrations(userId, registrationIds)
                : [];

            const enrichedMethods = methods.map(method => {
                const methodPredictions = existingPredictions.filter(
                    p => p.predictionMethodId.toString() === method._id.toString()
                );
                return {
                    ...method,
                    userAlreadyPredicted: methodPredictions.length > 0,
                    existingPredictions: methodPredictions,
                };
            });

            return { code: 200, data: enrichedMethods, msg: 'Prediction methods retrieved successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async createPrediction(userId, body) {
        try {
            const { predictionMethodId, registrationId, predictedRank, tournamentId, predictedHorseId, rewardPoints } = body || {};

            if (!predictionMethodId) return { code: 400, msg: 'predictionMethodId is required' };
            if (!rewardPoints || rewardPoints <= 0) return { code: 400, msg: 'rewardPoints must be greater than 0' };

            const spectator = await SpectatorRepository.findBySpectatorId(userId);
            if (!spectator) return { code: 404, msg: 'Spectator not found' };

            if ((spectator.wallet || 0) < rewardPoints) {
                return { code: 400, msg: 'Insufficient wallet balance' };
            }

            const method = await PredictionMethod.findById(predictionMethodId).lean();
            if (!method) return { code: 404, msg: 'Prediction method not found' };
            if (!method.isActive) return { code: 400, msg: 'Prediction method is not active' };

            const Tournament = require('../entities/Tournament');

            if (method.methodType === 'tournament_champion') {
                if (!tournamentId || !predictedHorseId) {
                    return { code: 400, msg: 'tournamentId and predictedHorseId are required for tournament_champion' };
                }
                const tournament = await Tournament.findById(tournamentId).lean();
                if (!tournament) return { code: 404, msg: 'Tournament not found' };
                if (!tournament.startDate) {
                    return { code: 400, msg: 'Champion predictions are not available for standalone races' };
                }
                if (!['scheduled', 'ongoing'].includes(tournament.status)) {
                    return { code: 400, msg: 'Predictions are only allowed for scheduled or ongoing tournaments' };
                }
                const existing = await PredictionRepository.findOne({ spectatorId: userId, tournamentId, predictionMethodId });
                if (existing) return { code: 400, msg: 'You have already predicted the champion for this tournament' };

                await SpectatorRepository.addRewardPoints(spectator._id, -rewardPoints);
                await TransactionRepository.create({
                    userId,
                    transactionType: 'reward',
                    amount: -rewardPoints,
                    status: 'completed',
                    description: `Prediction stake — ${method.methodName}`,
                    referenceType: 'prediction',
                });

                const prediction = await PredictionRepository.create({
                    spectatorId: userId,
                    tournamentId,
                    predictedHorseId,
                    predictionMethodId,
                    predictionStatus: 'pending',
                    rewardPoints,
                });
                return { code: 201, data: prediction, msg: 'Champion prediction created successfully' };
            }

            // race_rank / race_winner — both need registrationId
            if (!registrationId) return { code: 400, msg: 'registrationId is required for race predictions' };

            if (method.methodType === 'race_rank' && (!predictedRank || predictedRank < 1)) {
                return { code: 400, msg: 'predictedRank (≥1) is required for race_rank predictions' };
            }

            const registration = await Registration.findById(registrationId).lean();
            if (!registration) return { code: 404, msg: 'Registration not found' };
            if (!['approved', 'verified'].includes(registration.registrationStatus)) {
                return { code: 400, msg: 'Predictions can only be placed on approved registrations' };
            }

            const mainInvitation = await Invitation.findOne({ registrationId, isBackup: false }).lean();
            if (!mainInvitation) {
                return { code: 400, msg: 'This horse does not have an assigned jockey yet — predictions are not available' };
            }

            const raceRound = await RaceRound.findById(registration.raceRoundId).lean();
            if (!raceRound) return { code: 404, msg: 'Race round not found' };
            if (!['scheduled', 'prepared'].includes(raceRound.status)) {
                return { code: 400, msg: 'Predictions are only allowed before the race starts' };
            }

            const existing = await PredictionRepository.findOne({ spectatorId: userId, registrationId, predictionMethodId });
            if (existing) return { code: 400, msg: 'You have already predicted for this registration with this method' };

            await SpectatorRepository.addRewardPoints(spectator._id, -rewardPoints);
            await TransactionRepository.create({
                userId,
                transactionType: 'reward',
                amount: -rewardPoints,
                status: 'completed',
                description: `Prediction stake — ${method.methodName}`,
                referenceType: 'prediction',
            });

            const prediction = await PredictionRepository.create({
                spectatorId: userId,
                registrationId,
                predictedHorseId: mainInvitation.horseId || null,
                predictionMethodId,
                predictedRank: method.methodType === 'race_winner' ? 1 : predictedRank,
                predictionStatus: 'pending',
                rewardPoints,
            });
            return { code: 201, data: prediction, msg: 'Prediction created successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getMyPredictions(userId, page = 1, limit = 10, predictionStatus = null, sortBy = 'created_at', order = 'desc') {
        try {
            const spectator = await SpectatorRepository.findBySpectatorId(userId);
            if (!spectator) return { code: 404, msg: 'Spectator not found' };

            const filter = { ...(predictionStatus && predictionStatus !== 'all' && { predictionStatus }) };

            const VALID_SORT = new Set(['created_at', 'updatedAt', 'predictionStatus', 'rewardPoints']);
            const safeSort = VALID_SORT.has(sortBy) ? sortBy : 'created_at';
            const sortObj = { [safeSort]: order === 'asc' ? 1 : -1 };
            const skip = (page - 1) * limit;

            const [predictions, totalItems] = await Promise.all([
                PredictionRepository.findBySpectatorId(userId, filter, limit, skip, sortObj),
                PredictionRepository.countBySpectatorId(userId, filter),
            ]);

            const Tournament = require('../entities/Tournament');

            // Populate each prediction and reshape to match mobile contract
            const enriched = await Promise.all(
                predictions.map(async pred => {
                    const method = await PredictionMethod.findById(pred.predictionMethodId).lean();

                    // ── tournament_champion branch ──────────────────────────────
                    if (method?.methodType === 'tournament_champion') {
                        let tournament = null;
                        if (pred.tournamentId) {
                            const t = await Tournament.findById(pred.tournamentId).lean();
                            if (t) tournament = { _id: t._id, tournamentName: t.tournamentName, status: t.status };
                        }
                        let predictedHorse = null;
                        if (pred.predictedHorseId) {
                            const h = await Horse.findById(pred.predictedHorseId).lean();
                            if (h) predictedHorse = { _id: h._id, horseName: h.horseName, img: h.img || null };
                        }
                        return {
                            _id: pred._id,
                            predictedRank: null,
                            predictionStatus: pred.predictionStatus,
                            rewardPoints: pred.rewardPoints,
                            created_at: pred.created_at,
                            predictionMethod: method ? {
                                _id: method._id,
                                methodName: method.methodName,
                                methodDescription: method.methodDescription,
                                methodType: method.methodType,
                            } : null,
                            registration: null,
                            tournament,
                            predictedHorse,
                        };
                    }

                    // ── race_rank / race_winner branch ──────────────────────────
                    const registration = await Registration.findById(pred.registrationId).lean();

                    let horse = null;
                    if (registration) {
                        const inv = registration.jockeyInRaceId
                            ? await Invitation.findById(registration.jockeyInRaceId).lean()
                            : await Invitation.findOne({ registrationId: registration._id, isBackup: false }).lean();
                        if (inv?.horseId) {
                            const h = await Horse.findById(inv.horseId).lean();
                            if (h) horse = { _id: h._id, horseName: h.horseName, img: h.img || null };
                        }
                    }

                    let raceRoundData = null;
                    if (registration?.raceRoundId) {
                        const rr = await RaceRound.findById(registration.raceRoundId).lean();
                        if (rr) {
                            let tournament = null;
                            if (rr.tournamentId) {
                                const t = await Tournament.findById(rr.tournamentId).lean();
                                if (t) tournament = { _id: t._id, tournamentName: t.tournamentName };
                            }
                            raceRoundData = {
                                _id: rr._id,
                                roundName: rr.roundName,
                                raceDate: rr.raceDate,
                                location: rr.location || null,
                                status: rr.status,
                                tournament,
                            };
                        }
                    }

                    const registrationData = registration ? {
                        _id: registration._id,
                        laneNumber: registration.laneNumber || null,
                        horse,
                        raceRound: raceRoundData,
                    } : null;

                    return {
                        _id: pred._id,
                        predictedRank: pred.predictedRank,
                        predictionStatus: pred.predictionStatus,
                        rewardPoints: pred.rewardPoints,
                        created_at: pred.created_at,
                        predictionMethod: method ? {
                            _id: method._id,
                            methodName: method.methodName,
                            methodDescription: method.methodDescription,
                            methodType: method.methodType,
                        } : null,
                        registration: registrationData,
                        tournament: null,
                        predictedHorse: null,
                    };
                })
            );

            return {
                code: 200,
                data: {
                    predictions: enriched,
                    meta: {
                        total: totalItems,
                        hasMore: page * limit < totalItems,
                        page,
                        limit,
                    },
                },
                msg: 'Predictions retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getTournamentsForPrediction(userId) {
        try {
            const spectator = await SpectatorRepository.findBySpectatorId(userId);
            if (!spectator) return { code: 404, msg: 'Spectator not found' };

            const Tournament = require('../entities/Tournament');
            const Horse = require('../entities/Horse');

            const tournaments = await Tournament.find({
                status: { $in: ['scheduled', 'ongoing'] },
                startDate: { $ne: null },
            }).lean();

            // For each tournament, gather all horses that have participated in its races
            const enriched = await Promise.all(tournaments.map(async t => {
                const raceRounds = await RaceRound.find({ tournamentId: t._id }).select('_id').lean();
                const raceRoundIds = raceRounds.map(r => r._id);

                let horses = [];
                if (raceRoundIds.length > 0) {
                    const regs = await Registration.find({
                        raceRoundId: { $in: raceRoundIds },
                        registrationStatus: { $in: ['approved', 'verified'] },
                    }).lean();

                    const horseIds = [...new Set(regs.map(r => r.horseId?.toString()).filter(Boolean))];
                    const horseDocs = horseIds.length > 0
                        ? await Horse.find({ _id: { $in: horseIds } }).select('_id horseName img').lean()
                        : [];
                    horses = horseDocs.map(h => ({ _id: h._id, horseName: h.horseName, img: h.img || null }));
                }

                // Check if this spectator already predicted champion for this tournament
                const existing = await PredictionRepository.findOne({
                    spectatorId: userId,
                    tournamentId: t._id,
                });

                return {
                    _id: t._id,
                    tournamentName: t.tournamentName,
                    status: t.status,
                    startDate: t.startDate,
                    endDate: t.endDate,
                    prizePool: t.prizePool,
                    horses,
                    alreadyPredicted: !!existing,
                };
            }));

            return { code: 200, data: enriched, msg: 'Tournaments retrieved successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getPredictionDetail(userId, predictionId) {
        try {
            const spectator = await SpectatorRepository.findBySpectatorId(userId);
            if (!spectator) return { code: 404, msg: 'Spectator not found' };

            const prediction = await PredictionRepository.findById(predictionId);
            if (!prediction) return { code: 404, msg: 'Prediction not found' };

            if (prediction.spectatorId.toString() !== String(userId)) {
                return { code: 403, msg: 'Access denied' };
            }

            const [method, registration] = await Promise.all([
                PredictionMethod.findById(prediction.predictionMethodId).lean(),
                Registration.findById(prediction.registrationId).lean(),
            ]);

            // Horse lives on Invitation — prefer referee-locked jockeyInRaceId, fall back to main invitation
            let horse = null;
            if (registration) {
                const inv = registration.jockeyInRaceId
                    ? await Invitation.findById(registration.jockeyInRaceId).lean()
                    : await Invitation.findOne({ registrationId: registration._id, isBackup: false }).lean();
                if (inv?.horseId) horse = await Horse.findById(inv.horseId).lean();
            }

            let raceRound = null;
            let tournament = null;
            let actualResult = null;

            if (registration?.raceRoundId) {
                raceRound = await RaceRound.findById(registration.raceRoundId).lean();
                if (raceRound?.tournamentId) {
                    const Tournament = require('../entities/Tournament');
                    tournament = await Tournament.findById(raceRound.tournamentId).lean();
                }
                if (raceRound?.status === 'completed') {
                    actualResult = await RaceResult.findOne({ registrationId: prediction.registrationId }).lean();
                }
            }

            // ── Payout info ──────────────────────────────────────────────────
            // Each method type has its own independent pool (race_winner pool ≠
            // race_rank pool ≠ tournament_champion pool), so we compute odds
            // only within the pool that matches this prediction's methodType.
            const PayoutService = require('./PayoutService');
            let payoutInfo = null;

            if (prediction.predictionStatus === 'pending' && method) {
                const S = prediction.rewardPoints || 0; // this spectator's stake

                if (method.methodType === 'tournament_champion' && prediction.tournamentId) {
                    // Pool = all pending stakes for this tournament + this method only
                    const Prediction = require('../entities/Prediction');
                    const champPreds = await Prediction.find({
                        tournamentId:       prediction.tournamentId,
                        predictionMethodId: prediction.predictionMethodId,
                        predictionStatus:   'pending',
                    }).lean();

                    // Bi per predicted horse
                    const stakeByHorse = {};
                    for (const p of champPreds) {
                        const hid = p.predictedHorseId?.toString();
                        if (hid) stakeByHorse[hid] = (stakeByHorse[hid] || 0) + (p.rewardPoints || 0);
                    }

                    const P  = PayoutService.grossPool(Object.values(stakeByHorse));
                    const T  = 0.22; // tournament_champion takeout
                    const N  = PayoutService.netPool(P, T);
                    const Bi = stakeByHorse[prediction.predictedHorseId?.toString()] || 0;

                    payoutInfo = {
                        methodType:            method.methodType,
                        takeoutRate:           T,
                        grossPool:             P,
                        netPool:               parseFloat(N.toFixed(2)),
                        stakeOnPredictedHorse: Bi,
                        totalBettors:          champPreds.length,
                        odds:                  parseFloat(PayoutService.oddsForHorse(N, Bi).toFixed(4)),
                        estimatedCollect:      Bi > 0 && S > 0
                            ? parseFloat(PayoutService.totalCollect(S, N, Bi).toFixed(2))
                            : 0,
                    };

                } else if (['race_winner', 'race_rank'].includes(method.methodType) && raceRound) {
                    // Build pool directly from ALL pending predictions for this race round
                    // and method type. We do NOT restrict to 'verified' registrations here
                    // because predictions are allowed on 'approved' registrations too — filtering
                    // to 'verified' would make the live pool appear empty until admin verifies.
                    const Prediction = require('../entities/Prediction');
                    const allRegsInRound = await Registration.find({ raceRoundId: raceRound._id })
                        .select('_id').lean();
                    const allRegIds = allRegsInRound.map(r => r._id);

                    const racePreds = await Prediction.find({
                        registrationId:     { $in: allRegIds },
                        predictionMethodId: prediction.predictionMethodId,
                        predictionStatus:   'pending',
                    }).lean();

                    // Bi = sum of stakes on each registration (independent pools per horse)
                    const stakeByReg = {};
                    for (const p of racePreds) {
                        const rid = p.registrationId.toString();
                        stakeByReg[rid] = (stakeByReg[rid] || 0) + (p.rewardPoints || 0);
                    }

                    const T  = PayoutService.getRaceTakeoutRate(raceRound, method.methodType);
                    const P  = PayoutService.grossPool(Object.values(stakeByReg));
                    const N  = PayoutService.netPool(P, T);
                    const Bi = stakeByReg[prediction.registrationId?.toString()] || 0;

                    payoutInfo = {
                        methodType:            method.methodType,
                        takeoutRate:           T,
                        grossPool:             P,
                        netPool:               parseFloat(N.toFixed(2)),
                        stakeOnPredictedHorse: Bi,
                        totalBettors:          racePreds.length,
                        odds:                  parseFloat(PayoutService.oddsForHorse(N, Bi).toFixed(4)),
                        estimatedCollect:      Bi > 0 && S > 0
                            ? parseFloat(PayoutService.totalCollect(S, N, Bi).toFixed(2))
                            : 0,
                    };
                }

            } else if (prediction.predictionStatus === 'correct') {
                // rewardPoints was overwritten with actual parimutuel collect at settle time
                payoutInfo = { methodType: method?.methodType ?? null, actualPayout: prediction.rewardPoints };

            } else if (prediction.predictionStatus === 'incorrect') {
                payoutInfo = { methodType: method?.methodType ?? null, actualPayout: 0 };

            } else if (prediction.predictionStatus === 'refunded') {
                // Stake returned to wallet; rewardPoints reset to 0 at settle time
                payoutInfo = { methodType: method?.methodType ?? null, actualPayout: 0, refunded: true };
            }

            return {
                code: 200,
                data: {
                    ...prediction,
                    predictionMethod: method,
                    registration,
                    horse,
                    raceRound,
                    tournament,
                    actualResult,
                    payoutInfo,
                },
                msg: 'Prediction detail retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new SpectatorService();
