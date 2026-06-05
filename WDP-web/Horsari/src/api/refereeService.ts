import api from './axios';
import type { RaceRoundData } from './adminService';

export const refereeService = {
  getRefereeRaceRounds: async (): Promise<{ code: number; data: RaceRoundData[]; msg: string }> => {
    try {
      const response = await api.get('/referee/race-rounds');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  getRefereeTournaments: async (): Promise<{ code: number; data: any[]; msg: string }> => {
    try {
      const response = await api.get('/referee/tournaments');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  getActiveRules: async (): Promise<{ code: number; data: any[]; msg: string }> => {
    try {
      const response = await api.get('/eligibility-rules');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  getRefereeInvitations: async (limit = 10, page = 1): Promise<{ code: number; data: any[]; pagination: any; msg: string }> => {
    try {
      const response = await api.get(`/referee/invitations?limit=${limit}&page=${page}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  acceptInvitation: async (id: string): Promise<{ code: number; data: any; msg: string }> => {
    try {
      const response = await api.put(`/referee/invitations/${id}/accept`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  rejectInvitation: async (id: string): Promise<{ code: number; data: any; msg: string }> => {
    try {
      const response = await api.put(`/referee/invitations/${id}/reject`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }
};
