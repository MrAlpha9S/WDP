// ── Shared types ──────────────────────────────────────────────────────────────
export type RaceStatus   = "LIVE" | "UPCOMING" | "FINISHED";
export type InviteStatus = 'pending' | 'approved' | 'rejected' | 'verified' | 'failed' | 'cancelled'

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
}

