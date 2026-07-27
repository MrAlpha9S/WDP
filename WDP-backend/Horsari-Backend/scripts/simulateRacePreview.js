// Dev-only tool — NOT wired into the app. Runs the race tick engine against
// hand-built mock horses (no DB) to eyeball the pacing/interaction mechanics
// (stamina recovery, blocking/drafting, pace-shape kick boost) added to
// SimulationService.js, without needing a live race round.
//
// Usage: node scripts/simulateRacePreview.js [scenario]
//   scenario: "mixed" (default) | "hotPace" | "softPace"

const { simulateTick } = require('../services/SimulationService');

const TRACK_LENGTH = 1200; // m
const TICKS = 1500;        // ~150s at TICK_MS=100 in the real engine

function statToMaxSpeed(speed) {
    return 0.6 + (speed / 100) * 1.1;
}
function statToStamina(stamina) {
    return 300 + (stamina / 100) * 1700;
}
function randomStat(min, max) {
    return Math.round(min + Math.random() * (max - min));
}
function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

function makeHorse(number, style, statMin, statMax) {
    const speed = randomStat(statMin, statMax);
    const stamina = randomStat(statMin, statMax);
    const accel = randomStat(statMin, statMax);
    const maxSpeed = statToMaxSpeed(speed);

    let initialSpeed;
    if (style === 'Runner') initialSpeed = randomBetween(maxSpeed * 0.88, maxSpeed);
    else if (style === 'Pace') initialSpeed = randomBetween(maxSpeed * 0.78, maxSpeed * 0.88);
    else if (style === 'Late') initialSpeed = randomBetween(maxSpeed * 0.60, maxSpeed * 0.75);
    else if (style === 'LateSurger') initialSpeed = randomBetween(maxSpeed * 0.42, maxSpeed * 0.55);
    else initialSpeed = randomBetween(maxSpeed * 0.54, maxSpeed * 0.68);

    const initialStaminaPool = statToStamina(stamina);

    return {
        registrationId: `mock-${number}`,
        number,
        horseName: `#${number} (${style})`,
        jockeyName: 'Mock Jockey',
        speed,
        stamina,
        accel,
        raceStyle: style,
        currentDistance: 0,
        currentSpeed: initialSpeed,
        staminaPool: initialStaminaPool,
        initialStaminaPool,
        isFinished: false,
        finishPosition: null,
        finishTime: null,
        _lastTargetMPerTick: 0,
        hasKicked: false,
        paceMultiplier: 1.0,
    };
}

// "hotPace": mostly Runner/Pace (field burns out early) — should let the lone
// Closer/LateSurger's kick pay off big.
// "softPace": mostly held-up styles (no one presses the pace) — front-runners
// should hold on better; the closer's kick boost should be small.
function buildField(scenario) {
    const [statMin, statMax] = [70, 80]; // 'high' intensity band
    if (scenario === 'hotPace') {
        return [
            makeHorse(1, 'Runner', statMin, statMax),
            makeHorse(2, 'Runner', statMin, statMax),
            makeHorse(3, 'Pace', statMin, statMax),
            makeHorse(4, 'Pace', statMin, statMax),
            makeHorse(5, 'Closer', statMin, statMax),
        ];
    }
    if (scenario === 'softPace') {
        return [
            makeHorse(1, 'Late', statMin, statMax),
            makeHorse(2, 'Late', statMin, statMax),
            makeHorse(3, 'LateSurger', statMin, statMax),
            makeHorse(4, 'LateSurger', statMin, statMax),
            makeHorse(5, 'Closer', statMin, statMax),
        ];
    }
    // "mixed" — all 5 styles across both intensity bands
    const styles = ['Runner', 'Pace', 'Late', 'LateSurger', 'Closer'];
    const horses = [];
    let n = 1;
    for (const [bandMin, bandMax] of [[50, 60], [70, 80]]) {
        for (const style of styles) {
            horses.push(makeHorse(n++, style, bandMin, bandMax));
        }
    }
    return horses;
}

function runRace(scenario) {
    const horses = buildField(scenario);
    const rows = []; // sampled every 50 ticks for the printed table
    let blockedCount = 0, draftingCount = 0, recoveringCount = 0, totalSamples = 0;

    for (let tick = 0; tick < TICKS; tick++) {
        const fieldSnapshot = horses.map(h => ({
            number: h.number,
            currentDistance: h.currentDistance,
            lastTargetMPerTick: h._lastTargetMPerTick,
            staminaRatio: h.staminaPool / h.initialStaminaPool,
            isFinished: h.isFinished,
        }));

        for (const horse of horses) {
            if (horse.isFinished) continue;
            const result = simulateTick(horse, TRACK_LENGTH, fieldSnapshot);
            horse.currentDistance = result.currentDistance;
            horse.currentSpeed = result.currentSpeed;
            horse._lastTargetMPerTick = result.targetMPerTick;
            if (result.isBlocked) blockedCount++;
            if (result.isDrafting) draftingCount++;
            if (result.recovering) recoveringCount++;
            totalSamples++;
            if (result.isFinished && !horse.finishPosition) {
                horse.isFinished = true;
                horse.finishPosition = horses.filter(h => h.finishPosition).length + 1;
                horse.finishTick = tick;
            }
        }

        if (tick % 50 === 0) {
            rows.push(horses.map(h => ({
                tick,
                horse: h.horseName,
                dist: h.currentDistance.toFixed(1),
                speed: h.currentSpeed.toFixed(2),
                staminaRatio: (h.staminaPool / h.initialStaminaPool).toFixed(2),
                kicked: h.hasKicked,
                kickBoost: h.paceMultiplier.toFixed(2),
            })));
        }

        if (horses.every(h => h.isFinished)) break;
    }

    console.log(`\n=== Scenario: ${scenario} ===`);
    console.log('Finish order:', horses
        .filter(h => h.finishPosition)
        .sort((a, b) => a.finishPosition - b.finishPosition)
        .map(h => `${h.horseName} (tick ${h.finishTick}, kickBoost ${h.paceMultiplier.toFixed(2)})`)
        .join(' | '));
    console.log(`Interaction rates over ${totalSamples} horse-ticks: blocked ${(100 * blockedCount / totalSamples).toFixed(1)}%, drafting ${(100 * draftingCount / totalSamples).toFixed(1)}%, recovering ${(100 * recoveringCount / totalSamples).toFixed(1)}%`);

    // Print a stamina-ratio curve sample per horse every ~200 ticks to eyeball the recovery hump.
    console.log('Stamina-ratio samples (every ~200 ticks):');
    for (const h of horses) {
        const samples = rows
            .filter((_, i) => i % 4 === 0)
            .map(r => r.find(x => x.horse === h.horseName)?.staminaRatio)
            .filter(Boolean);
        console.log(`  ${h.horseName}: ${samples.join(' -> ')}`);
    }
}

const scenario = process.argv[2] || 'mixed';
runRace(scenario);
