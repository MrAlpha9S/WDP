import apiClient from './axios';

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface SpectatorProfile {
  spectator: { _id: string; wallet: number };
  user: {
    fullName: string;
    username: string;
    email: string;
    dateOfBirth: string | null;
    phoneNumber: string | null;
    image: string | null;
    address: string | null;
    status: string;
  };
  stats: { totalPredictions: number; totalCorrectPredictions: number; winRate: number };
}

// ─── Home Feed ────────────────────────────────────────────────────────────────

export interface LiveRaceRegistration {
  _id: string;
  laneNumber: number | null;
  horse: { _id: string; horseName: string; img: string | null } | null;
}

export interface HomeFeedLiveRace {
  _id: string;
  roundName: string;
  raceDate: string;
  location: string;
  status: string;
  livestreamUrl: string | null;
  tournament: { _id: string; tournamentName: string } | null;
  registrations: LiveRaceRegistration[];
}

export interface HomeFeedUpcomingRace {
  _id: string;
  roundName: string;
  raceDate: string;
  location: string;
  address: string | null;
  status: string;
  tournament: { _id: string; tournamentName: string; prizePool: number | null } | null;
}

export interface HomeFeedHorse {
  _id: string;
  horseName: string;
  img: string | null;
  healthStatus: string | null;
  totalRaces: number;
  totalWins: number;
  winRate: number;
}

export interface HomeFeed {
  liveRace: HomeFeedLiveRace | null;
  upcomingRaces: HomeFeedUpcomingRace[];
  featuredHorses: HomeFeedHorse[];
  spectator: { wallet: number } | null;
}

// ─── Race Schedule ────────────────────────────────────────────────────────────

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

// ─── Predictions ──────────────────────────────────────────────────────────────

export type PredictionStatus = 'pending' | 'correct' | 'incorrect' | 'cancelled' | 'refunded';
export type PredictionMethodType = 'tournament_champion' | 'race_rank' | 'race_winner';

export interface PredictionMethod {
  _id: string;
  methodName: string;
  methodDescription: string;
  methodType: PredictionMethodType;
  isActive: boolean;
  userAlreadyPredicted?: boolean;
  existingPredictions?: PredictionItem[];
}

export interface PredictionItem {
  _id: string;
  predictedRank: number | null;
  predictionStatus: PredictionStatus;
  rewardPoints: number;
  created_at: string;
  predictionMethod: {
    _id: string;
    methodName: string;
    methodDescription: string;
    methodType: PredictionMethodType;
  } | null;
  // race_rank / race_winner
  registration: {
    _id: string;
    laneNumber: number | null;
    horse: { _id: string; horseName: string; img: string | null } | null;
    raceRound: {
      _id: string;
      roundName: string;
      raceDate: string;
      location: string;
      status: string;
      tournament: { _id: string; tournamentName: string } | null;
    } | null;
  } | null;
  // tournament_champion
  tournament: { _id: string; tournamentName: string; status: string } | null;
  predictedHorse: { _id: string; horseName: string; img: string | null } | null;
}

// Input shapes for createPrediction
export type CreatePredictionBody =
  | { predictionMethodId: string; registrationId: string; predictedRank: number; rewardPoints: number }   // race_rank
  | { predictionMethodId: string; registrationId: string; rewardPoints: number }                           // race_winner
  | { predictionMethodId: string; tournamentId: string; predictedHorseId: string; rewardPoints: number }; // tournament_champion

// Payout info returned by getPredictionDetail
export interface PredictionPayoutInfo {
  methodType: string;
  // pending — live pool snapshot
  takeoutRate?: number;
  grossPool?: number;
  netPool?: number;
  stakeOnPredictedHorse?: number;
  totalBettors?: number;
  odds?: number;
  estimatedCollect?: number;
  // settled
  actualPayout?: number;
  refunded?: boolean;
}

