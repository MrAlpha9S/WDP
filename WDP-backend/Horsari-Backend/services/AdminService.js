const AdminRepository = require('../repositories/AdminRepository');
const UserRepository = require('../repositories/UserRepository');
const HorseOwnerRepository = require('../repositories/HorseOwnerRepository');
const JockeyRepository = require('../repositories/JockeyRepository');
const TournamentRepository = require('../repositories/TournamentRepository');
const RegistrationRepository = require('../repositories/RegistrationRepository');
const Invitation = require('../entities/Invitation');
const Horse = require('../entities/Horse');
const Registration = require('../entities/Registration');

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

                    // Fetch the first active horse belonging to this owner
                    const horse = horseOwner
                        ? await Horse.findOne({ ownerId: horseOwner._id, status: 'active' }).lean()
                        : null;

                    // Fetch only accepted invitations for this registration
                    const invitations = await Invitation.find({
                        registrationId: reg._id,
                        invitationStatus: 'accepted',
                    })
                        .populate({
                            path: 'jockeyId',
                            populate: { path: '_id', model: 'User', select: 'fullName' },
                        })
                        .lean();

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
                            jockeyName: inv.jockeyId?._id?.fullName ?? 'Unknown',
                            isBackup: inv.isBackup,
                            status: inv.invitationStatus,
                        })),
                        horseOwner: horseOwner
                            ? {
                                  ownerId: horseOwner._id,
                                  fullName: horseOwner._id?.fullName ?? null,
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
}

// Helper: get all registrationIds that belong to a given raceRoundId
async function getRegistrationIdsByRound(raceRoundId) {
    const regs = await require('../entities/Registration').find({ raceRoundId }, '_id').lean();
    return regs.map((r) => r._id);
}

module.exports = new AdminService();
