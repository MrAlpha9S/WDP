import { useState, useEffect } from "react";
import { adminService } from "../../api/adminService";
import { Users, Trophy, ClipboardList, Eye, Settings, CheckSquare, Radio, } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type RaceStatus = "LIVE" | "PRE-RACE" | "POST-RACE";

interface ActiveRace {
    id: string;
    status: RaceStatus;
    name: string;
    detail: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
// Removed mock ACTIVE_RACES array

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
                : "border-white/[0.07] bg-[#141414]"
                }`}
        >
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase">
                    {label}
                </p>
                <span className="text-gray-600">{icon}</span>
            </div>
            <p
                className={`text-[28px] font-bold leading-none ${highlight ? "text-red-400" : "text-white"
                    }`}
                style={{ fontFamily: "'Playfair Display', serif" }}
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

import InvitationsSection from "./AdminComponents/InvitationsSection";

// ── Dashboard Page ────────────────────────────────────────────────────────────

export default function SystemDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeRaces, setActiveRaces] = useState<ActiveRace[]>([]);
    const [racesLoading, setRacesLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setRacesLoading(true);
            try {
                // Fetch stats and race rounds concurrently
                const [statsRes, racesRes] = await Promise.all([
                    adminService.getStatistics(),
                    adminService.getRaceRounds()
                ]);
                setStats(statsRes.data);
                
                // Process race rounds
                const allRounds = Array.isArray(racesRes.data) ? racesRes.data : [];
                const mappedRaces: ActiveRace[] = allRounds.map((r: any) => {
                    const statusStr = (r.status || "").toLowerCase();
                    let mappedStatus: RaceStatus = "PRE-RACE";
                    if (statusStr.includes("ongoing") || statusStr.includes("live")) {
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
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
                setRacesLoading(false);
            }
        }
        fetchData();
    }, []);

    return (
        <div className="px-8 py-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {/* Header */}
            <div className="mb-7">
                <h1
                    className="text-[26px] font-bold text-white tracking-tight"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                >
                    System Dashboard
                </h1>
                <p className="text-[13px] text-gray-500 mt-0.5">
                    High-level overview and administrative controls.
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
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

                <InvitationsSection />

                {/* Active Races */}
                <div className="rounded-xl border border-white/[0.07] bg-[#141414] p-5">
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
                                    className="rounded-lg bg-[#1a1a1a] border border-white/[0.05] px-4 py-3 flex items-center justify-between"
                                >
                                    <div>
                                        <RaceStatusBadge status={race.status} />
                                        <p className="text-[13px] font-semibold text-white mt-1 leading-snug">
                                            {race.name}
                                        </p>
                                        <p className="text-[11px] text-gray-500 mt-0.5">
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
        </div>
    );
}