export interface PredictionDetail extends PredictionItem {
  actualResult: Record<string, unknown> | null;
  payoutInfo: PredictionPayoutInfo | null;
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export interface WalletInfo {
  spectator: { _id: string; wallet: number };
  stats: { totalEarned: number };
}

export interface TransactionItem {
  _id: string;
  transactionType: 'reward' | 'deposit' | 'withdrawal' | 'refund';
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  description: string | null;
  createdAt: string;
}

// ─── Statistics ───────────────────────────────────────────────────────────────

export interface SpectatorStatistics {
  wallet: number;
  totalPredictions: number;
  correct: number;
  incorrect: number;
  pending: number;
  cancelled: number;
  refunded: number;
  /** Win rate over settled predictions only (correct / (correct + incorrect)). */
  winRate: number;
  totalRewardsEarned: number;
  totalStaked: number;
  netProfit: number;
  predictionsByMethodType: Partial<Record<PredictionMethodType, { count: number; pct: number }>>;
}

export interface RewardsEarningsSeries {
  totalRewardsEarned: number;
  series: { date: string; rewardsEarned: number }[];
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function getSpectatorProfile(): Promise<SpectatorProfile | null> {
  try {
    const res = await apiClient.get<{ code: number; data: SpectatorProfile; msg: string }>(
      '/api/spectator/profile'
    );
    return res.data.code === 200 ? res.data.data : null;
  } catch {
    return null;
  }
}

export async function getHomeFeed(): Promise<HomeFeed | null> {
  try {
    const res = await apiClient.get<{ code: number; data: HomeFeed; msg: string }>(
      '/api/spectator/home-feed'
    );
    return res.data.code === 200 ? res.data.data : null;
  } catch {
    return null;
  }
}

export async function getRaceSchedule(
  filter: ScheduleFilter = 'scheduled',
  page = 1,
  limit = 20
): Promise<{ raceRounds: RaceScheduleItem[]; meta: { total: number; hasMore: boolean } }> {
  try {
    const res = await apiClient.get<{
      code: number;
      data: {
        raceRounds: RaceScheduleItem[];
        meta: { total: number; hasMore: boolean; page: number; limit: number };
      };
      msg: string;
    }>('/api/spectator/race-schedule', { params: { filter, page, limit } });
    if (res.data.code === 200) return res.data.data;
    return { raceRounds: [], meta: { total: 0, hasMore: false } };
  } catch {
    return { raceRounds: [], meta: { total: 0, hasMore: false } };
  }
}

export async function getMyPredictions(
  predictionStatus = 'all',
  page = 1,
  limit = 20
): Promise<{ predictions: PredictionItem[]; meta: { total: number; hasMore: boolean } }> {
  try {
    const res = await apiClient.get<{
      code: number;
      data: {
        predictions: PredictionItem[];
        meta: { total: number; hasMore: boolean; page: number; limit: number };
      };
      msg: string;
    }>('/api/spectator/predictions', { params: { predictionStatus, page, limit } });
    if (res.data.code === 200) return res.data.data;
    return { predictions: [], meta: { total: 0, hasMore: false } };
  } catch {
    return { predictions: [], meta: { total: 0, hasMore: false } };
  }
}

export async function getWalletInfo(): Promise<WalletInfo | null> {
  try {
    const res = await apiClient.get<{ code: number; data: WalletInfo; msg: string }>(
      '/api/spectator/wallet'
    );
    return res.data.code === 200 ? res.data.data : null;
  } catch {
    return null;
  }
}

export async function getSpectatorStatistics(): Promise<SpectatorStatistics | null> {
  try {
    const res = await apiClient.get<{ code: number; data: SpectatorStatistics; msg: string }>(
      '/api/spectator/statistics'
    );
    return res.data.code === 200 ? res.data.data : null;
  } catch {
    return null;
  }
}

export async function getRewardsEarningsSeries(
  groupBy: 'day' | 'week' | 'month' | 'year' = 'day',
): Promise<RewardsEarningsSeries | null> {
  try {
    const res = await apiClient.get<{ code: number; data: RewardsEarningsSeries; msg: string }>(
      '/api/spectator/statistics/rewards-series',
      { params: { groupBy } },
    );
    return res.data.code === 200 ? res.data.data : null;
  } catch {
    return null;
  }
}

export async function getTransactionHistory(
  page = 1,
  limit = 20,
  transactionType?: TransactionItem['transactionType'],
): Promise<{ transactions: TransactionItem[]; meta: { total: number; hasMore: boolean } }> {
  try {
    const res = await apiClient.get<{
      code: number;
      data: {
        transactions: TransactionItem[];
        meta: { total: number; hasMore: boolean; page: number; limit: number };
      };
      msg: string;
    }>('/api/spectator/transactions', {
      params: { page, limit, ...(transactionType ? { transactionType } : {}) },
    });
    if (res.data.code === 200) return res.data.data;
    return { transactions: [], meta: { total: 0, hasMore: false } };
  } catch {
    return { transactions: [], meta: { total: 0, hasMore: false } };
  }
}

export async function depositPoints(
  amount: number,
  description?: string,
): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await apiClient.post<{ code: number; msg: string }>(
      '/api/spectator/transactions/deposit',
      { amount, description },
    );
    return { ok: res.data.code === 201, message: res.data.msg };
  } catch (err: any) {
    return { ok: false, message: err?.response?.data?.msg ?? 'Lỗi kết nối.' };
  }
}

