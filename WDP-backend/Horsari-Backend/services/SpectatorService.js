const mongoose = require('mongoose');
const Spectator = require('../entities/Spectator');
const Prediction = require('../entities/Prediction');
const PredictionMethod = require('../entities/PredictionMethod');
const Transaction = require('../entities/Transaction');
const RaceRound = require('../entities/RaceRound');
const Registration = require('../entities/Registration');
const RaceResult = require('../entities/RaceResult');
const Tournament = require('../entities/Tournament');
const Horse = require('../entities/Horse');
const Jockey = require('../entities/Jockey');
const SpectatorRepository = require('../repositories/SpectatorRepository');
const UserRepository = require('../repositories/UserRepository');
const PasswordUtil = require('../utils/PasswordUtil');

class SpectatorService {
    // ─── EXISTING (kept for backward compat) ────────────────────────────────

    async createSpectator(spectatorId, data) {
        try {
            const { rewardPoints } = data || {};
            if (!spectatorId) return { code: 400, msg: 'spectatorId is required' };

            const user = await UserRepository.findById(spectatorId);
            if (!user) return { code: 404, msg: 'User not found' };

            const existing = await SpectatorRepository.findBySpectatorId(spectatorId);
            if (existing) return { code: 409, msg: 'Spectator profile already exists' };

            const spectatorProfile = await SpectatorRepository.create({
                _id: spectatorId,
                rewardPoints: rewardPoints || 0,
            });
            return { code: 201, data: spectatorProfile, msg: 'Spectator profile created successfully' };
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
            if (!spectator) return { code: 404, msg: 'Spectator not found' };
            return { code: 200, data: { rewardPoints: spectator.rewardPoints }, msg: 'Reward points retrieved successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async addRewardPoints(spectatorId, points) {
        try {
            if (!points || points <= 0) return { code: 400, msg: 'Points must be greater than 0' };
            const spectator = await SpectatorRepository.findBySpectatorId(spectatorId);
            if (!spectator) return { code: 404, msg: 'Spectator not found' };
            const updated = await SpectatorRepository.addRewardPoints(spectator._id, points);
            return { code: 200, data: updated, msg: `${points} reward points added successfully` };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async deductRewardPoints(spectatorId, points) {
        try {
            if (!points || points <= 0) return { code: 400, msg: 'Points must be greater than 0' };
            const spectator = await SpectatorRepository.findBySpectatorId(spectatorId);
            if (!spectator) return { code: 404, msg: 'Spectator not found' };
            if (spectator.rewardPoints < points) return { code: 400, msg: 'Insufficient reward points' };
            const updated = await SpectatorRepository.addRewardPoints(spectator._id, -points);
            return { code: 200, data: updated, msg: `${points} reward points deducted successfully` };
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

    // ─── UPDATED ─────────────────────────────────────────────────────────────

    async getSpectatorProfile(spectatorId) {
        try {
            const spectator = await SpectatorRepository.findBySpectatorId(spectatorId);
            if (!spectator) return { code: 404, msg: 'Spectator profile not found' };

            const user = spectator._id; // populated User doc

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
                    spectator: {
                        _id: user._id,
                        rewardPoints: spectator.rewardPoints,
                    },
                    user: {
                        fullName: user.fullName,
                        username: user.username,
                        email: user.email,
                        dateOfBirth: user.dateOfBirth,
                        phoneNumber: user.phoneNumber,
                        image: user.image,
                        address: user.address,
                        status: user.status,
                    },
                    stats: { totalPredictions, totalCorrectPredictions, winRate },
                },
                msg: 'Profile retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async updateSpectatorProfile(spectatorId, updateData) {
        try {
            const spectator = await SpectatorRepository.findBySpectatorId(spectatorId);
            if (!spectator) return { code: 404, msg: 'Spectator not found' };

            const { fullName, username, email, dateOfBirth, phoneNumber, image, address } = updateData;
            const userUpdate = {};
            if (fullName !== undefined) userUpdate.fullName = fullName;
            if (username !== undefined) userUpdate.username = username;
            if (email !== undefined) userUpdate.email = email;
            if (dateOfBirth !== undefined) userUpdate.dateOfBirth = dateOfBirth;
            if (phoneNumber !== undefined) userUpdate.phoneNumber = phoneNumber;
            if (image !== undefined) userUpdate.image = image;
            if (address !== undefined) userUpdate.address = address;

            const updatedUser = Object.keys(userUpdate).length > 0
                ? await UserRepository.updateById(spectatorId, userUpdate)
                : await UserRepository.findById(spectatorId);

            return {
                code: 200,
                data: {
                    user: {
                        fullName: updatedUser.fullName,
                        username: updatedUser.username,
                        email: updatedUser.email,
                        dateOfBirth: updatedUser.dateOfBirth,
                        phoneNumber: updatedUser.phoneNumber,
                        image: updatedUser.image,
                        address: updatedUser.address,
                        updatedAt: updatedUser.updatedAt,
                    },
                },
                msg: 'Profile updated successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // ─── NEW ──────────────────────────────────────────────────────────────────

    async changePassword(spectatorId, data) {
        try {
            const { oldPassword, newPassword, confirmPassword } = data || {};
            if (!oldPassword || !newPassword || !confirmPassword) {
                return { code: 400, msg: 'oldPassword, newPassword, and confirmPassword are required' };
            }
            if (newPassword !== confirmPassword) {
                return { code: 400, msg: 'newPassword and confirmPassword do not match' };
            }

            const user = await UserRepository.findById(spectatorId);
            if (!user) return { code: 404, msg: 'User not found' };
            if (!user.passwordHash) {
                return { code: 400, msg: 'Cannot change password for accounts without a password (e.g. Google accounts)' };
            }

            const isValid = await PasswordUtil.comparePassword(oldPassword, user.passwordHash);
            if (!isValid) return { code: 400, msg: 'Old password is incorrect' };

            if (!PasswordUtil.validatePasswordStrength(newPassword)) {
                return { code: 400, msg: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' };
            }

            const passwordHash = await PasswordUtil.hashPassword(newPassword);
            await UserRepository.updateById(spectatorId, { passwordHash });
            return { code: 200, msg: 'Password changed successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getWalletInfo(spectatorId) {
        try {
            const spectator = await Spectator.findById(spectatorId).lean();
            if (!spectator) return { code: 404, msg: 'Spectator not found' };

            const rewardTransactions = await Transaction.find({
                userId: spectatorId,
                transactionType: 'reward',
                status: 'completed',
            }).lean();
            const totalEarned = rewardTransactions.reduce((sum, t) => sum + t.amount, 0);

            return {
                code: 200,
                data: {
                    spectator: {
                        _id: spectator._id,
                        rewardPoints: spectator.rewardPoints,
                    },
                    stats: { totalEarned },
                },
                msg: 'Wallet info retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getTransactionHistory(spectatorId, query) {
        try {
            const { page = 1, limit = 10, transactionType, status } = query;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;

            const filter = { userId: spectatorId };
            const validTypes = ['reward', 'deposit', 'withdrawal', 'refund'];
            const validStatuses = ['pending', 'completed', 'failed'];
            if (transactionType) {
                if (!validTypes.includes(transactionType)) return { code: 400, msg: 'Invalid transactionType' };
                filter.transactionType = transactionType;
            }
            if (status) {
                if (!validStatuses.includes(status)) return { code: 400, msg: 'Invalid status' };
                filter.status = status;
            }

            const [transactions, total] = await Promise.all([
                Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
                Transaction.countDocuments(filter),
            ]);
            const hasMore = skip + transactions.length < total;

            return {
                code: 200,
                data: {
                    meta: { total, page: pageNum, limit: limitNum, hasMore },
                    transactions: transactions.map(t => ({
                        _id: t._id,
                        transactionType: t.transactionType,
                        amount: t.amount,
                        date: t.date,
                        status: t.status,
                        description: t.description,
                        referenceId: t.referenceId,
                        referenceType: t.referenceType,
                        createdAt: t.createdAt,
                    })),
                },
                msg: 'Transaction history retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async depositPoints(spectatorId, data) {
        try {
            const { amount, description } = data || {};
            if (!amount || amount <= 0) return { code: 400, msg: 'Amount must be greater than 0' };

            const spectator = await Spectator.findById(spectatorId).lean();
            if (!spectator) return { code: 404, msg: 'Spectator not found' };

            const transaction = await Transaction.create({
                userId: spectatorId,
                transactionType: 'deposit',
                amount,
                description: description || null,
                status: 'completed',
                date: new Date(),
            });

            await Spectator.findByIdAndUpdate(spectatorId, { $inc: { rewardPoints: amount } });

            return {
                code: 201,
                data: {
                    transaction: {
                        _id: transaction._id,
                        userId: transaction.userId,
                        transactionType: transaction.transactionType,
                        amount: transaction.amount,
                        date: transaction.date,
                        status: transaction.status,
                        description: transaction.description,
                        createdAt: transaction.createdAt,
                    },
                },
                msg: 'Deposit successful',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async withdrawPoints(spectatorId, data) {
        try {
            const { amount, description } = data || {};
            if (!amount || amount <= 0) return { code: 400, msg: 'Amount must be greater than 0' };

            const spectator = await Spectator.findById(spectatorId).lean();
            if (!spectator) return { code: 404, msg: 'Spectator not found' };
            if (spectator.rewardPoints < amount) return { code: 400, msg: 'Insufficient reward points' };

            const transaction = await Transaction.create({
                userId: spectatorId,
                transactionType: 'withdrawal',
                amount,
                description: description || null,
                status: 'completed',
                date: new Date(),
            });

            await Spectator.findByIdAndUpdate(spectatorId, { $inc: { rewardPoints: -amount } });

            return {
                code: 201,
                data: {
                    transaction: {
                        _id: transaction._id,
                        userId: transaction.userId,
                        transactionType: transaction.transactionType,
                        amount: transaction.amount,
                        date: transaction.date,
                        status: transaction.status,
                        description: transaction.description,
                        createdAt: transaction.createdAt,
                    },
                },
                msg: 'Withdrawal successful',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getHomeFeed(spectatorId) {
        try {
            // LiveRace: 1 running race
            const liveRaceRound = await RaceRound.findOne({ status: 'running' }).lean();
            let liveRace = null;
            if (liveRaceRound) {
                const tournament = liveRaceRound.tournamentId
                    ? await Tournament.findById(liveRaceRound.tournamentId).lean()
                    : null;

                const registrations = await Registration.find({
                    raceRoundId: liveRaceRound._id,
                    registrationStatus: { $in: ['approved', 'verified'] },
                }).limit(3).lean();

                const registrationsWithHorse = await Promise.all(registrations.map(async reg => {
                    const horse = reg.horseId ? await Horse.findById(reg.horseId).lean() : null;
                    return {
                        _id: reg._id,
                        laneNumber: reg.laneNumber,
                        horse: horse ? { _id: horse._id, horseName: horse.horseName, img: horse.img } : null,
                    };
                }));

                liveRace = {
                    _id: liveRaceRound._id,
                    roundName: liveRaceRound.roundName,
                    raceDate: liveRaceRound.raceDate,
                    location: liveRaceRound.location,
                    status: liveRaceRound.status,
                    livestreamUrl: liveRaceRound.livestreamUrl,
                    tournament: tournament
                        ? { _id: tournament._id, tournamentName: tournament.tournamentName }
                        : null,
                    registrations: registrationsWithHorse,
                };
            }

            // UpcomingRaces: top 5 scheduled, sorted by raceDate ASC
            const upcomingRaceRounds = await RaceRound.find({ status: 'scheduled' })
                .sort({ raceDate: 1 })
                .limit(5)
                .lean();

            const upcomingRaces = await Promise.all(upcomingRaceRounds.map(async rr => {
                const tournament = rr.tournamentId
                    ? await Tournament.findById(rr.tournamentId).lean()
                    : null;
                return {
                    _id: rr._id,
                    roundName: rr.roundName,
                    raceDate: rr.raceDate,
                    location: rr.location,
                    address: rr.address,
                    status: rr.status,
                    tournament: tournament
                        ? { _id: tournament._id, tournamentName: tournament.tournamentName, prizePool: tournament.prizePool }
                        : null,
                };
            }));

            // FeaturedHorses: top 4 by winRate
            const horseStatsList = await Registration.aggregate([
                {
                    $lookup: {
                        from: 'raceresults',
                        localField: '_id',
                        foreignField: 'registrationId',
                        as: 'results',
                    },
                },
                {
                    $group: {
                        _id: '$horseId',
                        totalRaces: { $sum: { $size: '$results' } },
                        totalWins: {
                            $sum: {
                                $size: {
                                    $filter: {
                                        input: '$results',
                                        cond: { $eq: ['$$this.finishPosition', 1] },
                                    },
                                },
                            },
                        },
                    },
                },
                {
                    $addFields: {
                        winRate: {
                            $cond: [
                                { $gt: ['$totalRaces', 0] },
                                { $divide: ['$totalWins', '$totalRaces'] },
                                0,
                            ],
                        },
                    },
                },
                { $sort: { winRate: -1 } },
                { $limit: 4 },
            ]);

            const featuredHorses = (await Promise.all(horseStatsList.map(async stats => {
                const horse = await Horse.findById(stats._id).lean();
                if (!horse) return null;
                return {
                    _id: horse._id,
                    horseName: horse.horseName,
                    img: horse.img,
                    healthStatus: horse.healthStatus,
                    totalRaces: stats.totalRaces,
                    totalWins: stats.totalWins,
                    winRate: stats.totalRaces > 0
                        ? parseFloat(((stats.totalWins / stats.totalRaces) * 100).toFixed(2))
                        : 0,
                };
            }))).filter(Boolean);

            // Spectator rewardPoints
            const spectator = await Spectator.findById(spectatorId).lean();

            return {
                code: 200,
                data: {
                    liveRace,
                    upcomingRaces,
                    featuredHorses,
                    spectator: spectator ? { rewardPoints: spectator.rewardPoints } : null,
                },
                msg: 'Home feed retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getRaceSchedule(spectatorId, query) {
        try {
            const { filter: statusFilter = 'scheduled', page = 1, limit = 10 } = query;
            const validStatuses = ['running', 'scheduled', 'completed'];
            if (!validStatuses.includes(statusFilter)) return { code: 400, msg: 'Invalid filter status' };

            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;

            const [raceRounds, total] = await Promise.all([
                RaceRound.find({ status: statusFilter })
                    .sort({ raceDate: 1 })
                    .skip(skip)
                    .limit(limitNum)
                    .lean(),
                RaceRound.countDocuments({ status: statusFilter }),
            ]);
            const hasMore = skip + raceRounds.length < total;

            const result = await Promise.all(raceRounds.map(async rr => {
                const [tournament, currentParticipants] = await Promise.all([
                    rr.tournamentId ? Tournament.findById(rr.tournamentId).lean() : null,
                    Registration.countDocuments({ raceRoundId: rr._id, registrationStatus: 'approved' }),
                ]);
                return {
                    _id: rr._id,
                    roundName: rr.roundName,
                    raceDate: rr.raceDate,
                    trackLength: rr.trackLength,
                    location: rr.location,
                    address: rr.address,
                    raceGround: rr.raceGround,
                    status: rr.status,
                    maxParticipants: rr.maxParticipants,
                    requireEntranceFees: rr.requireEntranceFees,
                    minimalRidingFees: rr.minimalRidingFees,
                    currentParticipants,
                    tournament: tournament ? {
                        _id: tournament._id,
                        tournamentName: tournament.tournamentName,
                        startDate: tournament.startDate,
                        endDate: tournament.endDate,
                        prizePool: tournament.prizePool,
                    } : null,
                };
            }));

            return {
                code: 200,
                data: {
                    meta: { total, page: pageNum, limit: limitNum, hasMore },
                    raceRounds: result,
                },
                msg: 'Race schedule retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getLiveRaceDetail(spectatorId, raceRoundId) {
        try {
            const raceRound = await RaceRound.findById(raceRoundId).lean();
            if (!raceRound) return { code: 404, msg: 'Race round not found' };

            const tournament = raceRound.tournamentId
                ? await Tournament.findById(raceRound.tournamentId).lean()
                : null;

            const registrations = await Registration.find({
                raceRoundId,
                registrationStatus: { $in: ['approved', 'verified'] },
            }).lean();

            const registrationIds = registrations.map(r => r._id);

            // Fetch userPredictions for this spectator in this race round
            const userPredictions = await Prediction.find({
                spectatorId,
                registrationId: { $in: registrationIds },
            }).lean();

            const predictionMethodIds = [...new Set(userPredictions.map(p => p.predictionMethodId?.toString()).filter(Boolean))];
            const predictionMethods = predictionMethodIds.length > 0
                ? await PredictionMethod.find({ _id: { $in: predictionMethodIds } }).lean()
                : [];
            const pmMap = {};
            predictionMethods.forEach(pm => { pmMap[pm._id.toString()] = pm; });

            const populatedRegistrations = await Promise.all(registrations.map(async reg => {
                const horse = reg.horseId ? await Horse.findById(reg.horseId).lean() : null;
                const jockey = reg.confirmedJockeyId ? await Jockey.findById(reg.confirmedJockeyId).lean() : null;
                const jockeyUser = jockey ? await UserRepository.findById(reg.confirmedJockeyId) : null;

                const regPredictions = userPredictions.filter(p => p.registrationId.toString() === reg._id.toString());

                return {
                    _id: reg._id,
                    laneNumber: reg.laneNumber,
                    registrationStatus: reg.registrationStatus,
                    registeredAt: reg.registeredAt,
                    horse: horse ? {
                        _id: horse._id,
                        horseName: horse.horseName,
                        breed: horse.breed,
                        gender: horse.gender,
                        img: horse.img,
                        healthStatus: horse.healthStatus,
                    } : null,
                    jockey: jockey ? {
                        _id: jockey._id,
                        height: jockey.height,
                        weight: jockey.weight,
                        ranking: jockey.ranking,
                        user: jockeyUser ? { fullName: jockeyUser.fullName, image: jockeyUser.image } : null,
                    } : null,
                    userPrediction: regPredictions.length > 0
                        ? regPredictions.map(p => ({
                            _id: p._id,
                            predictedRank: p.predictedRank,
                            predictionStatus: p.predictionStatus,
                            rewardPoints: p.rewardPoints,
                            predictionMethod: pmMap[p.predictionMethodId?.toString()] ? {
                                _id: pmMap[p.predictionMethodId.toString()]._id,
                                methodName: pmMap[p.predictionMethodId.toString()].methodName,
                            } : null,
                        }))
                        : null,
                };
            }));

            return {
                code: 200,
                data: {
                    raceRound: {
                        _id: raceRound._id,
                        roundName: raceRound.roundName,
                        raceDate: raceRound.raceDate,
                        trackLength: raceRound.trackLength,
                        location: raceRound.location,
                        address: raceRound.address,
                        raceGround: raceRound.raceGround,
                        status: raceRound.status,
                        maxParticipants: raceRound.maxParticipants,
                        minimalRidingFees: raceRound.minimalRidingFees,
                        requireEntranceFees: raceRound.requireEntranceFees,
                        livestreamUrl: raceRound.livestreamUrl,
                        tournament: tournament ? {
                            _id: tournament._id,
                            tournamentName: tournament.tournamentName,
                            prizePool: tournament.prizePool,
                        } : null,
                        registrations: populatedRegistrations,
                    },
                },
                msg: 'Live race detail retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getRaceResult(raceRoundId) {
        try {
            const raceRound = await RaceRound.findById(raceRoundId).lean();
            if (!raceRound) return { code: 404, msg: 'Race round not found' };

            const tournament = raceRound.tournamentId
                ? await Tournament.findById(raceRound.tournamentId).lean()
                : null;

            const raceResults = await RaceResult.find({ raceRoundId })
                .sort({ finishPosition: 1 })
                .lean();

            const populatedResults = await Promise.all(raceResults.map(async result => {
                const registration = result.registrationId
                    ? await Registration.findById(result.registrationId).lean()
                    : null;
                const horse = registration?.horseId
                    ? await Horse.findById(registration.horseId).lean()
                    : null;
                const jockey = registration?.confirmedJockeyId
                    ? await Jockey.findById(registration.confirmedJockeyId).lean()
                    : null;
                const jockeyUser = jockey ? await UserRepository.findById(registration.confirmedJockeyId) : null;

                return {
                    _id: result._id,
                    finishPosition: result.finishPosition,
                    finishTime: result.finishTime,
                    prizeMoney: result.prizeMoney,
                    resultStatus: result.resultStatus,
                    createdAt: result.createdAt,
                    registration: registration ? {
                        _id: registration._id,
                        laneNumber: registration.laneNumber,
                        horse: horse ? { _id: horse._id, horseName: horse.horseName, img: horse.img } : null,
                        jockey: jockey ? {
                            user: jockeyUser ? { fullName: jockeyUser.fullName, image: jockeyUser.image } : null,
                        } : null,
                    } : null,
                };
            }));

            return {
                code: 200,
                data: {
                    raceRound: {
                        _id: raceRound._id,
                        roundName: raceRound.roundName,
                        raceDate: raceRound.raceDate,
                        location: raceRound.location,
                        raceGround: raceRound.raceGround,
                        trackLength: raceRound.trackLength,
                        status: raceRound.status,
                        tournament: tournament ? {
                            _id: tournament._id,
                            tournamentName: tournament.tournamentName,
                            prizePool: tournament.prizePool,
                        } : null,
                        results: populatedResults,
                    },
                },
                msg: 'Race result retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getRaceLeaderboard(raceRoundId) {
        try {
            const raceRound = await RaceRound.findById(raceRoundId).lean();
            if (!raceRound) return { code: 404, msg: 'Race round not found' };

            const raceResults = await RaceResult.find({ raceRoundId })
                .sort({ finishPosition: 1 })
                .lean();

            const populatedResults = await Promise.all(raceResults.map(async result => {
                const registration = result.registrationId
                    ? await Registration.findById(result.registrationId).lean()
                    : null;
                const horse = registration?.horseId
                    ? await Horse.findById(registration.horseId).lean()
                    : null;
                const jockey = registration?.confirmedJockeyId
                    ? await Jockey.findById(registration.confirmedJockeyId).lean()
                    : null;
                const jockeyUser = jockey ? await UserRepository.findById(registration.confirmedJockeyId) : null;

                return {
                    _id: result._id,
                    finishPosition: result.finishPosition,
                    finishTime: result.finishTime,
                    prizeMoney: result.prizeMoney,
                    resultStatus: result.resultStatus,
                    registration: registration ? {
                        _id: registration._id,
                        laneNumber: registration.laneNumber,
                        horse: horse ? { _id: horse._id, horseName: horse.horseName, img: horse.img } : null,
                        jockey: jockey ? {
                            user: jockeyUser ? { fullName: jockeyUser.fullName } : null,
                        } : null,
                    } : null,
                };
            }));

            return {
                code: 200,
                data: {
                    raceRound: {
                        _id: raceRound._id,
                        roundName: raceRound.roundName,
                        status: raceRound.status,
                        results: populatedResults,
                    },
                },
                msg: 'Leaderboard retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getAvailablePredictionMethods(spectatorId, raceRoundId) {
        try {
            const raceRound = await RaceRound.findById(raceRoundId).lean();
            if (!raceRound) return { code: 404, msg: 'Race round not found' };

            const predictionMethods = await PredictionMethod.find({ isActive: true }).lean();

            const registrations = await Registration.find({ raceRoundId }).lean();
            const registrationIds = registrations.map(r => r._id);

            const existingPredictions = await Prediction.find({
                spectatorId,
                registrationId: { $in: registrationIds },
            }).lean();

            const userAlreadyPredicted = existingPredictions.length > 0;

            return {
                code: 200,
                data: {
                    predictionMethods: predictionMethods.map(pm => ({
                        _id: pm._id,
                        methodName: pm.methodName,
                        methodDescription: pm.methodDescription,
                        isActive: pm.isActive,
                        createdAt: pm.createdAt,
                    })),
                    userAlreadyPredicted,
                    existingPredictions: userAlreadyPredicted
                        ? existingPredictions.map(p => ({
                            _id: p._id,
                            predictionMethodId: p.predictionMethodId,
                            predictedRank: p.predictedRank,
                            predictionStatus: p.predictionStatus,
                            rewardPoints: p.rewardPoints,
                            created_at: p.created_at,
                        }))
                        : undefined,
                },
                msg: 'Prediction methods retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async createPrediction(spectatorId, data) {
        try {
            const { registrationId, predictionMethodId, predictedRank } = data || {};
            if (!registrationId || !predictionMethodId || predictedRank === undefined) {
                return { code: 400, msg: 'registrationId, predictionMethodId, and predictedRank are required' };
            }

            const spectator = await Spectator.findById(spectatorId).lean();
            if (!spectator) return { code: 404, msg: 'Spectator not found' };

            const [registration, predictionMethod] = await Promise.all([
                Registration.findById(registrationId).lean(),
                PredictionMethod.findById(predictionMethodId).lean(),
            ]);
            if (!registration) return { code: 404, msg: 'Registration not found' };
            if (!predictionMethod) return { code: 404, msg: 'Prediction method not found' };
            if (!predictionMethod.isActive) return { code: 400, msg: 'Prediction method is not active' };

            const duplicate = await Prediction.findOne({ spectatorId, registrationId, predictionMethodId }).lean();
            if (duplicate) return { code: 409, msg: 'You have already predicted for this registration with this method' };

            const prediction = await Prediction.create({
                spectatorId,
                registrationId,
                predictionMethodId,
                predictedRank,
                predictionStatus: 'pending',
                rewardPoints: 0,
            });

            return {
                code: 201,
                data: {
                    prediction: {
                        _id: prediction._id,
                        spectatorId: prediction.spectatorId,
                        registrationId: prediction.registrationId,
                        predictionMethodId: prediction.predictionMethodId,
                        predictedRank: prediction.predictedRank,
                        predictionStatus: prediction.predictionStatus,
                        rewardPoints: prediction.rewardPoints,
                        created_at: prediction.created_at,
                    },
                },
                msg: 'Prediction created successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getMyPredictions(spectatorId, query) {
        try {
            const { predictionStatus = 'all', page = 1, limit = 10 } = query;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;

            const validStatuses = ['pending', 'correct', 'incorrect', 'cancelled', 'refunded', 'all'];
            if (!validStatuses.includes(predictionStatus)) return { code: 400, msg: 'Invalid predictionStatus' };

            const filter = { spectatorId };
            if (predictionStatus !== 'all') filter.predictionStatus = predictionStatus;

            const [predictions, total] = await Promise.all([
                Prediction.find(filter).sort({ created_at: -1 }).skip(skip).limit(limitNum).lean(),
                Prediction.countDocuments(filter),
            ]);
            const hasMore = skip + predictions.length < total;

            const result = await Promise.all(predictions.map(async p => {
                const [predictionMethod, registration] = await Promise.all([
                    p.predictionMethodId ? PredictionMethod.findById(p.predictionMethodId).lean() : null,
                    p.registrationId ? Registration.findById(p.registrationId).lean() : null,
                ]);

                const horse = registration?.horseId ? await Horse.findById(registration.horseId).lean() : null;
                const raceRound = registration?.raceRoundId ? await RaceRound.findById(registration.raceRoundId).lean() : null;
                const tournament = raceRound?.tournamentId ? await Tournament.findById(raceRound.tournamentId).lean() : null;

                return {
                    _id: p._id,
                    predictedRank: p.predictedRank,
                    predictionStatus: p.predictionStatus,
                    rewardPoints: p.rewardPoints,
                    created_at: p.created_at,
                    predictionMethod: predictionMethod ? {
                        _id: predictionMethod._id,
                        methodName: predictionMethod.methodName,
                        methodDescription: predictionMethod.methodDescription,
                    } : null,
                    registration: registration ? {
                        _id: registration._id,
                        laneNumber: registration.laneNumber,
                        horse: horse ? { _id: horse._id, horseName: horse.horseName, img: horse.img } : null,
                        raceRound: raceRound ? {
                            _id: raceRound._id,
                            roundName: raceRound.roundName,
                            raceDate: raceRound.raceDate,
                            location: raceRound.location,
                            status: raceRound.status,
                            tournament: tournament ? {
                                _id: tournament._id,
                                tournamentName: tournament.tournamentName,
                            } : null,
                        } : null,
                    } : null,
                };
            }));

            return {
                code: 200,
                data: {
                    meta: { total, page: pageNum, limit: limitNum, hasMore },
                    predictions: result,
                },
                msg: 'Predictions retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getPredictionDetail(spectatorId, predictionId) {
        try {
            const prediction = await Prediction.findById(predictionId).lean();
            if (!prediction) return { code: 404, msg: 'Prediction not found' };
            if (prediction.spectatorId.toString() !== spectatorId.toString()) {
                return { code: 403, msg: 'Not authorized to view this prediction' };
            }

            const [predictionMethod, registration] = await Promise.all([
                prediction.predictionMethodId ? PredictionMethod.findById(prediction.predictionMethodId).lean() : null,
                prediction.registrationId ? Registration.findById(prediction.registrationId).lean() : null,
            ]);

            const horse = registration?.horseId ? await Horse.findById(registration.horseId).lean() : null;
            const jockey = registration?.confirmedJockeyId ? await Jockey.findById(registration.confirmedJockeyId).lean() : null;
            const jockeyUser = jockey ? await UserRepository.findById(registration.confirmedJockeyId) : null;
            const raceRound = registration?.raceRoundId ? await RaceRound.findById(registration.raceRoundId).lean() : null;
            const tournament = raceRound?.tournamentId ? await Tournament.findById(raceRound.tournamentId).lean() : null;
            const actualResult = prediction.registrationId
                ? await RaceResult.findOne({ registrationId: prediction.registrationId }).lean()
                : null;

            return {
                code: 200,
                data: {
                    prediction: {
                        _id: prediction._id,
                        predictedRank: prediction.predictedRank,
                        predictionStatus: prediction.predictionStatus,
                        rewardPoints: prediction.rewardPoints,
                        created_at: prediction.created_at,
                        predictionMethod: predictionMethod ? {
                            _id: predictionMethod._id,
                            methodName: predictionMethod.methodName,
                            methodDescription: predictionMethod.methodDescription,
                        } : null,
                        registration: registration ? {
                            _id: registration._id,
                            laneNumber: registration.laneNumber,
                            registrationStatus: registration.registrationStatus,
                            registeredAt: registration.registeredAt,
                            horse: horse ? {
                                _id: horse._id,
                                horseName: horse.horseName,
                                breed: horse.breed,
                                img: horse.img,
                                healthStatus: horse.healthStatus,
                            } : null,
                            jockey: jockey ? {
                                _id: jockey._id,
                                ranking: jockey.ranking,
                                licenseStatus: jockey.licenseStatus,
                                user: jockeyUser ? { fullName: jockeyUser.fullName, image: jockeyUser.image } : null,
                            } : null,
                            raceRound: raceRound ? {
                                _id: raceRound._id,
                                roundName: raceRound.roundName,
                                raceDate: raceRound.raceDate,
                                location: raceRound.location,
                                raceGround: raceRound.raceGround,
                                trackLength: raceRound.trackLength,
                                status: raceRound.status,
                                tournament: tournament ? {
                                    _id: tournament._id,
                                    tournamentName: tournament.tournamentName,
                                } : null,
                            } : null,
                        } : null,
                        actualResult: actualResult ? {
                            finishPosition: actualResult.finishPosition,
                            finishTime: actualResult.finishTime,
                            prizeMoney: actualResult.prizeMoney,
                            resultStatus: actualResult.resultStatus,
                        } : null,
                    },
                },
                msg: 'Prediction detail retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new SpectatorService();
