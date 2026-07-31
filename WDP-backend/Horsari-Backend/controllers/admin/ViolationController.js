const AdminViolationService = require('../../services/AdminViolationService');

class ViolationController {
    async getAllViolations(req, res) {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { status, severity, raceRoundId, sortBy = 'createdAt', order = 'desc' } = req.query;
        const response = await AdminViolationService.getAllViolations(page, limit, { status, severity, raceRoundId, sortBy, order });
        return res.status(response.code).json(response);
    }

    // PATCH soft-delete (dismiss) a single violation
    async dismissViolation(req, res) {
        const response = await AdminViolationService.dismissViolation(req.params.id);
        return res.status(response.code).json(response);
    }

    async getAllViolationTypes(req, res) {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { search, type, category, sortBy = 'createdAt', order = 'desc' } = req.query;
        const response = await AdminViolationService.getAllViolationTypes(page, limit, { search, type, category, sortBy, order });
        return res.status(response.code).json(response);
    }

    async createViolationType(req, res) {
        const response = await AdminViolationService.createViolationType(req.body);
        return res.status(response.code).json(response);
    }

    async updateViolationType(req, res) {
        const response = await AdminViolationService.updateViolationType(req.params.id, req.body);
        return res.status(response.code).json(response);
    }

    async toggleViolationTypeActive(req, res) {
        const { isActive } = req.body;
        const response = await AdminViolationService.toggleViolationTypeActive(req.params.id, isActive);
        return res.status(response.code).json(response);
    }
}

module.exports = new ViolationController();
