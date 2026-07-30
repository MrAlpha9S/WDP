import { useState, useEffect } from "react";
import { adminService } from "../../api/adminService";
import { Users, Trophy, ClipboardList, Eye, Settings, CheckSquare, Radio, Wallet } from "lucide-react";
import PaymentsPanel from "../../components/PaymentsPanel";
import InvitationsSection from "./AdminComponents/InvitationsSection";
import type { AdminTab } from "./AdminComponents/NavBar";
import { useSocket } from "../../providers/SocketProvider";
import { ErrorState } from "../../components/ErrorState";

// ── Types ─────────────────────────────────────────────────────────────────────

type RaceStatus = "LIVE" | "PRE-RACE" | "POST-RACE";

interface ActiveRace {
    id: string;
    status: RaceStatus;
    name: string;
    detail: string;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    sub,
    subColor = "text-gray-500",
    icon,
    highlight = false,
}: {
    label: string;
    value: string;
    sub: string;
    subColor?: string;
    icon: React.ReactNode;
    highlight?: boolean;
}) {
    return (
        <div
            className={`rounded-xl p-5 flex flex-col gap-3 border ${highlight
                ? "border-red-600/40 bg-[#1a0f0f]"
                : "border-border bg-surface"
                }`}
        >
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase">
                    {label}
                </p>
                <span className="text-gray-600">{icon}</span>
            </div>
            <p
                className={`text-[28px] font-bold leading-none font-sans ${highlight ? "text-red-400" : "text-white"
                    }`}
            >
                {value}
            </p>
            <p className={`text-[12px] ${subColor}`}>{sub}</p>
        </div>
    );
}

function RaceStatusBadge({ status }: { status: RaceStatus }) {
    if (status === "LIVE") {
        return (
            <span className="flex items-center gap-1 text-[9px] font-bold tracking-widest text-red-400">
                <Radio size={8} className="text-red-400" />
                LIVE
            </span>
        );
    }
    if (status === "PRE-RACE") {
        return (
            <span className="text-[9px] font-bold tracking-widest text-amber-500">
                PRE-RACE
            </span>
        );
    }
    return (
        <span className="text-[9px] font-bold tracking-widest text-gray-500">
            POST-RACE
        </span>
    );
}

function RaceIcon({ status }: { status: RaceStatus }) {
    const cls = "text-gray-500 hover:text-gray-300 transition-colors cursor-pointer";
    if (status === "LIVE") return <Eye size={14} className={cls} />;
    if (status === "PRE-RACE") return <Settings size={14} className={cls} />;
    return <CheckSquare size={14} className={cls} />;
}

// ── Dashboard Page ────────────────────────────────────────────────────────────

