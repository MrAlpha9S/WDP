import type { RaceType, GradeLevel, InviteStatus, PaymentStatus } from "./CommonTypes";
export type { RaceType, GradeLevel, InviteStatus, PaymentStatus };

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
    gradeLevel: GradeLevel;
    distance: string;
    track: string;
    entries: number;
    assignedBy: string;
    notes: string;
    fee: number;
    paymentStatus: PaymentStatus;
    paymentMethod?: string;
    paidOn?: string;
}
