const SpectatorService = require('../services/SpectatorService');

class SpectatorController {
    async getSpectatorProfile(req, res) {
        const response = await SpectatorService.getSpectatorProfile(req.userId);
        return res.status(response.code).json(response);
    }

    // ─── Wallet ───────────────────────────────────────────────────────────────

    async getWalletInfo(req, res) {
        const response = await SpectatorService.getWalletInfo(req.userId);
        return res.status(response.code).json(response);
    }

    // ─── Statistics ───────────────────────────────────────────────────────────

    async getStatistics(req, res) {
        const response = await SpectatorService.getStatistics(req.userId);
        return res.status(response.code).json(response);
    }

    async getRewardsEarningsSeries(req, res) {
        const { groupBy = 'day' } = req.query;
        const response = await SpectatorService.getRewardsEarningsSeries(req.userId, groupBy);
        return res.status(response.code).json(response);
    }

    async getTransactionHistory(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { transactionType, status, sortBy = 'date', order = 'desc' } = req.query;
        const response = await SpectatorService.getTransactionHistory(req.userId, page, limit, transactionType, status, sortBy, order);
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

    // ─── Race Viewing ─────────────────────────────────────────────────────────

    async getHomeFeed(req, res) {
        const response = await SpectatorService.getHomeFeed(req.userId);
        return res.status(response.code).json(response);
    }

    async getRaceSchedule(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        // Accept both `filter` (mobile) and `status` (legacy) as the status param
        const { filter, status, sortBy = 'raceDate', order = 'asc' } = req.query;
        const effectiveStatus = filter || status || null;
        const response = await SpectatorService.getRaceSchedule(req.userId, page, limit, effectiveStatus, sortBy, order);
        return res.status(response.code).json(response);
    }

    async getLiveRaceDetail(req, res) {
        const { raceRoundId } = req.params;
        const response = await SpectatorService.getLiveRaceDetail(req.userId, raceRoundId);
        return res.status(response.code).json(response);
    }

    async getAvailablePredictionMethods(req, res) {
        const raceRoundId = req.params.raceRoundId || req.query.raceRoundId || null;
        const response = await SpectatorService.getAvailablePredictionMethods(req.userId, raceRoundId);
        return res.status(response.code).json(response);
    }

    async getTournamentsForPrediction(req, res) {
        const response = await SpectatorService.getTournamentsForPrediction(req.userId);
        return res.status(response.code).json(response);
    }

    // ─── Predictions ──────────────────────────────────────────────────────────

    async createPrediction(req, res) {
        const response = await SpectatorService.createPrediction(req.userId, req.body);
        return res.status(response.code).json(response);
    }

    async getMyPredictions(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { predictionStatus, sortBy = 'created_at', order = 'desc' } = req.query;
        const response = await SpectatorService.getMyPredictions(req.userId, page, limit, predictionStatus, sortBy, order);
        return res.status(response.code).json(response);
    }

    async getPredictionDetail(req, res) {
        const { predictionId } = req.params;
        const response = await SpectatorService.getPredictionDetail(req.userId, predictionId);
        return res.status(response.code).json(response);
    }
}

module.exports = new SpectatorController();
