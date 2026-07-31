const SpectatorPredictionService = require('../../services/SpectatorPredictionService');

class PredictionController {
    // Tournaments available for champion prediction (scheduled + ongoing)
    async getTournamentsForPrediction(req, res) {
        const response = await SpectatorPredictionService.getTournamentsForPrediction(req.userId);
        return res.status(response.code).json(response);
    }

    // All active prediction methods (optionally filtered by raceRoundId query param)
    async getAvailablePredictionMethods(req, res) {
        const raceRoundId = req.params.raceRoundId || req.query.raceRoundId || null;
        const response = await SpectatorPredictionService.getAvailablePredictionMethods(req.userId, raceRoundId);
        return res.status(response.code).json(response);
    }

    async createPrediction(req, res) {
        const response = await SpectatorPredictionService.createPrediction(req.userId, req.body);
        return res.status(response.code).json(response);
    }

    async getMyPredictions(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { predictionStatus, sortBy = 'created_at', order = 'desc' } = req.query;
        const response = await SpectatorPredictionService.getMyPredictions(req.userId, page, limit, predictionStatus, sortBy, order);
        return res.status(response.code).json(response);
    }

    async getPredictionDetail(req, res) {
        const { predictionId } = req.params;
        const response = await SpectatorPredictionService.getPredictionDetail(req.userId, predictionId);
        return res.status(response.code).json(response);
    }
}

module.exports = new PredictionController();
