const TournamentService = require('../services/TournamentService');

class TournamentController {
    async createTournament(req, res, next) {
        try {
            const tournamentData = { ...req.body, createdByAdminId: req.userId };
            const response = await TournamentService.createTournament(tournamentData);
            return res.status(response.code).json(response);
        } catch (error) {
            next(error);
        }
    }
    async updateTournament(req, res, next) {
        const { id } = req.params;
        try {
            const io = req.app.get('io');
            const response = await TournamentService.updateTournament(id, req.body, io);
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