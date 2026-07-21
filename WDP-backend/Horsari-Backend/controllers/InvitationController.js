const InvitationService = require('../services/InvitationService');
const NotificationService = require('../services/NotificationService');

class InvitationController {
  async createInvitation(req, res, next) {
    try {
      const data = req.body;
      const io = req.app.get('io');
      const result = await InvitationService.createInvitation(req.userId, data, io);
      if (result.code === 200 || result.code === 201) {
          NotificationService.notify({
              role: 'admin',
              type: 'new_invitation',
              title: 'New Jockey Invitation Sent',
              message: 'A horse owner has sent a new jockey invitation.',
              actionPayload: { entityType: 'Invitation', entityId: result.data?._id },
          }, io).catch(err => console.error('[createInvitation] notify admin error:', err.message));
      }
      return res.status(result.code).json(result);
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new InvitationController();
