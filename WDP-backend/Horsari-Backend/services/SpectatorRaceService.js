const SpectatorRepository = require('../repositories/SpectatorRepository');
const PredictionRepository = require('../repositories/PredictionRepository');
const RaceRound = require('../entities/RaceRound');
const Registration = require('../entities/Registration');
const RaceResult = require('../entities/RaceResult');
const Invitation = require('../entities/Invitation');
const Horse = require('../entities/Horse');
const Jockey = require('../entities/Jockey');
const PredictionMethod = require('../entities/PredictionMethod');

// Shared by getHomeFeed's 'running' and 'prepared' race lists — enriches a
// raw RaceRound doc with its registrations (lane number + horse), matching
// the shape the mobile home-feed carousel renders per card.
async function enrichRace(raceRaw) {
    const regs = await Registration.find({
        raceRoundId: raceRaw._id,
        registrationStatus: { $in: ['accepted', 'verified'] },
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

class RaceService {
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
    // by spectator's race schedule and jockey's "view all races" browser
    // (services/JockeyRaceService.js calls this method directly on this
    // singleton, so its name and signature must stay stable).
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
                { $match: { raceRoundId: { $in: raceRoundIds }, registrationStatus: { $in: ['accepted', 'verified'] } } },
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
    // Fallback: registrationId → main Invitation (scheduled/accepted, no jockey locked yet).
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
                registrationStatus: { $in: ['accepted', 'verified'] },
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
}

module.exports = new RaceService();
