const Registration = require('../entities/Registration');
const Invitation = require('../entities/Invitation');
const RaceRound = require('../entities/RaceRound');
const RaceResult = require('../entities/RaceResult');
const User = require('../entities/User');
const Tournament = require('../entities/Tournament');

// In-memory store: raceRoundId → { horses, interval, startTime, finishCount, trackLength, intensity }
const activeRaces = new Map();

// ── Intensity levels: assigned once per race, set the stat floor/ceiling ───────
const INTENSITY_LEVELS = [
    { name: 'medium', statMin: 50, statMax: 60 }, // claiming / allowance
    { name: 'high', statMin: 70, statMax: 80 }, // stakes
];

function pickIntensity() {
    return INTENSITY_LEVELS[Math.floor(Math.random() * INTENSITY_LEVELS.length)];
}

// ── W'-balance-style stamina recovery ───────────────────────────────────────────
// Below this fraction of maxSpeed, stamina reconstitutes instead of draining
// (real-world analog: Skiba's critical-power/W'-balance fatigue model).
const CS_FRACTION = 0.70;
const RECOVERY_MAX_FACTOR = 0.5; // recovery ceiling relative to baseDrain

// ── Horse-to-horse interaction (blocking/drafting) ──────────────────────────────
// No lane/lateral dimension exists, so "traffic" is abstracted via distance bands
// + probability rather than a deterministic single blocker — a boxed horse is only
// probabilistically delayed tick-by-tick, never permanently trapped.
const BLOCK_WINDOW = 1.2;      // m — "immediately boxed in" band
const DRAFT_WINDOW = 3.0;      // m — "tucked in behind" band
const PASS_MARGIN = 1.05;      // only block if trying to run meaningfully faster than the blocker
const BASE_PASS_CHANCE = 0.15; // per-tick chance to find a gap even when congested
const ACCEL_PASS_BONUS = 0.25; // better accel stat finds racing room more easily
const DRAFT_DISCOUNT = 0.90;   // stamina drain multiplier while tucked in behind a faster horse

// ── Pace-shape-aware kick payoff ────────────────────────────────────────────────
// A Closer/LateSurger's kick strength scales with how depleted the rest of the
// field already is when it crosses its kick point — "pace makes the race".
const PACE_SIGNAL_CLAMP = 0.6;
const PACE_KICK_GAIN = 0.5; // up to +30% kick multiplier at full clamp

function randomStat(min, max) {
    return Math.round(min + Math.random() * (max - min));
}

// ── Stat → physics conversions (all in m/tick at TICK_MS = 100 ms) ─────────────
// speed 100 → 1.7 m/tick, speed 1 → ~0.61 m/tick  (≈ 17 m/s and 6 m/s at 10 ticks/s)
function statToMaxSpeed(speed) {
    return 0.6 + (speed / 100) * 1.1;
}

// stamina pool: resource a horse spends each tick to sustain speed — 300 (stat 1) to 2000 (stat 100)
// Each style drains this pool at a different rate; when the pool runs low, speed is capped.
function statToStamina(stamina) {
    return 300 + (stamina / 100) * 1700;
}

// accel → per-tick speed variance (m/tick), ranges 0.010 – 0.155
function statToAccelRange(accel) {
    return 0.010 + (accel / 100) * 0.145;
}

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

// Next 100 m line mark ahead of the leader.
function computeLineMark(highestDistance) {
    return (Math.floor(highestDistance / 100) + 1) * 100;
}

// Tick interval in milliseconds — controls update frequency and physics step size.
const TICK_MS = 100; // 10 updates per second; race real-time duration unchanged

