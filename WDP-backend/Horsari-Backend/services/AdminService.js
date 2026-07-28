const AdminRepository = require('../repositories/AdminRepository');
const UserRepository = require('../repositories/UserRepository');
const ProfileUpdateUtil = require('../utils/ProfileUpdateUtil');
const HorseOwnerRepository = require('../repositories/HorseOwnerRepository');
const JockeyRepository = require('../repositories/JockeyRepository');
const TournamentRepository = require('../repositories/TournamentRepository');
const RaceRoundRepository = require('../repositories/RaceRoundRepository');
const RegistrationRepository = require('../repositories/RegistrationRepository');
const Invitation = require('../entities/Invitation');
const Horse = require('../entities/Horse');
const Registration = require('../entities/Registration');
const Tournament = require('../entities/Tournament');
const RaceRound = require('../entities/RaceRound');
const RaceReferee = require('../entities/RaceReferee');
const Referee = require('../entities/Referee');
const Jockey = require('../entities/Jockey');
const Prediction = require('../entities/Prediction');
const PredictionMethod = require('../entities/PredictionMethod');
const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
const RaceResult = require('../entities/RaceResult');
const HorseOwner = require('../entities/HorseOwner');
const User = require('../entities/User');
const Violation = require('../entities/Violation');
const ViolationType = require('../entities/ViolationType');
const SimulationService = require('./SimulationService');
const MuxService = require('./MuxService');
const PaymentService = require('./PaymentService');
const NotificationService = require('./NotificationService');
const CurrencyConverter = require('./CurrencyConverter');
const PayoutService = require('./PayoutService');

class AdminService {
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

