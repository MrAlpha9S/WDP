import api, { NETWORK_ERROR_MESSAGE } from './axios';
import type { PaymentEntity, PaymentStatus, PaymentsResponse } from './paymentTypes';
import type { SelfProfileResponse, UpdateSelfProfilePayload } from './profileTypes';

export interface Owner {
  _id: string;
  address: string;
  licenseStatus: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Horse {
  _id: string;
  horseName: string;
  breed: string;
  gender: 'male' | 'female'; // Extrapolated based on standard data
  dateOfBirth: string;
  healthStatus: 'healthy' | string; // Can be string or a specific union type if you have more statuses
  status: 'active' | string;
  ownerId: Owner; // Nested owner object
  registrationDate: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface hireJockey {
  horseId: string,
  jockeyId: string,
  registrationId: string,
  percentagePayout: number,
  isBackup: boolean,
  isJockeyInRace?: boolean,
  bookingFees: number,
}

export interface HorseRegistrationEntry {
  registration: { _id: string; registrationStatus: string; laneNumber?: number; registeredAt: string; };
  raceRound: { _id: string; roundName: string; raceDate: string; trackLength: number; location: string; status: string; tournament?: { name: string }; } | null;
  result?: { finishPosition: number | null; finishTime: string | null; prizeMoney: number; resultStatus: string; distance?: number; } | null;
}

export interface HorseViolationEntry {
  _id: string;
  raceRound: { _id: string; roundName: string; raceDate: string; };
  violationType: { violationName: string; category: string; severity: number; defaultPenalty: string; };
  description: string;
  severity: number;
  actualPenalty: string;
  stewardAction: string;
  violationStatus: string;
}

export interface DashboardActivity {
  type: 'registration' | 'result' | 'invitation' | 'violation';
  icon: 'check' | 'user' | 'alert';
  time: string;
  text: string;
  highlight: string;
}

export interface DashboardSummary {
  totalHorses: number;
  upcomingRacesCount: number;
  activeInvitationsCount: number;
  recentActivity: DashboardActivity[];
}

export interface TopPerformer {
  id: string;
  name: string;
  img: string | null;
  winRate: number;
  wins: number;
  totalRaces: number;
}

export interface BrowsableRace {
  id: string;
  name: string;
  date: string | null;
  location: string | null;
  status: string;
  isLive: boolean;
  muxPlaybackId: string | null;
  tournament: { id: string; name: string } | null;
  prizes: { first: number; second: number; third: number };
  maxParticipants: number | null;
  currentParticipants: number;
  entryFee: number;
  baseFee: number;
  raceType: string | null;
  eligibility: { requiredBreed: string | null; requiredGender: string | null; minAge: number | null; maxAge: number | null } | null;
  ownerRegistration: { status: string; registrationId: string } | null;
}

export interface JockeyViolationEntry {
  _id: string;
  raceRound: { _id: string; roundName: string; raceDate: string; };
  violationType: { violationName: string; category: string; severity: number; defaultPenalty: string; } | null;
  description: string;
  severity: number;
  actualPenalty: string;
  stewardAction: string;
  violationStatus: string;
}

export interface JockeyProfileData {
  jockey: {
    _id: string; matchesRaced: number; totalWins: number; rank: number | null; totalJockeys: number;
    licenseStatus: string; status: string; weight: number; bookingFee: number;
    fullName: string; image: string | null; dateOfBirth: string;
  };
  stats: { totalRaces: number; wins: number; winRate: number; totalPrize: number; };
  recentRaces: { race: string; position: string; horse: string; date: string; attendance?: "no_show" | "main" | "backup"; bookingFees: number; }[];
  violations: JockeyViolationEntry[];
}

export interface FinancialViolation {
  type: string; category: string | null; severity: number;
  penalty: string; stewardAction: string; status: string;
}

export interface FinancialRaceRow {
  registrationId: string;
  race: { id: string | null; name: string; date: string | null; location: string | null; };
  horse: { id: string | null; name: string; };
  jockey: { id: string | null; name: string; percentagePayout: number; payout: number; } | null;
  finishPosition: number | null;
  prizeMoney: number;
  jockeyPayout: number;
  netOutcome: number;
  resultStatus: string | null;
  registrationStatus: string;
  violations: FinancialViolation[];
}

export interface FinancialSummary {
  totalRaces: number; totalWins: number; totalLosses: number;
  totalPrize: number; totalJockeyPayout: number; netProfit: number;
  totalViolations: number; wallet: number;
}

export interface RaceRoundStatus {
  raceRoundId: string;
  status: string;
  registrationStatus: string;
  isLive: boolean;
  hasResults: boolean;
}

export interface HorseProfileData {
  horse: Horse;
  stats: { totalRaces: number; wins: number; podiums: number; losses: number; winRate: number; totalPrize: number; };
  raceHistory: HorseRegistrationEntry[];
  violations: HorseViolationEntry[];
}

export interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface OwnedHorseListItem extends Horse {
  raceResults: { finishPosition: number | null }[];
}

export interface OwnedHorsesResponse {
  code: number;
  data: { items: OwnedHorseListItem[]; pagination: PaginationMeta };
  msg: string;
}

export interface RaceInvitationEntry {
  registration: Record<string, unknown>;
  raceRound: Record<string, unknown> | null;
  tournament: Record<string, unknown> | null;
  eligibleHorseIds: string[];
  existingHorseId: string | null;
  jockey: { fullName: string | null; image: string | null } | null;
  horse: { horseName: string | null } | null;
}

export interface RaceInvitationsResponse {
  code: number;
  data: { items: RaceInvitationEntry[]; pagination: PaginationMeta };
  msg: string;
}

export interface JockeyListResponse {
  code: number;
  data: { items: Record<string, unknown>[]; pagination: PaginationMeta };
  msg: string;
}

export interface CompetitorEntry {
  registrationId: string;
  horseName: string | null;
  ownerName: string | null;
  jockeyName: string | null;
  laneNumber: number | null;
}

export interface RaceCompetition {
  maxParticipants: number | null;
  confirmedCount: number;
  openSlots: number;
  competitors: CompetitorEntry[];
}

export interface RaceDetailInvitation {
  _id: string;
  invitationStatus: string;
  isBackup: boolean;
  percentagePayout: number;
  jockeyConfirmation: boolean;
  ownerConfirmation: boolean;
  createdAt: string;
  jockey: { fullName: string; image?: string } | null;
}

export interface RaceDetailRegistration {
  _id: string;
  registrationStatus: string;
  horse: Horse | null;
  selectedJockey: { fullName: string; image?: string } | null;
  invitations: RaceDetailInvitation[];
  raceResult: Record<string, unknown> | null;
  violations: Record<string, unknown>[];
  [key: string]: unknown;
}

export interface RaceDetailResponse {
  code: number;
  data: {
    raceRound: Record<string, unknown>;
    registration: RaceDetailRegistration | null;
    competition: RaceCompetition;
  };
  msg: string;
}

export interface JockeyInvitationEntry {
  _id: string;
  jockey: { _id: string; fullName: string | null; image: string | null } | null;
  horse: { horseName: string } | null;
  raceRound: { roundName: string; raceDate: string; location: string } | null;
  status: string;
  isBackup: boolean;
  percentagePayout: number;
  bookingFees: number;
  createdAt: string;
}

export interface JockeyInvitationsListResponse {
  code: number;
  data: { invitations: JockeyInvitationEntry[]; pagination: { total: number; totalPages: number; page: number; limit: number } };
  msg: string;
}

export const horseOwnerService = {
  getMyProfile: async (): Promise<SelfProfileResponse> => {
    try {
      const response = await api.get('/horseowner/my-profile');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  updateMyProfile: async (payload: UpdateSelfProfilePayload): Promise<SelfProfileResponse> => {
    try {
      const response = await api.put('/horseowner/my-profile', payload);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  updateMyLicense: async (file: File): Promise<SelfProfileResponse> => {
    try {
      const form = new FormData();
      form.append('license', file);
      const response = await api.put('/horseowner/my-profile/license', form, {
        transformRequest: [(d, headers) => {
          delete headers['Content-Type'];
          return d;
        }],
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  getUserHorse: async (
    page = 1,
    limit = 10,
    search?: string,
    sortBy = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ): Promise<OwnedHorsesResponse> => {
    try {
      const params: Record<string, unknown> = { page, limit, sortBy, order };
      if (search) params.search = search;
      const response = await api.get('/horseowner/my-horses', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },
  getHorseOwnerInvitations: async (
    page = 1,
    limit = 10,
    status?: string,
    search?: string,
    sortBy = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ): Promise<RaceInvitationsResponse> => {
    try {
      const params: Record<string, unknown> = { page, limit, sortBy, order };
      if (status) params.status = status;
      if (search) params.search = search;
      const response = await api.get('/horseowner/race-invitations', { params });
      console.log('DATA: ', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },
  getAllJockey: async (
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ): Promise<JockeyListResponse> => {
    try {
      const params: Record<string, unknown> = { page, limit, sortBy, order };
      const response = await api.get('/jockey/all', { params });
      console.log('DATA: ', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },
  acceptRegistration: async (registrationId: string): Promise<void> => {
    if (!registrationId || registrationId === '') return
    try {
      await api.post(`/horseowner/registration/${registrationId}/accept`);
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },
  HireJockey: async (data: hireJockey): Promise<void> => {
    if (!data) return;
    try {
      await api.post(`/horseowner/invitations`, data);
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },
  allJockeyInvitations: async (page = 1, limit = 10, search?: string): Promise<JockeyInvitationsListResponse> => {
    try {
      const params: Record<string, unknown> = { page, limit };
      if (search) params.search = search;
      const response = await api.get('/horseowner/invitations', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },
  getRaceDetail: async (raceRoundId: string): Promise<RaceDetailResponse> => {
    try {
      const response = await api.get(`/horseowner/race-rounds/${raceRoundId}/detail`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },
  getRaceRoundStatus: async (raceRoundId: string): Promise<{ code: number; data: RaceRoundStatus; msg: string }> => {
    try {
      const response = await api.get(`/horseowner/race-rounds/${raceRoundId}/status`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },
  createHorse: async (data: Omit<Horse, '_id' | 'ownerId' | 'createdAt' | 'updatedAt' | '__v'>): Promise<{ code: number; data: Horse; msg: string }> => {
    try {
      const response = await api.post('/horseowner/horses', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },
  updateHorse: async (horseId: string, data: Partial<Horse>): Promise<{ code: number; data: Horse; msg: string }> => {
    try {
      const response = await api.put(`/horseowner/horses/${horseId}`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },
  deleteHorse: async (horseId: string): Promise<{ code: number; msg: string }> => {
    try {
      const response = await api.delete(`/horseowner/horses/${horseId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },
  uploadHorseImage: async (horseId: string, file: File): Promise<{ code: number; data: Horse; msg: string }> => {
    try {
      const form = new FormData();
      form.append('image', file);
      const response = await api.post(`/horseowner/horses/${horseId}/upload-image`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },
  updateHorseStatus: async (horseId: string, status: 'active' | 'inactive' | 'retired'): Promise<{ code: number; msg: string }> => {
    try {
      const response = await api.put(`/horseowner/horses/${horseId}/status`, { status });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },
  updateHorseHealthStatus: async (horseId: string, healthStatus: 'healthy' | 'injured' | 'sick'): Promise<{ code: number; msg: string }> => {
    try {
      const response = await api.put(`/horseowner/horses/${horseId}/health-status`, { healthStatus });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },
  getHorseProfile: async (horseId: string): Promise<{ code: number; data: HorseProfileData; msg: string }> => {
    try {
      const response = await api.get(`/horseowner/horses/${horseId}/profile`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },
  getDashboardSummary: async (): Promise<{ code: number; data: DashboardSummary; msg: string }> => {
    try {
      const response = await api.get('/horseowner/dashboard/summary');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },
  getTopPerformers: async (limit = 5): Promise<{ code: number; data: TopPerformer[]; msg: string }> => {
    try {
      const response = await api.get('/horseowner/dashboard/top-performers', { params: { limit } });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },
  browseRaces: async (
    page = 1,
    limit = 12,
    search?: string,
    status?: string,
  ): Promise<{ code: number; data: { items: BrowsableRace[]; pagination: PaginationMeta }; msg: string }> => {
    try {
      const params: Record<string, unknown> = { page, limit };
      if (search) params.search = search;
      if (status) params.status = status;
      const response = await api.get('/horseowner/races/browse', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },
  getJockeyProfile: async (jockeyId: string): Promise<{ code: number; data: JockeyProfileData; msg: string }> => {
    try {
      const response = await api.get(`/horseowner/jockeys/${jockeyId}/profile`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },
  getFinancialSummary: async (): Promise<{ code: number; data: FinancialSummary; msg: string }> => {
    try {
      const response = await api.get('/horseowner/financials/summary');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },
  getFinancialRaceResults: async (
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<{ code: number; data: { items: FinancialRaceRow[]; pagination: PaginationMeta }; msg: string }> => {
    try {
      const params: Record<string, unknown> = { page, limit };
      if (search) params.search = search;
      const response = await api.get('/horseowner/financials/race-results', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  getRaceEligibilityMetadata: async (
    ruleId: string,
  ): Promise<{
    code: number;
    data: {
      eligibilityRules: {
        raceType: string | null;
        minWins: number | null;
        maxWins: number | null;
        minAge: number | null;
        maxAge: number | null;
        requiredGender: string | null;
        requiredBreed: string | null;
      }[];
    };
    msg: string;
  }> => {
    try {
      const response = await api.get('/horseowner/race-eligibility-metadata', { params: { ruleId } });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  getEarningsSeries: async (groupBy: 'day' | 'week' | 'month' | 'year' = 'day'): Promise<{ code: number; data: { date: string, grossPrize: number }[]; msg: string }> => {
    try {
      const response = await api.get('/horseowner/financials/earnings-series', { params: { groupBy } });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  // --- Payment Verification ---
  // horseOwner is the payee for race_prize (owed by admin) and the payer
  // for jockey_payout (owed to the jockey). Statistical wallet only — the
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
      const params: Record<string, unknown> = { page, limit, direction, sortBy, order };
      if (status) params.status = status;
      const response = await api.get('/horseowner/payments', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  confirmPaymentReceived: async (paymentId: string): Promise<{ code: number; data: PaymentEntity; msg: string }> => {
    try {
      const response = await api.put(`/horseowner/payments/${paymentId}/confirm-received`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },

  confirmPaymentPaid: async (paymentId: string): Promise<{ code: number; data: PaymentEntity; msg: string }> => {
    try {
      const response = await api.put(`/horseowner/payments/${paymentId}/confirm-paid`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
    }
  },
};
