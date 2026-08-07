import { useState, useEffect } from "react";
import { CheckCircle2, ChevronRight, Flag, MapPin, XCircle } from "lucide-react";
import type { RecentInvite, InviteStatus } from "../../../shared/types/HomepageTypes";
import { useNavigate } from "react-router-dom";
import { refereeService } from "../../../api/refereeService";

// ── Status Pill ────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: InviteStatus }) {
    const cfg = {
        pending: "border-yellow-700/60 text-amber bg-amber/10",
        accepted: "border-green-700/60 text-green bg-green/10",
        declined: "border-border text-text-muted/70 bg-transparent",
        cancelled: "border-border text-text-muted/70 bg-transparent",
    }[status];
    const dot = { pending: "bg-yellow-500", accepted: "bg-green-500", declined: "bg-gray-600", cancelled: "bg-gray-600" }[status];
    const label = { pending: "Pending", accepted: "Accepted", declined: "Declined", cancelled: "Cancelled" }[status];
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
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const filtered = initial
            .filter(i => (i.status as string) !== "cancelled")
            .slice(0, 3);
        setInvites(filtered);
    }, [initial]);

    const handleAccept = async (id: string) => {
        setLoadingId(id);
        try {
            const res = await refereeService.acceptInvitation(id);
            if (res.code === 200) {
                setInvites(p => p.map(i => i.id === id ? { ...i, status: "accepted" as InviteStatus, isNew: false } : i));
            }
        } catch (error) {
            console.error("Failed to accept invitation:", error);
        } finally {
            setLoadingId(null);
        }
    };

    const handleDecline = async (id: string) => {
        setLoadingId(id);
        try {
            const res = await refereeService.rejectInvitation(id);
            if (res.code === 200) {
                setInvites(p => p.map(i => i.id === id ? { ...i, status: "declined" as InviteStatus, isNew: false } : i));
            }
        } catch (error) {
            console.error("Failed to decline invitation:", error);
        } finally {
            setLoadingId(null);
        }
    };

    const pendingCount = invites.filter(i => i.status === "pending").length;

    return (
        <div className="bg-surface rounded-xl border border-border overflow-hidden h-fit">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                    <h2 className="text-[14px] font-bold text-text font-serif">
                        Recent Invitations
                    </h2>
                    <p className="text-[11px] text-text-muted/70 mt-0.5">Race assignments sent to you</p>
                </div>
                {pendingCount > 0 && (
                    <span className="w-6 h-6 rounded-full bg-red text-text text-[11px] font-bold flex items-center justify-center">
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
                                    <Flag size={13} className={isPending ? "text-red" : "text-text-muted/70"} />
                                </div>
                                <div className="flex-1 min-w-0">

                                    {/* Title row */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[13px] font-bold text-text truncate">{inv.raceLabel}</p>
                                            {inv.tournamentName && inv.tournamentName !== "Non-tournament" && (
                                                <p className="text-[10.5px] text-text-muted truncate mt-0.5">{inv.tournamentName}</p>
                                            )}
                                        </div>
                                        {inv.isNew && (
                                            <span className="text-[9px] font-bold uppercase tracking-widest bg-red text-text px-1.5 py-0.5 rounded-full shrink-0 mt-0.5">
                                                New
                                            </span>
                                        )}
                                    </div>

                                    {/* Date */}
                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                        <span className="text-[11px] text-text-muted/70">{inv.date}</span>
                                    </div>

                                    {/* Venue */}
                                    <div className="flex items-start gap-1.5 mt-1.5">
                                        <MapPin size={10} className="text-red-600 shrink-0 mt-0.5" />
                                        <div className="min-w-0">
                                            <span className="text-[11px] font-semibold text-text-muted">{inv.venue}</span>
                                            <span className="text-[11px] text-text-muted/70"> · {inv.trackLocation}</span>
                                        </div>
                                    </div>

                                    {/* Status + fee + sent */}
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-2">
                                            <StatusPill status={inv.status} />
                                            <span className="text-[11px] font-bold text-text-muted">{inv.fee.toLocaleString()} ₫</span>
                                        </div>
                                        <span className="text-[10px] text-text-muted/70">{inv.sentAt}</span>
                                    </div>

                                    {/* Actions */}
                                    {isPending && (
                                        <div className="flex items-center gap-2 mt-2.5">
                                            <button
                                                onClick={() => handleDecline(inv.id)}
                                                disabled={loadingId === inv.id}
                                                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-border text-[11px] font-semibold text-text-muted hover:border-white/20 hover:text-text-muted transition-all disabled:opacity-50"
                                            >
                                                {loadingId === inv.id ? <div className="w-3 h-3 rounded-full border border-white/20 border-t-white animate-spin" /> : <XCircle size={11} className="text-text-muted/70" />} Decline
                                            </button>
                                            <button
                                                onClick={() => handleAccept(inv.id)}
                                                disabled={loadingId === inv.id}
                                                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red text-text text-[11px] font-bold hover:bg-red/85 transition-all disabled:opacity-50"
                                            >
                                                {loadingId === inv.id ? <div className="w-3 h-3 rounded-full border border-white/20 border-t-white animate-spin" /> : <CheckCircle2 size={11} />} Accept
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
            <div className="px-5 py-3 border-t border-border">
                <button 
                    className="w-full flex items-center justify-center gap-1.5 text-[12px] text-red font-semibold hover:text-red transition-colors" 
                    onClick={() => navigate("/referee/inbox")}
                >
                    View all invitations <ChevronRight size={13} />
                </button>
            </div>
        </div >
    );
}
