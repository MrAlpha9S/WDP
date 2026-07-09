const InvitationService = require('../services/InvitationService');
const { broadcastAdminEvent } = require('../services/AdminEventBroadcaster');
const NotificationService = require('../services/NotificationService');

class InvitationController {
  async createInvitation(req, res, next) {
    try {
      const data = req.body;
      const io = req.app.get('io');
      const result = await InvitationService.createInvitation(req.userId, data, io);
      if (result.code === 200 || result.code === 201) {
          broadcastAdminEvent(io, 'new_invitation',
              'New Jockey Invitation Sent',
              'A horse owner has sent a new jockey invitation.',
          );
          NotificationService.notify({
              role: 'admin',
              type: 'new_invitation',
              title: 'New Jockey Invitation Sent',
              message: 'A horse owner has sent a new jockey invitation.',
              relatedEntityType: 'Invitation',
              relatedEntityId: result.data?._id,
          }, io).catch(err => console.error('[createInvitation] notify admin error:', err.message));
      }
      return res.status(result.code).json(result);
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new InvitationController();
