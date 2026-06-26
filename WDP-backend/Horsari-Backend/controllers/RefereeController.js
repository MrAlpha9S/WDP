const RefereeService = require('../services/RefereeService');
const AdminService = require('../services/AdminService');

class RefereeController {
    // (admin register removed)

    // Create referee profile for existing user (public)
    async createReferee(req, res) {
        const { uid } = req.params;
        const response = await RefereeService.createReferee(uid, req.body);
        return res.status(response.code).json(response);
    }

    // Get referee profile
    async getRefereeProfile(req, res) {
        const response = await RefereeService.getRefereeProfile(req.userId);
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
        const response = await RefereeService.acceptInvitation(req.userId, id);
        return res.status(response.code).json(response);
    }

    // Reject invitation
    async rejectInvitation(req, res) {
        const { id } = req.params;
        const response = await RefereeService.rejectInvitation(req.userId, id);
        return res.status(response.code).json(response);
    }

    // Get all referees
    async getAllReferees(req, res) {
        const limit = parseInt(req.query.limit) || 10;
        const skip = parseInt(req.query.skip) || 0;
        const response = await RefereeService.getAllReferees(limit, skip);
        return res.status(response.code).json(response);
    }

    // Update referee profile
    async updateRefereeProfile(req, res) {
        const response = await RefereeService.updateRefereeProfile(req.userId, req.body);
        return res.status(response.code).json(response);
    }

    // Get referee by credentials
    async getRefereeByCredentials(req, res) {
        const { certificationNumber } = req.params;
        const response = await RefereeService.getRefereeByCredentials(certificationNumber);
        return res.status(response.code).json(response);
    }

    // Verify referee credentials
    async verifyRefereeCredentials(req, res) {
        const { certificationNumber } = req.body;
        const response = await RefereeService.verifyRefereeCredentials(req.userId, certificationNumber);
        return res.status(response.code).json(response);
    }

    // Renew certification
    async renewCertification(req, res) {
        const { newCertificationNumber } = req.body;
        const response = await RefereeService.renewCertification(req.userId, newCertificationNumber);
        return res.status(response.code).json(response);
    }

    // Get referee by license
    async getRefereeByLicense(req, res) {
        const { licenseNumber } = req.params;
        const response = await RefereeService.getRefereeByLicense(licenseNumber);
        return res.status(response.code).json(response);
    }

    // Get referee race rounds
    async getRefereeRaceRounds(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { status, search, sortBy = 'raceDate', order = 'desc' } = req.query;
        const response = await RefereeService.getRefereeRaceRounds(req.userId, page, limit, status, search, sortBy, order);
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

    // Get single race round detail (referee-scoped)
    async getRaceRoundById(req, res) {
        const response = await RefereeService.getRaceRoundById(req.userId, req.params.id);
        return res.status(response.code).json(response);
    }

    // Verify or fail a registration after pre-race inspection
    async verifyRegistration(req, res) {
        const { raceRoundId, registrationId } = req.params;
        const response = await RefereeService.verifyRegistration(req.userId, raceRoundId, registrationId, req.body);
        return res.status(response.code).json(response);
    }

    // Cancel a pending registration as no-show
    async cancelRegistration(req, res) {
        const { raceRoundId, registrationId } = req.params;
        const response = await RefereeService.cancelRegistration(req.userId, raceRoundId, registrationId);
        return res.status(response.code).json(response);
    }

    // Finalize a race round — sets status to prepared or cancelled based on inspection results
    async finalizeRaceRound(req, res) {
        const { id } = req.params;
        const io = req.app.get('io');
        const response = await RefereeService.finalizeRaceRound(req.userId, id, io);
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
