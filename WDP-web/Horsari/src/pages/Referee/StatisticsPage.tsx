import { useState, useEffect } from "react";
import { Wallet, DollarSign, Clock, Shield, Percent, AlertTriangle, MapPin, BarChart2, Loader2, BookOpen } from "lucide-react";
import { refereeService } from "../../api/refereeService";
import type { RefereeStatistics, WorkHistoryEntry, ViolationTypeRecord } from "../../api/refereeService";
import type { ViolationEntity } from "../../shared/types/ViolationTypes";
import { usePaginatedFetch } from "../../hooks/usePaginatedFetch";
import { Pagination } from "../../components/Pagination";

// ── Chart helpers ─────────────────────────────────────────────────────────────
type ChartRange = "day" | "week" | "month" | "year";

function fmtDate(d: string, groupBy: ChartRange) {
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
    if (groupBy === 'year') return `01/01/${d}`;
    return d;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    sub,
    subColor = "text-gray-500",
    icon,
}: {
    label: string;
    value: string;
    sub: string;
    subColor?: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="rounded-xl p-5 flex flex-col gap-3 border border-white/[0.07] bg-[#141414]">
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase">
                    {label}
                </p>
                <span className="text-gray-600">{icon}</span>
            </div>
            <p
                className="text-[28px] font-bold leading-none text-white font-sans"
            >
                {value}
            </p>
            <p className={`text-[12px] ${subColor}`}>{sub}</p>
        </div>
    );
}

function violationStatusStyle(s: string) {
    if (s === 'confirmed') return 'bg-red-500/15 text-red-400';
    if (s === 'dismissed') return 'bg-white/[0.05] text-gray-500';
    return 'bg-amber-500/15 text-amber-400';
}

