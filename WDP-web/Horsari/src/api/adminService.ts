import api, { NETWORK_ERROR_MESSAGE } from './axios';
import type { TournamentDetailData, TournamentRankEntry } from '../shared/types/TournamentTypes';
import type { ViolationEntity, ViolationTypeEntity } from '../shared/types/ViolationTypes';
import type { PaymentEntity, PaymentStatus, PaymentType, PaymentsResponse, LedgerResponse } from './paymentTypes';
import type { SelfProfileResponse, UpdateSelfProfilePayload } from './profileTypes';

export interface RaceRegistration {
  _id: string;
  registrationStatus?: string;
  sum_prediction?: number;
  isJockeyInRace?: boolean;
  Horse?: { horseName: string } | null;
  Jockey?: { _id?: { fullName?: string } } | null;
  Owner?: { fullName?: string } | null;
  RaceResult?: any | null;
  prizePayment?: PaymentEntity | null;
  jockeyPayment?: PaymentEntity | null;
}

export interface RaceRefereeAssignment {
  refereeId: string;
  fullName: string | null;
  assignmentStatus: string;
  fee?: number;
  payment?: PaymentEntity | null;
}

/** The current (referee-scoped) caller's own RaceReferee assignment for a round — distinct from RaceRefereeAssignment, which is the admin's all-referees view. */
export interface MyRaceRefereeAssignment {
  _id: string;
  fee?: number;
  status?: string;
  paymentStatus?: string;
  assignedAt?: string;
}

export interface PoolHorseEntry {
  registrationId: string;
  horseName: string | null;
  totalStake: number;
  poolShare: number;
  odds: number;
  displayPayout: number;
}

export interface PredictionPool {
  methodType: 'race_winner' | 'race_rank';
  poolStatus: 'live' | 'settled' | 'refunded' | 'empty';
  takeoutRate: number;
  grossPool: number | null;
  netPool: number | null;
  houseEarning: number | null;
  totalBettors: number;
  // live only
  perHorse?: PoolHorseEntry[];
  // settled only
  totalPaidOut?: number;
  totalWinners?: number;
  totalLosers?: number;
  totalRefunded?: number;
}

export interface TrackEarnings {
  totalHouseEarning: number;
  byPool: { race_winner: number | null; race_rank: number | null };
}

export interface RaceRoundData {
  _id: string;
  tournamentId?: string;
  roundName: string;
  raceDate: string;
  location?: string;
  address?: string;
  status: string;
  maxParticipants?: number;
  trackLength?: number;
  raceType?: string;
  RaceType?: string;
  firstPlacePrize?: number;
  secondPlacePrize?: number;
  thirdPlacePrize?: number;
  currencyType?: string;
  Registration?: RaceRegistration[];
  Referee?: RaceRefereeAssignment[];
  RaceReferee?: MyRaceRefereeAssignment | null;
  predictionPools?: PredictionPool[];
  trackEarnings?: TrackEarnings;
}

export interface TournamentRaceData {
  T_id: string;
  Tournaments_name: string;
  Tournament_detail?: any;
  RaceRound: RaceRoundData[];
}

export interface RaceRoundsResponse {
  code: number;
  data: { items: RaceRoundData[]; pagination: { totalItems: number; totalPages: number; currentPage: number; limit: number } };
  msg: string;
}

export interface AdminStatistics {
  users: { countActive: number };
  horseOwners: { count: number; pending: number; approved: number };
  jockeys: { count: number; pending: number; approved: number };
  tournaments: { count: number; scheduled: number; ongoing: number };
  finance: {
    totalHorseOwnerWallets: number;
    totalJockeyWallets: number;
    totalRefereeWallets: number;
    mainAdminWallet: number;
  };
}

// ── Dashboard panel types ────────────────────────────────────────────────────

export interface DashboardKpi {
  users: { countActive: number };
  horseOwners: { count: number; pending: number; approved: number };
  jockeys: { count: number; pending: number; approved: number };
  tournaments: { count: number; scheduled: number; ongoing: number };
  finance: { mainAdminWallet: number };
  predictionPayouts: { totalPaidOut: number; totalWinnersPaid: number };
}

export interface HouseEarningSeries {
  date: string;
  houseEarning: number;
  payoutToWinners: number;
  grossPool: number;
}

export interface DashboardHouseEarnings {
  totalHouseEarning: number;
  totalPayoutToWinners: number;
  totalGrossPool: number;
  series: HouseEarningSeries[];
}

