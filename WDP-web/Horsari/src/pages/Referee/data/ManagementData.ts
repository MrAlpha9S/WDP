// ── Management Domain Types ────────────────────────────────────────────────────

export type ViolationStatus = "Confirmed" | "Pending Review" | "Dismissed";

export interface Incident {
    id: string;
    timestamp: string;
    race: string;
    raceLabel: string;
    offender: string;
    offenderType: "jockey" | "horse";
    violationType: string;
    status: ViolationStatus;
}

// ── Violation mock data ────────────────────────────────────────────────────────

export const INCIDENTS: Incident[] = [
    {
        id: "VI0-8492",
        timestamp: "2024-10-24  14:32:05",
        race: "R-992",
        raceLabel: "Dubai Turf",
        offender: "Marcus Vance",
        offenderType: "jockey",
        violationType: "Interference (Whip)",
        status: "Confirmed",
    },
    {
        id: "VI0-8491",
        timestamp: "2024-10-24  12:15:22",
        race: "R-990",
        raceLabel: "Ascot Stakes",
        offender: "Elena Rostova",
        offenderType: "jockey",
        violationType: "Weighing In Irregularity",
        status: "Pending Review",
    },
    {
        id: "VI0-8488",
        timestamp: "2024-10-23  16:45:00",
        race: "R-985",
        raceLabel: "Kentucky Prep",
        offender: "Midnight Runner",
        offenderType: "horse",
        violationType: "Gate Break Violation",
        status: "Dismissed",
    },
];

export const JOCKEYS = ["All Jockeys", "Marcus Vance", "Elena Rostova"];
export const STATUSES: ViolationStatus[] = ["Confirmed", "Pending Review", "Dismissed"];
