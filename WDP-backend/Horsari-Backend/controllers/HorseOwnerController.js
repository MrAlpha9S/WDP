const HorseOwnerService = require('../services/HorseOwnerService');

class HorseOwnerController {
    // Get my horses
    async getMyHorses(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { search, sortBy = 'createdAt', order = 'desc' } = req.query;
        const response = await HorseOwnerService.getOwnedHorses(req.userId, page, limit, search, sortBy, order);
        return res.status(response.code).json(response);
    }

    // Get jockey invitations sent by this horse owner
    async getJockeyInvitations(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { search } = req.query;
        const response = await HorseOwnerService.getJockeyInvitations(req.userId, page, limit, search || null);
        return res.status(response.code).json(response);
    }

    async getRaceDetail(req, res) {
        const { raceRoundId } = req.params;
        const response = await HorseOwnerService.getRaceDetail(req.userId, raceRoundId);
        return res.status(response.code).json(response);
    }

    // Lightweight status endpoint for polling
    async getRaceRoundStatus(req, res) {
        const { raceRoundId } = req.params;
        const response = await HorseOwnerService.getRaceRoundStatus(req.userId, raceRoundId);
        return res.status(response.code).json(response);
    }

    async getHorseProfile(req, res) {
        const { horseId } = req.params;
        const response = await HorseOwnerService.getHorseProfile(req.userId, horseId);
        return res.status(response.code).json(response);
    }

    async updateHorseStatus(req, res) {
        const { horseId } = req.params;
        const { status } = req.body;
        const response = await HorseOwnerService.updateHorseStatus(req.userId, horseId, status);
        return res.status(response.code).json(response);
    }

    async updateHorseHealthStatus(req, res) {
        const { horseId } = req.params;
        const { healthStatus } = req.body;
        const response = await HorseOwnerService.updateHorseHealthStatus(req.userId, horseId, healthStatus);
        return res.status(response.code).json(response);
    }

    async getRaceEligibilityMetadata(req, res) {
        const { ruleId } = req.query;
        const response = await HorseOwnerService.getRaceEligibilityMetadata(ruleId);
        return res.status(response.code).json(response);
    }

    async getDashboardSummary(req, res) {
        const response = await HorseOwnerService.getDashboardSummary(req.userId);
        return res.status(response.code).json(response);
    }

    async getTopPerformers(req, res) {
        const limit = parseInt(req.query.limit) || 5;
        const response = await HorseOwnerService.getTopPerformers(req.userId, limit);
        return res.status(response.code).json(response);
    }

    async browseRaces(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const { search, status } = req.query;
        const response = await HorseOwnerService.getAvailableRaces(req.userId, page, limit, search || null, status || null);
        return res.status(response.code).json(response);
    }

    async getJockeyProfile(req, res) {
        const { jockeyId } = req.params;
        const response = await HorseOwnerService.getJockeyProfile(jockeyId);
        return res.status(response.code).json(response);
    }

    async getFinancialSummary(req, res) {
        const response = await HorseOwnerService.getFinancialSummary(req.userId);
        return res.status(response.code).json(response);
    }

    async getFinancialRaceResults(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { search } = req.query;
        const response = await HorseOwnerService.getFinancialRaceResults(req.userId, page, limit, search || null);
        return res.status(response.code).json(response);
    }
}

module.exports = new HorseOwnerController();
