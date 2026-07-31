const JockeyRepository = require("../repositories/JockeyRepository");
const UserRepository = require("../repositories/UserRepository");
const SpectatorRaceService = require("./SpectatorRaceService");
const Invitation = require("../entities/Invitation");
const Registration = require("../entities/Registration");
const Horse = require("../entities/Horse");
const HorseOwner = require("../entities/HorseOwner");
const RaceRound = require("../entities/RaceRound");
const RaceEligibilityRule = require("../entities/RaceEligibilityRule");
const Tournament = require("../entities/Tournament");

class RaceService {
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

  // Mobile: browse every race round in the system, like admin does — reuses
  // spectator's role-agnostic race-listing query.
  async getAllRaces(page, limit, status, sortBy, order) {
    return SpectatorRaceService._listAllRaceRounds(page, limit, status, sortBy, order);
  }
}

module.exports = new RaceService();
