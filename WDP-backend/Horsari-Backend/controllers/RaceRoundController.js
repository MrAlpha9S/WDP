const RaceRoundService = require('../services/RaceRoundService');

class RaceRoundController {
    async createRaceRound(req, res, next) {
        try {
            const { refereeID, listOwnerID, adminID, ...rest } = req.body;
            const response = await RaceRoundService.createRaceRound(rest, refereeID, listOwnerID, adminID);
            return res.status(response.code).json(response);
        } catch (error) {
            next(error);
        }
    }
    async getRaceRoundsByTournamentId(req, res, next) {
        const { tournamentId } = req.params;
        try {
            const response = await RaceRoundService.getRaceRoundsByTournamentId(tournamentId);
            return res.status(response.code).json(response);
        } catch (error) {
            next(error);
        }
    }
    async getRaceRoundById(req, res, next) {
        const { id } = req.params;
        try {
            const response = await RaceRoundService.getRaceRoundById(id);
            return res.status(response.code).json(response);
        } catch (error) {
            next(error);
        }
    }
    async getAllRaceRounds(req, res, next) {
        const { page, limit } = req.query;
        try {
            const response = await RaceRoundService.getAllRaceRounds(page, limit);
            return res.status(response.code).json(response);
        } catch (error) {
            next(error);
        }
    }
    async updateRaceRound(req, res, next) {
        const { id } = req.params;
        try {
            const response = await RaceRoundService.updateRaceRound(id, req.body);
            return res.status(response.code).json(response);
        } catch (error) {
            next(error);
        }
    }
    async deleteRaceRound(req, res, next) {
        const { id } = req.params;
        try {
            const response = await RaceRoundService.deleteRaceRound(id);
            return res.status(response.code).json(response);
        } catch (error) {
            next(error);
        }
    }
    async getRaceRoundsByStatus(req, res, next) {
        const { status } = req.query;
        try {
            const response = await RaceRoundService.getRaceRoundsByStatus(status);
            return res.status(response.code).json(response);
        } catch (error) {
            next(error);
        }
    }

}
module.exports = new RaceRoundController();