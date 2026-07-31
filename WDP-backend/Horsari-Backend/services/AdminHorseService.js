const Horse = require('../entities/Horse');
const User = require('../entities/User');
const Invitation = require('../entities/Invitation');
const Registration = require('../entities/Registration');
const RaceResult = require('../entities/RaceResult');
const Violation = require('../entities/Violation');

class HorseService {
    async getAllHorses(page = 1, limit = 10, search, status, sortBy = 'createdAt', order = 'desc') {
        try {
            const query = {};
            if (search) query.$or = [
                { horseName: { $regex: search, $options: 'i' } },
                { breed: { $regex: search, $options: 'i' } },
            ];
            if (status) query.status = status;

            const [total, horses] = await Promise.all([
                Horse.countDocuments(query),
                Horse.find(query)
                    .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .lean(),
            ]);

            const ownerIds = [...new Set(horses.map(h => h.ownerId.toString()))];
            const owners = ownerIds.length
                ? await User.find({ _id: { $in: ownerIds } }, 'fullName').lean()
                : [];
            const ownerMap = Object.fromEntries(owners.map(u => [u._id.toString(), u.fullName]));

            const items = horses.map(h => ({
                horseId: h._id,
                horseName: h.horseName,
                breed: h.breed ?? null,
                gender: h.gender ?? null,
                healthStatus: h.healthStatus,
                status: h.status,
                registrationDate: h.registrationDate ?? null,
                dateOfBirth: h.dateOfBirth ?? null,
                img: h.img ?? null,
                ownerId: h.ownerId,
                ownerName: ownerMap[h.ownerId.toString()] ?? null,
                createdAt: h.createdAt,
            }));

            return {
                code: 200,
                data: {
                    items,
                    pagination: {
                        totalItems: total,
                        totalPages: Math.ceil(total / limit),
                        currentPage: page,
                        limit,
                    },
                },
                msg: 'Horses retrieved successfully.',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getHorseDetail(horseId) {
        try {
            const horse = await Horse.findById(horseId).lean();
            if (!horse) return { code: 404, msg: 'Horse not found.' };

            const owner = await User.findById(horse.ownerId, 'fullName email').lean();

            const invitations = await Invitation.find({ horseId: horse._id }).lean();
            const regIds = invitations.map(i => i.registrationId).filter(Boolean);

            const [registrations, results, violations] = await Promise.all([
                regIds.length
                    ? Registration.find({ _id: { $in: regIds } })
                        .populate('raceRoundId', 'roundName raceDate location status')
                        .lean()
                    : [],
                regIds.length ? RaceResult.find({ registrationId: { $in: regIds } }).lean() : [],
                regIds.length
                    ? Violation.find({ registrationId: { $in: regIds } })
                        .populate('violationTypeId', 'violationName category severity')
                        .lean()
                    : [],
            ]);

            const resultMap = Object.fromEntries(results.map(r => [r.registrationId.toString(), r]));
            const violationMap = {};
            for (const v of violations) {
                const key = v.registrationId?.toString();
                if (key) (violationMap[key] = violationMap[key] || []).push(v);
            }

            const raceHistory = registrations.map(reg => {
                const rid = reg._id.toString();
                return {
                    registrationId: reg._id,
                    registrationStatus: reg.registrationStatus,
                    roundName: reg.raceRoundId?.roundName ?? null,
                    raceDate: reg.raceRoundId?.raceDate ?? null,
                    location: reg.raceRoundId?.location ?? null,
                    raceStatus: reg.raceRoundId?.status ?? null,
                    finishPosition: resultMap[rid]?.finishPosition ?? null,
                    finishTime: resultMap[rid]?.finishTime ?? null,
                    prizeMoney: resultMap[rid]?.prizeMoney ?? 0,
                    resultStatus: resultMap[rid]?.resultStatus ?? null,
                    distance: resultMap[rid]?.distance ?? null,
                    violations: (violationMap[rid] ?? []).map(v => ({
                        violationId: v._id,
                        typeName: v.violationTypeId?.violationName ?? null,
                        category: v.violationTypeId?.category ?? null,
                        severity: v.severity ?? v.violationTypeId?.severity ?? null,
                        stewardAction: v.stewardAction ?? null,
                        violationStatus: v.violationStatus,
                    })),
                };
            });

            return {
                code: 200,
                data: {
                    horse: { ...horse, horseId: horse._id },
                    owner: { ownerId: owner?._id ?? null, fullName: owner?.fullName ?? null, email: owner?.email ?? null },
                    totalRaces: raceHistory.length,
                    totalViolations: violations.length,
                    raceHistory,
                },
                msg: 'Horse detail retrieved successfully.',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async updateHorseStatus(horseId, newStatus) {
        try {
            if (!['active', 'inactive', 'retired'].includes(newStatus))
                return { code: 400, msg: 'Invalid status. Must be active, inactive, or retired.' };
            const horse = await Horse.findByIdAndUpdate(
                horseId,
                { status: newStatus },
                { new: true }
            ).lean();
            if (!horse) return { code: 404, msg: 'Horse not found.' };
            return { code: 200, data: horse, msg: `Horse status updated to ${newStatus}.` };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new HorseService();
