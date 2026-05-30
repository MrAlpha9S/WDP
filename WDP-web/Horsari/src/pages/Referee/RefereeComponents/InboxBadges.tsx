import type { InviteStatus, PaymentStatus, RaceType, GradeLevel } from "../types/InboxTypes";

// ── Status Pill ────────────────────────────────────────────────────────────────

export function StatusPill({ status }: { status: InviteStatus }) {
    const cfg = {
        pending:  "border-yellow-700/60 text-yellow-400 bg-yellow-500/10",
        accepted: "border-green-700/60 text-green-400 bg-green-500/10",
        declined: "border-white/10 text-gray-600 bg-transparent",
    }[status];
    const dot   = { pending: "bg-yellow-500", accepted: "bg-green-500", declined: "bg-gray-600" }[status];
    const label = { pending: "Pending", accepted: "Accepted", declined: "Declined" }[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${cfg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {label}
        </span>
    );
}

// ── Payment Pill ───────────────────────────────────────────────────────────────

export function PaymentPill({ status }: { status: PaymentStatus }) {
    const cfg = {
        unpaid:     "border-red-800/60 text-red-400 bg-red-500/10",
        processing: "border-yellow-700/60 text-yellow-400 bg-yellow-500/10",
        paid:       "border-green-700/60 text-green-400 bg-green-500/10",
    }[status];
    const dot   = { unpaid: "bg-red-500", processing: "bg-yellow-500", paid: "bg-green-500" }[status];
    const label = { unpaid: "Unpaid", processing: "Processing", paid: "Paid" }[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${cfg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {label}
        </span>
    );
}

// ── Race Type Badge ────────────────────────────────────────────────────────────

export function RaceTypeBadge({ type }: { type: RaceType }) {
    const map: Record<RaceType, string> = {
        Stakes:    "border-red-800/60 text-red-400 bg-red-500/10",
        Allowance: "border-blue-800/60 text-blue-400 bg-blue-500/10",
        Claiming:  "border-orange-800/60 text-orange-400 bg-orange-500/10",
        Maiden:    "border-purple-800/60 text-purple-400 bg-purple-500/10",
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold ${map[type]}`}>
            {type}
        </span>
    );
}

// ── Grade Badge ────────────────────────────────────────────────────────────────

export function GradeBadge({ grade }: { grade: GradeLevel }) {
    const map: Record<GradeLevel, string> = {
        G1:     "border-yellow-700/60 text-yellow-400 bg-yellow-500/10",
        G2:     "border-gray-600/60 text-gray-400 bg-white/5",
        G3:     "border-amber-700/60 text-amber-400 bg-amber-500/10",
        Listed: "border-sky-700/60 text-sky-400 bg-sky-500/10",
        Open:   "border-white/10 text-gray-500 bg-transparent",
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-black tracking-wide ${map[grade]}`}>
            {grade}
        </span>
    );
}
