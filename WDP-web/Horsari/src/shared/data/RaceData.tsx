import type { VerificationStatus, RacePhase } from "../types/RaceTypes";

// ── Referee: Live/Monitor Race Data ──────────────────────────────────────────

export const PHASE_CONFIG = {
    pre: { label: "Pre-Race Inspection", color: "text-yellow-400", dot: "bg-yellow-400", border: "border-yellow-700/50", bg: "bg-yellow-500/8" },
    live: { label: "Live Monitoring", color: "text-red-400", dot: "bg-red-500", border: "border-red-700/50", bg: "bg-red-500/8", pulse: true },
    post: { label: "Post-Race Review", color: "text-green-400", dot: "bg-green-500", border: "border-green-700/50", bg: "bg-green-500/8" },
};

// Maps RaceRound.status (backend enum: draft, scheduled, running, completed,
// cancelled, awaitingConfirmation, prepared) to a display phase. "cancelled"
// has no phase — callers should check for it separately before deriving one.
export function derivePhase(status?: string): RacePhase {
    if (status === "running") return "live";
    if (status === "completed" || status === "awaitingConfirmation") return "post";
    return "pre"; // draft, scheduled, prepared, or unknown
}
// Canonical per-lane colour palette — horse #1 → index 0, wraps for large fields.
// Keep in sync with WDP-mobile/Horsari/src/app/(spectator)/race/[id].tsx HORSE_COLORS.
const HORSE_COLOR_PALETTE: string[] = [
    "#f59e0b", // 1  amber
    "#3b82f6", // 2  blue
    "#10b981", // 3  emerald
    "#ef4444", // 4  red
    "#a855f7", // 5  purple
    "#f97316", // 6  orange
    "#06b6d4", // 7  cyan
    "#ec4899", // 8  pink
    "#84cc16", // 9  lime
    "#14b8a6", // 10 teal
    "#f43f5e", // 11 rose
    "#8b5cf6", // 12 violet
];

export const HORSE_COLORS: Record<number, string> = Object.fromEntries(
    HORSE_COLOR_PALETTE.map((c, i) => [i + 1, c])
);

export function horseColor(num: number): string {
    return HORSE_COLOR_PALETTE[(num - 1) % HORSE_COLOR_PALETTE.length];
}

export const HORSE_PROGRESS: Record<number, number> = {
    1: 62,
    2: 68,
    3: 55,
    4: 74,
    5: 48,
};

export const CAMERAS = [
    { id: 1, label: "Panning Main", src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80" },
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
