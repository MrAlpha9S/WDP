const RaceRefereeRepository = require('../repositories/RaceRefereeRepository');
const NotificationService = require('./NotificationService');
const Invitation = require('../entities/Invitation');
const Registration = require('../entities/Registration');
const RaceReferee = require('../entities/RaceReferee');

class InvitationService {
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
                actionPayload: { entityType: 'RaceReferee', entityId: updated._id },
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
                actionPayload: { entityType: 'RaceReferee', entityId: updated._id },
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

            // Only a jockey who actually confirmed can be marked a no-show — this also
            // prevents overwriting a pending/declined/cancelled invitation (e.g. a race
            // condition against the jockey's own accept/decline, or resurrecting an
            // invitation whose race round was already cancelled).
            if (invitation.invitationStatus !== 'accepted') {
                return { code: 400, msg: `Cannot mark as no-show: invitation is "${invitation.invitationStatus}", not "accepted".` };
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
                actionPayload: { entityType: 'Invitation', entityId: invitationId },
            }, io).catch(err => console.error('[markJockeyNoShow] notify error:', err.message));

            return { code: 200, data: updated, msg: 'Jockey marked as no-show successfully.' };
        } catch (error) {
            console.error('Error marking jockey no-show:', error);
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new InvitationService();
