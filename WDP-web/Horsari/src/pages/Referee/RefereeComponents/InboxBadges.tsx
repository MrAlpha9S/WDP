import type { InviteStatus, PaymentStatus, RaceType } from "../../../shared/types/InboxTypes";

// ── Status Pill ────────────────────────────────────────────────────────────────

export function StatusPill({ status }: { status: InviteStatus }) {
    const cfg = {
        pending:   "border-yellow-700/60 text-amber bg-amber/10",
        accepted:  "border-green-700/60 text-green bg-green/10",
        declined:  "border-white/10 text-text-muted/70 bg-transparent",
        cancelled: "border-white/10 text-text-muted bg-white/5",
    }[status] ?? "border-white/10 text-text-muted/70 bg-transparent";
    const dot   = { pending: "bg-yellow-500", accepted: "bg-green-500", declined: "bg-gray-600", cancelled: "bg-gray-500" }[status] ?? "bg-gray-600";
    const label = { pending: "Pending", accepted: "Accepted", declined: "Declined", cancelled: "Cancelled" }[status] ?? status;
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
        unpaid:     "border-red-800/60 text-red bg-red/10",
        processing: "border-yellow-700/60 text-amber bg-amber/10",
        paid:       "border-green-700/60 text-green bg-green/10",
    }[status];
    const dot   = { unpaid: "bg-red", processing: "bg-yellow-500", paid: "bg-green-500" }[status];
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
    const map: Record<string, string> = {
        Stakes:    "border-red-800/60 text-red bg-red/10",
        Allowance: "border-blue-800/60 text-blue bg-blue/10",
        Claims:  "border-orange-800/60 text-orange-400 bg-orange-500/10",
        Maiden:    "border-purple-800/60 text-purple-400 bg-purple-500/10",
    };
    const cls = map[type] ?? "border-white/10 text-text-muted bg-white/5";
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold ${cls}`}>
            {type}
        </span>
    );
}
