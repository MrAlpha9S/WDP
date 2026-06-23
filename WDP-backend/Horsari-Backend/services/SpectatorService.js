const SpectatorRepository = require('../repositories/SpectatorRepository');
const UserRepository = require('../repositories/UserRepository');
const TransactionRepository = require('../repositories/TransactionRepository');
const PredictionRepository = require('../repositories/PredictionRepository');
const UserService = require('./UserService');
const RaceRound = require('../entities/RaceRound');
const Registration = require('../entities/Registration');
const RaceResult = require('../entities/RaceResult');
const Invitation = require('../entities/Invitation');
const Horse = require('../entities/Horse');
const Jockey = require('../entities/Jockey');
const PredictionMethod = require('../entities/PredictionMethod');

class SpectatorService {
    async createSpectator(spectatorId, data) {
        try {
            const { rewardPoints } = data || {};

            if (!spectatorId) {
                return { code: 400, msg: 'spectatorId is required' };
            }

            const user = await UserRepository.findById(spectatorId);
            if (!user) {
                return { code: 404, msg: 'User not found' };
            }

            const existing = await SpectatorRepository.findBySpectatorId(spectatorId);
            if (existing) {
                return { code: 409, msg: 'Spectator profile already exists' };
            }

            const spectatorProfile = await SpectatorRepository.create({
                _id: spectatorId,
                rewardPoints: rewardPoints || 0,
            });

            return { code: 201, data: spectatorProfile, msg: 'Spectator profile created successfully' };
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
            return { code: 200, data: spectator, msg: 'Spectator profile retrieved successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getAllSpectators(limit = 10, skip = 0) {
        try {
            const spectators = await SpectatorRepository.findAll(limit, skip);
            const count = await SpectatorRepository.count();
            return { code: 200, data: { spectators, count }, msg: 'Spectators retrieved successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getRewardPoints(spectatorId) {
        try {
            const spectator = await SpectatorRepository.findBySpectatorId(spectatorId);
            if (!spectator) {
                return { code: 404, msg: 'Spectator not found' };
            }
            return { code: 200, data: { rewardPoints: spectator.rewardPoints }, msg: 'Reward points retrieved successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async addRewardPoints(spectatorId, points) {
        try {
            if (!points || points <= 0) {
                return { code: 400, msg: 'Points must be greater than 0' };
            }
            const spectator = await SpectatorRepository.findBySpectatorId(spectatorId);
            if (!spectator) {
                return { code: 404, msg: 'Spectator not found' };
            }
            const updatedSpectator = await SpectatorRepository.addRewardPoints(spectator._id, points);
            return { code: 200, data: updatedSpectator, msg: `${points} reward points added successfully` };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async deductRewardPoints(spectatorId, points) {
        try {
            if (!points || points <= 0) {
                return { code: 400, msg: 'Points must be greater than 0' };
            }
            const spectator = await SpectatorRepository.findBySpectatorId(spectatorId);
            if (!spectator) {
                return { code: 404, msg: 'Spectator not found' };
            }
            if (spectator.rewardPoints < points) {
                return { code: 400, msg: 'Insufficient reward points' };
            }
            const updatedSpectator = await SpectatorRepository.addRewardPoints(spectator._id, -points);
            return { code: 200, data: updatedSpectator, msg: `${points} reward points deducted successfully` };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getTopSpectators(limit = 10) {
        try {
            const spectators = await SpectatorRepository.findAll(limit, 0);
            const sorted = spectators.sort((a, b) => b.rewardPoints - a.rewardPoints);
            return { code: 200, data: { spectators: sorted.slice(0, limit), count: sorted.length }, msg: 'Top spectators retrieved successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async updateSpectatorProfile(spectatorId, updateData) {
        try {
            const spectator = await SpectatorRepository.findBySpectatorId(spectatorId);
            if (!spectator) {
                return { code: 404, msg: 'Spectator not found' };
            }
            const updatedSpectator = await SpectatorRepository.updateById(spectator._id, updateData);
            return { code: 200, data: updatedSpectator, msg: 'Spectator profile updated successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // ─── Auth ────────────────────────────────────────────────────────────────

    async changePassword(userId, body) {
        return UserService.changePassword(userId, body);
    }

    // ─── Wallet ──────────────────────────────────────────────────────────────

    async getWalletInfo(userId) {
        try {
            const spectator = await SpectatorRepository.findBySpectatorId(userId);
            if (!spectator) return { code: 404, msg: 'Spectator not found' };

            const totalEarned = await TransactionRepository.sumAmountByUserId(userId, { transactionType: 'deposit' });

            return {
                code: 200,
                data: { rewardPoints: spectator.rewardPoints, totalEarned },
                msg: 'Wallet info retrieved successfully',
            };
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
                    items,
                    pagination: {
                        totalItems,
                        totalPages: Math.ceil(totalItems / limit),
                        currentPage: page,
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
                code: 200,
                data: { newBalance: updated.rewardPoints },
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

            if (spectator.rewardPoints < amount) {
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
                code: 200,
                data: { newBalance: updated.rewardPoints },
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

            const [liveRace, upcomingRaces, featuredHorses] = await Promise.all([
                RaceRound.findOne({ status: 'running' })
                    .populate('tournamentId', 'tournamentName')
                    .lean(),
                RaceRound.find({ status: 'scheduled' })
                    .sort({ raceDate: 1 })
                    .limit(5)
                    .populate('tournamentId', 'tournamentName')
                    .lean(),
                Horse.aggregate([
                    { $match: { status: 'active' } },
                    // Horse → Invitations (horse is specified on the Invitation, not Registration)
                    { $lookup: { from: 'invitations', localField: '_id', foreignField: 'horseId', as: 'invitations' } },
                    // Extract invitation IDs so we can find confirmed registrations
                    { $addFields: { invitationIds: '$invitations._id' } },
                    // Confirmed registrations where jockeyInRaceId points to one of these invitations
                    { $lookup: { from: 'registrations', localField: 'invitationIds', foreignField: 'jockeyInRaceId', as: 'confirmedRegs' } },
                    { $addFields: { confirmedRegIds: '$confirmedRegs._id' } },
                    // Race results for those registrations
                    { $lookup: { from: 'raceresults', localField: 'confirmedRegIds', foreignField: 'registrationId', as: 'results' } },
                    {
                        $addFields: {
                            totalRaces: { $size: '$results' },
                            wins: {
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
                                $cond: [{ $gt: ['$totalRaces', 0] }, { $divide: ['$wins', '$totalRaces'] }, 0],
                            },
                        },
                    },
                    { $sort: { winRate: -1 } },
                    { $limit: 4 },
                    { $project: { horseName: 1, breed: 1, img: 1, status: 1, totalRaces: 1, wins: 1, winRate: 1 } },
                ]),
            ]);

            return {
                code: 200,
                data: { liveRace, upcomingRaces, featuredHorses, rewardPoints: spectator.rewardPoints },
                msg: 'Home feed retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getRaceSchedule(userId, page = 1, limit = 10, status = null, sortBy = 'raceDate', order = 'asc') {
        try {
            const spectator = await SpectatorRepository.findBySpectatorId(userId);
            if (!spectator) return { code: 404, msg: 'Spectator not found' };

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

            const items = raceRounds.map(r => ({
                ...r,
                currentParticipants: countMap[r._id.toString()] || 0,
            }));

            return {
                code: 200,
                data: {
                    items,
                    pagination: {
                        totalItems,
                        totalPages: Math.ceil(totalItems / limit),
                        currentPage: page,
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
    // Horse lives on Invitation (not Registration), accessed via Registration.jockeyInRaceId.
    async _enrichRegistrationsWithInvitationData(registrations) {
        const invitationIds = registrations.filter(r => r.jockeyInRaceId).map(r => r.jockeyInRaceId);
        if (invitationIds.length === 0) {
            return registrations.map(r => ({ ...r, horse: null, jockey: null }));
        }

        const invitations = await Invitation.find({ _id: { $in: invitationIds } }).lean();
        const invitationMap = {};
        invitations.forEach(inv => { invitationMap[inv._id.toString()] = inv; });

        const horseIds = invitations.map(inv => inv.horseId).filter(Boolean);
        const jockeyIds = invitations.map(inv => inv.jockeyId).filter(Boolean);

        const [horses, jockeys] = await Promise.all([
            horseIds.length > 0 ? Horse.find({ _id: { $in: horseIds } }).lean() : Promise.resolve([]),
            jockeyIds.length > 0 ? Jockey.find({ _id: { $in: jockeyIds } }).populate('_id').lean() : Promise.resolve([]),
        ]);

        const horseMap = {};
        horses.forEach(h => { horseMap[h._id.toString()] = h; });
        const jockeyMap = {};
        jockeys.forEach(j => { jockeyMap[j._id.toString()] = j; });

        return registrations.map(reg => {
            let horse = null;
            let jockey = null;
            if (reg.jockeyInRaceId) {
                const inv = invitationMap[reg.jockeyInRaceId.toString()];
                if (inv) {
                    horse = inv.horseId ? horseMap[inv.horseId.toString()] || null : null;
                    jockey = inv.jockeyId ? jockeyMap[inv.jockeyId.toString()] || null : null;
                }
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

            const registrations = await Registration.find({
                raceRoundId,
                registrationStatus: { $in: ['approved', 'verified'] },
            }).lean();

            const registrationIds = registrations.map(r => r._id);

            const [enriched, predictions] = await Promise.all([
                this._enrichRegistrationsWithInvitationData(registrations),
                registrationIds.length > 0
                    ? PredictionRepository.findBySpectatorAndRegistrations(userId, registrationIds)
                    : Promise.resolve([]),
            ]);

            const predMap = {};
            predictions.forEach(p => { predMap[p.registrationId.toString()] = p; });

            const enrichedRegistrations = enriched.map(reg => ({
                ...reg,
                userPrediction: predMap[reg._id.toString()] || null,
            }));

            return {
                code: 200,
                data: { raceRound, registrations: enrichedRegistrations },
                msg: 'Live race detail retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async _buildRaceResultData(raceRoundId) {
        const raceRound = await RaceRound.findById(raceRoundId).populate('tournamentId').lean();
        if (!raceRound) return null;

        const registrations = await Registration.find({ raceRoundId }).lean();
        const registrationIds = registrations.map(r => r._id);

        const [raceResults, enrichedRegs] = await Promise.all([
            RaceResult.find({ registrationId: { $in: registrationIds } }).sort({ finishPosition: 1 }).lean(),
            this._enrichRegistrationsWithInvitationData(registrations),
        ]);

        const enrichedRegMap = {};
        enrichedRegs.forEach(r => { enrichedRegMap[r._id.toString()] = r; });

        const enrichedResults = raceResults.map(result => {
            const reg = enrichedRegMap[result.registrationId.toString()] || null;
            return { ...result, registration: reg, horse: reg?.horse || null, jockey: reg?.jockey || null };
        });

        return { raceRound, results: enrichedResults };
    }

    async getRaceResult(userId, raceRoundId) {
        try {
            const spectator = await SpectatorRepository.findBySpectatorId(userId);
            if (!spectator) return { code: 404, msg: 'Spectator not found' };

            const data = await this._buildRaceResultData(raceRoundId);
            if (!data) return { code: 404, msg: 'Race round not found' };

            return { code: 200, data, msg: 'Race result retrieved successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getRaceLeaderboard(userId, raceRoundId) {
        try {
            const spectator = await SpectatorRepository.findBySpectatorId(userId);
            if (!spectator) return { code: 404, msg: 'Spectator not found' };

            const data = await this._buildRaceResultData(raceRoundId);
            if (!data) return { code: 404, msg: 'Race round not found' };

            return { code: 200, data, msg: 'Race leaderboard retrieved successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // ─── Predictions ──────────────────────────────────────────────────────────

    async getAvailablePredictionMethods(userId, raceRoundId) {
        try {
            const spectator = await SpectatorRepository.findBySpectatorId(userId);
            if (!spectator) return { code: 404, msg: 'Spectator not found' };

            const raceRound = await RaceRound.findById(raceRoundId).lean();
            if (!raceRound) return { code: 404, msg: 'Race round not found' };

            const [methods, registrationDocs] = await Promise.all([
                PredictionMethod.find({ isActive: true }).lean(),
                Registration.find({ raceRoundId }).select('_id').lean(),
            ]);

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

            return {
                code: 200,
                data: enrichedMethods,
                msg: 'Prediction methods retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async createPrediction(userId, body) {
        try {
            const { registrationId, predictionMethodId, predictedRank } = body || {};

            if (!registrationId || !predictionMethodId) {
                return { code: 400, msg: 'registrationId and predictionMethodId are required' };
            }

            const spectator = await SpectatorRepository.findBySpectatorId(userId);
            if (!spectator) return { code: 404, msg: 'Spectator not found' };

            const [registration, method] = await Promise.all([
                Registration.findById(registrationId).lean(),
                PredictionMethod.findById(predictionMethodId).lean(),
            ]);

            if (!registration) return { code: 404, msg: 'Registration not found' };
            if (!method) return { code: 404, msg: 'Prediction method not found' };
            if (!method.isActive) return { code: 400, msg: 'Prediction method is not active' };

            const existing = await PredictionRepository.findOne({
                spectatorId: userId,
                registrationId,
                predictionMethodId,
            });
            if (existing) return { code: 400, msg: 'You have already predicted for this registration with this method' };

            const prediction = await PredictionRepository.create({
                spectatorId: userId,
                registrationId,
                predictionMethodId,
                predictedRank,
                predictionStatus: 'pending',
                rewardPoints: 0,
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

            const filter = { ...(predictionStatus && { predictionStatus }) };

            const VALID_SORT = new Set(['created_at', 'updatedAt', 'predictionStatus', 'rewardPoints']);
            const safeSort = VALID_SORT.has(sortBy) ? sortBy : 'created_at';
            const sortObj = { [safeSort]: order === 'asc' ? 1 : -1 };
            const skip = (page - 1) * limit;

            const [predictions, totalItems] = await Promise.all([
                PredictionRepository.findBySpectatorId(userId, filter, limit, skip, sortObj),
                PredictionRepository.countBySpectatorId(userId, filter),
            ]);

            // Populate each prediction
            const enriched = await Promise.all(
                predictions.map(async pred => {
                    const [method, registration] = await Promise.all([
                        PredictionMethod.findById(pred.predictionMethodId).lean(),
                        Registration.findById(pred.registrationId).lean(),
                    ]);

                    // Horse lives on Invitation, not Registration
                    let horse = null;
                    if (registration?.jockeyInRaceId) {
                        const inv = await Invitation.findById(registration.jockeyInRaceId).lean();
                        if (inv?.horseId) horse = await Horse.findById(inv.horseId).lean();
                    }

                    let raceRound = null;
                    let tournament = null;
                    if (registration?.raceRoundId) {
                        raceRound = await RaceRound.findById(registration.raceRoundId).lean();
                        if (raceRound?.tournamentId) {
                            const Tournament = require('../entities/Tournament');
                            tournament = await Tournament.findById(raceRound.tournamentId).lean();
                        }
                    }

                    return { ...pred, predictionMethod: method, registration, horse, raceRound, tournament };
                })
            );

            return {
                code: 200,
                data: {
                    items: enriched,
                    pagination: {
                        totalItems,
                        totalPages: Math.ceil(totalItems / limit),
                        currentPage: page,
                        limit,
                    },
                },
                msg: 'Predictions retrieved successfully',
            };
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

            // Horse lives on Invitation, not Registration
            let horse = null;
            if (registration?.jockeyInRaceId) {
                const inv = await Invitation.findById(registration.jockeyInRaceId).lean();
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

            return {
                code: 200,
                data: { ...prediction, predictionMethod: method, registration, horse, raceRound, tournament, actualResult },
                msg: 'Prediction detail retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new SpectatorService();
