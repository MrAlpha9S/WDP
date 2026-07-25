import apiClient, { isNetworkError, NETWORK_ERROR_MESSAGE } from './axios';

// ─── Schedule types ──────────────────────────────────────────────────────────

export interface ScheduleRaceRound {
  raceRoundId: string;
  roundName: string;
  raceDate: string;
  trackLength: number;
  location: string;
  address: string;
  raceGround: string;
  maxParticipants: number;
  status: string;
  requireEntranceFees: number;
}

export interface ScheduleItem {
  invitationId: string;
  isBackup: boolean;
  percentagePayout: number;
  bookingFees: number;
  horse: {
    horseId: string;
    horseName: string;
    breed: string;
    healthStatus: string;
  } | null;
  registration: { registrationId: string } | null;
  horseOwner: { ownerId: string; user: { fullName: string } | null } | null;
  raceRound: ScheduleRaceRound | null;
  tournament: { tournamentName: string; startDate: string; endDate: string } | null;
}

// ─── Invitation types ────────────────────────────────────────────────────────

export interface InvitationItem {
  invitationId: string;
  invitationStatus: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'didNotAttend';
  ownerConfirmation: boolean;
  jockeyConfirmation: boolean;
  isBackup: boolean;
  percentagePayout: number;
  bookingFees: number;
  horse: {
    horseId: string;
    horseName: string;
    breed: string;
    gender: string;
  } | null;
  registration: {
    registrationId: string;
    registrationStatus: string;
    registeredAt: string;
  } | null;
  horseOwner: {
    ownerId: string;
    user: { fullName: string; phoneNumber: string } | null;
  } | null;
  raceRound: {
    raceRoundId: string;
    roundName: string;
    raceDate: string | null;
    trackLength: number;
    location: string;
    raceGround: string;
    status: string;
    minimalRidingFees: number;
  } | null;
  tournament: { tournamentId: string; tournamentName: string } | null;
}

// ─── API calls ───────────────────────────────────────────────────────────────

export async function getMyRaceSchedule(): Promise<ScheduleItem[]> {
  try {
    const res = await apiClient.get<{ code: number; data: ScheduleItem[]; msg: string }>(
      '/api/jockey/my-race-schedule'
    );
    return res.data.code === 200 ? (res.data.data ?? []) : [];
  } catch (err: any) {
    if (isNetworkError(err)) throw err;
    return [];
  }
}

export async function getMyInvitations(): Promise<InvitationItem[]> {
  try {
    const res = await apiClient.get<{ code: number; data: InvitationItem[]; msg: string }>(
      '/api/jockey/my-invitations'
    );
    return res.data.code === 200 ? (res.data.data ?? []) : [];
  } catch (err: any) {
    if (isNetworkError(err)) throw err;
    return [];
  }
}

export async function respondToInvitation(
  invitationId: string,
  action: 'accepted' | 'rejected'
): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await apiClient.put<{ code: number; msg: string }>(
      `/api/jockey/invitation/${invitationId}/respond`,
      { jockeyConfirmation: action }
    );
    return { ok: res.data.code === 200, message: res.data.msg };
  } catch (err: any) {
    return {
      ok: false,
      message: err?.response?.data?.msg ?? (isNetworkError(err) ? NETWORK_ERROR_MESSAGE : 'Connection error. Please try again.'),
    };
  }
}

// ─── Payment types ───────────────────────────────────────────────────────────
// Payer/payee payment-verification model — shared across roles on the backend
// (Transaction-backed). Jockey is always the payee (never pays), matching
// the web app's refereeService.ts equivalent.

export type PaymentStatus = 'unpaid' | 'processing' | 'paid';

