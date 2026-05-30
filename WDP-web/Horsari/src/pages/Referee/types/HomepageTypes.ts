// ── Homepage Domain Types ──────────────────────────────────────────────────────

export type InviteStatus = "pending" | "accepted" | "declined";
export type RaceType = "Stakes" | "Allowance" | "Claiming" | "Maiden";
export type GradeLevel = "G1" | "G2" | "G3" | "Listed" | "Open";

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
