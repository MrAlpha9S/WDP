import api from './axios';
import type { TournamentDetailData, TournamentRankEntry } from '../shared/types/TournamentTypes';
import type { ViolationEntity, ViolationTypeEntity } from '../shared/types/ViolationTypes';
import type { PaymentEntity, PaymentStatus, PaymentType, PaymentsResponse, LedgerResponse } from './paymentTypes';

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
    minimalRidingFees: number;
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
}

export interface UpdateRaceRoundPayload {
  TournamentId?: string;
  RaceRound?: Partial<CreateRaceRoundPayload['RaceRound']>;
  HorseOwnerInvitation?: string[];
  RefereeInvitation?: { refereeId: string; fee?: number }[];
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
  getStatistics: async (): Promise<{ code: number; data: AdminStatistics; msg: string }> => {
    try {
      const response = await api.get('/admin/statistics');
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  getSystemStatistics: async (): Promise<SystemStatisticsResponse> => {
    try {
      const response = await api.get('/admin/statistics/overview');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to fetch system statistics' };
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
      throw error.response?.data || { msg: 'Failed to fetch users' };
    }
  },

  getUsersDetail: async (userId: string): Promise<AdminUserDetailResponse> => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to fetch user detail' };
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
      throw error.response?.data || error;
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
      throw error.response?.data || error;
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
      throw error.response?.data || error;
    }
  },

