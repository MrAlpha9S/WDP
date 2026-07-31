const AdminInvitationService = require('../../services/AdminInvitationService');

class InvitationController {
    // Get horse owner invitation list (enriched)
    async getHorseOwnerInvitations(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const response = await AdminInvitationService.getHorseOwnerInvitations(page, limit);
        return res.status(response.code).json(response);
    }

    // Get referee invitation list
    async getRefereeInvitations(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const response = await AdminInvitationService.getRefereeInvitations(page, limit);
        return res.status(response.code).json(response);
    }

    // Get jockey invitation list
    async getJockeyInvitations(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const response = await AdminInvitationService.getJockeyInvitations(page, limit);
        return res.status(response.code).json(response);
    }
}

module.exports = new InvitationController();
