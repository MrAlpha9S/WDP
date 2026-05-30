import { useState } from "react";
import { CheckCircle2, ChevronRight, Flag, MapPin, XCircle } from "lucide-react";
import type { RecentInvite, InviteStatus } from "../types/HomepageTypes";

// ── Status Pill ────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: InviteStatus }) {
    const cfg = {
        pending:  "border-yellow-700/60 text-yellow-400 bg-yellow-500/10",
        accepted: "border-green-700/60 text-green-400 bg-green-500/10",
        declined: "border-white/10 text-gray-600 bg-transparent",
    }[status];
    const dot   = { pending: "bg-yellow-500", accepted: "bg-green-500", declined: "bg-gray-600" }[status];
    const label = { pending: "Pending", accepted: "Accepted", declined: "Declined" }[status];
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${cfg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {label}
        </span>
    );
}

// ── Invite Sidebar ─────────────────────────────────────────────────────────────

interface InviteSidebarProps {
    invites: RecentInvite[];
}

export default function InviteSidebar({ invites: initial }: InviteSidebarProps) {
    const [invites, setInvites] = useState(initial);

    const handleAccept  = (id: string) => setInvites(p => p.map(i => i.id === id ? { ...i, status: "accepted" as InviteStatus, isNew: false } : i));
    const handleDecline = (id: string) => setInvites(p => p.map(i => i.id === id ? { ...i, status: "declined" as InviteStatus, isNew: false } : i));

    const pendingCount = invites.filter(i => i.status === "pending").length;

    return (
        <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden h-fit">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                <div>
                    <h2 className="text-[14px] font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Recent Invitations
                    </h2>
                    <p className="text-[11px] text-gray-600 mt-0.5">Race assignments sent to you</p>
                </div>
                {pendingCount > 0 && (
                    <span className="w-6 h-6 rounded-full bg-red-700 text-white text-[11px] font-bold flex items-center justify-center">
                        {pendingCount}
                    </span>
                )}
            </div>

            {/* Invite list */}
            <div className="divide-y divide-white/5">
                {invites.map(inv => {
                    const isPending = inv.status === "pending";
                    return (
                        <div
                            key={inv.id}
                            className={`px-5 py-4 transition-colors ${isPending ? "hover:bg-white/[0.02]" : "opacity-60"}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isPending ? "bg-red-900/40" : "bg-white/5"}`}>
                                    <Flag size={13} className={isPending ? "text-red-500" : "text-gray-600"} />
                                </div>
                                <div className="flex-1 min-w-0">

                                    {/* Title row */}
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[13px] font-bold text-white truncate">{inv.raceLabel}</span>
                                        {inv.isNew && (
                                            <span className="text-[9px] font-bold uppercase tracking-widest bg-red-700 text-white px-1.5 py-0.5 rounded-full shrink-0">
                                                New
                                            </span>
                                        )}
                                    </div>

                                    {/* Date */}
                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                        <span className="text-[11px] text-gray-600">{inv.date}</span>
                                    </div>

                                    {/* Venue */}
                                    <div className="flex items-start gap-1.5 mt-1.5">
                                        <MapPin size={10} className="text-red-600 shrink-0 mt-0.5" />
                                        <div className="min-w-0">
                                            <span className="text-[11px] font-semibold text-gray-400">{inv.venue}</span>
                                            <span className="text-[11px] text-gray-600"> · {inv.trackLocation}</span>
                                        </div>
                                    </div>

                                    {/* Status + fee + sent */}
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-2">
                                            <StatusPill status={inv.status} />
                                            <span className="text-[11px] font-bold text-gray-400">${inv.fee.toLocaleString()}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-600">{inv.sentAt}</span>
                                    </div>

                                    {/* Actions */}
                                    {isPending && (
                                        <div className="flex items-center gap-2 mt-2.5">
                                            <button
                                                onClick={() => handleDecline(inv.id)}
                                                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-white/10 text-[11px] font-semibold text-gray-500 hover:border-white/20 hover:text-gray-300 transition-all"
                                            >
                                                <XCircle size={11} className="text-gray-600" /> Decline
                                            </button>
                                            <button
                                                onClick={() => handleAccept(inv.id)}
                                                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-700 text-white text-[11px] font-bold hover:bg-red-600 transition-all"
                                            >
                                                <CheckCircle2 size={11} /> Accept
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/8">
                <button className="w-full flex items-center justify-center gap-1.5 text-[12px] text-red-500 font-semibold hover:text-red-400 transition-colors">
                    View all invitations <ChevronRight size={13} />
                </button>
            </div>
        </div>
    );
}
