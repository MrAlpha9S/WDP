import api, { NETWORK_ERROR_MESSAGE } from './axios';
import type { RaceRoundData } from './adminService';
import type { PaymentEntity, PaymentStatus, PaymentsResponse } from './paymentTypes';
import type { RaceRoundDetail } from '../providers/useRaceSocket';
import type { ViolationEntity } from '../shared/types/ViolationTypes';
import type { SelfProfileResponse, UpdateSelfProfilePayload } from './profileTypes';

export interface RefereeWalletInfo {
    referee: { _id: string; wallet: number };
    stats: { totalFeesReceived: number };
}

export interface RefereeStatistics {
    wallet: number;
    totalInvitations: number;
    totalRacesOfficiated: number;
    acceptedCount: number;
    rejectedCount: number;
    pendingCount: number;
    totalFeesEarned: number;
    pendingFeesAmount: number;
    totalViolationsFiled: number;
    confirmedViolationsCount: number;
    dismissedViolationsCount: number;
}

export interface ViolationHistoryEntry {
    violationId: string;
    typeName: string | null;
    description: string | null;
    severity: number | null;
    stewardAction: string | null;
    violationStatus: string;
    reportedAt: string;
}

export interface WorkHistoryEntry {
    assignmentId: string;
    raceRoundId: string | null;
    roundName: string | null;
    raceDate: string | null;
    location: string | null;
    raceGround: string | null;
    trackLength: number | null;
    paymentStatus: string;
    fee: number;
    assignedAt: string;
    violations: ViolationHistoryEntry[];
}

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
    baseFee?: number;
    firstPlacePrize?: number;
    secondPlacePrize?: number;
    thirdPlacePrize?: number;
    eligibilityRuleId?: string;
    tournamentId?: string;
    RaceType?: { raceType?: string } | null;
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

export interface PaginationMeta {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
}

export interface InvitationEntity {
    _id: string;
    jockeyId?: string;
    horseId?: string;
    registrationId?: string;
    invitationStatus: string;
    jockeyConfirmation?: boolean;
    ownerConfirmation?: boolean;
    isBackup?: boolean;
    percentagePayout?: number;
    bookingFees?: number;
}

/** Raw RaceReferee assignment doc — pagination uses `total`, not `totalItems`, matching the real backend response shape. */
export interface RefereeInvitationItem {
    _id: string;
    raceRoundId: {
        _id: string;
        roundName?: string;
        raceDate?: string;
        location?: string;
        address?: string;
        baseFee?: number;
        currencyType?: string;
        eligibilityRuleId?: { raceType?: string } | null;
        tournamentId?: { tournamentName?: string } | null;
    } | null;
    refereeId: string;
    status: string;
    fee?: number;
    assignedAt?: string;
    assignedByAdminId?: string;
    assignedByName: string | null;
    paymentStatus: 'unpaid' | 'processing' | 'paid';
    /** VND — real confirmed Transaction amount once one exists, else a computed estimate. */
    expectedPayment: number;
    /** Transaction _id for the matching referee_fee payment — null pre-confirmation. Referee is always the payee. */
    paymentId: string | null;
    payeeConfirmed: boolean;
}

export interface RefereeInvitationsPagination {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
}


// ── Service ───────────────────────────────────────────────────────────────────