export interface PaymentEntity {
  _id: string;
  paymentType: 'race_prize' | 'referee_fee' | 'jockey_payout';
  payerRole: 'admin' | 'horseowner' | 'referee' | 'jockey';
  payerId: string;
  payerName: string | null;
  payeeRole: 'admin' | 'horseowner' | 'referee' | 'jockey';
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
  originalAmount: number | null;
  originalCurrency: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

// ─── Payment API calls ───────────────────────────────────────────────────────

export async function getMyPayments(
  page = 1,
  limit = 10,
  status?: PaymentStatus
): Promise<{ items: PaymentEntity[]; pagination: PaginationMeta }> {
  const empty = { items: [], pagination: { totalItems: 0, totalPages: 0, currentPage: page, limit } };
  try {
    const params: Record<string, unknown> = { page, limit, direction: 'payee' };
    if (status) params.status = status;
    const res = await apiClient.get<{
      code: number;
      data: { items: PaymentEntity[]; pagination: PaginationMeta };
      msg: string;
    }>('/api/jockey/payments', { params });
    return res.data.code === 200 ? res.data.data : empty;
  } catch (err: any) {
    if (isNetworkError(err)) throw err;
    return empty;
  }
}

export async function confirmPaymentReceived(
  paymentId: string
): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await apiClient.put<{ code: number; msg: string }>(
      `/api/jockey/payments/${paymentId}/confirm-received`
    );
    return { ok: res.data.code === 200, message: res.data.msg };
  } catch (err: any) {
    return {
      ok: false,
      message: err?.response?.data?.msg ?? (isNetworkError(err) ? NETWORK_ERROR_MESSAGE : 'Connection error. Please try again.'),
    };
  }
}

// ─── Profile types ────────────────────────────────────────────────────────────
// Mirrors the web's horseOwnerService.ts JockeyProfileData — same backend
// response (HorseOwnerService.getJockeyProfile), just reused for self-view.

export interface JockeyProfileData {
  jockey: {
    _id: string;
    matchesRaced: number;
    totalWins: number;
    rank: number | null;
    totalJockeys: number;
    licenseStatus: string;
    licenseLink: string | null;
    status: string;
    weight: number;
    height: number;
    bookingFee: number;
    fullName: string;
    phoneNumber: string | null;
    address: string | null;
    image: string | null;
    dateOfBirth: string;
  };
  stats: {
    totalRaces: number;
    wins: number;
    winRate: number;
    totalPrize: number;
  };
  recentRaces: {
    race: string;
    position: string;
    horse: string;
    date: string;
    attendance?: 'no_show' | 'main' | 'backup';
    bookingFees: number;
  }[];
  violations: {
    _id: string;
    raceRound: { _id: string; roundName?: string; raceDate?: string } | null;
    violationType: { violationName: string; category?: string; severity?: string; defaultPenalty?: string } | null;
    description: string;
    severity: string;
    actualPenalty?: string;
    stewardAction: 'no-action' | 'warning' | 'fine' | 'suspended' | 'disqualified' | 'demoted' | 'investigation' | 'permanent-ban';
    violationStatus: 'pending' | 'confirmed' | 'dismissed';
  }[];
}

export async function getMyProfile(): Promise<JockeyProfileData | null> {
  try {
    const res = await apiClient.get<{ code: number; data: JockeyProfileData; msg: string }>(
      '/api/jockey/my-profile'
    );
    return res.data.code === 200 ? res.data.data : null;
  } catch (err: any) {
    if (isNetworkError(err)) throw err;
    return null;
  }
}

export interface UpdateJockeyProfilePayload {
  bookingFee?: number;
  weight?: number;
  height?: number;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  /** ISO date string, e.g. '1998-04-12'. */
  dateOfBirth?: string;
}

export async function updateMyProfile(
  payload: UpdateJockeyProfilePayload
): Promise<{ ok: boolean; message: string; data: JockeyProfileData | null }> {
  try {
    const res = await apiClient.put<{ code: number; data: JockeyProfileData; msg: string }>(
      '/api/jockey/my-profile',
      payload
    );
    return {
      ok: res.data.code === 200,
      message: res.data.msg,
      data: res.data.code === 200 ? res.data.data : null,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: err?.response?.data?.msg ?? (isNetworkError(err) ? NETWORK_ERROR_MESSAGE : 'Connection error. Please try again.'),
      data: null,
    };
  }
}

