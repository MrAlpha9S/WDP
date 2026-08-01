const RefereeService = require('../services/RefereeService');
const AdminService = require('../services/AdminService');

class RefereeController {
    // Self-service — GET/PUT my own profile
    async getMyProfile(req, res) {
        const response = await RefereeService.getMyProfile(req.userId);
        return res.status(response.code).json(response);
    }

    async updateMyProfile(req, res) {
        const response = await RefereeService.updateMyProfile(req.userId, req.body);
        return res.status(response.code).json(response);
    }

    // Self-service — re-upload license PDF (resets licenseStatus to pending)
    async updateMyLicense(req, res) {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ code: 400, msg: 'License PDF is required' });
        }
        const response = await RefereeService.updateMyLicense(req.userId, req.file.buffer, req.file.originalname);
        return res.status(response.code).json(response);
    }

    // Get referee invitations
    async getRefereeInvitations(req, res) {
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const status = req.query.status;
        const response = await RefereeService.getRefereeInvitations(req.userId, limit, page, status);
        return res.status(response.code).json(response);
    }

    // Accept invitation
    async acceptInvitation(req, res) {
        const { id } = req.params;
        const io = req.app.get('io');
        const response = await RefereeService.acceptInvitation(req.userId, id, io);
        return res.status(response.code).json(response);
    }

    // Reject invitation
    async rejectInvitation(req, res) {
        const { id } = req.params;
        const io = req.app.get('io');
        const response = await RefereeService.rejectInvitation(req.userId, id, io);
        return res.status(response.code).json(response);
    }

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
        const response = await RefereeService.getRefereeRaceRounds(req.userId, page, limit, status, search, sortBy, order, tournament_id || null, startDate, endDate);
        return res.status(response.code).json(response);
    }

    // Get referee tournaments
    async getRefereeTournaments(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { status, search, sortBy = 'startDate', order = 'desc' } = req.query;
        const response = await RefereeService.getRefereeTournaments(req.userId, page, limit, status, search, sortBy, order);
        return res.status(response.code).json(response);
    }

    // Lightweight { _id, tournamentName } list for this referee's tournaments (see RefereeService.getTournamentNames)
    async getTournamentNames(req, res) {
        const response = await RefereeService.getTournamentNames(req.userId);
        return res.status(response.code).json(response);
    }

    // Get single race round detail (referee-scoped)
    async getRaceRoundById(req, res) {
        const response = await RefereeService.getRaceRoundById(req.userId, req.params.id);
        return res.status(response.code).json(response);
    }

    // Verify or fail a registration after pre-race inspection
    async verifyRegistration(req, res) {
        const { raceRoundId, registrationId } = req.params;
        const io = req.app.get('io');
        const response = await RefereeService.verifyRegistration(req.userId, raceRoundId, registrationId, req.body, io);
        return res.status(response.code).json(response);
    }

    // Cancel a pending registration as no-show
    async cancelRegistration(req, res) {
        const { raceRoundId, registrationId } = req.params;
        const io = req.app.get('io');
        const response = await RefereeService.cancelRegistration(req.userId, raceRoundId, registrationId, io);
        return res.status(response.code).json(response);
    }

    // GET /wallet — wallet statistic + payment stats
    async getWalletInfo(req, res) {
        const response = await RefereeService.getWalletInfo(req.userId);
        return res.status(response.code).json(response);
    }

    // GET /statistics — races officiated, acceptance rate, fees earned/pending
    async getStatistics(req, res) {
        const response = await RefereeService.getStatistics(req.userId);
        return res.status(response.code).json(response);
    }

    // GET /statistics/earnings-series — fees earned over time, gap-filled
    async getFeesEarningsSeries(req, res) {
        const { groupBy = 'day' } = req.query;
        const response = await RefereeService.getFeesEarningsSeries(req.userId, groupBy);
        return res.status(response.code).json(response);
    }

    // GET /work-history — completed race rounds + violations logged against them
    async getWorkHistory(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { sortBy = 'raceDate', order = 'desc' } = req.query;
        const response = await RefereeService.getWorkHistory(req.userId, page, limit, sortBy, order);
        return res.status(response.code).json(response);
    }

    // Mark a jockey as a no-show for race day
    async markJockeyNoShow(req, res) {
        const { invitationId } = req.params;
        const io = req.app.get('io');
        const response = await RefereeService.markJockeyNoShow(req.userId, invitationId, io);
        return res.status(response.code).json(response);
    }

    // Undo a no-show mark, reverting the invitation back to "accepted"
    async cancelJockeyNoShow(req, res) {
        const { invitationId } = req.params;
        const response = await RefereeService.cancelJockeyNoShow(req.userId, invitationId);
        return res.status(response.code).json(response);
    }

    // Finalize a race round — sets status to prepared or cancelled based on inspection results
    async finalizeRaceRound(req, res) {
        const { id } = req.params;
        const io = req.app.get('io');
        const response = await RefereeService.finalizeRaceRound(req.userId, id, io, req.body?.override === true);
        return res.status(response.code).json(response);
    }

    // Get violation types (optionally filtered by type=pre-race|during-race|after-race)
    async getViolationTypes(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const { search, sortBy = 'severity', order = 'asc' } = req.query;
        const response = await RefereeService.getViolationTypes(req.query.type, page, limit, search, sortBy, order);
        return res.status(response.code).json(response);
    }

    // Get all violations for a race round (referee-scoped)
    async getRaceRoundViolations(req, res) {
        const { status, search, sortBy = 'created_at', order = 'desc' } = req.query;
        const response = await RefereeService.getRaceRoundViolations(req.userId, req.params.id, status, search, sortBy, order);
        return res.status(response.code).json(response);
    }

    // Get all violations in the system (unscoped browse, not just this referee's assignments)
    async getAllViolations(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { status, severity, raceRoundId, sortBy = 'created_at', order = 'desc' } = req.query;
        const response = await RefereeService.getAllViolations(page, limit, { status, severity, raceRoundId, sortBy, order });
        return res.status(response.code).json(response);
    }

    // Create a violation (used by LivePage for during-race incidents)
    async createViolation(req, res) {
        const io = req.app.get('io');
        const response = await RefereeService.createViolation(req.userId, req.body, io);
        return res.status(response.code).json(response);
    }

    // Confirm a violation
    async confirmViolation(req, res) {
        const response = await RefereeService.confirmViolation(req.userId, req.params.violationId);
        return res.status(response.code).json(response);
    }

    // Delete / dismiss a violation
    async deleteViolation(req, res) {
        const io = req.app.get('io');
        const response = await RefereeService.deleteViolation(req.userId, req.params.violationId, io);
        return res.status(response.code).json(response);
    }

    // Confirm race results (Delegates to AdminService logic)
    async confirmRaceResult(req, res) {
        const io = req.app.get('io');
        const response = await AdminService.confirmRaceResult(req.params.id, req.userId, io);
        return res.status(response.code).json(response);
    }
}

module.exports = new RefereeController();