export const refereeService = {
    getMyProfile: async (): Promise<SelfProfileResponse> => {
        try {
            const response = await api.get('/referee/my-profile');
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
        }
    },

    updateMyProfile: async (payload: UpdateSelfProfilePayload): Promise<SelfProfileResponse> => {
        try {
            const response = await api.put('/referee/my-profile', payload);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
        }
    },

    updateMyLicense: async (file: File): Promise<SelfProfileResponse> => {
        try {
            const form = new FormData();
            form.append('license', file);
            const response = await api.put('/referee/my-profile/license', form, {
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

    /** Returns race rounds assigned to the current referee (paginated). */
    getRefereeRaceRounds: async (
        page = 1,
        limit = 10,
        status?: string,
        search?: string,
        sortBy = 'raceDate',
        order: 'asc' | 'desc' = 'desc',
    ): Promise<{ code: number; data: { items: RaceRoundData[]; pagination: PaginationMeta }; msg: string }> => {
        try {
            const params: Record<string, unknown> = { page, limit, sortBy, order };
            if (status) params.status = status;
            if (search) params.search = search;
            const response = await api.get('/referee/race-rounds', { params });
            console.log('getRefereeRaceRounds:', response.data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
        }
    },

    /** Returns tournaments (with nested rounds) assigned to the current referee (paginated). */
    getRefereeTournaments: async (
        page = 1,
        limit = 10,
        status?: string,
        search?: string,
        sortBy = 'startDate',
        order: 'asc' | 'desc' = 'desc',
    ): Promise<{ code: number; data: { items: TournamentWithRounds[]; pagination: PaginationMeta }; msg: string }> => {
        try {
            const params: Record<string, unknown> = { page, limit, sortBy, order };
            if (status) params.status = status;
            if (search) params.search = search;
            const response = await api.get('/referee/tournaments', { params });
            console.log('getRefereeTournaments:', response.data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
        }
    },

    getActiveRules: async (): Promise<{ code: number; data: { items: Record<string, unknown>[]; pagination: PaginationMeta }; msg: string }> => {
        try {
            const response = await api.get('/eligibility-rules');
            console.log('getActiveRules:', response.data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
        }
    },

    getRefereeInvitations: async (
        limit = 5,
        page = 1,
        status?: string,
    ): Promise<{ code: number; data: RefereeInvitationItem[]; pagination: RefereeInvitationsPagination; msg: string }> => {
        try {
            const statusParam = status ? `&status=${status}` : '';
            const response = await api.get(`/referee/invitations?limit=${limit}&page=${page}${statusParam}`);
            console.log('getRefereeInvitations:', response.data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
        }
    },

    acceptInvitation: async (id: string): Promise<{ code: number; data: RefereeInvitationItem; msg: string }> => {
        try {
            const response = await api.put(`/referee/invitations/${id}/accept`);
            console.log('acceptInvitation:', response.data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
        }
    },

    rejectInvitation: async (id: string): Promise<{ code: number; data: RefereeInvitationItem; msg: string }> => {
        try {
            const response = await api.put(`/referee/invitations/${id}/reject`);
            console.log('rejectInvitation:', response.data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
        }
    },

    getRaceRoundById: async (id: string): Promise<{ code: number; data: RaceRoundDetail; msg: string }> => {
        try {
            const response = await api.get(`/referee/race-rounds/${id}`);
            console.log('getRaceRoundById:', response.data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
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
    ): Promise<{ code: number; data: RegistrationEntry; msg: string }> => {
        try {
            const response = await api.put(
                `/referee/race-rounds/${raceRoundId}/registrations/${registrationId}/verify`,
                body,
            );
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
        }
    },

    cancelRegistration: async (
        raceRoundId: string,
        registrationId: string,
    ): Promise<{ code: number; data: RegistrationEntry; msg: string }> => {
        try {
            const response = await api.put(
                `/referee/race-rounds/${raceRoundId}/registrations/${registrationId}/cancel`,
            );
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
        }
    },

    /** Marks the jockey on an invitation as a no-show (didNotAttend) for race day. */
    markJockeyNoShow: async (invitationId: string): Promise<{ code: number; data: InvitationEntity; msg: string }> => {
        try {
            const response = await api.put(`/referee/invitations/${invitationId}/no-show`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
        }
    },

    finalizeRaceRound: async (
        raceRoundId: string,
    ): Promise<{ code: number; data: { status: 'prepared' | 'cancelled' }; msg: string }> => {
        try {
            const response = await api.post(`/referee/race-rounds/${raceRoundId}/finalize`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
        }
    },

    getViolationTypes: async (
        type?: 'pre-race' | 'during-race' | 'after-race',
        page = 1,
        limit = 50,
        search?: string,
        sortBy = 'severity',
        order: 'asc' | 'desc' = 'asc',
    ): Promise<{ code: number; data: { items: ViolationTypeRecord[]; pagination: PaginationMeta }; msg: string }> => {
        try {
            const params: Record<string, unknown> = { page, limit, sortBy, order };
            if (type) params.type = type;
            if (search) params.search = search;
            const response = await api.get('/referee/violation-types', { params });
            console.log('getViolationTypes:', response.data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
        }
    },

    /** System-wide violations list (not scoped to this referee's own assignments). */
    getAllViolations: async (
        page = 1,
        limit = 10,
        status?: string,
        severity?: number,
        raceRoundId?: string,
        sortBy = 'created_at',
        order: 'asc' | 'desc' = 'desc',
    ): Promise<{ code: number; data: { items: ViolationEntity[]; pagination: { page: number; limit: number; totalItems: number; totalPages: number } }; msg: string }> => {
        try {
            const params: Record<string, unknown> = { page, limit, sortBy, order };
            if (status) params.status = status;
            if (severity) params.severity = severity;
            if (raceRoundId) params.raceRoundId = raceRoundId;
            const response = await api.get('/referee/violations', { params });
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
        }
    },

    getRaceRoundViolations: async (
        raceRoundId: string,
        status?: string,
        search?: string,
        sortBy = 'created_at',
        order: 'asc' | 'desc' = 'desc',
    ): Promise<{ code: number; data: ViolationRecord[]; msg: string }> => {
        try {
            const params: Record<string, unknown> = { sortBy, order };
            if (status) params.status = status;
            if (search) params.search = search;
            const response = await api.get(`/referee/race-rounds/${raceRoundId}/violations`, { params });
            console.log('getRaceRoundViolations:', response.data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
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
            throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
        }
    },

    confirmViolation: async (violationId: string): Promise<{ code: number; msg: string }> => {
        try {
            const response = await api.put(`/referee/violations/${violationId}/confirm`);
            console.log('confirmViolation:', response.data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
        }
    },

    deleteViolation: async (violationId: string): Promise<{ code: number; msg: string }> => {
        try {
            const response = await api.delete(`/referee/violations/${violationId}`);
            console.log('deleteViolation:', response.data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
        }
    },

    confirmRaceResult: async (
        id: string,
    ): Promise<{ code: number; data: { raceRound: RaceRoundData; results: Record<string, unknown>[] }; msg: string }> => {
        try {
            const response = await api.post(`/referee/race-rounds/${id}/confirm-result`);
            console.log('confirmRaceResult:', response.data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
        }
    },

    // --- Wallet + Payment Verification ---
    // Referee is always the payee for referee_fee (owed by admin). Statistical
    // wallet only — the actual money changes hands outside the system.

    getWalletInfo: async (): Promise<{ code: number; data: RefereeWalletInfo; msg: string }> => {
        try {
            const response = await api.get('/referee/wallet');
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
        }
    },

    getStatistics: async (): Promise<{ code: number; data: RefereeStatistics; msg: string }> => {
        try {
            const response = await api.get('/referee/statistics');
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
        }
    },

    /** Fees earned over time (day/week/month/year), gap-filled so charts always render a contiguous line. */
    getFeesEarningsSeries: async (
        groupBy: 'day' | 'week' | 'month' | 'year' = 'day',
    ): Promise<{ code: number; data: { totalFeesEarned: number; series: { date: string; feesEarned: number }[] }; msg: string }> => {
        try {
            const response = await api.get('/referee/statistics/earnings-series', { params: { groupBy } });
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
        }
    },

    /** Completed race rounds this referee has officiated, with violations logged against each (paginated). */
    getWorkHistory: async (
        page = 1,
        limit = 10,
        sortBy = 'raceDate',
        order: 'asc' | 'desc' = 'desc',
    ): Promise<{ code: number; data: { items: WorkHistoryEntry[]; pagination: PaginationMeta }; msg: string }> => {
        try {
            const params: Record<string, unknown> = { page, limit, sortBy, order };
            const response = await api.get('/referee/work-history', { params });
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
        }
    },

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
            const response = await api.get('/referee/payments', { params });
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
        }
    },

    confirmPaymentReceived: async (paymentId: string): Promise<{ code: number; data: PaymentEntity; msg: string }> => {
        try {
            const response = await api.put(`/referee/payments/${paymentId}/confirm-received`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { msg: NETWORK_ERROR_MESSAGE, isNetworkError: true };
        }
    },
};
