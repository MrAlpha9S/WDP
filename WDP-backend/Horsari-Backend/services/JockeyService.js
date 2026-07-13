const JockeyRepository = require("../repositories/JockeyRepository");
const UserRepository = require("../repositories/UserRepository");
const HorseOwnerService = require("./HorseOwnerService");
const SpectatorService = require("./SpectatorService");
const Invitation = require("../entities/Invitation");
const Registration = require("../entities/Registration");
const Horse = require("../entities/Horse");
const HorseOwner = require("../entities/HorseOwner");
const RaceRound = require("../entities/RaceRound");
const RaceEligibilityRule = require("../entities/RaceEligibilityRule");
const Tournament = require("../entities/Tournament");
const NotificationService = require("./NotificationService");
const { findJockeyScheduleConflict } = require("./JockeyScheduleConflict");

class JockeyService {
  // Get all jockeys
  async getAllJockeys(page = 1, limit = 10, sortBy = 'createdAt', order = 'desc') {
    try {
      const skip = (page - 1) * limit;
      const orderNum = order === 'asc' ? 1 : -1;

      let items, totalItems;
      if (sortBy === 'winRate') {
        [items, totalItems] = await Promise.all([
          JockeyRepository.findAllSortedByWinRate(limit, skip, orderNum),
          JockeyRepository.count(),
        ]);
      } else {
        const sortObj = { [sortBy]: orderNum };
        const [jockeys, total] = await Promise.all([
          JockeyRepository.findAll(limit, skip, sortObj),
          JockeyRepository.count(),
        ]);
        items = jockeys.map((i) => {
          const { _id, ...rest } = i.toObject();
          const { passwordHash, ...rest2 } = i._id.toObject();
          return Object.assign({}, rest, rest2);
        });
        totalItems = total;
      }

      return {
        code: 200,
        data: {
          items,
          pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit },
        },
        msg: "Jockeys retrieved successfully",
      };
    } catch (error) {
      return { code: 500, msg: error.message };
    }
  }

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
            type: jockeyConfirmation === 'accepted' ? 'invitation_accepted' : 'invitation_declined',
            title: jockeyConfirmation === 'accepted' ? 'Jockey Accepted Invitation' : 'Jockey Declined Invitation',
            message: `A jockey has ${invitation.invitationStatus} your race invitation.`,
            relatedEntityType: 'Invitation',
            relatedEntityId: invitation._id,
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

  // Mobile: flat ScheduleItem[] with invitationId, isBackup, percentagePayout, nested horseOwner.user
  async getMyRaceScheduleFlat(jockeyId) {
    try {
      const jockey = await JockeyRepository.findByJockeyId(jockeyId);
      if (!jockey) return { code: 404, msg: 'Jockey not found' };

      const invitations = await Invitation.find({
        jockeyId: jockey._id,
        invitationStatus: 'accepted',
      }).sort({ createdAt: -1 }).lean();

      const result = await Promise.all(
        invitations.map(async inv => {
          const registration = await Registration.findById(inv.registrationId).lean();
          const horse = await Horse.findById(inv.horseId).lean();
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
            isBackup: inv.isBackup,
            percentagePayout: inv.percentagePayout,
            bookingFees: inv.bookingFees ?? 0,
            horse: horse ? {
              horseId: horse._id,
              horseName: horse.horseName,
              breed: horse.breed,
              healthStatus: horse.healthStatus,
            } : null,
            registration: registration ? { registrationId: registration._id } : null,
            horseOwner: horseOwner ? {
              ownerId: horseOwner._id,
              user: horseOwnerUser ? { fullName: horseOwnerUser.fullName } : null,
            } : null,
            raceRound: raceRound ? {
              raceRoundId: raceRound._id,
              roundName: raceRound.roundName,
              raceDate: raceRound.raceDate,
              trackLength: raceRound.trackLength,
              location: raceRound.location,
              address: raceRound.address,
              raceGround: raceRound.raceGround,
              maxParticipants: raceRound.maxParticipants,
              status: raceRound.status,
              requireEntranceFees: raceRound.requireEntranceFees,
              raceType: eligibilityRule?.raceType ?? null,
            } : null,
            tournament: tournament ? {
              tournamentName: tournament.tournamentName,
              startDate: tournament.startDate,
              endDate: tournament.endDate,
            } : null,
          };
        }),
      );

      // Sort by raceDate ascending
      result.sort((a, b) => {
        const da = a.raceRound?.raceDate ? new Date(a.raceRound.raceDate) : new Date(0);
        const db = b.raceRound?.raceDate ? new Date(b.raceRound.raceDate) : new Date(0);
        return da - db;
      });

      return { code: 200, data: result, msg: 'Race schedule retrieved successfully' };
    } catch (error) {
      return { code: 500, msg: error.message };
    }
  }

  // Mobile: flat InvitationItem[] with nested horseOwner.user
  async getMyInvitationsFlat(jockeyId, status = null) {
    try {
      const jockey = await JockeyRepository.findByJockeyId(jockeyId);
      if (!jockey) return { code: 404, msg: 'Jockey not found' };

      const statusFilter = status ? { $in: [status] } : { $in: ['pending', 'accepted', 'declined', 'cancelled'] };
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
              minimalRidingFees: raceRound.minimalRidingFees,
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

  // ─── Profile ─────────────────────────────────────────────────────────────

  // Mobile: jockey's own profile — reuses the horse-owner-facing jockey
  // profile lookup (rank, stats, recent races), since it's already keyed
  // purely off jockeyId with no horse-owner-specific access check.
  async getMyProfile(jockeyId) {
    return HorseOwnerService.getJockeyProfile(jockeyId);
  }

  // Mobile: jockey self-service profile edit. Only these whitelisted fields
  // are ever touched — email/username/password/role/status/licenseStatus/
  // licenseLink/wallet/matchesRaced/totalWins are system-managed and never
  // accepted here.
  async updateMyProfile(jockeyId, updateData) {
    const { bookingFee, weight, height, fullName, phoneNumber, address, image } = updateData;

    if (bookingFee != null && (typeof bookingFee !== 'number' || bookingFee < 0)) {
      return { code: 400, msg: 'bookingFee must be a non-negative number' };
    }
    if (weight != null && (typeof weight !== 'number' || weight <= 0)) {
      return { code: 400, msg: 'weight must be a positive number' };
    }
    if (height != null && (typeof height !== 'number' || height <= 0)) {
      return { code: 400, msg: 'height must be a positive number' };
    }

    const jockeyFields = {};
    if (bookingFee != null) jockeyFields.bookingFee = bookingFee;
    if (weight != null) jockeyFields.weight = weight;
    if (height != null) jockeyFields.height = height;

    const userFields = {};
    if (fullName != null) userFields.fullName = fullName;
    if (phoneNumber != null) userFields.phoneNumber = phoneNumber;
    if (address != null) userFields.address = address;
    if (image != null) userFields.image = image;

    await Promise.all([
      Object.keys(jockeyFields).length ? JockeyRepository.updateByJockeyId(jockeyId, jockeyFields) : null,
      Object.keys(userFields).length ? UserRepository.updateById(jockeyId, userFields) : null,
    ]);

    return HorseOwnerService.getJockeyProfile(jockeyId);
  }

  // ─── Races ───────────────────────────────────────────────────────────────

  // Mobile: browse every race round in the system, like admin does — reuses
  // spectator's role-agnostic race-listing query.
  async getAllRaces(page, limit, status, sortBy, order) {
    return SpectatorService._listAllRaceRounds(page, limit, status, sortBy, order);
  }

  // ─── Wallet ──────────────────────────────────────────────────────────────

  async getWalletInfo(jockeyId) {
    try {
      const jockey = await JockeyRepository.findByJockeyId(jockeyId);
      if (!jockey) return { code: 404, msg: 'Jockey not found' };

      const Transaction = require('../entities/Transaction');
      const totalPaymentsReceived = await Transaction.countDocuments({
        payeeId: jockeyId,
        payeeRole: 'jockey',
        paymentStatus: 'paid',
      });

      return {
        code: 200,
        data: {
          jockey: { _id: jockey._id, wallet: jockey.wallet },
          stats: { totalPaymentsReceived },
        },
        msg: 'Wallet info retrieved successfully',
      };
    } catch (error) {
      return { code: 500, msg: error.message };
    }
  }
}

module.exports = new JockeyService();
