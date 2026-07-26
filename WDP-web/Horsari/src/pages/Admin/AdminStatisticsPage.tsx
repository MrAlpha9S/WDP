import { useState, useEffect, useCallback } from "react";
import { adminService } from "../../api/adminService";
import type {
    DashboardKpi, DashboardHouseEarnings, HouseEarningSeries,
    DashboardTopPerformers, DashboardTopHorse, DashboardTopJockey, WinRateLeader,
    DashboardPredictions, MostPredictedHorse, SpectatorLeaderboardEntry,
} from "../../api/adminService";
import { Users, Trophy, ClipboardList, Wallet, Zap } from "lucide-react";
import { useSocket } from "../../providers/SocketProvider";
import { ErrorState } from "../../components/ErrorState";

// ── Types ─────────────────────────────────────────────────────────────────────
type GroupBy = "day" | "week" | "month" | "year";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) { return n.toLocaleString("vi-VN"); }
function pct(rate: number | null) { return rate === null ? "—" : `${rate.toFixed(1)}%`; }
function fmtDate(d: string, groupBy: GroupBy) {
    let y, m, day;
    if (groupBy === 'day' && d.length >= 10) {
        [y, m, day] = d.split('-');
        return `${day}/${m}/${y}`;
    }
    if (groupBy === 'week') {
        const [yy, w] = d.split('-');
        const date = new Date(parseInt(yy), 0, 1 + (parseInt(w) - 1) * 7);
        day = date.getDate().toString().padStart(2, '0');
        m = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${m}/${date.getFullYear()}`;
    }
    if (groupBy === 'month') {
        [y, m] = d.split('-');
        return `01/${m}/${y}`;
    }
    if (groupBy === 'year') {
        return `01/01/${d}`;
    }
    return d;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, subColor = "text-gray-500", icon, highlight = false }: {
    label: string; value: string; sub: string; subColor?: string; icon: React.ReactNode; highlight?: boolean;
}) {
    return (
        <div className={`rounded-xl p-5 flex flex-col gap-3 border ${highlight ? "border-red-600/40 bg-[#1a0f0f]" : "border-white/[0.07] bg-[#141414]"}`}>
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase">{label}</p>
                <span className="text-gray-600">{icon}</span>
            </div>
            <p className={`text-[28px] font-bold leading-none font-sans ${highlight ? "text-red-400" : "text-white"}`}>{value}</p>
            <p className={`text-[12px] ${subColor}`}>{sub}</p>
        </div>
    );
}

/** Skeleton shimmer card */
function Skeleton({ h = "h-32" }: { h?: string }) {
    return <div className={`rounded-xl border border-white/[0.07] bg-[#141414] ${h} animate-pulse`} />;
}

/** Generic ranked list card — numbers first, no chart */
function RankedListCard<T>({
    title, items, loading, emptyText, renderRow,
}: {
    title: string; items: T[]; loading: boolean; emptyText: string;
    renderRow: (item: T, rank: number) => React.ReactNode;
}) {
    if (loading) return <Skeleton h="h-56" />;
    return (
        <div className="rounded-xl border border-white/[0.07] bg-[#141414] p-5 flex flex-col gap-4">
            <p className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase">{title}</p>
            {items.length === 0
                ? <p className="text-[13px] text-gray-600 py-4 text-center">{emptyText}</p>
                : <div className="flex flex-col gap-2.5">
                    {items.map((item, i) => renderRow(item, i + 1))}
                </div>
            }
        </div>
    );
}

/** 3-line SVG polyline house earnings chart */
function HouseEarningsChart({ data, groupBy, onGroupByChange, loading }: {
    data: DashboardHouseEarnings | null; groupBy: GroupBy; onGroupByChange: (g: GroupBy) => void; loading: boolean;
}) {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    if (loading) return <Skeleton h="h-64" />;

    const series = data?.series ?? [];
    const enoughData = series.length > 0;
    const maxGross = Math.max(...series.map(s => s.grossPool), 1);
    const W = 300, H = 70, padX = 10, padY = 8;
    const graphBottom = H - 14;

    function toX(i: number) { 
        if (series.length === 1) return W / 2;
        return padX + (i / (series.length - 1)) * (W - padX * 2); 
    }
    function toY(v: number) { 
        return graphBottom - (v / maxGross) * (graphBottom - padY); 
    }
    function polyline(key: keyof HouseEarningSeries) {
        return series.map((s, i) => `${toX(i)},${toY(s[key] as number)}`).join(" ");
    }

    const hovered = hoveredIdx !== null ? series[hoveredIdx] : null;

    return (
        <div className="rounded-xl border border-white/[0.07] bg-[#141414] p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between">
                <p className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase">House Earnings from Predictions</p>
                <div className="flex gap-1">
                    {(["day", "week", "month", "year"] as GroupBy[]).map(g => (
                        <button key={g} onClick={() => onGroupByChange(g)}
                            className={`text-[10px] px-2 py-0.5 rounded font-semibold transition-colors ${groupBy === g ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}>
                            {g === "day" ? "Daily" : g === "week" ? "Weekly" : g === "month" ? "Monthly" : "Yearly"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-6">
                {/* Left side: Chart */}
                <div className="flex-1 min-w-0 relative">
                    {!enoughData && (
                        <div className="absolute inset-0 flex items-center justify-center text-[12px] text-gray-500 pointer-events-none">
                            No data yet
                        </div>
                    )}
                    <svg viewBox={`0 0 ${W} ${H}`} className="w-full"
                        onMouseLeave={() => setHoveredIdx(null)}>
                        
                        {/* Horizontal grid lines */}
                        {[0, 0.5, 1].map(t => {
                            const y = padY + t * (graphBottom - padY);
                            return <line key={`h-${t}`} x1={padX} x2={W - padX} y1={y} y2={y} stroke="#ffffff08" strokeWidth="0.5" />
                        })}

                        {/* Vertical grid lines & Dates */}
                        {series.map((s, i) => {
                            const showLabel = series.length <= 10 || i % Math.ceil(series.length / 8) === 0 || i === series.length - 1;
                            return (
                                <g key={`v-${i}`}>
                                    <line x1={toX(i)} x2={toX(i)} y1={padY} y2={graphBottom} stroke="#ffffff06" strokeWidth="0.5" />
                                    {showLabel && (
                                        <text x={toX(i)} y={H - 4} fill="#6b7280" fontSize="3.5" fontWeight="500" textAnchor="middle">
                                            {fmtDate(s.date, groupBy)}
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                        {series.length > 1 && (
                            <>
                                <polyline points={polyline("grossPool")} fill="none" stroke="#e5e7eb" strokeWidth="0.8" strokeOpacity="0.4" />
                                <polyline points={polyline("payoutToWinners")} fill="none" stroke="#60a5fa" strokeWidth="0.9" />
                                <polyline points={polyline("houseEarning")} fill="none" stroke="#34d399" strokeWidth="1.1" />
                            </>
                        )}
                        {series.map((s, i) => (
                            <g key={i}>
                                {series.length === 1 && (
                                    <>
                                        <circle cx={toX(i)} cy={toY(s.grossPool)} r={1} fill="#e5e7eb" opacity={0.4} />
                                        <circle cx={toX(i)} cy={toY(s.payoutToWinners)} r={1} fill="#60a5fa" />
                                        <circle cx={toX(i)} cy={toY(s.houseEarning)} r={1} fill="#34d399" />
                                    </>
                                )}
                                <rect x={toX(i) - ((W - padX * 2) / Math.max(series.length, 2) / 2)} y={padY} 
                                    width={(W - padX * 2) / Math.max(series.length, 2)} height={graphBottom - padY}
                                    fill="transparent" onMouseEnter={() => setHoveredIdx(i)} style={{ cursor: "crosshair" }} />
                            </g>
                        ))}
                    </svg>
                    {hovered && hoveredIdx !== null && (
                        <div 
                            className="absolute bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-[11px] text-gray-300 whitespace-nowrap pointer-events-none z-10 shadow-xl transition-all duration-75"
                            style={{ 
                                left: `${(toX(hoveredIdx) / W) * 100}%`,
                                top: '5%',
                                transform: 'translateX(-50%)'
                            }}
                        >
                            <p className="font-semibold text-white mb-1">{fmtDate(series[hoveredIdx].date, groupBy)}</p>
                            <p><span className="text-emerald-400">●</span> House: {fmt(hovered.houseEarning)} ₫</p>
                            <p><span className="text-blue-400">●</span> Payout: {fmt(hovered.payoutToWinners)} ₫</p>
                            <p><span className="text-gray-400">●</span> Gross: {fmt(hovered.grossPool)} ₫</p>
                        </div>
                    )}
                    <div className="flex gap-4 mt-2">
                        {[
                            { color: "bg-emerald-400", label: "House Earning" },
                            { color: "bg-blue-400", label: "Payout to Winners" },
                            { color: "bg-gray-400", label: "Gross Pool" },
                        ].map(({ color, label }) => (
                            <span key={label} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                <span className={`w-2 h-2 rounded-full ${color}`} />{label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Right side: Numbers */}
                <div className="w-full xl:w-64 flex flex-col gap-3 shrink-0 justify-center">
                    {[
                        { label: "House Earned", value: data?.totalHouseEarning ?? 0, color: "text-emerald-400" },
                        { label: "Paid to Winners", value: data?.totalPayoutToWinners ?? 0, color: "text-blue-400" },
                        { label: "Gross Pool", value: data?.totalGrossPool ?? 0, color: "text-white" },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="bg-[#1a1a1a] rounded-lg px-4 py-3 border border-white/[0.03]">
                            <p className="text-[11px] text-gray-500 mb-1">{label}</p>
                            <p className={`text-[16px] font-bold ${color} leading-tight`}>
                                {fmt(value)} <span className="text-[10px] font-normal text-gray-500">₫</span>
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/** Prediction method breakdown — 3 pill badges */
function PredictionMethodBreakdown({ data, loading }: { data: DashboardPredictions | null; loading: boolean; }) {
    if (loading) return <Skeleton h="h-20" />;
    const methods = data?.predictionMethods ?? {};
    const colors: Record<string, string> = {
        race_winner: "bg-violet-900/50 text-violet-300 border-violet-700/40",
        race_rank: "bg-blue-900/50 text-blue-300 border-blue-700/40",
        tournament_champion: "bg-amber-900/50 text-amber-300 border-amber-700/40",
    };
    return (
        <div className="rounded-xl border border-white/[0.07] bg-[#141414] p-5 flex flex-col gap-3">
            <p className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase">🔮 Prediction Methods</p>
            <div className="flex flex-wrap gap-2">
                {Object.entries(methods).map(([type, v]) => (
                    <span key={type} className={`border rounded-full px-3 py-1 text-[11px] font-semibold ${colors[type] ?? "bg-white/5 text-gray-300 border-white/10"}`}>
                        {type.replace(/_/g, " ")}  {v.pct}%  ({v.count})
                    </span>
                ))}
                {Object.keys(methods).length === 0 && (
                    <p className="text-[13px] text-gray-600 py-2">No prediction data yet</p>
                )}
            </div>
        </div>
    );
}

/** Spectator prediction leaderboard table */
function SpectatorLeaderboard({ entries, loading }: { entries: SpectatorLeaderboardEntry[]; loading: boolean; }) {
    if (loading) return <Skeleton h="h-64" />;
    return (
        <div className="rounded-xl border border-white/[0.07] bg-[#141414] p-5">
            <p className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase mb-4">Spectator Prediction Leaderboard</p>
            {entries.length === 0 ? (
                <p className="text-[13px] text-gray-600 text-center py-6">No prediction data yet.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                        <thead>
                            <tr className="text-left text-[10px] tracking-widest text-gray-600 uppercase border-b border-white/[0.06]">
                                <th className="pb-2 pr-4">#</th>
                                <th className="pb-2 pr-4">Spectator</th>
                                <th className="pb-2 pr-4 text-right">Total</th>
                                <th className="pb-2 pr-4 text-right">✅ Correct</th>
                                <th className="pb-2 pr-4 text-right">❌ Incorrect</th>
                                <th className="pb-2 text-right">Win Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map(e => (
                                <tr key={String(e.spectatorId)} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                                    <td className="py-2.5 pr-4 text-gray-600 font-mono">#{e.rank}</td>
                                    <td className="py-2.5 pr-4 text-white font-medium">{e.fullName}</td>
                                    <td className="py-2.5 pr-4 text-right text-gray-400">{e.total}</td>
                                    <td className="py-2.5 pr-4 text-right text-emerald-400 font-semibold">{e.correct}</td>
                                    <td className="py-2.5 pr-4 text-right text-red-400">{e.incorrect}</td>
                                    <td className="py-2.5 text-right">
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${e.winRate >= 60 ? "bg-emerald-900/50 text-emerald-400" : e.winRate >= 40 ? "bg-amber-900/50 text-amber-400" : "bg-white/5 text-gray-400"}`}>
                                            {e.winRate.toFixed(1)}% ({e.correct}/{e.total})
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminStatisticsPage() {
    // 5 independent loading states — each panel renders as its own data arrives
    const [kpi, setKpi] = useState<DashboardKpi | null>(null);
    const [kpiLoading, setKpiLoading] = useState(true);

    const [houseEarnings, setHouseEarnings] = useState<DashboardHouseEarnings | null>(null);
    const [earningsLoading, setEarningsLoading] = useState(true);
    const [groupBy, setGroupBy] = useState<GroupBy>("day");

    const [topPerformers, setTopPerformers] = useState<DashboardTopPerformers | null>(null);
    const [performersLoading, setPerformersLoading] = useState(true);

    const [predictions, setPredictions] = useState<DashboardPredictions | null>(null);
    const [predictionsLoading, setPredictionsLoading] = useState(true);

    const [leaderboard, setLeaderboard] = useState<SpectatorLeaderboardEntry[]>([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(true);

    // Aggregate error surfaced when ANY of the 5 independent panels fails to
    // load — individual panels still degrade gracefully to null/empty so one
    // failure doesn't blank the whole dashboard, but the user gets told.
    const [error, setError] = useState<string | null>(null);

    const fetchHouseEarnings = useCallback(async (g: GroupBy) => {
        setEarningsLoading(true);
        try {
            const r = await adminService.getDashboardHouseEarnings(g);
            setHouseEarnings(r.data);
        } catch (err: any) { setHouseEarnings(null); setError(err?.msg ?? "Failed to load statistics."); }
        finally { setEarningsLoading(false); }
    }, []);

    const refetchAll = useCallback(() => {
        setError(null);

        // All 5 fetches fire simultaneously — no panel blocks another
        adminService.getDashboardKpi()
            .then(r => setKpi(r.data))
            .catch((err: any) => { setKpi(null); setError(err?.msg ?? "Failed to load statistics."); })
            .finally(() => setKpiLoading(false));

        fetchHouseEarnings(groupBy);

        adminService.getDashboardTopPerformers()
            .then(r => setTopPerformers(r.data))
            .catch((err: any) => { setTopPerformers(null); setError(err?.msg ?? "Failed to load statistics."); })
            .finally(() => setPerformersLoading(false));

        adminService.getDashboardPredictions()
            .then(r => setPredictions(r.data))
            .catch((err: any) => { setPredictions(null); setError(err?.msg ?? "Failed to load statistics."); })
            .finally(() => setPredictionsLoading(false));

        adminService.getDashboardSpectatorLeaderboard()
            .then(r => setLeaderboard(r.data.spectatorLeaderboard))
            .catch((err: any) => { setLeaderboard([]); setError(err?.msg ?? "Failed to load statistics."); })
            .finally(() => setLeaderboardLoading(false));
    }, [fetchHouseEarnings, groupBy]);

    useEffect(() => {
        refetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Prize payouts, house-take, and jockey/referee fees all flow through
    // Transaction docs — refetch the whole dashboard live when any settle.
    const { socket } = useSocket();
    useEffect(() => {
        if (!socket) return;
        socket.on("transaction_updated", refetchAll);
        return () => { socket.off("transaction_updated", refetchAll); };
    }, [socket, refetchAll]);

    const handleGroupByChange = (g: GroupBy) => {
        setGroupBy(g);
        fetchHouseEarnings(g);
    };

    return (
        <div className="min-h-screen font-sans">
            <div className="max-w-7xl mx-auto px-6 py-8">

                {/* Header */}
                <div className="mb-7">
                    <h1 className="text-[26px] font-bold text-white tracking-tight font-serif">
                        Statistics
                    </h1>
                    <p className="text-[13px] text-gray-500 mt-0.5">
                        Meaningful KPIs, rankings, and financial trends across the platform.
                    </p>
                </div>

                {error && (
                    <div className="mb-6">
                        <ErrorState message={error} onRetry={refetchAll} />
                    </div>
                )}

                {/* Row 1 — 6 KPI stat cards (fastest to load) */}
                <div className="grid grid-cols-2 xl:grid-cols-6 gap-4 mb-6">
                    <StatCard
                        label="Pool Wallet"
                        value={kpiLoading ? "..." : fmt(kpi?.finance.mainAdminWallet ?? 0) + " ₫"}
                        sub="Lifetime pool takeout"
                        icon={<Wallet size={16} />}
                    />
                    <StatCard
                        label="Active Users"
                        value={kpiLoading ? "..." : String(kpi?.users.countActive ?? 0)}
                        sub="Total registered accounts"
                        icon={<Users size={16} />}
                    />
                    <StatCard
                        label="Tournaments"
                        value={kpiLoading ? "..." : String(kpi?.tournaments.count ?? 0)}
                        sub={kpiLoading ? "..." : `${kpi?.tournaments.ongoing ?? 0} Ongoing · ${kpi?.tournaments.scheduled ?? 0} Scheduled`}
                        icon={<Trophy size={16} />}
                    />
                    <StatCard
                        label="Horse Owners"
                        value={kpiLoading ? "..." : String(kpi?.horseOwners.count ?? 0)}
                        sub={kpiLoading ? "..." : `${kpi?.horseOwners.approved ?? 0} Active · ${kpi?.horseOwners.pending ?? 0} Pending`}
                        subColor={(kpi?.horseOwners.pending ?? 0) > 0 ? "text-amber-500" : "text-gray-500"}
                        icon={<ClipboardList size={16} />}
                        highlight={(kpi?.horseOwners.pending ?? 0) > 0}
                    />
                    <StatCard
                        label="Jockeys"
                        value={kpiLoading ? "..." : String(kpi?.jockeys.count ?? 0)}
                        sub={kpiLoading ? "..." : `${kpi?.jockeys.approved ?? 0} Active · ${kpi?.jockeys.pending ?? 0} Pending`}
                        subColor={(kpi?.jockeys.pending ?? 0) > 0 ? "text-amber-500" : "text-gray-500"}
                        icon={<Users size={16} />}
                        highlight={(kpi?.jockeys.pending ?? 0) > 0}
                    />
                    <StatCard
                        label="Prediction Payouts"
                        value={kpiLoading ? "..." : fmt(kpi?.predictionPayouts.totalPaidOut ?? 0) + " ₫"}
                        sub={kpiLoading ? "..." : `${kpi?.predictionPayouts.totalWinnersPaid ?? 0} winners paid`}
                        subColor="text-emerald-600"
                        icon={<Zap size={16} />}
                    />
                </div>

                {/* Row 2 — House earnings 3-line chart */}
                <div className="mb-6">
                    <HouseEarningsChart
                        data={houseEarnings}
                        groupBy={groupBy}
                        onGroupByChange={handleGroupByChange}
                        loading={earningsLoading}
                    />
                </div>

                {/* Row 3 — 5 ranked insight panels (no charts — numbers only) */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-4 mb-6">

                    {/* Top Earning Horses */}
                    <RankedListCard<DashboardTopHorse>
                        title="🏇 Top Earning Horses" loading={performersLoading}
                        items={topPerformers?.topEarningHorses ?? []} emptyText="No horse earnings yet"
                        renderRow={(h, rank) => (
                            <div key={String(h.horseId)} className="flex items-center justify-between gap-2">
                                <span className="text-[11px] text-gray-600 font-mono w-4 shrink-0">#{rank}</span>
                                <span className="text-[12px] text-white font-medium flex-1 truncate">{h.horseName}</span>
                                <div className="text-right shrink-0">
                                    <p className="text-[12px] text-emerald-400 font-bold">{fmt(h.totalEarnings)} ₫</p>
                                    <p className="text-[10px] text-gray-600">{h.wins} win{h.wins !== 1 ? "s" : ""}</p>
                                </div>
                            </div>
                        )} />

                    {/* Top Earning Jockeys */}
                    <RankedListCard<DashboardTopJockey>
                        title="🪖 Top Earning Jockeys" loading={performersLoading}
                        items={topPerformers?.topEarningJockeys ?? []} emptyText="No jockey earnings yet"
                        renderRow={(j, rank) => (
                            <div key={String(j.jockeyId)} className="flex items-center justify-between gap-2">
                                <span className="text-[11px] text-gray-600 font-mono w-4 shrink-0">#{rank}</span>
                                <span className="text-[12px] text-white font-medium flex-1 truncate">{j.fullName}</span>
                                <div className="text-right shrink-0">
                                    <p className="text-[12px] text-emerald-400 font-bold">{fmt(j.totalEarnings)} ₫</p>
                                    <p className="text-[10px] text-gray-500">{pct(j.winRate)} win rate</p>
                                </div>
                            </div>
                        )} />

                    {/* Win Rate Leaders */}
                    <RankedListCard<WinRateLeader>
                        title="🏆 Win Rate Leaders" loading={performersLoading}
                        items={topPerformers?.winRateLeaders ?? []} emptyText="No race data yet"
                        renderRow={(j, rank) => (
                            <div key={String(j.jockeyId)} className="flex items-center justify-between gap-2">
                                <span className="text-[11px] text-gray-600 font-mono w-4 shrink-0">#{rank}</span>
                                <span className="text-[12px] text-white font-medium flex-1 truncate">{j.fullName}</span>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${j.winRate >= 60 ? "bg-emerald-900/50 text-emerald-400" : j.winRate >= 40 ? "bg-amber-900/50 text-amber-400" : "bg-white/5 text-gray-400"}`}>
                                    {j.winRate.toFixed(1)}%
                                </span>
                            </div>
                        )} />

                    {/* Prediction Methods */}
                    <PredictionMethodBreakdown data={predictions} loading={predictionsLoading} />

                    {/* Most Predicted to Win */}
                    <RankedListCard<MostPredictedHorse>
                        title="🎯 Most Predicted to Win" loading={predictionsLoading}
                        items={predictions?.mostPredictedHorses ?? []} emptyText="No predictions yet"
                        renderRow={(h, rank) => (
                            <div key={String(h.horseId)} className="flex items-center justify-between gap-2">
                                <span className="text-[11px] text-gray-600 font-mono w-4 shrink-0">#{rank}</span>
                                <span className="text-[12px] text-white font-medium flex-1 truncate">
                                    {h.horseName}{h.isHot && <span className="ml-1 text-[10px]">🔥</span>}
                                </span>
                                <div className="text-right shrink-0">
                                    <p className="text-[12px] text-violet-400 font-bold">{h.totalPicks} picks</p>
                                    <p className="text-[10px] text-gray-500">{h.crowdAccuracy.toFixed(1)}% accurate</p>
                                </div>
                            </div>
                        )} />
                </div>

                {/* Row 4 — Spectator Leaderboard (heaviest, loads last) */}
                <SpectatorLeaderboard entries={leaderboard} loading={leaderboardLoading} />

            </div>
        </div>
    );
}
