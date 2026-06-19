const RefereeRepository = require('../repositories/RefereeRepository');
const UserRepository = require('../repositories/UserRepository');
const RaceRefereeRepository = require('../repositories/RaceRefereeRepository');

const RaceReferee = require('../entities/RaceReferee');
const RaceRound = require('../entities/RaceRound');
const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
const Registration = require('../entities/Registration');
const User = require('../entities/User');
const Invitation = require('../entities/Invitation');
const RaceResult = require('../entities/RaceResult');
const Tournament = require('../entities/Tournament');

class RefereeService {
    // Create referee profile for existing user (public)
    async createReferee(refereeId, data) {
        try {
            const { licenseLink } = data || {};

            if (!refereeId) {
                return { code: 400, msg: 'refereeId is required' };
            }

            const user = await UserRepository.findById(refereeId);
            if (!user) {
                return { code: 404, msg: 'User not found' };
            }

            const existing = await RefereeRepository.findByRefereeId(refereeId);
            if (existing) {
                return { code: 409, msg: 'Referee profile already exists' };
            }

            const refereeProfile = await RefereeRepository.create({
                _id: refereeId,
                licenseLink: licenseLink || null,
            });

            return { code: 201, data: refereeProfile, msg: 'Referee profile created successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }



    // Get referee profile
    async getRefereeProfile(refereeId) {
        try {
            const referee = await RefereeRepository.findByRefereeId(refereeId);
            if (!referee) {
                return {
                    code: 404,
                    msg: 'Referee profile not found',
                };
            }
            return {
                code: 200,
                data: referee,
                msg: 'Referee profile retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get referee invitations (assigned race rounds)
    async getRefereeInvitations(userId, limit = 10, page = 1, status = null) {
        try {
            const skip = (page - 1) * limit;
            
            const filter = { refereeId: userId };
            if (status) {
                if (status.includes(',')) {
                    filter.status = { $in: status.split(',') };
                } else {
                    filter.status = status;
                }
            }

            const [invitations, total] = await Promise.all([
                RaceRefereeRepository.findInvitationsByFilter(filter, limit, skip),
                RaceRefereeRepository.countInvitationsByFilter(filter)
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                code: 200,
                data: invitations,
                pagination: {
                    total,
                    totalPages,
                    currentPage: page,
                    limit,
                },
                msg: 'Referee invitations retrieved successfully',
            };
        } catch (error) {
            console.error("Error fetching referee invitations:", error);
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Accept invitation
    async acceptInvitation(userId, invitationId) {
        try {
            const updated = await require('../repositories/RaceRefereeRepository').updateStatusByIdAndRefereeId(invitationId, userId, 'assigned');
            if (!updated) {
                return {
                    code: 404,
                    msg: 'Invitation not found or you are not authorized to accept it.',
                };
            }
            return {
                code: 200,
                data: updated,
                msg: 'Invitation accepted successfully',
            };
        } catch (error) {
            console.error("Error accepting invitation:", error);
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Reject invitation
    async rejectInvitation(userId, invitationId) {
        try {
            const updated = await require('../repositories/RaceRefereeRepository').updateStatusByIdAndRefereeId(invitationId, userId, 'rejected');
            if (!updated) {
                return {
                    code: 404,
                    msg: 'Invitation not found or you are not authorized to reject it.',
                };
            }
            return {
                code: 200,
                data: updated,
                msg: 'Invitation rejected successfully',
            };
        } catch (error) {
            console.error("Error rejecting invitation:", error);
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get all referees
    async getAllReferees(limit = 10, skip = 0) {
        try {
            const referees = await RefereeRepository.findAll(limit, skip);
            const count = await RefereeRepository.count();
            return {
                code: 200,
                data: { referees, count },
                msg: 'Referees retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Update referee profile
    async updateRefereeProfile(refereeId, updateData) {
        try {
            const referee = await RefereeRepository.findByRefereeId(refereeId);
            if (!referee) {
                return {
                    code: 404,
                    msg: 'Referee not found',
                };
            }
            const updatedReferee = await RefereeRepository.updateById(referee._id, updateData);
            return {
                code: 200,
                data: updatedReferee,
                msg: 'Referee profile updated successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get referee by certification number - DEPRECATED
    async getRefereeByCredentials(certificationNumber) {
        try {
            return {
                code: 400,
                msg: 'This endpoint is deprecated. Certification information is now stored as licenseLink.',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Verify referee credentials - DEPRECATED
    async verifyRefereeCredentials(refereeId, certificationNumber) {
        try {
            return {
                code: 400,
                msg: 'This endpoint is deprecated. Certification information is now stored as licenseLink.',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Renew certification - DEPRECATED
    async renewCertification(refereeId, newCertificationNumber) {
        try {
            return {
                code: 400,
                msg: 'This endpoint is deprecated. Use update profile to change licenseLink.',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get referee by license number - DEPRECATED
    async getRefereeByLicense(licenseNumber) {
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

    // Get Race Rounds assigned to the referee
    // Optimised: 7 fixed bulk queries instead of N+1 sequential loops
    async getRefereeRaceRounds(refereeId) {
        try {
            // ── 1. Assignments ────────────────────────────────────────────────
            const assignments = await RaceReferee.find({ refereeId }).lean();
            if (!assignments.length) {
                return { code: 200, data: [], msg: 'No race rounds assigned to this referee.' };
            }

            const raceRoundIds = assignments.map(a => a.raceRoundId);

            // ── 2. Bulk fetch all required collections in parallel ─────────────
            const [raceRounds, registrationsAll] = await Promise.all([
                RaceRound.find({ _id: { $in: raceRoundIds } }).lean(),
                Registration.find({ raceRoundId: { $in: raceRoundIds } }).lean(),
            ]);

            // ── 3. Collect IDs for secondary bulk fetches ─────────────────────
            const eligibilityIds = [...new Set(
                raceRounds.filter(r => r.eligibilityRuleId).map(r => r.eligibilityRuleId.toString())
            )];
            const regIds = registrationsAll.map(r => r._id);
            const ownerIds = [...new Set(
                registrationsAll.filter(r => r.horseOwnerId).map(r => r.horseOwnerId.toString())
            )];

            // ── 4. Bulk fetch secondary data in parallel ──────────────────────
            const [eligibilityRules, owners, invitations, raceResults] = await Promise.all([
                eligibilityIds.length
                    ? RaceEligibilityRule.find({ _id: { $in: eligibilityIds } }).lean()
                    : Promise.resolve([]),
                ownerIds.length
                    ? User.find({ _id: { $in: ownerIds } }, 'fullName').lean()
                    : Promise.resolve([]),
                regIds.length
                    ? Invitation.find({ registrationId: { $in: regIds }, isBackup: false })
                        .populate('horseId')
                        .populate({ path: 'jockeyId', populate: { path: '_id', model: 'User', select: 'fullName' } })
                        .lean()
                    : Promise.resolve([]),
                regIds.length
                    ? RaceResult.find({ registrationId: { $in: regIds } }).lean()
                    : Promise.resolve([]),
            ]);

            // ── 5. Build lookup maps ──────────────────────────────────────────
            const eligibilityMap = new Map(eligibilityRules.map(e => [e._id.toString(), e]));
            const ownerMap       = new Map(owners.map(u => [u._id.toString(), u]));
            const invitationMap  = new Map(invitations.map(i => [i.registrationId.toString(), i]));
            const raceResultMap  = new Map(raceResults.map(r => [r.registrationId.toString(), r]));

            // Group registrations by raceRoundId
            const regsByRound = new Map();
            for (const reg of registrationsAll) {
                const key = reg.raceRoundId.toString();
                if (!regsByRound.has(key)) regsByRound.set(key, []);
                regsByRound.get(key).push(reg);
            }

            // ── 6. Assemble results in memory ─────────────────────────────────
            const results = raceRounds.map(raceRound => {
                const raceType = raceRound.raceType
                    || (raceRound.eligibilityRuleId
                        ? eligibilityMap.get(raceRound.eligibilityRuleId.toString())?.raceType
                        : null)
                    || null;

                const registrations = (regsByRound.get(raceRound._id.toString()) || []).map(reg => {
                    const invitation = invitationMap.get(reg._id.toString()) || null;
                    return {
                        ...reg,
                        Horse:           invitation?.horseId  || null,
                        Jockey:          invitation?.jockeyId || null,
                        isJockeyInRace:  invitation?.isJockeyInRace ?? false,
                        Owner:           ownerMap.get(reg.horseOwnerId?.toString()) || null,
                        RaceResult:      raceResultMap.get(reg._id.toString()) || null,
                    };
                });

                return { ...raceRound, RaceType: raceType, Registration: registrations };
            });

            return { code: 200, data: results, msg: 'Referee race rounds retrieved successfully' };
        } catch (error) {
            console.error('Error fetching referee race rounds:', error);
            return { code: 500, msg: error.message };
        }
    }

    // Get single Race Round detail (referee-scoped, no other referee info)
    async getRaceRoundById(userId, raceRoundId) {
        try {
            // 1. Verify this referee is assigned to the round
            const assignment = await RaceReferee.findOne({ raceRoundId, refereeId: userId }).lean();
            if (!assignment) {
                return { code: 403, msg: 'You are not assigned to this race round.' };
            }

            // 2. Fetch the race round itself
            const raceRound = await RaceRound.findById(raceRoundId).lean();
            if (!raceRound) {
                return { code: 404, msg: 'Race round not found.' };
            }

            // 3. Eligibility rule (for raceType / gradeLevel)
            let raceType = null;
            if (raceRound.eligibilityRuleId) {
                const rule = await RaceEligibilityRule.findById(raceRound.eligibilityRuleId).lean();
                if (rule) raceType = rule;
            }

            // 4. Registrations with Horse, Jockey (name), Owner, RaceResult
            const registrations = await Registration.find({ raceRoundId: raceRound._id }).lean();
            const enriched = await Promise.all(registrations.map(async (reg) => {
                const invitation = await Invitation.findOne({ registrationId: reg._id, isBackup: false })
                    .populate('horseId')
                    .populate('jockeyId')
                    .lean();

                if (invitation && invitation.jockeyId && invitation.jockeyId._id) {
                    const jockeyUser = await User.findById(invitation.jockeyId._id).select('fullName').lean();
                    if (jockeyUser) invitation.jockeyId._id = jockeyUser;
                }

                const ownerUser = reg.horseOwnerId
                    ? await User.findById(reg.horseOwnerId, 'fullName').lean()
                    : null;

                const raceResult = await RaceResult.findOne({ registrationId: reg._id }).lean();

                return {
                    ...reg,
                    Horse: invitation?.horseId ?? null,
                    Jockey: invitation?.jockeyId ?? null,
                    isJockeyInRace: invitation?.isJockeyInRace ?? false,
                    Owner: ownerUser,
                    RaceResult: raceResult ?? null,
                };
            }));

            return {
                code: 200,
                data: {
                    ...raceRound,
                    RaceType: raceType,
                    Registration: enriched,
                },
                msg: 'Race round detail retrieved successfully.',
            };
        } catch (error) {
            console.error('Error fetching race round detail (referee):', error);
            return { code: 500, msg: error.message };
        }
    }

    // Get Tournaments assigned to the referee
    // Optimised: 8 fixed bulk queries instead of N+1 sequential loops
    async getRefereeTournaments(refereeId) {
        try {
            // ── 1. Assignments ────────────────────────────────────────────────
            const assignments = await RaceReferee.find({ refereeId }).lean();
            if (!assignments.length) {
                return { code: 200, data: [], msg: 'No tournaments found.' };
            }

            const raceRoundIds = assignments.map(a => a.raceRoundId);
            const assignmentMap = new Map(assignments.map(a => [a.raceRoundId.toString(), a]));

            // ── 2. Bulk fetch all required collections in parallel ─────────────
            const [raceRounds, tournaments] = await Promise.all([
                RaceRound.find({ _id: { $in: raceRoundIds } }).lean(),
                (async () => {
                    const rounds = await RaceRound.find({ _id: { $in: raceRoundIds } }, 'tournamentId').lean();
                    const tIds = [...new Set(rounds.map(r => r.tournamentId?.toString()).filter(Boolean))];
                    return Tournament.find({ _id: { $in: tIds } }).lean();
                })(),
            ]);

            const tournamentIds = [...new Set(raceRounds.map(r => r.tournamentId?.toString()).filter(Boolean))];

            // ── 3. Collect IDs for secondary bulk fetches ─────────────────────
            const eligibilityIds = [...new Set(
                raceRounds.filter(r => r.eligibilityRuleId).map(r => r.eligibilityRuleId.toString())
            )];
            const registrationsAll = await Registration.find({ raceRoundId: { $in: raceRoundIds } }).lean();
            const regIds   = registrationsAll.map(r => r._id);
            const ownerIds = [...new Set(
                registrationsAll.filter(r => r.horseOwnerId).map(r => r.horseOwnerId.toString())
            )];

            // ── 4. Bulk fetch secondary data in parallel ──────────────────────
            const [eligibilityRules, owners, invitations, raceResults] = await Promise.all([
                eligibilityIds.length
                    ? RaceEligibilityRule.find({ _id: { $in: eligibilityIds } }).lean()
                    : Promise.resolve([]),
                ownerIds.length
                    ? User.find({ _id: { $in: ownerIds } }, 'fullName').lean()
                    : Promise.resolve([]),
                regIds.length
                    ? Invitation.find({ registrationId: { $in: regIds }, isBackup: false })
                        .populate('horseId')
                        .populate({ path: 'jockeyId', populate: { path: '_id', model: 'User', select: 'fullName' } })
                        .lean()
                    : Promise.resolve([]),
                regIds.length
                    ? RaceResult.find({ registrationId: { $in: regIds } }).lean()
                    : Promise.resolve([]),
            ]);

            // ── 5. Build lookup maps ──────────────────────────────────────────
            const eligibilityMap = new Map(eligibilityRules.map(e => [e._id.toString(), e]));
            const ownerMap       = new Map(owners.map(u => [u._id.toString(), u]));
            const invitationMap  = new Map(invitations.map(i => [i.registrationId.toString(), i]));
            const raceResultMap  = new Map(raceResults.map(r => [r.registrationId.toString(), r]));

            // Group registrations by raceRoundId
            const regsByRound = new Map();
            for (const reg of registrationsAll) {
                const key = reg.raceRoundId.toString();
                if (!regsByRound.has(key)) regsByRound.set(key, []);
                regsByRound.get(key).push(reg);
            }

            // Group raceRounds by tournamentId
            const roundsByTournament = new Map();
            for (const r of raceRounds) {
                const key = r.tournamentId?.toString();
                if (!key) continue;
                if (!roundsByTournament.has(key)) roundsByTournament.set(key, []);
                roundsByTournament.get(key).push(r);
            }

            // ── 6. Assemble results in memory ─────────────────────────────────
            const results = tournaments.map(t => {
                const tRounds = roundsByTournament.get(t._id.toString()) || [];

                const mappedRounds = tRounds.map(r => {
                    const raceType = eligibilityMap.get(r.eligibilityRuleId?.toString()) || null;

                    const registrations = (regsByRound.get(r._id.toString()) || []).map(reg => {
                        const invitation = invitationMap.get(reg._id.toString()) || null;
                        return {
                            ...reg,
                            Horse:      invitation?.horseId  || null,
                            Jockey:     invitation?.jockeyId || null,
                            Owner:      ownerMap.get(reg.horseOwnerId?.toString()) || null,
                            RaceResult: raceResultMap.get(reg._id.toString()) || null,
                        };
                    });

                    return {
                        ...r,
                        RaceType:     raceType,
                        RaceReferee:  assignmentMap.get(r._id.toString()) || null,
                        Registration: registrations,
                    };
                });

                return { ...t, RaceRound: mappedRounds };
            });

            return { code: 200, data: results, msg: 'Referee tournaments retrieved successfully' };
        } catch (error) {
            console.error('Error fetching referee tournaments:', error);
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new RefereeService();