// ── Per-tick physics (resource-based stamina) ──────────────────────────────────
//
// Each style targets a speed and pays a stamina drain proportional to
// (actualSpeed / maxSpeed)^1.8 × styleRate. When the pool drops below 25 %
// the horse gets a hard speed cap that tightens to minSpeed at 0 % pool.
// Drain is calculated on the ACTUAL (possibly capped) speed so a tired horse
// that is already slow drains less — no runaway death spiral.
//
// Style drain rates:
//   Runner      1.30  — sprints hard, pays the most
//   Pace        1.00  — balanced baseline
//   Late        0.75 early / 1.10 after kick
//   LateSurger  0.38 early / 1.35 during surge — huge reserve funds the burst
//   Closer      0.65 → 1.10 ramping across the race
//
function simulateTick(horse, trackLength, fieldSnapshot = []) {
    const maxSpeed = statToMaxSpeed(horse.speed);
    const accelRange = statToAccelRange(horse.accel);
    const minSpeed = maxSpeed * 0.35;           // lower floor = stamina failure hurts
    const baseDrain = 1.0 + (horse.speed / 100) * 0.5; // 1.0–1.5 units/tick at full speed

    let intended;   // what the horse wants to run this tick
    let drainRate;
    let kickPoint = null;

    if (horse.raceStyle === 'Runner') {
        // Capped at 93 % so variance can push both directions; drain rate 1.30
        intended = maxSpeed * 0.93 + (Math.random() - 0.5) * accelRange;
        drainRate = 1.30;

    } else if (horse.raceStyle === 'Pace') {
        intended = maxSpeed * 0.82 + (Math.random() - 0.5) * accelRange;
        drainRate = 1.00;

    } else if (horse.raceStyle === 'Late') {
        kickPoint = trackLength * 0.58;
        const kickBoost = pickUpKickBoost(horse, kickPoint, fieldSnapshot);
        if (horse.currentDistance < kickPoint) {
            intended = maxSpeed * 0.65 + (Math.random() - 0.5) * accelRange * 0.7;
            drainRate = 0.75;
        } else {
            intended = maxSpeed * 0.97 * kickBoost + (Math.random() - 0.5) * accelRange * 0.55;
            drainRate = 1.10;
        }

    } else if (horse.raceStyle === 'LateSurger') {
        // Conservative until 65 % of track; the saved pool then funds the surge.
        kickPoint = trackLength * 0.65;
        const kickBoost = pickUpKickBoost(horse, kickPoint, fieldSnapshot);
        if (horse.currentDistance < kickPoint) {
            intended = maxSpeed * 0.60 + (Math.random() - 0.5) * accelRange * 0.45;
            drainRate = 0.38;
        } else {
            // Surge escalates: 102 % → 112 % of maxSpeed as horse approaches wire
            const surgeFraction = (horse.currentDistance - kickPoint) / (trackLength - kickPoint);
            intended = maxSpeed * (1.02 + surgeFraction * 0.10) * kickBoost + (Math.random() - 0.5) * accelRange * 0.5;
            drainRate = 1.35;
        }

    } else {
        // Closer — smooth progressive ramp 60 % → 95 % of maxSpeed
        kickPoint = trackLength * 0.30; // pace-signal is sampled once here, near the recovery→drain crossover
        const kickBoost = pickUpKickBoost(horse, kickPoint, fieldSnapshot);
        const progress = Math.min(1, horse.currentDistance / trackLength);
        intended = maxSpeed * (0.60 + progress * 0.35 * kickBoost) + (Math.random() - 0.5) * accelRange * 0.8;
        drainRate = 0.65 + progress * 0.45; // 0.65 early → 1.10 at wire
    }

    // ── Horse-to-horse interaction: blocking ──────────────────────────────────
    const others = fieldSnapshot.filter(f => f.number !== horse.number);
    const aheadClose = others.filter(f =>
        !f.isFinished &&
        f.currentDistance - horse.currentDistance > 0 &&
        f.currentDistance - horse.currentDistance <= BLOCK_WINDOW);

    let isBlocked = false;
    if (aheadClose.length > 0) {
        const blockerSpeed = Math.min(...aheadClose.map(f => f.lastTargetMPerTick));
        if (intended > blockerSpeed * PASS_MARGIN) {
            const passChance = BASE_PASS_CHANCE + (horse.accel / 100) * ACCEL_PASS_BONUS;
            if (Math.random() >= passChance) {
                intended = Math.min(intended, blockerSpeed * 1.02);
                isBlocked = true;
            }
        }
    }

    // ── Horse-to-horse interaction: drafting ──────────────────────────────────
    let isDrafting = false;
    let draftMultiplier = 1.0;
    if (!isBlocked) {
        const drafter = others.find(f =>
            !f.isFinished &&
            f.currentDistance - horse.currentDistance > BLOCK_WINDOW &&
            f.currentDistance - horse.currentDistance <= DRAFT_WINDOW &&
            f.lastTargetMPerTick >= intended);
        if (drafter) {
            isDrafting = true;
            draftMultiplier = DRAFT_DISCOUNT;
        }
    }

    // ── Stamina speed cap ─────────────────────────────────────────────────────
    // Below 25 % pool: linearly cap speed from 90 % maxSpeed (at 25 %) down to minSpeed (at 0 %)
    const staminaRatio = horse.staminaPool / horse.initialStaminaPool;
    if (staminaRatio < 0.25) {
        const cap = minSpeed + (staminaRatio / 0.25) * (maxSpeed * 0.90 - minSpeed);
        intended = Math.min(intended, cap);
    }

    const hardCap = horse.raceStyle === 'LateSurger' ? maxSpeed + 1.5 : maxSpeed + 0.5;
    const target = Math.max(minSpeed, Math.min(hardCap, intended));

    // ── W'-balance: drain above critical speed, recover below it ──────────────
    const criticalSpeed = maxSpeed * CS_FRACTION;
    let recovering = false;
    if (target >= criticalSpeed) {
        const speedFraction = Math.min(1.0, target / maxSpeed);
        const drain = baseDrain * drainRate * draftMultiplier * Math.pow(speedFraction, 1.8);
        horse.staminaPool = Math.max(0, horse.staminaPool - drain);
    } else {
        // Deeper below critical speed → faster recovery (linear stand-in for
        // the real exponential W'-balance recovery curve).
        const deficitFraction = (criticalSpeed - target) / criticalSpeed;
        const recoveryMax = baseDrain * RECOVERY_MAX_FACTOR * (0.7 + (horse.stamina / 100) * 0.3);
        horse.staminaPool = Math.min(horse.initialStaminaPool, horse.staminaPool + recoveryMax * deficitFraction);
        recovering = true;
    }

    // ── Distance & finish — target is m/tick, no dt scaling needed ───────────
    const newDist = horse.currentDistance + target;
    const isFinished = newDist >= trackLength;

    let finishFraction = 0;
    if (isFinished) {
        finishFraction = (trackLength - horse.currentDistance) / target;
    }

    return {
        currentSpeed: target * (1000 / TICK_MS), // convert m/tick → m/s for display
        currentDistance: isFinished ? trackLength : newDist,
        isFinished,
        finishFraction,
        targetMPerTick: target,
        isBlocked,
        isDrafting,
        recovering,
    };
}

