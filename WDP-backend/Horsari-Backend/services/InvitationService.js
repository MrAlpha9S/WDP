const InvitationRepository = require('../repositories/InvitationRepository');
const Registration = require('../entities/Registration');
const Invitation = require('../entities/Invitation');
const Horse = require('../entities/Horse');
const Jockey = require('../entities/Jockey');
const RaceRound = require('../entities/RaceRound');
const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
const RaceResult = require('../entities/RaceResult');
const NotificationService = require('./NotificationService');
const { findJockeyScheduleConflict } = require('./JockeyScheduleConflict');
const { findHorseScheduleConflict } = require('./HorseScheduleConflict');
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
        if (registration.registrationStatus !== 'accepted') {
            return { code: 422, message: `Registration is "${registration.registrationStatus}". Only accepted registrations can receive jockey invitations.` };
        }
        if (String(registration.horseOwnerId) !== String(ownerId)) {
            return { code: 403, message: 'You are not authorized to modify this registration.' };
        }

        const horse = await Horse.findById(horseId).lean();
        if (!horse) return { code: 404, message: 'Horse not found' };
        if (String(horse.ownerId) !== String(ownerId)) {
            return { code: 403, message: 'You do not own this horse.' };
        }

        const raceRound = await RaceRound.findById(registration.raceRoundId).lean();
        if (raceRound?.eligibilityRuleId) {
            const rule = await RaceEligibilityRule.findById(raceRound.eligibilityRuleId).lean();
            if (rule) {
                const ineligibleReason = await this._checkHorseEligibility(horse, rule);
                if (ineligibleReason) {
                    return { code: 422, message: ineligibleReason };
                }
            }
        }

        // Only a NEW horse commitment can create a same-day conflict — once
        // Registration.horseId is set, later invitations to this same
        // registration just reuse it (enforced by the "same horse" check below).
        if (!registration.horseId) {
            const horseConflict = await findHorseScheduleConflict(horseId, registration.raceRoundId, {
                excludeRegistrationId: registrationId,
            });
            if (horseConflict) {
                return {
                    code: 409,
                    message: 'This horse is already committed to another race on the same day.',
                };
            }
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

        // Don't invite a jockey who already has an accepted invitation for
        // this same race round, or one scheduled too close to it in time.
        const conflict = await findJockeyScheduleConflict(jockeyId, registration.raceRoundId);
        if (conflict) {
            return {
                code: 409,
                message: conflict.sameRound
                    ? 'This jockey already has an accepted invitation for a different horse in this same race round.'
                    : 'This jockey already has an accepted invitation for a race scheduled too close to this one.',
            };
        }

        // Booking fee floor: the owner may offer more than the jockey's own
        // default rate, but never less.
        const jockeyDoc = await Jockey.findById(jockeyId).lean();
        const defaultFee = jockeyDoc?.bookingFee ?? 0;
        const finalBookingFees = data.bookingFees != null ? Math.max(data.bookingFees, defaultFee) : defaultFee;

        const invitation = await InvitationRepository.create({ ...data, bookingFees: finalBookingFees });

        // Keep Registration.horseId in sync — set once when the first invitation is created
        if (!registration.horseId) {
            await Registration.findByIdAndUpdate(registrationId, { horseId });
        }

        NotificationService.notify({
            recipientIds: [jockeyId],
            role: 'admin',
            type: 'jockey_invited',
            title: 'New Race Invitation',
            message: 'A horse owner has invited you to race.',
            actionPayload: { entityType: 'Invitation', entityId: invitation._id },
        }, io).catch(err => console.error('[createInvitation] notify jockey error:', err.message));

        return {
            code: 201,
            message: "Invitation created successfully",
            data: invitation
        };
    }

    // Mirrors the frontend's checkEligibility (CreateRaceParticipants.tsx) field-for-field,
    // so server and client agree — returns a rejection reason string, or null if eligible.
    async _checkHorseEligibility(horse, rule) {
        if (horse.status !== 'active' || horse.healthStatus !== 'healthy') {
            return 'This horse must be active and healthy to race.';
        }
        if (rule.requiredBreed && horse.breed !== rule.requiredBreed) {
            return `This race requires breed "${rule.requiredBreed}".`;
        }
        if (rule.requiredGender && rule.requiredGender !== horse.gender) {
            return `This race requires gender "${rule.requiredGender}".`;
        }

        const currentYear = new Date().getFullYear();
        const horseAge = horse.dateOfBirth ? (currentYear - new Date(horse.dateOfBirth).getFullYear()) : 0;
        if (rule.minAge != null && horseAge < rule.minAge) {
            return `This race requires a minimum age of ${rule.minAge}.`;
        }
        if (rule.maxAge != null && horseAge > rule.maxAge) {
            return `This race requires a maximum age of ${rule.maxAge}.`;
        }

        if (rule.minRacesRun || rule.minRacesWon) {
            const pastRegs = await Registration.find({ horseId: horse._id }).select('_id').lean();
            const results = pastRegs.length
                ? await RaceResult.find({
                    registrationId: { $in: pastRegs.map(r => r._id) },
                    resultStatus: 'official',
                    finishPosition: { $ne: null },
                }).lean()
                : [];
            const racesRun = results.length;
            const wins = results.filter(r => r.finishPosition === 1).length;
            if (rule.minRacesRun && racesRun < rule.minRacesRun) {
                return `This race requires at least ${rule.minRacesRun} race(s) run.`;
            }
            if (rule.minRacesWon && wins < rule.minRacesWon) {
                return `This race requires at least ${rule.minRacesWon} win(s).`;
            }
        }

        return null; // eligible
    }
}
module.exports = new InvitationService();
