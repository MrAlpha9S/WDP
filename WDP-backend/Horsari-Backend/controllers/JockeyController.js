const JockeyService = require('../services/JockeyService');

class JockeyController {
    async createJockey(req, res) {
        const { uid } = req.params;
        const response = await JockeyService.createJockey(uid, req.body);
        return res.status(response.code).json(response);
    }

    async getJockeyProfile(req, res) {
        const response = await JockeyService.getJockeyProfile(req.userId);
        return res.status(response.code).json(response);
    }

    async updateJockeyProfile(req, res) {
        const response = await JockeyService.updateJockeyProfile(req.userId, req.body);
        return res.status(response.code).json(response);
    }

    async changePassword(req, res) {
        const response = await JockeyService.changePassword(req.userId, req.body);
        return res.status(response.code).json(response);
    }

    async getMyInvitations(req, res) {
        const response = await JockeyService.getMyInvitations(req.userId);
        return res.status(response.code).json(response);
    }

    async respondInvitation(req, res) {
        const { invitationId } = req.params;
        const { jockeyConfirmation } = req.body;
        const response = await JockeyService.respondInvitation(req.userId, invitationId, jockeyConfirmation);
        return res.status(response.code).json(response);
    }

    async getMyRaceSchedule(req, res) {
        const response = await JockeyService.getMyRaceSchedule(req.userId);
        return res.status(response.code).json(response);
    }

    async getMyRaceHistory(req, res) {
        const response = await JockeyService.getMyRaceHistory(req.userId);
        return res.status(response.code).json(response);
    }

    async getTopJockeys(req, res) {
        const limit = parseInt(req.query.limit) || 10;
        const response = await JockeyService.getTopJockeys(limit);
        return res.status(response.code).json(response);
    }

    async getMyStats(req, res) {
        const response = await JockeyService.getJockeyStats(req.userId);
        return res.status(response.code).json(response);
    }

    async getAllJockeys(req, res) {
        const limit = parseInt(req.query.limit) || 10;
        const skip = parseInt(req.query.skip) || 0;
        const response = await JockeyService.getAllJockeys(limit, skip);
        return res.status(response.code).json(response);
    }

    async getJockeysByStatus(req, res) {
        const { status } = req.params;
        const response = await JockeyService.getJockeysByStatus(status);
        return res.status(response.code).json(response);
    }

    async addWin(req, res) {
        const response = await JockeyService.addWin(req.userId);
        return res.status(response.code).json(response);
    }

    async recordMatch(req, res) {
        const response = await JockeyService.recordMatch(req.userId);
        return res.status(response.code).json(response);
    }
}

module.exports = new JockeyController();
