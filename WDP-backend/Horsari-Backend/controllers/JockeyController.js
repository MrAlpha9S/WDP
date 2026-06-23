const JockeyService = require("../services/JockeyService");
const UserService = require("../services/UserService");

class JockeyController {
  // (admin register removed)

  // Create jockey profile for existing user (public)
  async createJockey(req, res) {
    const { uid } = req.params;
    const response = await JockeyService.createJockey(uid, req.body);
    return res.status(response.code).json(response);
  }

  // Get jockey profile
  async getJockeyProfile(req, res) {
    const response = await JockeyService.getJockeyProfile(req.userId);
    return res.status(response.code).json(response);
  }

  // Get top jockeys
  async getTopJockeys(req, res) {
    const limit = parseInt(req.query.limit) || 10;
    const response = await JockeyService.getTopJockeys(limit);
    return res.status(response.code).json(response);
  }

  // Get jockey statistics
  async getJockeyStats(req, res) {
    const response = await JockeyService.getJockeyStats(req.userId);
    return res.status(response.code).json(response);
  }

  // Get my statistics
  async getMyStats(req, res) {
    const response = await JockeyService.getJockeyStats(req.userId);
    return res.status(response.code).json(response);
  }

  // Update jockey profile
  async updateJockeyProfile(req, res) {
    const response = await JockeyService.updateJockeyProfile(
      req.userId,
      req.body,
    );
    return res.status(response.code).json(response);
  }

  // Get all jockeys
  async getAllJockeys(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { sortBy = 'createdAt', order = 'desc' } = req.query;
    const response = await JockeyService.getAllJockeys(page, limit, sortBy, order);
    return res.status(response.code).json(response);
  }

  // Get jockeys by status
  async getJockeysByStatus(req, res) {
    const { status } = req.params;
    const response = await JockeyService.getJockeysByStatus(status);
    return res.status(response.code).json(response);
  }

  // Add win
  async addWin(req, res) {
    const response = await JockeyService.addWin(req.userId);
    return res.status(response.code).json(response);
  }

  // Record match
  async recordMatch(req, res) {
    const response = await JockeyService.recordMatch(req.userId);
    return res.status(response.code).json(response);
  }

  // Get jockey profile with user data
  async getProfileWithUser(req, res) {
    const response = await JockeyService.getJockeyProfileWithUser(req.userId);
    return res.status(response.code).json(response);
  }

  // Update jockey profile with user data
  async updateProfileWithUser(req, res) {
    const response = await JockeyService.updateJockeyProfileWithUser(
      req.userId,
      req.body,
    );
    return res.status(response.code).json(response);
  }

  // Change password
  async changePassword(req, res) {
    const response = await UserService.changePassword(req.userId, req.body);
    return res.status(response.code).json(response);
  }

  // Get my invitations
  async getMyInvitations(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { status, sortBy = 'createdAt', order = 'desc' } = req.query;
    const response = await JockeyService.getMyInvitations(req.userId, page, limit, status, sortBy, order);
    return res.status(response.code).json(response);
  }

  // Respond to invitation
  async respondToInvitation(req, res) {
    const response = await JockeyService.respondToInvitation(
      req.userId,
      req.body,
    );
    return res.status(response.code).json(response);
  }

  // Get my race schedule
  async getMyRaceSchedule(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { sortBy = 'raceDate', order = 'asc' } = req.query;
    const response = await JockeyService.getMyRaceSchedule(req.userId, page, limit, sortBy, order);
    return res.status(response.code).json(response);
  }

  // View race history — races where jockey was the confirmed official rider
  async getViewRaceHistory(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { sortBy = 'raceDate', order = 'desc' } = req.query;
    const response = await JockeyService.getViewRaceHistory(req.userId, page, limit, sortBy, order);
    return res.status(response.code).json(response);
  }

  // Get horse detail with full race history
  async getHorseDetail(req, res) {
    const response = await JockeyService.getHorseDetail(req.params.horseId);
    return res.status(response.code).json(response);
  }

  // Get my race history
  async getMyRaceHistory(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { sortBy = 'raceDate', order = 'desc' } = req.query;
    const response = await JockeyService.getMyRaceHistory(req.userId, page, limit, sortBy, order);
    return res.status(response.code).json(response);
  }
}

module.exports = new JockeyController();
