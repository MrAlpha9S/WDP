const RefereeTournamentService = require('../../services/RefereeTournamentService');

class TournamentController {
    // Get referee tournaments
    async getRefereeTournaments(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { status, search, sortBy = 'startDate', order = 'desc' } = req.query;
        const response = await RefereeTournamentService.getRefereeTournaments(req.userId, page, limit, status, search, sortBy, order);
        return res.status(response.code).json(response);
    }

    // Lightweight { _id, tournamentName } list for this referee's tournaments (see RefereeTournamentService.getTournamentNames)
    async getTournamentNames(req, res) {
        const response = await RefereeTournamentService.getTournamentNames(req.userId);
        return res.status(response.code).json(response);
    }
}

module.exports = new TournamentController();