function WorkHistorySection() {
    const [sortValue, setSortValue] = useState<"raceDate:desc" | "raceDate:asc">("raceDate:desc");
    const [sortBy, order] = sortValue.split(":") as [string, "asc" | "desc"];

    const { data, loading, error, pagination, page, setPage } = usePaginatedFetch<WorkHistoryEntry>(
        (p) => refereeService.getWorkHistory(p, 10, sortBy, order).then((res) => res.data),
        `referee-work-history-${sortValue}`,
    );

    return (
        <div className="mt-6 rounded-xl border border-white/[0.07] bg-[#141414] p-5">
            <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
                <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
                    <Shield size={15} className="text-red-500" />
                    Work History
                </h2>
                <select
                    value={sortValue}
                    onChange={(e) => { setSortValue(e.target.value as typeof sortValue); setPage(1); }}
                    className="w-[150px] shrink-0 bg-[#1a1a1a] border border-white/10 rounded-md px-2.5 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[28px] appearance-none cursor-pointer"
                >
                    <option value="raceDate:desc">Newest First</option>
                    <option value="raceDate:asc">Oldest First</option>
                </select>
            </div>

            {loading ? (
                <p className="text-[13px] text-gray-500 text-center py-6">Loading work history...</p>
            ) : error ? (
                <p className="text-[13px] text-red-400 text-center py-6">Failed to load work history.</p>
            ) : data.length === 0 ? (
                <p className="text-[13px] text-gray-500 text-center py-6">No completed races yet.</p>
            ) : (
                <div className="flex flex-col divide-y divide-white/[0.05]">
                    {data.map((entry) => (
                        <div key={entry.assignmentId} className="py-3">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div>
                                    <p className="text-[13px] font-semibold text-white">{entry.roundName ?? "Unknown Round"}</p>
                                    <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1 flex-wrap">
                                        {entry.raceDate && <span>{new Date(entry.raceDate).toLocaleDateString()}</span>}
                                        {entry.location && (
                                            <span className="flex items-center gap-1">
                                                <MapPin size={10} /> {entry.location}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[13px] font-bold text-white">{entry.fee.toLocaleString()} ₫</p>
                                    <p className="text-[11px] text-gray-500 mt-0.5 capitalize">{entry.paymentStatus}</p>
                                </div>
                            </div>

                            {entry.violations.length > 0 ? (
                                <div className="mt-2 rounded-md border border-red-500/[0.15] bg-red-500/[0.03] overflow-hidden">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-red-500/[0.12]">
                                        <AlertTriangle size={11} className="text-red-400/70" />
                                        <span className="text-[10px] font-bold text-red-400/70 uppercase tracking-wider">
                                            {entry.violations.length} Violation{entry.violations.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="divide-y divide-white/[0.04]">
                                        {entry.violations.map((v) => (
                                            <div key={v.violationId} className="px-3 py-2 flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[12px] text-gray-300 font-medium truncate">{v.typeName ?? "Unknown Type"}</p>
                                                    {v.description && <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{v.description}</p>}
                                                </div>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${violationStatusStyle(v.violationStatus)}`}>
                                                    {v.violationStatus}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[11px] text-gray-600 mt-1.5">No violations logged.</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <Pagination
                page={page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                limit={pagination.limit}
                onPageChange={setPage}
            />
        </div>
    );
}

// ── Fees Earnings Chart ──────────────────────────────────────────────────────
function FeesEarningsChart() {
    const [series, setSeries] = useState<{ date: string; feesEarned: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [groupBy, setGroupBy] = useState<ChartRange>('day');
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        refereeService.getFeesEarningsSeries(groupBy).then((res) => {
            if (active) setSeries(res.data.series);
        }).finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [groupBy]);

    const W = 1000, H = 260;
    const maxVal = Math.max(...series.map(s => s.feesEarned), 1);
    const pad = 40;
    const toX = (i: number) => pad + (i / Math.max(series.length - 1, 1)) * (W - pad * 2);
    const toY = (v: number) => H - pad - (v / maxVal) * (H - pad * 2);

    return (
        <div className="mt-6 rounded-xl border border-white/[0.07] bg-[#141414] p-5 flex flex-col h-[380px]">
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
                    <BarChart2 size={15} className="text-red-500" />
                    Fees Earned Trend
                </h2>
                <div className="flex items-center bg-[#1a1a1a] rounded-lg p-1 border border-white/10">
                    {(['day', 'week', 'month', 'year'] as const).map(g => (
                        <button
                            key={g}
                            onClick={() => setGroupBy(g)}
                            className={`px-3 py-1 text-[11px] font-bold uppercase rounded-md transition-colors ${groupBy === g ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-white'}`}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-gray-600" />
                </div>
            ) : series.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-[12px] text-gray-500">No data</div>
            ) : (
                <div
                    className="relative flex-1 min-w-0"
                    onMouseLeave={() => setHoveredIdx(null)}
                    onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const pct = Math.max(0, Math.min(1, x / rect.width));
                        setHoveredIdx(Math.round(pct * (series.length - 1)));
                    }}
                >
                    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                        {[0, 0.5, 1].map(t => (
                            <line key={t} x1={pad} x2={W - pad} y1={pad + t * (H - pad * 2)} y2={pad + t * (H - pad * 2)} stroke="#ffffff" strokeOpacity={0.05} strokeWidth={1} />
                        ))}
                        {series.map((s, i) => (
                            <g key={i}>
                                <line x1={toX(i)} x2={toX(i)} y1={pad} y2={H - pad} stroke="#ffffff" strokeOpacity={0.02} strokeWidth={1} />
                                {series.length <= 15 || i % Math.ceil(series.length / 10) === 0 ? (
                                    <text x={toX(i)} y={H - 10} fill="#666" fontSize="11" textAnchor="middle" fontWeight="bold">
                                        {fmtDate(s.date, groupBy).slice(0, 5)}
                                    </text>
                                ) : null}
                            </g>
                        ))}
                        <polyline
                            points={series.map((s, i) => `${toX(i)},${toY(s.feesEarned)}`).join(" ")}
                            fill="none" stroke="#ef4444" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
                        />
                        {hoveredIdx !== null && (
                            <circle cx={toX(hoveredIdx)} cy={toY(series[hoveredIdx].feesEarned)} r={4} fill="#ef4444" />
                        )}
                    </svg>

                    {hoveredIdx !== null && (
                        <div
                            className="absolute bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-[11px] text-gray-300 whitespace-nowrap pointer-events-none z-10 shadow-xl transition-all duration-75"
                            style={{ left: `${(toX(hoveredIdx) / W) * 100}%`, top: '5%', transform: 'translateX(-50%)' }}
                        >
                            <p className="font-bold text-white mb-1">{fmtDate(series[hoveredIdx].date, groupBy)}</p>
                            <p><span className="text-red-400">●</span> Fees Earned: {series[hoveredIdx].feesEarned.toLocaleString()} ₫</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── All Violations Section (system-wide) ────────────────────────────────────
function AllViolationsSection() {
    const [statusFilter, setStatusFilter] = useState<'' | 'pending' | 'confirmed' | 'dismissed'>('');
    const [sortValue, setSortValue] = useState<"created_at:desc" | "created_at:asc">("created_at:desc");
    const [sortBy, order] = sortValue.split(":") as [string, "asc" | "desc"];

    const { data, loading, error, pagination, page, setPage } = usePaginatedFetch<ViolationEntity>(
        (p) => refereeService.getAllViolations(p, 10, statusFilter || undefined, undefined, undefined, sortBy, order)
            .then((res) => ({ items: res.data.items, pagination: res.data.pagination })),
        `referee-all-violations-${statusFilter}-${sortValue}`,
    );

    return (
        <div className="mt-6 rounded-xl border border-white/[0.07] bg-[#141414] p-5">
            <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
                <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
                    <AlertTriangle size={15} className="text-red-500" />
                    All Violations
                </h2>
                <div className="flex items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}
                        className="w-[130px] shrink-0 bg-[#1a1a1a] border border-white/10 rounded-md px-2.5 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[28px] appearance-none cursor-pointer"
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="dismissed">Dismissed</option>
                    </select>
                    <select
                        value={sortValue}
                        onChange={(e) => { setSortValue(e.target.value as typeof sortValue); setPage(1); }}
                        className="w-[130px] shrink-0 bg-[#1a1a1a] border border-white/10 rounded-md px-2.5 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[28px] appearance-none cursor-pointer"
                    >
                        <option value="created_at:desc">Newest First</option>
                        <option value="created_at:asc">Oldest First</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <p className="text-[13px] text-gray-500 text-center py-6">Loading violations...</p>
            ) : error ? (
                <p className="text-[13px] text-red-400 text-center py-6">Failed to load violations.</p>
            ) : data.length === 0 ? (
                <p className="text-[13px] text-gray-500 text-center py-6">No violations found.</p>
            ) : (
                <div className="flex flex-col divide-y divide-white/[0.05]">
                    {data.map((v) => {
                        const roundName = typeof v.raceRoundId === 'object' && v.raceRoundId ? v.raceRoundId.roundName : null;
                        const raceDate = typeof v.raceRoundId === 'object' && v.raceRoundId ? v.raceRoundId.raceDate : null;
                        return (
                            <div key={v._id} className="py-3 flex items-start justify-between gap-3 flex-wrap">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-semibold text-white">{v.violationTypeId?.violationName ?? "Unknown Type"}</p>
                                    <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1 flex-wrap">
                                        {roundName && <span>{roundName}</span>}
                                        {raceDate && <span>· {new Date(raceDate).toLocaleDateString()}</span>}
                                    </p>
                                    {v.description && <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{v.description}</p>}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {v.severity != null && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/[0.05] text-gray-400">
                                            Sev {v.severity}
                                        </span>
                                    )}
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${violationStatusStyle(v.violationStatus)}`}>
                                        {v.violationStatus}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Pagination
                page={page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                limit={pagination.limit}
                onPageChange={setPage}
            />
        </div>
    );
}

// ── Violation Types Reference Section ────────────────────────────────────────
function ViolationTypesSection() {
    const [phaseFilter, setPhaseFilter] = useState<'' | 'pre-race' | 'during-race' | 'after-race'>('');
    const [search, setSearch] = useState('');

    const { data, loading, error, pagination, page, setPage } = usePaginatedFetch<ViolationTypeRecord>(
        (p) => refereeService.getViolationTypes(phaseFilter || undefined, p, 10, search || undefined, 'severity', 'asc')
            .then((res) => ({ items: res.data.items, pagination: res.data.pagination })),
        `referee-violation-types-${phaseFilter}-${search}`,
    );

    return (
        <div className="mt-6 rounded-xl border border-white/[0.07] bg-[#141414] p-5">
            <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
                <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
                    <BookOpen size={15} className="text-red-500" />
                    Violation Types Reference
                </h2>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-[150px] shrink-0 bg-[#1a1a1a] border border-white/10 rounded-md px-2.5 text-[11px] text-gray-300 placeholder-gray-600 focus:outline-none focus:border-white/20 h-[28px]"
                    />
                    <select
                        value={phaseFilter}
                        onChange={(e) => { setPhaseFilter(e.target.value as typeof phaseFilter); setPage(1); }}
                        className="w-[130px] shrink-0 bg-[#1a1a1a] border border-white/10 rounded-md px-2.5 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[28px] appearance-none cursor-pointer"
                    >
                        <option value="">All Phases</option>
                        <option value="pre-race">Pre-race</option>
                        <option value="during-race">During-race</option>
                        <option value="after-race">After-race</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <p className="text-[13px] text-gray-500 text-center py-6">Loading violation types...</p>
            ) : error ? (
                <p className="text-[13px] text-red-400 text-center py-6">Failed to load violation types.</p>
            ) : data.length === 0 ? (
                <p className="text-[13px] text-gray-500 text-center py-6">No violation types found.</p>
            ) : (
                <div className="flex flex-col divide-y divide-white/[0.05]">
                    {data.map((vt) => (
                        <div key={vt._id} className="py-3 flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-white">{vt.violationName}</p>
                                <p className="text-[11px] text-gray-500 mt-0.5 capitalize">
                                    {vt.type} · {vt.category ?? "uncategorized"}
                                </p>
                                {vt.defaultPenalty && <p className="text-[11px] text-gray-500 mt-1">Default penalty: {vt.defaultPenalty}</p>}
                            </div>
                            {vt.severity != null && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/[0.05] text-gray-400 shrink-0">
                                    Sev {vt.severity}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <Pagination
                page={page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                limit={pagination.limit}
                onPageChange={setPage}
            />
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StatisticsPage() {
    const [stats, setStats] = useState<RefereeStatistics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        refereeService.getStatistics()
            .then((res) => {
                if (res.code === 200 && res.data) setStats(res.data);
            })
            .catch((err) => console.error("Failed to fetch referee statistics", err))
            .finally(() => setLoading(false));
    }, []);

    const acceptanceRate = stats && stats.totalInvitations > 0
        ? Math.round((stats.acceptedCount / stats.totalInvitations) * 100)
        : 0;

    return (
        <div className="min-h-screen font-sans">
            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="mb-7">
                    <h1
                        className="text-[26px] font-bold text-white tracking-tight font-serif"
                    >
                        Statistics
                    </h1>
                    <p className="text-[13px] text-gray-500 mt-0.5">
                        Your wallet, earnings, and officiating history.
                    </p>
                </div>

                <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                    <StatCard
                        label="Wallet"
                        value={loading ? "..." : (stats?.wallet ?? 0).toLocaleString()}
                        sub="Lifetime confirmed earnings (VND)"
                        icon={<Wallet size={16} />}
                    />
                    <StatCard
                        label="Fees Earned"
                        value={loading ? "..." : (stats?.totalFeesEarned ?? 0).toLocaleString()}
                        sub="Fully confirmed and paid"
                        subColor="text-emerald-500"
                        icon={<DollarSign size={16} />}
                    />
                    <StatCard
                        label="Pending Fees"
                        value={loading ? "..." : (stats?.pendingFeesAmount ?? 0).toLocaleString()}
                        sub="Awaiting confirmation"
                        subColor={stats && stats.pendingFeesAmount > 0 ? "text-amber-500" : "text-gray-500"}
                        icon={<Clock size={16} />}
                    />
                    <StatCard
                        label="Races Officiated"
                        value={loading ? "..." : (stats?.totalRacesOfficiated ?? 0).toString()}
                        sub={loading ? "..." : `${stats?.totalInvitations ?? 0} Total Invitations`}
                        icon={<Shield size={16} />}
                    />
                    <StatCard
                        label="Acceptance Rate"
                        value={loading ? "..." : `${acceptanceRate}%`}
                        sub={loading ? "..." : `${stats?.rejectedCount ?? 0} Rejected · ${stats?.pendingCount ?? 0} Pending`}
                        icon={<Percent size={16} />}
                    />
                    <StatCard
                        label="Violations Filed"
                        value={loading ? "..." : (stats?.totalViolationsFiled ?? 0).toString()}
                        sub={loading ? "..." : `${stats?.confirmedViolationsCount ?? 0} Confirmed · ${stats?.dismissedViolationsCount ?? 0} Dismissed`}
                        subColor={stats && stats.confirmedViolationsCount > 0 ? "text-red-400" : "text-gray-500"}
                        icon={<AlertTriangle size={16} />}
                    />
                </div>

                <FeesEarningsChart />
                <WorkHistorySection />
                <AllViolationsSection />
                <ViolationTypesSection />
            </div>
        </div>
    );
}