// Freezes a Late/LateSurger/Closer's pace-shape kick multiplier the first tick
// it reaches its kick point, sampling the rest of the field's stamina
// depletion as a "how hot was the pace" proxy — never resampled afterward.
function pickUpKickBoost(horse, kickPoint, fieldSnapshot) {
    if (!horse.hasKicked && horse.currentDistance >= kickPoint) {
        horse.hasKicked = true;
        const others = fieldSnapshot.filter(f => f.number !== horse.number);
        const avgStaminaRatio = others.length
            ? others.reduce((s, f) => s + f.staminaRatio, 0) / others.length
            : 1;
        const paceSignal = Math.min(PACE_SIGNAL_CLAMP, Math.max(0, 1 - avgStaminaRatio));
        horse.paceMultiplier = 1 + paceSignal * PACE_KICK_GAIN;
    }
    return horse.hasKicked ? horse.paceMultiplier : 1.0;
}

// ── Format elapsed ms → "m:ss.xx" ─────────────────────────────────────────────
function formatTime(ms) {
    const totalSec = ms / 1000;
    const mins = Math.floor(totalSec / 60);
    const secs = (totalSec % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, '0')}`;
}

// ── Build initial horse states from verified registrations ─────────────────────
async function buildHorses(raceRoundId, intensity) {
    const registrations = await Registration.find({
        raceRoundId,
        registrationStatus: 'verified',
    }).lean();

    const STYLES = ['Runner', 'Pace', 'Late', 'LateSurger', 'Closer'];

    return Promise.all(registrations.map(async (reg, idx) => {
        const invitation = await Invitation.findById(reg.jockeyInRaceId)
            .populate('horseId')
            .populate('jockeyId')
            .lean();

        let horseName = `Horse #${idx + 1}`;
        let jockeyName = 'Unknown Jockey';

        if (invitation?.horseId?.horseName) {
            horseName = invitation.horseId.horseName;
        }
        if (invitation?.jockeyId?._id) {
            const jUser = await User.findById(invitation.jockeyId._id).select('fullName').lean();
            if (jUser?.fullName) jockeyName = jUser.fullName;
        }

        const style = STYLES[Math.floor(Math.random() * STYLES.length)];
        // Stats are drawn from the race's intensity band, not the full 1-100 range
        const speed = randomStat(intensity.statMin, intensity.statMax);
        const stamina = randomStat(intensity.statMin, intensity.statMax);
        const accel = randomStat(intensity.statMin, intensity.statMax);

        const maxSpeed = statToMaxSpeed(speed);
        let initialSpeed;
        if (style === 'Runner') initialSpeed = randomBetween(maxSpeed * 0.88, maxSpeed);
        else if (style === 'Pace') initialSpeed = randomBetween(maxSpeed * 0.78, maxSpeed * 0.88);
        else if (style === 'Late') initialSpeed = randomBetween(maxSpeed * 0.60, maxSpeed * 0.75);
        else if (style === 'LateSurger') initialSpeed = randomBetween(maxSpeed * 0.42, maxSpeed * 0.55); // starts very slow
        else initialSpeed = randomBetween(maxSpeed * 0.54, maxSpeed * 0.68); // Closer: moderate start

        const initialStaminaPool = statToStamina(stamina);
        return {
            registrationId: reg._id.toString(),
            number: idx + 1,
            horseName,
            jockeyName,
            speed,
            stamina,
            accel,
            raceStyle: style,
            currentDistance: 0,
            currentSpeed: initialSpeed,
            staminaPool: initialStaminaPool,
            initialStaminaPool: initialStaminaPool,
            isFinished: false,
            finishPosition: null,
            finishTime: null,
            // Internal-only state for pacing/interaction mechanics — never broadcast.
            _lastTargetMPerTick: 0,
            hasKicked: false,
            paceMultiplier: 1.0,
        };
    }));
}

