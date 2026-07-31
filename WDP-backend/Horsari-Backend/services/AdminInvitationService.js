const RegistrationRepository = require('../repositories/RegistrationRepository');
const Invitation = require('../entities/Invitation');
const Registration = require('../entities/Registration');
const User = require('../entities/User');

class InvitationService {
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
}

module.exports = new InvitationService();
