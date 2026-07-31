const HorseRepository = require('../repositories/HorseRepository');
const HorseOwnerRepository = require('../repositories/HorseOwnerRepository');
const Invitation = require('../entities/Invitation');
const RaceResult = require('../entities/RaceResult');
const Horse = require('../entities/Horse');
const Registration = require('../entities/Registration');
const Violation = require('../entities/Violation');
const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
const CurrencyConverter = require('./CurrencyConverter');

class HorseService {
    // Get all horses owned
    async getOwnedHorses(ownerId, page = 1, limit = 10, search = null, sortBy = 'createdAt', order = 'desc') {
        try {
            const skip = (page - 1) * limit;
            const filter = {};
            if (search) filter.horseName = { $regex: search, $options: 'i' };
            const sortObj = { [sortBy]: order === 'asc' ? 1 : -1 };
            const [rawItems, totalItems] = await Promise.all([
                HorseRepository.findByOwnerIdPaginated(ownerId, filter, sortObj, skip, limit),
                HorseRepository.countByOwnerIdFiltered(ownerId, filter),
            ]);

            const items = await Promise.all(rawItems.map(async (horse) => {
                const invitations = await Invitation.find({ horseId: horse._id, registrationId: { $ne: null } }).select('registrationId').lean();
                const registrationIds = invitations.map(inv => inv.registrationId);
                const raceResults = registrationIds.length > 0
                    ? await RaceResult.find({ registrationId: { $in: registrationIds } }).select('finishPosition').lean()
                    : [];
                const horseObj = horse.toObject ? horse.toObject() : horse;
                return { ...horseObj, raceResults };
            }));

            return {
                code: 200,
                data: {
                    items,
                    pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit },
                },
                msg: 'Owned horses retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Get horse statistics for owner
    async getOwnedHorsesStats(ownerId) {
        try {
            const horses = await HorseRepository.findByOwnerId(ownerId);
            if (horses.length === 0) {
                return {
                    code: 200,
                    data: {
                        totalHorses: 0,
                        healthyHorses: 0,
                        injuredHorses: 0,
                        activeHorses: 0,
                        inactiveHorses: 0,
                    },
                    msg: 'No horses found for this owner',
                };
            }

            const healthyCount = horses.filter(h => h.healthStatus === 'healthy').length;
            const injuredCount = horses.filter(h => h.healthStatus === 'injured').length;
            const activeCount = horses.filter(h => h.status === 'active').length;
            const inactiveCount = horses.filter(h => h.status === 'inactive').length;

            return {
                code: 200,
                data: {
                    totalHorses: horses.length,
                    healthyHorses: healthyCount,
                    injuredHorses: injuredCount,
                    activeHorses: activeCount,
                    inactiveHorses: inactiveCount,
                },
                msg: 'Horse statistics retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    async getHorseProfile(ownerId, horseId) {
        try {
            if (!ownerId || !horseId) return { code: 400, msg: 'Missing ownerId or horseId' };

            const horse = await Horse.findById(horseId).lean();
            if (!horse) return { code: 404, msg: 'Horse not found' };
            if (String(horse.ownerId) !== String(ownerId))
                return { code: 403, msg: 'Forbidden' };

            const registrations = await Registration
                .find({ horseId, horseOwnerId: ownerId })
                .populate({ path: 'raceRoundId', populate: { path: 'tournamentId', select: 'name' } })
                .sort({ registeredAt: -1 })
                .lean();

            const regIds = registrations.map(r => r._id);

            const [results, violations] = await Promise.all([
                RaceResult.find({ registrationId: { $in: regIds } }).lean(),
                Violation.find({ registrationId: { $in: regIds } })
                    .populate('violationTypeId', 'violationName category severity defaultPenalty')
                    .lean(),
            ]);

            const regIdToRaceRound = Object.fromEntries(registrations.map(r => [String(r._id), r.raceRoundId]));

            // Convert prizeMoney to VND using each result's own race round currency
            // (mirrors the fix already applied to getRaceDetail).
            const resultByRegId = Object.fromEntries(results.map(r => {
                const raceRound = regIdToRaceRound[String(r.registrationId)];
                return [String(r.registrationId), {
                    ...r,
                    prizeMoney: CurrencyConverter.convertToVnd(r.prizeMoney || 0, raceRound?.currencyType),
                }];
            }));
            const officialResults = Object.values(resultByRegId).filter(r => r.finishPosition != null);
            const wins = officialResults.filter(r => r.finishPosition === 1).length;
            const podiums = officialResults.filter(r => r.finishPosition <= 3).length;
            const totalPrize = officialResults.reduce((sum, r) => sum + (r.prizeMoney || 0), 0);

            const raceRoundById = Object.fromEntries(
                registrations
                    .filter(r => r.raceRoundId?._id)
                    .map(r => [String(r.raceRoundId._id), r.raceRoundId])
            );

            return {
                code: 200,
                data: {
                    horse,
                    stats: {
                        totalRaces: officialResults.length,
                        wins,
                        podiums,
                        losses: officialResults.length - wins,
                        winRate: officialResults.length > 0
                            ? Math.round((wins / officialResults.length) * 100) : 0,
                        totalPrize,
                    },
                    raceHistory: registrations.map(reg => ({
                        registration: {
                            _id: reg._id,
                            registrationStatus: reg.registrationStatus,
                            laneNumber: reg.laneNumber,
                            registeredAt: reg.registeredAt,
                        },
                        raceRound: reg.raceRoundId ?? null,
                        result: resultByRegId[String(reg._id)] ?? null,
                    })),
                    violations: violations.map(v => ({
                        ...v,
                        raceRound: raceRoundById[String(v.raceRoundId)] ?? { _id: v.raceRoundId },
                    })),
                },
                msg: 'Horse profile retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async updateHorseStatus(ownerId, horseId, status) {
        try {
            const owner = await HorseOwnerRepository.findByOwnerId(ownerId);
            if (!owner) return { code: 404, msg: 'Horse owner not found' };
            const horse = await Horse.findById(horseId);
            if (!horse) return { code: 404, msg: 'Horse not found' };
            if (String(horse.ownerId) !== String(ownerId))
                return { code: 403, msg: 'Forbidden' };
            horse.status = status;
            await horse.save();
            return { code: 200, msg: 'Horse status updated successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async updateHorseHealthStatus(ownerId, horseId, healthStatus) {
        try {
            const owner = await HorseOwnerRepository.findByOwnerId(ownerId);
            if (!owner) return { code: 404, msg: 'Horse owner not found' };
            const horse = await Horse.findById(horseId);
            if (!horse) return { code: 404, msg: 'Horse not found' };
            if (String(horse.ownerId) !== String(ownerId))
                return { code: 403, msg: 'Forbidden' };
            horse.healthStatus = healthStatus;
            await horse.save();
            return { code: 200, msg: 'Horse health status updated successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getRaceEligibilityMetadata(ruleId) {
        try {
            // ruleId may be a plain string ID or a nested object when serialized from query params
            const id = (typeof ruleId === 'object' && ruleId !== null) ? ruleId._id : ruleId;
            if (!id) return { code: 400, msg: 'ruleId is required' };

            const rule = await RaceEligibilityRule.findById(id).lean();
            if (!rule) return { code: 404, msg: 'Eligibility rule not found' };

            return {
                code: 200,
                data: {
                    eligibilityRules: [{
                        raceType: rule.raceType ?? null,
                        minWins: rule.minRacesWon ?? null,
                        maxWins: null,
                        minAge: rule.minAge ?? null,
                        maxAge: rule.maxAge ?? null,
                        requiredGender: rule.requiredGender ?? null,
                        requiredBreed: rule.requiredBreed ?? null,
                    }],
                },
                msg: 'Race eligibility metadata retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new HorseService();
