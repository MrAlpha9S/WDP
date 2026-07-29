# Race Simulation — How It Works

Source: [`services/SimulationService.js`](../services/SimulationService.js)

This document explains the horse-race simulation engine: how a race is set up, how each
horse's position is computed tick by tick, and what happens when the race ends.

## 1. Lifecycle

| Step | Function | Trigger |
|---|---|---|
| Start | `initializeSimulation(raceRoundId, io)` | `AdminService` sets a race round's status to `running` ([AdminService.js:1472](../services/AdminService.js#L1472)) |
| Tick | internal `setInterval` callback | every `TICK_MS` (100 ms → 10 updates/sec) while the race runs |
| Finish | `finalizeRace(...)` | fires once every horse has crossed the line |
| Stop (abort) | `stopSimulation(raceRoundId)` | called defensively at the start of `initializeSimulation`, and available for admin cancellation flows |
| Poll snapshot | `getSimulationState(raceRoundId)` | `AdminService.getSimulationState` ([AdminService.js:2022](../services/AdminService.js#L2022)), used for reconnect/late-join clients |

All in-progress races live in a single in-memory `Map` (`activeRaces`, keyed by `raceRoundId`)
— there is no persistence of live race state; if the server restarts mid-race, that race's
live state is lost (final results are only written to the DB once the race finishes).

## 2. Setup phase

### 2.1 Intensity

Each race is randomly assigned one of two **intensity levels** (`pickIntensity`,
[SimulationService.js:17](../services/SimulationService.js#L17)), which sets the stat floor/ceiling every horse in
that race is drawn from:

| Intensity | Stat range | Analogue |
|---|---|---|
| `medium` | 50–60 | claiming / allowance race |
| `high` | 70–80 | stakes race |

### 2.2 Horses

`buildHorses(raceRoundId, intensity)` ([SimulationService.js:252](../services/SimulationService.js#L252)) builds one horse
object per **verified** `Registration` for the race round:

- Looks up horse name / jockey name via `Invitation` → `Horse` / `Jockey` → `User`.
- Rolls three stats — `speed`, `stamina`, `accel` — each a random integer within the
  race's intensity band.
- Assigns a random **race style** (see §3) from `['Runner', 'Pace', 'Late', 'LateSurger', 'Closer']`.
- Converts `speed` → `maxSpeed` and picks a starting speed as a style-specific fraction of
  `maxSpeed` (e.g. a `Runner` starts at 88–100% of max speed; a `LateSurger` starts at only
  42–55%).
- Converts `stamina` → a stamina pool (`statToStamina`, 300–2000 units) that the horse
  spends over the course of the race.

## 3. Race styles ("pace shapes")

Each tick, a horse's *intended* speed and stamina drain rate are decided by its style
(`simulateTick`, [SimulationService.js:92](../services/SimulationService.js#L92)):

| Style | Early behavior | Late behavior | Drain rate |
|---|---|---|---|
| **Runner** | Sprints near max speed (~93%) the whole race | — | 1.30 (highest — pays for speed constantly) |
| **Pace** | Steady ~82% of max speed | — | 1.00 (balanced baseline) |
| **Late** | Conservative, ~65% of max speed | Kicks to ~97%+ after 58% of track | 0.75 early → 1.10 after kick |
| **LateSurger** | Very slow, ~60% of max speed | Escalating surge (102%→112% of max speed) after 65% of track | 0.38 early → 1.35 during surge |
| **Closer** | Smooth ramp starting at 60% of max speed | Ramps up to 95% by the finish | 0.65 → 1.10, scales with race progress |

Random per-tick variance is layered on top of the intended speed, scaled by the horse's
`accel` stat (`statToAccelRange`).

### Kick payoff ("pace makes the race")

`Late`, `LateSurger`, and `Closer` horses have a **kick point** — a fixed distance into the
race where their behavior changes. The very first tick a horse reaches its kick point,
`pickUpKickBoost` ([SimulationService.js:230](../services/SimulationService.js#L230)) samples how depleted the *rest of the
field's* stamina pools already are, and freezes a `paceMultiplier` (up to +30% at full clamp)
for the remainder of the race. A race run at a hot early pace (rivals already drained) pays
off late-running horses more; a slow, saved-up field blunts the kick. This is sampled once
and never re-evaluated.

## 4. Stamina model (W'-balance-style)

Every horse carries a **stamina pool** that drains or recovers each tick depending on
whether its current target speed is above or below its **critical speed**
(`maxSpeed × 0.70`):

- **Above critical speed:** drains proportional to `(actualSpeed / maxSpeed)^1.8 × styleDrainRate`.
  Drain is computed on the *actual* (possibly already-capped) speed, so an already-tired,
  already-slow horse doesn't spiral into draining itself to zero.
- **Below critical speed:** recovers, faster the further below critical speed the horse is
  running (a linear stand-in for the real exponential W'-balance recovery curve). This
  recovery is not free — a small baseline cost (`BASELINE_DRAIN_FACTOR`) is paid every tick
  regardless of speed, so a horse can no longer sit indefinitely at 100% stamina; recovery
  only partially offsets that cost.
- **Stamina cap:** once the pool drops below 25%, a hard speed ceiling kicks in, linearly
  tightening from 90% of max speed (at 25% pool) down to the absolute floor `minSpeed`
  (at 0% pool, `maxSpeed × 0.35`) — this is what "hitting the wall" looks like.

This is a simplified stand-in for Skiba's real-world critical-power / W′-balance fatigue
model used in endurance sports science.

## 5. Horse-to-horse interaction

There's no lane/lateral dimension in this simulation, so traffic is abstracted purely via
distance bands and probability:

- **Blocking** — a horse within 1.2 m directly ahead (`BLOCK_WINDOW`) that is going slower
  caps the trailing horse's speed to ~102% of the blocker's, *unless* it rolls a per-tick
  pass chance (`15%` base + up to `+25%` bonus scaled by `accel`). A boxed horse is never
  permanently trapped — it's just probabilistically delayed tick by tick.
- **Drafting** — a horse 1.2–3.0 m behind (`DRAFT_WINDOW`) a faster horse that isn't blocked
  gets a 10% stamina-drain discount ("tucked in behind").

## 6. Finish detection

Each tick advances `currentDistance` by the tick's target speed (already in m/tick, no
extra `dt` scaling needed since `TICK_MS` is fixed). When `currentDistance` would cross
`trackLength`, the engine:

1. Computes `finishFraction` — how far through *this tick* the horse actually crossed the
   line — to interpolate an exact finish timestamp (`exactMs`) rather than snapping to
   the nearest 100 ms tick boundary.
2. Clamps `currentDistance` to exactly `trackLength`.
3. Collects all horses that finished in the same tick and sorts them by `exactMs` to assign
   `finishPosition` in the correct order even when multiple horses cross within one tick.

The interval loop keeps running, emitting a `race_update` socket event every tick, until
every horse has finished.

## 7. Finishing the race

Once `finishCount` reaches the field size, `finalizeRace` ([SimulationService.js:357](../services/SimulationService.js#L357)):

1. Computes each horse's **finishing distance** in lengths relative to the horse behind it
   (`gapSeconds / 0.2s per length`, rounded to the nearest ¼ length) — the last-place horse
   gets `0`.
2. Persists every horse's result to `RaceResult` via `saveHorseResult` (status
   `pending_confirmation` — an admin must later officially confirm results, which is a
   separate step from the simulation itself).
3. Emits `race_finished` with the sorted results, then flips the race round's status to
   `awaitingConfirmation` and emits `race_status_changed`.
4. Calls `checkTournamentChampion` (§8).

## 8. Tournament champion detection

After a race finishes, `checkTournamentChampion` ([SimulationService.js:413](../services/SimulationService.js#L413)) checks
whether this was the deciding race of a multi-round tournament:

- Skips tournaments with only one round (not a championship series).
- Only proceeds if the just-finished round is the **last** round by `raceDate`, and every
  earlier round is already `completed`.
- Walks every round's winning horse (`RaceResult` → `Registration` → `Invitation` → horse);
  if the **same horse won every round**, that horse is set as `Tournament.championHorseId`,
  a `tournament_champion` socket event fires, and `PayoutService.distributeTournamentPayouts`
  is triggered to settle champion-prediction payouts.

## 9. Socket events emitted

| Event | Room | When |
|---|---|---|
| `race_update` | `race:{raceRoundId}` | every tick — live positions/speeds/stamina for the race view |
| `race_finished` | `race:{raceRoundId}` | once, when the last horse crosses the line |
| `race_status_changed` | global | when status flips to `awaitingConfirmation` |
| `tournament_champion` | global | if this race decided a tournament champion |

## 10. Notes / non-obvious behavior

- **Race style is simulation-only output** — it's randomly assigned when the simulation
  starts and isn't a pre-race stat a user can see beforehand; it only becomes observable
  once the race is running (as reflected in `race_update`'s `raceStyle` field).
- Live simulation state is **in-memory only** (`activeRaces` Map) — restarting the backend
  process loses any race currently in progress.
- `simulateTick` is exported and used standalone by `scripts/simulateRacePreview.js` for
  offline/preview simulation runs outside the socket-driven live loop.
