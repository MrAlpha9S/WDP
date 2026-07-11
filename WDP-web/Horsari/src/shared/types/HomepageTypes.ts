import type { RaceType, InviteStatus } from "./CommonTypes";
export type { RaceType, InviteStatus };

export interface UpcomingRace {
    id: string;
    label: string;
    venue: string;
    trackLocation: string;
    date: Date;
    time: string;
    role: string;
    raceType: RaceType;
    status: "confirmed" | "tentative";
}

export interface RecentInvite {
    id: string;
    raceLabel: string;
    venue: string;
    trackLocation: string;
    date: string;
    role: string;
    raceType: RaceType;
    sentAt: string;
    status: InviteStatus;
    isNew?: boolean;
    fee: number;
    tournamentName?: string;
}
