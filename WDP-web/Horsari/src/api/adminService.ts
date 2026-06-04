import api from './axios';

export const adminService = {
  getStatistics: async () => {
    try {
      const response = await api.get('/admin/statistics');
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
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to fetch tournaments' };
    }
  },

  getRaceRounds: async (tournamentFilter?: string | null) => {
    try {
      const params: any = {};
      if (tournamentFilter) {
        params.tournamentFilter = tournamentFilter;
      }
      const response = await api.get('/admin/race-rounds', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to fetch race rounds' };
    }
  },

  getCreateRaceMetadata: async () => {
    try {
      const response = await api.get('/admin/create-race-metadata');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to fetch create race metadata' };
    }
  },

  createRaceRound: async (payload: any) => {
    try {
      const response = await api.post('/raceround', payload);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  createTournament: async (data: any) => {
    try {
      const response = await api.post('/tournament', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  updateTournament: async (id: string, data: any) => {
    try {
      const response = await api.put(`/tournament/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  deleteTournament: async (id: string) => {
    try {
      const response = await api.delete(`/tournament/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }
};
