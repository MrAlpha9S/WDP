const HorseOwnerRaceService = require('../../services/HorseOwnerRaceService');

class RaceController {
    async getRaceDetail(req, res) {
        const { raceRoundId } = req.params;
        const response = await HorseOwnerRaceService.getRaceDetail(req.userId, raceRoundId);
        return res.status(response.code).json(response);
    }

    // Lightweight status endpoint for polling
    async getRaceRoundStatus(req, res) {
        const { raceRoundId } = req.params;
        const response = await HorseOwnerRaceService.getRaceRoundStatus(req.userId, raceRoundId);
        return res.status(response.code).json(response);
    }

    async browseRaces(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const { search, status } = req.query;
        const response = await HorseOwnerRaceService.getAvailableRaces(req.userId, page, limit, search || null, status || null);
        return res.status(response.code).json(response);
    }
}

module.exports = new RaceController();
