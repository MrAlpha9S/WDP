const RaceEligibilityRuleRepository = require('../repositories/RaceEligibilityRuleRepository');

class RaceEligibilityRuleService {
    async getActiveRules(page = 1, limit = 10, search = null, sortBy = 'createdAt', order = 'desc') {
        try {
            const skip = (page - 1) * limit;
            const filter = {};
            if (search) {
                filter.$or = [
                    { raceType: { $regex: search, $options: 'i' } },
                    { gradeLevel: { $regex: search, $options: 'i' } },
                ];
            }
            const sortObj = { [sortBy]: order === 'asc' ? 1 : -1 };
            const [items, totalItems] = await Promise.all([
                RaceEligibilityRuleRepository.findActiveRulesPaginated(filter, sortObj, skip, limit),
                RaceEligibilityRuleRepository.countActiveRules(filter),
            ]);
            return {
                code: 200,
                data: {
                    items,
                    pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit },
                },
                msg: 'Active race eligibility rules retrieved successfully',
            };
        } catch (error) {
            console.error('Error fetching active rules:', error);
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new RaceEligibilityRuleService();
