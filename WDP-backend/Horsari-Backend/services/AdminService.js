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
const Prediction = require('../entities/Prediction');
const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
const RaceResult = require('../entities/RaceResult');
const HorseOwner = require('../entities/HorseOwner');
const User = require('../entities/User');

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
    async getAllUsers(limit = 10, skip = 0) {
        try {
            const users = await UserRepository.findAll(limit, skip);
            const count = await UserRepository.count();
            return {
                code: 200,
                data: { users, count },
                msg: 'Users retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get users by role
    async getUsersByRole(role) {
        try {
            if (!['horseowner', 'jockey', 'referee', 'spectator', 'admin'].includes(role)) {
                return {
                    code: 400,
                    msg: 'Invalid role',
                };
            }
            const users = await UserRepository.findByRole(role);
            return {
                code: 200,
                data: { users, count: users.length },
                msg: `Users with role ${role} retrieved successfully`,
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
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
                    isBackup: inv.isBackup
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
    async getRaceRounds(tournament_id = null, raceRound_id = null) {
        try {
            let query = {};
            if (tournament_id) {
                query.tournamentId = tournament_id;
            }
            if (raceRound_id) {
                query._id = raceRound_id;
            }

            const results = [];
            const raceRounds = await RaceRound.find(query).lean();

            for (const raceRound of raceRounds) {
                // Fetch RaceType
                let raceType = raceRound.raceType || null;
                if (!raceType && raceRound.eligibilityRuleId) {
                    const rule = await RaceEligibilityRule.findById(raceRound.eligibilityRuleId).lean();
                    if (rule && rule.raceType) raceType = rule.raceType;
                }

                const rrObj = {
                    ...raceRound,
                    RaceType: raceType
                };

                results.push(rrObj);
            }

            return { code: 200, data: results, msg: 'Race rounds retrieved successfully' };
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

                const invitation = await Invitation.findOne({
                    registrationId: reg._id,
                    isBackup: false
                })
                    .populate('horseId')
                    .populate({
                        path: 'jockeyId',
                        populate: { path: '_id', model: 'User', select: 'fullName' }
                    })
                    .lean();

                const raceResult = await RaceResult.findOne({ registrationId: reg._id }).lean();

                rrObj.Registration.push({
                    ...reg,
                    sum_prediction,
                    Horse: invitation ? invitation.horseId : null,
                    Jockey: invitation ? invitation.jockeyId : null,
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

    // --- Race Eligibility Rule CRUD ---

    async getAllRules() {
        try {
            const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
            const rules = await RaceEligibilityRule.find().sort({ create_at: -1 }).lean();
            return {
                code: 200,
                data: rules,
                msg: 'Race eligibility rules retrieved successfully'
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

module.exports = new AdminService();
