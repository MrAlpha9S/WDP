// ── Types ─────────────────────────────────────────────────────────────────────

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
    icon: React.ReactNode;
}

export interface LoggedIncident {
    id: string;
    label: string;
    horse: string;
    time: string;
}

// ── Race data ─────────────────────────────────────────────────────────────────

export const RACE = {
    number: 5,
    title: "The Pegasus Cup",
    track: "Dirt",
    condition: "Fast",
    distance: "1 1/8 Miles",
    scheduledTime: "3:30 PM ET",
    pace: "23.4s",
    position: "4F",
    leader: "#4 Thunderstrike",
    officialTime: "1:48.23",
    venue: "Churchill Downs",
    grade: "G1",
    prizePool: "$2.2M",
    id: "R5-9926",
};

export const HORSES: HorseEntry[] = [
    {
        number: 1, name: "Midnight Eclipse", jockey: "J. Rosario",
        trainer: "T. Pletcher", weight: "126 lbs",
        microchipId: "982000362108001",
        photo: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=120&q=80",
        mainJockey: { id: "JK-101", name: "J. Rosario", license: "LIC-2024-0101", role: "main", weight: "126 lbs" },
        backupJockey: { id: "JK-102", name: "M. Franco", license: "LIC-2024-0102", role: "backup", weight: "124 lbs" },
        gearStatus: "cleared", jockeyStatus: "cleared",
        position: 3, finishPosition: 3, finishTime: "1:48.91", objection: false,
    },
    {
        number: 2, name: "Stormbringer", jockey: "L. Ortiz Jr.",
        trainer: "C. Brown", weight: "124 lbs",
        microchipId: "982000362108002",
        photo: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=120&q=80",
        mainJockey: { id: "JK-201", name: "L. Ortiz Jr.", license: "LIC-2024-0201", role: "main", weight: "124 lbs" },
        backupJockey: { id: "JK-202", name: "T. Gaffalione", license: "LIC-2024-0202", role: "backup", weight: "122 lbs" },
        gearStatus: "cleared", jockeyStatus: "cleared",
        position: 2, finishPosition: 2, finishTime: "1:48.54", objection: false,
    },
    {
        number: 3, name: "Golden Horizon", jockey: "F. Prat",
        trainer: "B. Baffert", weight: "126 lbs",
        microchipId: "982000362108003",
        photo: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=120&q=80",
        mainJockey: { id: "JK-301", name: "F. Prat", license: "LIC-2024-0301", role: "main", weight: "126 lbs" },
        backupJockey: { id: "JK-302", name: "J. Castellano", license: "LIC-2024-0302", role: "backup", weight: "124 lbs" },
        gearStatus: "cleared", jockeyStatus: "cleared",
        position: 4, finishPosition: 4, finishTime: "1:49.10", objection: false,
    },
    {
        number: 4, name: "Thunderstrike", jockey: "I. Ortiz Jr.",
        trainer: "S. McGaughey", weight: "126 lbs",
        microchipId: "982000362108004",
        photo: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=120&q=80",
        mainJockey: { id: "JK-401", name: "I. Ortiz Jr.", license: "LIC-2024-0401", role: "main", weight: "126 lbs" },
        backupJockey: { id: "JK-402", name: "B. Hernandez", license: "LIC-2024-0402", role: "backup", weight: "124 lbs" },
        gearStatus: "cleared", jockeyStatus: "cleared",
        position: 1, finishPosition: 1, finishTime: "1:48.23", objection: false,
    },
    {
        number: 5, name: "Silver Arrow", jockey: "J. Castellano",
        trainer: "K. McPeek", weight: "122 lbs",
        microchipId: "982000362108005",
        photo: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=120&q=80",
        mainJockey: { id: "JK-501", name: "J. Castellano", license: "LIC-2024-0501", role: "main", weight: "122 lbs" },
        backupJockey: { id: "JK-502", name: "R. Santana Jr.", license: "LIC-2024-0502", role: "backup", weight: "120 lbs" },
        gearStatus: "cleared", jockeyStatus: "pending",
        position: 5, finishPosition: 5, finishTime: "1:49.32", objection: false,
    },
];

export const VIOLATION_REASONS = [
    "Elevated Heart Rate / Respiratory",
    "Abnormal Gait / Lameness",
    "Equipment Non-Compliance",
    "Weight Discrepancy",
    "Invalid Documentation",
    "Microchip Mismatch",
    "Other",
];

export const PHASE_CONFIG = {
    pre: { label: "Pre-Race Inspection", color: "text-yellow-400", dot: "bg-yellow-400", border: "border-yellow-700/50", bg: "bg-yellow-500/8" },
    live: { label: "Live Monitoring", color: "text-red-400", dot: "bg-red-500", border: "border-red-700/50", bg: "bg-red-500/8", pulse: true },
    post: { label: "Post-Race Review", color: "text-green-400", dot: "bg-green-500", border: "border-green-700/50", bg: "bg-green-500/8" },
};

export const INCIDENTS: IncidentType[] = [
    { id: "lane", label: "Lane Cutting", icon: null }, // icons injected in LivePage to keep this file icon-free
    { id: "whip", label: "Whip Misuse", icon: null },
    { id: "interfere", label: "Interference", icon: null },
    { id: "custom", label: "Custom Flag", icon: null },
];

export const LOGGED_INCIDENTS: LoggedIncident[] = [
    { id: "1", label: "Lane Cutting", horse: "#4 Thunderstrike", time: "0:42" },
    { id: "2", label: "Interference", horse: "#2 Stormbringer", time: "1:10" },
];

export const HORSE_COLORS: Record<number, string> = {
    1: "#f59e0b",
    2: "#3b82f6",
    3: "#10b981",
    4: "#ef4444",
    5: "#a855f7",
};

export const HORSE_PROGRESS: Record<number, number> = {
    1: 62,
    2: 68,
    3: 55,
    4: 74,
    5: 48,
};

export const CAMERAS = [
    { id: 1, label: "Panning Main", src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80" },
    { id: 2, label: "Turn 1", src: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=900&q=80" },
    { id: 3, label: "Finish Line", src: "https://images.unsplash.com/photo-1566033117334-c8a4f80c8df4?w=900&q=80" },
    { id: 4, label: "Gate", src: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=900&q=80" },
];

// ── Shared helpers ────────────────────────────────────────────────────────────

export function statusBadge(s: VerificationStatus) {
    if (s === "cleared") return <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-700/50 px-2 py-0.5 rounded-full">Cleared</span>;
    if (s === "review") return <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-700/50 px-2 py-0.5 rounded-full">Review</span>;
    return <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-700/50 px-2 py-0.5 rounded-full">Pending</span>;
}

export function ordinal(n: number) {
    return n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;
}