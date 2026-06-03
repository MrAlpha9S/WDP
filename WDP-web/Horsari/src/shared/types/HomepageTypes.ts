import type { RaceType, GradeLevel, InviteStatus } from "./CommonTypes";
export type { RaceType, GradeLevel, InviteStatus };

export interface UpcomingRace {
    id: string;
    label: string;
    venue: string;
    trackLocation: string;
    date: Date;
    time: string;
    role: string;
    raceType: RaceType;
    gradeLevel: GradeLevel;
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
    gradeLevel: GradeLevel;
    sentAt: string;
    status: InviteStatus;
    isNew?: boolean;
    fee: number;
}
