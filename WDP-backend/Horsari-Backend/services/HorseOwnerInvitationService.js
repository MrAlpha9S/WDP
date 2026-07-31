const HorseRepository = require('../repositories/HorseRepository');
const Registration = require('../entities/Registration');
const RaceRound = require('../entities/RaceRound');
const Tournament = require('../entities/Tournament');
const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
const Invitation = require('../entities/Invitation');
const Horse = require('../entities/Horse');
const User = require('../entities/User');

class InvitationService {
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

    // Accept a registration (owner action)
    async acceptRegistration(ownerId, registrationId, io) {
        try {
            if (!ownerId) return { code: 400, msg: 'ownerId is required' };
            if (!registrationId) return { code: 400, msg: 'registrationId is required' };

            const reg = await Registration.findById(registrationId);
            if (!reg) return { code: 404, msg: 'Registration not found' };
            const tournament = await Tournament.findById(reg.tournamentId);
            if (tournament && tournament.status === 'cancelled') {
                return { code: 400, msg: 'Registrations for cancelled tournaments cannot be accepted' };
            }
            // 'verified'/'failed' are the referee's own pre-race-checkup outcomes — accepting
            // over them would silently undo that determination after the fact.
            if (['cancelled', 'rejected', 'verified', 'failed'].includes(reg.registrationStatus)) {
                return { code: 400, msg: `Cannot accept a registration that is already "${reg.registrationStatus}".` };
            }
            if (String(reg.horseOwnerId) !== String(ownerId)) {
                return { code: 403, msg: 'Not authorized to modify this registration' };
            }

            reg.registrationStatus = 'accepted';
            await reg.save();

            const NotificationService = require('./NotificationService');
            NotificationService.notify({
                role: 'admin',
                type: 'registration_accepted',
                title: 'Registration Accepted',
                message: 'A horse owner has accepted their race registration.',
                actionPayload: { entityType: 'Registration', entityId: reg._id },
            }, io).catch(err => console.error('[acceptRegistration] notify admin error:', err.message));

            return { code: 200, data: reg, msg: 'Registration accepted' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Get jockey invitations sent by this horse owner (paginated)
    async getJockeyInvitations(ownerId, page = 1, limit = 10, search = null) {
        try {
            if (!ownerId) return { code: 400, msg: 'ownerId is required' };

            // Find all registration IDs that belong to this owner
            const regs = await Registration.find({ horseOwnerId: ownerId }).select('_id').lean();
            const regIds = regs.map(r => r._id);

            const invFilter = { registrationId: { $in: regIds } };

            if (search) {
                const [matchingUsers, matchingHorses] = await Promise.all([
                    User.find({ fullName: { $regex: search, $options: 'i' } }, '_id').lean(),
                    Horse.find({ horseName: { $regex: search, $options: 'i' } }, '_id').lean(),
                ]);
                invFilter.$or = [
                    { jockeyId: { $in: matchingUsers.map(u => u._id) } },
                    { horseId: { $in: matchingHorses.map(h => h._id) } },
                ];
            }

            const skip = (page - 1) * limit;
            const [total, invitations] = await Promise.all([
                Invitation.countDocuments(invFilter),
                Invitation.find(invFilter)
                    .populate({ path: 'jockeyId', model: 'User', select: 'fullName image' })
                    .populate('horseId', 'horseName')
                    .populate({
                        path: 'registrationId',
                        populate: { path: 'raceRoundId', select: 'roundName raceDate location' },
                    })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
            ]);

            const mapped = invitations.map(inv => ({
                _id: inv._id,
                jockey: inv.jockeyId
                    ? { _id: inv.jockeyId._id, fullName: inv.jockeyId.fullName ?? null, image: inv.jockeyId.image ?? null }
                    : null,
                horse: inv.horseId ? { horseName: inv.horseId.horseName } : null,
                raceRound: inv.registrationId?.raceRoundId
                    ? {
                        roundName: inv.registrationId.raceRoundId.roundName,
                        raceDate: inv.registrationId.raceRoundId.raceDate,
                        location: inv.registrationId.raceRoundId.location,
                    }
                    : null,
                status: inv.invitationStatus,
                isBackup: inv.isBackup,
                percentagePayout: inv.percentagePayout,
                bookingFees: inv.bookingFees ?? 0,
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

module.exports = new InvitationService();
