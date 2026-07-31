const AdminRaceRoundService = require('../../services/AdminRaceRoundService');
const RaceRoundService = require('../../services/RaceRoundService');

class RaceRoundController {
    async createRaceRound(req, res, next) {
        try {
            const adminID = req.userId; // from authMiddleware
            const io = req.app.get('io');
            const response = await RaceRoundService.createRaceRound(req.body, adminID, io);
            return res.status(response.code).json(response);
        } catch (error) {
            next(error);
        }
    }

    async updateRaceRound(req, res, next) {
        const { id } = req.params;
        try {
            const adminID = req.userId;
            const io = req.app.get('io');
            const response = await RaceRoundService.updateRaceRound(id, req.body, adminID, io);
            return res.status(response.code).json(response);
        } catch (error) {
            next(error);
        }
    }

    async cancelRaceRound(req, res, next) {
        const { id } = req.params;
        try {
            const io = req.app.get('io');
            const response = await RaceRoundService.cancelRaceRound(id, io);
            return res.status(response.code).json(response);
        } catch (error) {
            next(error);
        }
    }

    // Get race rounds
    async getRaceRounds(req, res) {
        const tournament_id = req.query.tournament_id || null;
        const raceRound_id = req.query.raceRound_id || null;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { status, search, sortBy = 'raceDate', order = 'desc', raceType, date } = req.query;
        const response = await AdminRaceRoundService.getRaceRounds(tournament_id, raceRound_id, page, limit, status, search, sortBy, order, raceType || null, date || null);
        return res.status(response.code).json(response);
    }

    // Distinct calendar days that have at least one matching race round — the schedule
    // Timeline view's day-navigation list (see AdminRaceRoundService.getRaceRoundDates)
    async getRaceRoundDates(req, res) {
        const tournament_id = req.query.tournament_id || null;
        const { status, raceType } = req.query;
        const response = await AdminRaceRoundService.getRaceRoundDates(tournament_id, status || null, raceType || null);
        return res.status(response.code).json(response);
    }

    // Get distinct race types (for the race-type filter dropdown)
    async getRaceTypes(req, res) {
        const { isActive } = req.query;
        const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : null;
        const response = await AdminRaceRoundService.getDistinctRaceTypes(isActiveBool);
        return res.status(response.code).json(response);
    }

    // Get race round detail
    async getRaceRoundDetail(req, res) {
        const id = req.params.id;
        const response = await AdminRaceRoundService.getRaceRoundDetail(id);
        return res.status(response.code).json(response);
    }

    // Get metadata for create race modal
    async getCreateRaceMetadata(req, res) {
        const response = await AdminRaceRoundService.getCreateRaceMetadata();
        return res.status(response.code).json(response);
    }

    async setRaceRoundStatus(req, res) {
        const { id } = req.params;
        const { status, override } = req.body;
        const io = req.app.get('io');
        const response = await AdminRaceRoundService.setRaceRoundStatus(id, status, io, override === true);
        return res.status(response.code).json(response);
    }

    async quickAssignHorsesAndJockeys(req, res) {
        const response = await AdminRaceRoundService.quickAssignHorsesAndJockeys(req.params.id);
        return res.status(response.code).json(response);
    }

    async createStream(req, res) {
        const response = await AdminRaceRoundService.createStreamForRace(req.params.id);
        return res.status(response.code).json(response);
    }

    async getStreamInfo(req, res) {
        const response = await AdminRaceRoundService.getStreamInfo(req.params.id);
        return res.status(response.code).json(response);
    }

    async getVOD(req, res) {
        const response = await AdminRaceRoundService.getVOD(req.params.id);
        return res.status(response.code).json(response);
    }
}

module.exports = new RaceRoundController();
