import type { Tournament, RaceRound, LeaderEntry } from "../types/TournamentTypes";

// ── Color map ─────────────────────────────────────────────────────────────────

export const T_COLOR: Record<string, { band: string; dot: string; label: string; border: string }> = {
    red:    { band: "bg-red-500/15",    dot: "bg-red-500",    label: "text-red-400",    border: "border-red-700/40"    },
    blue:   { band: "bg-blue-500/15",   dot: "bg-blue-500",   label: "text-blue-400",   border: "border-blue-700/40"   },
    amber:  { band: "bg-amber-500/15",  dot: "bg-amber-500",  label: "text-amber-400",  border: "border-amber-700/40"  },
    purple: { band: "bg-purple-500/15", dot: "bg-purple-500", label: "text-purple-400", border: "border-purple-700/40" },
    green:  { band: "bg-green-500/15",  dot: "bg-green-500",  label: "text-green-400",  border: "border-green-700/40"  },
    sky:    { band: "bg-sky-500/15",    dot: "bg-sky-500",    label: "text-sky-400",    border: "border-sky-700/40"    },
    orange: { band: "bg-orange-500/15", dot: "bg-orange-500", label: "text-orange-400", border: "border-orange-700/40" },
    gray:   { band: "bg-gray-500/15",   dot: "bg-gray-500",   label: "text-gray-400",   border: "border-gray-700/40"   },
};

// ── Calendar constants ─────────────────────────────────────────────────────────

export const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
export const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export const TODAY = new Date();
export const TODAY_ISO = toISO(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());

// ── Calendar helpers ──────────────────────────────────────────────────────────

export function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
export function firstDayOfMonth(y: number, m: number) { return new Date(y, m, 1).getDay(); }
export function toISO(y: number, m: number, d: number) {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}


