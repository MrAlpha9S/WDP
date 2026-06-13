import apiClient from './axios';

// ─── Schedule types ──────────────────────────────────────────────────────────

export interface ScheduleRaceRound {
  raceRoundId: string;
  roundName: string;
  raceDate: string;
  trackLength: number;
  location: string;
  address: string;
  raceGround: string;
  maxParticipants: number;
  status: string;
  requireEntranceFees: number;
}

export interface ScheduleItem {
  invitationId: string;
  isBackup: boolean;
  percentagePayout: number;
  horse: {
    horseId: string;
    horseName: string;
    breed: string;
    healthStatus: string;
  } | null;
  registration: { registrationId: string } | null;
  horseOwner: { ownerId: string; user: { fullName: string } | null } | null;
  raceRound: ScheduleRaceRound | null;
  tournament: { tournamentName: string; startDate: string; endDate: string } | null;
}

// ─── Invitation types ────────────────────────────────────────────────────────

export interface InvitationItem {
  invitationId: string;
  invitationStatus: 'pending' | 'accepted' | 'declined' | 'cancelled';
  ownerConfirmation: boolean;
  jockeyConfirmation: boolean;
  isBackup: boolean;
  percentagePayout: number;
  horse: {
    horseId: string;
    horseName: string;
    breed: string;
    gender: string;
  } | null;
  registration: {
    registrationId: string;
    registrationStatus: string;
    registeredAt: string;
  } | null;
  horseOwner: {
    ownerId: string;
    user: { fullName: string; phoneNumber: string } | null;
  } | null;
  raceRound: {
    raceRoundId: string;
    roundName: string;
    raceDate: string | null;
    trackLength: number;
    location: string;
    raceGround: string;
    status: string;
    minimalRidingFees: number;
  } | null;
  tournament: { tournamentId: string; tournamentName: string } | null;
}

// ─── API calls ───────────────────────────────────────────────────────────────

export async function getMyRaceSchedule(): Promise<ScheduleItem[]> {
  const res = await apiClient.get<{ code: number; data: ScheduleItem[]; msg: string }>(
    '/api/jockey/my-race-schedule'
  );
  return res.data.code === 200 ? (res.data.data ?? []) : [];
}

export async function getMyInvitations(): Promise<InvitationItem[]> {
  const res = await apiClient.get<{ code: number; data: InvitationItem[]; msg: string }>(
    '/api/jockey/my-invitations'
  );
  return res.data.code === 200 ? (res.data.data ?? []) : [];
}

export async function respondToInvitation(
  invitationId: string,
  action: 'accepted' | 'rejected'
): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await apiClient.put<{ code: number; msg: string }>(
      `/api/jockey/invitation/${invitationId}/respond`,
      { jockeyConfirmation: action }
    );
    return { ok: res.data.code === 200, message: res.data.msg };
  } catch (err: any) {
    return {
      ok: false,
      message: err?.response?.data?.msg ?? 'Lỗi kết nối. Vui lòng thử lại.',
    };
  }
}
