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
  payeeRole: PaymentRole;
  payeeId: string;
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
