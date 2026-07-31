const RefereeInvitationService = require('../../services/RefereeInvitationService');

class InvitationController {
    // Get referee invitations
    async getRefereeInvitations(req, res) {
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const status = req.query.status;
        const response = await RefereeInvitationService.getRefereeInvitations(req.userId, limit, page, status);
        return res.status(response.code).json(response);
    }

    // Accept invitation
    async acceptInvitation(req, res) {
        const { id } = req.params;
        const io = req.app.get('io');
        const response = await RefereeInvitationService.acceptInvitation(req.userId, id, io);
        return res.status(response.code).json(response);
    }

    // Reject invitation
    async rejectInvitation(req, res) {
        const { id } = req.params;
        const io = req.app.get('io');
        const response = await RefereeInvitationService.rejectInvitation(req.userId, id, io);
        return res.status(response.code).json(response);
    }

    // Mark a jockey as a no-show for race day
    async markJockeyNoShow(req, res) {
        const { invitationId } = req.params;
        const io = req.app.get('io');
        const response = await RefereeInvitationService.markJockeyNoShow(req.userId, invitationId, io);
        return res.status(response.code).json(response);
    }
}

module.exports = new InvitationController();
