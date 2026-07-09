import api from './axios';
import type { PaymentEntity, PaymentStatus, PaymentsResponse } from './paymentTypes';

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
  minimalRidingFees: number;
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
    _id: string; matchesRaced: number; totalWins: number; ranking: number;
    licenseStatus: string; status: string; weight: number;
    fullName: string; image: string | null; dateOfBirth: string;
  };
  stats: { totalRaces: number; wins: number; winRate: number; totalPrize: number; };
  recentRaces: { race: string; position: string; horse: string; date: string; }[];
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
  totalViolations: number; balance: number; wallet: number;
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

export const horseOwnerService = {
  getUserHorse: async (
    page = 1,
    limit = 10,
    search?: string,
    sortBy = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ) => {
    try {
      const params: any = { page, limit, sortBy, order };
      if (search) params.search = search;
      const response = await api.get('/horseowner/my-horses', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  getHorseOwnerInvitations: async (
    page = 1,
    limit = 10,
    status?: string,
    search?: string,
    sortBy = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ) => {
    try {
      const params: any = { page, limit, sortBy, order };
      if (status) params.status = status;
      if (search) params.search = search;
      const response = await api.get('/horseowner/race-invitations', { params });
      console.log('DATA: ', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  getAllJockey: async (
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ) => {
    try {
      const params: any = { page, limit, sortBy, order };
      const response = await api.get('/jockey/all', { params });
      console.log('DATA: ', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  approveRegistration: async (registrationId: string) => {
    if (!registrationId || registrationId === '') return
    try {
      await api.post(`/horseowner/registration/${registrationId}/approve`);
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  HireJockey: async (data: hireJockey) => {
    if (!data) return;
    try {
      await api.post(`/invitations`, data);
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  allJockeyInvitations: async (page = 1, limit = 10, search?: string) => {
    try {
      const params: Record<string, unknown> = { page, limit };
      if (search) params.search = search;
      const response = await api.get('/horseowner/invitations', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  getRaceDetail: async (raceRoundId: string) => {
    try {
      const response = await api.get(`/horseowner/race-rounds/${raceRoundId}/detail`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  getRaceRoundStatus: async (raceRoundId: string): Promise<{ code: number; data: RaceRoundStatus; msg: string }> => {
    try {
      const response = await api.get(`/horseowner/race-rounds/${raceRoundId}/status`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  createHorse: async (data: Omit<Horse, '_id' | 'ownerId' | 'createdAt' | 'updatedAt' | '__v'>) => {
    try {
      const response = await api.post('/horse', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  updateHorse: async (horseId: string, data: Partial<Horse>) => {
    try {
      const response = await api.put(`/horse/${horseId}`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  deleteHorse: async (horseId: string) => {
    try {
      const response = await api.delete(`/horse/${horseId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  uploadHorseImage: async (horseId: string, file: File) => {
    try {
      const form = new FormData();
      form.append('image', file);
      const response = await api.post(`/horse/upload-image/${horseId}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  updateHorseStatus: async (horseId: string, status: 'active' | 'inactive' | 'retired') => {
    try {
      const response = await api.put(`/horseowner/horses/${horseId}/status`, { status });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  updateHorseHealthStatus: async (horseId: string, healthStatus: 'healthy' | 'injured' | 'sick') => {
    try {
      const response = await api.put(`/horseowner/horses/${horseId}/health-status`, { healthStatus });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  getHorseProfile: async (horseId: string) => {
    try {
      const response = await api.get(`/horseowner/horses/${horseId}/profile`);
      return response.data as { data: HorseProfileData };
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  getDashboardSummary: async () => {
    try {
      const response = await api.get('/horseowner/dashboard/summary');
      return response.data as { data: DashboardSummary };
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  getTopPerformers: async (limit = 5) => {
    try {
      const response = await api.get('/horseowner/dashboard/top-performers', { params: { limit } });
      return response.data as { data: TopPerformer[] };
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  browseRaces: async (page = 1, limit = 12, search?: string, status?: string) => {
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      if (status) params.status = status;
      const response = await api.get('/horseowner/races/browse', { params });
      return response.data as {
        data: {
          items: BrowsableRace[];
          pagination: { totalItems: number; totalPages: number; currentPage: number; limit: number };
        };
      };
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  getJockeyProfile: async (jockeyId: string) => {
    try {
      const response = await api.get(`/horseowner/jockeys/${jockeyId}/profile`);
      return response.data as { data: JockeyProfileData };
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  getFinancialSummary: async () => {
    try {
      const response = await api.get('/horseowner/financials/summary');
      return response.data as { data: FinancialSummary };
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  getFinancialRaceResults: async (page = 1, limit = 10, search?: string) => {
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      const response = await api.get('/horseowner/financials/race-results', { params });
      return response.data as {
        data: {
          items: FinancialRaceRow[];
          pagination: { totalItems: number; totalPages: number; currentPage: number; limit: number; };
        };
      };
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  getRaceEligibilityMetadata: async (ruleId: string) => {
    try {
      const response = await api.get('/horseowner/race-eligibility-metadata', { params: { ruleId } });
      return response.data as {
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
      };
    } catch (error: any) {
      throw error.response?.data || error;
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
  ): Promise<PaymentsResponse> => {
    try {
      const params: any = { page, limit, direction };
      if (status) params.status = status;
      const response = await api.get('/horseowner/payments', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to fetch payments' };
    }
  },

  confirmPaymentReceived: async (paymentId: string): Promise<{ code: number; data: PaymentEntity; msg: string }> => {
    try {
      const response = await api.put(`/horseowner/payments/${paymentId}/confirm-received`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to confirm payment' };
    }
  },

  confirmPaymentPaid: async (paymentId: string): Promise<{ code: number; data: PaymentEntity; msg: string }> => {
    try {
      const response = await api.put(`/horseowner/payments/${paymentId}/confirm-paid`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to confirm payment' };
    }
  },
};
