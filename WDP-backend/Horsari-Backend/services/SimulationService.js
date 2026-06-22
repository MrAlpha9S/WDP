const Registration = require('../entities/Registration');
const Invitation = require('../entities/Invitation');
const RaceRound = require('../entities/RaceRound');
const RaceResult = require('../entities/RaceResult');
const User = require('../entities/User');

// In-memory store: raceRoundId (string) → { horses, interval, startTime, finishCount, trackLength }
const activeRaces = new Map();

// ── Stat → physics conversions ─────────────────────────────────────────────────
// speed  100 → 15 m/s,  1 → ~1 m/s
function statToMaxSpeed(speed) {
    return 1 + (speed / 100) * 14;
}
// stamina 100 → 2000 m,  1 → 20 m
function statToStamina(stamina) {
    return (stamina / 100) * 2000;
}
// accel   100 → ±1 m/s variance,  1 → ±0.01 m/s
function statToAccel(accel) {
    return accel / 100;
}

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

// Next 100 m line mark ahead of the leader.
// Leader at 170 → 200.  Leader at 200 or 220 → 300.
function computeLineMark(highestDistance) {
    return (Math.floor(highestDistance / 100) + 1) * 100;
}

// ── Per-tick physics ───────────────────────────────────────────────────────────
function simulateTick(horse, trackLength) {
    const maxSpeed   = statToMaxSpeed(horse.speed);
    const stamDist   = statToStamina(horse.stamina);
    const accelRange = statToAccel(horse.accel);
    const minSpeed   = maxSpeed * 0.4;

    const pastStamina = horse.currentDistance >= stamDist;
    let target;

    if (horse.raceStyle === 'Runner') {
        if (!pastStamina) {
            // All-out sprint — vary ±(2 + accel) around maxSpeed each second
            target = maxSpeed + (Math.random() - 0.5) * 2 * (2 + accelRange);
        } else {
            // Fade proportionally past stamina distance
            const distPast = horse.currentDistance - stamDist;
            const fade = Math.min(maxSpeed - minSpeed, (distPast / 500) * 2);
            target = maxSpeed - fade + (Math.random() - 0.5) * accelRange;
        }
    } else if (horse.raceStyle === 'Pace') {
        const paceBase = maxSpeed * 0.8;
        if (pastStamina) {
            const distPast = horse.currentDistance - stamDist;
            const fade = Math.min(paceBase - minSpeed, (distPast / 800) * 1.5);
            target = paceBase - fade + (Math.random() - 0.5) * accelRange;
        } else {
            target = paceBase + (Math.random() - 0.5) * accelRange;
        }
    } else {
        // Late — conserve until 60 % of track, then kick
        const kickPoint = trackLength * 0.6;
        if (horse.currentDistance < kickPoint) {
            target = maxSpeed * 0.62 + (Math.random() - 0.5) * accelRange;
        } else {
            target = maxSpeed + (Math.random() - 0.5) * accelRange * 0.5;
        }
    }

    // Clamp to [minSpeed, maxSpeed + small burst allowance]
    target = Math.max(minSpeed, Math.min(maxSpeed + 0.5, target));

    const newDist    = horse.currentDistance + target;
    const isFinished = newDist >= trackLength;

    let finishFraction = 0;
    if (isFinished) {
        const distNeeded = trackLength - horse.currentDistance;
        finishFraction = distNeeded / target; // fraction of the 1-second tick
    }

    return {
        currentSpeed:    target,
        currentDistance: isFinished ? trackLength : newDist,
        isFinished,
        finishFraction,
    };
}

// ── Format elapsed ms → "m:ss.xx" ─────────────────────────────────────────────
function formatTime(ms) {
    const totalSec = ms / 1000;
    const mins = Math.floor(totalSec / 60);
    const secs = (totalSec % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, '0')}`;
}

// ── Build initial horse states from verified registrations ─────────────────────
async function buildHorses(raceRoundId) {
    const registrations = await Registration.find({
        raceRoundId,
        registrationStatus: 'verified',
    }).lean();

    const STYLES = ['Runner', 'Pace', 'Late'];

    return Promise.all(registrations.map(async (reg, idx) => {
        const invitation = await Invitation.findById(reg.jockeyInRaceId)
            .populate('horseId')
            .populate('jockeyId')
            .lean();

        let horseName  = `Horse #${idx + 1}`;
        let jockeyName = 'Unknown Jockey';

        if (invitation?.horseId?.horseName) {
            horseName = invitation.horseId.horseName;
        }
        if (invitation?.jockeyId?._id) {
            const jUser = await User.findById(invitation.jockeyId._id).select('fullName').lean();
            if (jUser?.fullName) jockeyName = jUser.fullName;
        }

        const style   = STYLES[Math.floor(Math.random() * STYLES.length)];
        const speed   = Math.ceil(Math.random() * 100);
        const stamina = Math.ceil(Math.random() * 100);
        const accel   = Math.ceil(Math.random() * 100);

        const maxSpeed = statToMaxSpeed(speed);
        let initialSpeed;
        if (style === 'Runner')    initialSpeed = randomBetween(maxSpeed * 0.85, maxSpeed);
        else if (style === 'Pace') initialSpeed = randomBetween(maxSpeed * 0.75, maxSpeed * 0.85);
        else                       initialSpeed = randomBetween(maxSpeed * 0.55, maxSpeed * 0.70);

        return {
            registrationId:  reg._id.toString(),
            number:          idx + 1,
            horseName,
            jockeyName,
            speed,
            stamina,
            accel,
            raceStyle:       style,
            currentDistance: 0,
            currentSpeed:    initialSpeed,
            isFinished:      false,
            finishPosition:  null,
            finishTime:      null,
        };
    }));
}

