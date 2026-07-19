import { useState, useCallback } from "react";
import { ChevronRight } from "lucide-react";
import type { InviteStatus } from "../../shared/types/InboxTypes";
import type { RaceInvite } from "../../shared/types/InboxTypes";
import { InviteCard } from "./RefereeComponents/InboxCard";
import { refereeService } from "../../api/refereeService";
import { Loader2 } from "lucide-react";
import { usePaginatedFetch } from "../../hooks/usePaginatedFetch";

// ── Tab type ──────────────────────────────────────────────────────────────────

type TabFilter = "all" | "pending" | "accepted" | "declined" | "cancelled";

const TABS: { key: TabFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "accepted", label: "Accepted" },
    { key: "declined", label: "Declined" },
    { key: "cancelled", label: "Cancelled" },
];

const STATUS_TO_DB: Partial<Record<TabFilter, string>> = {
    accepted: "assigned",
    declined: "rejected",
};

function mapInvitation(inv: any): RaceInvite {
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
        fee: inv.fee ?? 0,
        expectedPayment: inv.expectedPayment ?? 0,
        sentAt: new Date(inv.assignedAt).toLocaleDateString(),
        isNew: false,
        raceType: round.eligibilityRuleId?.raceType || "Flat",
        distance: (round.trackLength || 1000) + "m",
        track: round.raceGround || "Turf",
        entries: round.maxParticipants || 12,
        assignedBy: inv.assignedByName ?? null,
        paymentStatus: (inv.paymentStatus || "unpaid") as any,
        paymentId: inv.paymentId ?? null,
        payeeConfirmed: inv.payeeConfirmed ?? false,
    };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InboxPage() {
    const [tab, setTab] = useState<TabFilter>("all");

    const fetcher = useCallback(async (page: number) => {
        const statusParam = tab === "all" ? undefined : (STATUS_TO_DB[tab] ?? tab);
        const res = await refereeService.getRefereeInvitations(5, page, statusParam);
        if (res.code !== 200 || !res.data) throw new Error(res.msg ?? 'Failed to fetch invitations');
        return {
            items: res.data.map(mapInvitation),
            pagination: res.pagination,
        };
    }, [tab]);

    const { data: invites, loading, pagination, page, setPage, mutate } =
        usePaginatedFetch<RaceInvite>(fetcher, tab);

    const handleAccept = async (id: string) => {
        try {
            const res = await refereeService.acceptInvitation(id);
            if (res.code === 200) {
                mutate(prev => prev.map(i => i.id === id ? { ...i, status: "accepted" as InviteStatus, isNew: false } : i));
            }
        } catch (error) {
            console.error("Failed to accept invitation:", error);
        }
    };

    const handleDecline = async (id: string) => {
        try {
            const res = await refereeService.rejectInvitation(id);
            if (res.code === 200) {
                mutate(prev => prev.map(i => i.id === id ? { ...i, status: "declined" as InviteStatus, isNew: false } : i));
            }
        } catch (error) {
            console.error("Failed to decline invitation:", error);
        }
    };

    const handleConfirmPayment = async (invitationId: string, paymentId: string) => {
        try {
            const res = await refereeService.confirmPaymentReceived(paymentId);
            if (res.code === 200 && res.data) {
                const updatedStatus = res.data.paymentStatus;
                mutate(prev => prev.map(i => i.id === invitationId
                    ? { ...i, payeeConfirmed: true, paymentStatus: updatedStatus }
                    : i));
            }
        } catch (error) {
            console.error("Failed to confirm payment:", error);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f0f] font-sans">
            <div className="max-w-3xl mx-auto px-5 py-8">

                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h1
                            className="text-[26px] font-bold text-white tracking-tight font-serif"
                        >
                            Inbox
                        </h1>
                        <p className="text-[13px] text-gray-500 mt-0.5">Race assignments and referee invitations.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-[#1a1a1a] border border-white/8 rounded-xl px-2 py-2 mb-5 flex gap-1">
                    {TABS.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => { setTab(key); setPage(1); }}
                            className={[
                                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[13px] font-semibold transition-all duration-150",
                                tab === key
                                    ? "bg-red-700 text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]",
                            ].join(" ")}
                        >
                            {label}
                            {tab === key && (
                                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 text-white">
                                    {pagination.total}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* List */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-[#1a1a1a] rounded-xl border border-white/8">
                        <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-4" />
                        <span className="text-[13px] font-medium text-gray-400">Loading invitations...</span>
                    </div>
                ) : invites.length === 0 ? (
                    <div className="bg-[#1a1a1a] rounded-xl border border-white/8 px-5 py-14 text-center">
                        <p className="text-[13px] text-gray-600">No invitations in this category.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {invites.map(invite => (
                            <InviteCard
                                key={invite.id}
                                invite={invite}
                                onAccept={handleAccept}
                                onDecline={handleDecline}
                                onConfirmPayment={handleConfirmPayment}
                            />
                        ))}
                    </div>
                )}

                {/* Footer / Pagination */}
                {!loading && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-5 px-1">
                        <span className="text-[12px] text-gray-500">
                            Page <strong className="text-white">{page}</strong> of <strong className="text-white">{pagination.totalPages}</strong>
                            <span className="mx-2">·</span>
                            {pagination.total} total
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-white/5 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Prev
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-white/5 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
                {!loading && pagination.totalPages <= 1 && invites.length > 0 && (
                    <div className="flex items-center justify-between mt-5 px-1">
                        <span className="text-[12px] text-gray-600">
                            Showing all {invites.length} invitations
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
