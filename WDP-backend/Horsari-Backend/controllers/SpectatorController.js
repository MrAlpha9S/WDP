const SpectatorService = require('../services/SpectatorService');

class SpectatorController {
    async createSpectator(req, res) {
        const response = await SpectatorService.createSpectator(req.params.uid, req.body);
        return res.status(response.code).json(response);
    }

    async getSpectatorProfile(req, res) {
        const response = await SpectatorService.getSpectatorProfile(req.userId);
        return res.status(response.code).json(response);
    }

    async updateSpectatorProfile(req, res) {
        const response = await SpectatorService.updateSpectatorProfile(req.userId, req.body);
        return res.status(response.code).json(response);
    }

    async changePassword(req, res) {
        const response = await SpectatorService.changePassword(req.userId, req.body);
        return res.status(response.code).json(response);
    }

    async getAllSpectators(req, res) {
        const limit = parseInt(req.query.limit) || 10;
        const skip = parseInt(req.query.skip) || 0;
        const response = await SpectatorService.getAllSpectators(limit, skip);
        return res.status(response.code).json(response);
    }

    async getRewardPoints(req, res) {
        const response = await SpectatorService.getRewardPoints(req.userId);
        return res.status(response.code).json(response);
    }

    async addRewardPoints(req, res) {
        const response = await SpectatorService.addRewardPoints(req.userId, req.body.points);
        return res.status(response.code).json(response);
    }

    async deductRewardPoints(req, res) {
        const response = await SpectatorService.deductRewardPoints(req.userId, req.body.points);
        return res.status(response.code).json(response);
    }

    async getTopSpectators(req, res) {
        const limit = parseInt(req.query.limit) || 10;
        const response = await SpectatorService.getTopSpectators(limit);
        return res.status(response.code).json(response);
    }

    async getWalletInfo(req, res) {
        const response = await SpectatorService.getWalletInfo(req.userId);
        return res.status(response.code).json(response);
    }

    async getTransactionHistory(req, res) {
        const response = await SpectatorService.getTransactionHistory(req.userId, req.query);
        return res.status(response.code).json(response);
    }

    async depositPoints(req, res) {
        const response = await SpectatorService.depositPoints(req.userId, req.body);
        return res.status(response.code).json(response);
    }

    async withdrawPoints(req, res) {
        const response = await SpectatorService.withdrawPoints(req.userId, req.body);
        return res.status(response.code).json(response);
    }

    async getHomeFeed(req, res) {
        const response = await SpectatorService.getHomeFeed(req.userId);
        return res.status(response.code).json(response);
    }

    async getRaceSchedule(req, res) {
        const response = await SpectatorService.getRaceSchedule(req.userId, req.query);
        return res.status(response.code).json(response);
    }

    async getLiveRaceDetail(req, res) {
        const response = await SpectatorService.getLiveRaceDetail(req.userId, req.params.raceRoundId);
        return res.status(response.code).json(response);
    }

    async getRaceResult(req, res) {
        const response = await SpectatorService.getRaceResult(req.params.raceRoundId);
        return res.status(response.code).json(response);
    }

    async getRaceLeaderboard(req, res) {
        const response = await SpectatorService.getRaceLeaderboard(req.params.raceRoundId);
        return res.status(response.code).json(response);
    }

    async getAvailablePredictionMethods(req, res) {
        const response = await SpectatorService.getAvailablePredictionMethods(req.userId, req.params.raceRoundId);
        return res.status(response.code).json(response);
    }

    async createPrediction(req, res) {
        const response = await SpectatorService.createPrediction(req.userId, req.body);
        return res.status(response.code).json(response);
    }

    async getMyPredictions(req, res) {
        const response = await SpectatorService.getMyPredictions(req.userId, req.query);
        return res.status(response.code).json(response);
    }

    async getPredictionDetail(req, res) {
        const response = await SpectatorService.getPredictionDetail(req.userId, req.params.predictionId);
        return res.status(response.code).json(response);
    }
}

module.exports = new SpectatorController();
