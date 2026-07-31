const RaceReferee = require('../entities/RaceReferee');
const ViolationType = require('../entities/ViolationType');
const Violation = require('../entities/Violation');

class ViolationService {
    // ── Violation Types ───────────────────────────────────────────────────────

    async getViolationTypes(type, page = 1, limit = 50, search = null, sortBy = 'severity', order = 'asc') {
        try {
            const skip = (page - 1) * limit;
            const filter = { isActive: true };
            if (type) filter.type = type;
            if (search) filter.violationName = { $regex: search, $options: 'i' };
            const sortObj = { [sortBy]: order === 'asc' ? 1 : -1, violationName: 1 };
            const [items, totalItems] = await Promise.all([
                ViolationType.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
                ViolationType.countDocuments(filter),
            ]);
            return {
                code: 200,
                data: { items, pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit } },
                msg: 'Violation types retrieved.',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // ── Violations (race-round scoped) ────────────────────────────────────────

    async getRaceRoundViolations(refereeId, raceRoundId, status = null, search = null, sortBy = 'created_at', order = 'desc') {
        try {
            const assignment = await RaceReferee.findOne({ refereeId, raceRoundId }).lean();
            if (!assignment) return { code: 403, msg: 'You are not assigned to this race round.' };

            const filter = { raceRoundId };
            if (status) filter.violationStatus = status;
            if (search) filter.description = { $regex: search, $options: 'i' };
            const sortObj = { [sortBy]: order === 'asc' ? 1 : -1 };

            const violations = await Violation.find(filter)
                .populate('violationTypeId', 'violationName type category severity defaultPenalty')
                .populate('registrationId', '_id registrationStatus')
                .sort(sortObj)
                .lean();

            return {
                code: 200,
                data: violations,
                msg: 'Violations retrieved.',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // System-wide violations list (unscoped — not limited to this referee's
    // assignments). Mirrors AdminService.getAllViolations.
    async getAllViolations(page, limit, { status, severity, raceRoundId, sortBy = 'created_at', order = 'desc' } = {}) {
        try {
            const filter = {};
            if (status) filter.violationStatus = status;
            if (severity) filter.severity = Number(severity);
            if (raceRoundId) filter.raceRoundId = raceRoundId;

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

            return { code: 200, data: { items, pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) || 1 } }, msg: 'Violations retrieved successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async createViolation(refereeId, body, io) {
        try {
            const { raceRoundId, registrationId, violationTypeId, description } = body || {};
            if (!raceRoundId || !violationTypeId) {
                return { code: 400, msg: 'raceRoundId and violationTypeId are required.' };
            }
            const assignment = await RaceReferee.findOne({ refereeId, raceRoundId }).lean();
            if (!assignment) return { code: 403, msg: 'You are not assigned to this race round.' };

            const vt = await ViolationType.findById(violationTypeId).lean();
            if (!vt) return { code: 404, msg: 'ViolationType not found.' };

            const violation = await Violation.create({
                raceRoundId,
                registrationId: registrationId || undefined,
                raceRefereeId: assignment._id,
                violationTypeId,
                description,
                severity: vt.severity,
                violationStatus: 'pending',
            });
            const populated = await Violation.findById(violation._id)
                .populate('violationTypeId', 'violationName type category severity defaultPenalty')
                .lean();
            if (io) {
                io.to(`race:${raceRoundId}`).emit('violation_created', { violation: populated });
            }
            return { code: 201, data: populated, msg: 'Violation created.' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async confirmViolation(refereeId, violationId) {
        try {
            const violation = await Violation.findById(violationId).lean();
            if (!violation) return { code: 404, msg: 'Violation not found.' };

            // Confirm the referee owns this violation via their assignment
            const assignment = await RaceReferee.findOne({
                _id: violation.raceRefereeId,
                refereeId,
            }).lean();
            if (!assignment) return { code: 403, msg: 'You do not have permission to confirm this violation.' };

            await Violation.findByIdAndUpdate(violationId, { violationStatus: 'confirmed' });
            return { code: 200, msg: 'Violation confirmed.' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async deleteViolation(refereeId, violationId, io) {
        try {
            const violation = await Violation.findById(violationId).lean();
            if (!violation) return { code: 404, msg: 'Violation not found.' };

            // Confirm the referee owns this violation via their assignment
            const assignment = await RaceReferee.findOne({
                _id: violation.raceRefereeId,
                refereeId,
            }).lean();
            if (!assignment) return { code: 403, msg: 'You do not have permission to delete this violation.' };

            const raceRoundId = String(violation.raceRoundId);
            await Violation.findByIdAndDelete(violationId);
            if (io) {
                io.to(`race:${raceRoundId}`).emit('violation_deleted', { violationId });
            }
            return { code: 200, msg: 'Violation deleted.' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new ViolationService();
