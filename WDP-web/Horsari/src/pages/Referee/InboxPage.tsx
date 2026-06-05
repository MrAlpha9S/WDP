import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import type { InviteStatus } from "../../shared/types/InboxTypes";
import type { RaceInvite } from "../../shared/types/InboxTypes";
import { InviteCard } from "./RefereeComponents/InboxCard";
import { refereeService } from "../../api/refereeService";
import { Loader2 } from "lucide-react";

// ── Tab type ──────────────────────────────────────────────────────────────────

type TabFilter = "all" | "pending" | "accepted" | "declined" | "cancelled";

const TABS: { key: TabFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "accepted", label: "Accepted" },
    { key: "declined", label: "Declined" },
    { key: "cancelled", label: "Cancelled" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InboxPage() {
    const [invites, setInvites] = useState<RaceInvite[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<TabFilter>("all");

    useEffect(() => {
        const fetchInvitations = async () => {
            try {
                const res = await refereeService.getRefereeInvitations(50, 1);
                if (res.code === 200 && res.data) {
                    const mappedInvites = res.data.map((inv: any) => {
                        const round = inv.raceRoundId || {};
                        const dateObj = new Date(round.raceDate || new Date());
                        
                        let mappedStatus = inv.status;
                        if (inv.status === 'assigned') mappedStatus = 'accepted';
                        if (inv.status === 'rejected') mappedStatus = 'declined';

                        return {
                            id: inv._id,
                            race: round.roundName || "Unknown Race",
                            raceLabel: round.roundName || "Unknown Race",
                            tournamentName: round.tournamentId?.tournamentName || "Non-tournament",
                            date: dateObj.toLocaleDateString(),
                            time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            venue: round.location || "Unknown Venue",
                            trackLocation: round.address || "",
                            role: "Referee",
                            status: mappedStatus as InviteStatus,
                            fee: inv.fee ?? round.minimalRidingFees ?? 0,
                            sentAt: new Date(inv.assignedAt).toLocaleDateString(),
                            isNew: false,
                            raceType: (round.eligibilityRuleId?.raceType || "Flat") as any,
                            gradeLevel: "G3" as any,
                            distance: (round.trackLength || 1000) + "m",
                            track: round.raceGround || "Turf",
                            entries: round.maxParticipants || 12,
                            assignedBy: "Admin",
                            notes: "Please arrive 1 hour before the first race.",
                            paymentStatus: (inv.paymentStatus || "unpaid") as any
                        };
                    });
                    setInvites(mappedInvites);
                }
            } catch (error) {
                console.error("Failed to fetch invitations", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInvitations();
    }, []);

    const counts = {
        all: invites.length,
        pending: invites.filter(i => i.status === "pending").length,
        accepted: invites.filter(i => i.status === "accepted").length,
        declined: invites.filter(i => i.status === "declined").length,
        cancelled: invites.filter(i => i.status === "cancelled").length,
    };

    const filtered = tab === "all" ? invites : invites.filter(i => i.status === tab);

    const handleAccept = async (id: string) => {
        try {
            const res = await refereeService.acceptInvitation(id);
            if (res.code === 200) {
                setInvites(prev => prev.map(i => i.id === id ? { ...i, status: "accepted" as InviteStatus, isNew: false } : i));
            }
        } catch (error) {
            console.error("Failed to accept invitation:", error);
        }
    };

    const handleDecline = async (id: string) => {
        try {
            const res = await refereeService.rejectInvitation(id);
            if (res.code === 200) {
                setInvites(prev => prev.map(i => i.id === id ? { ...i, status: "declined" as InviteStatus, isNew: false } : i));
            }
        } catch (error) {
            console.error("Failed to decline invitation:", error);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f0f]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="max-w-3xl mx-auto px-5 py-8">

                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h1
                            className="text-[26px] font-bold text-white tracking-tight"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            Inbox
                        </h1>
                        <p className="text-[13px] text-gray-500 mt-0.5">Race assignments and referee invitations.</p>
                    </div>
                    {/* {counts.pending > 0 && (
                        <div className="bg-[#1a1a1a] border border-white/8 rounded-xl px-4 py-2.5 text-right">
                            <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">Awaiting Response</p>
                            <p
                                className="text-[22px] font-black text-red-500 tracking-tight leading-tight"
                                style={{ fontFamily: "'Playfair Display', serif" }}
                            >
                                {counts.pending}
                            </p>
                        </div>
                    )} */}
                </div>

                {/* Tabs */}
                <div className="bg-[#1a1a1a] border border-white/8 rounded-xl px-2 py-2 mb-5 flex gap-1">
                    {TABS.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={[
                                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[13px] font-semibold transition-all duration-150",
                                tab === key
                                    ? "bg-red-700 text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]",
                            ].join(" ")}
                        >
                            {label}
                            <span className={["text-[11px] font-bold px-1.5 py-0.5 rounded-full", tab === key ? "bg-white/20 text-white" : "bg-white/8 text-gray-500"].join(" ")}>
                                {counts[key]}
                            </span>
                        </button>
                    ))}
                </div>

                {/* List */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-[#1a1a1a] rounded-xl border border-white/8">
                        <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-4" />
                        <span className="text-[13px] font-medium text-gray-400">Loading invitations...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-[#1a1a1a] rounded-xl border border-white/8 px-5 py-14 text-center">
                        <p className="text-[13px] text-gray-600">No invitations in this category.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {filtered.map(invite => (
                            <InviteCard
                                key={invite.id}
                                invite={invite}
                                onAccept={handleAccept}
                                onDecline={handleDecline}
                            />
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-5 px-1">
                    <span className="text-[12px] text-gray-600">
                        Showing {filtered.length} of {invites.length} invitations
                    </span>
                    <button className="flex items-center gap-1 text-[13px] text-red-500 font-medium hover:text-red-400 transition-colors">
                        View all <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}