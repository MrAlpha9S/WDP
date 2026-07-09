import { useState, useEffect } from "react";
import { Wallet, DollarSign, Clock, Shield, Percent } from "lucide-react";
import { refereeService } from "../../api/refereeService";
import type { RefereeStatistics } from "../../api/refereeService";

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

                <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
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
                </div>
            </div>
        </div>
    );
}
