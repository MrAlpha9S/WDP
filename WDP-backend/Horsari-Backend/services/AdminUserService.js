const AdminRepository = require('../repositories/AdminRepository');
const UserRepository = require('../repositories/UserRepository');
const JockeyRepository = require('../repositories/JockeyRepository');
const Invitation = require('../entities/Invitation');
const Horse = require('../entities/Horse');
const RaceReferee = require('../entities/RaceReferee');
const Referee = require('../entities/Referee');
const RaceResult = require('../entities/RaceResult');
const User = require('../entities/User');
const Violation = require('../entities/Violation');
const Prediction = require('../entities/Prediction');
const CurrencyConverter = require('./CurrencyConverter');

class UserService {
    // Create admin profile only (expects existing user id)
    async createAdmin(adminId, data) {
        try {
            if (!adminId) {
                return {
                    code: 400,
                    msg: 'adminId is required',
                };
            }

            // Verify the user exists before creating admin profile
            const user = await UserRepository.findById(adminId);
            if (!user) {
                return {
                    code: 404,
                    msg: 'User not found',
                };
            }

            const adminProfile = await AdminRepository.create({
                _id: adminId,
            });

            return {
                code: 201,
                data: adminProfile,
                msg: 'Admin profile created successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Get all users (admin only)
    async getAllUsers(role, search, limit = 10, skip = 0, sortBy = 'createdAt', order = 'desc') {
        try {
            const filter = {};
            if (role && role !== 'All') {
                filter.role = role.toLowerCase();
            }
            if (search) {
                filter.$or = [
                    { fullName: { $regex: search, $options: 'i' } },
                    { username: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }
            const allowedUserSortFields = ['fullName', 'username', 'email', 'role', 'status', 'createdAt', 'updatedAt'];
            const sortField = allowedUserSortFields.includes(sortBy) ? sortBy : 'createdAt';
            const sortOrder = order === 'asc' ? 1 : -1;
            const [users, totalUsers] = await Promise.all([
                User.find(filter).sort({ [sortField]: sortOrder }).limit(limit).skip(skip),
                UserRepository.count(filter),
            ]);

            const totalPages = Math.ceil(totalUsers / limit);
            return {
                code: 200,
                data: {
                    items: users,
                    pagination: {
                        totalItems: totalUsers,
                        totalPages,
                        currentPage: skip / limit + 1,
                        limit
                    }
                },
                msg: 'Users retrieved successfully',
            };
        } catch (error) {
            console.error('getAllUsers error:', error);
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    async getUsersDetail(id) {
        try {
            const user = await UserRepository.findById(id);
            if (!user) return { code: 404, msg: 'User not found' };

            const userObj = user.toObject();
            delete userObj.passwordHash;

            let roleProfile = null;

            switch (userObj.role) {
                case 'horseowner': {
                    const HorseOwner = require('../entities/HorseOwner');
                    const owner = await HorseOwner.findById(id).lean();
                    const horses = await Horse.find({ ownerId: id }).lean();

                    const horseIds = horses.map(h => h._id);
                    const ownerInvitations = await Invitation.find({
                        horseId: { $in: horseIds },
                        registrationId: { $exists: true, $ne: null },
                    }).lean();

                    const regIds = ownerInvitations.map(i => i.registrationId).filter(Boolean);
                    const ownerViolations = regIds.length
                        ? await Violation.find({ registrationId: { $in: regIds } })
                            .populate('violationTypeId')
                            .populate('raceRoundId', 'roundName raceDate')
                            .lean()
                        : [];

                    // group violations by the horse that owns the registration
                    const regToHorse = {};
                    for (const inv of ownerInvitations) {
                        if (inv.registrationId) regToHorse[inv.registrationId.toString()] = inv.horseId.toString();
                    }
                    const violationsByHorse = {};
                    for (const v of ownerViolations) {
                        const horseId = regToHorse[v.registrationId?.toString()];
                        if (!horseId) continue;
                        if (!violationsByHorse[horseId]) violationsByHorse[horseId] = [];
                        violationsByHorse[horseId].push({
                            violationId: v._id,
                            raceRoundId: v.raceRoundId?._id ?? v.raceRoundId ?? null,
                            roundName: v.raceRoundId?.roundName ?? null,
                            raceDate: v.raceRoundId?.raceDate ?? null,
                            typeName: v.violationTypeId?.violationName ?? null,
                            description: v.description ?? null,
                            severity: v.severity ?? null,
                            stewardAction: v.stewardAction ?? null,
                            violationStatus: v.violationStatus,
                            reportedAt: v.created_at,
                        });
                    }

                    roleProfile = {
                        address: owner?.address ?? null,
                        licenseStatus: owner?.licenseStatus ?? null,
                        licenseLink: owner?.licenseLink ?? null,
                        horses: horses.map(h => ({
                            _id: h._id,
                            horseName: h.horseName,
                            breed: h.breed ?? null,
                            dateOfBirth: h.dateOfBirth ?? null,
                            status: h.status,
                            healthStatus: h.healthStatus,
                            violations: violationsByHorse[h._id.toString()] ?? [],
                        })),
                    };
                    break;
                }
                case 'jockey': {
                    const Jockey = require('../entities/Jockey');
                    const jockey = await Jockey.findById(id).lean();
                    const invitations = await Invitation.find({
                        jockeyId: id,
                        invitationStatus: { $in: ['accepted', 'didNotAttend'] },
                    })
                        .populate({ path: 'registrationId', populate: { path: 'raceRoundId' } })
                        .populate('horseId', 'horseName breed gender img')
                        .lean();

                    const jockeyRegIds = invitations
                        .map(i => i.registrationId?._id ?? i.registrationId)
                        .filter(Boolean);

                    const jockeyViolations = jockeyRegIds.length
                        ? await Violation.find({ registrationId: { $in: jockeyRegIds } })
                            .populate('violationTypeId')
                            .lean()
                        : [];

                    const violationsByReg = {};
                    for (const v of jockeyViolations) {
                        const key = v.registrationId?.toString();
                        if (!key) continue;
                        if (!violationsByReg[key]) violationsByReg[key] = [];
                        violationsByReg[key].push({
                            violationId: v._id,
                            typeName: v.violationTypeId?.violationName ?? null,
                            description: v.description ?? null,
                            severity: v.severity ?? null,
                            stewardAction: v.stewardAction ?? null,
                            violationStatus: v.violationStatus,
                            reportedAt: v.created_at,
                        });
                    }

                    const raceHistory = [];
                    for (const inv of invitations) {
                        const reg = inv.registrationId;
                        if (!reg) continue;
                        const raceRound = reg.raceRoundId;
                        if (!raceRound) continue;
                        const raceResult = await RaceResult.findOne({ registrationId: reg._id }).lean();
                        raceHistory.push({
                            raceRoundId: raceRound._id,
                            roundName: raceRound.roundName,
                            raceDate: raceRound.raceDate,
                            finishPosition: raceResult?.finishPosition ?? null,
                            finishTime: raceResult?.finishTime ?? null,
                            prizeMoney: raceResult?.prizeMoney ?? null,
                            resultStatus: raceResult?.resultStatus ?? null,
                            distance: raceResult?.distance ?? null,
                            horseId: inv.horseId?._id ?? null,
                            horseName: inv.horseId?.horseName ?? null,
                            horseBreed: inv.horseId?.breed ?? null,
                            horseImg: inv.horseId?.img ?? null,
                            attendance: inv.invitationStatus === 'didNotAttend' ? 'no_show' : inv.isBackup ? 'backup' : 'main',
                            bookingFees: inv.bookingFees ?? 0,
                            violations: violationsByReg[reg._id.toString()] ?? [],
                        });
                    }

                    const { rank, totalJockeys, winRate } = await JockeyRepository.getWinRateRank(id);

                    roleProfile = {
                        height: jockey?.height ?? null,
                        weight: jockey?.weight ?? null,
                        matchesRaced: jockey?.matchesRaced ?? 0,
                        totalWins: jockey?.totalWins ?? 0,
                        rank,
                        totalJockeys,
                        winRate,
                        status: jockey?.status ?? null,
                        licenseLink: jockey?.licenseLink ?? null,
                        licenseStatus: jockey?.licenseStatus ?? null,
                        bookingFee: jockey?.bookingFee ?? 0,
                        raceHistory,
                    };
                    break;
                }
                case 'referee': {
                    const referee = await Referee.findById(id).lean();

                    const assignments = await RaceReferee.find({ refereeId: id })
                        .populate('raceRoundId')
                        .sort({ assignedAt: -1 })
                        .lean();

                    const assignmentProfiles = await Promise.all(
                        assignments.map(async (a) => {
                            const raceRound = a.raceRoundId;
                            const violations = await Violation.find({ raceRefereeId: a._id })
                                .populate('violationTypeId')
                                .lean();

                            return {
                                assignmentId: a._id,
                                raceRoundId: raceRound?._id ?? null,
                                roundName: raceRound?.roundName ?? null,
                                raceDate: raceRound?.raceDate ?? null,
                                raceStatus: raceRound?.status ?? null,
                                assignmentStatus: a.status,
                                paymentStatus: a.paymentStatus,
                                fee: CurrencyConverter.convertToVnd(a.fee ?? 0, raceRound?.currencyType),
                                assignedAt: a.assignedAt,
                                violations: violations.map((v) => ({
                                    violationId: v._id,
                                    typeName: v.violationTypeId?.violationName ?? null,
                                    description: v.description ?? null,
                                    severity: v.severity ?? null,
                                    stewardAction: v.stewardAction ?? null,
                                    violationStatus: v.violationStatus,
                                    reportedAt: v.created_at,
                                })),
                            };
                        })
                    );

                    roleProfile = {
                        licenseLink: referee?.licenseLink ?? null,
                        licenseStatus: referee?.licenseStatus ?? null,
                        totalAssignments: assignments.length,
                        assignments: assignmentProfiles,
                    };
                    break;
                }
                case 'spectator': {
                    const Spectator = require('../entities/Spectator');
                    const Transaction = require('../entities/Transaction');

                    const [spectator, predictions, transactions] = await Promise.all([
                        Spectator.findById(id).lean(),
                        Prediction.find({ spectatorId: id })
                            .sort({ created_at: -1 })
                            .populate('predictionMethodId', 'methodName methodType')
                            .populate({
                                path: 'registrationId',
                                populate: { path: 'raceRoundId', select: 'roundName raceDate status' },
                            })
                            .populate('tournamentId', 'tournamentName status')
                            .populate('predictedHorseId', 'horseName')
                            .lean(),
                        Transaction.find({ userId: id })
                            .sort({ date: -1 })
                            .lean(),
                    ]);

                    roleProfile = {
                        wallet: spectator?.wallet ?? 0,
                        predictions: predictions.map(p => ({
                            predictionId: p._id,
                            methodName: p.predictionMethodId?.methodName ?? null,
                            methodType: p.predictionMethodId?.methodType ?? null,
                            predictionStatus: p.predictionStatus,
                            rewardPoints: p.rewardPoints,
                            predictedRank: p.predictedRank ?? null,
                            predictedHorse: p.predictedHorseId?.horseName ?? null,
                            raceRound: p.registrationId?.raceRoundId
                                ? {
                                    raceRoundId: p.registrationId.raceRoundId._id,
                                    roundName: p.registrationId.raceRoundId.roundName,
                                    raceDate: p.registrationId.raceRoundId.raceDate,
                                    status: p.registrationId.raceRoundId.status,
                                }
                                : null,
                            tournament: p.tournamentId
                                ? {
                                    tournamentId: p.tournamentId._id,
                                    tournamentName: p.tournamentId.tournamentName,
                                    status: p.tournamentId.status,
                                }
                                : null,
                            createdAt: p.created_at,
                        })),
                        transactions: transactions.map(t => ({
                            transactionId: t._id,
                            transactionType: t.transactionType,
                            amount: t.amount,
                            status: t.status,
                            description: t.description ?? null,
                            referenceId: t.referenceId ?? null,
                            referenceType: t.referenceType ?? null,
                            date: t.date,
                        })),
                    };
                    break;
                }
                default:
                    roleProfile = {};
            }

            return {
                code: 200,
                data: { user: userObj, roleProfile },
                msg: 'User detail retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Update user status
    async updateUserStatus(userId, status) {
        try {
            if (!['active', 'inactive', 'suspended'].includes(status)) {
                return {
                    code: 400,
                    msg: 'Invalid status',
                };
            }
            const user = await UserRepository.findById(userId);
            if (!user) {
                return {
                    code: 404,
                    msg: 'User not found',
                };
            }
            const updatedUser = await UserRepository.updateById(userId, { status });
            return {
                code: 200,
                data: updatedUser,
                msg: 'User status updated successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // (adminLevel removed) — endpoints for admin levels are no longer supported

    // Delete user (admin only)
    async deleteUser(userId) {
        try {
            const user = await UserRepository.findById(userId);
            if (!user) {
                return {
                    code: 404,
                    msg: 'User not found',
                };
            }
            await UserRepository.deleteById(userId);
            return {
                code: 200,
                msg: 'User deleted successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // --- Certification Verification ---

    async verifyCertification(userId, action, io) {
        try {
            if (!['approve', 'reject'].includes(action)) {
                return { code: 400, msg: "Action must be 'approve' or 'reject'" };
            }

            const HorseOwner = require('../entities/HorseOwner');
            const Jockey = require('../entities/Jockey');

            const user = await UserRepository.findById(userId);
            if (!user) return { code: 404, msg: 'User not found' };

            const newStatus = action === 'approve' ? 'approved' : 'rejected';

            switch (user.role) {
                case 'horseowner':
                    await HorseOwner.findByIdAndUpdate(userId, { licenseStatus: newStatus });
                    break;
                case 'jockey':
                    await Jockey.findByIdAndUpdate(userId, { licenseStatus: newStatus });
                    break;
                case 'referee':
                    await Referee.findByIdAndUpdate(userId, { licenseStatus: newStatus });
                    break;
                default:
                    return { code: 400, msg: 'This role does not support certification verification' };
            }

            return { code: 200, msg: `Certification ${newStatus} successfully`, data: { licenseStatus: newStatus } };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new UserService();
