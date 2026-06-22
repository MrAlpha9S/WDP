import api from './axios';

export interface RaceRegistration {
  _id: string;
  registrationStatus?: string;
  sum_prediction?: number;
  isJockeyInRace?: boolean;
  Horse?: { horseName: string } | null;
  Jockey?: { _id?: { fullName?: string } } | null;
  Owner?: { fullName?: string } | null;
  RaceResult?: any | null;
}

export interface RaceRefereeAssignment {
  refereeId: string;
  fullName: string | null;
  assignmentStatus: string;
  fee?: number;
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
}

export interface TournamentRaceData {
  T_id: string;
  Tournaments_name: string;
  Tournament_detail?: any;
  RaceRound: RaceRoundData[];
}

export interface RaceRoundsResponse {
  code: number;
  data: RaceRoundData[];
  msg: string;
}

export const adminService = {
  getStatistics: async () => {
    try {
      const response = await api.get('/admin/statistics');
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  getAllUsers: async (role?: string, search?: string, limit: number = 10, skip: number = 0) => {
    try {
      const params: any = { limit, skip };
      if (role && role !== 'All') params.role = role;
      if (search) params.search = search;
      const response = await api.get('/admin/users/all', { params });
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to fetch users' };
    }
  },

  getUsersDetail: async (userId: string) => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to fetch user detail' };
    }
  },

  getHorseOwnerInvitations: async (page: number = 1, limit: number = 5) => {
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

  getRefereeInvitations: async (page: number = 1, limit: number = 5) => {
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

  getJockeyInvitations: async (page: number = 1, limit: number = 5) => {
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

  getTournamentsWithDetails: async (page: number = 1, limit: number = 10) => {
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

  getCreateRaceMetadata: async () => {
    try {
      const response = await api.get('/admin/create-race-metadata');
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to fetch create race metadata' };
    }
  },

  createRaceRound: async (payload: any) => {
    try {
      const response = await api.post('/raceround', payload);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  updateRaceRound: async (id: string, payload: any) => {
    try {
      const response = await api.put(`/raceround/${id}`, payload);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  createTournament: async (data: any) => {
    try {
      const response = await api.post('/tournament', data);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  updateTournament: async (id: string, data: any) => {
    try {
      const response = await api.put(`/tournament/${id}`, data);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  deleteTournament: async (id: string) => {
    try {
      const response = await api.delete(`/tournament/${id}`);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  cancelRaceRound: async (id: string) => {
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
  ) => {
    try {
      const params: any = { page, limit, sortBy, order };
      if (search) params.search = search;
      const response = await api.get('/admin/rules', { params });
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to fetch rules' };
    }
  },

  createRule: async (data: any) => {
    try {
      const response = await api.post('/admin/rules', data);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to create rule' };
    }
  },

  updateRule: async (id: string, data: any) => {
    try {
      const response = await api.put(`/admin/rules/${id}`, data);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to update rule' };
    }
  },

  deleteRule: async (id: string) => {
    try {
      const response = await api.delete(`/admin/rules/${id}`);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to delete rule' };
    }
  },

  // --- Certification Verification ---

  verifyCertification: async (userId: string, action: 'approve' | 'reject') => {
    try {
      const response = await api.patch(`/admin/users/${userId}/certification`, { action });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to update certification status' };
    }
  },

  // --- Race Round Status & Results ---

  setRaceRoundStatus: async (id: string, status: 'running' | 'cancelled') => {
    try {
      const response = await api.put(`/admin/race-rounds/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to update race status' };
    }
  },

  confirmRaceResult: async (id: string) => {
    try {
      const response = await api.post(`/admin/race-rounds/${id}/confirm-result`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to confirm race result' };
    }
  },

  // --- Mux Stream & VOD ---

  createStream: async (id: string) => {
    try {
      const response = await api.post(`/admin/race-rounds/${id}/stream`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to create stream' };
    }
  },

  getStreamInfo: async (id: string) => {
    try {
      const response = await api.get(`/admin/race-rounds/${id}/stream`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to fetch stream info' };
    }
  },

  getVOD: async (id: string) => {
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
  ) => {
    try {
      const params: any = { page, limit, sortBy, order };
      if (search) params.search = search;
      if (status) params.status = status;
      const response = await api.get('/admin/horses', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to fetch horses' };
    }
  },

  getHorseDetail: async (horseId: string) => {
    try {
      const response = await api.get(`/admin/horses/${horseId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to fetch horse detail' };
    }
  },

  updateHorseStatus: async (horseId: string, status: 'active' | 'inactive' | 'retired') => {
    try {
      const response = await api.patch(`/admin/horses/${horseId}/status`, { status });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to update horse status' };
    }
  },

  // --- Important Events ---

  getImportantEvents: async () => {
    try {
      const response = await api.get('/admin/important-events');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to fetch important events' };
    }
  },
};
