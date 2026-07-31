const AdminRuleService = require('../../services/AdminRuleService');

class RuleController {
    // --- Race Eligibility Rule CRUD ---

    async getAllRules(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { search, sortBy = 'createdAt', order = 'desc' } = req.query;
        const response = await AdminRuleService.getAllRules(page, limit, search, sortBy, order);
        return res.status(response.code).json(response);
    }

    async createRule(req, res) {
        const response = await AdminRuleService.createRule(req.body);
        return res.status(response.code).json(response);
    }

    async updateRule(req, res) {
        const { id } = req.params;
        const response = await AdminRuleService.updateRule(id, req.body);
        return res.status(response.code).json(response);
    }

    async deleteRule(req, res) {
        const { id } = req.params;
        const response = await AdminRuleService.deleteRule(id);
        return res.status(response.code).json(response);
    }
}

module.exports = new RuleController();