// ── Persist individual horse result immediately ────────────────────────────────
async function saveHorseResult(raceRound, horse) {
    try {
        const prizes = [
            raceRound?.firstPlacePrize ?? 0,
            raceRound?.secondPlacePrize ?? 0,
            raceRound?.thirdPlacePrize ?? 0,
        ];

        const prize = (horse.finishPosition && horse.finishPosition <= 3)
            ? prizes[horse.finishPosition - 1]
            : 0;

        const raceDate = raceRound.raceDate ?? new Date();
        const payload = {
            raceRoundId: new (require('mongoose').Types.ObjectId)(raceRound._id),
            registrationId: new (require('mongoose').Types.ObjectId)(horse.registrationId),
            finishPosition: horse.finishPosition,
            finishTime: horse.finishTime,
            distance: horse.finishingDistance ?? 0,
            prizeMoney: prize,
            resultStatus: 'pending_confirmation',
            createdAt: new Date(raceDate),
            updatedAt: new Date(),
        };

        const existing = await RaceResult.findOne({ registrationId: horse.registrationId }).lean();
        if (existing) {
            await RaceResult.collection.updateOne(
                { _id: existing._id },
                { $set: payload }
            );
        } else {
            await RaceResult.collection.insertOne(payload);
        }
    } catch (err) {
        console.error(`[Sim] Error saving result for ${horse.horseName}:`, err);
    }
}

// ── Notify clients when all horses finish ──────────────────────────────────────
async function finalizeRace(raceRoundId, raceRound, horses, intensity, io) {
    try {
        // Sort finishers by position, compute gap in lengths each horse was ahead of the one behind it.
        // 1 length ≈ 0.2 s at typical flat-race pace. Rounded to ¼-length precision.
        const sorted = horses
            .filter(h => h.isFinished && h.exactMs != null)
            .sort((a, b) => (a.finishPosition ?? 999) - (b.finishPosition ?? 999));

        for (let i = 0; i < sorted.length; i++) {
            if (i < sorted.length - 1) {
                const gapSec = (sorted[i + 1].exactMs - sorted[i].exactMs) / 1000;
                sorted[i].finishingDistance = Math.round((gapSec / 0.2) * 4) / 4;
            } else {
                sorted[i].finishingDistance = 0; // last finisher — no one behind
            }
        }

        // Persist results now that distances are known
        await Promise.all(horses.map(horse => saveHorseResult(raceRound, horse)));

        const sortedResults = sorted
            .map(h => ({
                registrationId: h.registrationId,
                horseName: h.horseName,
                jockeyName: h.jockeyName,
                finishPosition: h.finishPosition,
                finishTime: h.finishTime,
                distance: h.finishingDistance ?? 0,
            }));

        io.to(`race:${raceRoundId}`).emit('race_finished', {
            raceRoundId,
            intensity: intensity.name,
            results: sortedResults,
        });

        // Transition race to awaitingConfirmation so admin can review & officially confirm
        await RaceRound.findByIdAndUpdate(raceRoundId, { status: 'awaitingConfirmation' });

        io.emit('race_status_changed', {
            raceRoundId,
            status: 'awaitingConfirmation',
            timestamp: new Date(),
        });

        console.log(`[Sim] Race ${raceRoundId} finalised — status → awaitingConfirmation.`);

        await checkTournamentChampion(raceRoundId, io);
    } catch (err) {
        console.error('[Sim] Error finalising race:', err);
    }
}

