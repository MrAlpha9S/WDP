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
    const response = await JockeyService.respondToInvitationById(req.userId, invitationId, jockeyConfirmation);
    return res.status(response.code).json(response);
  }
}

module.exports = new JockeyController();
