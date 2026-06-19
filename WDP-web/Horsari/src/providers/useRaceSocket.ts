import { createContext, useContext } from "react";
import type { Socket } from "socket.io-client";
import type { HorseEntry } from "../shared/types/RaceTypes";

// ── Race round shape returned by GET /referee/race-rounds/:id ─────────────────

export interface InvitationDetail {
    _id: string;
    jockeyId?: {
        _id?: { _id?: string; fullName?: string } | null;
    } | null;
    jockeyConfirmation?: boolean;
    invitationStatus?: string;
    isBackup?: boolean;
    isJockeyInRace?: boolean;
    percentagePayout?: number;
}

export interface RegistrationDetail {
    _id: string;
    registrationStatus?: string;
    verificationFailReason?: string | null;
    Horse?: {
        _id: string;
        horseName?: string;
        microchipId?: string;
        color?: string;
        breed?: string;
        photo?: string;
    } | null;
    Jockey?: {
        _id?: { _id?: string; fullName?: string } | null;
    } | null;
    Invitations?: InvitationDetail[];
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
    /** Mux live stream playback ID — available once admin starts the race */
    muxPlaybackId?: string | null;
    /** Mux VOD playback ID — available after the stream ends and Mux processes it */
    muxVodPlaybackId?: string | null;
}

// ── Live simulation types ─────────────────────────────────────────────────────

export type RaceStyle = 'Runner' | 'Pace' | 'Late';

export interface LiveHorse {
    registrationId: string;
    number: number;
    horseName: string;
    jockeyName: string;
    raceStyle: RaceStyle;
    currentDistance: number;
    currentSpeed: number;
    isFinished: boolean;
    finishPosition: number | null;
    finishTime: string | null;
}

export interface RaceUpdate {
    raceRoundId: string;
    elapsedSeconds: number;
    /** Next 100 m checkpoint ahead of the leader */
    lineMark: number;
    trackLength: number;
    horses: LiveHorse[];
}

export interface FinishResult {
    registrationId: string;
    horseName: string;
    jockeyName: string;
    finishPosition: number | null;
    finishTime: string | null;
}

export interface RaceFinishedPayload {
    raceRoundId: string;
    results: FinishResult[];
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
    /** Latest real-time tick from the simulation (null before race starts) */
    liveUpdate: RaceUpdate | null;
    /** Populated once the simulation reports all horses finished */
    raceFinished: RaceFinishedPayload | null;
}

export const RaceSocketContext = createContext<RaceSocketContextValue>({
    socket: null,
    wsConnected: false,
    wsCount: null,
    raceRound: null,
    horses: [],
    liveUpdate: null,
    raceFinished: null,
});

export function useRaceSocket(): RaceSocketContextValue {
    return useContext(RaceSocketContext);
}
