const RaceRound = require('../entities/RaceRound');
const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
const RaceDateUtil = require('../utils/RaceDateUtil');
const RaceReferee = require('../entities/RaceReferee');
const Referee = require('../entities/Referee');
const Jockey = require('../entities/Jockey');
const Horse = require('../entities/Horse');
const HorseOwner = require('../entities/HorseOwner');
const Tournament = require('../entities/Tournament');
const Registration = require('../entities/Registration');
const Invitation = require('../entities/Invitation');
const RaceResult = require('../entities/RaceResult');
const Prediction = require('../entities/Prediction');
const PredictionMethod = require('../entities/PredictionMethod');
const User = require('../entities/User');
const JockeyRepository = require('../repositories/JockeyRepository');
const SimulationService = require('./SimulationService');
const MuxService = require('./MuxService');
const PaymentService = require('./PaymentService');
const NotificationService = require('./NotificationService');
const CurrencyConverter = require('./CurrencyConverter');
const PayoutService = require('./PayoutService');

class RaceRoundService {
    // Get Race Rounds
    //
    // `date` (a "YYYY-MM-DD" Vietnam-calendar-day key) bounds the query to that single day
    // and skips skip/limit entirely — used by the Admin schedule's Timeline view, which
    // fetches one day at a time (see getRaceRoundDates below for the day list it navigates)
    // rather than a page/limit-based slice. A single day's races are inherently a small,
    // bounded set, so no further paging is needed once scoped this way.
    async getRaceRounds(tournament_id = null, raceRound_id = null, page = 1, limit = 10, status = null, search = null, sortBy = 'raceDate', order = 'desc', raceType = null, date = null) {
        try {
            const skip = (page - 1) * limit;
            let query = {};
            if (tournament_id) query.tournamentId = tournament_id;
            if (raceRound_id) query._id = raceRound_id;
            if (status) query.status = status;
            if (search) query.roundName = { $regex: search, $options: 'i' };
            if (raceType) {
                const ruleIds = await RaceEligibilityRule.find({ raceType }).distinct('_id');
                query.eligibilityRuleId = { $in: ruleIds };
            }
            if (date) {
                const { start, end } = RaceDateUtil.getVietnamDayRange(date);
                query.raceDate = { $gte: start, $lte: end };
            }

            const sortObj = { [sortBy]: order === 'asc' ? 1 : -1 };

            let raceRoundQuery = RaceRound.find(query).sort(sortObj);
            if (!date) {
                raceRoundQuery = raceRoundQuery.skip(skip).limit(limit);
            }

            const [raceRounds, totalItems] = await Promise.all([
                raceRoundQuery.lean(),
                RaceRound.countDocuments(query),
            ]);

            const items = await Promise.all(raceRounds.map(async raceRound => {
                let raceType = raceRound.raceType || null;
                if (!raceType && raceRound.eligibilityRuleId) {
                    const rule = await RaceEligibilityRule.findById(raceRound.eligibilityRuleId).lean();
                    if (rule && rule.raceType) raceType = rule.raceType;
                }
                return { ...raceRound, RaceType: raceType };
            }));

            return {
                code: 200,
                data: {
                    items,
                    pagination: date
                        ? { totalItems, totalPages: 1, currentPage: 1, limit: totalItems }
                        : { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit },
                },
                msg: 'Race rounds retrieved successfully',
            };
        } catch (error) {
            console.error('Error fetching race rounds:', error);
            return { code: 500, msg: error.message };
        }
    }

    // Distinct calendar days (Vietnam-anchored) that have at least one race round matching
    // the given filters — the Admin schedule's Timeline view uses this list as its actual
    // "pagination": each entry is a fetchable "page" via getRaceRounds's `date` param, rather
    // than paging through a row-offset the way the Table view does.
    async getRaceRoundDates(tournament_id = null, status = null, raceType = null) {
        try {
            let query = {};
            if (tournament_id) query.tournamentId = tournament_id;
            if (status) query.status = status;
            if (raceType) {
                const ruleIds = await RaceEligibilityRule.find({ raceType }).distinct('_id');
                query.eligibilityRuleId = { $in: ruleIds };
            }

            const raceRounds = await RaceRound.find(query, 'raceDate').lean();
            const dayKeys = [...new Set(raceRounds.map(rr => RaceDateUtil.calendarDayKey(rr.raceDate)))].sort();

            return { code: 200, data: { dates: dayKeys }, msg: 'Race round dates retrieved successfully' };
        } catch (error) {
            console.error('Error fetching race round dates:', error);
            return { code: 500, msg: error.message };
        }
    }

