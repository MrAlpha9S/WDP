const JockeyRepository = require("../repositories/JockeyRepository");
const UserRepository = require("../repositories/UserRepository");
const NotificationService = require("./NotificationService");
const { findJockeyScheduleConflict } = require("./JockeyScheduleConflict");
const Invitation = require("../entities/Invitation");
const Registration = require("../entities/Registration");
const Horse = require("../entities/Horse");
const HorseOwner = require("../entities/HorseOwner");
const RaceRound = require("../entities/RaceRound");
const RaceEligibilityRule = require("../entities/RaceEligibilityRule");
const Tournament = require("../entities/Tournament");

class InvitationService {
  // Respond to invitation
  async respondToInvitation(jockeyId, invitationData, io) {
    try {
      const { invitationId, jockeyConfirmation } = invitationData;

      if (!invitationId) {
        return {
          code: 400,
          msg: "invitationId is required",
        };
      }

      if (!["accepted", "rejected"].includes(jockeyConfirmation)) {
        return {
          code: 400,
          msg: 'jockeyConfirmation must be "accepted" or "rejected"',
        };
      }

      const invitation = await Invitation.findById(invitationId);
      if (!invitation) {
        return {
          code: 404,
          msg: "Invitation not found",
        };
      }

      // Check if invitation belongs to this jockey
      if (String(invitation.jockeyId) !== String(jockeyId)) {
        return {
          code: 403,
          msg: "This invitation does not belong to you",
        };
      }

      // Check if invitation is still pending (covers all re-respond cases)
      if (invitation.invitationStatus !== "pending") {
        return {
          code: 400,
          msg: "Cannot respond to a non-pending invitation",
        };
      }

      // Update invitation
      // Map "rejected" (mobile term) → "declined" (DB enum value)
      if (jockeyConfirmation === "accepted") {
        const registration = invitation.registrationId
          ? await Registration.findById(invitation.registrationId).lean()
          : null;
        if (registration?.raceRoundId) {
          const conflict = await findJockeyScheduleConflict(jockeyId, registration.raceRoundId, { excludeInvitationId: invitation._id });
          if (conflict) {
            return {
              code: 409,
              msg: conflict.sameRound
                ? "You already have an accepted invitation for a different horse in this same race round."
                : "You already have an accepted invitation for a race scheduled too close to this one.",
            };
          }
        }

        invitation.jockeyConfirmation = true;
        invitation.invitationStatus = "accepted";
      } else {
        invitation.jockeyConfirmation = false;
        invitation.invitationStatus = "declined";
      }

      await invitation.save();

      if (invitation.registrationId) {
        const registration = await Registration.findById(invitation.registrationId).lean();
        if (registration?.horseOwnerId) {
          NotificationService.notify({
            recipientIds: [registration.horseOwnerId],
            role: 'admin',
            type: jockeyConfirmation === 'accepted' ? 'invitation_accepted' : 'invitation_declined',
            title: jockeyConfirmation === 'accepted' ? 'Jockey Accepted Invitation' : 'Jockey Declined Invitation',
            message: `A jockey has ${invitation.invitationStatus} your race invitation.`,
            actionPayload: { entityType: 'Invitation', entityId: invitation._id },
          }, io).catch(err => console.error('[respondToInvitation] notify owner error:', err.message));
        }
      }

      return {
        code: 200,
        data: invitation,
        msg: `Invitation ${jockeyConfirmation} successfully`,
      };
    } catch (error) {
      return {
        code: 500,
        msg: error.message,
      };
    }
  }

  // Mobile: flat InvitationItem[] with nested horseOwner.user
  async getMyInvitationsFlat(jockeyId, status = null) {
    try {
      const jockey = await JockeyRepository.findByJockeyId(jockeyId);
      if (!jockey) return { code: 404, msg: 'Jockey not found' };

      const statusFilter = status ? { $in: [status] } : { $in: ['pending', 'accepted', 'declined', 'cancelled', 'didNotAttend'] };
      const invitations = await Invitation.find({
        jockeyId: jockey._id,
        invitationStatus: statusFilter,
      }).sort({ createdAt: -1 }).lean();

      const result = await Promise.all(
        invitations.map(async inv => {
          const horse = await Horse.findById(inv.horseId).lean();
          const registration = await Registration.findById(inv.registrationId).lean();
          const horseOwner = registration
            ? await HorseOwner.findById(registration.horseOwnerId).lean()
            : null;
          const horseOwnerUser = horseOwner
            ? await UserRepository.findById(horseOwner._id)
            : null;
          const raceRound = registration
            ? await RaceRound.findById(registration.raceRoundId).lean()
            : null;
          const tournament = raceRound
            ? await Tournament.findById(raceRound.tournamentId).lean()
            : null;
          const eligibilityRule = raceRound?.eligibilityRuleId
            ? await RaceEligibilityRule.findById(raceRound.eligibilityRuleId).lean()
            : null;

          return {
            invitationId: inv._id,
            invitationStatus: inv.invitationStatus,
            ownerConfirmation: inv.ownerConfirmation,
            jockeyConfirmation: inv.jockeyConfirmation,
            isBackup: inv.isBackup,
            percentagePayout: inv.percentagePayout,
            bookingFees: inv.bookingFees ?? 0,
            horse: horse ? {
              horseId: horse._id,
              horseName: horse.horseName,
              breed: horse.breed,
              gender: horse.gender,
            } : null,
            registration: registration ? {
              registrationId: registration._id,
              registrationStatus: registration.registrationStatus,
              registeredAt: registration.registeredAt,
            } : null,
            horseOwner: horseOwner ? {
              ownerId: horseOwner._id,
              user: horseOwnerUser ? {
                fullName: horseOwnerUser.fullName,
                phoneNumber: horseOwnerUser.phoneNumber || null,
              } : null,
            } : null,
            raceRound: raceRound ? {
              raceRoundId: raceRound._id,
              roundName: raceRound.roundName,
              raceDate: raceRound.raceDate || null,
              trackLength: raceRound.trackLength,
              location: raceRound.location,
              raceGround: raceRound.raceGround,
              status: raceRound.status,
              baseFee: raceRound.baseFee,
              raceType: eligibilityRule?.raceType ?? null,
            } : null,
            tournament: tournament ? {
              tournamentId: tournament._id,
              tournamentName: tournament.tournamentName,
            } : null,
          };
        }),
      );

      return { code: 200, data: result, msg: 'Invitations retrieved successfully' };
    } catch (error) {
      return { code: 500, msg: error.message };
    }
  }

  // Mobile: respond by invitationId from URL param
  async respondToInvitationById(jockeyId, invitationId, jockeyConfirmation, io) {
    return this.respondToInvitation(jockeyId, { invitationId, jockeyConfirmation }, io);
  }
}

module.exports = new InvitationService();
