# Parimutuel Betting — Design Guide

Horsari uses **Parimutuel Betting**: there are no fixed reward values. Instead, all bets of
the same type on the same event form a pool, and winners share that pool in proportion to
their wager.

Configuration lives in one place: **`config/rewardConfig.js`**

---

## How Parimutuel Works

```
totalPool    = sum of all bet amounts in this pool
netPool      = totalPool × (1 - takeoutRate)
winningPool  = sum of amounts wagered by winners only

payout_i     = floor( (amount_i / winningPool) × netPool )
```

- **House take** (`takeoutRate`) is a fraction of the pool kept before paying winners.
  Currently all rates are `0` — set them when the economy is decided.
- If `winningPool === 0` (nobody bet on the winner), all bets are marked `incorrect`
  and the house retains the entire pool. No refunds.
- Payouts are floored to the nearest integer point.

---

## Bet Types & Win Conditions

| `methodType` | Win condition | Difficulty |
|---|---|---|
| `win` | Horse finishes **exactly 1st** | Medium |
| `place` | Horse finishes **1st or 2nd** | Easy |
| `show` | Horse finishes **1st, 2nd, or 3rd** | Easiest |
| `exacta` | Correct **1st AND 2nd** horse in exact order | Hardest |
| `champion` | Correct overall tournament champion | Hard |

Each bet type forms its own independent pool per race (or tournament for CHAMPION).

---

## Takeout Rates

Open `config/rewardConfig.js`:

```js
const PARIMUTUEL = {
  WIN:      { takeoutRate: 0 },   // ← set e.g. 0.15 for 15% house take
  PLACE:    { takeoutRate: 0 },
  SHOW:     { takeoutRate: 0 },
  EXACTA:   { takeoutRate: 0 },
  CHAMPION: { takeoutRate: 0 },
  MIN_BET: 10,                    // ← minimum wager in points
};
```

Restart the server after saving — no DB migration needed.

### Recommended starting values (industry reference)

| Bet type | Typical takeout | Rationale |
|---|---|---|
| WIN / PLACE / SHOW | 15–18% | Standard win-pool rate |
| EXACTA | 20–25% | Exotic bets carry higher margin |
| CHAMPION | 15–20% | Long-horizon bet, lower churn |

Leave at `0` during development; set before going live.

---

## Where Settlement Runs

| Trigger | Service method | Applies to |
|---|---|---|
| Admin confirms race result | `AdminService._settlePredictionsForRace` | WIN, PLACE, SHOW, EXACTA |
| Admin sets tournament champion | `AdminService.settleTournamentPredictions` | CHAMPION |

Predictions are grouped by `predictionMethodId` (the specific method document, not
`methodType`) so each group forms an independent pool. The winning spectator's `wallet`
is credited with their `payout` and `rewardPoints` on the prediction document is updated
to record the amount received.

---

## Bet Placement

- **Wallet deducted immediately** when a prediction is created (`SpectatorService.createPrediction`).
- If the user's wallet is below the bet amount the request is rejected with a 400 error.
- Minimum bet is `PARIMUTUEL.MIN_BET` (currently `10` points).

---

## Seed Data Note

`seeds/mockData.js` contains approximate `rewardPoints` values for sample settled
predictions. These are **calculated manually** to illustrate pool math (e.g. WIN pool round
1: 100+50+60+80=290, sole winner gets 290). They are **for development testing only** —
real payouts are computed at settlement time from the live pool.
