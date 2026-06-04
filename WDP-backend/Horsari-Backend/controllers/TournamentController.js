const TournamentService = require('../services/TournamentService');

class TournamentController {
    async createTournament(req, res, next) {
        try {
            const response = await TournamentService.createTournament(req.body);
            return res.status(response.code).json(response);
        } catch (error) {
            next(error);
        }

    }
    async getTournaments(req, res, next) {
        const { keywords, page, limit } = req.query;
        try {
            const response = await TournamentService.getTournaments(keywords, page, limit);
            return res.status(response.code).json(response);
        } catch (error) {
            next(error);
        }
    }
    async getTournamentById(req, res, next) {
        const { id } = req.params;
        try {
            const response = await TournamentService.getTournamentById(id);
            return res.status(response.code).json(response);
        } catch (error) {
            next(error);
        }
    }
    async updateTournament(req, res, next) {
        const { id } = req.params;
        try {
            const response = await TournamentService.updateTournament(id, req.body);
            return res.status(response.code).json(response);
        } catch (error) {
            next(error);
        }
    }
    async deleteTournament(req, res, next) {
        const { id } = req.params;
        try {
            const response = await TournamentService.deleteTournament(id);
            return res.status(response.code).json(response);
        } catch (error) {
            next(error);
        }
    }

}
module.exports = new TournamentController();