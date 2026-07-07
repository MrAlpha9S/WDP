const RaceRoundService = require('../services/RaceRoundService');

class RaceRoundController {
    async createRaceRound(req, res, next) {
        try {
            const adminID = req.userId; // from authMiddleware
            const response = await RaceRoundService.createRaceRound(req.body, adminID);
            return res.status(response.code).json(response);
        } catch (error) {
            next(error);
        }
    }
    async updateRaceRound(req, res, next) {
        const { id } = req.params;
        try {
            const adminID = req.userId;
            const response = await RaceRoundService.updateRaceRound(id, req.body, adminID);
            return res.status(response.code).json(response);
        } catch (error) {
            next(error);
        }
    }

    async cancelRaceRound(req, res, next) {
        const { id } = req.params;
        try {
            const response = await RaceRoundService.cancelRaceRound(id);
            return res.status(response.code).json(response);
        } catch (error) {
            next(error);
        }
    }

}
module.exports = new RaceRoundController();
