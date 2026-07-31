const RaceRound = require('../entities/RaceRound');
const Violation = require('../entities/Violation');

class ViolationService {
    // GET all violations for a race round (all referees combined)
    async getRaceViolations(raceRoundId) {
        try {
            const raceRound = await RaceRound.findById(raceRoundId).lean();
            if (!raceRound) return { code: 404, msg: 'Race round not found.' };

            const violations = await Violation.find({ raceRoundId })
                .populate('violationTypeId', 'violationName type category severity defaultPenalty')
                .populate('registrationId', '_id registrationStatus')
                .populate('raceRefereeId', '_id refereeId')
                .sort({ created_at: -1 })
                .lean();

            return { code: 200, data: violations, msg: 'Race violations retrieved.' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // PATCH soft-delete (dismiss) a single violation
    async dismissViolation(violationId) {
        try {
            const violation = await Violation.findById(violationId).lean();
            if (!violation) return { code: 404, msg: 'Violation not found.' };

            const updated = await Violation.findByIdAndUpdate(
                violationId,
                { violationStatus: 'dismissed' },
                { new: true }
            ).lean();

            return { code: 200, data: updated, msg: 'Violation dismissed.' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // List all violations across every race, with pagination and optional filters.
    async getAllViolations(page, limit, { status, severity, raceRoundId, sortBy = 'created_at', order = 'desc' } = {}) {
        try {
            const Violation = require('../entities/Violation');
            const filter = {};
            if (status) filter.violationStatus = status;
            if (severity) filter.severity = Number(severity);
            if (raceRoundId) filter.raceRoundId = raceRoundId;

            // Violation's timestamps option remaps createdAt -> created_at (see entities/Violation.js)
            const allowedViolationSortFields = ['created_at', 'severity', 'violationStatus'];
            const sortField = allowedViolationSortFields.includes(sortBy) ? sortBy : 'created_at';
            const sortOrder = order === 'asc' ? 1 : -1;

            const skip = (page - 1) * limit;
            const [items, totalItems] = await Promise.all([
                Violation.find(filter)
                    .populate('violationTypeId', 'violationName type category severity defaultPenalty')
                    .populate('registrationId', 'horseId registrationStatus')
                    .populate('raceRefereeId', 'refereeId')
                    .populate('raceRoundId', 'roundName raceDate')
                    .sort({ [sortField]: sortOrder })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Violation.countDocuments(filter),
            ]);

            return {
                code: 200,
                data: {
                    items,
                    pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) || 1 },
                },
                msg: 'Violations retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // List all violation types with pagination, search, filters and sort.
    async getAllViolationTypes(page, limit, { search, type, category, sortBy = 'createdAt', order = 'desc' } = {}) {
        try {
            const ViolationType = require('../entities/ViolationType');
            const filter = {};
            if (search) filter.violationName = { $regex: search, $options: 'i' };
            if (type) filter.type = type;
            if (category) filter.category = category;

            const allowedSortFields = ['violationName', 'severity', 'type', 'category', 'createdAt', 'updatedAt'];
            const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
            const sortOrder = order === 'asc' ? 1 : -1;

            const skip = (page - 1) * limit;
            const [items, totalItems] = await Promise.all([
                ViolationType.find(filter).sort({ [sortField]: sortOrder }).skip(skip).limit(limit).lean(),
                ViolationType.countDocuments(filter),
            ]);

            return {
                code: 200,
                data: {
                    items,
                    pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) || 1 },
                },
                msg: 'Violation types retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Create a new violation type.
    async createViolationType(data) {
        try {
            const ViolationType = require('../entities/ViolationType');
            const vt = await new ViolationType(data).save();
            return { code: 201, data: vt, msg: 'Violation type created successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Update an existing violation type.
    async updateViolationType(id, data) {
        try {
            const ViolationType = require('../entities/ViolationType');
            const vt = await ViolationType.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
            if (!vt) return { code: 404, msg: 'Violation type not found' };
            return { code: 200, data: vt, msg: 'Violation type updated successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Toggle isActive on a violation type (soft delete / restore).
    async toggleViolationTypeActive(id, isActive) {
        try {
            const ViolationType = require('../entities/ViolationType');
            const vt = await ViolationType.findByIdAndUpdate(id, { isActive }, { new: true }).lean();
            if (!vt) return { code: 404, msg: 'Violation type not found' };
            return { code: 200, data: vt, msg: `Violation type ${isActive ? 'activated' : 'deactivated'} successfully` };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new ViolationService();