    // Get distinct race types (sourced from RaceEligibilityRule — RaceRound has no
    // raceType field of its own, see getRaceRounds above), for filter dropdowns.
    // isActive: true/false narrows to active/inactive rules only; omitted (null) returns both.
    async getDistinctRaceTypes(isActive = null) {
        try {
            const query = { raceType: { $ne: null } };
            if (isActive !== null) query.isActive = isActive;
            const raceTypes = await RaceEligibilityRule.distinct('raceType', query);
            return { code: 200, data: raceTypes.sort(), msg: 'Race types retrieved successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Get Race Round Detail
    async getRaceRoundDetail(raceRound_id) {
        try {
            const raceRound = await RaceRound.findById(raceRound_id).lean();
            if (!raceRound) {
                return { code: 404, msg: 'Race round not found' };
            }

            let raceType = raceRound.raceType || null;
            if (!raceType && raceRound.eligibilityRuleId) {
                const rule = await RaceEligibilityRule.findById(raceRound.eligibilityRuleId).lean();
                if (rule && rule.raceType) raceType = rule.raceType;
            }

            const rrObj = {
                ...raceRound,
                RaceType: raceType,
                Referee: [],
                Registration: []
            };

            // Payment-verification rows for this race round (referee_fee, race_prize,
            // jockey_payout) — only exist once confirmRaceResult has run; absent before
            // that, which is the correct "no payment yet" state, not an error.
            const Transaction = require('../entities/Transaction');
            const payments = await Transaction.find({ raceRoundId: raceRound._id, paymentType: { $ne: null } }).lean();
            const paymentBySource = new Map(payments.map(p => [`${p.sourceType}:${p.sourceId}`, p]));

            const raceReferees = await RaceReferee.find({ raceRoundId: raceRound._id }).lean();
            rrObj.Referee = await Promise.all(
                raceReferees.map(async (rr) => {
                    const refereeUser = rr.refereeId
                        ? await User.findById(rr.refereeId, 'fullName').lean()
                        : null;
                    return {
                        refereeId: rr.refereeId,
                        fullName: refereeUser?.fullName ?? null,
                        assignmentStatus: rr.status,
                        fee: rr.fee,
                        payment: paymentBySource.get(`RaceReferee:${rr._id}`) || null,
                    };
                })
            );

            const registrations = await Registration.find({ raceRoundId: raceRound._id }).lean();

            for (const reg of registrations) {
                const predictions = await Prediction.find({ registrationId: reg._id }).lean();
                const sum_prediction = predictions.reduce((sum, p) => sum + (p.rewardPoints || 0), 0);
                const ownerUser = reg.horseOwnerId
                    ? await User.findById(reg.horseOwnerId, 'fullName').lean()
                    : null;

                const invitationFilter = { registrationId: reg._id };
                if (['completed', 'running', 'awaitingConfirmation'].includes(raceRound.status) && reg.jockeyInRaceId) {
                    invitationFilter._id = reg.jockeyInRaceId;
                } else {
                    invitationFilter.isBackup = false;
                    invitationFilter.invitationStatus = { $nin: ['declined', 'cancelled'] };
                }

                const invitation = await Invitation.findOne(invitationFilter)
                    .sort({ createdAt: -1 })
                    .populate('horseId')
                    .populate('jockeyId')
                    .lean();

                if (invitation && invitation.jockeyId && invitation.jockeyId._id) {
                    const jockeyUser = await User.findById(invitation.jockeyId._id).select('fullName').lean();
                    if (jockeyUser) {
                        invitation.jockeyId._id = jockeyUser;
                    }
                }

                const raceResult = await RaceResult.findOne({ registrationId: reg._id }).lean();

                rrObj.Registration.push({
                    ...reg,
                    sum_prediction,
                    Horse: invitation ? invitation.horseId : null,
                    Jockey: invitation ? invitation.jockeyId : null,
                    isJockeyInRace: !!reg.jockeyInRaceId,
                    Owner: ownerUser,
                    RaceResult: raceResult || null,
                    prizePayment: raceResult ? (paymentBySource.get(`RaceResult:${raceResult._id}`) || null) : null,
                    jockeyPayment: invitation ? (paymentBySource.get(`Invitation:${invitation._id}`) || null) : null,
                });
            }

            // ── Prediction pools (grouped by method type) ─────────────────────────
            const [winMethod, rankMethod] = await Promise.all([
                PredictionMethod.findOne({ methodType: 'race_winner', isActive: true }).select('_id').lean(),
                PredictionMethod.findOne({ methodType: 'race_rank', isActive: true }).select('_id').lean(),
            ]);

            const methodIdToType = {};
            const poolMethodIds = [];
            if (winMethod) { poolMethodIds.push(winMethod._id); methodIdToType[winMethod._id.toString()] = 'race_winner'; }
            if (rankMethod) { poolMethodIds.push(rankMethod._id); methodIdToType[rankMethod._id.toString()] = 'race_rank'; }

            // registrationId → horseName, built from the Registration array already assembled
            const regHorseMap = {};
            for (const entry of rrObj.Registration) {
                if (entry.Horse) regHorseMap[entry._id.toString()] = entry.Horse.horseName || null;
            }

            const allPreds = poolMethodIds.length
                ? await Prediction.find({
                    registrationId: { $in: registrations.map(r => r._id) },
                    predictionMethodId: { $in: poolMethodIds },
                }).lean()
                : [];

            // Group by methodType string
            const predsByType = {};
            for (const p of allPreds) {
                const mt = methodIdToType[p.predictionMethodId.toString()];
                if (!mt) continue;
                if (!predsByType[mt]) predsByType[mt] = [];
                predsByType[mt].push(p);
            }

            const predictionPools = [];
            let totalHouseEarning = 0;

            for (const methodType of ['race_winner', 'race_rank']) {
                const preds = predsByType[methodType] || [];
                const T = PayoutService.getRaceTakeoutRate(raceRound, methodType);

                if (preds.length === 0) {
                    predictionPools.push({ methodType, poolStatus: 'empty', takeoutRate: T, grossPool: 0, netPool: 0, houseEarning: 0, totalBettors: 0, perHorse: [] });
                    continue;
                }

                const pending = preds.filter(p => p.predictionStatus === 'pending');
                const correct = preds.filter(p => p.predictionStatus === 'correct');
                const incorrect = preds.filter(p => p.predictionStatus === 'incorrect');
                const refunded = preds.filter(p => p.predictionStatus === 'refunded');

                if (pending.length > 0) {
                    // ── Live pool: bets still open ──────────────────────────────────
                    // Same parimutuel formulas PayoutService.distributeRacePayouts uses
                    // to actually settle these predictions once confirmRaceResult runs,
                    // so the admin preview here never drifts from the real payout.
                    const stakeByReg = {};
                    for (const p of pending) {
                        const rid = p.registrationId.toString();
                        stakeByReg[rid] = (stakeByReg[rid] || 0) + (p.rewardPoints || 0);
                    }
                    const P = PayoutService.grossPool(Object.values(stakeByReg));
                    const N = PayoutService.netPool(P, T);
                    const houseEarning = parseFloat((P * T).toFixed(2));
                    totalHouseEarning += houseEarning;

                    predictionPools.push({
                        methodType,
                        poolStatus: 'live',
                        takeoutRate: T,
                        grossPool: P,
                        netPool: parseFloat(N.toFixed(2)),
                        houseEarning,
                        totalBettors: pending.length,
                        perHorse: Object.entries(stakeByReg)
                            .map(([rid, Bi]) => ({
                                registrationId: rid,
                                horseName: regHorseMap[rid] || null,
                                totalStake: Bi,
                                poolShare: P > 0 ? parseFloat((Bi / P * 100).toFixed(2)) : 0,
                                odds: parseFloat(PayoutService.oddsForHorse(N, Bi).toFixed(4)),
                                displayPayout: parseFloat(PayoutService.totalCollect(1000, N, Bi).toFixed(2)),
                            }))
                            .sort((a, b) => b.totalStake - a.totalStake),
                    });
                } else {
                    // ── Settled / refunded pool ─────────────────────────────────────
                    const totalPaidOut = parseFloat(correct.reduce((s, p) => s + (p.rewardPoints || 0), 0).toFixed(2));

                    // race_winner identity: every bettor on the winning horse is correct,
                    // so Σ(correct payouts) = N exactly → P = N/(1-T).
                    // race_rank: bettors on the winning reg may have predicted different ranks,
                    // so some stakes in Bi are from wrong-rank bettors → N cannot be reconstructed.
                    const N_est = methodType === 'race_winner' ? totalPaidOut : null;
                    const P_est = N_est != null ? parseFloat((N_est / (1 - T)).toFixed(2)) : null;
                    const houseEarning = P_est != null ? parseFloat((P_est * T).toFixed(2)) : null;

                    if (houseEarning != null && refunded.length === 0) totalHouseEarning += houseEarning;

                    const allRefunded = refunded.length > 0 && correct.length === 0 && incorrect.length === 0;
                    predictionPools.push({
                        methodType,
                        poolStatus: allRefunded ? 'refunded' : 'settled',
                        takeoutRate: T,
                        grossPool: P_est,
                        netPool: N_est,
                        houseEarning: houseEarning != null ? houseEarning : null,
                        totalPaidOut,
                        totalWinners: correct.length,
                        totalLosers: incorrect.length,
                        totalRefunded: refunded.length,
                        totalBettors: preds.length,
                    });
                }
            }

            rrObj.predictionPools = predictionPools;
            rrObj.trackEarnings = {
                totalHouseEarning: parseFloat(totalHouseEarning.toFixed(2)),
                byPool: predictionPools.reduce((acc, p) => {
                    acc[p.methodType] = p.houseEarning != null ? p.houseEarning : null;
                    return acc;
                }, {}),
            };
            // ─────────────────────────────────────────────────────────────────────

            return { code: 200, data: rrObj, msg: 'Race round detail retrieved successfully' };
        } catch (error) {
            console.error('Error fetching race round detail:', error);
            return { code: 500, msg: error.message };
        }
    }

    // Get all metadata required for creating a race
    async getCreateRaceMetadata() {
        try {
            const [previousRaceTracks, activeTournaments, eligibilityRules, referees, ownersRaw] = await Promise.all([
                // 1. Get unique tracks (locations) and their grounds and addresses
                RaceRound.aggregate([
                    { $match: { location: { $ne: null, $ne: '' } } },
                    { $group: { _id: "$location", location: { $first: "$location" }, raceGround: { $first: "$raceGround" }, address: { $first: "$address" } } },
                    { $project: { _id: 0, location: 1, raceGround: 1, address: 1 } }
                ]),

                // 2. Get active/scheduled tournaments
                Tournament.find({ status: { $in: ['draft', 'scheduled', 'ongoing'] } }).lean(),

                // 3. Get eligibility rules
                RaceEligibilityRule.find({ isActive: true }).lean(),

                // 4. Get referees populated with name
                Referee.find().populate('_id', 'fullName').lean(),

                // 5. Get horse owners populated with name
                HorseOwner.find().populate('_id', 'fullName').lean()
            ]);

            // Enhance owners with their active horses and race results
            const owners = await Promise.all(
                ownersRaw.map(async (owner) => {
                    const activeHorsesRaw = await Horse.find({ ownerId: owner._id, status: 'active' }).lean();

                    const horses = await Promise.all(
                        activeHorsesRaw.map(async (horse) => {
                            // Find all invitations where this horse participated
                            const invitations = await Invitation.find({ horseId: horse._id, registrationId: { $ne: null } }).lean();
                            const registrationIds = invitations.map(inv => inv.registrationId);

                            // Find all race results for those registrations
                            const raceResults = await RaceResult.find({ registrationId: { $in: registrationIds } }).lean();

                            return {
                                ...horse,
                                raceResults
                            };
                        })
                    );

                    return {
                        _id: owner._id,
                        user: owner._id, // populated fullName object is here
                        horses
                    };
                })
            );

            return {
                code: 200,
                data: {
                    previousRaceTracks,
                    tournaments: activeTournaments,
                    eligibilityRules,
                    referees,
                    owners
                },
                msg: 'Create race metadata retrieved successfully'
            };
        } catch (error) {
            console.error('Error fetching create race metadata:', error);
            return { code: 500, msg: error.message };
        }
    }

    async setRaceRoundStatus(raceRoundId, newStatus, io, override = false) {
        try {
            const allowed = ['running', 'cancelled'];
            if (!allowed.includes(newStatus)) {
                return { code: 400, msg: `status must be one of: ${allowed.join(', ')}` };
            }

            const raceRound = await RaceRound.findById(raceRoundId).lean();
            if (!raceRound) {
                return { code: 404, msg: 'Race round not found.' };
            }
            if (newStatus === 'running' && !raceRound.muxLiveStreamId) {
                return { code: 422, msg: 'A stream key must be created before starting the race. Use the "Create Stream Key" button first.' };
            }

            if (newStatus === 'running') {
                const gateError = RaceDateUtil.getScheduleGateError(raceRound.raceDate, { requireStartTime: true, override });
                if (gateError) return gateError;
            }

            const updated = await RaceRound.findByIdAndUpdate(raceRoundId, { status: newStatus }, { new: true }).lean();

            if (io) {
                io.emit('race_status_changed', {
                    raceRoundId,
                    status: newStatus,
                    timestamp: new Date(),
                });
            }

            if (newStatus === 'running') {
                // Start horse simulation (stream was already provisioned in prepared state)
                SimulationService.initializeSimulation(raceRoundId, io).catch(err => {
                    console.error('[Sim] Failed to start simulation:', err);
                });
            }

            if (newStatus === 'cancelled') {
                PayoutService.refundRacePredictions(raceRoundId).catch(err =>
                    console.error('[AdminService] refundRacePredictions error:', err.message)
                );
            }

            // Persisted notifications to associated participants
            const [participantRegs, participantRefs] = await Promise.all([
                Registration.find({ raceRoundId }, 'horseOwnerId').lean(),
                RaceReferee.find({ raceRoundId }, 'refereeId').lean(),
            ]);
            const participantRecipients = [
                ...participantRegs.map(r => r.horseOwnerId),
                ...participantRefs.map(r => r.refereeId),
            ];
            NotificationService.notify({
                recipientIds: participantRecipients,
                type: newStatus === 'running' ? 'race_started' : 'race_round_cancelled',
                title: newStatus === 'running' ? 'Race Round Started' : 'Race Round Cancelled',
                message: `Race round "${raceRound.roundName}" is now ${newStatus}.`,
                actionPayload: { entityType: 'RaceRound', entityId: raceRoundId },
            }, io).catch(err => console.error('[setRaceRoundStatus] notify error:', err.message));

            return { code: 200, data: updated, msg: `Race round status updated to "${newStatus}".` };
        } catch (error) {
            console.error('Error setting race round status:', error);
            return { code: 500, msg: error.message };
        }
    }

    // ── Admin quick-assign shortcut (testing/demo convenience) ────────────────────
    // Fills in the setup step (horse + jockey) for registrations that haven't
    // gotten there yet via the normal owner-accepts / owner-hires-jockey /
    // jockey-accepts flow, so the assigned referee's real review
    // (verifyRegistration → finalizeRaceRound) has something to act on.
    // Registrations already "accepted" with an accepted main invitation are left
    // untouched — this only fills gaps, never overwrites legitimate state. It
    // never verifies, prepares, or starts the race itself.
    async quickAssignHorsesAndJockeys(raceRoundId) {
        try {
            const raceRound = await RaceRound.findById(raceRoundId).lean();
            if (!raceRound) return { code: 404, msg: 'Race round not found.' };
            if (raceRound.status !== 'scheduled') {
                return { code: 422, msg: `Race round is "${raceRound.status}" — quick-assign only applies to "scheduled" rounds.` };
            }

            const registrations = await Registration.find({ raceRoundId }).lean();
            if (!registrations.length) {
                return { code: 422, msg: 'Race round has no registrations to resolve.' };
            }

            const rule = raceRound.eligibilityRuleId
                ? await RaceEligibilityRule.findById(raceRound.eligibilityRuleId).lean()
                : null;

            // Mirrors the frontend's checkEligibility (CreateRaceModal.tsx) so an
            // auto-assigned horse is never one the admin's own UI would reject.
            const isHorseEligible = (horse, wins, racesRun) => {
                if (!rule) return true;
                if (horse.status !== 'active' || horse.healthStatus !== 'healthy') return false;
                if (rule.minRacesWon != null && wins < rule.minRacesWon) return false;
                if (rule.minRacesRun != null && racesRun < rule.minRacesRun) return false;
                const age = horse.dateOfBirth ? (new Date().getFullYear() - new Date(horse.dateOfBirth).getFullYear()) : 0;
                if (rule.minAge != null && age < rule.minAge) return false;
                if (rule.maxAge != null && age > rule.maxAge) return false;
                if (rule.requiredGender && rule.requiredGender !== 'both' && rule.requiredGender !== horse.gender) return false;
                if (rule.requiredBreed && rule.requiredBreed !== horse.breed) return false;
                return true;
            };

            const regIds = registrations.map(r => r._id);
            const existingInvitations = await Invitation.find({ registrationId: { $in: regIds } }).lean();
            const acceptedMainByReg = new Map(
                existingInvitations
                    .filter(inv => !inv.isBackup && inv.invitationStatus === 'accepted')
                    .map(inv => [String(inv.registrationId), inv])
            );
            const pendingMainByReg = new Map(
                existingInvitations
                    .filter(inv => !inv.isBackup && inv.invitationStatus === 'pending')
                    .map(inv => [String(inv.registrationId), inv])
            );

            const jockeys = await Jockey.find().lean();
            const usedHorseIds = new Set();
            const usedJockeyIds = new Set();
            let jockeyCursor = 0;

            let assigned = 0, alreadyReady = 0, completed = 0, excluded = 0, skipped = 0, overLimit = 0;
            const maxParticipants = raceRound.maxParticipants;

            // Registrations that are rejected/cancelled are never touched, and
            // registrations with a pending real invitation (owner already hired a
            // specific jockey for a specific horse — just awaiting their
            // response) get fast-forwarded ahead of fresh-pick candidates so a
            // real, already-committed pairing isn't bumped out of a scarce slot
            // by a speculative auto-pick.
            const actionable = registrations.filter(
                reg => reg.registrationStatus !== 'rejected' && reg.registrationStatus !== 'cancelled'
            );
            excluded = registrations.length - actionable.length;

            const fastForwardRegs = [];
            const freshPickRegs = [];
            for (const reg of actionable) {
                const alreadyDone = reg.registrationStatus === 'accepted' && acceptedMainByReg.has(String(reg._id));
                if (alreadyDone) {
                    alreadyReady++;
                    if (reg.horseId) usedHorseIds.add(String(reg.horseId));
                    const inv = acceptedMainByReg.get(String(reg._id));
                    if (inv?.jockeyId) usedJockeyIds.add(String(inv.jockeyId));
                    continue;
                }
                const canFastForward = reg.registrationStatus === 'accepted' && pendingMainByReg.has(String(reg._id));
                if (canFastForward) {
                    fastForwardRegs.push(reg);
                } else {
                    freshPickRegs.push(reg);
                }
            }

            for (const reg of fastForwardRegs) {
                // Never assign past the race round's participant cap.
                if (alreadyReady + completed + assigned >= maxParticipants) {
                    overLimit++;
                    continue;
                }

                const pendingInv = pendingMainByReg.get(String(reg._id));
                await Invitation.findByIdAndUpdate(pendingInv._id, {
                    ownerConfirmation: true,
                    jockeyConfirmation: true,
                    invitationStatus: 'accepted',
                });
                // Trust the owner's/jockey's real prior choice — never replace
                // the horse/jockey already on this invitation.
                if (pendingInv.horseId) usedHorseIds.add(String(pendingInv.horseId));
                if (pendingInv.jockeyId) usedJockeyIds.add(String(pendingInv.jockeyId));
                completed++;
            }

            for (const reg of freshPickRegs) {
                // Never assign past the race round's participant cap.
                if (alreadyReady + completed + assigned >= maxParticipants) {
                    overLimit++;
                    continue;
                }

                const ownerHorses = await Horse.find({ ownerId: reg.horseOwnerId, status: 'active' }).lean();
                let eligibleHorse = null;
                for (const horse of ownerHorses) {
                    if (usedHorseIds.has(String(horse._id))) continue;
                    const horseInvitations = await Invitation.find({ horseId: horse._id, registrationId: { $ne: null } }).lean();
                    const resultRegIds = horseInvitations.map(inv => inv.registrationId);
                    const results = await RaceResult.find({ registrationId: { $in: resultRegIds } }).lean();
                    const wins = results.filter(r => r.finishPosition === 1).length;
                    const racesRun = results.length;
                    if (isHorseEligible(horse, wins, racesRun)) {
                        eligibleHorse = horse;
                        break;
                    }
                }
                if (!eligibleHorse) {
                    skipped++;
                    continue;
                }

                let jockey = null;
                if (jockeys.length) {
                    for (let i = 0; i < jockeys.length; i++) {
                        const candidate = jockeys[(jockeyCursor + i) % jockeys.length];
                        if (!usedJockeyIds.has(String(candidate._id))) {
                            jockey = candidate;
                            jockeyCursor = (jockeyCursor + i + 1) % jockeys.length;
                            break;
                        }
                    }
                    if (!jockey) jockey = jockeys[jockeyCursor % jockeys.length]; // all reused — fall back
                }
                if (!jockey) {
                    skipped++;
                    continue;
                }

                usedHorseIds.add(String(eligibleHorse._id));
                usedJockeyIds.add(String(jockey._id));

                await Registration.findByIdAndUpdate(reg._id, {
                    horseId: eligibleHorse._id,
                    registrationStatus: 'accepted',
                });

                // Any pending-and-accepted main invitation was already siphoned
                // off into fastForwardRegs above, so anything found here is a
                // dead (declined/cancelled) leftover row, safe to reuse/overwrite.
                const existingNonAccepted = existingInvitations.find(
                    inv => !inv.isBackup && String(inv.registrationId) === String(reg._id)
                );
                if (existingNonAccepted) {
                    await Invitation.findByIdAndUpdate(existingNonAccepted._id, {
                        horseId: eligibleHorse._id,
                        jockeyId: jockey._id,
                        ownerConfirmation: true,
                        jockeyConfirmation: true,
                        invitationStatus: 'accepted',
                    });
                } else {
                    await Invitation.create({
                        horseId: eligibleHorse._id,
                        jockeyId: jockey._id,
                        registrationId: reg._id,
                        ownerConfirmation: true,
                        jockeyConfirmation: true,
                        invitationStatus: 'accepted',
                        isBackup: false,
                        percentagePayout: 10,
                        bookingFees: jockey.bookingFee ?? 0,
                    });
                }

                assigned++;
            }

            return {
                code: 200,
                data: { assigned, alreadyReady, completed, excluded, skipped, overLimit, total: registrations.length },
                msg: `${assigned} registration(s) auto-assigned, ${completed} completed (pending invitation fast-forwarded), `
                    + `${alreadyReady} already ready, ${skipped} skipped (no eligible horse/jockey)`
                    + (excluded ? `, ${excluded} excluded (rejected/cancelled)` : '')
                    + (overLimit ? `, ${overLimit} skipped (race round full)` : '') + '.',
            };
        } catch (error) {
            console.error('Error in quickAssignHorsesAndJockeys:', error);
            return { code: 500, msg: error.message };
        }
    }

    // POST provision a Mux live stream for a prepared race (idempotent — returns existing if already created)
    async createStreamForRace(raceRoundId) {
        try {
            const raceRound = await RaceRound.findById(raceRoundId).lean();
            if (!raceRound) return { code: 404, msg: 'Race round not found.' };
            if (raceRound.status !== 'prepared') {
                return { code: 422, msg: 'A stream can only be created for races in "prepared" status.' };
            }
            // Idempotent: return existing stream info if already provisioned
            if (raceRound.muxLiveStreamId) {
                const info = await MuxService.getStreamInfo(raceRoundId);
                return { code: 200, data: info, msg: 'Stream already exists.' };
            }
            const info = await MuxService.createLiveStream(raceRoundId);
            return {
                code: 201,
                data: {
                    rtmpUrl: 'rtmps://global-live.mux.com:443/app',
                    streamKey: info.streamKey,
                    playbackId: info.livePlaybackId,
                },
                msg: 'Live stream created successfully.',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // GET Mux stream info (RTMP URL + stream key for OBS, playback ID for viewer)
    async getStreamInfo(raceRoundId) {
        try {
            const raceRound = await RaceRound.findById(raceRoundId).lean();
            if (!raceRound) return { code: 404, msg: 'Race round not found.' };
            if (raceRound.status !== 'running' && raceRound.status !== 'prepared') {
                return { code: 422, msg: 'Stream info is only available for prepared or running races.' };
            }
            if (!raceRound.muxLiveStreamId) {
                return { code: 404, msg: 'No stream has been created for this race yet.' };
            }
            const info = await MuxService.getStreamInfo(raceRoundId);
            if (!info) return { code: 404, msg: 'No live stream found for this race.' };
            return { code: 200, data: info, msg: 'Stream info retrieved.' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // GET Mux VOD playback ID after the live stream ends
    async getVOD(raceRoundId) {
        try {
            const raceRound = await RaceRound.findById(raceRoundId).lean();
            if (!raceRound) return { code: 404, msg: 'Race round not found.' };

            // Use cached VOD playback ID from DB first
            if (raceRound.muxVodPlaybackId) {
                return { code: 200, data: { vodPlaybackId: raceRound.muxVodPlaybackId }, msg: 'VOD retrieved.' };
            }

            const vod = await MuxService.getVOD(raceRoundId);
            if (!vod) return { code: 404, msg: 'VOD not yet available — the stream may still be processing.' };
            return { code: 200, data: vod, msg: 'VOD retrieved.' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // GET current live simulation snapshot (in-memory state)
    getSimulationState(raceRoundId) {
        try {
            const SimulationService = require('./SimulationService');
            const state = SimulationService.getSimulationState(raceRoundId);
            if (!state) return { code: 404, msg: 'No active simulation for this race round.' };
            return { code: 200, data: state, msg: 'Simulation state retrieved.' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // POST confirm race results → mark all results official, close race
    async confirmRaceResult(raceRoundId, adminId, io) {
        try {
            const raceRound = await RaceRound.findById(raceRoundId).lean();
            if (!raceRound) return { code: 404, msg: 'Race round not found.' };
            if (raceRound.status !== 'awaitingConfirmation' && raceRound.status !== 'completed') {
                return { code: 422, msg: `Cannot confirm results for a race with status "${raceRound.status}". Race must be in "awaitingConfirmation" state.` };
            }

            // Re-confirming an already-completed race is allowed (payments are
            // deduped via PaymentService.createIfNotExists), but jockey stat
            // increments below have no such per-call dedup key — only apply them
            // the first time this race round is confirmed.
            const isFirstConfirmation = raceRound.status !== 'completed';

            // This is triggered by the referee's confirm-result action, not an admin
            // directly — so `adminId` here is actually the referee's own user id.
            // The race round's owning admin is who actually owes the payouts, so
            // that's who payment Transactions must be attributed to.
            const payerAdminId = raceRound.createdByAdminId || adminId;

            // Mark all pending_confirmation results as official and stamp publishedByAdminId
            await RaceResult.updateMany(
                { raceRoundId },
                { resultStatus: 'official', publishedByAdminId: payerAdminId }
            );

            // Update race round to completed
            const updatedRace = await RaceRound.findByIdAndUpdate(
                raceRoundId,
                { status: 'completed' },
                { new: true }
            ).lean();

            // Fetch enriched results to return
            const results = await RaceResult.find({ raceRoundId })
                .populate('registrationId')
                .sort({ finishPosition: 1 })
                .lean();

            // ── Payment records: race_prize (admin→horseOwner) + jockey_payout (horseOwner→jockey) ──
            const originalCurrency = raceRound.currencyType || 'VND';
            const createdPayments = [];
            const participantJockeyIds = [];
            for (const result of results) {
                const registration = result.registrationId;
                if (!registration) continue;

                if (result.prizeMoney > 0 && registration.horseOwnerId) {
                    const payment = await PaymentService.createIfNotExists({
                        paymentType: 'race_prize',
                        payerRole: 'admin',
                        payerId: payerAdminId,
                        payeeRole: 'horseowner',
                        payeeId: registration.horseOwnerId,
                        amount: CurrencyConverter.convertToVnd(result.prizeMoney, originalCurrency),
                        originalAmount: result.prizeMoney,
                        originalCurrency,
                        sourceType: 'RaceResult',
                        sourceId: result._id,
                        raceRoundId,
                    });
                    createdPayments.push(payment);
                }

                if (registration.jockeyInRaceId) {
                    const invitation = await Invitation.findById(registration.jockeyInRaceId).lean();
                    if (invitation && invitation.jockeyId) {
                        participantJockeyIds.push(String(invitation.jockeyId));
                        const isNoShow = invitation.invitationStatus === 'didNotAttend';
                        const percentageCut = (!isNoShow && result.prizeMoney > 0)
                            ? Math.round((invitation.percentagePayout / 100) * result.prizeMoney)
                            : 0;
                        const bookingFeeAmount = isNoShow ? 0 : (invitation.bookingFees);
                        const payoutAmount = bookingFeeAmount + percentageCut;

                        // A no-show never actually raced — only real starters count
                        // toward matchesRaced/totalWins. Only on first confirmation
                        // (see isFirstConfirmation above) to avoid double-counting.
                        if (!isNoShow && isFirstConfirmation) {
                            await JockeyRepository.incrementRaceStats(invitation.jockeyId, { won: result.finishPosition === 1 });
                        }

                        if (payoutAmount > 0 && registration.horseOwnerId) {
                            const payment = await PaymentService.createIfNotExists({
                                paymentType: 'jockey_payout',
                                payerRole: 'horseowner',
                                payerId: registration.horseOwnerId,
                                payeeRole: 'jockey',
                                payeeId: invitation.jockeyId,
                                amount: CurrencyConverter.convertToVnd(payoutAmount, originalCurrency),
                                originalAmount: payoutAmount,
                                originalCurrency,
                                sourceType: 'Invitation',
                                sourceId: invitation._id,
                                raceRoundId,
                            });
                            createdPayments.push(payment);
                        }
                    }
                }
            }

            // ── Payment records: referee_fee (admin→referee) ──
            const refereeAssignments = await RaceReferee.find({ raceRoundId, status: 'assigned' }).lean();
            for (const assignment of refereeAssignments) {
                if (assignment.fee > 0) {
                    const payment = await PaymentService.createIfNotExists({
                        paymentType: 'referee_fee',
                        payerRole: 'admin',
                        payerId: payerAdminId,
                        payeeRole: 'referee',
                        payeeId: assignment.refereeId,
                        amount: CurrencyConverter.convertToVnd(assignment.fee, originalCurrency),
                        originalAmount: assignment.fee,
                        originalCurrency,
                        sourceType: 'RaceReferee',
                        sourceId: assignment._id,
                        raceRoundId,
                    });
                    createdPayments.push(payment);
                }
            }

            // ── Persisted notifications: race_completed to participants, payment_created per new payment ──
            const participantHorseOwnerIds = [...new Set(
                results.map(r => r.registrationId?.horseOwnerId).filter(Boolean).map(String)
            )];
            const participantRefereeIds = refereeAssignments.map(a => String(a.refereeId));
            NotificationService.notify({
                recipientIds: [...participantHorseOwnerIds, ...participantJockeyIds, ...participantRefereeIds],
                type: 'race_completed',
                title: 'Race Results Confirmed',
                message: `Results for "${raceRound.roundName}" have been officially confirmed.`,
                actionPayload: { entityType: 'RaceRound', entityId: raceRoundId },
            }, io).catch(err => console.error('[confirmRaceResult] race_completed notify error:', err.message));

            for (const payment of createdPayments) {
                if (!payment) continue;
                NotificationService.notify({
                    recipientIds: [payment.payeeId],
                    type: 'payment_created',
                    title: 'New Payment Awaiting Confirmation',
                    message: `A payment of ${payment.amount} (${payment.paymentType}) has been recorded for you to confirm.`,
                    actionPayload: { entityType: 'Transaction', entityId: payment._id },
                }, io).catch(err => console.error('[confirmRaceResult] payment_created notify error:', err.message));
            }

            // Settle pending race predictions in the background (non-blocking)
            this._settlePredictionsForRace(raceRoundId).catch(err =>
                console.error('[confirmRaceResult] settle predictions error:', err.message)
            );

            if (io) {
                io.emit('race_status_changed', {
                    raceRoundId,
                    status: 'completed',
                    timestamp: new Date(),
                });

                // Reshape the populated `results` into the FinishResult wire format
                // (registrationId as a plain string, horseName/jockeyName resolved) —
                // sending the raw populated Registration object as `registrationId`
                // breaks React keys and identity comparisons on the client.
                const regIds = results.map(r => r.registrationId?._id).filter(Boolean);
                const invitations = regIds.length
                    ? await Invitation.find({ registrationId: { $in: regIds }, isBackup: false }).lean()
                    : [];
                const invByReg = new Map(invitations.map(inv => [String(inv.registrationId), inv]));

                const horseIds = invitations.map(inv => inv.horseId).filter(Boolean);
                const jockeyIds = invitations.map(inv => inv.jockeyId).filter(Boolean);
                const [horseDocs, jockeyUserDocs] = await Promise.all([
                    horseIds.length ? Horse.find({ _id: { $in: horseIds } }, 'horseName').lean() : [],
                    jockeyIds.length ? User.find({ _id: { $in: jockeyIds } }, 'fullName').lean() : [],
                ]);
                const horseMap = new Map(horseDocs.map(h => [String(h._id), h.horseName]));
                const jockeyMap = new Map(jockeyUserDocs.map(u => [String(u._id), u.fullName]));

                const socketResults = results.map(r => {
                    const invitation = invByReg.get(String(r.registrationId?._id));
                    return {
                        registrationId: r.registrationId?._id ? String(r.registrationId._id) : null,
                        horseName: (invitation && horseMap.get(String(invitation.horseId))) ?? '',
                        jockeyName: (invitation && jockeyMap.get(String(invitation.jockeyId))) ?? '',
                        finishPosition: r.finishPosition,
                        finishTime: r.finishTime,
                        distance: r.distance ?? 0,
                    };
                });

                io.to(`race:${raceRoundId}`).emit('race_results_confirmed', {
                    raceRoundId,
                    results: socketResults,
                    timestamp: new Date(),
                });
            }

            return { code: 200, data: { raceRound: updatedRace, results }, msg: 'Race results confirmed and race marked as completed.' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Settle race-level predictions after a race round is confirmed completed.
    // Called internally by confirmRaceResult.
    async _settlePredictionsForRace(raceRoundId) {
        await PayoutService.distributeRacePayouts(raceRoundId);
    }
}

// Helper: get all registrationIds that belong to a given raceRoundId
async function getRegistrationIdsByRound(raceRoundId) {
    const regs = await require('../entities/Registration').find({ raceRoundId }, '_id').lean();
    return regs.map((r) => r._id);
}

module.exports = new RaceRoundService();
module.exports.getRegistrationIdsByRound = getRegistrationIdsByRound;
