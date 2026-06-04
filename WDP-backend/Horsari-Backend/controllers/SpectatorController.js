const SpectatorService = require('../services/SpectatorService');

class SpectatorController {
    // (admin register removed)

    // Create spectator profile for existing user (public)
    async createSpectator(req, res) {
        const { uid } = req.params;
        const response = await SpectatorService.createSpectator(uid, req.body);
        return res.status(response.code).json(response);
    }

    // Get spectator profile
    async getSpectatorProfile(req, res) {
        const response = await SpectatorService.getSpectatorProfile(req.userId);
        return res.status(response.code).json(response);
    }

    // Get all spectators
    async getAllSpectators(req, res) {
        const limit = parseInt(req.query.limit) || 10;
        const skip = parseInt(req.query.skip) || 0;
        const response = await SpectatorService.getAllSpectators(limit, skip);
        return res.status(response.code).json(response);
    }

    // Get reward points
    async getRewardPoints(req, res) {
        const response = await SpectatorService.getRewardPoints(req.userId);
        return res.status(response.code).json(response);
    }

    // Add reward points
    async addRewardPoints(req, res) {
        const { points } = req.body;
        const response = await SpectatorService.addRewardPoints(req.userId, points);
        return res.status(response.code).json(response);
    }

    // Deduct reward points
    async deductRewardPoints(req, res) {
        const { points } = req.body;
        const response = await SpectatorService.deductRewardPoints(req.userId, points);
        return res.status(response.code).json(response);
    }

    // Get top spectators
    async getTopSpectators(req, res) {
        const limit = parseInt(req.query.limit) || 10;
        const response = await SpectatorService.getTopSpectators(limit);
        return res.status(response.code).json(response);
    }

    // Update spectator profile
    async updateSpectatorProfile(req, res) {
        const response = await SpectatorService.updateSpectatorProfile(req.userId, req.body);
        return res.status(response.code).json(response);
    }
}

module.exports = new SpectatorController();
