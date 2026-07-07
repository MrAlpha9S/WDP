const InvitationService = require('../services/InvitationService');
const { broadcastAdminEvent } = require('../services/AdminEventBroadcaster');

class InvitationController {
  async createInvitation(req, res, next) {
    try {
      const data = req.body;
      const result = await InvitationService.createInvitation(req.userId, data);
      if (result.code === 200 || result.code === 201) {
          broadcastAdminEvent(req.app.get('io'), 'new_invitation',
              'New Jockey Invitation Sent',
              'A horse owner has sent a new jockey invitation.',
          );
      }
      return res.status(result.code).json(result);
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new InvitationController();