export async function updateMyLicense(
  license: { uri: string; name: string; mimeType: string }
): Promise<{ ok: boolean; message: string; data: JockeyProfileData | null }> {
  try {
    const form = new FormData();
    form.append('license', {
      uri: license.uri,
      name: license.name,
      type: license.mimeType,
    } as any);
    const res = await apiClient.put<{ code: number; data: JockeyProfileData; msg: string }>(
      '/api/jockey/my-profile/license',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return {
      ok: res.data.code === 200,
      message: res.data.msg,
      data: res.data.code === 200 ? res.data.data : null,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: err?.response?.data?.msg ?? (isNetworkError(err) ? NETWORK_ERROR_MESSAGE : 'Connection error. Please try again.'),
      data: null,
    };
  }
}

// ─── Statistics ───────────────────────────────────────────────────────────────

export interface JockeyStatistics {
  wallet: number;
  matchesRaced: number;
  totalWins: number;
  winRate: number;
  rank: number | null;
  totalJockeys: number;
  totalPayoutsEarned: number;
  pendingPayoutsAmount: number;
  invitations: { pending: number; accepted: number; declined: number; cancelled: number; noShow: number };
  byRole: { main: { count: number; earnings: number }; backup: { count: number; earnings: number } };
}

export interface EarningsSeries {
  totalPayoutsEarned: number;
  series: { date: string; payoutsEarned: number }[];
}

export async function getJockeyStatistics(): Promise<JockeyStatistics | null> {
  try {
    const res = await apiClient.get<{ code: number; data: JockeyStatistics; msg: string }>(
      '/api/jockey/statistics'
    );
    return res.data.code === 200 ? res.data.data : null;
  } catch (err: any) {
    if (isNetworkError(err)) throw err;
    return null;
  }
}

export async function getEarningsSeries(
  groupBy: 'day' | 'week' | 'month' | 'year' = 'day',
): Promise<EarningsSeries | null> {
  try {
    const res = await apiClient.get<{ code: number; data: EarningsSeries; msg: string }>(
      '/api/jockey/statistics/earnings-series',
      { params: { groupBy } },
    );
    return res.data.code === 200 ? res.data.data : null;
  } catch (err: any) {
    if (isNetworkError(err)) throw err;
    return null;
  }
}

// ─── All-races types ─────────────────────────────────────────────────────────
// Mirrors spectatorApi.ts's RaceScheduleItem/ScheduleFilter — same backend
// query (SpectatorService._listAllRaceRounds), reused so jockeys can browse
// every race round like admin does.

export interface RaceScheduleItem {
  _id: string;
  roundName: string;
  raceDate: string;
  trackLength: number | null;
  location: string;
  address: string | null;
  raceGround: string | null;
  status: string;
  maxParticipants: number | null;
  requireEntranceFees: number | null;
  minimalRidingFees: number | null;
  currentParticipants: number;
  tournament: {
    _id: string;
    tournamentName: string;
    startDate: string;
    endDate: string;
    prizePool: number | null;
  } | null;
}

export type ScheduleFilter = 'running' | 'scheduled' | 'prepared' | 'completed';

export async function getAllRaces(
  filter?: ScheduleFilter,
  page = 1,
  limit = 20
): Promise<{ raceRounds: RaceScheduleItem[]; meta: { total: number; hasMore: boolean } }> {
  const empty = { raceRounds: [], meta: { total: 0, hasMore: false } };
  try {
    const res = await apiClient.get<{
      code: number;
      data: { raceRounds: RaceScheduleItem[]; meta: { total: number; hasMore: boolean; page: number; limit: number } };
      msg: string;
    }>('/api/jockey/all-races', { params: { filter, page, limit } });
    return res.data.code === 200 ? res.data.data : empty;
  } catch (err: any) {
    if (isNetworkError(err)) throw err;
    return empty;
  }
}
