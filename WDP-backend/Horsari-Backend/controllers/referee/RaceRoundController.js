const RefereeRaceRoundService = require('../../services/RefereeRaceRoundService');
const AdminRaceRoundService = require('../../services/AdminRaceRoundService');

class RaceRoundController {
    // Get referee race rounds
    async getRefereeRaceRounds(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { status, search, sortBy = 'raceDate', order = 'desc', tournament_id, startDate, endDate } = req.query;
        // A date-range fetch (Homepage calendar view) requires both bounds — a single bound
        // alone can't be paired with the unpaginated behavior it implies.
        if (Boolean(startDate) !== Boolean(endDate)) {
            return res.status(400).json({ code: 400, msg: 'startDate and endDate must both be provided together.' });
        }
        const response = await RefereeRaceRoundService.getRefereeRaceRounds(req.userId, page, limit, status, search, sortBy, order, tournament_id || null, startDate, endDate);
        return res.status(response.code).json(response);
    }

    // Get single race round detail (referee-scoped)
    async getRaceRoundById(req, res) {
        const response = await RefereeRaceRoundService.getRaceRoundById(req.userId, req.params.id);
        return res.status(response.code).json(response);
    }

    // Verify or fail a registration after pre-race inspection
    async verifyRegistration(req, res) {
        const { raceRoundId, registrationId } = req.params;
        const io = req.app.get('io');
        const response = await RefereeRaceRoundService.verifyRegistration(req.userId, raceRoundId, registrationId, req.body, io);
        return res.status(response.code).json(response);
    }

    // Cancel a pending registration as no-show
    async cancelRegistration(req, res) {
        const { raceRoundId, registrationId } = req.params;
        const io = req.app.get('io');
        const response = await RefereeRaceRoundService.cancelRegistration(req.userId, raceRoundId, registrationId, io);
        return res.status(response.code).json(response);
    }

    // Finalize a race round — sets status to prepared or cancelled based on inspection results
    async finalizeRaceRound(req, res) {
        const { id } = req.params;
        const io = req.app.get('io');
        const response = await RefereeRaceRoundService.finalizeRaceRound(req.userId, id, io, req.body?.override === true);
        return res.status(response.code).json(response);
    }

    // Confirm race results (Delegates to AdminRaceRoundService logic)
    async confirmRaceResult(req, res) {
        const io = req.app.get('io');
        const response = await AdminRaceRoundService.confirmRaceResult(req.params.id, req.userId, io);
        return res.status(response.code).json(response);
    }
}

module.exports = new RaceRoundController();
