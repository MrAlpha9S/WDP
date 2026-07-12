const RefereeRepository = require('../repositories/RefereeRepository');
const UserRepository = require('../repositories/UserRepository');
const RaceRefereeRepository = require('../repositories/RaceRefereeRepository');
const TransactionRepository = require('../repositories/TransactionRepository');
const NotificationService = require('./NotificationService');

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

            // The RaceReferee.paymentStatus field is legacy and no longer written to —
            // the Transaction-backed payment-verification flow is authoritative.
            // Overwrite with the real status (falls back to 'unpaid' pre-confirmation).
            if (invitations.length) {
                const Transaction = require('../entities/Transaction');
                const CurrencyConverter = require('./CurrencyConverter');
                const User = require('../entities/User');
                const [payments, assigners] = await Promise.all([
                    Transaction.find({
                        sourceType: 'RaceReferee',
                        sourceId: { $in: invitations.map(i => i._id) },
                        paymentType: 'referee_fee',
                    }).lean(),
                    User.find(
                        { _id: { $in: invitations.map(i => i.assignedByAdminId).filter(Boolean) } },
                        'fullName',
                    ).lean(),
                ]);
                const paymentBySourceId = new Map(payments.map(p => [String(p.sourceId), p]));
                const assignerNameById = new Map(assigners.map(u => [String(u._id), u.fullName]));
                for (const inv of invitations) {
                    const matchedPayment = paymentBySourceId.get(String(inv._id));
                    inv.paymentStatus = matchedPayment?.paymentStatus || 'unpaid';
                    // Real confirmed amount once a Transaction exists; otherwise the same
                    // VND estimate confirmRaceResult itself would compute, so the two are
                    // guaranteed consistent.
                    inv.expectedPayment = matchedPayment
                        ? matchedPayment.amount
                        : CurrencyConverter.convertToVnd(inv.fee, inv.raceRoundId?.currencyType);
                    // Referee is always the payee here — the Transaction _id (not the
                    // RaceReferee _id) is what confirmAsPayee needs to act on.
                    inv.paymentId = matchedPayment?._id ?? null;
                    inv.payeeConfirmed = matchedPayment?.payeeConfirmed ?? false;
                    inv.assignedByName = assignerNameById.get(String(inv.assignedByAdminId)) ?? null;
                }
            }

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
    async acceptInvitation(userId, invitationId, io) {
        try {
            const updated = await require('../repositories/RaceRefereeRepository').updateStatusByIdAndRefereeId(invitationId, userId, 'assigned');
            if (!updated) {
                return {
                    code: 404,
                    msg: 'Invitation not found or you are not authorized to accept it.',
                };
            }
            NotificationService.notify({
                role: 'admin',
                type: 'referee_accepted',
                title: 'Referee Accepted Assignment',
                message: 'A referee has accepted their race assignment.',
                relatedEntityType: 'RaceReferee',
                relatedEntityId: updated._id,
            }, io).catch(err => console.error('[acceptInvitation] notify admin error:', err.message));
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
    async rejectInvitation(userId, invitationId, io) {
        try {
            const updated = await require('../repositories/RaceRefereeRepository').updateStatusByIdAndRefereeId(invitationId, userId, 'rejected');
            if (!updated) {
                return {
                    code: 404,
                    msg: 'Invitation not found or you are not authorized to reject it.',
                };
            }
            NotificationService.notify({
                role: 'admin',
                type: 'referee_rejected',
                title: 'Referee Rejected Assignment',
                message: 'A referee has rejected their race assignment.',
                relatedEntityType: 'RaceReferee',
                relatedEntityId: updated._id,
            }, io).catch(err => console.error('[rejectInvitation] notify admin error:', err.message));
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

    // Get Race Rounds assigned to the referee (paginated)
    async getRefereeRaceRounds(refereeId, page = 1, limit = 10, status = null, search = null, sortBy = 'raceDate', order = 'desc') {
        try {
            // ── 1. All assignment IDs for this referee ────────────────────────
            const assignments = await RaceReferee.find({ refereeId }).lean();
            if (!assignments.length) {
                return {
                    code: 200,
                    data: { items: [], pagination: { totalItems: 0, totalPages: 0, currentPage: page, limit } },
                    msg: 'No race rounds assigned to this referee.',
                };
            }

            const raceRoundIds = assignments.map(a => a.raceRoundId);

            // ── 2. Filter + paginate at DB level ──────────────────────────────
            const skip = (page - 1) * limit;
            const filter = { _id: { $in: raceRoundIds } };
            if (status) filter.status = status;
            if (search) filter.roundName = { $regex: search, $options: 'i' };
            const sortObj = { [sortBy]: order === 'asc' ? 1 : -1 };

            const [raceRounds, totalItems] = await Promise.all([
                RaceRound.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
                RaceRound.countDocuments(filter),
            ]);

            if (!raceRounds.length) {
                return {
                    code: 200,
                    data: { items: [], pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit } },
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
                data: { items, pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit } },
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
                    relatedEntityType: 'Registration',
                    relatedEntityId: registrationId,
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
                    relatedEntityType: 'Registration',
                    relatedEntityId: registrationId,
                }, io).catch(err => console.error('[cancelRegistration] notify owner error:', err.message));
            }

            return { code: 200, data: updated, msg: 'Registration cancelled (no-show) successfully.' };
        } catch (error) {
            console.error('Error cancelling registration:', error);
            return { code: 500, msg: error.message };
        }
    }

    // ─── Wallet ──────────────────────────────────────────────────────────────

    async getWalletInfo(refereeId) {
        try {
            const referee = await RefereeRepository.findByRefereeId(refereeId);
            if (!referee) return { code: 404, msg: 'Referee not found' };

            const totalFeesReceived = await TransactionRepository.sumAmountByParty(
                refereeId, 'referee', 'payee', { paymentStatus: 'paid' }
            );

            return {
                code: 200,
                data: {
                    referee: { _id: referee._id, wallet: referee.wallet },
                    stats: { totalFeesReceived },
                },
                msg: 'Wallet info retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Flat statistics snapshot — no time-series data (no backend precedent for
    // real aggregation exists yet), just current totals.
    async getStatistics(refereeId) {
        try {
            const referee = await RefereeRepository.findByRefereeId(refereeId);
            if (!referee) return { code: 404, msg: 'Referee not found' };

            const [
                totalInvitations,
                assignedAssignments,
                rejectedCount,
                pendingCount,
                totalFeesEarned,
                pendingFeesAmount,
            ] = await Promise.all([
                RaceReferee.countDocuments({ refereeId }),
                RaceReferee.find({ refereeId, status: 'assigned' }, '_id raceRoundId').lean(),
                RaceReferee.countDocuments({ refereeId, status: 'rejected' }),
                RaceReferee.countDocuments({ refereeId, status: 'pending' }),
                TransactionRepository.sumAmountByParty(refereeId, 'referee', 'payee', { paymentStatus: 'paid' }),
                TransactionRepository.sumAmountByParty(refereeId, 'referee', 'payee', { paymentStatus: { $ne: 'paid' } }),
            ]);

            const acceptedCount = assignedAssignments.length;
            const assignmentIds = assignedAssignments.map(a => a._id);
            const raceRoundIds = assignedAssignments.map(a => a.raceRoundId);

            // "Officiated" means the race actually happened, not merely that the
            // invitation was accepted — an 'assigned' race may still be upcoming.
            const [totalRacesOfficiated, violationCounts] = await Promise.all([
                RaceRound.countDocuments({ _id: { $in: raceRoundIds }, status: 'completed' }),
                Violation.aggregate([
                    { $match: { raceRefereeId: { $in: assignmentIds } } },
                    { $group: { _id: '$violationStatus', count: { $sum: 1 } } },
                ]),
            ]);

            const violationsByStatus = Object.fromEntries(violationCounts.map(v => [v._id, v.count]));
            const totalViolationsFiled = violationCounts.reduce((sum, v) => sum + v.count, 0);

            return {
                code: 200,
                data: {
                    wallet: referee.wallet,
                    totalInvitations,
                    totalRacesOfficiated,
                    acceptedCount,
                    rejectedCount,
                    pendingCount,
                    totalFeesEarned,
                    pendingFeesAmount,
                    totalViolationsFiled,
                    confirmedViolationsCount: violationsByStatus.confirmed ?? 0,
                    dismissedViolationsCount: violationsByStatus.dismissed ?? 0,
                },
                msg: 'Referee statistics retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Referee's own completed-race work history — race rounds they were assigned
    // to and that have actually finished, each with the violations logged
    // against that assignment. Mirrors AdminService.getUsersDetail's referee
    // branch, scoped to the caller and to completed races only.
    async getWorkHistory(refereeId, page = 1, limit = 10, sortBy = 'raceDate', order = 'desc') {
        try {
            const assignments = await RaceReferee.find({ refereeId, status: 'assigned' })
                .populate('raceRoundId')
                .lean();

            const completed = assignments.filter(a => a.raceRoundId?.status === 'completed');

            completed.sort((a, b) => {
                const aVal = sortBy === 'assignedAt' ? new Date(a.assignedAt) : new Date(a.raceRoundId?.raceDate ?? 0);
                const bVal = sortBy === 'assignedAt' ? new Date(b.assignedAt) : new Date(b.raceRoundId?.raceDate ?? 0);
                return order === 'asc' ? aVal - bVal : bVal - aVal;
            });

            const totalItems = completed.length;
            const skip = (page - 1) * limit;
            const pageSlice = completed.slice(skip, skip + limit);

            const CurrencyConverter = require('./CurrencyConverter');
            const Transaction = require('../entities/Transaction');

            // RaceReferee.paymentStatus is legacy and never written to — the
            // Transaction-backed payment-verification flow is authoritative
            // (same convention as getRefereeInvitations above).
            const payments = pageSlice.length
                ? await Transaction.find({
                    sourceType: 'RaceReferee',
                    sourceId: { $in: pageSlice.map(a => a._id) },
                    paymentType: 'referee_fee',
                }).lean()
                : [];
            const paymentBySourceId = new Map(payments.map(p => [String(p.sourceId), p]));

            const items = await Promise.all(pageSlice.map(async (a) => {
                const raceRound = a.raceRoundId;
                const violations = await Violation.find({ raceRefereeId: a._id })
                    .populate('violationTypeId')
                    .lean();
                const matchedPayment = paymentBySourceId.get(String(a._id));

                return {
                    assignmentId: a._id,
                    raceRoundId: raceRound?._id ?? null,
                    roundName: raceRound?.roundName ?? null,
                    raceDate: raceRound?.raceDate ?? null,
                    location: raceRound?.location ?? null,
                    raceGround: raceRound?.raceGround ?? null,
                    trackLength: raceRound?.trackLength ?? null,
                    paymentStatus: matchedPayment?.paymentStatus || 'unpaid',
                    fee: matchedPayment
                        ? matchedPayment.amount
                        : CurrencyConverter.convertToVnd(a.fee ?? 0, raceRound?.currencyType),
                    assignedAt: a.assignedAt,
                    violations: violations.map(v => ({
                        violationId: v._id,
                        typeName: v.violationTypeId?.violationName ?? null,
                        description: v.description ?? null,
                        severity: v.severity ?? null,
                        stewardAction: v.stewardAction ?? null,
                        violationStatus: v.violationStatus,
                        reportedAt: v.created_at,
                    })),
                };
            }));

            return {
                code: 200,
                data: {
                    items,
                    pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit },
                },
                msg: 'Work history retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Mark the jockey on an invitation as a no-show (didNotAttend) for race day.
    async markJockeyNoShow(refereeId, invitationId, io) {
        try {
            const invitation = await Invitation.findById(invitationId).lean();
            if (!invitation) {
                return { code: 404, msg: 'Invitation not found.' };
            }
            if (!invitation.registrationId) {
                return { code: 422, msg: 'Invitation is not linked to a registration.' };
            }

            const registration = await Registration.findById(invitation.registrationId).lean();
            if (!registration) {
                return { code: 404, msg: 'Registration not found.' };
            }

            const assignment = await RaceReferee.findOne({ raceRoundId: registration.raceRoundId, refereeId }).lean();
            if (!assignment) {
                return { code: 403, msg: 'You are not assigned to this race round.' };
            }

            const updated = await Invitation.findByIdAndUpdate(
                invitationId,
                { invitationStatus: 'didNotAttend' },
                { new: true }
            ).lean();

            const recipients = [invitation.jockeyId, registration.horseOwnerId].filter(Boolean);
            NotificationService.notify({
                recipientIds: recipients,
                type: 'jockey_no_show',
                title: 'Jockey Marked as No-Show',
                message: 'A jockey was marked as a no-show for race day.',
                relatedEntityType: 'Invitation',
                relatedEntityId: invitationId,
            }, io).catch(err => console.error('[markJockeyNoShow] notify error:', err.message));

            return { code: 200, data: updated, msg: 'Jockey marked as no-show successfully.' };
        } catch (error) {
            console.error('Error marking jockey no-show:', error);
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

            const newStatus = verifiedCount >= 2 ? 'prepared' : 'cancelled';
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

    // Get Tournaments assigned to the referee (paginated)
    async getRefereeTournaments(refereeId, page = 1, limit = 10, status = null, search = null, sortBy = 'startDate', order = 'desc') {
        try {
            // ── 1. All race round IDs for this referee ────────────────────────
            const assignments = await RaceReferee.find({ refereeId }).lean();
            if (!assignments.length) {
                return {
                    code: 200,
                    data: { items: [], pagination: { totalItems: 0, totalPages: 0, currentPage: page, limit } },
                    msg: 'No tournaments found.',
                };
            }

            const raceRoundIds = assignments.map(a => a.raceRoundId);
            const assignmentMap = new Map(assignments.map(a => [a.raceRoundId.toString(), a]));

            // ── 2. Collect distinct tournament IDs from the assigned rounds ────
            const roundsForTournaments = await RaceRound.find({ _id: { $in: raceRoundIds } }, 'tournamentId').lean();
            const allTournamentIds = [...new Set(
                roundsForTournaments.map(r => r.tournamentId?.toString()).filter(Boolean)
            )];

            // ── 3. Paginate tournaments with filter ───────────────────────────
            const skip = (page - 1) * limit;
            const tFilter = { _id: { $in: allTournamentIds } };
            if (status) tFilter.status = status;
            if (search) tFilter.tournamentName = { $regex: search, $options: 'i' };
            const sortObj = { [sortBy]: order === 'asc' ? 1 : -1 };

            const [tournaments, totalItems] = await Promise.all([
                Tournament.find(tFilter).sort(sortObj).skip(skip).limit(limit).lean(),
                Tournament.countDocuments(tFilter),
            ]);

            if (!tournaments.length) {
                return {
                    code: 200,
                    data: { items: [], pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit } },
                    msg: 'Referee tournaments retrieved successfully',
                };
            }

            // ── 4. Bulk fetch data only for this page's tournaments ───────────
            const pageTournamentIds = tournaments.map(t => t._id.toString());
            const pageRaceRounds = await RaceRound.find({
                _id: { $in: raceRoundIds },
                tournamentId: { $in: pageTournamentIds },
            }).lean();

            const pageRaceRoundIds = pageRaceRounds.map(r => r._id);
            const eligibilityIds = [...new Set(
                pageRaceRounds.filter(r => r.eligibilityRuleId).map(r => r.eligibilityRuleId.toString())
            )];
            const registrationsAll = await Registration.find({ raceRoundId: { $in: pageRaceRoundIds } }).lean();
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

            // ── 5. Build lookup maps ──────────────────────────────────────────
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
            const roundsByTournament = new Map();
            for (const r of pageRaceRounds) {
                const key = r.tournamentId?.toString();
                if (!key) continue;
                if (!roundsByTournament.has(key)) roundsByTournament.set(key, []);
                roundsByTournament.get(key).push(r);
            }

            // ── 6. Assemble items ─────────────────────────────────────────────
            const items = tournaments.map(t => {
                const tRounds = (roundsByTournament.get(t._id.toString()) || []).map(r => {
                    const raceType = eligibilityMap.get(r.eligibilityRuleId?.toString()) || null;
                    const registrations = (regsByRound.get(r._id.toString()) || []).map(reg => {
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
                        ...r,
                        RaceType: raceType,
                        RaceReferee: assignmentMap.get(r._id.toString()) || null,
                        Registration: registrations,
                    };
                });
                return { ...t, RaceRound: tRounds };
            });

            return {
                code: 200,
                data: { items, pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit } },
                msg: 'Referee tournaments retrieved successfully',
            };
        } catch (error) {
            console.error('Error fetching referee tournaments:', error);
            return { code: 500, msg: error.message };
        }
    }
    // ── Violation Types ───────────────────────────────────────────────────────

    async getViolationTypes(type, page = 1, limit = 50, search = null, sortBy = 'severity', order = 'asc') {
        try {
            const skip = (page - 1) * limit;
            const filter = { isActive: true };
            if (type) filter.type = type;
            if (search) filter.violationName = { $regex: search, $options: 'i' };
            const sortObj = { [sortBy]: order === 'asc' ? 1 : -1, violationName: 1 };
            const [items, totalItems] = await Promise.all([
                ViolationType.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
                ViolationType.countDocuments(filter),
            ]);
            return {
                code: 200,
                data: { items, pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit } },
                msg: 'Violation types retrieved.',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // ── Violations (race-round scoped) ────────────────────────────────────────

    async getRaceRoundViolations(refereeId, raceRoundId, status = null, search = null, sortBy = 'created_at', order = 'desc') {
        try {
            const assignment = await RaceReferee.findOne({ refereeId, raceRoundId }).lean();
            if (!assignment) return { code: 403, msg: 'You are not assigned to this race round.' };

            const filter = { raceRoundId };
            if (status) filter.violationStatus = status;
            if (search) filter.description = { $regex: search, $options: 'i' };
            const sortObj = { [sortBy]: order === 'asc' ? 1 : -1 };

            const violations = await Violation.find(filter)
                .populate('violationTypeId', 'violationName type category severity defaultPenalty')
                .populate('registrationId', '_id registrationStatus')
                .sort(sortObj)
                .lean();

            return {
                code: 200,
                data: violations,
                msg: 'Violations retrieved.',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async createViolation(refereeId, body, io) {
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
            if (io) {
                io.to(`race:${raceRoundId}`).emit('violation_created', { violation: populated });
            }
            return { code: 201, data: populated, msg: 'Violation created.' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async confirmViolation(refereeId, violationId) {
        try {
            const violation = await Violation.findById(violationId).lean();
            if (!violation) return { code: 404, msg: 'Violation not found.' };

            // Confirm the referee owns this violation via their assignment
            const assignment = await RaceReferee.findOne({
                _id: violation.raceRefereeId,
                refereeId,
            }).lean();
            if (!assignment) return { code: 403, msg: 'You do not have permission to confirm this violation.' };

            await Violation.findByIdAndUpdate(violationId, { violationStatus: 'confirmed' });
            return { code: 200, msg: 'Violation confirmed.' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async deleteViolation(refereeId, violationId, io) {
        try {
            const violation = await Violation.findById(violationId).lean();
            if (!violation) return { code: 404, msg: 'Violation not found.' };

            // Confirm the referee owns this violation via their assignment
            const assignment = await RaceReferee.findOne({
                _id: violation.raceRefereeId,
                refereeId,
            }).lean();
            if (!assignment) return { code: 403, msg: 'You do not have permission to delete this violation.' };

            const raceRoundId = String(violation.raceRoundId);
            await Violation.findByIdAndDelete(violationId);
            if (io) {
                io.to(`race:${raceRoundId}`).emit('violation_deleted', { violationId });
            }
            return { code: 200, msg: 'Violation deleted.' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new RefereeService();
