import api from './axios';
import type { RaceRoundData } from './adminService';

// ── Response shapes ────────────────────────────────────────────────────────────

export interface RaceRoundEntry {
    _id: string;
    roundName: string;
    raceDate?: string;
    location?: string;
    address?: string;
    status?: string;
    raceGround?: string;
    trackLength?: number;
    minimalRidingFees?: number;
    eligibilityRuleId?: string;
    tournamentId?: string;
    RaceType?: { raceType?: string; gradeLevel?: string } | null;
    RaceReferee?: { fee?: number; status?: string } | null;
    Registration?: RegistrationEntry[];
}

export interface RegistrationEntry {
    _id: string;
    horseOwnerId?: string;
    status?: string;
    Horse?: Record<string, unknown> | null;
    Jockey?: Record<string, unknown> | null;
    Owner?: { _id: string; fullName?: string } | null;
    RaceResult?: Record<string, unknown> | null;
}

export interface TournamentWithRounds {
    _id: string;
    tournamentName?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    country?: string;
    seasonYear?: string | number;
    totalRaces?: number;
    completedRaces?: number;
    totalPrizePool?: number;
    gradeLevel?: string;
    description?: string;
    status?: string;
    RaceRound?: RaceRoundEntry[];
}

// ── Service ───────────────────────────────────────────────────────────────────

export const refereeService = {
    /** Returns race rounds assigned to the current referee (optimised bulk query). */
    getRefereeRaceRounds: async (): Promise<{ code: number; data: RaceRoundData[]; msg: string }> => {
        try {
            const response = await api.get('/referee/race-rounds');
            console.log('getRefereeRaceRounds:', response.data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || error;
        }
    },

    /** Returns tournaments (with nested rounds) assigned to the current referee. */
    getRefereeTournaments: async (): Promise<{ code: number; data: TournamentWithRounds[]; msg: string }> => {
        try {
            const response = await api.get('/referee/tournaments');
            console.log('getRefereeTournaments:', response.data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || error;
        }
    },

    getActiveRules: async (): Promise<{ code: number; data: any[]; msg: string }> => {
        try {
            const response = await api.get('/eligibility-rules');
            console.log('getActiveRules:', response.data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || error;
        }
    },

    getRefereeInvitations: async (
        limit = 5,
        page = 1,
        status?: string,
    ): Promise<{ code: number; data: any[]; pagination: any; msg: string }> => {
        try {
            const statusParam = status ? `&status=${status}` : '';
            const response = await api.get(`/referee/invitations?limit=${limit}&page=${page}${statusParam}`);
            console.log('getRefereeInvitations:', response.data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || error;
        }
    },

    acceptInvitation: async (id: string): Promise<{ code: number; data: any; msg: string }> => {
        try {
            const response = await api.put(`/referee/invitations/${id}/accept`);
            console.log('acceptInvitation:', response.data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || error;
        }
    },

    rejectInvitation: async (id: string): Promise<{ code: number; data: any; msg: string }> => {
        try {
            const response = await api.put(`/referee/invitations/${id}/reject`);
            console.log('rejectInvitation:', response.data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || error;
        }
    },

    getRaceRoundById: async (id: string): Promise<{ code: number; data: any; msg: string }> => {
        try {
            const response = await api.get(`/referee/race-rounds/${id}`);
            console.log('getRaceRoundById:', response.data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || error;
        }
    },
};