export default function SystemDashboardPage({ setActiveTab }: { setActiveTab: (tab: AdminTab) => void }) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeRaces, setActiveRaces] = useState<ActiveRace[]>([]);
    const [racesLoading, setRacesLoading] = useState(true);
    const [refreshTick, setRefreshTick] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Live refetch on any notification addressed to this admin.
    const { socket } = useSocket();
    useEffect(() => {
        if (!socket) return;
        const handler = () => setRefreshTick((t) => t + 1);
        socket.on("notification_created", handler);
        return () => { socket.off("notification_created", handler); };
    }, [socket]);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setRacesLoading(true);
            setError(null);
            try {
                // Fetch stats and race rounds concurrently
                const [statsRes, racesRes] = await Promise.all([
                    adminService.getStatistics(),
                    adminService.getRaceRounds()
                ]);
                setStats(statsRes.data);

                // Process race rounds
                const allRounds = racesRes.data?.items ?? [];
                const mappedRaces: ActiveRace[] = allRounds.map((r: any) => {
                    const statusStr = (r.status || "").toLowerCase();
                    let mappedStatus: RaceStatus = "PRE-RACE";
                    if (statusStr.includes("ongoing") || statusStr.includes("live") || statusStr === "running") {
                        mappedStatus = "LIVE";
                    } else if (statusStr.includes("completed") || statusStr.includes("finished")) {
                        mappedStatus = "POST-RACE";
                    }

                    const dateStr = r.raceDate ? new Date(r.raceDate).toLocaleDateString() : "";
                    const trackStr = r.trackLength ? `${r.trackLength}m` : "";
                    const detail = [dateStr, trackStr].filter(Boolean).join(" · ");

                    return {
                        id: r._id,
                        status: mappedStatus,
                        name: r.roundName,
                        detail: detail || "Details Pending"
                    };
                });

                // Show top 3 recent/upcoming
                setActiveRaces(mappedRaces.slice(0, 3));
            } catch (err: any) {
                console.error("Failed to load dashboard data", err);
                setError(err?.msg ?? "Failed to load dashboard data.");
            } finally {
                setLoading(false);
                setRacesLoading(false);
            }
        }
        fetchData();
    }, [refreshTick]);

    return (
        <div className="min-h-screen font-sans">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-7">
                    <h1
                        className="text-[26px] font-bold text-white tracking-tight font-serif"
                    >
                        System Dashboard
                    </h1>
                    <p className="text-[13px] text-gray-500 mt-0.5">
                        High-level overview and administrative controls.
                    </p>
                </div>

                {error && (
                    <div className="mb-6">
                        <ErrorState message={error} onRetry={() => setRefreshTick((t) => t + 1)} />
                    </div>
                )}

                {/* Stat cards */}
                <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
                    <StatCard
                        label="Pool Betting Wallet"
                        value={loading ? "..." : (stats?.finance?.mainAdminWallet ?? 0).toLocaleString("vi-VN") + " ₫"}
                        sub="Lifetime pool takeout (statistic only)"
                        subColor="text-gray-500"
                        icon={<Wallet size={16} />}
                    />
                    <StatCard
                        label="Active Users"
                        value={loading ? "..." : (stats?.users?.countActive || 0).toString()}
                        sub="Total registered accounts"
                        subColor="text-gray-500"
                        icon={<Users size={16} />}
                    />
                    <StatCard
                        label="Tournaments"
                        value={loading ? "..." : (stats?.tournaments?.count || 0).toString()}
                        sub={loading ? "..." : `${stats?.tournaments?.ongoing || 0} Ongoing · ${stats?.tournaments?.scheduled || 0} Scheduled`}
                        icon={<Trophy size={16} />}
                    />
                    <StatCard
                        label="Horse Owners"
                        value={loading ? "..." : (stats?.horseOwners?.count || 0).toString()}
                        sub={loading ? "..." : `${stats?.horseOwners?.approved || 0} Active · ${stats?.horseOwners?.pending || 0} Pending`}
                        subColor={stats?.horseOwners?.pending > 0 ? "text-amber-500" : "text-gray-500"}
                        icon={<ClipboardList size={16} />}
                        highlight={stats?.horseOwners?.pending > 0}
                    />
                    <StatCard
                        label="Jockeys"
                        value={loading ? "..." : (stats?.jockeys?.count || 0).toString()}
                        sub={loading ? "..." : `${stats?.jockeys?.approved || 0} Active · ${stats?.jockeys?.pending || 0} Pending`}
                        subColor={stats?.jockeys?.pending > 0 ? "text-amber-500" : "text-gray-500"}
                        icon={<Users size={16} />}
                        highlight={stats?.jockeys?.pending > 0}
                    />
                </div>

                {/* Bottom grid: Invitation Status + Active Races */}
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">

                    <InvitationsSection onViewAll={() => setActiveTab("Inbox")} />

                    {/* Active Races */}
                    <div className="rounded-xl border border-border bg-surface p-5 min-w-0">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-[15px] font-semibold text-white">
                                Active Races
                            </h2>
                            <Radio size={14} className="text-red-500" />
                        </div>

                        <div className="flex flex-col gap-3">
                            {racesLoading ? (
                                <p className="text-[13px] text-gray-500 text-center py-4">Loading races...</p>
                            ) : activeRaces.length === 0 ? (
                                <p className="text-[13px] text-gray-500 text-center py-4">No active races found.</p>
                            ) : (
                                activeRaces.map((race) => (
                                    <div
                                        key={race.id}
                                        className="rounded-lg bg-surface border border-border/60 px-4 py-3 flex items-center justify-between gap-2"
                                    >
                                        <div className="min-w-0">
                                            <RaceStatusBadge status={race.status} />
                                            <p className="text-[13px] font-semibold text-white mt-1 leading-snug truncate">
                                                {race.name}
                                            </p>
                                            <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                                                {race.detail}
                                            </p>
                                        </div>
                                        <RaceIcon status={race.status} />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Payments awaiting admin confirmation (race prize + referee fee) */}
                <div className="mt-6">
                    <PaymentsPanel
                        title="Payments Awaiting Your Confirmation"
                        fetchPayments={(page, sortBy, order) => adminService.getPayments(page, 10, undefined, 'payer', sortBy, order)}
                        onConfirm={adminService.confirmPaymentPaid}
                        myRoleSide="payer"
                        confirmLabel="Confirm Paid"
                        cacheKey="admin-payments-payer"
                    />
                </div>
            </div>
        </div>
    );
}