// ── Set tournament champion if the same horse won every round ──────────────────
// Skips "non-tournament" Tournaments (single-race events with only 1 round),
// races that are not the last round by raceDate, and incomplete series.
async function checkTournamentChampion(raceRoundId, io) {
    try {
        const raceRound = await RaceRound.findById(raceRoundId).lean();

        // All rounds for this tournament, oldest → newest by raceDate
        const allRounds = await RaceRound.find({ tournamentId: raceRound.tournamentId })
            .sort({ raceDate: 1 })
            .lean();

        // Tournaments with only 1 race round are not a multi-race championship series
        if (allRounds.length < 2) return;

        // Only act when the just-finished race is the final round
        const lastRound = allRounds[allRounds.length - 1];
        if (lastRound._id.toString() !== raceRoundId.toString()) return;

        // All previous rounds must already be marked completed in the DB
        const previousRounds = allRounds.filter(r => r._id.toString() !== raceRoundId.toString());
        if (!previousRounds.every(r => r.status === 'completed')) return;

        // Trace winner horse for every round: RaceResult → Registration → Invitation → Horse
        const winnerHorseIds = [];
        for (const round of allRounds) {
            const winnerResult = await RaceResult.findOne({
                raceRoundId: round._id,
                finishPosition: 1,
                resultStatus: { $ne: 'cancelled' },
            }).lean();
            if (!winnerResult) return;

            const reg = await Registration.findById(winnerResult.registrationId).lean();
            if (!reg?.jockeyInRaceId) return;

            const inv = await Invitation.findById(reg.jockeyInRaceId).lean();
            if (!inv?.horseId) return;

            winnerHorseIds.push(inv.horseId.toString());
        }

        if (!winnerHorseIds.length) return;

        // Champion: same horse won every single round
        const championHorseId = winnerHorseIds[0];
        if (!winnerHorseIds.every(id => id === championHorseId)) return;

        await Tournament.findByIdAndUpdate(raceRound.tournamentId, { championHorseId });
        console.log(`[Sim] Tournament ${raceRound.tournamentId} champion → horse ${championHorseId}`);

        io.emit('tournament_champion', {
            tournamentId: raceRound.tournamentId.toString(),
            championHorseId,
        });

        const PayoutService = require('./PayoutService');
        await PayoutService.distributeTournamentPayouts(raceRound.tournamentId, championHorseId);
    } catch (err) {
        console.error('[Sim] Error checking tournament champion:', err);
    }
}

// ── Public API ─────────────────────────────────────────────────────────────────

