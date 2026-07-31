const JockeyInvitationService = require("../../services/JockeyInvitationService");

class InvitationController {
  // Mobile: GET /my-invitations — flat array, nested horseOwner.user
  async getMyInvitationsFlat(req, res) {
    const { status } = req.query;
    const response = await JockeyInvitationService.getMyInvitationsFlat(req.userId, status);
    return res.status(response.code).json(response);
  }

  // Mobile: PUT /invitation/:invitationId/respond
  async respondToInvitationById(req, res) {
    const { invitationId } = req.params;
    const { jockeyConfirmation } = req.body;
    const io = req.app.get('io');
    const response = await JockeyInvitationService.respondToInvitationById(req.userId, invitationId, jockeyConfirmation, io);
    return res.status(response.code).json(response);
  }
}

module.exports = new InvitationController();
