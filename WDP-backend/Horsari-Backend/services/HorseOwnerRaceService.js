const HorseOwnerRepository = require('../repositories/HorseOwnerRepository');
const Registration = require('../entities/Registration');
const RaceRound = require('../entities/RaceRound');
const Tournament = require('../entities/Tournament');
const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
const Invitation = require('../entities/Invitation');
const Horse = require('../entities/Horse');
const RaceResult = require('../entities/RaceResult');
const Violation = require('../entities/Violation');
const User = require('../entities/User');
const CurrencyConverter = require('./CurrencyConverter');

class RaceService {
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
            // owner has accepted (registrationStatus 'accepted'); this is a
            // pre-race-day roster view, not the referee's race-day verification.
            const acceptedRegs = await Registration.find({ raceRoundId, registrationStatus: 'accepted' }).lean();
            const confirmedCount = acceptedRegs.length;
            const otherRegs = acceptedRegs.filter(r => String(r.horseOwnerId) !== String(ownerId));

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
                    { $match: { raceRoundId: { $in: raceIds }, registrationStatus: { $in: ['accepted', 'verified'] } } },
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
                    entryFee: rr.requireEntranceFees ? rr.baseFee ?? 0 : 0,
                    baseFee: rr.baseFee ?? 0,
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
}

module.exports = new RaceService();
