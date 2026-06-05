import type { RaceType, GradeLevel } from "./CommonTypes";
export type { RaceType, GradeLevel };

export type TournamentStatus = "live" | "upcoming" | "completed";
export type AssignmentStatus = "assigned" | "partial" | "none";
export type RaceStatus = "completed" | "live" | "upcoming";
export type ModalTab = "overview" | "races";

export interface Tournament {
    id: string;
    name: string;
    series: string;
    country: string;
    location: string;
    startDate: string;
    endDate: string;
    startISO: string;
    endISO: string;
    totalRaces: number;
    completedRaces: number;
    prizePool: string;
    status: TournamentStatus;
    assignment: AssignmentStatus;
    assignedRaces: number;
    grade: "G1" | "G2" | "G3" | "Listed";
    description: string;
    color: string;
}

export interface RaceRound {
    id: string;
    round: number;
    label: string;
    venue: string;
    trackLocation: string;
    date: string;
    dateISO: string;
    time: string;
    raceType: RaceType;
    gradeLevel: GradeLevel;
    distance: string;
    track: string;
    entries: number;
    prizePool: string;
    refereeFee: number;
    status: RaceStatus;
    violations: number;
    tournamentId: string;
}

export interface LeaderEntry {
    rank: number;
    horse: string;
    owner: string;
    points: number;
    wins: number;
    maxPoints: number;
    /** Placement per race round, in order. null = pending/future, number = finishing position */
    placements: (number | null)[];
}
