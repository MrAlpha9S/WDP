const RaceEligibilityRule = require('../entities/RaceEligibilityRule');

class RaceEligibilityRuleRepository {
    async findActiveRules() {
        return await RaceEligibilityRule.find({ isActive: true }).lean();
    }
}

module.exports = new RaceEligibilityRuleRepository();
