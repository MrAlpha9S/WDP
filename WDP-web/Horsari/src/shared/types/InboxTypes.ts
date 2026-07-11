import type { RaceType, InviteStatus, PaymentStatus } from "./CommonTypes";
export type { RaceType, InviteStatus, PaymentStatus };

export interface RaceInvite {
    id: string;
    race: string;
    raceLabel: string;
    venue: string;
    trackLocation: string;
    date: string;
    time: string;
    role: string;
    sentAt: string;
    status: InviteStatus;
    isNew?: boolean;
    raceType: RaceType;
    distance: string;
    track: string;
    entries: number;
    assignedBy: string;
    notes: string;
    fee: number;
    paymentStatus: PaymentStatus;
    paymentMethod?: string;
    tournamentName?: string;
    paidOn?: string;
}