export interface DashboardTopHorse {
  horseId: string;
  horseName: string;
  img: string | null;
  totalEarnings: number;
  wins: number;
}

export interface DashboardTopJockey {
  jockeyId: string;
  fullName: string;
  totalEarnings: number;
  totalWins: number;
  matchesRaced: number;
  winRate: number | null;
}

export interface WinRateLeader {
  jockeyId: string;
  fullName: string;
  totalWins: number;
  matchesRaced: number;
  winRate: number;
}

export interface DashboardTopPerformers {
  topEarningHorses: DashboardTopHorse[];
  topEarningJockeys: DashboardTopJockey[];
  winRateLeaders: WinRateLeader[];
}

export interface PredictionMethodEntry {
  count: number;
  pct: number;
}

export interface MostPredictedHorse {
  horseId: string;
  horseName: string;
  img: string | null;
  totalPicks: number;
  actualWins: number;
  crowdAccuracy: number;
  isHot: boolean;
}

export interface DashboardPredictions {
  predictionMethods: Record<string, PredictionMethodEntry>;
  mostPredictedHorses: MostPredictedHorse[];
}

export interface SpectatorLeaderboardEntry {
  rank: number;
  spectatorId: string;
  fullName: string;
  total: number;
  correct: number;
  incorrect: number;
  winRate: number;
}

export interface DashboardSpectatorLeaderboard {
  spectatorLeaderboard: SpectatorLeaderboardEntry[];
}

export interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export type CountMap = Record<string, number>;

export interface ViolationTypeCount {
  violationTypeId: string;
  violationName: string;
  category: string | null;
  count: number;
}

export interface TopHorse {
  horseId: string;
  horseName: string;
  img: string | null;
  wins: number;
}

export interface TopJockey {
  jockeyId: string;
  fullName: string;
  totalWins: number;
}

export interface SystemStatistics {
  users: {
    total: number;
    byRole: CountMap;
    byStatus: CountMap;
  };
  licensing: {
    horseOwner: CountMap;
    jockey: CountMap;
    referee: CountMap;
  };
  horses: {
    total: number;
    byStatus: CountMap;
    byHealthStatus: CountMap;
  };
  tournaments: {
    total: number;
    byStatus: CountMap;
  };
  raceRounds: {
    total: number;
    byStatus: CountMap;
  };
  registrations: {
    total: number;
    byStatus: CountMap;
  };
  invitations: {
    total: number;
    byStatus: CountMap;
  };
  violations: {
    total: number;
    byStatus: CountMap;
    bySeverity: CountMap;
    topViolationTypes: ViolationTypeCount[];
  };
  predictions: {
    total: number;
    byStatus: CountMap;
    byMethodType: CountMap;
    totalRewardPointsPaid: number;
  };
  finance: {
    totalHorseOwnerWallets: number;
    totalJockeyWallets: number;
    totalRefereeWallets: number;
    mainAdminWallet: number;
    transactionsByType: Record<string, { count: number; total: number }>;
  };
  payments: {
    byStatus: Record<string, { count: number; total: number }>;
    byType: Record<string, { count: number; total: number }>;
  };
  topPerformers: {
    horses: TopHorse[];
    jockeys: TopJockey[];
  };
}

export interface SystemStatisticsResponse {
  code: number;
  data: SystemStatistics;
  msg: string;
}

