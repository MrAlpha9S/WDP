const SpectatorRepository = require('../repositories/SpectatorRepository');
const TransactionRepository = require('../repositories/TransactionRepository');
const PredictionRepository = require('../repositories/PredictionRepository');
const RaceRound = require('../entities/RaceRound');
const Registration = require('../entities/Registration');
const RaceResult = require('../entities/RaceResult');
const Invitation = require('../entities/Invitation');
const Horse = require('../entities/Horse');
const PredictionMethod = require('../entities/PredictionMethod');

class PredictionService {
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
            if (!['accepted', 'verified'].includes(registration.registrationStatus)) {
                return { code: 400, msg: 'Predictions can only be placed on accepted registrations' };
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
                        registrationStatus: { $in: ['accepted', 'verified'] },
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
                    // because predictions are allowed on 'accepted' registrations too — filtering
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

module.exports = new PredictionService();