// ── Persist individual horse result immediately ─────────────────────────────
async function saveHorseResult(raceRound, horse) {
    try {
        const prizes = [
            raceRound?.firstPlacePrize  ?? 0,
            raceRound?.secondPlacePrize ?? 0,
            raceRound?.thirdPlacePrize  ?? 0,
        ];

        const prize = (horse.finishPosition && horse.finishPosition <= 3)
            ? prizes[horse.finishPosition - 1]
            : 0;

        const raceDate   = raceRound.raceDate ?? new Date();
        const payload = {
            raceRoundId:     new (require('mongoose').Types.ObjectId)(raceRound._id),
            registrationId:  new (require('mongoose').Types.ObjectId)(horse.registrationId),
            finishPosition:  horse.finishPosition,
            finishTime:      horse.finishTime,
            prizeMoney:      prize,
            resultStatus:    'pending_confirmation',
            createdAt:       new Date(raceDate),
            updatedAt:       new Date(),
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

// ── Notify clients when all horses finish ───────────────────────────────────
async function finalizeRace(raceRoundId, horses, io) {
    try {
        io.to(`race:${raceRoundId}`).emit('race_finished', {
            raceRoundId,
            results: horses
                .slice()
                .sort((a, b) => (a.finishPosition ?? 999) - (b.finishPosition ?? 999))
                .map(h => ({
                    registrationId: h.registrationId,
                    horseName:      h.horseName,
                    jockeyName:     h.jockeyName,
                    finishPosition: h.finishPosition,
                    finishTime:     h.finishTime,
                })),
        });

        console.log(`[Sim] Race ${raceRoundId} finalised — all horses finished.`);
    } catch (err) {
        console.error('[Sim] Error finalising race:', err);
    }
}

// ── Public API ─────────────────────────────────────────────────────────────────

async function initializeSimulation(raceRoundId, io) {
    stopSimulation(raceRoundId); // clean up any leftover

    const raceRound = await RaceRound.findById(raceRoundId).lean();
    if (!raceRound) throw new Error(`Race round ${raceRoundId} not found`);

    const horses = await buildHorses(raceRoundId);
    if (horses.length === 0) {
        console.warn(`[Sim] No verified registrations for race ${raceRoundId} — skipping`);
        return;
    }

    const trackLength = raceRound.trackLength;
    const startTime   = Date.now();
    const state       = { horses, trackLength, startTime, finishCount: 0, interval: null };

    const interval = setInterval(async () => {
        const currentMs = Date.now() - startTime;
        const elapsed = Math.floor(currentMs / 1000);
        let highest   = 0;

        let finishedThisTick = [];

        for (const horse of state.horses) {
            if (horse.isFinished) {
                if (horse.currentDistance > highest) highest = horse.currentDistance;
                continue;
            }

            const tick = simulateTick(horse, trackLength);
            horse.currentDistance = tick.currentDistance;
            horse.currentSpeed    = tick.currentSpeed;

            if (tick.isFinished) {
                horse.isFinished = true;
                // currentMs is roughly the end of this tick. 
                // We subtract 1000ms to get the start of the tick, then add the fractional time.
                const exactMs = Math.max(0, (currentMs - 1000) + (tick.finishFraction * 1000));
                finishedThisTick.push({ horse, exactMs });
            }

            if (horse.currentDistance > highest) highest = horse.currentDistance;
        }

        if (finishedThisTick.length > 0) {
            // Sort horses that finished in this same tick by their exact fractional finish time
            finishedThisTick.sort((a, b) => a.exactMs - b.exactMs);
            for (const { horse, exactMs } of finishedThisTick) {
                state.finishCount += 1;
                horse.finishPosition = state.finishCount;
                horse.finishTime = formatTime(exactMs);
                
                // Save this individual horse's result immediately without awaiting
                saveHorseResult(raceRound, horse);
            }
        }

        const lineMark = Math.min(computeLineMark(highest), trackLength);

        io.to(`race:${raceRoundId}`).emit('race_update', {
            raceRoundId,
            elapsedSeconds: elapsed,
            lineMark,
            trackLength,
            horses: state.horses.map(h => ({
                registrationId:  h.registrationId,
                number:          h.number,
                horseName:       h.horseName,
                jockeyName:      h.jockeyName,
                raceStyle:       h.raceStyle,
                currentDistance: parseFloat(h.currentDistance.toFixed(2)),
                currentSpeed:    parseFloat(h.currentSpeed.toFixed(2)),
                isFinished:      h.isFinished,
                finishPosition:  h.finishPosition,
                finishTime:      h.finishTime,
            })),
        });

        if (state.finishCount >= state.horses.length) {
            clearInterval(state.interval);
            activeRaces.delete(raceRoundId);
            await finalizeRace(raceRoundId, state.horses, io);
        }
    }, 1000);

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
        trackLength:    state.trackLength,
        elapsedSeconds: Math.floor((Date.now() - state.startTime) / 1000),
        finishCount:    state.finishCount,
        horses:         state.horses.map(h => ({
            registrationId:  h.registrationId,
            number:          h.number,
            horseName:       h.horseName,
            raceStyle:       h.raceStyle,
            currentDistance: parseFloat(h.currentDistance.toFixed(2)),
            currentSpeed:    parseFloat(h.currentSpeed.toFixed(2)),
            isFinished:      h.isFinished,
            finishPosition:  h.finishPosition,
            finishTime:      h.finishTime,
        })),
    };
}

module.exports = { initializeSimulation, stopSimulation, getSimulationState };