async function initializeSimulation(raceRoundId, io) {
    stopSimulation(raceRoundId); // clean up any leftover

    const raceRound = await RaceRound.findById(raceRoundId).lean();
    if (!raceRound) throw new Error(`Race round ${raceRoundId} not found`);

    const intensity = pickIntensity();
    console.log(`[Sim] Race ${raceRoundId} — intensity: ${intensity.name} (stats ${intensity.statMin}–${intensity.statMax})`);

    const horses = await buildHorses(raceRoundId, intensity);
    if (horses.length === 0) {
        console.warn(`[Sim] No verified registrations for race ${raceRoundId} — skipping`);
        return;
    }

    const trackLength = raceRound.trackLength;
    const startTime = Date.now();
    const state = { horses, trackLength, startTime, finishCount: 0, intensity, interval: null };

    const interval = setInterval(async () => {
        const currentMs = Date.now() - startTime;
        const elapsed = Math.floor(currentMs / 1000);
        let highest = 0;

        const finishedThisTick = [];

        // Snapshot the field's PREVIOUS-tick state before anyone moves this tick,
        // so every horse's blocking/drafting/pace-signal checks see the same
        // globally-consistent world-state rather than an order-dependent mix of
        // already-updated and stale sibling positions.
        const fieldSnapshot = state.horses.map(h => ({
            number: h.number,
            currentDistance: h.currentDistance,
            lastTargetMPerTick: h._lastTargetMPerTick,
            staminaRatio: h.staminaPool / h.initialStaminaPool,
            isFinished: h.isFinished,
        }));

        for (const horse of state.horses) {
            if (horse.isFinished) {
                if (horse.currentDistance > highest) highest = horse.currentDistance;
                continue;
            }

            const tick = simulateTick(horse, trackLength, fieldSnapshot);
            horse.currentDistance = tick.currentDistance;
            horse.currentSpeed = tick.currentSpeed;
            horse._lastTargetMPerTick = tick.targetMPerTick;

            if (tick.isFinished) {
                horse.isFinished = true;
                const exactMs = Math.max(0, (currentMs - TICK_MS) + (tick.finishFraction * TICK_MS));
                finishedThisTick.push({ horse, exactMs });
            }

            if (horse.currentDistance > highest) highest = horse.currentDistance;
        }

        if (finishedThisTick.length > 0) {
            finishedThisTick.sort((a, b) => a.exactMs - b.exactMs);
            for (const { horse, exactMs } of finishedThisTick) {
                state.finishCount += 1;
                horse.finishPosition = state.finishCount;
                horse.finishTime = formatTime(exactMs);
                horse.exactMs = exactMs; // stored for distance calc in finalizeRace
            }
        }

        const lineMark = Math.min(computeLineMark(highest), trackLength);

        io.to(`race:${raceRoundId}`).emit('race_update', {
            raceRoundId,
            intensity: intensity.name,
            elapsedSeconds: elapsed,
            lineMark,
            trackLength,
            horses: state.horses.map(h => ({
                registrationId: h.registrationId,
                number: h.number,
                horseName: h.horseName,
                jockeyName: h.jockeyName,
                raceStyle: h.raceStyle,
                currentDistance: parseFloat(h.currentDistance.toFixed(2)),
                currentSpeed: parseFloat(h.currentSpeed.toFixed(2)),
                staminaRatio: parseFloat((h.staminaPool / h.initialStaminaPool).toFixed(3)),
                isFinished: h.isFinished,
                finishPosition: h.finishPosition,
                finishTime: h.finishTime,
            })),
        });

        if (state.finishCount >= state.horses.length) {
            clearInterval(state.interval);
            activeRaces.delete(raceRoundId);
            await finalizeRace(raceRoundId, raceRound, state.horses, intensity, io);
        }
    }, TICK_MS);

    state.interval = interval;
    activeRaces.set(raceRoundId, state);
    console.log(`[Sim] Race ${raceRoundId} started — ${horses.length} horses, ${trackLength} m track`);
}

function stopSimulation(raceRoundId) {
    const state = activeRaces.get(raceRoundId);
    if (!state) return;
    clearInterval(state.interval);
    activeRaces.delete(raceRoundId);
    console.log(`[Sim] Race ${raceRoundId} simulation stopped.`);
}

function getSimulationState(raceRoundId) {
    const state = activeRaces.get(raceRoundId);
    if (!state) return null;
    return {
        intensity: state.intensity.name,
        trackLength: state.trackLength,
        elapsedSeconds: Math.floor((Date.now() - state.startTime) / 1000),
        finishCount: state.finishCount,
        horses: state.horses.map(h => ({
            registrationId: h.registrationId,
            number: h.number,
            horseName: h.horseName,
            raceStyle: h.raceStyle,
            currentDistance: parseFloat(h.currentDistance.toFixed(2)),
            currentSpeed: parseFloat(h.currentSpeed.toFixed(2)),
            staminaRatio: parseFloat((h.staminaPool / h.initialStaminaPool).toFixed(3)),
            isFinished: h.isFinished,
            finishPosition: h.finishPosition,
            finishTime: h.finishTime,
        })),
    };
}

module.exports = { initializeSimulation, stopSimulation, getSimulationState, simulateTick };
