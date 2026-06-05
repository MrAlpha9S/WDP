const RefereeService = require('../services/RefereeService');

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
        const response = await RefereeService.getRefereeInvitations(req.userId, limit, page);
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
        const response = await RefereeService.getRefereeRaceRounds(req.userId);
        return res.status(response.code).json(response);
    }

    // Get referee tournaments
    async getRefereeTournaments(req, res) {
        const response = await RefereeService.getRefereeTournaments(req.userId);
        return res.status(response.code).json(response);
    }
}

module.exports = new RefereeController();
