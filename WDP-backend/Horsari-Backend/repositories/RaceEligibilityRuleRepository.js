const RaceEligibilityRule = require('../entities/RaceEligibilityRule');

class RaceEligibilityRuleRepository {
    async findActiveRules() {
        return await RaceEligibilityRule.find({ isActive: true }).lean();
    }

    async findActiveRulesPaginated(filter, sortObj, skip, limit) {
        return await RaceEligibilityRule.find({ isActive: true, ...filter }).sort(sortObj).skip(skip).limit(limit).lean();
    }

    async countActiveRules(filter) {
        return await RaceEligibilityRule.countDocuments({ isActive: true, ...filter });
    }
}

module.exports = new RaceEligibilityRuleRepository();
