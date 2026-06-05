const RaceEligibilityRuleRepository = require('../repositories/RaceEligibilityRuleRepository');

class RaceEligibilityRuleService {
    async getActiveRules() {
        try {
            const rules = await RaceEligibilityRuleRepository.findActiveRules();
            return {
                code: 200,
                data: rules,
                msg: 'Active race eligibility rules retrieved successfully'
            };
        } catch (error) {
            console.error('Error fetching active rules:', error);
            return {
                code: 500,
                msg: error.message
            };
        }
    }
}

module.exports = new RaceEligibilityRuleService();
