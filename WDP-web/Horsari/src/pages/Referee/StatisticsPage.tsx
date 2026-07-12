import { useState, useEffect } from "react";
import { Wallet, DollarSign, Clock, Shield, Percent, AlertTriangle, MapPin } from "lucide-react";
import { refereeService } from "../../api/refereeService";
import type { RefereeStatistics, WorkHistoryEntry } from "../../api/refereeService";
import { usePaginatedFetch } from "../../hooks/usePaginatedFetch";
import { Pagination } from "../../components/Pagination";

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
                className="text-[28px] font-bold leading-none text-white"
                style={{ fontFamily: "'Playfair Display', serif" }}
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
        <div className="min-h-screen bg-[#0f0f0f]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="mb-7">
                    <h1
                        className="text-[26px] font-bold text-white tracking-tight"
                        style={{ fontFamily: "'Playfair Display', serif" }}
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

                <WorkHistorySection />
            </div>
        </div>
    );
}
