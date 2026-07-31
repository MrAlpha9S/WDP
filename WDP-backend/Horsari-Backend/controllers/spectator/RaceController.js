const SpectatorRaceService = require('../../services/SpectatorRaceService');

class RaceController {
    async getHomeFeed(req, res) {
        const response = await SpectatorRaceService.getHomeFeed(req.userId);
        return res.status(response.code).json(response);
    }

    async getRaceSchedule(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        // Accept both `filter` (mobile) and `status` (legacy) as the status param
        const { filter, status, sortBy = 'raceDate', order = 'asc' } = req.query;
        const effectiveStatus = filter || status || null;
        const response = await SpectatorRaceService.getRaceSchedule(req.userId, page, limit, effectiveStatus, sortBy, order);
        return res.status(response.code).json(response);
    }

    async getLiveRaceDetail(req, res) {
        const { raceRoundId } = req.params;
        const response = await SpectatorRaceService.getLiveRaceDetail(req.userId, raceRoundId);
        return res.status(response.code).json(response);
    }
}

module.exports = new RaceController();
