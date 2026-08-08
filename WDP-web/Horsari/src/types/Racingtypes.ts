// ── Shared types ──────────────────────────────────────────────────────────────
export type RaceStatus = "LIVE" | "UPCOMING" | "FINISHED" | "PREPARING";
export type InviteStatus = 'pending' | 'accepted' | 'rejected' | 'verified' | 'failed' | 'cancelled'
export type InviteJockeyStatus = 'pending' | 'accepted' | 'declined' | 'cancelled'

export interface MyRace {
  id: string | number;
  name: string;
  date: string;
  venue: string;
  horse: string;
  jockey: string;
  status: RaceStatus;
  image: string;
  raceRoundId?: string | null;
}

export interface Invitation {
  id: number;
  name: string;
  type: "Race" | "Tournament";
  date: string;
  venue: string;
  address?: string;
  prize: string;
  distance: string;
  image: string;
  sentBy: string;
  sentAt: string;
  status: InviteStatus;
  prize1st?: number | null;
  prize2nd?: number | null;
  prize3rd?: number | null;
  currencyType?: string;
}

