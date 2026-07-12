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
    assignedBy: string | null;
    fee: number;
    /** VND — real confirmed amount once paid, else a computed estimate. */
    expectedPayment: number;
    paymentStatus: PaymentStatus;
    /** Transaction _id for the matching referee_fee payment — null pre-confirmation. */
    paymentId: string | null;
    payeeConfirmed: boolean;
    paymentMethod?: string;
    tournamentName?: string;
    paidOn?: string;
}
