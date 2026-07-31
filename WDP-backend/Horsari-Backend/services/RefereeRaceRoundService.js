const RaceDateUtil = require('../utils/RaceDateUtil');
const NotificationService = require('./NotificationService');

const RaceReferee = require('../entities/RaceReferee');
const RaceRound = require('../entities/RaceRound');
const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
const Registration = require('../entities/Registration');
const User = require('../entities/User');
const Invitation = require('../entities/Invitation');
const RaceResult = require('../entities/RaceResult');
const Violation = require('../entities/Violation');

class RaceRoundService {
    // Get Race Rounds assigned to the referee (paginated)
    // `startDate`/`endDate` (both required together) switch this to a date-range/calendar
    // mode, mirroring AdminService.getTournamentsWithDetails's isDateRangeQuery: every
    // matching round in that range is returned unpaginated, since a calendar month can't be
    // split across pages without breaking the grid. `tournament_id` narrows either mode.
    async getRefereeRaceRounds(refereeId, page = 1, limit = 10, status = null, search = null, sortBy = 'raceDate', order = 'desc', tournament_id = null, startDate = null, endDate = null) {
        try {
            // ── 1. All ACCEPTED assignment IDs for this referee ───────────────
            // Only 'assigned' (i.e. accepted) assignments — a still-'pending' invitation,
            // or one this referee 'rejected', shouldn't surface the race round here.
            const assignments = await RaceReferee.find({ refereeId, status: 'assigned' }).lean();
            if (!assignments.length) {
                return {
                    code: 200,
                    data: { items: [], pagination: { totalItems: 0, totalPages: 0, currentPage: page, limit } },
                    msg: 'No race rounds assigned to this referee.',
                };
            }

            const raceRoundIds = assignments.map(a => a.raceRoundId);
            const isDateRangeQuery = Boolean(startDate && endDate);

            // ── 2. Filter + paginate at DB level ──────────────────────────────
            const skip = (page - 1) * limit;
            const filter = { _id: { $in: raceRoundIds } };
            if (status) filter.status = status;
            if (search) filter.roundName = { $regex: search, $options: 'i' };
            if (tournament_id) filter.tournamentId = tournament_id;
            if (isDateRangeQuery) filter.raceDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
            const sortObj = { [sortBy]: order === 'asc' ? 1 : -1 };

            let raceRoundQuery = RaceRound.find(filter).sort(sortObj);
            if (!isDateRangeQuery) {
                raceRoundQuery = raceRoundQuery.skip(skip).limit(limit);
            }

            const [raceRounds, totalItems] = await Promise.all([
                raceRoundQuery.lean(),
                RaceRound.countDocuments(filter),
            ]);

            const totalPages = isDateRangeQuery ? 1 : Math.ceil(totalItems / limit);
            const currentPage = isDateRangeQuery ? 1 : page;
            const responseLimit = isDateRangeQuery ? totalItems : limit;

            if (!raceRounds.length) {
                return {
                    code: 200,
                    data: { items: [], pagination: { totalItems, totalPages, currentPage, limit: responseLimit } },
                    msg: 'Referee race rounds retrieved successfully',
                };
            }

            // ── 3. Bulk fetch secondary data for the page slice ───────────────
            const pageRoundIds = raceRounds.map(r => r._id);
            const [registrationsAll] = await Promise.all([
                Registration.find({ raceRoundId: { $in: pageRoundIds } }).lean(),
            ]);

            const eligibilityIds = [...new Set(
                raceRounds.filter(r => r.eligibilityRuleId).map(r => r.eligibilityRuleId.toString())
            )];
            const regIds = registrationsAll.map(r => r._id);
            const ownerIds = [...new Set(
                registrationsAll.filter(r => r.horseOwnerId).map(r => r.horseOwnerId.toString())
            )];

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

            // ── 4. Build lookup maps ──────────────────────────────────────────
            const eligibilityMap = new Map(eligibilityRules.map(e => [e._id.toString(), e]));
            const ownerMap = new Map(owners.map(u => [u._id.toString(), u]));
            const invitationsByReg = new Map();
            for (const inv of invitations) {
                const key = inv.registrationId.toString();
                if (!invitationsByReg.has(key)) invitationsByReg.set(key, []);
                invitationsByReg.get(key).push(inv);
            }
            const raceResultMap = new Map(raceResults.map(r => [r.registrationId.toString(), r]));
            const regsByRound = new Map();
            for (const reg of registrationsAll) {
                const key = reg.raceRoundId.toString();
                if (!regsByRound.has(key)) regsByRound.set(key, []);
                regsByRound.get(key).push(reg);
            }
            // This referee's own assignment per round — fee/status/paymentStatus,
            // not the admin's all-referees view.
            const assignmentByRoundId = new Map(assignments.map(a => [a.raceRoundId.toString(), a]));

            // ── 5. Assemble items ─────────────────────────────────────────────
            const items = raceRounds.map(raceRound => {
                const raceType = raceRound.raceType
                    || (raceRound.eligibilityRuleId
                        ? eligibilityMap.get(raceRound.eligibilityRuleId.toString())?.raceType
                        : null)
                    || null;

                const registrations = (regsByRound.get(raceRound._id.toString()) || []).map(reg => {
                    const regInvitations = invitationsByReg.get(reg._id.toString()) || [];
                    return {
                        ...reg,
                        Horse: regInvitations[0]?.horseId || null,
                        Invitations: regInvitations,
                        Owner: ownerMap.get(reg.horseOwnerId?.toString()) || null,
                        RaceResult: raceResultMap.get(reg._id.toString()) || null,
                    };
                });

                return {
                    ...raceRound,
                    RaceType: raceType,
                    Registration: registrations,
                    RaceReferee: assignmentByRoundId.get(raceRound._id.toString()) || null,
                };
            });

            return {
                code: 200,
                data: { items, pagination: { totalItems, totalPages, currentPage, limit: responseLimit } },
                msg: 'Referee race rounds retrieved successfully',
            };
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
                if (['completed', 'running', 'awaitingConfirmation'].includes(raceRound.status) && reg.jockeyInRaceId) {
                    invitationFilter._id = reg.jockeyInRaceId;
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

                const raceResult = await RaceResult.findOne({ registrationId: reg._id }).lean();

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
            if (!['accepted', 'verified', 'failed'].includes(registration.registrationStatus)) {
                return { code: 422, msg: `Registration is "${registration.registrationStatus}", only "accepted", "verified", or "failed" registrations can be reviewed.` };
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
            }

            // 4. Update the registration
            const updated = await Registration.findByIdAndUpdate(
                registrationId,
                {
                    registrationStatus: status,
                    verificationFailReason: status === 'failed' ? verificationFailReason : null,
                    jockeyInRaceId: status === 'verified' ? selectedInvitationId : null,
                },
                { new: true }
            ).lean();

            // Refund predictions if the horse failed inspection
            if (status === 'failed') {
                const PayoutService = require('./PayoutService');
                PayoutService.refundRegistrationPredictions(registrationId).catch(err =>
                    console.error('[RefereeService] refundRegistrationPredictions error:', err.message)
                );
            }

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

            if (registration.horseOwnerId) {
                NotificationService.notify({
                    recipientIds: [registration.horseOwnerId],
                    type: status === 'verified' ? 'registration_verified' : 'registration_failed',
                    title: status === 'verified' ? 'Registration Verified' : 'Registration Failed',
                    message: status === 'verified'
                        ? 'Your race registration passed pre-race inspection.'
                        : `Your race registration failed pre-race inspection: ${verificationFailReason}`,
                    actionPayload: { entityType: 'Registration', entityId: registrationId },
                }, io).catch(err => console.error('[verifyRegistration] notify owner error:', err.message));
            }

            return { code: 200, data: updated, msg: `Registration marked as "${status}" successfully.` };
        } catch (error) {
            console.error('Error verifying registration:', error);
            return { code: 500, msg: error.message };
        }
    }

    async cancelRegistration(refereeId, raceRoundId, registrationId, io) {
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

            if (registration.horseOwnerId) {
                NotificationService.notify({
                    recipientIds: [registration.horseOwnerId],
                    type: 'registration_cancelled',
                    title: 'Registration Cancelled',
                    message: 'Your race registration was cancelled as a no-show.',
                    actionPayload: { entityType: 'Registration', entityId: registrationId },
                }, io).catch(err => console.error('[cancelRegistration] notify owner error:', err.message));
            }

            return { code: 200, data: updated, msg: 'Registration cancelled (no-show) successfully.' };
        } catch (error) {
            console.error('Error cancelling registration:', error);
            return { code: 500, msg: error.message };
        }
    }

    // Finalize a race round after all registrations are inspected.
    // Sets status to "prepared" if at least one registration is verified,
    // or "cancelled" if all registrations ended up failed/cancelled/rejected.
    async finalizeRaceRound(refereeId, raceRoundId, io, override = false) {
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

            const newStatus = verifiedCount >= 2 ? 'prepared' : 'cancelled';

            if (newStatus === 'prepared') {
                const gateError = RaceDateUtil.getScheduleGateError(raceRound.raceDate, { override });
                if (gateError) return gateError;
            }

            await RaceRound.findByIdAndUpdate(raceRoundId, { status: newStatus });

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
}

module.exports = new RaceRoundService();