  getTournamentsWithDetails: async (page: number = 1, limit: number = 10): Promise<AdminTournamentsResponse> => {
    try {
      const response = await api.get('/admin/tournaments', {
        params: { page, limit }
      });
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to fetch tournaments' };
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
  ): Promise<RaceRoundsResponse> => {
    try {
      const params: any = { page, limit, sortBy, order };
      if (tournament_id) params.tournament_id = tournament_id;
      if (raceRound_id) params.raceRound_id = raceRound_id;
      if (status) params.status = status;
      if (search) params.search = search;
      const response = await api.get('/admin/race-rounds', { params });
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to fetch race rounds' };
    }
  },

  getRaceRoundDetail: async (id: string): Promise<{ code: number; data: RaceRoundData; msg: string }> => {
    try {
      const response = await api.get(`/admin/race-rounds/${id}/detail`);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to fetch race round detail' };
    }
  },

  getCreateRaceMetadata: async (): Promise<CreateRaceMetadataResponse> => {
    try {
      const response = await api.get('/admin/create-race-metadata');
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to fetch create race metadata' };
    }
  },

  createRaceRound: async (payload: CreateRaceRoundPayload): Promise<RaceRoundMutationResponse> => {
    try {
      const response = await api.post('/raceround', payload);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  updateRaceRound: async (id: string, payload: UpdateRaceRoundPayload): Promise<RaceRoundMutationResponse> => {
    try {
      const response = await api.put(`/raceround/${id}`, payload);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  createTournament: async (data: TournamentPayload): Promise<TournamentMutationResponse> => {
    try {
      const response = await api.post('/tournament', data);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  updateTournament: async (id: string, data: Partial<TournamentPayload>): Promise<TournamentMutationResponse> => {
    try {
      const response = await api.put(`/tournament/${id}`, data);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  getTournamentDetail: async (id: string): Promise<{ code: number; data: TournamentDetailData; msg: string }> => {
    try {
      const response = await api.get(`/admin/tournaments/${id}/detail`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to fetch tournament detail' };
    }
  },

  getTournamentRanking: async (id: string): Promise<{ code: number; data: TournamentRankEntry[]; msg: string }> => {
    try {
      const response = await api.get(`/admin/tournaments/${id}/ranking`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to fetch tournament ranking' };
    }
  },

  deleteTournament: async (id: string): Promise<SimpleMsgResponse> => {
    try {
      const response = await api.delete(`/tournament/${id}`);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
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
      throw error.response?.data || { msg: 'Failed to fetch violations' };
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
      throw error.response?.data || { msg: 'Failed to fetch violation types' };
    }
  },

  createViolationType: async (data: Partial<ViolationTypeEntity>): Promise<{ code: number; data: ViolationTypeEntity; msg: string }> => {
    try {
      const response = await api.post('/admin/violation-types', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to create violation type' };
    }
  },

  updateViolationType: async (id: string, data: Partial<ViolationTypeEntity>): Promise<{ code: number; data: ViolationTypeEntity; msg: string }> => {
    try {
      const response = await api.put(`/admin/violation-types/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to update violation type' };
    }
  },

  toggleViolationTypeActive: async (id: string, isActive: boolean): Promise<{ code: number; data: ViolationTypeEntity; msg: string }> => {
    try {
      const response = await api.patch(`/admin/violation-types/${id}/active`, { isActive });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to toggle violation type status' };
    }
  },

  cancelRaceRound: async (id: string): Promise<SimpleMsgResponse> => {
    try {
      const response = await api.patch(`/raceround/${id}/cancel`);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
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
      throw error.response?.data || { msg: 'Failed to fetch rules' };
    }
  },

  createRule: async (data: Partial<RaceEligibilityRule>): Promise<RuleMutationResponse> => {
    try {
      const response = await api.post('/admin/rules', data);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to create rule' };
    }
  },

  updateRule: async (id: string, data: Partial<RaceEligibilityRule>): Promise<RuleMutationResponse> => {
    try {
      const response = await api.put(`/admin/rules/${id}`, data);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to update rule' };
    }
  },

  deleteRule: async (id: string): Promise<SimpleMsgResponse> => {
    try {
      const response = await api.delete(`/admin/rules/${id}`);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to delete rule' };
    }
  },

  // --- Certification Verification ---

  verifyCertification: async (userId: string, action: 'approve' | 'reject'): Promise<SimpleMsgResponse> => {
    try {
      const response = await api.patch(`/admin/users/${userId}/certification`, { action });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to update certification status' };
    }
  },

  // --- Race Round Status & Results ---

  setRaceRoundStatus: async (id: string, status: 'running' | 'cancelled'): Promise<{ code: number; data: RaceRoundData; msg: string }> => {
    try {
      const response = await api.put(`/admin/race-rounds/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to update race status' };
    }
  },

  // Testing/demo shortcut — auto-pick a horse + jockey for registrations on a
  // "scheduled" race round that aren't already approved with an accepted
  // invitation (already-ready ones are left untouched), so the assigned
  // referee's normal prepare/cancel review has something to act on.
  quickAssignHorsesAndJockeys: async (
    id: string,
  ): Promise<{ code: number; data: { assigned: number; alreadyReady: number; skipped: number; total: number }; msg: string }> => {
    try {
      const response = await api.post(`/admin/race-rounds/${id}/quick-assign`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to quick-assign horses and jockeys' };
    }
  },

  // --- Mux Stream & VOD ---

  createStream: async (id: string): Promise<StreamInfoResponse> => {
    try {
      const response = await api.post(`/admin/race-rounds/${id}/stream`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to create stream' };
    }
  },

  getStreamInfo: async (id: string): Promise<StreamInfoResponse> => {
    try {
      const response = await api.get(`/admin/race-rounds/${id}/stream`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to fetch stream info' };
    }
  },

  getVOD: async (id: string): Promise<VodResponse> => {
    try {
      const response = await api.get(`/admin/race-rounds/${id}/vod`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to fetch VOD info' };
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
      throw error.response?.data || { msg: 'Failed to fetch horses' };
    }
  },

  getHorseDetail: async (horseId: string): Promise<AdminHorseDetailResponse> => {
    try {
      const response = await api.get(`/admin/horses/${horseId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to fetch horse detail' };
    }
  },

  updateHorseStatus: async (horseId: string, status: 'active' | 'inactive' | 'retired'): Promise<{ code: number; data: Record<string, unknown>; msg: string }> => {
    try {
      const response = await api.patch(`/admin/horses/${horseId}/status`, { status });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to update horse status' };
    }
  },

  // --- Important Events ---

  getImportantEvents: async (): Promise<ImportantEventsResponse> => {
    try {
      const response = await api.get('/admin/important-events');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to fetch important events' };
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
      throw error.response?.data || { msg: 'Failed to fetch payments' };
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
      throw error.response?.data || { msg: 'Failed to fetch payments' };
    }
  },

  confirmPaymentPaid: async (paymentId: string): Promise<{ code: number; data: PaymentEntity; msg: string }> => {
    try {
      const response = await api.put(`/admin/payments/${paymentId}/confirm-paid`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to confirm payment' };
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
      throw error.response?.data || { msg: 'Failed to fetch ledger' };
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
      throw error.response?.data || { msg: 'Failed to fetch ledger' };
    }
  },
};
