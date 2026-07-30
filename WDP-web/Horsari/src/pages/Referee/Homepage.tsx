import { useState, useEffect } from "react";
import { Loader2, Wallet } from "lucide-react";
import type { RecentInvite, InviteStatus } from "../../shared/types/HomepageTypes";
import HomeCalendar from "./RefereeComponents/HomeCalendar";
import InviteSidebar from "./RefereeComponents/InviteSidebar";
import { refereeService } from "../../api/refereeService";
import type { RaceRoundData } from "../../api/adminService";
import type { RefereeWalletInfo } from "../../api/refereeService";
import PaymentsPanel from "../../components/PaymentsPanel";
import { useSocket } from "../../providers/SocketProvider";
import { RefetchButton } from "../../components/RefetchButton";
import { ErrorState } from "../../components/ErrorState";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
    const [upcomingRaces, setUpcomingRaces] = useState<RaceRoundData[]>([]);
    const [activeRules, setActiveRules] = useState<any[]>([]);
    const [invites, setInvites] = useState<RecentInvite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [walletInfo, setWalletInfo] = useState<RefereeWalletInfo | null>(null);
    const [refreshTick, setRefreshTick] = useState(0);
    const [lastUpdated, setLastUpdated] = useState<number | null>(null);

    // Live refetch on any notification addressed to this referee.
    const { socket } = useSocket();
    useEffect(() => {
        if (!socket) return;
        const handler = () => setRefreshTick((t) => t + 1);
        socket.on("notification_created", handler);
        return () => { socket.off("notification_created", handler); };
    }, [socket]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setError(null);
                const [res, rulesRes, invitesRes, walletRes] = await Promise.all([
                    refereeService.getRefereeRaceRounds(),
                    refereeService.getActiveRules(),
                    refereeService.getRefereeInvitations(5, 1),
                    refereeService.getWalletInfo(),
                ]);

                if (walletRes.code === 200 && walletRes.data) {
                    setWalletInfo(walletRes.data);
                }

                if (res.code === 200 && res.data) {
                    const activeRaces = res.data.items.filter((r) => r.status !== 'cancelled');
                    setUpcomingRaces(activeRaces);
                }

                if (rulesRes.code === 200 && rulesRes.data) {
                    setActiveRules(rulesRes.data.items);
                }

                if (invitesRes.code === 200 && invitesRes.data) {
                    const mappedInvites: RecentInvite[] = invitesRes.data.map((inv: any): RecentInvite => {
                        const round: Record<string, any> = inv.raceRoundId ?? {};
                        const dateObj = new Date(round.raceDate ?? new Date());

                        let mappedStatus: InviteStatus = 'pending';
                        if (inv.status === 'assigned') mappedStatus = 'accepted';
                        else if (inv.status === 'rejected') mappedStatus = 'declined';
                        else if (inv.status === 'cancelled') mappedStatus = 'cancelled';

                        return {
                            id: inv._id,
                            raceLabel: round.roundName ?? "Unknown Race",
                            tournamentName: round.tournamentId?.tournamentName ?? "Non-tournament",
                            date: dateObj.toLocaleDateString(),
                            venue: round.location ?? "Unknown Venue",
                            trackLocation: round.address ?? "",
                            status: mappedStatus,
                            fee: inv.fee ?? 0,
                            sentAt: new Date(inv.assignedAt).toLocaleDateString(),
                            isNew: false,
                            role: "Referee",
                            raceType: round.eligibilityRuleId?.raceType ?? "Stakes",
                        };
                    });
                    setInvites(mappedInvites);
                }
            } catch (err: any) {
                console.error("Failed to fetch referee dashboard data", err);
                setError(err?.msg ?? "Failed to fetch dashboard data.");
            } finally {
                setLoading(false);
                setLastUpdated(Date.now());
            }
        };
        fetchData();
    }, [refreshTick]);

    return (
        <div className="min-h-screen font-sans">
            <div className="max-w-5xl mx-auto px-6 py-8">

                {/* Header */}
                <div className="mb-7 flex items-start justify-between gap-4">
                    <div>
                        <h1
                            className="text-[26px] font-bold text-white tracking-tight font-serif"
                        >
                            Dashboard
                        </h1>
                        <p className="text-[13px] text-gray-500 mt-0.5">
                            Your upcoming race schedule and recent invitations.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <RefetchButton onRefetch={() => setRefreshTick((t) => t + 1)} lastUpdated={lastUpdated} />
                    </div>
                </div>

                {error && !loading && (
                    <div className="mb-6">
                        <ErrorState message={error} onRetry={() => setRefreshTick((t) => t + 1)} />
                    </div>
                )}

                {/* Main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] bg-surface rounded-xl border border-border">
                            <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-4" />
                            <span className="text-[13px] font-medium text-gray-400">Loading schedule...</span>
                        </div>
                    ) : (
                        <HomeCalendar races={upcomingRaces} activeRules={activeRules} />
                    )}
                    <InviteSidebar invites={invites} />
                </div>

                {/* Payments awaiting referee confirmation (referee fee) */}
                <div className="mt-6">
                    {walletInfo && (
                        <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-4 py-2.5 mb-4 w-fit">
                            <Wallet size={15} className="text-emerald-500" />
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Wallet</p>
                                <p className="text-[14px] font-bold text-white leading-tight">
                                    {walletInfo.referee.wallet.toLocaleString("vi-VN")} ₫
                                </p>
                            </div>
                        </div>
                    )}
                    <PaymentsPanel
                        title="Payments Awaiting Your Confirmation"
                        fetchPayments={(page, sortBy, order) => refereeService.getPayments(page, 10, undefined, 'payee', sortBy, order)}
                        onConfirm={refereeService.confirmPaymentReceived}
                        myRoleSide="payee"
                        confirmLabel="Confirm Received"
                        cacheKey="referee-payments-payee"
                    />
                </div>
            </div>
        </div>
    );
}