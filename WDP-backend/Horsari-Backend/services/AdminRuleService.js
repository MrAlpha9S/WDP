class RuleService {
    // --- Race Eligibility Rule CRUD ---

    async getAllRules(page = 1, limit = 10, search = null, sortBy = 'createdAt', order = 'desc') {
        try {
            const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
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
                RaceEligibilityRule.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
                RaceEligibilityRule.countDocuments(filter),
            ]);
            return {
                code: 200,
                data: {
                    items,
                    pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit },
                },
                msg: 'Race eligibility rules retrieved successfully',
            };
        } catch (error) {
            console.error('Error fetching rules:', error);
            return { code: 500, msg: error.message };
        }
    }

    async getRuleById(id) {
        try {
            const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
            const rule = await RaceEligibilityRule.findById(id).lean();
            if (!rule) {
                return { code: 404, msg: 'Race eligibility rule not found' };
            }
            return {
                code: 200,
                data: rule,
                msg: 'Race eligibility rule retrieved successfully'
            };
        } catch (error) {
            console.error('Error fetching rule:', error);
            return { code: 500, msg: error.message };
        }
    }

    async createRule(ruleData) {
        try {
            const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
            const newRule = new RaceEligibilityRule(ruleData);
            await newRule.save();
            return {
                code: 201,
                data: newRule,
                msg: 'Race eligibility rule created successfully'
            };
        } catch (error) {
            console.error('Error creating rule:', error);
            return { code: 500, msg: error.message };
        }
    }

    async updateRule(id, ruleData) {
        try {
            const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
            const updatedRule = await RaceEligibilityRule.findByIdAndUpdate(
                id,
                { $set: ruleData },
                { new: true, runValidators: true }
            ).lean();

            if (!updatedRule) {
                return { code: 404, msg: 'Race eligibility rule not found' };
            }
            return {
                code: 200,
                data: updatedRule,
                msg: 'Race eligibility rule updated successfully'
            };
        } catch (error) {
            console.error('Error updating rule:', error);
            return { code: 500, msg: error.message };
        }
    }

    async deleteRule(id) {
        try {
            const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
            const deletedRule = await RaceEligibilityRule.findByIdAndDelete(id).lean();

            if (!deletedRule) {
                return { code: 404, msg: 'Race eligibility rule not found' };
            }
            return {
                code: 200,
                data: null,
                msg: 'Race eligibility rule deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting rule:', error);
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new RuleService();
