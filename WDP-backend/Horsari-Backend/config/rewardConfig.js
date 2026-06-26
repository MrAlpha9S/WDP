/**
 * PARIMUTUEL BETTING CONFIGURATION
 * ============================================================
 * This system does NOT use fixed reward points.
 * All bets of the same type on the same event form a shared
 * pool. After the house takes its cut (takeoutRate), the net
 * pool is distributed among winners proportional to their
 * individual bet amount.
 *
 *   payout_i = (amount_i / winningPool) × netPool
 *   netPool  = totalPool × (1 − takeoutRate)
 *
 * See: docs/REWARD_POINTS_GUIDE.md for full design notes.
 * ============================================================
 */

const PARIMUTUEL = {
  // ── House takeout per bet type (0 → 1) ───────────────────
  // Adjust these once the economy is decided.
  // Example typical values:  WIN 0.15, EXACTA 0.20
  WIN:      { takeoutRate: 0 },
  PLACE:    { takeoutRate: 0 },
  SHOW:     { takeoutRate: 0 },
  EXACTA:   { takeoutRate: 0 },
  CHAMPION: { takeoutRate: 0 },

  // ── Minimum bet amount (in wallet points) ────────────────
  MIN_BET: 10,
};

module.exports = PARIMUTUEL;
