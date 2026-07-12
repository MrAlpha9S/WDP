// Shared Payment types — statistical wallet tracking only, real payment happens
// outside the system. Used by adminService.ts, horseOwnerService.ts, and
// refereeService.ts, which each expose role-scoped confirm/list endpoints
// over the same backend Transaction-backed payment-verification rows.

export type PaymentType = 'race_prize' | 'referee_fee' | 'jockey_payout';
export type PaymentRole = 'admin' | 'horseowner' | 'referee' | 'jockey';
export type PaymentStatus = 'unpaid' | 'processing' | 'paid';

export interface PaymentEntity {
  _id: string;
  paymentType: PaymentType;
  payerRole: PaymentRole;
  payerId: string;
  payerName: string | null;
  payeeRole: PaymentRole;
  payeeId: string;
  payeeName: string | null;
  amount: number;
  sourceType: 'RaceResult' | 'RaceReferee' | 'Invitation';
  sourceId: string;
  raceRoundId: string;
  payerConfirmed: boolean;
  payerConfirmedAt: string | null;
  payeeConfirmed: boolean;
  payeeConfirmedAt: string | null;
  paymentStatus: PaymentStatus;
  /** Raw amount + currency the race round was denominated in before conversion — `amount` above is always the converted VND value. */
  originalAmount: number | null;
  originalCurrency: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentsResponse {
  code: number;
  data: {
    items: PaymentEntity[];
    pagination: { totalItems: number; totalPages: number; currentPage: number; limit: number };
  };
  msg: string;
}

// Wallet-ledger entries (deposits/withdrawals/rewards/refunds) — distinct from
// PaymentEntity, which models the payer/payee payment-verification flow.
export interface LedgerEntry {
  _id: string;
  transactionType: 'reward' | 'deposit' | 'withdrawal' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string | null;
  createdAt: string;
  /** Only populated on the system-wide "all ledger" view — the wallet owner's name/role (e.g. spectator prediction payouts, admin house-take). */
  userName?: string | null;
  userRole?: string | null;
}

export interface LedgerResponse {
  code: number;
  data: {
    items: LedgerEntry[];
    pagination: { totalItems: number; totalPages: number; currentPage: number; limit: number };
  };
  msg: string;
}