export async function withdrawPoints(
  amount: number,
  description?: string,
): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await apiClient.post<{ code: number; msg: string }>(
      '/api/spectator/transactions/withdraw',
      { amount, description },
    );
    return { ok: res.data.code === 201, message: res.data.msg };
  } catch (err: any) {
    return { ok: false, message: err?.response?.data?.msg ?? 'Lỗi kết nối.' };
  }
}

export interface RaceDetailRegistration {
  _id: string;
  laneNumber: number | null;
  horse: { _id: string; horseName: string; img: string | null } | null;
  jockey?: { _id: string; fullName: string } | null;
  userPrediction: PredictionItem | null;
  raceResult?: { finishPosition: number; finishTime: string; distance?: number | null } | null;
}

export interface TournamentForPrediction {
  _id: string;
  tournamentName: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  prizePool: number | null;
  horses: { _id: string; horseName: string; img: string | null }[];
  alreadyPredicted: boolean;
}

export async function getTournamentsForPrediction(): Promise<TournamentForPrediction[]> {
  try {
    const res = await apiClient.get<{ code: number; data: TournamentForPrediction[]; msg: string }>(
      '/api/spectator/tournaments',
    );
    return res.data.code === 200 ? res.data.data : [];
  } catch {
    return [];
  }
}

export async function getRaceDetail(
  raceRoundId: string,
): Promise<{ raceRound: any; registrations: RaceDetailRegistration[]; userPredictions: PredictionItem[] } | null> {
  try {
    const res = await apiClient.get<{
      code: number;
      data: { raceRound: any; registrations: RaceDetailRegistration[]; userPredictions: PredictionItem[] };
      msg: string;
    }>(`/api/spectator/race-rounds/${raceRoundId}/live`);
    return res.data.code === 200 ? res.data.data : null;
  } catch {
    return null;
  }
}

export async function getAvailablePredictionMethods(
  raceRoundId?: string,
): Promise<PredictionMethod[]> {
  try {
    const params = raceRoundId ? { raceRoundId } : {};
    const res = await apiClient.get<{ code: number; data: PredictionMethod[]; msg: string }>(
      '/api/spectator/prediction-methods',
      { params },
    );
    return res.data.code === 200 ? res.data.data : [];
  } catch {
    return [];
  }
}

export async function createPrediction(
  body: CreatePredictionBody,
): Promise<{ ok: boolean; message: string; data?: PredictionItem }> {
  try {
    const res = await apiClient.post<{ code: number; data: PredictionItem; msg: string }>(
      '/api/spectator/predictions',
      body,
    );
    return { ok: res.data.code === 201, message: res.data.msg, data: res.data.data };
  } catch (err: any) {
    return { ok: false, message: err?.response?.data?.msg ?? 'Lỗi kết nối.' };
  }
}

export async function getPredictionDetail(predictionId: string): Promise<PredictionDetail | null> {
  try {
    const res = await apiClient.get<{ code: number; data: PredictionDetail; msg: string }>(
      `/api/spectator/predictions/${predictionId}`,
    );
    return res.data.code === 200 ? res.data.data : null;
  } catch {
    return null;
  }
}
