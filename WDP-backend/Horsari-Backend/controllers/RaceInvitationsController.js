const HorseOwnerService = require('../services/HorseOwnerService');

class RaceInvitationsController {
    async getRaceInvitations(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { status, search, sortBy = 'createdAt', order = 'desc' } = req.query;
        const response = await HorseOwnerService.getRaceInvitations(req.userId, page, limit, status, search, sortBy, order);
        return res.status(response.code).json(response);
    }

    async approveRegistration(req, res) {
        const { registrationId } = req.params;
        const response = await HorseOwnerService.approveRegistration(req.userId, registrationId);
        return res.status(response.code).json(response);
    }

    async rejectRegistration(req, res) {
        const { registrationId } = req.params;
        const response = await HorseOwnerService.rejectRegistration(req.userId, registrationId);
        return res.status(response.code).json(response);
    }
}

module.exports = new RaceInvitationsController();
