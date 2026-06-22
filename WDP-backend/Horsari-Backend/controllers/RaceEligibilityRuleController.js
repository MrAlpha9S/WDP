const RaceEligibilityRuleService = require('../services/RaceEligibilityRuleService');

class RaceEligibilityRuleController {
    async getActiveRules(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { search, sortBy = 'createdAt', order = 'desc' } = req.query;
        const response = await RaceEligibilityRuleService.getActiveRules(page, limit, search, sortBy, order);
        return res.status(response.code).json(response);
    }
}

module.exports = new RaceEligibilityRuleController();
