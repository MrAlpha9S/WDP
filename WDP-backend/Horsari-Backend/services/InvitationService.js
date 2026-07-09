const InvitationRepository = require('../repositories/InvitationRepository');
const Registration = require('../entities/Registration');
const Invitation = require('../entities/Invitation');
const Horse = require('../entities/Horse');
const NotificationService = require('./NotificationService');
/**
 * return {
 * code: 200,
 * message: "Success",
 * data: {}
 * }
 */
class InvitationService {
    async createInvitation(ownerId, data, io) {
        const { registrationId, horseId, jockeyId } = data || {};

        if (!registrationId) return { code: 400, message: 'registrationId is required' };
        if (!horseId) return { code: 400, message: 'horseId is required' };
        if (!jockeyId) return { code: 400, message: 'jockeyId is required' };

        const registration = await Registration.findById(registrationId).lean();
        if (!registration) return { code: 404, message: 'Registration not found' };
        if (registration.registrationStatus !== 'approved') {
            return { code: 422, message: `Registration is "${registration.registrationStatus}". Only approved registrations can receive jockey invitations.` };
        }
        if (String(registration.horseOwnerId) !== String(ownerId)) {
            return { code: 403, message: 'You are not authorized to modify this registration.' };
        }

        const horse = await Horse.findById(horseId).lean();
        if (!horse) return { code: 404, message: 'Horse not found' };
        if (String(horse.ownerId) !== String(ownerId)) {
            return { code: 403, message: 'You do not own this horse.' };
        }

        // All invitations for a registration must share the same horse
        const existingInv = await Invitation.findOne({ registrationId }).lean();
        if (existingInv && String(existingInv.horseId) !== String(horseId)) {
            return { code: 409, message: 'All invitations for a registration must use the same horse.' };
        }

        // No duplicate jockey on the same registration
        const duplicate = await Invitation.findOne({ registrationId, jockeyId }).lean();
        if (duplicate) {
            return { code: 409, message: 'This jockey has already been invited to this registration.' };
        }

        const invitation = await InvitationRepository.create(data);

        // Keep Registration.horseId in sync — set once when the first invitation is created
        if (!registration.horseId) {
            await Registration.findByIdAndUpdate(registrationId, { horseId });
        }

        NotificationService.notify({
            recipientIds: [jockeyId],
            type: 'jockey_invited',
            title: 'New Race Invitation',
            message: 'A horse owner has invited you to race.',
            relatedEntityType: 'Invitation',
            relatedEntityId: invitation._id,
        }, io).catch(err => console.error('[createInvitation] notify jockey error:', err.message));

        return {
            code: 201,
            message: "Invitation created successfully",
            data: invitation
        };
    }
}
module.exports = new InvitationService();
