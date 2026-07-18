const HorseOwnerRepository = require('../repositories/HorseOwnerRepository');
const HorseRepository = require('../repositories/HorseRepository');
const JockeyRepository = require('../repositories/JockeyRepository');
const UserRepository = require('../repositories/UserRepository');
const Registration = require('../entities/Registration');
const RaceRound = require('../entities/RaceRound');
const Tournament = require('../entities/Tournament');
const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
const Invitation = require('../entities/Invitation');
const Horse = require('../entities/Horse');
const RaceResult = require('../entities/RaceResult');
const Violation = require('../entities/Violation');
const Jockey = require('../entities/Jockey');
const User = require('../entities/User');
const Transaction = require('../entities/Transaction');
const CurrencyConverter = require('./CurrencyConverter');

class HorseOwnerService {
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

    // Get race invitations for owner: registrations + raceRound (+ tournament, eligibility rule)
    async getRaceInvitations(ownerId, page = 1, limit = 10, status = null, search = null, sortBy = 'createdAt', order = 'desc') {
        try {
            if (!ownerId) return { code: 400, msg: 'ownerId is required' };

            const skip = (page - 1) * limit;
            const regFilter = { horseOwnerId: ownerId };
            if (status) regFilter.registrationStatus = status;

            // For search: find matching raceRound IDs by roundName first
            if (search) {
                const matchingRounds = await RaceRound.find({ roundName: { $regex: search, $options: 'i' } }, '_id').lean();
                regFilter.raceRoundId = { $in: matchingRounds.map(r => r._id) };
            }

            const sortObj = { [sortBy]: order === 'asc' ? 1 : -1 };

            const [regs, totalItems] = await Promise.all([
                Registration.find(regFilter).sort(sortObj).skip(skip).limit(limit).lean(),
                Registration.countDocuments(regFilter),
            ]);

            const horses = await HorseRepository.findByOwnerId(ownerId);

            const regIds = regs.map(r => r._id);
            const existingInvitations = await Invitation.find({ registrationId: { $in: regIds } }).select('registrationId horseId').lean();
            const existingHorseMap = new Map();
            for (const inv of existingInvitations) {
                if (!existingHorseMap.has(String(inv.registrationId))) {
                    existingHorseMap.set(String(inv.registrationId), String(inv.horseId));
                }
            }

            // Batch-fetch main invitations (jockeyInRaceId) to get jockey fullName and horse name
            const mainInvitationIds = regs.filter(r => r.jockeyInRaceId).map(r => r.jockeyInRaceId);
            const mainInvitations = await Invitation.find({ _id: { $in: mainInvitationIds } })
                .populate({ path: 'jockeyId', model: 'User', select: 'fullName image' })
                .populate('horseId', 'horseName')
                .lean();
            const mainInvMap = new Map(mainInvitations.map(inv => [String(inv._id), inv]));

            const items = await Promise.all(regs.map(async reg => {
                const rr = await RaceRound.findById(reg.raceRoundId).populate('eligibilityRuleId').lean();
                let tournament = null;
                if (rr && rr.tournamentId) {
                    tournament = await Tournament.findById(rr.tournamentId).lean();
                }

                let eligibleHorseIds = [];
                if (rr && rr.eligibilityRuleId) {
                    const rule = await RaceEligibilityRule.findById(rr.eligibilityRuleId).lean();
                    if (rule) {
                        eligibleHorseIds = horses.filter(h => {
                            if (rule.requiredBreed && h.breed !== rule.requiredBreed) return false;
                            if (rule.requiredGender && h.gender !== rule.requiredGender) return false;
                            return true;
                        }).map(h => h._id);
                    }
                }

                const mainInv = reg.jockeyInRaceId ? mainInvMap.get(String(reg.jockeyInRaceId)) : null;

                return {
                    registration: reg,
                    raceRound: rr || null,
                    tournament: tournament || null,
                    eligibleHorseIds,
                    existingHorseId: existingHorseMap.get(String(reg._id)) ?? null,
                    jockey: mainInv?.jockeyId
                        ? { fullName: mainInv.jockeyId.fullName ?? null, image: mainInv.jockeyId.image ?? null }
                        : null,
                    horse: mainInv?.horseId
                        ? { horseName: mainInv.horseId.horseName ?? null }
                        : null,
                };
            }));

            return {
                code: 200,
                data: {
                    items,
                    pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit },
                },
                msg: 'Race invitations retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Approve a registration (owner action)
    async approveRegistration(ownerId, registrationId, io) {
        try {
            if (!ownerId) return { code: 400, msg: 'ownerId is required' };
            if (!registrationId) return { code: 400, msg: 'registrationId is required' };

            const reg = await Registration.findById(registrationId);
            if (!reg) return { code: 404, msg: 'Registration not found' };
            const tournament = await Tournament.findById(reg.tournamentId);
            if (tournament && tournament.status === 'cancelled') {
                return { code: 400, msg: 'Registrations for cancelled tournaments cannot be approved' };
            }
            if (reg.registrationStatus == 'cancelled' || reg.registrationStatus == 'rejected') {
                return { code: 400, msg: 'rejected or cancelled registrations cannot be approved' };
            }
            if (String(reg.horseOwnerId) !== String(ownerId)) {
                return { code: 403, msg: 'Not authorized to modify this registration' };
            }

            reg.registrationStatus = 'approved';
            await reg.save();

            const NotificationService = require('./NotificationService');
            NotificationService.notify({
                role: 'admin',
                type: 'registration_approved',
                title: 'Registration Approved',
                message: 'A horse owner has approved their race registration.',
                relatedEntityType: 'Registration',
                relatedEntityId: reg._id,
            }, io).catch(err => console.error('[approveRegistration] notify admin error:', err.message));

            return { code: 200, data: reg, msg: 'Registration approved' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Dashboard summary: counts + recent activity feed
    async getDashboardSummary(ownerId) {
        try {
            if (!ownerId) return { code: 400, msg: 'ownerId is required' };

            const horses = await HorseRepository.findByOwnerId(ownerId);
            const totalHorses = horses.length;
            const horseIds = horses.map(h => h._id);

            // Owner's registrations
            const ownerRegs = await Registration.find({ horseOwnerId: ownerId }).select('_id raceRoundId horseId createdAt').lean();
            const regIds = ownerRegs.map(r => r._id);
            const regRaceRoundIds = ownerRegs.map(r => r.raceRoundId).filter(Boolean);

            // Count upcoming/live race rounds the owner is in
            const activeRaceRounds = regRaceRoundIds.length > 0
                ? await RaceRound.find({
                    _id: { $in: regRaceRoundIds },
                    status: { $in: ['scheduled', 'prepared', 'awaitingConfirmation', 'running'] },
                }).select('_id').lean()
                : [];
            const upcomingRacesCount = activeRaceRounds.length;

            // Count pending jockey invitations sent by this owner
            const activeInvitationsCount = regIds.length > 0
                ? await Invitation.countDocuments({ registrationId: { $in: regIds }, invitationStatus: 'pending' })
                : 0;

            // Recent activity feed (last 14 days, max 10)
            const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

            const [recentRegs, recentResults, recentInvitations, recentViolations] = await Promise.all([
                Registration.find({ horseOwnerId: ownerId, createdAt: { $gte: since } })
                    .populate('horseId', 'horseName')
                    .populate({ path: 'raceRoundId', select: 'roundName' })
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .lean(),
                regIds.length > 0
                    ? RaceResult.find({ registrationId: { $in: regIds }, createdAt: { $gte: since } })
                        .populate({ path: 'registrationId', populate: [{ path: 'horseId', select: 'horseName' }, { path: 'raceRoundId', select: 'roundName' }] })
                        .sort({ createdAt: -1 })
                        .limit(5)
                        .lean()
                    : [],
                regIds.length > 0
                    ? Invitation.find({ registrationId: { $in: regIds }, updatedAt: { $gte: since }, invitationStatus: { $in: ['accepted', 'declined'] } })
                        .populate({ path: 'jockeyId', model: 'User', select: 'fullName' })
                        .sort({ updatedAt: -1 })
                        .limit(5)
                        .lean()
                    : [],
                regIds.length > 0
                    ? Violation.find({ registrationId: { $in: regIds }, createdAt: { $gte: since } })
                        .populate('violationTypeId', 'violationName')
                        .populate({ path: 'registrationId', populate: { path: 'horseId', select: 'horseName' } })
                        .sort({ createdAt: -1 })
                        .limit(5)
                        .lean()
                    : [],
            ]);

            const relativeTime = (date) => {
                const diff = Date.now() - new Date(date).getTime();
                const mins = Math.floor(diff / 60000);
                if (mins < 1) return 'Just now';
                if (mins < 60) return `${mins}m ago`;
                const hrs = Math.floor(mins / 60);
                if (hrs < 24) return `${hrs}h ago`;
                return `${Math.floor(hrs / 24)}d ago`;
            };

            const activity = [
                ...recentRegs.map(r => ({
                    type: 'registration',
                    icon: 'check',
                    time: relativeTime(r.createdAt),
                    text: `${r.horseId?.horseName ?? 'Your horse'} registered for `,
                    highlight: r.raceRoundId?.roundName ?? 'a race',
                    date: r.createdAt,
                })),
                ...recentResults.map(r => {
                    const pos = r.finishPosition;
                    const ordinals = ['1st', '2nd', '3rd'];
                    const label = pos != null ? (ordinals[pos - 1] ?? `${pos}th`) : 'DNF';
                    return {
                        type: 'result',
                        icon: pos === 1 ? 'check' : 'user',
                        time: relativeTime(r.createdAt),
                        text: `${r.registrationId?.horseId?.horseName ?? 'Your horse'} finished ${label} in `,
                        highlight: r.registrationId?.raceRoundId?.roundName ?? 'a race',
                        date: r.createdAt,
                    };
                }),
                ...recentInvitations.map(inv => ({
                    type: 'invitation',
                    icon: inv.invitationStatus === 'accepted' ? 'check' : 'alert',
                    time: relativeTime(inv.updatedAt),
                    text: `${inv.jockeyId?.fullName ?? 'A jockey'} ${inv.invitationStatus} your hire request for `,
                    highlight: 'an upcoming race',
                    date: inv.updatedAt,
                })),
                ...recentViolations.map(v => ({
                    type: 'violation',
                    icon: 'alert',
                    time: relativeTime(v.createdAt),
                    text: `Violation issued on `,
                    highlight: `${v.registrationId?.horseId?.horseName ?? 'your horse'}: ${v.violationTypeId?.violationName ?? 'Unknown'}`,
                    date: v.createdAt,
                })),
            ]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map(({ date, ...rest }) => rest);

            return {
                code: 200,
                data: { totalHorses, upcomingRacesCount, activeInvitationsCount, recentActivity: activity },
                msg: 'Dashboard summary retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Top performing horses by win rate
    async getTopPerformers(ownerId, limit = 5) {
        try {
            if (!ownerId) return { code: 400, msg: 'ownerId is required' };

            const horses = await HorseRepository.findByOwnerId(ownerId);
            if (horses.length === 0) return { code: 200, data: [], msg: 'No horses found' };

            const allRegs = await Registration.find({ horseOwnerId: ownerId })
                .select('_id horseId raceRoundId')
                .populate('raceRoundId', 'currencyType')
                .lean();
            const regIds = allRegs.map(r => r._id);
            const regMap = new Map(allRegs.map(r => [String(r._id), r]));

            const results = regIds.length > 0
                ? await RaceResult.find({ registrationId: { $in: regIds }, finishPosition: { $ne: null }, resultStatus: 'official' }).lean()
                : [];

            // Aggregate stats per horse
            const statsMap = new Map();
            for (const r of results) {
                const reg = regMap.get(String(r.registrationId));
                if (!reg) continue;
                const horseId = String(reg.horseId);
                
                if (!statsMap.has(horseId)) statsMap.set(horseId, { totalRaces: 0, wins: 0, prizeMoney: 0 });
                const s = statsMap.get(horseId);
                s.totalRaces++;
                if (r.finishPosition === 1) s.wins++;
                
                const currency = reg.raceRoundId?.currencyType || 'VND';
                s.prizeMoney += CurrencyConverter.convertToVnd(r.prizeMoney || 0, currency);
            }

            const performers = horses
                .map(h => {
                    const s = statsMap.get(String(h._id)) ?? { totalRaces: 0, wins: 0, prizeMoney: 0 };
                    return {
                        id: h._id,
                        name: h.horseName,
                        img: h.img ?? null,
                        winRate: s.totalRaces > 0 ? Math.round((s.wins / s.totalRaces) * 100) : 0,
                        wins: s.wins,
                        totalRaces: s.totalRaces,
                        prizeMoney: s.prizeMoney
                    };
                })
                .sort((a, b) => b.prizeMoney - a.prizeMoney || b.wins - a.wins)
                .slice(0, limit);

            return { code: 200, data: performers, msg: 'Top performers retrieved successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Browse all joinable / live race rounds (paginated, searchable)
    async getAvailableRaces(ownerId, page = 1, limit = 12, search = null, statusFilter = null) {
        try {
            if (!ownerId) return { code: 400, msg: 'ownerId is required' };

            const filter = { status: { $in: ['scheduled', 'running', 'awaitingConfirmation', 'prepared'] } };
            if (statusFilter) filter.status = statusFilter;
            if (search) filter.roundName = { $regex: search, $options: 'i' };

            const skip = (page - 1) * limit;
            const [totalItems, raceRounds] = await Promise.all([
                RaceRound.countDocuments(filter),
                RaceRound.find(filter)
                    .sort({ raceDate: 1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
            ]);

            const raceIds = raceRounds.map(r => r._id);

            // Batch-fetch supplementary data for this page only
            const [tournaments, ownerRegs, participantCounts, eligibilityRules] = await Promise.all([
                Tournament.find({ _id: { $in: raceRounds.map(r => r.tournamentId).filter(Boolean) } })
                    .select('_id tournamentName')
                    .lean(),
                Registration.find({ raceRoundId: { $in: raceIds }, horseOwnerId: ownerId })
                    .select('raceRoundId registrationStatus')
                    .lean(),
                Registration.aggregate([
                    { $match: { raceRoundId: { $in: raceIds }, registrationStatus: { $in: ['approved', 'verified'] } } },
                    { $group: { _id: '$raceRoundId', count: { $sum: 1 } } },
                ]),
                RaceEligibilityRule.find({
                    _id: { $in: raceRounds.map(r => r.eligibilityRuleId).filter(Boolean) },
                }).select('_id raceType requiredBreed requiredGender minAge maxAge minRacesWon').lean(),
            ]);

            const tournamentMap = new Map(tournaments.map(t => [String(t._id), t]));
            const ownerRegMap = new Map(ownerRegs.map(r => [String(r.raceRoundId), r]));
            const countMap = new Map(participantCounts.map(c => [String(c._id), c.count]));
            const ruleMap = new Map(eligibilityRules.map(r => [String(r._id), r]));

            const items = raceRounds.map(rr => {
                const tournament = rr.tournamentId ? tournamentMap.get(String(rr.tournamentId)) : null;
                const ownerReg = ownerRegMap.get(String(rr._id)) ?? null;
                const rule = rr.eligibilityRuleId ? ruleMap.get(String(rr.eligibilityRuleId)) : null;

                return {
                    id: rr._id,
                    name: rr.roundName,
                    date: rr.raceDate,
                    location: rr.location ?? null,
                    status: rr.status,
                    isLive: rr.status === 'running',
                    muxPlaybackId: rr.muxPlaybackId ?? null,
                    tournament: tournament ? { id: tournament._id, name: tournament.tournamentName } : null,
                    prizes: {
                        first: CurrencyConverter.convertToVnd(rr.firstPlacePrize ?? 0, rr.currencyType),
                        second: CurrencyConverter.convertToVnd(rr.secondPlacePrize ?? 0, rr.currencyType),
                        third: CurrencyConverter.convertToVnd(rr.thirdPlacePrize ?? 0, rr.currencyType),
                    },
                    maxParticipants: rr.maxParticipants ?? null,
                    currentParticipants: countMap.get(String(rr._id)) ?? 0,
                    entryFee: rr.requireEntranceFees ? rr.minimalRidingFees ?? 0 : 0,
                    minimalRidingFees: rr.minimalRidingFees ?? 0,
                    raceType: rule?.raceType ?? null,
                    eligibility: rule
                        ? { requiredBreed: rule.requiredBreed ?? null, requiredGender: rule.requiredGender ?? null, minAge: rule.minAge ?? null, maxAge: rule.maxAge ?? null }
                        : null,
                    ownerRegistration: ownerReg
                        ? { status: ownerReg.registrationStatus, registrationId: ownerReg._id }
                        : null,
                };
            });

            return {
                code: 200,
                data: { items, pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit } },
                msg: 'Available races retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Get jockey invitations sent by this horse owner (paginated)
    async getJockeyInvitations(ownerId, page = 1, limit = 10, search = null) {
        try {
            if (!ownerId) return { code: 400, msg: 'ownerId is required' };

            // Find all registration IDs that belong to this owner
            const regs = await Registration.find({ horseOwnerId: ownerId }).select('_id').lean();
            const regIds = regs.map(r => r._id);

            const invFilter = { registrationId: { $in: regIds } };

            if (search) {
                const [matchingUsers, matchingHorses] = await Promise.all([
                    User.find({ fullName: { $regex: search, $options: 'i' } }, '_id').lean(),
                    Horse.find({ horseName: { $regex: search, $options: 'i' } }, '_id').lean(),
                ]);
                invFilter.$or = [
                    { jockeyId: { $in: matchingUsers.map(u => u._id) } },
                    { horseId: { $in: matchingHorses.map(h => h._id) } },
                ];
            }

            const skip = (page - 1) * limit;
            const [total, invitations] = await Promise.all([
                Invitation.countDocuments(invFilter),
                Invitation.find(invFilter)
                    .populate({ path: 'jockeyId', model: 'User', select: 'fullName image' })
                    .populate('horseId', 'horseName')
                    .populate({
                        path: 'registrationId',
                        populate: { path: 'raceRoundId', select: 'roundName raceDate location' },
                    })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
            ]);

            const mapped = invitations.map(inv => ({
                _id: inv._id,
                jockey: inv.jockeyId
                    ? { _id: inv.jockeyId._id, fullName: inv.jockeyId.fullName ?? null, image: inv.jockeyId.image ?? null }
                    : null,
                horse: inv.horseId ? { horseName: inv.horseId.horseName } : null,
                raceRound: inv.registrationId?.raceRoundId
                    ? {
                        roundName: inv.registrationId.raceRoundId.roundName,
                        raceDate: inv.registrationId.raceRoundId.raceDate,
                        location: inv.registrationId.raceRoundId.location,
                    }
                    : null,
                status: inv.invitationStatus,
                isBackup: inv.isBackup,
                percentagePayout: inv.percentagePayout,
                bookingFees: inv.bookingFees ?? 0,
                createdAt: inv.createdAt,
            }));

            return {
                code: 200,
                data: {
                    invitations: mapped,
                    pagination: { total, totalPages: Math.ceil(total / limit), page, limit },
                },
                msg: 'Jockey invitations retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getRaceDetail(ownerId, raceRoundId) {
        try {
            const owner = await HorseOwnerRepository.findByOwnerId(ownerId);
            if (!owner) return { code: 404, msg: 'Horse owner not found' };

            const raceRound = await RaceRound.findById(raceRoundId).populate('tournamentId').lean();
            if (!raceRound) return { code: 404, msg: 'Race round not found' };

            let raceType = null;
            if (raceRound.eligibilityRuleId) {
                const rule = await RaceEligibilityRule.findById(raceRound.eligibilityRuleId).lean();
                if (rule) raceType = rule;
            }
            raceRound.RaceType = raceType;
            raceRound.firstPlacePrize = CurrencyConverter.convertToVnd(raceRound.firstPlacePrize ?? 0, raceRound.currencyType);
            raceRound.secondPlacePrize = CurrencyConverter.convertToVnd(raceRound.secondPlacePrize ?? 0, raceRound.currencyType);
            raceRound.thirdPlacePrize = CurrencyConverter.convertToVnd(raceRound.thirdPlacePrize ?? 0, raceRound.currencyType);

            // Competition roster + slot-fill indicator — "confirmed" means the
            // owner has accepted (registrationStatus 'approved'); this is a
            // pre-race-day roster view, not the referee's race-day verification.
            const approvedRegs = await Registration.find({ raceRoundId, registrationStatus: 'approved' }).lean();
            const confirmedCount = approvedRegs.length;
            const otherRegs = approvedRegs.filter(r => String(r.horseOwnerId) !== String(ownerId));

            const [otherHorses, otherOwners, otherMainInvitations] = await Promise.all([
                otherRegs.length
                    ? Horse.find({ _id: { $in: otherRegs.map(r => r.horseId) } }).lean()
                    : Promise.resolve([]),
                otherRegs.length
                    ? User.find({ _id: { $in: otherRegs.map(r => r.horseOwnerId) } }, 'fullName').lean()
                    : Promise.resolve([]),
                otherRegs.length
                    ? Invitation.find({ registrationId: { $in: otherRegs.map(r => r._id) }, isBackup: false })
                        .populate({ path: 'jockeyId', model: 'User', select: 'fullName' })
                        .lean()
                    : Promise.resolve([]),
            ]);

            const otherHorseMap = new Map(otherHorses.map(h => [h._id.toString(), h]));
            const otherOwnerMap = new Map(otherOwners.map(u => [u._id.toString(), u]));
            const otherInvitationByReg = new Map(otherMainInvitations.map(inv => [inv.registrationId.toString(), inv]));

            const competitors = otherRegs.map(reg => {
                const inv = otherInvitationByReg.get(reg._id.toString());
                return {
                    registrationId: reg._id,
                    horseName: otherHorseMap.get(reg.horseId?.toString())?.horseName ?? null,
                    ownerName: otherOwnerMap.get(reg.horseOwnerId?.toString())?.fullName ?? null,
                    jockeyName: inv?.jockeyId?.fullName ?? null,
                    laneNumber: reg.laneNumber ?? null,
                };
            });

            const competition = {
                maxParticipants: raceRound.maxParticipants ?? null,
                confirmedCount,
                openSlots: Math.max(0, (raceRound.maxParticipants ?? 0) - confirmedCount),
                competitors,
            };

            const registration = await Registration.findOne({ raceRoundId, horseOwnerId: ownerId }).lean();
            if (!registration) {
                return { code: 200, data: { raceRound, registration: null, competition }, msg: 'Race detail retrieved successfully' };
            }

            const [horse, invitations, raceResult, violations] = await Promise.all([
                Horse.findById(registration.horseId).lean(),
                Invitation.find({ registrationId: registration._id })
                    .populate({ path: 'jockeyId', model: 'User', select: 'fullName image' })
                    .lean(),
                RaceResult.findOne({ registrationId: registration._id }).lean(),
                Violation.find({
                    raceRoundId,
                    $or: [
                        { registrationId: registration._id },
                        { registrationId: null },
                        { registrationId: { $exists: false } },
                    ],
                }).populate('violationTypeId', 'violationName severity').lean(),
            ]);

            if (raceResult) {
                raceResult.prizeMoney = CurrencyConverter.convertToVnd(raceResult.prizeMoney ?? 0, raceRound.currencyType);
            }

            const selectedInvitation = registration.jockeyInRaceId
                ? invitations.find(inv => String(inv._id) === String(registration.jockeyInRaceId))
                : null;
            const selectedJockey = selectedInvitation?.jockeyId ?? null;

            const enrichedInvitations = invitations.map(inv => ({
                _id: inv._id,
                invitationStatus: inv.invitationStatus,
                isBackup: inv.isBackup,
                percentagePayout: inv.percentagePayout,
                jockeyConfirmation: inv.jockeyConfirmation,
                ownerConfirmation: inv.ownerConfirmation,
                createdAt: inv.createdAt,
                jockey: inv.jockeyId ?? null,
            }));

            return {
                code: 200,
                data: {
                    raceRound,
                    registration: {
                        ...registration,
                        horse: horse ?? null,
                        selectedJockey,
                        invitations: enrichedInvitations,
                        raceResult: raceResult ?? null,
                        violations: violations ?? [],
                    },
                    competition,
                },
                msg: 'Race detail retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Lightweight, poll-friendly status check — no populate, minimal projection.
    async getRaceRoundStatus(ownerId, raceRoundId) {
        try {
            const registration = await Registration.findOne({ raceRoundId, horseOwnerId: ownerId }).lean();
            if (!registration) {
                return { code: 403, msg: 'You are not associated with this race round.' };
            }

            const raceRound = await RaceRound.findById(raceRoundId, 'status roundName raceDate muxPlaybackId').lean();
            if (!raceRound) {
                return { code: 404, msg: 'Race round not found.' };
            }

            return {
                code: 200,
                data: {
                    raceRoundId: raceRound._id,
                    status: raceRound.status,
                    registrationStatus: registration.registrationStatus,
                    isLive: raceRound.status === 'running',
                    hasResults: ['awaitingConfirmation', 'completed'].includes(raceRound.status),
                },
                msg: 'Race round status retrieved.',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
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
            const owner = await HorseOwner.findById(ownerId);
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
            const owner = await HorseOwner.findById(ownerId);
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

    // Get a single jockey's profile: stats + race history + violations (for horse owner view)
    async getJockeyProfile(jockeyId) {
        try {
            if (!jockeyId) return { code: 400, msg: 'jockeyId is required' };

            const [jockeyDoc, user] = await Promise.all([
                Jockey.findById(jockeyId).lean(),
                User.findById(jockeyId).select('fullName image dateOfBirth address phoneNumber').lean(),
            ]);
            if (!jockeyDoc || !user) return { code: 404, msg: 'Jockey not found' };

            // Accepted + no-show invitations → registration IDs this jockey committed to
            const invitations = await Invitation.find({
                jockeyId,
                invitationStatus: { $in: ['accepted', 'didNotAttend'] },
            }).lean();
            const regIds = invitations.map(inv => inv.registrationId).filter(Boolean);
            const invByRegId = new Map(invitations.map(inv => [String(inv.registrationId), inv]));

            const [registrations, results, violations] = await Promise.all([
                regIds.length > 0
                    ? Registration.find({ _id: { $in: regIds } })
                        .populate('horseId', 'horseName')
                        .lean()
                    : [],
                regIds.length > 0
                    ? RaceResult.find({ registrationId: { $in: regIds } }).lean()
                    : [],
                regIds.length > 0
                    ? Violation.find({ registrationId: { $in: regIds } })
                        .populate('violationTypeId', 'violationName category severity defaultPenalty')
                        .lean()
                    : [],
            ]);

            const raceRoundIds = registrations.map(r => r.raceRoundId).filter(Boolean);
            const raceRounds = raceRoundIds.length > 0
                ? await RaceRound.find({ _id: { $in: raceRoundIds } }).lean()
                : [];

            const raceRoundMap = new Map(raceRounds.map(rr => [String(rr._id), rr]));
            const resultByRegId = new Map(results.map(r => [String(r.registrationId), r]));

            const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
            const recentRaces = registrations.map(reg => {
                const result = resultByRegId.get(String(reg._id));
                const raceRound = raceRoundMap.get(String(reg.raceRoundId));
                const pos = result?.finishPosition;
                const inv = invByRegId.get(String(reg._id));
                return {
                    race: raceRound?.roundName ?? 'Unknown Race',
                    position: pos != null ? (ordinals[pos - 1] ?? `${pos}th`) : 'DNF',
                    horse: reg.horseId?.horseName ?? 'Unknown',
                    date: raceRound?.raceDate
                        ? new Date(raceRound.raceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'N/A',
                    attendance: inv?.invitationStatus === 'didNotAttend' ? 'no_show' : inv?.isBackup ? 'backup' : 'main',
                    bookingFees: inv?.bookingFees ?? 0,
                };
            }).sort((a, b) => 0); // preserve DB order (most recent first via sort below)

            // Stats (wins/totalRaces/winRate) only count races the jockey actually rode
            // AND that have been officially scored (a recorded finishPosition) — a
            // no-show never raced, and an accepted-but-not-yet-run/confirmed race has
            // no result yet, so neither should inflate "races completed". Both stay in
            // recentRaces for history (shown as 'DNF') but are excluded from these stats.
            const riddenRegIds = new Set(
                registrations.filter(reg => invByRegId.get(String(reg._id))?.invitationStatus !== 'didNotAttend')
                    .map(reg => String(reg._id))
            );
            const officialResults = results.filter(r => r.finishPosition != null && riddenRegIds.has(String(r.registrationId)));
            const completedRegIds = new Set(officialResults.map(r => String(r.registrationId)));
            const wins = officialResults.filter(r => r.finishPosition === 1).length;

            // Actual paid-out amount for this jockey (bookingFee + percentagePayout%
            // of prize, VND-converted) — NOT the race's raw prizeMoney, which ignores
            // the jockey's payout share/currency conversion entirely.
            const mongoose = require('mongoose');
            const totalPrize = (await Transaction.aggregate([
                { $match: { payeeId: new mongoose.Types.ObjectId(String(jockeyId)), payeeRole: 'jockey', paymentType: 'jockey_payout', paymentStatus: 'paid' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]))[0]?.total || 0;

            // Leaderboard position by win rate (matchesRaced/totalWins counters) —
            // distinct from `stats.winRate` below, which is audited from this
            // jockey's own actual RaceResult/Invitation records (excludes no-shows).
            const { rank, totalJockeys } = await JockeyRepository.getWinRateRank(jockeyId);

            return {
                code: 200,
                data: {
                    jockey: { ...jockeyDoc, ...user, rank, totalJockeys },
                    stats: {
                        totalRaces: completedRegIds.size,
                        wins,
                        winRate: completedRegIds.size > 0 ? Math.round((wins / completedRegIds.size) * 100) : 0,
                        totalPrize,
                    },
                    recentRaces,
                    violations: violations.map(v => ({
                        _id: v._id,
                        raceRound: raceRoundMap.get(String(v.raceRoundId)) ?? { _id: v.raceRoundId },
                        violationType: v.violationTypeId ?? null,
                        description: v.description,
                        severity: v.severity,
                        actualPenalty: v.actualPenalty,
                        stewardAction: v.stewardAction,
                        violationStatus: v.violationStatus,
                    })),
                },
                msg: 'Jockey profile retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Financial summary: wins, losses, prize totals, jockey payouts
    async getFinancialSummary(ownerId) {
        try {
            if (!ownerId) return { code: 400, msg: 'ownerId is required' };

            const registrations = await Registration.find({ horseOwnerId: ownerId }).lean();
            const regIds = registrations.map(r => r._id);

            const [results, invitations, violations, transactions] = await Promise.all([
                regIds.length > 0 ? RaceResult.find({ registrationId: { $in: regIds } }).lean() : [],
                regIds.length > 0
                    ? Invitation.find({ registrationId: { $in: regIds }, invitationStatus: 'accepted' }).lean()
                    : [],
                regIds.length > 0 ? Violation.find({ registrationId: { $in: regIds } }).lean() : [],
                Transaction.find({ userId: ownerId, status: 'completed' }).lean(),
            ]);

            // prizeMoney is stored in each race round's own currency — convert to VND
            // (the single currency this page displays in) before summing across races.
            const raceRoundIds = [...new Set(registrations.map(r => String(r.raceRoundId)))];
            const raceRounds = raceRoundIds.length
                ? await RaceRound.find({ _id: { $in: raceRoundIds } }, 'currencyType').lean()
                : [];
            const currencyByRoundId = new Map(raceRounds.map(rr => [String(rr._id), rr.currencyType || 'VND']));
            const regById = new Map(registrations.map(r => [String(r._id), r]));
            const currencyForReg = (regId) => {
                const reg = regById.get(String(regId));
                return reg ? currencyByRoundId.get(String(reg.raceRoundId)) : 'VND';
            };

            const officialResults = results.filter(r => r.finishPosition != null && r.resultStatus === 'official');
            const wins = officialResults.filter(r => r.finishPosition === 1).length;
            const losses = officialResults.filter(r => r.finishPosition !== 1).length;
            const totalPrize = officialResults.reduce((sum, r) =>
                sum + CurrencyConverter.convertToVnd(r.prizeMoney || 0, currencyForReg(r.registrationId)), 0);

            const resultByRegId = new Map(results.map(r => [String(r.registrationId), r]));
            let totalJockeyPayout = 0;
            for (const inv of invitations) {
                const result = resultByRegId.get(String(inv.registrationId));
                if (result && inv.percentagePayout) {
                    const shareOriginal = (inv.percentagePayout / 100) * (result.prizeMoney || 0);
                    totalJockeyPayout += CurrencyConverter.convertToVnd(shareOriginal, currencyForReg(inv.registrationId));
                }
            }
            totalJockeyPayout = Math.round(totalJockeyPayout);

            const balance = transactions.reduce((sum, t) => {
                if (t.transactionType === 'deposit' || t.transactionType === 'reward' || t.transactionType === 'refund')
                    return sum + t.amount;
                if (t.transactionType === 'withdrawal') return sum - t.amount;
                return sum;
            }, 0);

            const horseOwner = await HorseOwnerRepository.findById(ownerId);

            return {
                code: 200,
                data: {
                    totalRaces: officialResults.length,
                    totalWins: wins,
                    totalLosses: losses,
                    totalPrize,
                    totalJockeyPayout,
                    netProfit: totalPrize - totalJockeyPayout,
                    totalViolations: violations.length,
                    balance,
                    wallet: horseOwner?.wallet || 0,
                },
                msg: 'Financial summary retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Paginated race activity for financials table
    async getFinancialRaceResults(ownerId, page = 1, limit = 10, search = null) {
        try {
            if (!ownerId) return { code: 400, msg: 'ownerId is required' };

            const allRegs = await Registration.find({ horseOwnerId: ownerId })
                .populate('horseId', 'horseName')
                .populate('raceRoundId', 'roundName raceDate location currencyType')
                .sort({ createdAt: -1 })
                .lean();

            const filteredRegs = search
                ? allRegs.filter(r => {
                    const sl = search.toLowerCase();
                    return (r.raceRoundId?.roundName ?? '').toLowerCase().includes(sl)
                        || (r.horseId?.horseName ?? '').toLowerCase().includes(sl);
                })
                : allRegs;

            const totalItems = filteredRegs.length;
            const skip = (page - 1) * limit;
            const pagedRegs = filteredRegs.slice(skip, skip + limit);
            const pagedRegIds = pagedRegs.map(r => r._id);

            const [results, invitations, violations] = await Promise.all([
                pagedRegIds.length > 0 ? RaceResult.find({ registrationId: { $in: pagedRegIds } }).lean() : [],
                pagedRegIds.length > 0
                    ? Invitation.find({ registrationId: { $in: pagedRegIds }, invitationStatus: 'accepted' })
                        .populate({ path: 'jockeyId', model: 'User', select: 'fullName' })
                        .lean()
                    : [],
                pagedRegIds.length > 0
                    ? Violation.find({ registrationId: { $in: pagedRegIds } })
                        .populate('violationTypeId', 'violationName category severity defaultPenalty')
                        .lean()
                    : [],
            ]);

            const resultByRegId = new Map(results.map(r => [String(r.registrationId), r]));
            const invByRegId = new Map(invitations.map(inv => [String(inv.registrationId), inv]));
            const violsByRegId = {};
            for (const v of violations) {
                const key = String(v.registrationId);
                if (!violsByRegId[key]) violsByRegId[key] = [];
                violsByRegId[key].push(v);
            }

            const items = pagedRegs.map(reg => {
                const result = resultByRegId.get(String(reg._id));
                const inv = invByRegId.get(String(reg._id));
                const regViolations = violsByRegId[String(reg._id)] ?? [];
                const currency = reg.raceRoundId?.currencyType || 'VND';
                const prizeMoney = CurrencyConverter.convertToVnd(result?.prizeMoney ?? 0, currency);
                const jockeyPayout = inv?.percentagePayout
                    ? CurrencyConverter.convertToVnd((inv.percentagePayout / 100) * (result?.prizeMoney ?? 0), currency)
                    : 0;

                return {
                    registrationId: reg._id,
                    race: {
                        id: reg.raceRoundId?._id ?? null,
                        name: reg.raceRoundId?.roundName ?? 'Unknown',
                        date: reg.raceRoundId?.raceDate ?? null,
                        location: reg.raceRoundId?.location ?? null,
                    },
                    horse: { id: reg.horseId?._id ?? null, name: reg.horseId?.horseName ?? 'Unknown' },
                    jockey: inv
                        ? { id: inv.jockeyId?._id ?? null, name: inv.jockeyId?.fullName ?? 'Unknown', percentagePayout: inv.percentagePayout, payout: jockeyPayout }
                        : null,
                    finishPosition: result?.finishPosition ?? null,
                    prizeMoney,
                    jockeyPayout,
                    netOutcome: prizeMoney - jockeyPayout,
                    resultStatus: result?.resultStatus ?? null,
                    registrationStatus: reg.registrationStatus,
                    violations: regViolations.map(v => ({
                        type: v.violationTypeId?.violationName ?? 'Unknown',
                        category: v.violationTypeId?.category ?? null,
                        severity: v.severity,
                        penalty: v.actualPenalty,
                        stewardAction: v.stewardAction,
                        status: v.violationStatus,
                    })),
                };
            });

            return {
                code: 200,
                data: { items, pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit } },
                msg: 'Financial race results retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getFinancialEarningsSeries(ownerId, groupBy = 'day') {
        try {
            if (!ownerId) return { code: 400, msg: 'ownerId is required' };

            let dateFormat = '%Y-%m-%d';
            
            if (groupBy === 'week') {
                dateFormat = '%Y-%U';
            } else if (groupBy === 'month') {
                dateFormat = '%Y-%m';
            } else if (groupBy === 'year') {
                dateFormat = '%Y';
            }

            const mongoose = require('mongoose');
            const pipeline = [
                { $match: { horseOwnerId: new mongoose.Types.ObjectId(ownerId) } },
                { $lookup: { from: 'raceresults', localField: '_id', foreignField: 'registrationId', as: 'result' } },
                { $unwind: { path: '$result', preserveNullAndEmptyArrays: false } },
                { $match: { 'result.resultStatus': 'official', 'result.prizeMoney': { $gt: 0 } } },
                { $lookup: { from: 'racerounds', localField: 'raceRoundId', foreignField: '_id', as: 'raceRound' } },
                { $unwind: { path: '$raceRound', preserveNullAndEmptyArrays: false } },
                {
                    $group: {
                        _id: { $dateToString: { format: dateFormat, date: '$raceRound.raceDate' } },
                        grossPrize: { $sum: '$result.prizeMoney' }
                    }
                },
                { $sort: { _id: 1 } }
            ];

            const rawSeries = await Registration.aggregate(pipeline);

            let result = rawSeries.map(row => ({
                date: row._id,
                grossPrize: parseFloat(row.grossPrize.toFixed(2))
            }));

            const getPastPeriods = (type) => {
                const pad = n => n.toString().padStart(2, '0');
                const periods = [];
                const count = type === 'year' ? 3 : type === 'month' ? 6 : type === 'week' ? 4 : 7;
                for (let i = count - 1; i >= 0; i--) {
                    const d = new Date();
                    if (type === 'year') {
                        d.setFullYear(d.getFullYear() - i);
                        periods.push(`${d.getFullYear()}`);
                    } else if (type === 'month') {
                        d.setMonth(d.getMonth() - i);
                        periods.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
                    } else if (type === 'week') {
                        d.setDate(d.getDate() - (i * 7));
                        const startOfYear = new Date(d.getFullYear(), 0, 1);
                        const days = Math.floor((d - startOfYear) / (24 * 60 * 60 * 1000));
                        const weekNum = Math.floor((days + startOfYear.getDay()) / 7);
                        periods.push(`${d.getFullYear()}-${pad(weekNum)}`);
                    } else {
                        d.setDate(d.getDate() - i);
                        periods.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
                    }
                }
                return periods;
            };

            const dbMap = new Map(result.map(r => [r.date, r]));
            for (const date of getPastPeriods(groupBy)) {
                if (!dbMap.has(date)) {
                    result.push({ date, grossPrize: 0 });
                    dbMap.set(date, true);
                }
            }
            result.sort((a, b) => a.date.localeCompare(b.date));

            return { code: 200, data: result, msg: 'Earnings series retrieved successfully' };
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


module.exports = new HorseOwnerService();
