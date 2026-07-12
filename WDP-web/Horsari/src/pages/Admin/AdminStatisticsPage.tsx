import { useState, useEffect } from "react";
import {
    Users, Rabbit, Trophy, Flag, Wallet, ShieldAlert, TrendingUp, CreditCard,
} from "lucide-react";
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
    PieChart, Pie, Cell, Legend,
} from "recharts";
import { adminService } from "../../api/adminService";
import type { SystemStatistics, CountMap } from "../../api/adminService";

const COLORS = ["#dc2626", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280"];

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

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl p-5 border border-white/[0.07] bg-[#141414]">
            <p className="text-[13px] font-semibold text-white mb-4">{title}</p>
            {children}
        </div>
    );
}

function toChartData(map: CountMap | undefined) {
    if (!map) return [];
    return Object.entries(map).map(([name, value]) => ({ name, value }));
}

function CountBarChart({ data }: { data: { name: string; value: number }[] }) {
    if (!data.length) return <EmptyState />;
    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={{ stroke: "#333" }} tickLine={false} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                    contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "#fff" }}
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

function CountPieChart({ data }: { data: { name: string; value: number }[] }) {
    if (!data.length) return <EmptyState />;
    return (
        <ResponsiveContainer width="100%" height={220}>
            <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={2}>
                    {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#141414" strokeWidth={2} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
            </PieChart>
        </ResponsiveContainer>
    );
}

function EmptyState() {
    return (
        <div className="h-[220px] flex items-center justify-center text-[12px] text-gray-600">
            No data yet
        </div>
    );
}

function fmt(n: number | undefined) {
    return (n ?? 0).toLocaleString();
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminStatisticsPage() {
    const [stats, setStats] = useState<SystemStatistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        adminService.getSystemStatistics()
            .then((res) => {
                if (res.code === 200 && res.data) setStats(res.data);
                else setError(res.msg || "Failed to load statistics");
            })
            .catch((err) => setError(err?.msg || "Failed to load statistics"))
            .finally(() => setLoading(false));
    }, []);

    const totalRaces = stats?.raceRounds.total ?? 0;
    const totalPaymentsPending = stats
        ? (stats.payments.byStatus.unpaid?.count ?? 0) + (stats.payments.byStatus.processing?.count ?? 0)
        : 0;

    return (
        <div className="min-h-screen bg-[#0f0f0f]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="mb-7">
                    <h1
                        className="text-[26px] font-bold text-white tracking-tight"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        System Statistics
                    </h1>
                    <p className="text-[13px] text-gray-500 mt-0.5">
                        A complete snapshot of every entity in the system.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg border border-red-800/50 bg-red-500/10 text-red-400 text-[13px] px-4 py-3">
                        {error}
                    </div>
                )}

                {/* Top KPIs */}
                <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
                    <StatCard
                        label="Total Users"
                        value={loading ? "..." : fmt(stats?.users.total)}
                        sub={`${Object.keys(stats?.users.byRole ?? {}).length} roles`}
                        icon={<Users size={16} />}
                    />
                    <StatCard
                        label="Total Horses"
                        value={loading ? "..." : fmt(stats?.horses.total)}
                        sub={`${stats?.horses.byStatus.active ?? 0} active`}
                        icon={<Rabbit size={16} />}
                    />
                    <StatCard
                        label="Tournaments"
                        value={loading ? "..." : fmt(stats?.tournaments.total)}
                        sub={`${stats?.tournaments.byStatus.ongoing ?? 0} ongoing`}
                        icon={<Trophy size={16} />}
                    />
                    <StatCard
                        label="Race Rounds"
                        value={loading ? "..." : fmt(totalRaces)}
                        sub={`${stats?.raceRounds.byStatus.completed ?? 0} completed`}
                        icon={<Flag size={16} />}
                    />
                    <StatCard
                        label="House Wallet"
                        value={loading ? "..." : fmt(stats?.finance.mainAdminWallet)}
                        sub="Pool-betting earnings (VND)"
                        subColor="text-emerald-500"
                        icon={<Wallet size={16} />}
                    />
                </div>

                {/* Users & Licensing */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    <SectionCard title="Users by Role">
                        <CountPieChart data={toChartData(stats?.users.byRole)} />
                    </SectionCard>
                    <SectionCard title="Users by Status">
                        <CountBarChart data={toChartData(stats?.users.byStatus)} />
                    </SectionCard>
                    <SectionCard title="Licensing (approved / pending / rejected)">
                        <div className="flex flex-col gap-4">
                            {(["horseOwner", "jockey", "referee"] as const).map((role) => {
                                const map = stats?.licensing[role];
                                const total = Object.values(map ?? {}).reduce((s, v) => s + v, 0);
                                return (
                                    <div key={role}>
                                        <div className="flex justify-between text-[12px] mb-1">
                                            <span className="text-gray-400 capitalize">{role === "horseOwner" ? "Horse Owner" : role}</span>
                                            <span className="text-gray-500">{total} total</span>
                                        </div>
                                        <div className="flex h-2 rounded-full overflow-hidden bg-white/5">
                                            <div className="bg-emerald-500 h-full" style={{ width: `${total ? ((map?.approved ?? 0) / total) * 100 : 0}%` }} />
                                            <div className="bg-amber-500 h-full" style={{ width: `${total ? ((map?.pending ?? 0) / total) * 100 : 0}%` }} />
                                            <div className="bg-red-600 h-full" style={{ width: `${total ? ((map?.rejected ?? 0) / total) * 100 : 0}%` }} />
                                        </div>
                                        <div className="flex gap-3 mt-1 text-[10.5px] text-gray-500">
                                            <span className="text-emerald-500">{map?.approved ?? 0} approved</span>
                                            <span className="text-amber-500">{map?.pending ?? 0} pending</span>
                                            <span className="text-red-500">{map?.rejected ?? 0} rejected</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </SectionCard>
                </div>

                {/* Horses */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    <SectionCard title="Horses by Status">
                        <CountBarChart data={toChartData(stats?.horses.byStatus)} />
                    </SectionCard>
                    <SectionCard title="Horses by Health Status">
                        <CountPieChart data={toChartData(stats?.horses.byHealthStatus)} />
                    </SectionCard>
                </div>

                {/* Races / Registrations / Invitations */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    <SectionCard title="Race Rounds by Status">
                        <CountBarChart data={toChartData(stats?.raceRounds.byStatus)} />
                    </SectionCard>
                    <SectionCard title="Registrations by Status">
                        <CountBarChart data={toChartData(stats?.registrations.byStatus)} />
                    </SectionCard>
                    <SectionCard title="Invitations by Status">
                        <CountBarChart data={toChartData(stats?.invitations.byStatus)} />
                    </SectionCard>
                </div>

                {/* Violations */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    <SectionCard title="Violations by Status">
                        <CountBarChart data={toChartData(stats?.violations.byStatus)} />
                    </SectionCard>
                    <SectionCard title="Violations by Severity">
                        <CountBarChart data={toChartData(stats?.violations.bySeverity)} />
                    </SectionCard>
                    <SectionCard title="Top Violation Types">
                        {stats && stats.violations.topViolationTypes.length > 0 ? (
                            <ul className="flex flex-col gap-2.5">
                                {stats.violations.topViolationTypes.map((v) => (
                                    <li key={v.violationTypeId} className="flex items-center justify-between text-[12.5px]">
                                        <span className="flex items-center gap-2 text-gray-300">
                                            <ShieldAlert size={13} className="text-red-500" />
                                            {v.violationName}
                                            {v.category && <span className="text-gray-600 text-[11px]">({v.category})</span>}
                                        </span>
                                        <span className="text-gray-500 font-semibold">{v.count}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : <EmptyState />}
                    </SectionCard>
                </div>

                {/* Predictions / Betting */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    <SectionCard title="Predictions by Outcome">
                        <CountBarChart data={toChartData(stats?.predictions.byStatus)} />
                    </SectionCard>
                    <SectionCard title="Predictions by Method">
                        <CountPieChart data={toChartData(stats?.predictions.byMethodType)} />
                    </SectionCard>
                    <SectionCard title="Betting Summary">
                        <div className="flex flex-col gap-4 justify-center h-[220px]">
                            <div className="flex items-center gap-3">
                                <TrendingUp size={20} className="text-emerald-500" />
                                <div>
                                    <p className="text-[20px] font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                                        {fmt(stats?.predictions.total)}
                                    </p>
                                    <p className="text-[11px] text-gray-500">Total predictions placed</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Wallet size={20} className="text-amber-500" />
                                <div>
                                    <p className="text-[20px] font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                                        {fmt(stats?.predictions.totalRewardPointsPaid)}
                                    </p>
                                    <p className="text-[11px] text-gray-500">Reward points paid to winners</p>
                                </div>
                            </div>
                        </div>
                    </SectionCard>
                </div>

                {/* Finance & Payments */}
                <div className="grid grid-cols-1 gap-4 mb-6">
                    <SectionCard title="Payment Verification Status (unpaid / processing / paid)">
                        <CountBarChart data={Object.entries(stats?.payments.byStatus ?? {}).map(([name, v]) => ({ name, value: v.count }))} />
                        {totalPaymentsPending > 0 && (
                            <p className="text-[11px] text-amber-500 mt-2 flex items-center gap-1.5">
                                <CreditCard size={12} /> {totalPaymentsPending} payment(s) still awaiting confirmation
                            </p>
                        )}
                    </SectionCard>
                </div>

                {/* Top performers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    <SectionCard title="Top 5 Horses (by wins)">
                        {stats && stats.topPerformers.horses.length > 0 ? (
                            <ul className="flex flex-col gap-2.5">
                                {stats.topPerformers.horses.map((h, i) => (
                                    <li key={h.horseId} className="flex items-center justify-between text-[12.5px]">
                                        <span className="flex items-center gap-2 text-gray-300">
                                            <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-gray-500">{i + 1}</span>
                                            {h.horseName}
                                        </span>
                                        <span className="text-emerald-500 font-semibold">{h.wins} wins</span>
                                    </li>
                                ))}
                            </ul>
                        ) : <EmptyState />}
                    </SectionCard>
                    <SectionCard title="Top 5 Jockeys (by wins)">
                        {stats && stats.topPerformers.jockeys.length > 0 ? (
                            <ul className="flex flex-col gap-2.5">
                                {stats.topPerformers.jockeys.map((j, i) => (
                                    <li key={j.jockeyId} className="flex items-center justify-between text-[12.5px]">
                                        <span className="flex items-center gap-2 text-gray-300">
                                            <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-gray-500">{i + 1}</span>
                                            {j.fullName}
                                        </span>
                                        <span className="text-emerald-500 font-semibold">{j.totalWins} wins</span>
                                    </li>
                                ))}
                            </ul>
                        ) : <EmptyState />}
                    </SectionCard>
                </div>
            </div>
        </div>
    );
}
