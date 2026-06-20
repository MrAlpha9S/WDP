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
const ViolationType = require('../entities/ViolationType');
const Violation = require('../entities/Violation');


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
                    ? Invitation.find({ registrationId: { $in: regIds } })
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
            const invitationsByReg = new Map();
            for (const inv of invitations) {
                const key = inv.registrationId.toString();
                if (!invitationsByReg.has(key)) invitationsByReg.set(key, []);
                invitationsByReg.get(key).push(inv);
            }
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
                    const regInvitations = invitationsByReg.get(reg._id.toString()) || [];
                    return {
                        ...reg,
                        Horse:       regInvitations[0]?.horseId || null,
                        Invitations: regInvitations,
                        Owner:       ownerMap.get(reg.horseOwnerId?.toString()) || null,
                        RaceResult:  raceResultMap.get(reg._id.toString()) || null,
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
                const invitationFilter = { registrationId: reg._id };
                if (raceRound.status === 'completed' || raceRound.status === 'running') {
                    invitationFilter.isJockeyInRace = true;
                }

                const invitations = await Invitation.find(invitationFilter)
                    .populate('horseId')
                    .populate('jockeyId')
                    .lean();

                for (const inv of invitations) {
                    if (inv.jockeyId && inv.jockeyId._id) {
                        const jockeyUser = await User.findById(inv.jockeyId._id).select('fullName').lean();
                        if (jockeyUser) inv.jockeyId._id = jockeyUser;
                    }
                }

                const ownerUser = reg.horseOwnerId
                    ? await User.findById(reg.horseOwnerId, 'fullName').lean()
                    : null;

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

                return {
                    ...reg,
                    Horse: invitations[0]?.horseId ?? null,
                    Invitations: invitations,
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

    // Verify or fail a single registration (referee pre-race checkup)
    async verifyRegistration(refereeId, raceRoundId, registrationId, body, io) {
        try {
            const { status, verificationFailReason, selectedInvitationId, failedChecks = [] } = body || {};

            if (!['verified', 'failed'].includes(status)) {
                return { code: 400, msg: 'status must be "verified" or "failed"' };
            }
            if (status === 'failed' && !verificationFailReason) {
                return { code: 400, msg: 'verificationFailReason is required when status is "failed"' };
            }
            if (status === 'verified' && !selectedInvitationId) {
                return { code: 400, msg: 'selectedInvitationId is required when status is "verified"' };
            }

            // 1. Confirm this referee is assigned to the race round
            const assignment = await RaceReferee.findOne({ raceRoundId, refereeId }).lean();
            if (!assignment) {
                return { code: 403, msg: 'You are not assigned to this race round.' };
            }

            // 2. Load registration and confirm it belongs to this race round
            const registration = await Registration.findById(registrationId).lean();
            if (!registration) {
                return { code: 404, msg: 'Registration not found.' };
            }
            if (registration.raceRoundId.toString() !== raceRoundId) {
                return { code: 400, msg: 'Registration does not belong to this race round.' };
            }
            if (!['approved', 'verified', 'failed'].includes(registration.registrationStatus)) {
                return { code: 422, msg: `Registration is "${registration.registrationStatus}", only "approved", "verified", or "failed" registrations can be reviewed.` };
            }

            // 3. For verified: validate the selected invitation and confirm jockey confirmed
            if (status === 'verified') {
                const selectedInv = await Invitation.findById(selectedInvitationId).lean();
                if (!selectedInv) {
                    return { code: 404, msg: 'Selected invitation not found.' };
                }
                if (selectedInv.registrationId.toString() !== registrationId) {
                    return { code: 400, msg: 'Selected invitation does not belong to this registration.' };
                }
                if (!selectedInv.jockeyConfirmation) {
                    return { code: 422, msg: 'The selected jockey has not confirmed participation yet.' };
                }
                // Mark the selected jockey as racing, clear all others for this registration
                await Invitation.updateMany({ registrationId }, { isJockeyInRace: false });
                await Invitation.findByIdAndUpdate(selectedInvitationId, { isJockeyInRace: true });
            }

            // 4. Update the registration
            const updated = await Registration.findByIdAndUpdate(
                registrationId,
                {
                    registrationStatus: status,
                    verificationFailReason: status === 'failed' ? verificationFailReason : null,
                },
                { new: true }
            ).lean();

            // 5. Sync violations — always clear old ones first (handles re-inspect)
            await Violation.deleteMany({ registrationId });

            // failedChecks is an array of ViolationType ObjectIds selected by the referee
            if (status === 'failed' && failedChecks.length > 0) {
                const uniqueIds = [...new Set(failedChecks)];
                await Violation.insertMany(uniqueIds.map(vtId => ({
                    raceRoundId,
                    registrationId,
                    raceRefereeId: assignment._id,
                    violationTypeId: vtId,
                    violationStatus: 'confirmed',
                })));
            }

            // Note: The race status is no longer automatically updated to 'prepared'.
            // The referee must now explicitly call authorizeRaceStart via the UI.


            return { code: 200, data: updated, msg: `Registration marked as "${status}" successfully.` };
        } catch (error) {
            console.error('Error verifying registration:', error);
            return { code: 500, msg: error.message };
        }
    }

    async cancelRegistration(refereeId, raceRoundId, registrationId) {
        try {
            const assignment = await RaceReferee.findOne({ raceRoundId, refereeId }).lean();
            if (!assignment) {
                return { code: 403, msg: 'You are not assigned to this race round.' };
            }

            const registration = await Registration.findById(registrationId).lean();
            if (!registration) {
                return { code: 404, msg: 'Registration not found.' };
            }
            if (registration.raceRoundId.toString() !== raceRoundId) {
                return { code: 400, msg: 'Registration does not belong to this race round.' };
            }
            if (registration.registrationStatus !== 'pending') {
                return { code: 422, msg: `Only "pending" registrations can be cancelled as no-show. Current status: "${registration.registrationStatus}".` };
            }

            const updated = await Registration.findByIdAndUpdate(
                registrationId,
                { registrationStatus: 'cancelled' },
                { new: true }
            ).lean();

            return { code: 200, data: updated, msg: 'Registration cancelled (no-show) successfully.' };
        } catch (error) {
            console.error('Error cancelling registration:', error);
            return { code: 500, msg: error.message };
        }
    }

    // Finalize a race round after all registrations are inspected.
    // Sets status to "prepared" if at least one registration is verified,
    // or "cancelled" if all registrations ended up failed/cancelled/rejected.
    async finalizeRaceRound(refereeId, raceRoundId, io) {
        try {
            const assignment = await RaceReferee.findOne({ raceRoundId, refereeId }).lean();
            if (!assignment) {
                return { code: 403, msg: 'You are not assigned to this race round.' };
            }

            const raceRound = await RaceRound.findById(raceRoundId).lean();
            if (!raceRound) {
                return { code: 404, msg: 'Race round not found.' };
            }

            const TERMINAL = ['verified', 'failed', 'rejected', 'cancelled'];

            const unresolved = await Registration.countDocuments({
                raceRoundId,
                registrationStatus: { $nin: TERMINAL },
            });
            if (unresolved > 0) {
                return { code: 422, msg: 'Cannot finalize: there are still registrations that have not been inspected.' };
            }

            const verifiedCount = await Registration.countDocuments({
                raceRoundId,
                registrationStatus: 'verified',
            });

            const newStatus = verifiedCount > 0 ? 'prepared' : 'cancelled';
            await RaceRound.findByIdAndUpdate(raceRoundId, { status: newStatus });

            if (io) {
                io.emit('admin_notification', {
                    id: Date.now().toString(),
                    type: newStatus === 'prepared' ? 'race_prepared' : 'race_cancelled',
                    title: newStatus === 'prepared' ? 'Race Pre-Check Complete' : 'Race Cancelled — No Eligible Entries',
                    message: newStatus === 'prepared'
                        ? `Race round has been cleared and is ready to start.`
                        : `Race round has been cancelled — all entries failed or were withdrawn.`,
                    raceRoundId,
                    timestamp: new Date(),
                    read: false,
                    actionLabel: 'View Race',
                    actionPayload: { raceRoundId },
                });
            }

            return {
                code: 200,
                data: { status: newStatus },
                msg: newStatus === 'prepared'
                    ? 'Race round finalized — status set to prepared.'
                    : 'Race round finalized — status set to cancelled (no eligible entries).',
            };
        } catch (error) {
            console.error('Error finalizing race round:', error);
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
                    ? Invitation.find({ registrationId: { $in: regIds } })
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
            const invitationsByReg = new Map();
            for (const inv of invitations) {
                const key = inv.registrationId.toString();
                if (!invitationsByReg.has(key)) invitationsByReg.set(key, []);
                invitationsByReg.get(key).push(inv);
            }
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
                        const regInvitations = invitationsByReg.get(reg._id.toString()) || [];
                        return {
                            ...reg,
                            Horse:       regInvitations[0]?.horseId || null,
                            Invitations: regInvitations,
                            Owner:       ownerMap.get(reg.horseOwnerId?.toString()) || null,
                            RaceResult:  raceResultMap.get(reg._id.toString()) || null,
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
    // ── Violation Types ───────────────────────────────────────────────────────

    async getViolationTypes(type) {
        try {
            const filter = { isActive: true };
            if (type) filter.type = type;
            const data = await ViolationType.find(filter).sort({ severity: 1, violationName: 1 }).lean();
            return { code: 200, data, msg: 'Violation types retrieved.' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // ── Violations (race-round scoped) ────────────────────────────────────────

    async getRaceRoundViolations(refereeId, raceRoundId) {
        try {
            const assignment = await RaceReferee.findOne({ refereeId, raceRoundId }).lean();
            if (!assignment) return { code: 403, msg: 'You are not assigned to this race round.' };

            const data = await Violation.find({ raceRoundId })
                .populate('violationTypeId', 'violationName type category severity defaultPenalty')
                .populate('registrationId', '_id registrationStatus')
                .sort({ created_at: -1 })
                .lean();
            return { code: 200, data, msg: 'Violations retrieved.' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async createViolation(refereeId, body) {
        try {
            const { raceRoundId, registrationId, violationTypeId, description } = body || {};
            if (!raceRoundId || !violationTypeId) {
                return { code: 400, msg: 'raceRoundId and violationTypeId are required.' };
            }
            const assignment = await RaceReferee.findOne({ refereeId, raceRoundId }).lean();
            if (!assignment) return { code: 403, msg: 'You are not assigned to this race round.' };

            const vt = await ViolationType.findById(violationTypeId).lean();
            if (!vt) return { code: 404, msg: 'ViolationType not found.' };

            const violation = await Violation.create({
                raceRoundId,
                registrationId: registrationId || undefined,
                raceRefereeId: assignment._id,
                violationTypeId,
                description,
                severity: vt.severity,
                violationStatus: 'pending',
            });
            const populated = await Violation.findById(violation._id)
                .populate('violationTypeId', 'violationName type category severity defaultPenalty')
                .lean();
            return { code: 201, data: populated, msg: 'Violation created.' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async deleteViolation(refereeId, violationId) {
        try {
            const violation = await Violation.findById(violationId).lean();
            if (!violation) return { code: 404, msg: 'Violation not found.' };

            // Confirm the referee owns this violation via their assignment
            const assignment = await RaceReferee.findOne({
                _id: violation.raceRefereeId,
                refereeId,
            }).lean();
            if (!assignment) return { code: 403, msg: 'You do not have permission to delete this violation.' };

            await Violation.findByIdAndDelete(violationId);
            return { code: 200, msg: 'Violation deleted.' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new RefereeService();
