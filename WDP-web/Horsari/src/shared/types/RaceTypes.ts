import type { ReactNode } from "react";
export type { RaceType } from "./CommonTypes";

export type ViewMode = "timeline" | "table";

export interface Track {
    id: string;
    name: string;
    surface: string;
    distance: string;
}

export interface Participant {
    horseId: string;
    horseName: string;
    jockeyId: string;
    jockeyName: string;
    rating: number;
}

export interface PendingInvite {
    id: string;
    ownerName: string;
    horseName: string;
}

export interface ScheduledRace {
    id: string;
    title: string;
    date: string;
    time: string; // e.g. "14:15"
    trackId: string;
    tournament: string;
    status: "Upcoming" | "Live" | "Completed";
    maxSlots: number;
    participants: Participant[];
    pendingInvites: PendingInvite[];
    // For CSS positioning in a simple visual demo:
    leftPercent: string;
    widthPercent: string;
    raceType?: string;
}

export interface MockHorse {
    id: string;
    name: string;
    wins: number;
}

export interface MockHorseOwner {
    id: string;
    ownerName: string;
    horses: MockHorse[];
}

export type RacePhase = "pre" | "live" | "post";
export type VerificationStatus = "cleared" | "review" | "pending";
export type PassFail = "pass" | "fail" | null;

export interface Jockey {
    id: string;
    name: string;
    license: string;
    role: "main" | "backup";
    weight: string;
}

export interface HorseEntry {
    number: number;
    name: string;
    jockey: string;
    trainer: string;
    weight: string;
    microchipId: string;
    photo: string;
    mainJockey: Jockey;
    backupJockey: Jockey;
    gearStatus: VerificationStatus;
    jockeyStatus: VerificationStatus;
    position?: number;
    finishPosition?: number;
    finishTime?: string;
    objection?: boolean;
}

export interface IncidentType {
    id: string;
    label: string;
    icon: ReactNode;
}

export interface LoggedIncident {
    id: string;
    label: string;
    horse: string;
    time: string;
}
