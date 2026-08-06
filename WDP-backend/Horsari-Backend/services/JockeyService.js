const JockeyRepository = require("../repositories/JockeyRepository");
const UserRepository = require("../repositories/UserRepository");
const TransactionRepository = require("../repositories/TransactionRepository");
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
const { releaseHorseIfNoActiveInvitation } = require("./HorseScheduleConflict");
const ProfileUpdateUtil = require("../utils/ProfileUpdateUtil");

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

      if (jockeyConfirmation === 'rejected' && invitation.registrationId) {
        // A declined invitation is a dead commitment — release the horse's
        // day-slot lock if nothing else is still holding this registration.
        await releaseHorseIfNoActiveInvitation(invitation.registrationId);
      }

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
    const { bookingFee, weight, height, fullName, phoneNumber, address, image, dateOfBirth } = updateData;

    if (bookingFee != null && (typeof bookingFee !== 'number' || bookingFee < 0)) {
      return { code: 400, msg: 'bookingFee must be a non-negative number' };
    }
    if (weight != null && (typeof weight !== 'number' || weight <= 0)) {
      return { code: 400, msg: 'weight must be a positive number' };
    }
    if (height != null && (typeof height !== 'number' || height <= 0)) {
      return { code: 400, msg: 'height must be a positive number' };
    }
    let parsedDateOfBirth;
    if (dateOfBirth != null) {
      parsedDateOfBirth = new Date(dateOfBirth);
      if (Number.isNaN(parsedDateOfBirth.getTime()) || parsedDateOfBirth > new Date()) {
        return { code: 400, msg: 'dateOfBirth must be a valid, non-future date' };
      }
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
    if (parsedDateOfBirth != null) userFields.dateOfBirth = parsedDateOfBirth;

    await Promise.all([
      Object.keys(jockeyFields).length ? JockeyRepository.updateByJockeyId(jockeyId, jockeyFields) : null,
      Object.keys(userFields).length ? UserRepository.updateById(jockeyId, userFields) : null,
    ]);

    return HorseOwnerService.getJockeyProfile(jockeyId);
  }

  // Re-uploading a license requires re-verification, so licenseStatus
  // always resets to 'pending' regardless of its previous value.
  async updateMyLicense(jockeyId, fileBuffer, fileName) {
    try {
      if (!fileBuffer) return { code: 400, msg: 'License PDF is required' };
      const { licenseLink, licenseStatus } = await ProfileUpdateUtil.reuploadLicense(fileBuffer, fileName, 'licenses/jockey');
      await JockeyRepository.updateByJockeyId(jockeyId, { licenseLink, licenseStatus });
      return HorseOwnerService.getJockeyProfile(jockeyId);
    } catch (error) {
      return { code: 500, msg: error.message };
    }
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

  // ─── Statistics ────────────────────────────────────────────────────────────

  async getStatistics(jockeyId) {
    try {
      const jockey = await JockeyRepository.findByJockeyId(jockeyId);
      if (!jockey) return { code: 404, msg: 'Jockey not found' };

      const mongoose = require('mongoose');
      const Transaction = require('../entities/Transaction');
      const jockeyObjectId = new mongoose.Types.ObjectId(String(jockeyId));

      const [
        { rank, totalJockeys, winRate },
        totalPayoutsEarned,
        pendingPayoutsAmount,
        invitationAgg,
        roleAgg,
      ] = await Promise.all([
        JockeyRepository.getWinRateRank(jockeyId),
        TransactionRepository.sumAmountByParty(jockeyId, 'jockey', 'payee', { paymentStatus: 'paid' }),
        TransactionRepository.sumAmountByParty(jockeyId, 'jockey', 'payee', { paymentStatus: { $ne: 'paid' } }),
        Invitation.aggregate([
          { $match: { jockeyId: jockeyObjectId } },
          { $group: { _id: '$invitationStatus', count: { $sum: 1 } } },
        ]),
        Transaction.aggregate([
          { $match: { payeeId: jockeyObjectId, payeeRole: 'jockey', paymentType: 'jockey_payout', paymentStatus: 'paid' } },
          { $lookup: { from: 'invitations', localField: 'sourceId', foreignField: '_id', as: 'inv' } },
          { $unwind: '$inv' },
          { $group: { _id: '$inv.isBackup', count: { $sum: 1 }, earnings: { $sum: '$amount' } } },
        ]),
      ]);

      const invitationCounts = Object.fromEntries(invitationAgg.map(r => [r._id, r.count]));
      const invitations = {
        pending: invitationCounts.pending ?? 0,
        accepted: invitationCounts.accepted ?? 0,
        declined: invitationCounts.declined ?? 0,
        cancelled: invitationCounts.cancelled ?? 0,
        noShow: invitationCounts.didNotAttend ?? 0,
      };

      const roleRows = Object.fromEntries(roleAgg.map(r => [r._id ? 'backup' : 'main', { count: r.count, earnings: r.earnings }]));
      const byRole = {
        main: roleRows.main ?? { count: 0, earnings: 0 },
        backup: roleRows.backup ?? { count: 0, earnings: 0 },
      };

      return {
        code: 200,
        data: {
          wallet: jockey.wallet,
          matchesRaced: jockey.matchesRaced,
          totalWins: jockey.totalWins,
          winRate,
          rank,
          totalJockeys,
          totalPayoutsEarned: totalPayoutsEarned || 0,
          pendingPayoutsAmount: pendingPayoutsAmount || 0,
          invitations,
          byRole,
        },
        msg: 'Jockey statistics retrieved successfully',
      };
    } catch (error) {
      return { code: 500, msg: error.message };
    }
  }

  // Payouts earned over time (day/week/month/year), gap-filled so charts
  // always render a contiguous line. Mirrors RefereeService.getFeesEarningsSeries.
  async getEarningsSeries(jockeyId, groupBy = 'day') {
    try {
      const mongoose = require('mongoose');
      const Transaction = require('../entities/Transaction');

      let dateFormat = '%Y-%m-%d';
      if (groupBy === 'week') dateFormat = '%Y-%U';
      else if (groupBy === 'month') dateFormat = '%Y-%m';
      else if (groupBy === 'year') dateFormat = '%Y';

      const series = await Transaction.aggregate([
        {
          $match: {
            payeeId: new mongoose.Types.ObjectId(String(jockeyId)),
            payeeRole: 'jockey',
            paymentType: 'jockey_payout',
            paymentStatus: 'paid',
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$date' } },
            payoutsEarned: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      let result = series.map(row => ({ date: row._id, payoutsEarned: parseFloat(row.payoutsEarned.toFixed(2)) }));

      const getPastPeriods = (type) => {
        const pad = n => n.toString().padStart(2, '0');
        const periods = [];
        const count = type === 'year' ? 3 : type === 'month' ? 6 : type === 'week' ? 4 : 7;
        for (let i = count - 1; i >= 0; i--) {
          const d = new Date();
          if (type === 'year') {
            d.setFullYear(d.getFullYear() - i);
            periods.push(`${d.getFullYear()}`);
          } else if (type === 'month') {
            d.setMonth(d.getMonth() - i);
            periods.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
          } else if (type === 'week') {
            d.setDate(d.getDate() - (i * 7));
            const startOfYear = new Date(d.getFullYear(), 0, 1);
            const days = Math.floor((d - startOfYear) / (24 * 60 * 60 * 1000));
            const weekNum = Math.floor((days + startOfYear.getDay()) / 7);
            periods.push(`${d.getFullYear()}-${pad(weekNum)}`);
          } else {
            d.setDate(d.getDate() - i);
            periods.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
          }
        }
        return periods;
      };

      const dbMap = new Map(result.map(r => [r.date, r]));
      for (const date of getPastPeriods(groupBy)) {
        if (!dbMap.has(date)) {
          result.push({ date, payoutsEarned: 0 });
          dbMap.set(date, true);
        }
      }
      result.sort((a, b) => a.date.localeCompare(b.date));

      const totalPayoutsEarned = parseFloat(result.reduce((s, r) => s + r.payoutsEarned, 0).toFixed(2));

      return { code: 200, data: { totalPayoutsEarned, series: result }, msg: 'Payout earnings series retrieved successfully' };
    } catch (error) {
      return { code: 500, msg: error.message };
    }
  }
}

module.exports = new JockeyService();
