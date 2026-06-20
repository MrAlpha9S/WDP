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

export interface ViolationTypeRecord {
    _id: string;
    violationName: string;
    violationDescription?: string;
    defaultPenalty?: string;
    type: 'pre-race' | 'during-race' | 'after-race';
    category?: 'riding' | 'horse-safety' | 'medication' | 'betting' | 'administrative';
    severity?: number;
    isActive?: boolean;
}

export interface ViolationRecord {
    _id: string;
    registrationId?: string | { _id: string };
    raceRoundId?: string;
    violationTypeId?: {
        _id: string;
        violationName: string;
        type?: 'pre-race' | 'during-race' | 'after-race';
        category?: string;
        severity?: number;
        defaultPenalty?: string;
    } | null;
    description?: string;
    severity?: number;
    violationStatus?: 'pending' | 'confirmed' | 'dismissed';
    stewardAction?: string;
    actualPenalty?: string;
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

    verifyRegistration: async (
        raceRoundId: string,
        registrationId: string,
        body: {
            status: 'verified' | 'failed';
            verificationFailReason?: string;
            selectedInvitationId?: string;
            failedChecks?: string[];
            selectedViolationTypeId?: string;
        },
    ): Promise<{ code: number; data: any; msg: string }> => {
        try {
            const response = await api.put(
                `/referee/race-rounds/${raceRoundId}/registrations/${registrationId}/verify`,
                body,
            );
            return response.data;
        } catch (error: any) {
            throw error.response?.data || error;
        }
    },

    cancelRegistration: async (
        raceRoundId: string,
        registrationId: string,
    ): Promise<{ code: number; data: any; msg: string }> => {
        try {
            const response = await api.put(
                `/referee/race-rounds/${raceRoundId}/registrations/${registrationId}/cancel`,
            );
            return response.data;
        } catch (error: any) {
            throw error.response?.data || error;
        }
    },

    finalizeRaceRound: async (
        raceRoundId: string,
    ): Promise<{ code: number; data: { status: 'prepared' | 'cancelled' }; msg: string }> => {
        try {
            const response = await api.post(`/referee/race-rounds/${raceRoundId}/finalize`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || error;
        }
    },

    getViolationTypes: async (type?: 'pre-race' | 'during-race' | 'after-race'): Promise<{ code: number; data: ViolationTypeRecord[]; msg: string }> => {
        try {
            const q = type ? `?type=${type}` : '';
            const response = await api.get(`/referee/violation-types${q}`);
            console.log('getViolationTypes:', response.data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || error;
        }
    },

    getRaceRoundViolations: async (raceRoundId: string): Promise<{ code: number; data: ViolationRecord[]; msg: string }> => {
        try {
            const response = await api.get(`/referee/race-rounds/${raceRoundId}/violations`);
            console.log('getRaceRoundViolations:', response.data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || error;
        }
    },

    createViolation: async (body: {
        raceRoundId: string;
        registrationId?: string;
        violationTypeId: string;
        description?: string;
    }): Promise<{ code: number; data: ViolationRecord; msg: string }> => {
        try {
            const response = await api.post('/referee/violations', body);
            console.log('createViolation:', response.data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || error;
        }
    },

    deleteViolation: async (violationId: string): Promise<{ code: number; msg: string }> => {
        try {
            const response = await api.delete(`/referee/violations/${violationId}`);
            console.log('deleteViolation:', response.data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || error;
        }
    },

    confirmRaceResult: async (id: string): Promise<{ code: number; data: any; msg: string }> => {
        try {
            const response = await api.post(`/referee/race-rounds/${id}/confirm-result`);
            console.log('confirmRaceResult:', response.data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || error;
        }
    },
};
