const JockeyRaceService = require("../../services/JockeyRaceService");

class RaceController {
  // Mobile: GET /my-race-schedule — flat array, includes invitationId/isBackup/percentagePayout
  async getMyRaceScheduleFlat(req, res) {
    const response = await JockeyRaceService.getMyRaceScheduleFlat(req.userId);
    return res.status(response.code).json(response);
  }

  // Mobile: GET /all-races — browse every race round, like admin does
  async getAllRaces(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { filter, status, sortBy = 'raceDate', order = 'asc' } = req.query;
    const response = await JockeyRaceService.getAllRaces(page, limit, filter || status || null, sortBy, order);
    return res.status(response.code).json(response);
  }
}

module.exports = new RaceController();
