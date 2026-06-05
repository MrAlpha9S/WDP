import { Flag } from "lucide-react";
import type { TournamentStatus, AssignmentStatus } from "../../../shared/types/TournamentTypes";

// ── Status Badge ───────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: TournamentStatus }) {
    const cfg = {
        live:      "border-red-800/60 text-red-400 bg-red-500/10",
        upcoming:  "border-yellow-700/60 text-yellow-400 bg-yellow-500/10",
        completed: "border-white/10 text-gray-600 bg-transparent",
    }[status];
    const dot   = { live: "bg-red-500 animate-pulse", upcoming: "bg-yellow-500", completed: "bg-gray-600" }[status];
    const label = { live: "Live", upcoming: "Upcoming", completed: "Completed" }[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${cfg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {label}
        </span>
    );
}


// ── Race Type Badge ────────────────────────────────────────────────────────────

export function RaceTypeBadge({ type }: { type: string }) {
    const cfg: Record<string, string> = {
        Stakes:    "border-red-800/60 text-red-400 bg-red-500/10",
        Allowance: "border-blue-800/60 text-blue-400 bg-blue-500/10",
        Claims:  "border-orange-800/60 text-orange-400 bg-orange-500/10",
        Maiden:    "border-purple-800/60 text-purple-400 bg-purple-500/10",
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold ${cfg[type] ?? "border-white/10 text-gray-500"}`}>
            {type}
        </span>
    );
}

// ── Assignment Tag ─────────────────────────────────────────────────────────────

export function AssignmentTag({ assignment, assignedRaces, totalRaces }: {
    assignment: AssignmentStatus; assignedRaces: number; totalRaces: number;
}) {
    if (assignment === "none") return <span className="text-[11px] text-gray-600 font-medium">Not assigned</span>;
    const cfg = assignment === "assigned"
        ? "border-green-700/60 text-green-400 bg-green-500/10"
        : "border-blue-700/60 text-blue-400 bg-blue-500/10";
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${cfg}`}>
            <Flag size={9} />
            {assignment === "assigned" ? "Assigned" : "Partial"} · {assignedRaces}/{totalRaces} races
        </span>
    );
}
