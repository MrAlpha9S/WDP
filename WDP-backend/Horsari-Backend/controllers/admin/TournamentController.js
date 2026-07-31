const AdminTournamentService = require('../../services/AdminTournamentService');
const TournamentService = require('../../services/TournamentService');

class TournamentController {
    // Get tournaments with enriched details
    async getTournamentsWithDetails(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { startDate, endDate, search } = req.query;
        // A date-range fetch (calendar view) requires both bounds — a single
        // bound alone can't be paired with the unpaginated behavior it implies.
        if (Boolean(startDate) !== Boolean(endDate)) {
            return res.status(400).json({ code: 400, msg: 'startDate and endDate must both be provided together.' });
        }
        const response = await AdminTournamentService.getTournamentsWithDetails(page, limit, startDate, endDate, search);
        return res.status(response.code).json(response);
    }

    // Get tournament counts by status (live/upcoming/completed), unaffected by pagination/search
    async getTournamentStats(req, res) {
        const response = await AdminTournamentService.getTournamentStats();
        return res.status(response.code).json(response);
    }

    // Lightweight { _id, tournamentName } list for every tournament (see AdminTournamentService.getTournamentNames)
    async getTournamentNames(req, res) {
        const response = await AdminTournamentService.getTournamentNames();
        return res.status(response.code).json(response);
    }

    // Update a tournament's status, with race-round guards (block completion
    // while rounds are unfinished; cascade-cancel rounds on cancellation)
    async updateTournamentStatus(req, res) {
        const { id } = req.params;
        const { status } = req.body;
        const io = req.app.get('io');
        const response = await AdminTournamentService.updateTournamentStats(id, status, io);
        return res.status(response.code).json(response);
    }

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

    async getTournamentDetail(req, res) {
        const response = await AdminTournamentService.getTournamentDetail(req.params.id);
        return res.status(response.code).json(response);
    }

    async getTournamentRanking(req, res) {
        const response = await AdminTournamentService.getTournamentRanking(req.params.id);
        return res.status(response.code).json(response);
    }
}

module.exports = new TournamentController();
