const RaceEligibilityRuleService = require('../services/RaceEligibilityRuleService');

class RaceEligibilityRuleController {
    async getActiveRules(req, res) {
        const response = await RaceEligibilityRuleService.getActiveRules();
        return res.status(response.code).json(response);
    }
}

module.exports = new RaceEligibilityRuleController();
