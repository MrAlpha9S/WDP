const JockeyService = require("../services/JockeyService");

class JockeyController {
  // Get all jockeys
  async getAllJockeys(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { sortBy = 'createdAt', order = 'desc' } = req.query;
    const response = await JockeyService.getAllJockeys(page, limit, sortBy, order);
    return res.status(response.code).json(response);
  }

  // Mobile: GET /my-race-schedule — flat array, includes invitationId/isBackup/percentagePayout
  async getMyRaceScheduleFlat(req, res) {
    const response = await JockeyService.getMyRaceScheduleFlat(req.userId);
    return res.status(response.code).json(response);
  }

  // Mobile: GET /my-invitations — flat array, nested horseOwner.user
  async getMyInvitationsFlat(req, res) {
    const { status } = req.query;
    const response = await JockeyService.getMyInvitationsFlat(req.userId, status);
    return res.status(response.code).json(response);
  }

  // Mobile: PUT /invitation/:invitationId/respond
  async respondToInvitationById(req, res) {
    const { invitationId } = req.params;
    const { jockeyConfirmation } = req.body;
    const io = req.app.get('io');
    const response = await JockeyService.respondToInvitationById(req.userId, invitationId, jockeyConfirmation, io);
    return res.status(response.code).json(response);
  }

  // Mobile: GET /my-profile — rank, stats, recent races (self-service)
  async getMyProfile(req, res) {
    const response = await JockeyService.getMyProfile(req.userId);
    return res.status(response.code).json(response);
  }

  // Mobile: PUT /my-profile — self-service profile edit
  async updateMyProfile(req, res) {
    const response = await JockeyService.updateMyProfile(req.userId, req.body);
    return res.status(response.code).json(response);
  }

  // Mobile: PUT /my-profile/license — re-upload license PDF (resets licenseStatus to pending)
  async updateMyLicense(req, res) {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ code: 400, msg: 'License PDF is required' });
    }
    const response = await JockeyService.updateMyLicense(req.userId, req.file.buffer, req.file.originalname);
    return res.status(response.code).json(response);
  }

  // Mobile: GET /all-races — browse every race round, like admin does
  async getAllRaces(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { filter, status, sortBy = 'raceDate', order = 'asc' } = req.query;
    const response = await JockeyService.getAllRaces(page, limit, filter || status || null, sortBy, order);
    return res.status(response.code).json(response);
  }

  // GET /race-rounds/:raceRoundId — single race round detail (field/standings
  // + this jockey's own result/violations), pre- or post-race.
  async getRaceRoundDetail(req, res) {
    const { raceRoundId } = req.params;
    const response = await JockeyService.getRaceRoundDetail(req.userId, raceRoundId);
    return res.status(response.code).json(response);
  }

  // GET /wallet — wallet statistic + payment stats
  async getWalletInfo(req, res) {
    const response = await JockeyService.getWalletInfo(req.userId);
    return res.status(response.code).json(response);
  }

  // GET /statistics — win rate, rank, payouts earned/pending, main-vs-backup breakdown
  async getStatistics(req, res) {
    const response = await JockeyService.getStatistics(req.userId);
    return res.status(response.code).json(response);
  }

  // GET /statistics/earnings-series — payouts earned over time, gap-filled
  async getEarningsSeries(req, res) {
    const { groupBy = 'day' } = req.query;
    const response = await JockeyService.getEarningsSeries(req.userId, groupBy);
    return res.status(response.code).json(response);
  }
}

module.exports = new JockeyController();
