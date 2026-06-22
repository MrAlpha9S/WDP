const HorseOwnerRepository = require('../repositories/HorseOwnerRepository');
const HorseRepository = require('../repositories/HorseRepository');
const UserRepository = require('../repositories/UserRepository');
const Registration = require('../entities/Registration');
const RaceRound = require('../entities/RaceRound');
const Tournament = require('../entities/Tournament');
const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
const Invitation = require('../entities/Invitation');

class HorseOwnerService {
    // Create horse owner profile for existing user (public)
    async createHorseOwner(ownerId, data) {
        try {
            const { licenseLink } = data || {};

            if (!ownerId) {
                return { code: 400, msg: 'ownerId is required' };
            }

            const user = await UserRepository.findById(ownerId);
            if (!user) {
                return { code: 404, msg: 'User not found' };
            }

            const existing = await HorseOwnerRepository.findByOwnerId(ownerId);
            if (existing) {
                return { code: 409, msg: 'Horse owner profile already exists' };
            }

            const ownerProfile = await HorseOwnerRepository.create({
                _id: ownerId,
                licenseLink: licenseLink || null,
            });

            return { code: 201, data: ownerProfile, msg: 'Horse owner profile created successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }



    // Get horse owner profile
    async getHorseOwnerProfile(ownerId) {
        try {
            const horseOwner = await HorseOwnerRepository.findByOwnerId(ownerId);
            if (!horseOwner) {
                return {
                    code: 404,
                    msg: 'Horse owner profile not found',
                };
            }
            return {
                code: 200,
                data: horseOwner,
                msg: 'Horse owner profile retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Update horse owner profile
    async updateHorseOwnerProfile(ownerId, updateData) {
        try {
            const horseOwner = await HorseOwnerRepository.findByOwnerId(ownerId);
            if (!horseOwner) {
                return {
                    code: 404,
                    msg: 'Horse owner not found',
                };
            }
            const updatedOwner = await HorseOwnerRepository.updateById(horseOwner._id, updateData);
            return {
                code: 200,
                data: updatedOwner,
                msg: 'Horse owner profile updated successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get all horses owned
    async getOwnedHorses(ownerId, page = 1, limit = 10, search = null, sortBy = 'createdAt', order = 'desc') {
        try {
            const skip = (page - 1) * limit;
            const filter = {};
            if (search) filter.horseName = { $regex: search, $options: 'i' };
            const sortObj = { [sortBy]: order === 'asc' ? 1 : -1 };
            const [items, totalItems] = await Promise.all([
                HorseRepository.findByOwnerIdPaginated(ownerId, filter, sortObj, skip, limit),
                HorseRepository.countByOwnerIdFiltered(ownerId, filter),
            ]);
            return {
                code: 200,
                data: {
                    items,
                    pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit },
                },
                msg: 'Owned horses retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Get horse statistics for owner
    async getOwnedHorsesStats(ownerId) {
        try {
            const horses = await HorseRepository.findByOwnerId(ownerId);
            if (horses.length === 0) {
                return {
                    code: 200,
                    data: {
                        totalHorses: 0,
                        healthyHorses: 0,
                        injuredHorses: 0,
                        activeHorses: 0,
                        inactiveHorses: 0,
                    },
                    msg: 'No horses found for this owner',
                };
            }

            const healthyCount = horses.filter(h => h.healthStatus === 'healthy').length;
            const injuredCount = horses.filter(h => h.healthStatus === 'injured').length;
            const activeCount = horses.filter(h => h.status === 'active').length;
            const inactiveCount = horses.filter(h => h.status === 'inactive').length;

            return {
                code: 200,
                data: {
                    totalHorses: horses.length,
                    healthyHorses: healthyCount,
                    injuredHorses: injuredCount,
                    activeHorses: activeCount,
                    inactiveHorses: inactiveCount,
                },
                msg: 'Horse statistics retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get horses by health status
    async getHorsesByHealthStatus(ownerId, healthStatus) {
        try {
            if (!['healthy', 'injured', 'sick'].includes(healthStatus)) {
                return {
                    code: 400,
                    msg: 'Invalid health status',
                };
            }
            const horses = await HorseRepository.findByOwnerId(ownerId);
            const filtered = horses.filter(h => h.healthStatus === healthStatus);
            return {
                code: 200,
                data: { horses: filtered, count: filtered.length },
                msg: `Horses with health status ${healthStatus} retrieved successfully`,
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get all horse owners
    async getAllHorseOwners(limit = 10, skip = 0) {
        try {
            const owners = await HorseOwnerRepository.findAll(limit, skip);
            const count = await HorseOwnerRepository.count();
            return {
                code: 200,
                data: { owners, count },
                msg: 'Horse owners retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get horse owner by license number - DEPRECATED (licenseLink is now used)
    async getHorseOwnerByLicense(licenseNumber) {
        try {
            return {
                code: 400,
                msg: 'This endpoint is deprecated. License information is now stored as licenseLink.',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get race invitations for owner: registrations + raceRound (+ tournament, eligibility rule)
    async getRaceInvitations(ownerId, page = 1, limit = 10, status = null, search = null, sortBy = 'createdAt', order = 'desc') {
        try {
            if (!ownerId) return { code: 400, msg: 'ownerId is required' };

            const skip = (page - 1) * limit;
            const regFilter = { horseOwnerId: ownerId };
            if (status) regFilter.registrationStatus = status;

            // For search: find matching raceRound IDs by roundName first
            if (search) {
                const matchingRounds = await RaceRound.find({ roundName: { $regex: search, $options: 'i' } }, '_id').lean();
                regFilter.raceRoundId = { $in: matchingRounds.map(r => r._id) };
            }

            const sortObj = { [sortBy]: order === 'asc' ? 1 : -1 };

            const [regs, totalItems] = await Promise.all([
                Registration.find(regFilter).sort(sortObj).skip(skip).limit(limit).lean(),
                Registration.countDocuments(regFilter),
            ]);

            const horses = await HorseRepository.findByOwnerId(ownerId);

            const regIds = regs.map(r => r._id);
            const existingInvitations = await Invitation.find({ registrationId: { $in: regIds } }).select('registrationId horseId').lean();
            const existingHorseMap = new Map();
            for (const inv of existingInvitations) {
                if (!existingHorseMap.has(String(inv.registrationId))) {
                    existingHorseMap.set(String(inv.registrationId), String(inv.horseId));
                }
            }

            // Batch-fetch main invitations (jockeyInRaceId) to get jockey fullName and horse name
            const mainInvitationIds = regs.filter(r => r.jockeyInRaceId).map(r => r.jockeyInRaceId);
            const mainInvitations = await Invitation.find({ _id: { $in: mainInvitationIds } })
                .populate({ path: 'jockeyId', model: 'User', select: 'fullName image' })
                .populate('horseId', 'horseName')
                .lean();
            const mainInvMap = new Map(mainInvitations.map(inv => [String(inv._id), inv]));

            const items = await Promise.all(regs.map(async reg => {
                const rr = await RaceRound.findById(reg.raceRoundId).populate('eligibilityRuleId').lean();
                let tournament = null;
                if (rr && rr.tournamentId) {
                    tournament = await Tournament.findById(rr.tournamentId).lean();
                }

                let eligibleHorseIds = [];
                if (rr && rr.eligibilityRuleId) {
                    const rule = await RaceEligibilityRule.findById(rr.eligibilityRuleId).lean();
                    if (rule) {
                        eligibleHorseIds = horses.filter(h => {
                            if (rule.requiredBreed && h.breed !== rule.requiredBreed) return false;
                            if (rule.requiredGender && h.gender !== rule.requiredGender) return false;
                            return true;
                        }).map(h => h._id);
                    }
                }

                const mainInv = reg.jockeyInRaceId ? mainInvMap.get(String(reg.jockeyInRaceId)) : null;

                return {
                    registration: reg,
                    raceRound: rr || null,
                    tournament: tournament || null,
                    eligibleHorseIds,
                    existingHorseId: existingHorseMap.get(String(reg._id)) ?? null,
                    jockey: mainInv?.jockeyId
                        ? { fullName: mainInv.jockeyId.fullName ?? null, image: mainInv.jockeyId.image ?? null }
                        : null,
                    horse: mainInv?.horseId
                        ? { horseName: mainInv.horseId.horseName ?? null }
                        : null,
                };
            }));

            return {
                code: 200,
                data: {
                    items,
                    pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit },
                },
                msg: 'Race invitations retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Approve a registration (owner action)
    async approveRegistration(ownerId, registrationId) {
        try {
            if (!ownerId) return { code: 400, msg: 'ownerId is required' };
            if (!registrationId) return { code: 400, msg: 'registrationId is required' };

            const reg = await Registration.findById(registrationId);
            if (!reg) return { code: 404, msg: 'Registration not found' };
            const tournament = await Tournament.findById(reg.tournamentId);
            if (tournament && tournament.status === 'cancelled') {
                return { code: 400, msg: 'Registrations for cancelled tournaments cannot be approved' };
            }
            if (reg.registrationStatus == 'cancelled' || reg.registrationStatus == 'rejected') {
                return { code: 400, msg: 'rejected or cancelled registrations cannot be approved' };
            }
            if (String(reg.horseOwnerId) !== String(ownerId)) {
                return { code: 403, msg: 'Not authorized to modify this registration' };
            }

            reg.registrationStatus = 'approved';
            await reg.save();

            return { code: 200, data: reg, msg: 'Registration approved' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Reject a registration (owner action)
    async rejectRegistration(ownerId, registrationId) {
        try {
            if (!ownerId) return { code: 400, msg: 'ownerId is required' };
            if (!registrationId) return { code: 400, msg: 'registrationId is required' };

            const reg = await Registration.findById(registrationId);
            if (!reg) return { code: 404, msg: 'Registration not found' };

            if (String(reg.horseOwnerId) !== String(ownerId)) {
                return { code: 403, msg: 'Not authorized to modify this registration' };
            }

            reg.registrationStatus = 'rejected';
            await reg.save();

            return { code: 200, data: reg, msg: 'Registration rejected' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Horse owner requests race start after all registrations are reviewed
    async confirmRaceStart(ownerId, raceRoundId, io) {
        try {
            // 1. Confirm the caller has a registration in this race round
            const ownerReg = await Registration.findOne({ raceRoundId, horseOwnerId: ownerId }).lean();
            if (!ownerReg) {
                return { code: 403, msg: 'You do not have a registration in this race round.' };
            }

            // 2. Race must be in "prepared" state (all registrations reviewed by referee)
            const raceRound = await RaceRound.findById(raceRoundId).lean();
            if (!raceRound) {
                return { code: 404, msg: 'Race round not found.' };
            }
            if (raceRound.status !== 'prepared') {
                return { code: 422, msg: `Race is currently "${raceRound.status}". Confirm start is only available once the referee has completed all pre-race inspections.` };
            }

            // 3. All registrations must be verified or failed (no pending/approved remaining)
            const pending = await Registration.countDocuments({
                raceRoundId,
                registrationStatus: { $nin: ['verified', 'failed', 'rejected', 'cancelled'] },
            });
            if (pending > 0) {
                return { code: 422, msg: `${pending} registration(s) are still awaiting referee inspection.` };
            }

            // 4. At least one registration must be verified (otherwise auto-cancel)
            const verifiedCount = await Registration.countDocuments({ raceRoundId, registrationStatus: 'verified' });
            if (verifiedCount === 0) {
                await RaceRound.findByIdAndUpdate(raceRoundId, { status: 'cancelled' });
                if (io) {
                    io.emit('admin_notification', {
                        id: Date.now().toString(),
                        type: 'race_cancelled',
                        title: 'Race Auto-Cancelled',
                        message: `All registrations for race round failed inspection. Race has been cancelled.`,
                        raceRoundId,
                        timestamp: new Date(),
                        read: false,
                        actionLabel: 'View Race',
                        actionPayload: { raceRoundId },
                    });
                }
                return { code: 200, msg: 'All registrations failed. Race has been automatically cancelled.' };
            }

            // 5. Emit notification to admin
            if (io) {
                io.emit('admin_notification', {
                    id: Date.now().toString(),
                    type: 'race_ready_to_start',
                    title: 'Race Ready to Start',
                    message: `${verifiedCount} verified participant(s) are ready. Awaiting admin to start the race.`,
                    raceRoundId,
                    timestamp: new Date(),
                    read: false,
                    actionLabel: 'Start Race',
                    actionPayload: { raceRoundId },
                });
            }

            return { code: 200, msg: 'Confirm-start request sent to admin successfully.' };
        } catch (error) {
            console.error('Error confirming race start:', error);
            return { code: 500, msg: error.message };
        }
    }

    // Get jockey invitations sent by this horse owner (paginated)
    async getJockeyInvitations(ownerId, page = 1, limit = 10) {
        try {
            if (!ownerId) return { code: 400, msg: 'ownerId is required' };

            // Find all registration IDs that belong to this owner
            const regs = await Registration.find({ horseOwnerId: ownerId }).select('_id').lean();
            const regIds = regs.map(r => r._id);

            const skip = (page - 1) * limit;
            const total = await Invitation.countDocuments({ registrationId: { $in: regIds } });

            const invitations = await Invitation.find({ registrationId: { $in: regIds } })
                .populate({ path: 'jockeyId', model: 'User', select: 'fullName image' })
                .populate('horseId', 'horseName')
                .populate({
                    path: 'registrationId',
                    populate: { path: 'raceRoundId', select: 'roundName raceDate location' },
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const mapped = invitations.map(inv => ({
                _id: inv._id,
                jockey: inv.jockeyId
                    ? { fullName: inv.jockeyId.fullName ?? null, image: inv.jockeyId.image ?? null }
                    : null,
                horse: inv.horseId ? { horseName: inv.horseId.horseName } : null,
                raceRound: inv.registrationId?.raceRoundId
                    ? {
                        roundName: inv.registrationId.raceRoundId.roundName,
                        raceDate:  inv.registrationId.raceRoundId.raceDate,
                        location:  inv.registrationId.raceRoundId.location,
                      }
                    : null,
                status: inv.invitationStatus,
                isBackup: inv.isBackup,
                percentagePayout: inv.percentagePayout,
                createdAt: inv.createdAt,
            }));

            return {
                code: 200,
                data: {
                    invitations: mapped,
                    pagination: { total, totalPages: Math.ceil(total / limit), page, limit },
                },
                msg: 'Jockey invitations retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new HorseOwnerService();