export interface AdminUserListItem {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  role: string;
  status: string;
  dateOfBirth?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUsersResponse {
  code: number;
  data: { items: AdminUserListItem[]; pagination: PaginationMeta };
  msg: string;
}

export interface AdminUserDetailResponse {
  code: number;
  data: { user: AdminUserListItem; roleProfile: Record<string, unknown> };
  msg: string;
}

export interface HorseOwnerInvitationItem {
  registrationId: string;
  registrationAt: string;
  registrationStatus: string;
  raceRound: { raceRoundId: string; roundName: string; raceDate: string; maxParticipants: number; currentParticipants: number; status: string } | null;
  horse: { horseId: string; horseName: string } | null;
  invitations: { invitationsId: string; jockeyName: string; isBackup: boolean; isJockeyInRace: boolean; status: string }[];
  horseOwner: { ownerId: string; fullName: string | null } | null;
}

export interface HorseOwnerInvitationsResponse {
  code: number;
  data: { items: HorseOwnerInvitationItem[]; pagination: PaginationMeta };
  msg: string;
}

export interface RefereeInvitationItem {
  raceRefereeId: string;
  raceReferee: { status: string };
  raceRound: { raceRoundId: string; roundName: string; raceDate: string; status: string } | null;
  referee: { refereeId: string; user: { fullName: string } } | null;
}

export interface RefereeInvitationsResponse {
  code: number;
  data: { items: RefereeInvitationItem[]; pagination: PaginationMeta };
  msg: string;
}

export interface JockeyInvitationItem {
  registrationId: string | null;
  registration: { registrationAt: string; registrationStatus: string } | null;
  raceRound: { raceRoundId: string; roundName: string; raceDate: string; status: string } | null;
  horse: { horseId: string; horseName: string } | null;
  invitations: { invitationId: string; jockeyName: string; isBackup: boolean; isJockeyInRace: boolean; invitationStatus: string }[];
  jockey: { jockeyId: string; user: { fullName: string } } | null;
  status: string;
  invitationId: string;
  isBackup: boolean;
  isJockeyInRace: boolean;
}

export interface JockeyInvitationsResponse {
  code: number;
  data: { items: JockeyInvitationItem[]; pagination: PaginationMeta };
  msg: string;
}

export interface AdminTournamentListItem {
  tournament: Record<string, unknown>;
  priceTotalPool: number;
  raceRound: Record<string, unknown>[];
}

export interface AdminTournamentsResponse {
  code: number;
  data: { items: AdminTournamentListItem[]; pagination: PaginationMeta };
  msg: string;
}

export interface AdminTournamentStatsResponse {
  code: number;
  data: { live: number; upcoming: number; completed: number };
  msg: string;
}

export interface TournamentNameOption {
  _id: string;
  tournamentName: string;
}

export interface TournamentNamesResponse {
  code: number;
  data: TournamentNameOption[];
  msg: string;
}

export type CreateRaceTournamentOption = { _id: string; tournamentName?: string } & Record<string, unknown>;
export type CreateRaceEligibilityRuleOption = { _id: string; raceType?: string | null } & Record<string, unknown>;
export type CreateRaceRefereeOption = { _id: string } & Record<string, unknown>;

export interface CreateRaceMetadataResponse {
  code: number;
  data: {
    previousRaceTracks: { location: string; raceGround?: string; address?: string }[];
    tournaments: CreateRaceTournamentOption[];
    eligibilityRules: CreateRaceEligibilityRuleOption[];
    referees: CreateRaceRefereeOption[];
    owners: { _id: string; user: unknown; horses: Record<string, unknown>[] }[];
  };
  msg: string;
}

export interface CreateRaceRoundPayload {
  TournamentId: string;
  RaceRound: {
    roundName: string;
    raceDate: string;
    trackLength: number;
    maxParticipants: number;
    baseFee: number;
    housingFeePercentage?: number;
    raceGround: string;
    requireEntranceFees?: boolean;
    firstPlacePrize?: number;
    secondPlacePrize?: number;
    thirdPlacePrize?: number;
    currencyType?: string;
    location?: string;
    address?: string;
    eligibilityRuleId?: string;
  };
  HorseOwnerInvitation?: string[];
  RefereeInvitation?: { refereeId: string; fee?: number }[];
  overrideScheduleConflict?: boolean;
}

export interface UpdateRaceRoundPayload {
  TournamentId?: string;
  RaceRound?: Partial<CreateRaceRoundPayload['RaceRound']>;
  HorseOwnerInvitation?: string[];
  RefereeInvitation?: { refereeId: string; fee?: number }[];
  overrideScheduleConflict?: boolean;
}

export interface RaceRoundMutationResponse {
  code: number;
  data: { tournament: Record<string, unknown> | null; raceRound: RaceRoundData; registrations: Record<string, unknown>[]; raceReferees: Record<string, unknown>[] };
  msg: string;
}

export interface TournamentPayload {
  tournamentName: string;
  description: string;
  startDate: string;
  endDate: string;
  status?: 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

export interface TournamentEntity {
  _id: string;
  tournamentName: string;
  description?: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  prizePool: number;
  championHorseId: string | null;
}

export interface TournamentMutationResponse {
  code: number;
  data: TournamentEntity;
  msg: string;
}

export interface RaceEligibilityRule {
  _id: string;
  minAge: number | null;
  maxAge: number | null;
  minRacesRun: number;
  minRacesWon: number;
  requiredGender: "male" | "female" | null;
  requiredBreed: string | null;
  licenseRequired: boolean;
  requireNomination: boolean;
  isActive: boolean;
  raceType: string | null;
  create_at: string;
  updated_at: string;
}

export interface RulesResponse {
  code: number;
  data: { items: RaceEligibilityRule[]; pagination: PaginationMeta };
  msg: string;
}

export interface RuleMutationResponse {
  code: number;
  data: RaceEligibilityRule;
  msg: string;
}

export interface SimpleMsgResponse {
  code: number;
  data?: unknown;
  msg: string;
}

export interface StreamInfoResponse {
  code: number;
  data: { rtmpUrl?: string; streamKey?: string; playbackId?: string };
  msg: string;
}

export interface VodResponse {
  code: number;
  data: { vodPlaybackId?: string };
  msg: string;
}

export interface AdminHorseListItem {
  horseId: string;
  horseName: string;
  breed: string | null;
  gender: string | null;
  healthStatus: string;
  status: string;
  registrationDate: string | null;
  dateOfBirth: string | null;
  img: string | null;
  ownerId: string;
  ownerName: string | null;
  createdAt: string;
}

export interface AdminHorsesResponse {
  code: number;
  data: { items: AdminHorseListItem[]; pagination: PaginationMeta };
  msg: string;
}

export interface AdminHorseDetailResponse {
  code: number;
  data: {
    horse: Record<string, unknown>;
    owner: { ownerId: string | null; fullName: string | null; email: string | null };
    totalRaces: number;
    totalViolations: number;
    raceHistory: Record<string, unknown>[];
  };
  msg: string;
}

export interface ImportantEventsResponse {
  code: number;
  data: {
    pendingCertifications: Record<string, unknown>[];
    racesReadyToStart: Record<string, unknown>[];
    activeTournaments: Record<string, unknown>[];
    pendingRegistrations: Record<string, unknown>[];
  };
  msg: string;
}

export const adminService = {
  getMyProfile: async (): Promise<SelfProfileResponse> => {
    try {
      const response = await api.get('/admin/my-profile');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  updateMyProfile: async (payload: UpdateSelfProfilePayload): Promise<SelfProfileResponse> => {
    try {
      const response = await api.put('/admin/my-profile', payload);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  getStatistics: async (): Promise<{ code: number; data: AdminStatistics; msg: string }> => {
    try {
      const response = await api.get('/admin/statistics');
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  getSystemStatistics: async (): Promise<SystemStatisticsResponse> => {
    try {
      const response = await api.get('/admin/statistics/overview');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  // ── Dashboard panel endpoints (parallel-fetched, one per panel group) ──────

  getDashboardKpi: async (): Promise<{ code: number; data: DashboardKpi; msg: string }> => {
    try {
      const response = await api.get('/admin/statistics/dashboard/kpi');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  getDashboardHouseEarnings: async (groupBy: 'day' | 'week' | 'month' | 'year' = 'day'): Promise<{ code: number; data: DashboardHouseEarnings; msg: string }> => {
    try {
      const response = await api.get('/admin/statistics/dashboard/house-earnings', { params: { groupBy } });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  getDashboardTopPerformers: async (): Promise<{ code: number; data: DashboardTopPerformers; msg: string }> => {
    try {
      const response = await api.get('/admin/statistics/dashboard/top-performers');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  getDashboardPredictions: async (): Promise<{ code: number; data: DashboardPredictions; msg: string }> => {
    try {
      const response = await api.get('/admin/statistics/dashboard/predictions');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  getDashboardSpectatorLeaderboard: async (): Promise<{ code: number; data: DashboardSpectatorLeaderboard; msg: string }> => {
    try {
      const response = await api.get('/admin/statistics/dashboard/spectator-leaderboard');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  getAllUsers: async (
    role?: string,
    search?: string,
    limit: number = 10,
    skip: number = 0,
    sortBy = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ): Promise<AdminUsersResponse> => {
    try {
      const params: Record<string, unknown> = { limit, skip, sortBy, order };
      if (role && role !== 'All') params.role = role;
      if (search) params.search = search;
      const response = await api.get('/admin/users/all', { params });
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  getUsersDetail: async (userId: string): Promise<AdminUserDetailResponse> => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  getHorseOwnerInvitations: async (page: number = 1, limit: number = 5): Promise<HorseOwnerInvitationsResponse> => {
    try {
      const response = await api.get('/admin/horse-owner-invitations', {
        params: { page, limit }
      });
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  getRefereeInvitations: async (page: number = 1, limit: number = 5): Promise<RefereeInvitationsResponse> => {
    try {
      const response = await api.get('/admin/referee-invitations', {
        params: { page, limit }
      });
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  getJockeyInvitations: async (page: number = 1, limit: number = 5): Promise<JockeyInvitationsResponse> => {
    try {
      const response = await api.get('/admin/jockey-invitations', {
        params: { page, limit }
      });
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  // page/limit only apply when no date range is given — a date-range fetch
  // (calendar view) always returns every matching tournament unpaginated.
  getTournamentsWithDetails: async (
    page?: number,
    limit?: number,
    startDate?: string,
    endDate?: string,
    search?: string
  ): Promise<AdminTournamentsResponse> => {
    try {
      const params: any = {};
      if (page !== undefined) params.page = page;
      if (limit !== undefined) params.limit = limit;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (search) params.search = search;
      const response = await api.get('/admin/tournaments', { params });
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  // True counts across every tournament, unaffected by pagination/search.
  getTournamentStats: async (): Promise<AdminTournamentStatsResponse> => {
    try {
      const response = await api.get('/admin/tournaments/stats');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  /**
   * Lightweight { _id, tournamentName } list for every tournament, including the
   * "Non-tournament" placeholder that getTournamentsWithDetails/getTournamentStats
   * deliberately exclude — use this instead when resolving a race round's tournament
   * name for display, so a standalone race is labeled "Non-tournament" rather than
   * falling back to "Unknown Tournament".
   */
  getTournamentNames: async (): Promise<TournamentNamesResponse> => {
    try {
      const response = await api.get('/admin/tournaments/names');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  // Guarded status transition: blocks "completed" while rounds are unfinished,
  // cascade-cancels rounds when the tournament is cancelled.
  updateTournamentStatus: async (id: string, status: string): Promise<{ code: number; msg: string }> => {
    try {
      const response = await api.patch(`/admin/tournaments/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  getRaceRounds: async (
    tournament_id?: string | null,
    raceRound_id?: string | null,
    page = 1,
    limit = 10,
    status?: string,
    search?: string,
    sortBy = 'raceDate',
    order: 'asc' | 'desc' = 'desc',
    raceType?: string,
    /** "YYYY-MM-DD" Vietnam-calendar-day key — when given, returns every race round on that day (ignoring page/limit) instead of paging. See getRaceRoundDates for the day list this is meant to be driven by. */
    date?: string,
  ): Promise<RaceRoundsResponse> => {
    try {
      const params: any = { page, limit, sortBy, order };
      if (tournament_id) params.tournament_id = tournament_id;
      if (raceRound_id) params.raceRound_id = raceRound_id;
      if (status) params.status = status;
      if (search) params.search = search;
      if (raceType) params.raceType = raceType;
      if (date) params.date = date;
      const response = await api.get('/admin/race-rounds', { params });
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  // Distinct calendar days with matching race rounds — the schedule Timeline view's
  // day-navigation list, fetched independently of any page/limit.
  getRaceRoundDates: async (
    tournament_id?: string | null,
    status?: string,
    raceType?: string,
  ): Promise<{ code: number; data: { dates: string[] }; msg: string }> => {
    try {
      const params: any = {};
      if (tournament_id) params.tournament_id = tournament_id;
      if (status) params.status = status;
      if (raceType) params.raceType = raceType;
      const response = await api.get('/admin/race-rounds/dates', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  getRaceTypes: async (isActive?: boolean): Promise<{ code: number; data: string[]; msg: string }> => {
    try {
      const params: any = {};
      if (isActive !== undefined) params.isActive = isActive;
      const response = await api.get('/admin/race-rounds/race-types', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  getRaceRoundDetail: async (id: string): Promise<{ code: number; data: RaceRoundData; msg: string }> => {
    try {
      const response = await api.get(`/admin/race-rounds/${id}/detail`);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  getCreateRaceMetadata: async (): Promise<CreateRaceMetadataResponse> => {
    try {
      const response = await api.get('/admin/create-race-metadata');
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  createRaceRound: async (payload: CreateRaceRoundPayload): Promise<RaceRoundMutationResponse> => {
    try {
      const response = await api.post('/admin/race-rounds', payload);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  updateRaceRound: async (id: string, payload: UpdateRaceRoundPayload): Promise<RaceRoundMutationResponse> => {
    try {
      const response = await api.put(`/admin/race-rounds/${id}`, payload);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  createTournament: async (data: TournamentPayload): Promise<TournamentMutationResponse> => {
    try {
      const response = await api.post('/admin/tournaments', data);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  updateTournament: async (id: string, data: Partial<TournamentPayload>): Promise<TournamentMutationResponse> => {
    try {
      const response = await api.put(`/admin/tournaments/${id}`, data);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  getTournamentDetail: async (id: string): Promise<{ code: number; data: TournamentDetailData; msg: string }> => {
    try {
      const response = await api.get(`/admin/tournaments/${id}/detail`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  getTournamentRanking: async (id: string): Promise<{ code: number; data: TournamentRankEntry[]; msg: string }> => {
    try {
      const response = await api.get(`/admin/tournaments/${id}/ranking`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  deleteTournament: async (id: string): Promise<SimpleMsgResponse> => {
    try {
      const response = await api.delete(`/admin/tournaments/${id}`);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  // --- Violations ---

  getAllViolations: async (
    page = 1,
    limit = 10,
    status?: string,
    severity?: number,
    raceRoundId?: string,
    sortBy = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ): Promise<{ code: number; data: { items: ViolationEntity[]; pagination: { page: number; limit: number; totalItems: number; totalPages: number } }; msg: string }> => {
    try {
      const params: any = { page, limit, sortBy, order };
      if (status)      params.status = status;
      if (severity)    params.severity = severity;
      if (raceRoundId) params.raceRoundId = raceRoundId;
      const response = await api.get('/admin/violations', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  dismissViolation: async (id: string): Promise<{ code: number; data: ViolationEntity; msg: string }> => {
    try {
      const response = await api.patch(`/admin/violations/${id}/dismiss`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  // --- Violation Types ---

  getAllViolationTypes: async (
    page = 1,
    limit = 10,
    search?: string,
    type?: string,
    category?: string,
    sortBy = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ): Promise<{ code: number; data: { items: ViolationTypeEntity[]; pagination: { page: number; limit: number; totalItems: number; totalPages: number } }; msg: string }> => {
    try {
      const params: any = { page, limit, sortBy, order };
      if (search)   params.search = search;
      if (type)     params.type = type;
      if (category) params.category = category;
      const response = await api.get('/admin/violation-types', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  createViolationType: async (data: Partial<ViolationTypeEntity>): Promise<{ code: number; data: ViolationTypeEntity; msg: string }> => {
    try {
      const response = await api.post('/admin/violation-types', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  updateViolationType: async (id: string, data: Partial<ViolationTypeEntity>): Promise<{ code: number; data: ViolationTypeEntity; msg: string }> => {
    try {
      const response = await api.put(`/admin/violation-types/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  toggleViolationTypeActive: async (id: string, isActive: boolean): Promise<{ code: number; data: ViolationTypeEntity; msg: string }> => {
    try {
      const response = await api.patch(`/admin/violation-types/${id}/active`, { isActive });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  cancelRaceRound: async (id: string): Promise<SimpleMsgResponse> => {
    try {
      const response = await api.patch(`/admin/race-rounds/${id}/cancel`);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  // --- Race Eligibility Rules ---
  getRules: async (
    page = 1,
    limit = 10,
    search?: string,
    sortBy = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ): Promise<RulesResponse> => {
    try {
      const params: Record<string, unknown> = { page, limit, sortBy, order };
      if (search) params.search = search;
      const response = await api.get('/admin/rules', { params });
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  createRule: async (data: Partial<RaceEligibilityRule>): Promise<RuleMutationResponse> => {
    try {
      const response = await api.post('/admin/rules', data);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  updateRule: async (id: string, data: Partial<RaceEligibilityRule>): Promise<RuleMutationResponse> => {
    try {
      const response = await api.put(`/admin/rules/${id}`, data);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  deleteRule: async (id: string): Promise<SimpleMsgResponse> => {
    try {
      const response = await api.delete(`/admin/rules/${id}`);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  // --- Certification Verification ---

  verifyCertification: async (userId: string, action: 'approve' | 'reject'): Promise<SimpleMsgResponse> => {
    try {
      const response = await api.patch(`/admin/users/${userId}/certification`, { action });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  // --- Race Round Status & Results ---

  setRaceRoundStatus: async (id: string, status: 'running' | 'cancelled', override?: boolean): Promise<{ code: number; data: RaceRoundData; msg: string }> => {
    try {
      const response = await api.put(`/admin/race-rounds/${id}/status`, { status, override });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  // Testing/demo shortcut — auto-pick a horse + jockey for registrations on a
  // "scheduled" race round that aren't already accepted with an accepted
  // invitation (already-ready ones are left untouched), so the assigned
  // referee's normal prepare/cancel review has something to act on.
  quickAssignHorsesAndJockeys: async (
    id: string,
  ): Promise<{
    code: number;
    data: {
      assigned: number;
      alreadyReady: number;
      completed: number;
      excluded: number;
      skipped: number;
      overLimit: number;
      total: number;
    };
    msg: string;
  }> => {
    try {
      const response = await api.post(`/admin/race-rounds/${id}/quick-assign`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  // --- Mux Stream & VOD ---

  createStream: async (id: string): Promise<StreamInfoResponse> => {
    try {
      const response = await api.post(`/admin/race-rounds/${id}/stream`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  getStreamInfo: async (id: string): Promise<StreamInfoResponse> => {
    try {
      const response = await api.get(`/admin/race-rounds/${id}/stream`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  getVOD: async (id: string): Promise<VodResponse> => {
    try {
      const response = await api.get(`/admin/race-rounds/${id}/vod`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  // --- Horse Management ---

  getAllHorses: async (
    page = 1,
    limit = 10,
    search?: string,
    status?: string,
    sortBy = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ): Promise<AdminHorsesResponse> => {
    try {
      const params: Record<string, unknown> = { page, limit, sortBy, order };
      if (search) params.search = search;
      if (status) params.status = status;
      const response = await api.get('/admin/horses', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  getHorseDetail: async (horseId: string): Promise<AdminHorseDetailResponse> => {
    try {
      const response = await api.get(`/admin/horses/${horseId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  updateHorseStatus: async (horseId: string, status: 'active' | 'inactive' | 'retired'): Promise<{ code: number; data: Record<string, unknown>; msg: string }> => {
    try {
      const response = await api.patch(`/admin/horses/${horseId}/status`, { status });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  // --- Important Events ---

  getImportantEvents: async (): Promise<ImportantEventsResponse> => {
    try {
      const response = await api.get('/admin/important-events');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  // --- Payment Verification ---
  // Admin is the payer for race_prize (owed to horseOwner) and referee_fee
  // (owed to referee). These are statistical wallet records only — the
  // actual money changes hands outside the system.

  getPayments: async (
    page = 1,
    limit = 10,
    status?: PaymentStatus,
    direction: 'payer' | 'payee' | 'all' = 'all',
    sortBy = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ): Promise<PaymentsResponse> => {
    try {
      const params: any = { page, limit, direction, sortBy, order };
      if (status) params.status = status;
      const response = await api.get('/admin/payments', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  // System-wide payment list — every race_prize/referee_fee/jockey_payout
  // transaction regardless of party, unlike getPayments which is scoped to
  // rows where the logged-in admin is the payer.
  getAllPayments: async (
    page = 1,
    limit = 10,
    status?: PaymentStatus,
    paymentType?: PaymentType,
    sortBy = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ): Promise<PaymentsResponse> => {
    try {
      const params: any = { page, limit, sortBy, order };
      if (status) params.status = status;
      if (paymentType) params.paymentType = paymentType;
      const response = await api.get('/admin/payments/all', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  confirmPaymentPaid: async (paymentId: string): Promise<{ code: number; data: PaymentEntity; msg: string }> => {
    try {
      const response = await api.put(`/admin/payments/${paymentId}/confirm-paid`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  getLedger: async (
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ): Promise<LedgerResponse> => {
    try {
      const params: Record<string, unknown> = { page, limit, sortBy, order };
      const response = await api.get('/admin/ledger', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  // System-wide wallet ledger — every reward/deposit/withdrawal/refund row for
  // any user (e.g. spectator prediction payouts alongside admin house-take),
  // unlike getLedger which is scoped to the caller's own (admin) rows.
  getAllLedger: async (
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ): Promise<LedgerResponse> => {
    try {
      const params: Record<string, unknown> = { page, limit, sortBy, order };
      const response = await api.get('/admin/ledger/all', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },
};
