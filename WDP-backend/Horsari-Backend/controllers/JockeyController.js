const JockeyService = require('../services/JockeyService');

class JockeyController {
    // (admin register removed) 

    // Create jockey profile for existing user (public)
    async createJockey(req, res) {
        const { uid } = req.params;
        const response = await JockeyService.createJockey(uid, req.body);
        return res.status(response.code).json(response);
    }

    // Get jockey profile
    async getJockeyProfile(req, res) {
        const response = await JockeyService.getJockeyProfile(req.userId);
        return res.status(response.code).json(response);
    }

    // Get top jockeys
    async getTopJockeys(req, res) {
        const limit = parseInt(req.query.limit) || 10;
        const response = await JockeyService.getTopJockeys(limit);
        return res.status(response.code).json(response);
    }

    // Get jockey statistics
    async getJockeyStats(req, res) {
        const response = await JockeyService.getJockeyStats(req.userId);
        return res.status(response.code).json(response);
    }

    // Get my statistics
    async getMyStats(req, res) {
        const response = await JockeyService.getJockeyStats(req.userId);
        return res.status(response.code).json(response);
    }

    // Update jockey profile
    async updateJockeyProfile(req, res) {
        const response = await JockeyService.updateJockeyProfile(req.userId, req.body);
        return res.status(response.code).json(response);
    }

    // Get all jockeys
    async getAllJockeys(req, res) {
        const limit = parseInt(req.query.limit) || 10;
        const skip = parseInt(req.query.skip) || 0;
        const response = await JockeyService.getAllJockeys(limit, skip);
        return res.status(response.code).json(response);
    }

    // Get jockeys by status
    async getJockeysByStatus(req, res) {
        const { status } = req.params;
        const response = await JockeyService.getJockeysByStatus(status);
        return res.status(response.code).json(response);
    }

    // Add win
    async addWin(req, res) {
        const response = await JockeyService.addWin(req.userId);
        return res.status(response.code).json(response);
    }

    // Record match
    async recordMatch(req, res) {
        const response = await JockeyService.recordMatch(req.userId);
        return res.status(response.code).json(response);
    }
}

module.exports = new JockeyController();
