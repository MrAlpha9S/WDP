const RefereeViolationService = require('../../services/RefereeViolationService');

class ViolationController {
    // Get violation types (optionally filtered by type=pre-race|during-race|after-race)
    async getViolationTypes(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const { search, sortBy = 'severity', order = 'asc' } = req.query;
        const response = await RefereeViolationService.getViolationTypes(req.query.type, page, limit, search, sortBy, order);
        return res.status(response.code).json(response);
    }

    // Get all violations for a race round (referee-scoped)
    async getRaceRoundViolations(req, res) {
        const { status, search, sortBy = 'created_at', order = 'desc' } = req.query;
        const response = await RefereeViolationService.getRaceRoundViolations(req.userId, req.params.id, status, search, sortBy, order);
        return res.status(response.code).json(response);
    }

    // Get all violations in the system (unscoped browse, not just this referee's assignments)
    async getAllViolations(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { status, severity, raceRoundId, sortBy = 'created_at', order = 'desc' } = req.query;
        const response = await RefereeViolationService.getAllViolations(page, limit, { status, severity, raceRoundId, sortBy, order });
        return res.status(response.code).json(response);
    }

    // Create a violation (used by LivePage for during-race incidents)
    async createViolation(req, res) {
        const io = req.app.get('io');
        const response = await RefereeViolationService.createViolation(req.userId, req.body, io);
        return res.status(response.code).json(response);
    }

    // Confirm a violation
    async confirmViolation(req, res) {
        const response = await RefereeViolationService.confirmViolation(req.userId, req.params.violationId);
        return res.status(response.code).json(response);
    }

    // Delete / dismiss a violation
    async deleteViolation(req, res) {
        const io = req.app.get('io');
        const response = await RefereeViolationService.deleteViolation(req.userId, req.params.violationId, io);
        return res.status(response.code).json(response);
    }
}

module.exports = new ViolationController();
