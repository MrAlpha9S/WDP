// ── Shared types ──────────────────────────────────────────────────────────────
export type RaceStatus = "LIVE" | "UPCOMING" | "FINISHED" | "PREPARING";
export type InviteStatus = 'pending' | 'approved' | 'rejected' | 'verified' | 'failed' | 'cancelled'
export type InviteJockeyStatus = 'pending' | 'accepted' | 'declined' | 'cancelled'

export interface MyRace {
  id: number;
  name: string;
  date: string;
  venue: string;
  horse: string;
  jockey: string;
  status: RaceStatus;
  image: string;
}

export interface Invitation {
  id: number;
  name: string;
  type: "Race" | "Tournament";
  date: string;
  venue: string;
  horse: string;
  jockey: string;
  prize: string;
  distance: string;
  grade: string;
  image: string;
  sentBy: string;
  sentAt: string;
  status: InviteStatus;
  prize1st?: number | null;
  prize2nd?: number | null;
  prize3rd?: number | null;
  currencyType?: string;
}

