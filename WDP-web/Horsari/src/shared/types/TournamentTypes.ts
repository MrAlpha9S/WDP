import type { RaceType, GradeLevel } from "./CommonTypes";
export type { RaceType, GradeLevel };

export type TournamentStatus = "live" | "upcoming" | "completed";
export type AssignmentStatus = "assigned" | "partial" | "none";
export type RaceStatus = "completed" | "live" | "upcoming" | "prepared";
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

// ── Admin Tournament Detail ────────────────────────────────────────────────────

export interface TournamentDetailData {
    tournament: {
        _id: string;
        tournamentName: string;
        description: string;
        startDate: string | null;
        endDate: string | null;
        status: 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
        prizePool: number;
        championHorseId: string | null;
        championHorseName: string | null;
    };
    raceRounds: TournamentRaceRoundSummary[];
}

export interface TournamentRaceRoundSummary {
    _id: string;
    roundName: string;
    raceDate: string;
    status: string;
    trackLength: number;
    maxParticipants: number;
    firstPlacePrize: number;
    secondPlacePrize: number;
    thirdPlacePrize: number;
    currencyType: string;
    location: string;
    participantCount: number;
}

export interface RoundBreakdownEntry {
    roundId: string;
    roundName: string;
    raceDate: string;
    roundStatus: string;
    type: 'result' | 'no_result' | 'not_registered';
    finishPosition?: number;
    prizeMoney?: number;
    registrationStatus?: string;
}

export interface TournamentRankEntry {
    rank: number;
    horseId: string;
    horseName: string;
    horseImg: string | null;
    ownerId: string;
    ownerName: string;
    score: number;
    totalRaces: number;
    wins: number;
    podiums: number;
    totalPrizeMoney: number;
    roundBreakdown: RoundBreakdownEntry[];
}