    // Get admin profile
    async getAdminProfile(adminId) {
        try {
            const admin = await AdminRepository.findByAdminId(adminId);
            if (!admin) {
                return {
                    code: 404,
                    msg: 'Admin profile not found',
                };
            }
            return {
                code: 200,
                data: admin,
                msg: 'Admin profile retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
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
    // Get all horse owner registrations enriched with race, horse, and jockey invitation data
    async getHorseOwnerInvitations(page = 1, limit = 5) {
        try {
            const registrations = await RegistrationRepository.findAllWithDetails(page, limit);
            const totalItems = await RegistrationRepository.countAll();
            const totalPages = Math.ceil(totalItems / limit);

            const items = await Promise.all(
                registrations.map(async (reg) => {
                    const raceRound = reg.raceRoundId || null;
                    const horseOwner = reg.horseOwnerId || null;

                    // Count accepted invitations for this race round (current_participants)
                    const currentParticipants = raceRound
                        ? await Invitation.countDocuments({
                            registrationId: { $in: await Registration.find({ raceRoundId: raceRound._id }).distinct('_id') },
                            invitationStatus: 'accepted',
                        })
                        : 0;

                    const ownerUser = horseOwner ? await User.findById(horseOwner._id).select('fullName').lean() : null;

                    // Fetch all invitations for this registration and populate the associated horse
                    const invitations = await Invitation.find({
                        registrationId: reg._id,
                    })
                        .populate('horseId')
                        .populate('jockeyId')
                        .lean();

                    for (let inv of invitations) {
                        if (inv.jockeyId) {
                            inv.jockeyUser = await User.findById(inv.jockeyId._id).select('fullName').lean();
                        }
                    }

                    // Extract horse from the first invitation (all invitations for a registration share the same horse)
                    const horse = invitations.length > 0 && invitations[0].horseId
                        ? invitations[0].horseId
                        : null;

                    return {
                        registrationId: reg._id,
                        registrationAt: reg.registeredAt,
                        registrationStatus: reg.registrationStatus,
                        raceRound: raceRound
                            ? {
                                raceRoundId: raceRound._id,
                                roundName: raceRound.roundName,
                                raceDate: raceRound.raceDate,
                                maxParticipants: raceRound.maxParticipants,
                                currentParticipants: currentParticipants,
                                status: raceRound.status,
                            }
                            : null,
                        horse: horse
                            ? { horseId: horse._id, horseName: horse.horseName }
                            : null,
                        invitations: invitations.map((inv) => ({
                            invitationsId: inv._id,
                            jockeyName: inv.jockeyUser?.fullName ?? 'Unknown',
                            isBackup: inv.isBackup,
                            isJockeyInRace: reg.jockeyInRaceId?.toString() === inv._id.toString(),
                            status: inv.invitationStatus,
                            bookingFees: inv.bookingFees ?? 0,
                        })),
                        horseOwner: horseOwner
                            ? {
                                ownerId: horseOwner._id,
                                fullName: ownerUser?.fullName ?? null,
                            }
                            : null,
                    };
                })
            );

            return {
                code: 200,
                data: {
                    items,
                    pagination: {
                        totalItems,
                        totalPages,
                        currentPage: page,
                        limit,
                    },
                },
                msg: 'Horse owner invitations retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Get all referee invitations enriched with race round and referee user info
    async getRefereeInvitations(page = 1, limit = 5) {
        try {
            const skip = (page - 1) * limit;
            const RaceReferee = require('../entities/RaceReferee');

            const raceReferees = await RaceReferee.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('raceRoundId')
                .populate('refereeId')
                .lean();

            const totalItems = await RaceReferee.countDocuments();
            const totalPages = Math.ceil(totalItems / limit);

            const items = await Promise.all(raceReferees.map(async (rr) => {
                const raceRound = rr.raceRoundId || null;
                const referee = rr.refereeId || null;
                const refereeUser = referee ? await User.findById(referee._id).select('fullName').lean() : null;

                return {
                    raceRefereeId: rr._id,
                    raceReferee: {
                        status: rr.status,
                    },
                    raceRound: raceRound
                        ? {
                            raceRoundId: raceRound._id,
                            roundName: raceRound.roundName,
                            raceDate: raceRound.raceDate,
                            status: raceRound.status,
                        }
                        : null,
                    referee: referee
                        ? {
                            refereeId: referee._id,
                            user: {
                                fullName: refereeUser?.fullName ?? 'Unknown',
                            },
                        }
                        : null,
                };
            }));

            return {
                code: 200,
                data: {
                    items,
                    pagination: {
                        totalItems,
                        totalPages,
                        currentPage: page,
                        limit,
                    },
                },
                msg: 'Referee invitations retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Get all jockey invitations enriched with registration, race round, and sibling invitations
    async getJockeyInvitations(page = 1, limit = 5) {
        try {
            const skip = (page - 1) * limit;

            // Fetch all invitations
            const invitations = await Invitation.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('horseId')
                .populate({
                    path: 'registrationId',
                    populate: { path: 'raceRoundId' }
                })
                .populate('jockeyId')
                .lean();

            const totalItems = await Invitation.countDocuments();
            const totalPages = Math.ceil(totalItems / limit);

            // Fetch sibling invitations for the same registrations
            const registrationIds = invitations.map(inv => inv.registrationId?._id).filter(Boolean);
            const siblingInvitations = await Invitation.find({
                registrationId: { $in: registrationIds },
                invitationStatus: { $in: ['accepted', 'pending'] }
            }).populate('jockeyId').lean();

            const items = await Promise.all(invitations.map(async inv => {
                const reg = inv.registrationId || null;
                const raceRound = reg?.raceRoundId || null;
                const horse = inv.horseId || null;
                const jockey = inv.jockeyId || null;
                const jockeyUser = jockey ? await User.findById(jockey._id).select('fullName').lean() : null;

                const siblings = siblingInvitations.filter(sib => sib.registrationId?.toString() === reg?._id?.toString());
                for (let sib of siblings) {
                    if (sib.jockeyId) {
                        sib.jockeyUser = await User.findById(sib.jockeyId._id).select('fullName').lean();
                    }
                }

                return {
                    registrationId: reg ? reg._id : null,
                    registration: reg ? {
                        registrationAt: reg.registeredAt,
                        registrationStatus: reg.registrationStatus
                    } : null,
                    raceRound: raceRound ? {
                        raceRoundId: raceRound._id,
                        roundName: raceRound.roundName,
                        raceDate: raceRound.raceDate,
                        status: raceRound.status
                    } : null,
                    horse: horse ? {
                        horseId: horse._id,
                        horseName: horse.horseName
                    } : null,
                    invitations: siblings.map(sib => ({
                        invitationId: sib._id,
                        jockeyName: sib.jockeyUser?.fullName || 'Unknown',
                        isBackup: sib.isBackup,
                        isJockeyInRace: reg?.jockeyInRaceId?.toString() === sib._id.toString(),
                        invitationStatus: sib.invitationStatus,
                        bookingFees: sib.bookingFees ?? 0,
                    })),
                    jockey: jockey ? {
                        jockeyId: jockey._id,
                        user: {
                            fullName: jockeyUser?.fullName || 'Unknown'
                        }
                    } : null,
                    status: inv.invitationStatus,
                    invitationId: inv._id,
                    isBackup: inv.isBackup,
                    isJockeyInRace: reg?.jockeyInRaceId?.toString() === inv._id.toString()
                };
            }));

            return {
                code: 200,
                data: {
                    items,
                    pagination: {
                        totalItems,
                        totalPages,
                        currentPage: page,
                        limit,
                    },
                },
                msg: 'Jockey invitations retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Get tournaments enriched with race rounds and total prediction reward pool
    async getTournamentsWithDetails(page = 1, limit = 5, startDate, endDate, search) {
        try {
            const Tournament = require('../entities/Tournament');
            const RaceRound = require('../entities/RaceRound');
            const Registration = require('../entities/Registration');
            const Prediction = require('../entities/Prediction');

            // Two mutually exclusive fetch modes: a plain page/limit fetch
            // (table view), or a date-range fetch (calendar view) that
            // returns every matching tournament unpaginated — a month can't
            // be split across pages without breaking the calendar grid.
            // Date filtering only ever engages when BOTH bounds are given —
            // a lone startDate/endDate is ignored rather than partially
            // filtering (the controller already rejects that combo as a 400).
            const isDateRangeQuery = Boolean(startDate && endDate);

            // Overlap filter: include tournaments whose date span overlaps the
            // requested range, so a tournament spanning across a month
            // boundary still shows up on that month's calendar.
            const filter = { tournamentName: { $ne: 'Non-tournament' } };
            if (isDateRangeQuery) {
                filter.endDate = { $gte: new Date(startDate) };
                filter.startDate = { $lte: new Date(endDate) };
            }
            if (search) filter.tournamentName = { $regex: search, $options: 'i' };

            let tournamentQuery = Tournament.find(filter).sort({ createdAt: -1 });
            if (!isDateRangeQuery) {
                const skip = (page - 1) * limit;
                tournamentQuery = tournamentQuery.skip(skip).limit(limit);
            }

            const tournaments = await tournamentQuery.lean();

            const totalItems = await Tournament.countDocuments(filter);
            const totalPages = isDateRangeQuery ? 1 : Math.ceil(totalItems / limit);
            const currentPage = isDateRangeQuery ? 1 : page;
            const responseLimit = isDateRangeQuery ? totalItems : limit;

            const items = await Promise.all(
                tournaments.map(async (tournament) => {
                    // Fetch RaceRounds
                    const raceRounds = await RaceRound.find({ tournamentId: tournament._id }).lean();
                    const raceRoundIds = raceRounds.map(rr => rr._id);

                    // Fetch Registrations for these RaceRounds
                    const registrations = await Registration.find({ raceRoundId: { $in: raceRoundIds } }).lean();
                    const registrationIds = registrations.map(reg => reg._id);

                    // Fetch Predictions to calculate the total reward pool
                    const predictions = await Prediction.find({ registrationId: { $in: registrationIds } }).lean();

                    // Sum rewardPoints
                    const priceTotalPool = predictions.reduce((sum, pred) => sum + (pred.rewardPoints || 0), 0);

                    return {
                        tournament: tournament,
                        priceTotalPool: priceTotalPool,
                        raceRound: raceRounds
                    };
                })
            );

            return {
                code: 200,
                data: {
                    items,
                    pagination: {
                        totalItems,
                        totalPages,
                        currentPage,
                        limit: responseLimit,
                    },
                },
                msg: 'Tournaments retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Get tournament counts by status (live/upcoming/completed) — true totals
    // across every tournament, unaffected by the pagination/search above.
    async getTournamentStats() {
        try {
            const Tournament = require('../entities/Tournament');
            const baseFilter = { tournamentName: { $ne: 'Non-tournament' } };

            const [live, upcoming, completed] = await Promise.all([
                Tournament.countDocuments({ ...baseFilter, status: 'ongoing' }),
                Tournament.countDocuments({ ...baseFilter, status: 'scheduled' }),
                Tournament.countDocuments({ ...baseFilter, status: 'completed' }),
            ]);

            return {
                code: 200,
                data: { live, upcoming, completed },
                msg: 'Tournament stats retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async updateTournamentStats(tournament_id, status, io) {
        try {
            const tournament = await TournamentRepository.getTournamentById(tournament_id);
            if (!tournament) return { code: 404, msg: 'Tournament not found' };
            const raceRounds = await RaceRoundRepository.findByTournamentId(tournament_id);

            switch (status) {
                case 'completed': {
                    // A cancelled round is closed out, not "still ongoing" — only
                    // block completion on rounds that are neither completed nor cancelled.
                    const stillActive = raceRounds.some(rr => rr.status !== 'completed' && rr.status !== 'cancelled');
                    if (stillActive) {
                        return { code: 400, msg: 'All race rounds must be completed or cancelled before the tournament can be marked completed.' };
                    }
                    tournament.status = 'completed';
                    await tournament.save();
                    break;
                }
                case 'cancelled': {
                    // Cascade-cancel every round that isn't already finished, reusing
                    // the single-round cancel flow (referees/registrations/invitations
                    // cancelled, pending predictions refunded, notifications sent).
                    // Rounds that are 'running' or 'awaitingConfirmation' are left as-is —
                    // cancelRaceRound refuses those by design, and that's intentional here too.
                    const RaceRoundService = require('./RaceRoundService');
                    for (const rr of raceRounds) {
                        if (rr.status === 'completed' || rr.status === 'cancelled') continue;
                        const result = await RaceRoundService.cancelRaceRound(rr._id, io);
                        if (result.code !== 200) {
                            console.error(`[updateTournamentStats] could not cancel race round ${rr._id} (${rr.status}): ${result.message}`);
                        }
                    }
                    tournament.status = 'cancelled';
                    await tournament.save();
                    break;
                }
                case 'ongoing':
                    tournament.status = 'ongoing';
                    await tournament.save();
                    break;
                case 'scheduled':
                    if (tournament.status !== 'draft') {
                        return { code: 400, msg: `Tournament has already been ${tournament.status}` };
                    }
                    tournament.status = 'scheduled';
                    await tournament.save();
                    break;
                default:
                    return { code: 400, msg: 'Invalid status' };
            }

            if (io) {
                io.emit('tournament:status_changed', { tournamentId: String(tournament_id), status: tournament.status });
            }
            return { code: 200, msg: `Tournament ${status} successfully` };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Get Race Rounds
    async getRaceRounds(tournament_id = null, raceRound_id = null, page = 1, limit = 10, status = null, search = null, sortBy = 'raceDate', order = 'desc', raceType = null) {
        try {
            const skip = (page - 1) * limit;
            let query = {};
            if (tournament_id) query.tournamentId = tournament_id;
            if (raceRound_id) query._id = raceRound_id;
            if (status) query.status = status;
            if (search) query.roundName = { $regex: search, $options: 'i' };
            if (raceType) {
                const ruleIds = await RaceEligibilityRule.find({ raceType }).distinct('_id');
                query.eligibilityRuleId = { $in: ruleIds };
            }

            const sortObj = { [sortBy]: order === 'asc' ? 1 : -1 };

            const [raceRounds, totalItems] = await Promise.all([
                RaceRound.find(query).sort(sortObj).skip(skip).limit(limit).lean(),
                RaceRound.countDocuments(query),
            ]);

            const items = await Promise.all(raceRounds.map(async raceRound => {
                let raceType = raceRound.raceType || null;
                if (!raceType && raceRound.eligibilityRuleId) {
                    const rule = await RaceEligibilityRule.findById(raceRound.eligibilityRuleId).lean();
                    if (rule && rule.raceType) raceType = rule.raceType;
                }
                return { ...raceRound, RaceType: raceType };
            }));

            return {
                code: 200,
                data: {
                    items,
                    pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit },
                },
                msg: 'Race rounds retrieved successfully',
            };
        } catch (error) {
            console.error('Error fetching race rounds:', error);
            return { code: 500, msg: error.message };
        }
    }

    // Get distinct race types (sourced from RaceEligibilityRule — RaceRound has no
    // raceType field of its own, see getRaceRounds above), for filter dropdowns.
    // isActive: true/false narrows to active/inactive rules only; omitted (null) returns both.
    async getDistinctRaceTypes(isActive = null) {
        try {
            const query = { raceType: { $ne: null } };
            if (isActive !== null) query.isActive = isActive;
            const raceTypes = await RaceEligibilityRule.distinct('raceType', query);
            return { code: 200, data: raceTypes.sort(), msg: 'Race types retrieved successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Get Race Round Detail
    async getRaceRoundDetail(raceRound_id) {
        try {
            const raceRound = await RaceRound.findById(raceRound_id).lean();
            if (!raceRound) {
                return { code: 404, msg: 'Race round not found' };
            }

            let raceType = raceRound.raceType || null;
            if (!raceType && raceRound.eligibilityRuleId) {
                const rule = await RaceEligibilityRule.findById(raceRound.eligibilityRuleId).lean();
                if (rule && rule.raceType) raceType = rule.raceType;
            }

            const rrObj = {
                ...raceRound,
                RaceType: raceType,
                Referee: [],
                Registration: []
            };

            // Payment-verification rows for this race round (referee_fee, race_prize,
            // jockey_payout) — only exist once confirmRaceResult has run; absent before
            // that, which is the correct "no payment yet" state, not an error.
            const Transaction = require('../entities/Transaction');
            const payments = await Transaction.find({ raceRoundId: raceRound._id, paymentType: { $ne: null } }).lean();
            const paymentBySource = new Map(payments.map(p => [`${p.sourceType}:${p.sourceId}`, p]));

            const raceReferees = await RaceReferee.find({ raceRoundId: raceRound._id }).lean();
            rrObj.Referee = await Promise.all(
                raceReferees.map(async (rr) => {
                    const refereeUser = rr.refereeId
                        ? await User.findById(rr.refereeId, 'fullName').lean()
                        : null;
                    return {
                        refereeId: rr.refereeId,
                        fullName: refereeUser?.fullName ?? null,
                        assignmentStatus: rr.status,
                        fee: rr.fee,
                        payment: paymentBySource.get(`RaceReferee:${rr._id}`) || null,
                    };
                })
            );

            const registrations = await Registration.find({ raceRoundId: raceRound._id }).lean();

            for (const reg of registrations) {
                const predictions = await Prediction.find({ registrationId: reg._id }).lean();
                const sum_prediction = predictions.reduce((sum, p) => sum + (p.rewardPoints || 0), 0);
                const ownerUser = reg.horseOwnerId
                    ? await User.findById(reg.horseOwnerId, 'fullName').lean()
                    : null;

                const invitationFilter = { registrationId: reg._id };
                if (['completed', 'running', 'awaitingConfirmation'].includes(raceRound.status) && reg.jockeyInRaceId) {
                    invitationFilter._id = reg.jockeyInRaceId;
                } else {
                    invitationFilter.isBackup = false;
                }

                const invitation = await Invitation.findOne(invitationFilter)
                    .populate('horseId')
                    .populate('jockeyId')
                    .lean();

                if (invitation && invitation.jockeyId && invitation.jockeyId._id) {
                    const jockeyUser = await User.findById(invitation.jockeyId._id).select('fullName').lean();
                    if (jockeyUser) {
                        invitation.jockeyId._id = jockeyUser;
                    }
                }

                const raceResult = await RaceResult.findOne({ registrationId: reg._id }).lean();

                rrObj.Registration.push({
                    ...reg,
                    sum_prediction,
                    Horse: invitation ? invitation.horseId : null,
                    Jockey: invitation ? invitation.jockeyId : null,
                    isJockeyInRace: !!reg.jockeyInRaceId,
                    Owner: ownerUser,
                    RaceResult: raceResult || null,
                    prizePayment: raceResult ? (paymentBySource.get(`RaceResult:${raceResult._id}`) || null) : null,
                    jockeyPayment: invitation ? (paymentBySource.get(`Invitation:${invitation._id}`) || null) : null,
                });
            }

            // ── Prediction pools (grouped by method type) ─────────────────────────
            const POOL_TAKEOUT = { race_winner: 0.17, race_rank: 0.17 };

            const [winMethod, rankMethod] = await Promise.all([
                PredictionMethod.findOne({ methodType: 'race_winner', isActive: true }).select('_id').lean(),
                PredictionMethod.findOne({ methodType: 'race_rank', isActive: true }).select('_id').lean(),
            ]);

            const methodIdToType = {};
            const poolMethodIds = [];
            if (winMethod) { poolMethodIds.push(winMethod._id); methodIdToType[winMethod._id.toString()] = 'race_winner'; }
            if (rankMethod) { poolMethodIds.push(rankMethod._id); methodIdToType[rankMethod._id.toString()] = 'race_rank'; }

            // registrationId → horseName, built from the Registration array already assembled
            const regHorseMap = {};
            for (const entry of rrObj.Registration) {
                if (entry.Horse) regHorseMap[entry._id.toString()] = entry.Horse.horseName || null;
            }

            const allPreds = poolMethodIds.length
                ? await Prediction.find({
                    registrationId: { $in: registrations.map(r => r._id) },
                    predictionMethodId: { $in: poolMethodIds },
                }).lean()
                : [];

            // Group by methodType string
            const predsByType = {};
            for (const p of allPreds) {
                const mt = methodIdToType[p.predictionMethodId.toString()];
                if (!mt) continue;
                if (!predsByType[mt]) predsByType[mt] = [];
                predsByType[mt].push(p);
            }

            const predictionPools = [];
            let totalHouseEarning = 0;

            for (const methodType of ['race_winner', 'race_rank']) {
                const preds = predsByType[methodType] || [];
                const T = POOL_TAKEOUT[methodType];

                if (preds.length === 0) {
                    predictionPools.push({ methodType, poolStatus: 'empty', takeoutRate: T, grossPool: 0, netPool: 0, houseEarning: 0, totalBettors: 0, perHorse: [] });
                    continue;
                }

                const pending = preds.filter(p => p.predictionStatus === 'pending');
                const correct = preds.filter(p => p.predictionStatus === 'correct');
                const incorrect = preds.filter(p => p.predictionStatus === 'incorrect');
                const refunded = preds.filter(p => p.predictionStatus === 'refunded');

                if (pending.length > 0) {
                    // ── Live pool: bets still open ──────────────────────────────────
                    // Same parimutuel formulas PayoutService.distributeRacePayouts uses
                    // to actually settle these predictions once confirmRaceResult runs,
                    // so the admin preview here never drifts from the real payout.
                    const stakeByReg = {};
                    for (const p of pending) {
                        const rid = p.registrationId.toString();
                        stakeByReg[rid] = (stakeByReg[rid] || 0) + (p.rewardPoints || 0);
                    }
                    const P = PayoutService.grossPool(Object.values(stakeByReg));
                    const N = PayoutService.netPool(P, T);
                    const houseEarning = parseFloat((P * T).toFixed(2));
                    totalHouseEarning += houseEarning;

                    predictionPools.push({
                        methodType,
                        poolStatus: 'live',
                        takeoutRate: T,
                        grossPool: P,
                        netPool: parseFloat(N.toFixed(2)),
                        houseEarning,
                        totalBettors: pending.length,
                        perHorse: Object.entries(stakeByReg)
                            .map(([rid, Bi]) => ({
                                registrationId: rid,
                                horseName: regHorseMap[rid] || null,
                                totalStake: Bi,
                                poolShare: P > 0 ? parseFloat((Bi / P * 100).toFixed(2)) : 0,
                                odds: parseFloat(PayoutService.oddsForHorse(N, Bi).toFixed(4)),
                                displayPayout: parseFloat(PayoutService.totalCollect(1000, N, Bi).toFixed(2)),
                            }))
                            .sort((a, b) => b.totalStake - a.totalStake),
                    });
                } else {
                    // ── Settled / refunded pool ─────────────────────────────────────
                    const totalPaidOut = parseFloat(correct.reduce((s, p) => s + (p.rewardPoints || 0), 0).toFixed(2));

                    // race_winner identity: every bettor on the winning horse is correct,
                    // so Σ(correct payouts) = N exactly → P = N/(1-T).
                    // race_rank: bettors on the winning reg may have predicted different ranks,
                    // so some stakes in Bi are from wrong-rank bettors → N cannot be reconstructed.
                    const N_est = methodType === 'race_winner' ? totalPaidOut : null;
                    const P_est = N_est != null ? parseFloat((N_est / (1 - T)).toFixed(2)) : null;
                    const houseEarning = P_est != null ? parseFloat((P_est * T).toFixed(2)) : null;

                    if (houseEarning != null && refunded.length === 0) totalHouseEarning += houseEarning;

                    const allRefunded = refunded.length > 0 && correct.length === 0 && incorrect.length === 0;
                    predictionPools.push({
                        methodType,
                        poolStatus: allRefunded ? 'refunded' : 'settled',
                        takeoutRate: T,
                        grossPool: P_est,
                        netPool: N_est,
                        houseEarning: houseEarning != null ? houseEarning : null,
                        totalPaidOut,
                        totalWinners: correct.length,
                        totalLosers: incorrect.length,
                        totalRefunded: refunded.length,
                        totalBettors: preds.length,
                    });
                }
            }

            rrObj.predictionPools = predictionPools;
            rrObj.trackEarnings = {
                totalHouseEarning: parseFloat(totalHouseEarning.toFixed(2)),
                byPool: predictionPools.reduce((acc, p) => {
                    acc[p.methodType] = p.houseEarning != null ? p.houseEarning : null;
                    return acc;
                }, {}),
            };
            // ─────────────────────────────────────────────────────────────────────

            return { code: 200, data: rrObj, msg: 'Race round detail retrieved successfully' };
        } catch (error) {
            console.error('Error fetching race round detail:', error);
            return { code: 500, msg: error.message };
        }
    }

    // Get all metadata required for creating a race
    async getCreateRaceMetadata() {
        try {
            const [previousRaceTracks, activeTournaments, eligibilityRules, referees, ownersRaw] = await Promise.all([
                // 1. Get unique tracks (locations) and their grounds and addresses
                RaceRound.aggregate([
                    { $match: { location: { $ne: null, $ne: '' } } },
                    { $group: { _id: "$location", location: { $first: "$location" }, raceGround: { $first: "$raceGround" }, address: { $first: "$address" } } },
                    { $project: { _id: 0, location: 1, raceGround: 1, address: 1 } }
                ]),

                // 2. Get active/scheduled tournaments
                Tournament.find({ status: { $in: ['draft', 'scheduled', 'ongoing'] } }).lean(),

                // 3. Get eligibility rules
                RaceEligibilityRule.find({ isActive: true }).lean(),

                // 4. Get referees populated with name
                Referee.find().populate('_id', 'fullName').lean(),

                // 5. Get horse owners populated with name
                HorseOwner.find().populate('_id', 'fullName').lean()
            ]);

            // Enhance owners with their active horses and race results
            const owners = await Promise.all(
                ownersRaw.map(async (owner) => {
                    const activeHorsesRaw = await Horse.find({ ownerId: owner._id, status: 'active' }).lean();

                    const horses = await Promise.all(
                        activeHorsesRaw.map(async (horse) => {
                            // Find all invitations where this horse participated
                            const invitations = await Invitation.find({ horseId: horse._id, registrationId: { $ne: null } }).lean();
                            const registrationIds = invitations.map(inv => inv.registrationId);

                            // Find all race results for those registrations
                            const raceResults = await RaceResult.find({ registrationId: { $in: registrationIds } }).lean();

                            return {
                                ...horse,
                                raceResults
                            };
                        })
                    );

                    return {
                        _id: owner._id,
                        user: owner._id, // populated fullName object is here
                        horses
                    };
                })
            );

            return {
                code: 200,
                data: {
                    previousRaceTracks,
                    tournaments: activeTournaments,
                    eligibilityRules,
                    referees,
                    owners
                },
                msg: 'Create race metadata retrieved successfully'
            };
        } catch (error) {
            console.error('Error fetching create race metadata:', error);
            return { code: 500, msg: error.message };
        }
    }

    // --- Certification Verification ---

    async verifyCertification(userId, action, io) {
        try {
            if (!['approve', 'reject'].includes(action)) {
                return { code: 400, msg: "Action must be 'approve' or 'reject'" };
            }

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

    // --- Race Eligibility Rule CRUD ---

    async getAllRules(page = 1, limit = 10, search = null, sortBy = 'createdAt', order = 'desc') {
        try {
            const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
            const skip = (page - 1) * limit;
            const filter = {};
            if (search) {
                filter.$or = [
                    { raceType: { $regex: search, $options: 'i' } },
                    { gradeLevel: { $regex: search, $options: 'i' } },
                ];
            }
            const sortObj = { [sortBy]: order === 'asc' ? 1 : -1 };
            const [items, totalItems] = await Promise.all([
                RaceEligibilityRule.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
                RaceEligibilityRule.countDocuments(filter),
            ]);
            return {
                code: 200,
                data: {
                    items,
                    pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit },
                },
                msg: 'Race eligibility rules retrieved successfully',
            };
        } catch (error) {
            console.error('Error fetching rules:', error);
            return { code: 500, msg: error.message };
        }
    }

    async getRuleById(id) {
        try {
            const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
            const rule = await RaceEligibilityRule.findById(id).lean();
            if (!rule) {
                return { code: 404, msg: 'Race eligibility rule not found' };
            }
            return {
                code: 200,
                data: rule,
                msg: 'Race eligibility rule retrieved successfully'
            };
        } catch (error) {
            console.error('Error fetching rule:', error);
            return { code: 500, msg: error.message };
        }
    }

    async createRule(ruleData) {
        try {
            const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
            const newRule = new RaceEligibilityRule(ruleData);
            await newRule.save();
            return {
                code: 201,
                data: newRule,
                msg: 'Race eligibility rule created successfully'
            };
        } catch (error) {
            console.error('Error creating rule:', error);
            return { code: 500, msg: error.message };
        }
    }

    async updateRule(id, ruleData) {
        try {
            const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
            const updatedRule = await RaceEligibilityRule.findByIdAndUpdate(
                id,
                { $set: ruleData },
                { new: true, runValidators: true }
            ).lean();

            if (!updatedRule) {
                return { code: 404, msg: 'Race eligibility rule not found' };
            }
            return {
                code: 200,
                data: updatedRule,
                msg: 'Race eligibility rule updated successfully'
            };
        } catch (error) {
            console.error('Error updating rule:', error);
            return { code: 500, msg: error.message };
        }
    }

    async deleteRule(id) {
        try {
            const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
            const deletedRule = await RaceEligibilityRule.findByIdAndDelete(id).lean();

            if (!deletedRule) {
                return { code: 404, msg: 'Race eligibility rule not found' };
            }
            return {
                code: 200,
                data: null,
                msg: 'Race eligibility rule deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting rule:', error);
            return { code: 500, msg: error.message };
        }
    }
}



// Helper: get all registrationIds that belong to a given raceRoundId
async function getRegistrationIdsByRound(raceRoundId) {
    const regs = await require('../entities/Registration').find({ raceRoundId }, '_id').lean();
    return regs.map((r) => r._id);
}

// Appended to AdminService prototype after class definition
AdminService.prototype.setRaceRoundStatus = async function (raceRoundId, newStatus, io) {
    try {
        const allowed = ['running', 'cancelled'];
        if (!allowed.includes(newStatus)) {
            return { code: 400, msg: `status must be one of: ${allowed.join(', ')}` };
        }

        const raceRound = await RaceRound.findById(raceRoundId).lean();
        if (!raceRound) {
            return { code: 404, msg: 'Race round not found.' };
        }
        if (raceRound.status !== 'prepared') {
            return { code: 422, msg: `Race is currently "${raceRound.status}". Only "prepared" races can be started or cancelled by admin.` };
        }

        if (newStatus === 'running' && !raceRound.muxLiveStreamId) {
            return { code: 422, msg: 'A stream key must be created before starting the race. Use the "Create Stream Key" button first.' };
        }

        const updated = await RaceRound.findByIdAndUpdate(raceRoundId, { status: newStatus }, { new: true }).lean();

        if (io) {
            io.emit('race_status_changed', {
                raceRoundId,
                status: newStatus,
                timestamp: new Date(),
            });
        }

        if (newStatus === 'running') {
            // Start horse simulation (stream was already provisioned in prepared state)
            SimulationService.initializeSimulation(raceRoundId, io).catch(err => {
                console.error('[Sim] Failed to start simulation:', err);
            });
        }

        if (newStatus === 'cancelled') {
            PayoutService.refundRacePredictions(raceRoundId).catch(err =>
                console.error('[AdminService] refundRacePredictions error:', err.message)
            );
        }

        // Persisted notifications to associated participants
        const [participantRegs, participantRefs] = await Promise.all([
            Registration.find({ raceRoundId }, 'horseOwnerId').lean(),
            RaceReferee.find({ raceRoundId }, 'refereeId').lean(),
        ]);
        const participantRecipients = [
            ...participantRegs.map(r => r.horseOwnerId),
            ...participantRefs.map(r => r.refereeId),
        ];
        NotificationService.notify({
            recipientIds: participantRecipients,
            type: newStatus === 'running' ? 'race_started' : 'race_round_cancelled',
            title: newStatus === 'running' ? 'Race Round Started' : 'Race Round Cancelled',
            message: `Race round "${raceRound.roundName}" is now ${newStatus}.`,
            actionPayload: { entityType: 'RaceRound', entityId: raceRoundId },
        }, io).catch(err => console.error('[setRaceRoundStatus] notify error:', err.message));

        return { code: 200, data: updated, msg: `Race round status updated to "${newStatus}".` };
    } catch (error) {
        console.error('Error setting race round status:', error);
        return { code: 500, msg: error.message };
    }
};

// ── Admin quick-assign shortcut (testing/demo convenience) ────────────────────
// Fills in the setup step (horse + jockey) for registrations that haven't
// gotten there yet via the normal owner-approves / owner-hires-jockey /
// jockey-accepts flow, so the assigned referee's real review
// (verifyRegistration → finalizeRaceRound) has something to act on.
// Registrations already "approved" with an accepted main invitation are left
// untouched — this only fills gaps, never overwrites legitimate state. It
// never verifies, prepares, or starts the race itself.
AdminService.prototype.quickAssignHorsesAndJockeys = async function (raceRoundId) {
    try {
        const raceRound = await RaceRound.findById(raceRoundId).lean();
        if (!raceRound) return { code: 404, msg: 'Race round not found.' };
        if (raceRound.status !== 'scheduled') {
            return { code: 422, msg: `Race round is "${raceRound.status}" — quick-assign only applies to "scheduled" rounds.` };
        }

        const registrations = await Registration.find({ raceRoundId }).lean();
        if (!registrations.length) {
            return { code: 422, msg: 'Race round has no registrations to resolve.' };
        }

        const rule = raceRound.eligibilityRuleId
            ? await RaceEligibilityRule.findById(raceRound.eligibilityRuleId).lean()
            : null;

        // Mirrors the frontend's checkEligibility (CreateRaceModal.tsx) so an
        // auto-assigned horse is never one the admin's own UI would reject.
        const isHorseEligible = (horse, wins, racesRun) => {
            if (!rule) return true;
            if (horse.status !== 'active' || horse.healthStatus !== 'healthy') return false;
            if (rule.minRacesWon != null && wins < rule.minRacesWon) return false;
            if (rule.minRacesRun != null && racesRun < rule.minRacesRun) return false;
            const age = horse.dateOfBirth ? (new Date().getFullYear() - new Date(horse.dateOfBirth).getFullYear()) : 0;
            if (rule.minAge != null && age < rule.minAge) return false;
            if (rule.maxAge != null && age > rule.maxAge) return false;
            if (rule.requiredGender && rule.requiredGender !== 'both' && rule.requiredGender !== horse.gender) return false;
            if (rule.requiredBreed && rule.requiredBreed !== horse.breed) return false;
            return true;
        };

        const regIds = registrations.map(r => r._id);
        const existingInvitations = await Invitation.find({ registrationId: { $in: regIds } }).lean();
        const acceptedMainByReg = new Map(
            existingInvitations
                .filter(inv => !inv.isBackup && inv.invitationStatus === 'accepted')
                .map(inv => [String(inv.registrationId), inv])
        );
        const pendingMainByReg = new Map(
            existingInvitations
                .filter(inv => !inv.isBackup && inv.invitationStatus === 'pending')
                .map(inv => [String(inv.registrationId), inv])
        );

        const jockeys = await Jockey.find().lean();
        const usedHorseIds = new Set();
        const usedJockeyIds = new Set();
        let jockeyCursor = 0;

        let assigned = 0, alreadyReady = 0, completed = 0, excluded = 0, skipped = 0, overLimit = 0;
        const maxParticipants = raceRound.maxParticipants;

        // Registrations that are rejected/cancelled are never touched, and
        // registrations with a pending real invitation (owner already hired a
        // specific jockey for a specific horse — just awaiting their
        // response) get fast-forwarded ahead of fresh-pick candidates so a
        // real, already-committed pairing isn't bumped out of a scarce slot
        // by a speculative auto-pick.
        const actionable = registrations.filter(
            reg => reg.registrationStatus !== 'rejected' && reg.registrationStatus !== 'cancelled'
        );
        excluded = registrations.length - actionable.length;

        const fastForwardRegs = [];
        const freshPickRegs = [];
        for (const reg of actionable) {
            const alreadyDone = reg.registrationStatus === 'approved' && acceptedMainByReg.has(String(reg._id));
            if (alreadyDone) {
                alreadyReady++;
                if (reg.horseId) usedHorseIds.add(String(reg.horseId));
                const inv = acceptedMainByReg.get(String(reg._id));
                if (inv?.jockeyId) usedJockeyIds.add(String(inv.jockeyId));
                continue;
            }
            const canFastForward = reg.registrationStatus === 'approved' && pendingMainByReg.has(String(reg._id));
            if (canFastForward) {
                fastForwardRegs.push(reg);
            } else {
                freshPickRegs.push(reg);
            }
        }

        for (const reg of fastForwardRegs) {
            // Never assign past the race round's participant cap.
            if (alreadyReady + completed + assigned >= maxParticipants) {
                overLimit++;
                continue;
            }

            const pendingInv = pendingMainByReg.get(String(reg._id));
            await Invitation.findByIdAndUpdate(pendingInv._id, {
                ownerConfirmation: true,
                jockeyConfirmation: true,
                invitationStatus: 'accepted',
            });
            // Trust the owner's/jockey's real prior choice — never replace
            // the horse/jockey already on this invitation.
            if (pendingInv.horseId) usedHorseIds.add(String(pendingInv.horseId));
            if (pendingInv.jockeyId) usedJockeyIds.add(String(pendingInv.jockeyId));
            completed++;
        }

        for (const reg of freshPickRegs) {
            // Never assign past the race round's participant cap.
            if (alreadyReady + completed + assigned >= maxParticipants) {
                overLimit++;
                continue;
            }

            const ownerHorses = await Horse.find({ ownerId: reg.horseOwnerId, status: 'active' }).lean();
            let eligibleHorse = null;
            for (const horse of ownerHorses) {
                if (usedHorseIds.has(String(horse._id))) continue;
                const horseInvitations = await Invitation.find({ horseId: horse._id, registrationId: { $ne: null } }).lean();
                const resultRegIds = horseInvitations.map(inv => inv.registrationId);
                const results = await RaceResult.find({ registrationId: { $in: resultRegIds } }).lean();
                const wins = results.filter(r => r.finishPosition === 1).length;
                const racesRun = results.length;
                if (isHorseEligible(horse, wins, racesRun)) {
                    eligibleHorse = horse;
                    break;
                }
            }
            if (!eligibleHorse) {
                skipped++;
                continue;
            }

            let jockey = null;
            if (jockeys.length) {
                for (let i = 0; i < jockeys.length; i++) {
                    const candidate = jockeys[(jockeyCursor + i) % jockeys.length];
                    if (!usedJockeyIds.has(String(candidate._id))) {
                        jockey = candidate;
                        jockeyCursor = (jockeyCursor + i + 1) % jockeys.length;
                        break;
                    }
                }
                if (!jockey) jockey = jockeys[jockeyCursor % jockeys.length]; // all reused — fall back
            }
            if (!jockey) {
                skipped++;
                continue;
            }

            usedHorseIds.add(String(eligibleHorse._id));
            usedJockeyIds.add(String(jockey._id));

            await Registration.findByIdAndUpdate(reg._id, {
                horseId: eligibleHorse._id,
                registrationStatus: 'approved',
            });

            // Any pending-and-approved main invitation was already siphoned
            // off into fastForwardRegs above, so anything found here is a
            // dead (declined/cancelled) leftover row, safe to reuse/overwrite.
            const existingNonAccepted = existingInvitations.find(
                inv => !inv.isBackup && String(inv.registrationId) === String(reg._id)
            );
            if (existingNonAccepted) {
                await Invitation.findByIdAndUpdate(existingNonAccepted._id, {
                    horseId: eligibleHorse._id,
                    jockeyId: jockey._id,
                    ownerConfirmation: true,
                    jockeyConfirmation: true,
                    invitationStatus: 'accepted',
                });
            } else {
                await Invitation.create({
                    horseId: eligibleHorse._id,
                    jockeyId: jockey._id,
                    registrationId: reg._id,
                    ownerConfirmation: true,
                    jockeyConfirmation: true,
                    invitationStatus: 'accepted',
                    isBackup: false,
                    percentagePayout: 10,
                    bookingFees: jockey.bookingFee ?? 0,
                });
            }

            assigned++;
        }

        return {
            code: 200,
            data: { assigned, alreadyReady, completed, excluded, skipped, overLimit, total: registrations.length },
            msg: `${assigned} registration(s) auto-assigned, ${completed} completed (pending invitation fast-forwarded), `
                + `${alreadyReady} already ready, ${skipped} skipped (no eligible horse/jockey)`
                + (excluded ? `, ${excluded} excluded (rejected/cancelled)` : '')
                + (overLimit ? `, ${overLimit} skipped (race round full)` : '') + '.',
        };
    } catch (error) {
        console.error('Error in quickAssignHorsesAndJockeys:', error);
        return { code: 500, msg: error.message };
    }
};

// GET all violations for a race round (all referees combined)
AdminService.prototype.getRaceViolations = async function (raceRoundId) {
    try {
        const raceRound = await RaceRound.findById(raceRoundId).lean();
        if (!raceRound) return { code: 404, msg: 'Race round not found.' };

        const violations = await Violation.find({ raceRoundId })
            .populate('violationTypeId', 'violationName type category severity defaultPenalty')
            .populate('registrationId', '_id registrationStatus')
            .populate('raceRefereeId', '_id refereeId')
            .sort({ created_at: -1 })
            .lean();

        return { code: 200, data: violations, msg: 'Race violations retrieved.' };
    } catch (error) {
        return { code: 500, msg: error.message };
    }
};

// PATCH soft-delete (dismiss) a single violation
AdminService.prototype.dismissViolation = async function (violationId) {
    try {
        const violation = await Violation.findById(violationId).lean();
        if (!violation) return { code: 404, msg: 'Violation not found.' };

        const updated = await Violation.findByIdAndUpdate(
            violationId,
            { violationStatus: 'dismissed' },
            { new: true }
        ).lean();

        return { code: 200, data: updated, msg: 'Violation dismissed.' };
    } catch (error) {
        return { code: 500, msg: error.message };
    }
};

// POST confirm race results → mark all results official, close race
AdminService.prototype.confirmRaceResult = async function (raceRoundId, adminId, io) {
    try {
        const raceRound = await RaceRound.findById(raceRoundId).lean();
        if (!raceRound) return { code: 404, msg: 'Race round not found.' };
        if (raceRound.status !== 'awaitingConfirmation' && raceRound.status !== 'completed') {
            return { code: 422, msg: `Cannot confirm results for a race with status "${raceRound.status}". Race must be in "awaitingConfirmation" state.` };
        }

        // Re-confirming an already-completed race is allowed (payments are
        // deduped via PaymentService.createIfNotExists), but jockey stat
        // increments below have no such per-call dedup key — only apply them
        // the first time this race round is confirmed.
        const isFirstConfirmation = raceRound.status !== 'completed';

        // This is triggered by the referee's confirm-result action, not an admin
        // directly — so `adminId` here is actually the referee's own user id.
        // The race round's owning admin is who actually owes the payouts, so
        // that's who payment Transactions must be attributed to.
        const payerAdminId = raceRound.createdByAdminId || adminId;

        // Mark all pending_confirmation results as official and stamp publishedByAdminId
        await RaceResult.updateMany(
            { raceRoundId },
            { resultStatus: 'official', publishedByAdminId: payerAdminId }
        );

        // Update race round to completed
        const updatedRace = await RaceRound.findByIdAndUpdate(
            raceRoundId,
            { status: 'completed' },
            { new: true }
        ).lean();

        // Fetch enriched results to return
        const results = await RaceResult.find({ raceRoundId })
            .populate('registrationId')
            .sort({ finishPosition: 1 })
            .lean();

        // ── Payment records: race_prize (admin→horseOwner) + jockey_payout (horseOwner→jockey) ──
        const originalCurrency = raceRound.currencyType || 'VND';
        const createdPayments = [];
        const participantJockeyIds = [];
        for (const result of results) {
            const registration = result.registrationId;
            if (!registration) continue;

            if (result.prizeMoney > 0 && registration.horseOwnerId) {
                const payment = await PaymentService.createIfNotExists({
                    paymentType: 'race_prize',
                    payerRole: 'admin',
                    payerId: payerAdminId,
                    payeeRole: 'horseowner',
                    payeeId: registration.horseOwnerId,
                    amount: CurrencyConverter.convertToVnd(result.prizeMoney, originalCurrency),
                    originalAmount: result.prizeMoney,
                    originalCurrency,
                    sourceType: 'RaceResult',
                    sourceId: result._id,
                    raceRoundId,
                });
                createdPayments.push(payment);
            }

            if (registration.jockeyInRaceId) {
                const invitation = await Invitation.findById(registration.jockeyInRaceId).lean();
                if (invitation && invitation.jockeyId) {
                    participantJockeyIds.push(String(invitation.jockeyId));
                    const isNoShow = invitation.invitationStatus === 'didNotAttend';
                    const percentageCut = (!isNoShow && result.prizeMoney > 0)
                        ? Math.round((invitation.percentagePayout / 100) * result.prizeMoney)
                        : 0;
                    const bookingFeeAmount = isNoShow ? 0 : (invitation.bookingFees || 0);
                    const payoutAmount = bookingFeeAmount + percentageCut;

                    // A no-show never actually raced — only real starters count
                    // toward matchesRaced/totalWins. Only on first confirmation
                    // (see isFirstConfirmation above) to avoid double-counting.
                    if (!isNoShow && isFirstConfirmation) {
                        await JockeyRepository.incrementRaceStats(invitation.jockeyId, { won: result.finishPosition === 1 });
                    }

                    if (payoutAmount > 0 && registration.horseOwnerId) {
                        const payment = await PaymentService.createIfNotExists({
                            paymentType: 'jockey_payout',
                            payerRole: 'horseowner',
                            payerId: registration.horseOwnerId,
                            payeeRole: 'jockey',
                            payeeId: invitation.jockeyId,
                            amount: CurrencyConverter.convertToVnd(payoutAmount, originalCurrency),
                            originalAmount: payoutAmount,
                            originalCurrency,
                            sourceType: 'Invitation',
                            sourceId: invitation._id,
                            raceRoundId,
                        });
                        createdPayments.push(payment);
                    }
                }
            }
        }

        // ── Payment records: referee_fee (admin→referee) ──
        const refereeAssignments = await RaceReferee.find({ raceRoundId, status: 'assigned' }).lean();
        for (const assignment of refereeAssignments) {
            if (assignment.fee > 0) {
                const payment = await PaymentService.createIfNotExists({
                    paymentType: 'referee_fee',
                    payerRole: 'admin',
                    payerId: payerAdminId,
                    payeeRole: 'referee',
                    payeeId: assignment.refereeId,
                    amount: CurrencyConverter.convertToVnd(assignment.fee, originalCurrency),
                    originalAmount: assignment.fee,
                    originalCurrency,
                    sourceType: 'RaceReferee',
                    sourceId: assignment._id,
                    raceRoundId,
                });
                createdPayments.push(payment);
            }
        }

        // ── Persisted notifications: race_completed to participants, payment_created per new payment ──
        const participantHorseOwnerIds = [...new Set(
            results.map(r => r.registrationId?.horseOwnerId).filter(Boolean).map(String)
        )];
        const participantRefereeIds = refereeAssignments.map(a => String(a.refereeId));
        NotificationService.notify({
            recipientIds: [...participantHorseOwnerIds, ...participantJockeyIds, ...participantRefereeIds],
            type: 'race_completed',
            title: 'Race Results Confirmed',
            message: `Results for "${raceRound.roundName}" have been officially confirmed.`,
            actionPayload: { entityType: 'RaceRound', entityId: raceRoundId },
        }, io).catch(err => console.error('[confirmRaceResult] race_completed notify error:', err.message));

        for (const payment of createdPayments) {
            if (!payment) continue;
            NotificationService.notify({
                recipientIds: [payment.payeeId],
                type: 'payment_created',
                title: 'New Payment Awaiting Confirmation',
                message: `A payment of ${payment.amount} (${payment.paymentType}) has been recorded for you to confirm.`,
                actionPayload: { entityType: 'Transaction', entityId: payment._id },
            }, io).catch(err => console.error('[confirmRaceResult] payment_created notify error:', err.message));
        }

        // Settle pending race predictions in the background (non-blocking)
        this._settlePredictionsForRace(raceRoundId).catch(err =>
            console.error('[confirmRaceResult] settle predictions error:', err.message)
        );

        if (io) {
            io.emit('race_status_changed', {
                raceRoundId,
                status: 'completed',
                timestamp: new Date(),
            });

            // Reshape the populated `results` into the FinishResult wire format
            // (registrationId as a plain string, horseName/jockeyName resolved) —
            // sending the raw populated Registration object as `registrationId`
            // breaks React keys and identity comparisons on the client.
            const regIds = results.map(r => r.registrationId?._id).filter(Boolean);
            const invitations = regIds.length
                ? await Invitation.find({ registrationId: { $in: regIds }, isBackup: false }).lean()
                : [];
            const invByReg = new Map(invitations.map(inv => [String(inv.registrationId), inv]));

            const horseIds = invitations.map(inv => inv.horseId).filter(Boolean);
            const jockeyIds = invitations.map(inv => inv.jockeyId).filter(Boolean);
            const [horseDocs, jockeyUserDocs] = await Promise.all([
                horseIds.length ? Horse.find({ _id: { $in: horseIds } }, 'horseName').lean() : [],
                jockeyIds.length ? User.find({ _id: { $in: jockeyIds } }, 'fullName').lean() : [],
            ]);
            const horseMap = new Map(horseDocs.map(h => [String(h._id), h.horseName]));
            const jockeyMap = new Map(jockeyUserDocs.map(u => [String(u._id), u.fullName]));

            const socketResults = results.map(r => {
                const invitation = invByReg.get(String(r.registrationId?._id));
                return {
                    registrationId: r.registrationId?._id ? String(r.registrationId._id) : null,
                    horseName: (invitation && horseMap.get(String(invitation.horseId))) ?? '',
                    jockeyName: (invitation && jockeyMap.get(String(invitation.jockeyId))) ?? '',
                    finishPosition: r.finishPosition,
                    finishTime: r.finishTime,
                    distance: r.distance ?? 0,
                };
            });

            io.to(`race:${raceRoundId}`).emit('race_results_confirmed', {
                raceRoundId,
                results: socketResults,
                timestamp: new Date(),
            });
        }

        return { code: 200, data: { raceRound: updatedRace, results }, msg: 'Race results confirmed and race marked as completed.' };
    } catch (error) {
        return { code: 500, msg: error.message };
    }
};

// POST provision a Mux live stream for a prepared race (idempotent — returns existing if already created)
AdminService.prototype.createStreamForRace = async function (raceRoundId) {
    try {
        const raceRound = await RaceRound.findById(raceRoundId).lean();
        if (!raceRound) return { code: 404, msg: 'Race round not found.' };
        if (raceRound.status !== 'prepared') {
            return { code: 422, msg: 'A stream can only be created for races in "prepared" status.' };
        }
        // Idempotent: return existing stream info if already provisioned
        if (raceRound.muxLiveStreamId) {
            const info = await MuxService.getStreamInfo(raceRoundId);
            return { code: 200, data: info, msg: 'Stream already exists.' };
        }
        const info = await MuxService.createLiveStream(raceRoundId);
        return {
            code: 201,
            data: {
                rtmpUrl: 'rtmps://global-live.mux.com:443/app',
                streamKey: info.streamKey,
                playbackId: info.livePlaybackId,
            },
            msg: 'Live stream created successfully.',
        };
    } catch (error) {
        return { code: 500, msg: error.message };
    }
};

// GET Mux stream info (RTMP URL + stream key for OBS, playback ID for viewer)
AdminService.prototype.getStreamInfo = async function (raceRoundId) {
    try {
        const raceRound = await RaceRound.findById(raceRoundId).lean();
        if (!raceRound) return { code: 404, msg: 'Race round not found.' };
        if (raceRound.status !== 'running' && raceRound.status !== 'prepared') {
            return { code: 422, msg: 'Stream info is only available for prepared or running races.' };
        }
        if (!raceRound.muxLiveStreamId) {
            return { code: 404, msg: 'No stream has been created for this race yet.' };
        }
        const info = await MuxService.getStreamInfo(raceRoundId);
        if (!info) return { code: 404, msg: 'No live stream found for this race.' };
        return { code: 200, data: info, msg: 'Stream info retrieved.' };
    } catch (error) {
        return { code: 500, msg: error.message };
    }
};

// GET Mux VOD playback ID after the live stream ends
AdminService.prototype.getVOD = async function (raceRoundId) {
    try {
        const raceRound = await RaceRound.findById(raceRoundId).lean();
        if (!raceRound) return { code: 404, msg: 'Race round not found.' };

        // Use cached VOD playback ID from DB first
        if (raceRound.muxVodPlaybackId) {
            return { code: 200, data: { vodPlaybackId: raceRound.muxVodPlaybackId }, msg: 'VOD retrieved.' };
        }

        const vod = await MuxService.getVOD(raceRoundId);
        if (!vod) return { code: 404, msg: 'VOD not yet available — the stream may still be processing.' };
        return { code: 200, data: vod, msg: 'VOD retrieved.' };
    } catch (error) {
        return { code: 500, msg: error.message };
    }
};

// GET current live simulation snapshot (in-memory state)
AdminService.prototype.getSimulationState = function (raceRoundId) {
    try {
        const SimulationService = require('./SimulationService');
        const state = SimulationService.getSimulationState(raceRoundId);
        if (!state) return { code: 404, msg: 'No active simulation for this race round.' };
        return { code: 200, data: state, msg: 'Simulation state retrieved.' };
    } catch (error) {
        return { code: 500, msg: error.message };
    }
};

AdminService.prototype.getImportantEvents = async function () {
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
};

// ── Horse Management ──────────────────────────────────────────────────────────

AdminService.prototype.getAllHorses = async function (page = 1, limit = 10, search, status, sortBy = 'createdAt', order = 'desc') {
    try {
        const query = {};
        if (search) query.$or = [
            { horseName: { $regex: search, $options: 'i' } },
            { breed: { $regex: search, $options: 'i' } },
        ];
        if (status) query.status = status;

        const [total, horses] = await Promise.all([
            Horse.countDocuments(query),
            Horse.find(query)
                .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
        ]);

        const ownerIds = [...new Set(horses.map(h => h.ownerId.toString()))];
        const owners = ownerIds.length
            ? await User.find({ _id: { $in: ownerIds } }, 'fullName').lean()
            : [];
        const ownerMap = Object.fromEntries(owners.map(u => [u._id.toString(), u.fullName]));

        const items = horses.map(h => ({
            horseId: h._id,
            horseName: h.horseName,
            breed: h.breed ?? null,
            gender: h.gender ?? null,
            healthStatus: h.healthStatus,
            status: h.status,
            registrationDate: h.registrationDate ?? null,
            dateOfBirth: h.dateOfBirth ?? null,
            img: h.img ?? null,
            ownerId: h.ownerId,
            ownerName: ownerMap[h.ownerId.toString()] ?? null,
            createdAt: h.createdAt,
        }));

        return {
            code: 200,
            data: {
                items,
                pagination: {
                    totalItems: total,
                    totalPages: Math.ceil(total / limit),
                    currentPage: page,
                    limit,
                },
            },
            msg: 'Horses retrieved successfully.',
        };
    } catch (error) {
        return { code: 500, msg: error.message };
    }
};

AdminService.prototype.getHorseDetail = async function (horseId) {
    try {
        const horse = await Horse.findById(horseId).lean();
        if (!horse) return { code: 404, msg: 'Horse not found.' };

        const owner = await User.findById(horse.ownerId, 'fullName email').lean();

        const invitations = await Invitation.find({ horseId: horse._id }).lean();
        const regIds = invitations.map(i => i.registrationId).filter(Boolean);

        const [registrations, results, violations] = await Promise.all([
            regIds.length
                ? Registration.find({ _id: { $in: regIds } })
                    .populate('raceRoundId', 'roundName raceDate location status')
                    .lean()
                : [],
            regIds.length ? RaceResult.find({ registrationId: { $in: regIds } }).lean() : [],
            regIds.length
                ? Violation.find({ registrationId: { $in: regIds } })
                    .populate('violationTypeId', 'violationName category severity')
                    .lean()
                : [],
        ]);

        const resultMap = Object.fromEntries(results.map(r => [r.registrationId.toString(), r]));
        const violationMap = {};
        for (const v of violations) {
            const key = v.registrationId?.toString();
            if (key) (violationMap[key] = violationMap[key] || []).push(v);
        }

        const raceHistory = registrations.map(reg => {
            const rid = reg._id.toString();
            return {
                registrationId: reg._id,
                registrationStatus: reg.registrationStatus,
                roundName: reg.raceRoundId?.roundName ?? null,
                raceDate: reg.raceRoundId?.raceDate ?? null,
                location: reg.raceRoundId?.location ?? null,
                raceStatus: reg.raceRoundId?.status ?? null,
                finishPosition: resultMap[rid]?.finishPosition ?? null,
                finishTime: resultMap[rid]?.finishTime ?? null,
                prizeMoney: resultMap[rid]?.prizeMoney ?? 0,
                resultStatus: resultMap[rid]?.resultStatus ?? null,
                distance: resultMap[rid]?.distance ?? null,
                violations: (violationMap[rid] ?? []).map(v => ({
                    violationId: v._id,
                    typeName: v.violationTypeId?.violationName ?? null,
                    category: v.violationTypeId?.category ?? null,
                    severity: v.severity ?? v.violationTypeId?.severity ?? null,
                    stewardAction: v.stewardAction ?? null,
                    violationStatus: v.violationStatus,
                })),
            };
        });

        return {
            code: 200,
            data: {
                horse: { ...horse, horseId: horse._id },
                owner: { ownerId: owner?._id ?? null, fullName: owner?.fullName ?? null, email: owner?.email ?? null },
                totalRaces: raceHistory.length,
                totalViolations: violations.length,
                raceHistory,
            },
            msg: 'Horse detail retrieved successfully.',
        };
    } catch (error) {
        return { code: 500, msg: error.message };
    }
};

AdminService.prototype.updateHorseStatus = async function (horseId, newStatus) {
    try {
        if (!['active', 'inactive', 'retired'].includes(newStatus))
            return { code: 400, msg: 'Invalid status. Must be active, inactive, or retired.' };
        const horse = await Horse.findByIdAndUpdate(
            horseId,
            { status: newStatus },
            { new: true }
        ).lean();
        if (!horse) return { code: 404, msg: 'Horse not found.' };
        return { code: 200, data: horse, msg: `Horse status updated to ${newStatus}.` };
    } catch (error) {
        return { code: 500, msg: error.message };
    }
};

// Settle race-level predictions after a race round is confirmed completed.
// Called internally by confirmRaceResult.
AdminService.prototype._settlePredictionsForRace = async function (raceRoundId) {
    await PayoutService.distributeRacePayouts(raceRoundId);
};

// Settle tournament_champion predictions after admin sets the champion horse.
AdminService.prototype.settleTournamentPredictions = async function (tournamentId, championHorseId) {
    try {
        const Tournament = require('../entities/Tournament');
        const Prediction = require('../entities/Prediction');
        const Spectator = require('../entities/Spectator');
        const Horse = require('../entities/Horse');

        const tournament = await Tournament.findById(tournamentId).lean();
        if (!tournament) return { code: 404, msg: 'Tournament not found' };

        const horse = await Horse.findById(championHorseId).lean();
        if (!horse) return { code: 404, msg: 'Champion horse not found' };

        await Tournament.findByIdAndUpdate(tournamentId, { championHorseId });

        const result = await PayoutService.distributeTournamentPayouts(tournamentId, championHorseId);

        return {
            code: 200,
            data: result.data,
            msg: `Tournament champion set and predictions settled`,
        };
    } catch (error) {
        return { code: 500, msg: error.message };
    }
};

// Get single tournament with its race rounds and auto-complete if end date passed.
AdminService.prototype.getTournamentDetail = async function (tournamentId) {
    try {
        const Tournament = require('../entities/Tournament');
        const RaceRound = require('../entities/RaceRound');
        const Registration = require('../entities/Registration');
        const Horse = require('../entities/Horse');

        let tournament = await Tournament.findById(tournamentId).lean();
        if (!tournament) return { code: 404, msg: 'Tournament not found' };

        // Auto-complete: if endDate has passed and tournament is still 'ongoing'
        const now = new Date();
        if (tournament.endDate && new Date(tournament.endDate) <= now && tournament.status === 'ongoing') {
            const rankResult = await this.getTournamentRanking(tournamentId);
            if (rankResult.code === 200 && rankResult.data.length > 0) {
                const topHorseId = rankResult.data[0].horseId;
                await Tournament.findByIdAndUpdate(tournamentId, { status: 'completed' });
                await this.settleTournamentPredictions(tournamentId, topHorseId);
                tournament = await Tournament.findById(tournamentId).lean();
            }
        }

        const raceRounds = await RaceRound.find({ tournamentId }).sort({ raceDate: 1 }).lean();

        const raceRoundsWithCount = await Promise.all(
            raceRounds.map(async (rr) => {
                const participantCount = await Registration.countDocuments({
                    raceRoundId: rr._id,
                    registrationStatus: { $in: ['approved', 'verified'] },
                });
                return { ...rr, participantCount };
            })
        );

        let championHorseName = null;
        if (tournament.championHorseId) {
            const champ = await Horse.findById(tournament.championHorseId, 'horseName').lean();
            championHorseName = champ?.horseName ?? null;
        }

        return {
            code: 200,
            data: {
                tournament: { ...tournament, championHorseName },
                raceRounds: raceRoundsWithCount,
            },
            msg: 'Tournament detail retrieved successfully',
        };
    } catch (error) {
        return { code: 500, msg: error.message };
    }
};

// Aggregate official race results across all rounds of a tournament and rank horses by score.
// roundBreakdown covers every tournament round — type:'result'|'no_result'|'not_registered'.
AdminService.prototype.getTournamentRanking = async function (tournamentId) {
    try {
        const RaceRound = require('../entities/RaceRound');
        const Registration = require('../entities/Registration');
        const RaceResult = require('../entities/RaceResult');
        const Horse = require('../entities/Horse');
        const User = require('../entities/User');

        const SCORE_MAP = { 1: 60, 2: 40, 3: 30, 4: 20 };
        const calcScore = (pos) => SCORE_MAP[pos] ?? 10;

        // Sort by date so roundBreakdown columns are in chronological order
        const raceRounds = await RaceRound.find({ tournamentId }).sort({ raceDate: 1 }).lean();
        if (!raceRounds.length) return { code: 200, data: [], msg: 'No race rounds in this tournament' };

        const roundIds = raceRounds.map(r => r._id);

        // All registrations across all rounds
        const registrations = await Registration.find({ raceRoundId: { $in: roundIds } }).lean();
        const regById = Object.fromEntries(registrations.map(r => [r._id.toString(), r]));
        const regIds = registrations.map(r => r._id);

        // horseRoundReg[horseId][roundId] = registration
        const horseRoundReg = {};
        for (const reg of registrations) {
            if (!reg.horseId) continue;
            const hk = reg.horseId.toString();
            const rk = reg.raceRoundId.toString();
            if (!horseRoundReg[hk]) horseRoundReg[hk] = {};
            horseRoundReg[hk][rk] = reg;
        }

        // Official results only
        const results = await RaceResult.find({
            registrationId: { $in: regIds },
            resultStatus: 'official',
        }).lean();
        const resultByRegId = Object.fromEntries(results.map(r => [r.registrationId.toString(), r]));

        // Accumulate score/wins/podiums from official results
        const horseStats = {};
        for (const result of results) {
            const reg = regById[result.registrationId.toString()];
            if (!reg?.horseId) continue;
            const key = reg.horseId.toString();
            if (!horseStats[key]) {
                horseStats[key] = {
                    horseId: reg.horseId, ownerId: reg.horseOwnerId,
                    score: 0, totalRaces: 0, wins: 0, podiums: 0, totalPrizeMoney: 0,
                };
            }
            const s = horseStats[key];
            const pos = result.finishPosition;
            s.score += calcScore(pos);
            s.totalRaces += 1;
            if (pos === 1) s.wins += 1;
            if (pos <= 3) s.podiums += 1;
            s.totalPrizeMoney += result.prizeMoney || 0;
        }

        // Also surface horses that only have registrations (score stays 0)
        for (const reg of registrations) {
            if (!reg.horseId) continue;
            const key = reg.horseId.toString();
            if (!horseStats[key]) {
                horseStats[key] = {
                    horseId: reg.horseId, ownerId: reg.horseOwnerId,
                    score: 0, totalRaces: 0, wins: 0, podiums: 0, totalPrizeMoney: 0,
                };
            }
        }

        const entries = Object.values(horseStats);
        if (!entries.length) return { code: 200, data: [], msg: 'No registered horses yet' };

        // Batch-fetch names (HorseOwner._id === User._id, so query User directly)
        const horseIds = [...new Set(entries.map(e => e.horseId.toString()))];
        const ownerIds = [...new Set(entries.map(e => e.ownerId?.toString()).filter(Boolean))];
        const [horses, owners] = await Promise.all([
            Horse.find({ _id: { $in: horseIds } }, 'horseName img').lean(),
            User.find({ _id: { $in: ownerIds } }, 'fullName').lean(),
        ]);
        const horseNameMap = Object.fromEntries(horses.map(h => [h._id.toString(), h]));
        const ownerNameMap = Object.fromEntries(owners.map(u => [u._id.toString(), u.fullName]));

        // Sort: score desc, wins desc, totalPrizeMoney desc
        entries.sort((a, b) =>
            b.score - a.score ||
            b.wins - a.wins ||
            b.totalPrizeMoney - a.totalPrizeMoney
        );

        // Assign ranks (equal score = equal rank)
        let rank = 1;
        const ranked = entries.map((e, i) => {
            if (i > 0 && e.score < entries[i - 1].score) rank = i + 1;
            const horseKey = e.horseId.toString();
            const h = horseNameMap[horseKey] ?? {};

            // One breakdown entry per tournament round, in chronological order
            const roundBreakdown = raceRounds.map(rr => {
                const roundKey = rr._id.toString();
                const reg = horseRoundReg[horseKey]?.[roundKey];
                if (!reg) {
                    return { roundId: rr._id, roundName: rr.roundName, raceDate: rr.raceDate, roundStatus: rr.status, type: 'not_registered' };
                }
                const result = resultByRegId[reg._id.toString()];
                if (result) {
                    return { roundId: rr._id, roundName: rr.roundName, raceDate: rr.raceDate, roundStatus: rr.status, type: 'result', finishPosition: result.finishPosition, prizeMoney: result.prizeMoney || 0 };
                }
                return { roundId: rr._id, roundName: rr.roundName, raceDate: rr.raceDate, roundStatus: rr.status, type: 'no_result', registrationStatus: reg.registrationStatus };
            });

            return {
                rank,
                horseId: e.horseId,
                horseName: h.horseName ?? 'Unknown',
                horseImg: h.img ?? null,
                ownerId: e.ownerId,
                ownerName: ownerNameMap[e.ownerId?.toString()] ?? 'Unknown',
                score: e.score,
                totalRaces: e.totalRaces,
                wins: e.wins,
                podiums: e.podiums,
                totalPrizeMoney: e.totalPrizeMoney,
                roundBreakdown,
            };
        });

        return { code: 200, data: ranked, msg: 'Ranking retrieved successfully' };
    } catch (error) {
        return { code: 500, msg: error.message };
    }
};

// List all violations across every race, with pagination and optional filters.
AdminService.prototype.getAllViolations = async function (page, limit, { status, severity, raceRoundId, sortBy = 'created_at', order = 'desc' } = {}) {
    try {
        const Violation = require('../entities/Violation');
        const filter = {};
        if (status) filter.violationStatus = status;
        if (severity) filter.severity = Number(severity);
        if (raceRoundId) filter.raceRoundId = raceRoundId;

        // Violation's timestamps option remaps createdAt -> created_at (see entities/Violation.js)
        const allowedViolationSortFields = ['created_at', 'severity', 'violationStatus'];
        const sortField = allowedViolationSortFields.includes(sortBy) ? sortBy : 'created_at';
        const sortOrder = order === 'asc' ? 1 : -1;

        const skip = (page - 1) * limit;
        const [items, totalItems] = await Promise.all([
            Violation.find(filter)
                .populate('violationTypeId', 'violationName type category severity defaultPenalty')
                .populate('registrationId', 'horseId registrationStatus')
                .populate('raceRefereeId', 'refereeId')
                .populate('raceRoundId', 'roundName raceDate')
                .sort({ [sortField]: sortOrder })
                .skip(skip)
                .limit(limit)
                .lean(),
            Violation.countDocuments(filter),
        ]);

        return {
            code: 200,
            data: {
                items,
                pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) || 1 },
            },
            msg: 'Violations retrieved successfully',
        };
    } catch (error) {
        return { code: 500, msg: error.message };
    }
};

// List all violation types with pagination, search, filters and sort.
AdminService.prototype.getAllViolationTypes = async function (page, limit, { search, type, category, sortBy = 'createdAt', order = 'desc' } = {}) {
    try {
        const ViolationType = require('../entities/ViolationType');
        const filter = {};
        if (search) filter.violationName = { $regex: search, $options: 'i' };
        if (type) filter.type = type;
        if (category) filter.category = category;

        const allowedSortFields = ['violationName', 'severity', 'type', 'category', 'createdAt', 'updatedAt'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const sortOrder = order === 'asc' ? 1 : -1;

        const skip = (page - 1) * limit;
        const [items, totalItems] = await Promise.all([
            ViolationType.find(filter).sort({ [sortField]: sortOrder }).skip(skip).limit(limit).lean(),
            ViolationType.countDocuments(filter),
        ]);

        return {
            code: 200,
            data: {
                items,
                pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) || 1 },
            },
            msg: 'Violation types retrieved successfully',
        };
    } catch (error) {
        return { code: 500, msg: error.message };
    }
};

// Create a new violation type.
AdminService.prototype.createViolationType = async function (data) {
    try {
        const ViolationType = require('../entities/ViolationType');
        const vt = await new ViolationType(data).save();
        return { code: 201, data: vt, msg: 'Violation type created successfully' };
    } catch (error) {
        return { code: 500, msg: error.message };
    }
};

// Update an existing violation type.
AdminService.prototype.updateViolationType = async function (id, data) {
    try {
        const ViolationType = require('../entities/ViolationType');
        const vt = await ViolationType.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
        if (!vt) return { code: 404, msg: 'Violation type not found' };
        return { code: 200, data: vt, msg: 'Violation type updated successfully' };
    } catch (error) {
        return { code: 500, msg: error.message };
    }
};

// Toggle isActive on a violation type (soft delete / restore).
AdminService.prototype.toggleViolationTypeActive = async function (id, isActive) {
    try {
        const ViolationType = require('../entities/ViolationType');
        const vt = await ViolationType.findByIdAndUpdate(id, { isActive }, { new: true }).lean();
        if (!vt) return { code: 404, msg: 'Violation type not found' };
        return { code: 200, data: vt, msg: `Violation type ${isActive ? 'activated' : 'deactivated'} successfully` };
    } catch (error) {
        return { code: 500, msg: error.message };
    }
};

// Comprehensive, system-wide statistics snapshot for the admin statistics page.
// Every section degrades to 0 / [] rather than throwing when a collection is empty.
function countMap(aggResult) {
    const map = {};
    for (const row of aggResult) {
        map[row._id ?? 'unknown'] = row.count;
    }
    return map;
}

AdminService.prototype.getSystemStatistics = async function () {
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
};


// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD PANEL ENDPOINTS
// Each method feeds exactly one panel group. They are designed to be called
// in parallel from the frontend so no panel blocks another.
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. KPI cards (Row 1) ─────────────────────────────────────────────────────
AdminService.prototype.getDashboardKpi = async function () {
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
};

// ── 2. House earnings time-series (Row 2 chart) ───────────────────────────────
// houseEarning is read directly from the same transactions that fund
// mainAdminWallet (PayoutService.distributeRacePayouts/distributeTournamentPayouts
// call AdminRepository.incrementMainAdminWallet + log a matching deposit/payment
// Transaction). Deriving it from reward payouts with a flat takeout rate would
// drift from the real wallet balance (tournament_champion uses 22%, not 17%,
// and pools with no winning prediction still credit the house but log no reward
// transaction at all).

AdminService.prototype.getDashboardHouseEarnings = async function (groupBy = 'day') {
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
                { $match: { transactionType: 'reward', referenceType: 'prediction', status: 'completed' } },
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
};

// ── 3. Top performers (Row 3: left 3 cards) ───────────────────────────────────
AdminService.prototype.getDashboardTopPerformers = async function () {
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

        const horseIds = topHorsesTx.map(r => r._id).filter(Boolean);
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
};

// ── 4. Prediction insights (Row 3: right 2 cards) ─────────────────────────────
AdminService.prototype.getDashboardPredictions = async function () {
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
};

// ── 5. Spectator leaderboard (Row 4 table) ────────────────────────────────────
AdminService.prototype.getDashboardSpectatorLeaderboard = async function () {
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
};

// ─── Self Profile (self-service, distinct from admin-managing-other-users) ──

AdminService.prototype.getMyProfile = async function (adminId) {
    try {
        const doc = await AdminRepository.findByAdminId(adminId);
        if (!doc) return { code: 404, msg: 'Admin not found' };
        const { _id, ...roleFields } = doc.toObject();
        const { passwordHash, ...userFields } = doc._id.toObject();
        return { code: 200, data: { ...roleFields, ...userFields }, msg: 'Profile retrieved successfully' };
    } catch (error) {
        return { code: 500, msg: error.message };
    }
};

AdminService.prototype.updateMyProfile = async function (adminId, updateData) {
    try {
        const { userFields, error } = ProfileUpdateUtil.buildUserFieldUpdates(updateData);
        if (error) return { code: 400, msg: error };
        if (Object.keys(userFields).length) {
            await UserRepository.updateById(adminId, userFields);
        }
        return this.getMyProfile(adminId);
    } catch (error) {
        return { code: 500, msg: error.message };
    }
};

module.exports = new AdminService();
