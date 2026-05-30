import type { ReactNode } from "react";

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
