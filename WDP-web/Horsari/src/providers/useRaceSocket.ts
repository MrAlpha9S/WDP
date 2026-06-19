import { createContext, useContext } from "react";
import type { Socket } from "socket.io-client";
import type { HorseEntry } from "../shared/types/RaceTypes";

// ── Race round shape returned by GET /referee/race-rounds/:id ─────────────────

export interface RegistrationDetail {
    _id: string;
    registrationStatus?: string;
    Horse?: { _id: string; horseName?: string } | null;
    Jockey?: { _id: { _id?: string; fullName?: string } | null } | null;
    Owner?: { _id: string; fullName?: string } | null;
    RaceResult?: { finishPosition?: number; finishTime?: string } | null;
}

export interface RaceRoundDetail {
    _id: string;
    roundName?: string;
    raceDate?: string;
    status?: string;
    trackLength?: number;
    raceGround?: string;
    location?: string;
    address?: string;
    firstPlacePrize?: number;
    secondPlacePrize?: number;
    thirdPlacePrize?: number;
    currencyType?: string;
    maxParticipants?: number;
    RaceType?: { raceType?: string; gradeLevel?: string } | null;
    Registration?: RegistrationDetail[];
}

// ── Context value shared with all descendant pages ────────────────────────────

export interface RaceSocketContextValue {
    socket: Socket | null;
    wsConnected: boolean;
    wsCount: number | null;
    /** Full race round fetched from the referee API */
    raceRound: RaceRoundDetail | null;
    /** Registrations pre-mapped to HorseEntry for use in Pre/Live/Post pages */
    horses: HorseEntry[];
}

export const RaceSocketContext = createContext<RaceSocketContextValue>({
    socket: null,
    wsConnected: false,
    wsCount: null,
    raceRound: null,
    horses: [],
});

export function useRaceSocket(): RaceSocketContextValue {
    return useContext(RaceSocketContext);
}
