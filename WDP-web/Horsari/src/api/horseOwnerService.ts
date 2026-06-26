import api from './axios';

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
  allJockeyInvitations: async (page = 1, limit = 10) => {
    try {
      const response = await api.get('/horseowner/invitations', { params: { page, limit } });
      console.log('allJockeyInvitations: ', response.data);
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
};
