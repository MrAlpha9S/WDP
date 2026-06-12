import api from './axios';

export interface RaceRegistration {
  _id: string;
  registrationStatus?: string;
  sum_prediction?: number;
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

  getRaceRounds: async (tournament_id?: string | null, raceRound_id?: string | null): Promise<RaceRoundsResponse> => {
    try {
      const params: any = {};
      if (tournament_id) {
        params.tournament_id = tournament_id;
      }
      if (raceRound_id) {
        params.raceRound_id = raceRound_id;
      }
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
  getRules: async () => {
    try {
      const response = await api.get('/admin/rules');
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
  }
};
