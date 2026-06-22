const AdminRepository = require('../repositories/AdminRepository');
const UserRepository = require('../repositories/UserRepository');
const HorseOwnerRepository = require('../repositories/HorseOwnerRepository');
const JockeyRepository = require('../repositories/JockeyRepository');
const TournamentRepository = require('../repositories/TournamentRepository');
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
const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
const RaceResult = require('../entities/RaceResult');
const HorseOwner = require('../entities/HorseOwner');
const User = require('../entities/User');
const Violation = require('../entities/Violation');
const ViolationType = require('../entities/ViolationType');
const SimulationService = require('./SimulationService');
const MuxService = require('./MuxService');

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
    async getAllUsers(role, search, limit = 10, skip = 0) {
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
            const users = await UserRepository.findAll(filter, limit, skip);
            const totalUsers = await UserRepository.count(filter);

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
                        invitationStatus: 'accepted',
                    })
                        .populate({ path: 'registrationId', populate: { path: 'raceRoundId' } })
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
                            prizeMoney: raceResult?.prizeMoney ?? 0,
                            violations: violationsByReg[reg._id.toString()] ?? [],
                        });
                    }

                    roleProfile = {
                        height: jockey?.height ?? null,
                        weight: jockey?.weight ?? null,
                        matchesRaced: jockey?.matchesRaced ?? 0,
                        totalWins: jockey?.totalWins ?? 0,
                        ranking: jockey?.ranking ?? null,
                        status: jockey?.status ?? null,
                        licenseLink: jockey?.licenseLink ?? null,
                        licenseStatus: jockey?.licenseStatus ?? null,
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
                                fee: a.fee ?? 0,
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
                    const spectator = await Spectator.findById(id).lean();
                    roleProfile = {
                        rewardPoints: spectator?.rewardPoints ?? 0,
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
                        invitationStatus: sib.invitationStatus
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
    async getTournamentsWithDetails(page = 1, limit = 5) {
        try {
            const skip = (page - 1) * limit;

            const Tournament = require('../entities/Tournament');
            const RaceRound = require('../entities/RaceRound');
            const Registration = require('../entities/Registration');
            const Prediction = require('../entities/Prediction');

            const tournaments = await Tournament.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const totalItems = await Tournament.countDocuments();
            const totalPages = Math.ceil(totalItems / limit);

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
                        currentPage: page,
                        limit,
                    },
                },
                msg: 'Tournaments retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Get Race Rounds
    async getRaceRounds(tournament_id = null, raceRound_id = null, page = 1, limit = 10, status = null, search = null, sortBy = 'raceDate', order = 'desc') {
        try {
            const skip = (page - 1) * limit;
            let query = {};
            if (tournament_id) query.tournamentId = tournament_id;
            if (raceRound_id) query._id = raceRound_id;
            if (status) query.status = status;
            if (search) query.roundName = { $regex: search, $options: 'i' };

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
                        fee: rr.fee
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
                if ((raceRound.status === 'completed' || raceRound.status === 'running') && reg.jockeyInRaceId) {
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

                // Get race result by matching raceRoundId + same calendar day as raceDate
                let raceResult = null;
                if (raceRound.raceDate) {
                    const dayStart = new Date(raceRound.raceDate);
                    dayStart.setUTCHours(0, 0, 0, 0);
                    const dayEnd = new Date(dayStart);
                    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
                    raceResult = await RaceResult.findOne({
                        raceRoundId: raceRound._id,
                        registrationId: reg._id,
                        createdAt: { $gte: dayStart, $lt: dayEnd },
                    }).lean();
                }

                rrObj.Registration.push({
                    ...reg,
                    sum_prediction,
                    Horse: invitation ? invitation.horseId : null,
                    Jockey: invitation ? invitation.jockeyId : null,
                    isJockeyInRace: !!reg.jockeyInRaceId,
                    Owner: ownerUser,
                    RaceResult: raceResult || null
                });
            }

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

    async verifyCertification(userId, action) {
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

        const updated = await RaceRound.findByIdAndUpdate(raceRoundId, { status: newStatus }, { new: true }).lean();

        if (io) {
            io.to(`race:${raceRoundId}`).emit('race_status_changed', {
                raceRoundId,
                status: newStatus,
                timestamp: new Date(),
            });
            io.emit('admin_notification', {
                id: Date.now().toString(),
                type: newStatus === 'running' ? 'race_started' : 'race_cancelled',
                title: newStatus === 'running' ? 'Race Round Started' : 'Race Round Cancelled',
                message: `Race round "${raceRound.roundName}" is now ${newStatus}.`,
                raceRoundId,
                timestamp: new Date(),
                read: false,
            });
        }

        if (newStatus === 'running') {
            // Start horse simulation
            SimulationService.initializeSimulation(raceRoundId, io).catch(err => {
                console.error('[Sim] Failed to start simulation:', err);
            });
            // Create Mux live stream for OBS ingestion
            MuxService.createLiveStream(raceRoundId).catch(err => {
                console.error('[Mux] Failed to create live stream:', err);
            });
        }

        return { code: 200, data: updated, msg: `Race round status updated to "${newStatus}".` };
    } catch (error) {
        console.error('Error setting race round status:', error);
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
        if (raceRound.status !== 'running' && raceRound.status !== 'completed') {
            return { code: 422, msg: `Cannot confirm results for a race with status "${raceRound.status}".` };
        }

        // Mark all pending_confirmation results as official and stamp publishedByAdminId
        await RaceResult.updateMany(
            { raceRoundId },
            { resultStatus: 'official', publishedByAdminId: adminId }
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

        if (io) {
            io.to(`race:${raceRoundId}`).emit('race_status_changed', {
                raceRoundId,
                status: 'completed',
                timestamp: new Date(),
            });
            io.emit('admin_notification', {
                id: Date.now().toString(),
                type: 'race_completed',
                title: 'Race Results Confirmed',
                message: `Results for "${raceRound.roundName}" have been officially confirmed.`,
                raceRoundId,
                timestamp: new Date(),
                read: false,
            });
        }

        return { code: 200, data: { raceRound: updatedRace, results }, msg: 'Race results confirmed and race marked as completed.' };
    } catch (error) {
        return { code: 500, msg: error.message };
    }
};

// GET Mux stream info (RTMP URL + stream key for OBS, playback ID for viewer)
AdminService.prototype.getStreamInfo = async function (raceRoundId) {
    try {
        const raceRound = await RaceRound.findById(raceRoundId).lean();
        if (!raceRound) return { code: 404, msg: 'Race round not found.' };
        if (raceRound.status !== 'running') {
            return { code: 422, msg: 'Race is not currently running.' };
        }
        const info = await MuxService.getStreamInfo(raceRoundId);
        if (!info) return { code: 404, msg: 'No live stream found for this race. Start the race first.' };
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

module.exports = new AdminService();
