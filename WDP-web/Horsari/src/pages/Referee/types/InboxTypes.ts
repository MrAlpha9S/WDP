// ── Inbox Domain Types ─────────────────────────────────────────────────────────

export type InviteStatus = "pending" | "accepted" | "declined";
export type PaymentStatus = "unpaid" | "processing" | "paid";
export type RaceType = "Stakes" | "Allowance" | "Claiming" | "Maiden";
export type GradeLevel = "G1" | "G2" | "G3" | "Listed" | "Open";

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
