import { useState, useEffect, useCallback } from "react";
import {
    X, Search, CheckCircle, XCircle, Clock, AlertTriangle,
    ExternalLink, Calendar,
    ShieldCheck, User, Trophy, Timer, Loader2, Shield,
    ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import { adminService } from "../../api/adminService";
import { Pagination } from "../../components/Pagination";
import { ErrorState } from "../../components/ErrorState";

// ── Types ─────────────────────────────────────────────────────────────────────

type HorseStatus   = "active" | "inactive" | "retired";
type HorseHealth   = "healthy" | "injured" | "sick";

interface AdminHorse {
    horseId:          string;
    horseName:        string;
    breed:            string | null;
    gender:           "male" | "female" | null;
    healthStatus:     HorseHealth;
    status:           HorseStatus;
    registrationDate: string | null;
    dateOfBirth:      string | null;
    img:              string | null;
    ownerId:          string;
    ownerName:        string | null;
    createdAt:        string;
}

interface ViolationEntry {
    violationId:     string;
    typeName:        string | null;
    category:        string | null;
    severity:        number | null;
    stewardAction:   string | null;
    violationStatus: string;
}

interface RaceHistoryEntry {
    registrationId:     string;
    registrationStatus: string;
    roundName:          string | null;
    raceDate:           string | null;
    location:           string | null;
    raceStatus:         string | null;
    finishPosition:     number | null;
    finishTime:         string | null;
    prizeMoney:         number;
    resultStatus:       string | null;
    distance:           number | null;
    violations:         ViolationEntry[];
}

interface HorseDetail {
    horse:          AdminHorse;
    owner:          { ownerId: string; fullName: string | null; email: string | null };
    totalRaces:     number;
    totalViolations: number;
    raceHistory:    RaceHistoryEntry[];
}

// ── Visual config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<HorseStatus, { icon: React.ReactNode; label: string; color: string; bg: string; border: string }> = {
    active:   { icon: <CheckCircle size={12} />, label: "Active",    color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    inactive: { icon: <Clock       size={12} />, label: "Suspended", color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20"   },
    retired:  { icon: <XCircle     size={12} />, label: "Retired",   color: "text-gray-500",    bg: "bg-white/[0.05]",   border: "border-border"        },
};

const HEALTH_CFG: Record<HorseHealth, { color: string; label: string }> = {
    healthy: { color: "text-emerald-400", label: "Healthy" },
    injured: { color: "text-amber-400",   label: "Injured" },
    sick:    { color: "text-red-400",     label: "Sick"    },
};

const HORSE_PLACEHOLDER = "/jumping-horse-silhouette-facing-left-side-view.png";

const POSITION_LABEL: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };
const POSITION_COLOR: Record<number, string> = {
    1: "text-amber-400", 2: "text-gray-300", 3: "text-orange-400",
};

const STEWARD_COLORS: Record<string, string> = {
    "no-action":        "text-gray-400",
    warning:            "text-yellow-400",
    fine:               "text-orange-400",
    suspended:          "text-red-400",
    disqualified:       "text-red-500",
    demoted:            "text-orange-500",
    investigation:      "text-purple-400",
    "permanent-ban":    "text-red-600",
};

const LIMIT_OPTIONS = [5, 10, 25, 50, 100];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 py-2.5 border-b border-border/60 last:border-0">
            <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium flex-shrink-0">{label}</span>
            <span className="text-[12px] text-gray-200 text-right">{value ?? "—"}</span>
        </div>
    );
}

function SeverityDots({ n }: { n: number | null }) {
    return (
        <span className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <span key={i} className={`w-1.5 h-1.5 rounded-full ${i <= (n ?? 0) ? "bg-red-500" : "bg-white/10"}`} />
            ))}
        </span>
    );
}

// ── Horse image banner ────────────────────────────────────────────────────────

function HorseImageBanner({ href, name }: { href: string | null; name: string }) {
    const [errored, setErrored] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const isPlaceholder = !href || errored;

    if (isPlaceholder) {
        return (
            <div className="w-full h-28 flex items-center justify-center border-b border-border/60 bg-bg">
                <img src={HORSE_PLACEHOLDER} alt={name} className="h-16 w-16 object-contain opacity-25" />
            </div>
        );
    }

    return (
        <>
            <div className="relative w-full h-28 overflow-hidden border-b border-border/60 cursor-pointer group flex-shrink-0" onClick={() => setExpanded(true)}>
                <img src={href} alt={name} onError={() => setErrored(true)} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-[11px] font-semibold text-white bg-black/50 px-2.5 py-1 rounded-full">
                        <ExternalLink size={10} /> Full size
                    </span>
                </div>
            </div>
            {expanded && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setExpanded(false)}>
                    <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setExpanded(false)} className="absolute -top-3 -right-3 z-10 w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                            <X size={13} />
                        </button>
                        <img src={href} alt={name} className="w-full rounded-xl border border-border shadow-2xl" />
                        <p className="text-center text-[12px] text-gray-500 mt-3">{name}</p>
                    </div>
                </div>
            )}
        </>
    );
}

// ── Horse row avatar (list) ───────────────────────────────────────────────────

function HorseAvatar({ src, name }: { src: string | null; name: string }) {
    const [errored, setErrored] = useState(false);
    const isPlaceholder = !src || errored;
    return (
        <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-white/5 flex-shrink-0">
            <img
                src={isPlaceholder ? HORSE_PLACEHOLDER : src!}
                alt={name}
                onError={() => setErrored(true)}
                className={isPlaceholder ? "h-4 w-4 object-contain opacity-40" : "w-full h-full object-cover"}
            />
        </div>
    );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

type DetailTab = "overview" | "history" | "violations";

function HorseDetailPanel({
    horse,
    detail,
    detailLoading,
    onClose,
    onStatusChange,
    statusLoading,
}: {
    horse: AdminHorse;
    detail: HorseDetail | null;
    detailLoading: boolean;
    onClose: () => void;
    onStatusChange: (s: HorseStatus) => void;
    statusLoading: boolean;
}) {
    const [activeTab, setActiveTab] = useState<DetailTab>("overview");
    const [distUnit, setDistUnit] = useState<'lengths' | 'metres'>('lengths');
    const status = STATUS_CFG[horse.status];
    const health = HEALTH_CFG[horse.healthStatus];
    const fmtLength = (l: number | null | undefined) => {
        if (l == null || l === 0) return '—';
        if (distUnit === 'metres') return `+${(l * 2.4).toFixed(1)} m`;
        if (l <= 0.1)  return 'Nse';
        if (l <= 0.2)  return 'Hd';
        if (l <= 0.35) return 'Nk';
        const whole = Math.floor(l);
        const frac  = Math.round((l - whole) * 4) / 4;
        const f     = frac === 0 ? '' : frac === 0.25 ? '¼' : frac === 0.5 ? '½' : '¾';
        return whole === 0 ? `${f}L` : `${whole}${f}L`;
    };

    const raceHistory  = detail?.raceHistory ?? [];
    const allViolations = raceHistory.flatMap(r => r.violations);
    const totalPrize   = raceHistory.reduce((s, r) => s + (r.prizeMoney ?? 0), 0);
    const wins         = raceHistory.filter(r => r.finishPosition === 1 && r.resultStatus === "official").length;

    const TABS: { id: DetailTab; label: string; count?: number }[] = [
        { id: "overview",   label: "Overview" },
        { id: "history",    label: "Race History", count: raceHistory.length },
        { id: "violations", label: "Violations",   count: allViolations.length },
    ];

    return (
        <div className="flex flex-col bg-surface border border-border rounded-xl overflow-hidden h-full" style={{ animation: "panelIn 0.18s ease-out" }}>
            <style>{`@keyframes panelIn { from { opacity:0; transform:translateX(10px) } to { opacity:1; transform:translateX(0) } }`}</style>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full bg-amber-400" />
                    <p className="text-[13px] font-semibold text-white">Horse Detail</p>
                </div>
                <button onClick={onClose} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors">
                    <X size={14} />
                </button>
            </div>

            {/* Image banner */}
            <HorseImageBanner href={horse.img} name={horse.horseName} />

            {/* Identity */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-border/60 flex-shrink-0">
                <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-white">{horse.horseName}</p>
                    <p className="text-[11px] text-gray-500">{horse.breed ?? "Unknown breed"} · {horse.gender ?? "—"}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.bg} ${status.color} ${status.border}`}>
                        {status.icon}{status.label}
                    </span>
                    <span className={`text-[11px] font-medium ${health.color}`}>{health.label}</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex px-5 gap-1 pt-2 pb-0 border-b border-border flex-shrink-0">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium transition-colors relative ${activeTab === tab.id ? "text-white" : "text-gray-500 hover:text-gray-300"}`}>
                        {tab.label}
                        {tab.count != null && tab.count > 0 && (
                            <span className="text-[9px] font-bold bg-white/10 text-gray-400 px-1.5 py-0.5 rounded-full">{tab.count}</span>
                        )}
                        {activeTab === tab.id && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-amber-400 rounded-full" />}
                    </button>
                ))}
            </div>

            {/* Tab body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">

                {/* Loading overlay */}
                {detailLoading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 size={22} className="text-amber-400 animate-spin" />
                    </div>
                )}

                {!detailLoading && activeTab === "overview" && (
                    <div className="flex flex-col gap-4">
                        {/* Stats bar */}
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: "Races",  value: detail?.totalRaces ?? 0,     color: "text-white" },
                                { label: "Wins",   value: wins,                         color: "text-amber-400" },
                                { label: "Prize",  value: `$${totalPrize.toLocaleString()}`, color: "text-emerald-400" },
                            ].map(s => (
                                <div key={s.label} className="rounded-lg bg-white/[0.03] border border-border/60 px-3 py-2 text-center">
                                    <p className={`text-[15px] font-bold ${s.color}`}>{s.value}</p>
                                    <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-0.5">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Horse info */}
                        <div>
                            <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2">Horse</p>
                            <div className="rounded-lg bg-white/[0.02] border border-border/60 px-3 flex flex-col">
                                <DetailRow label="Born"       value={<span className="flex items-center gap-1"><Calendar size={10} className="text-gray-600" />{fmtDate(horse.dateOfBirth)}</span>} />
                                <DetailRow label="Registered" value={<span className="flex items-center gap-1"><ShieldCheck size={10} className="text-gray-600" />{fmtDate(horse.registrationDate)}</span>} />
                                <DetailRow label="Health"     value={<span className={`font-semibold ${health.color}`}>{health.label}</span>} />
                                <DetailRow label="Status"     value={<span className={`flex items-center gap-1 font-medium ${status.color}`}>{status.icon}{status.label}</span>} />
                                <DetailRow label="Violations" value={
                                    detail?.totalViolations ? (
                                        <span className="flex items-center gap-1 text-red-400 font-medium"><AlertTriangle size={10} />{detail.totalViolations}</span>
                                    ) : "None"
                                } />
                            </div>
                        </div>

                        {/* Owner info */}
                        <div>
                            <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2">Owner</p>
                            <div className="rounded-lg bg-white/[0.02] border border-border/60 px-3 flex flex-col">
                                <DetailRow label="Name"  value={<span className="flex items-center gap-1"><User size={10} className="text-gray-600" />{detail?.owner.fullName ?? horse.ownerName ?? "—"}</span>} />
                                <DetailRow label="Email" value={<span className="text-gray-400">{detail?.owner.email ?? "—"}</span>} />
                                <DetailRow label="ID"    value={<span className="text-gray-500 font-mono text-[11px]">{horse.ownerId}</span>} />
                            </div>
                        </div>
                    </div>
                )}

                {!detailLoading && activeTab === "history" && (
                    <div className="flex flex-col gap-2">
                        {raceHistory.length > 0 && (
                            <div className="flex justify-end">
                                <div className="flex items-center gap-0.5 bg-white/5 border border-border rounded-lg p-0.5">
                                    {(['lengths', 'metres'] as const).map(u => (
                                        <button key={u} onClick={() => setDistUnit(u)}
                                            className={["text-[10px] font-bold font-mono px-2 py-1 rounded-md transition-all", distUnit === u ? "bg-white/15 text-white" : "text-gray-600 hover:text-gray-400"].join(" ")}>
                                            {u === 'lengths' ? 'L' : 'm'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {raceHistory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-2">
                                <Trophy size={22} className="text-gray-700" />
                                <p className="text-[12px] text-gray-600">No race history.</p>
                            </div>
                        ) : raceHistory.map(r => (
                            <div key={r.registrationId} className="rounded-lg bg-white/[0.02] border border-border/60 px-4 py-3 flex flex-col gap-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-[12.5px] font-semibold text-white truncate">{r.roundName ?? "Unknown Race"}</p>
                                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                            <span className="flex items-center gap-1 text-[11px] text-gray-500"><Calendar size={10} />{fmtDate(r.raceDate)}</span>
                                            {r.location && <><span className="text-gray-700">·</span><span className="text-[11px] text-gray-500 truncate">{r.location}</span></>}
                                        </div>
                                    </div>
                                    {r.resultStatus && (
                                        <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${r.resultStatus === "official" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                                            {r.resultStatus}
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-4 gap-2 pt-1 border-t border-border/60">
                                    <div>
                                        <p className="text-[10px] text-gray-600 uppercase tracking-wider">Position</p>
                                        <p className={`text-[13px] font-bold mt-0.5 ${POSITION_COLOR[r.finishPosition ?? 0] ?? "text-gray-500"}`}>
                                            {r.finishPosition ? (POSITION_LABEL[r.finishPosition] ?? `${r.finishPosition}th`) : "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-600 uppercase tracking-wider">Time</p>
                                        <p className="text-[12px] text-gray-300 font-medium mt-0.5 flex items-center gap-1">
                                            <Timer size={10} className="text-gray-600" />{r.finishTime ?? "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-600 uppercase tracking-wider">Margin</p>
                                        <p className="text-[12px] text-gray-400 font-medium mt-0.5">{fmtLength(r.distance)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-600 uppercase tracking-wider">Prize</p>
                                        <p className="text-[12px] text-emerald-400 font-medium mt-0.5">${r.prizeMoney.toLocaleString()}</p>
                                    </div>
                                </div>
                                {r.violations.length > 0 && (
                                    <div className="pt-1 border-t border-border/60">
                                        <p className="text-[10px] text-red-400/80 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                                            <AlertTriangle size={9} /> {r.violations.length} violation{r.violations.length > 1 ? "s" : ""}
                                        </p>
                                        {r.violations.map(v => (
                                            <p key={v.violationId} className="text-[11px] text-gray-500">{v.typeName ?? "Unknown"}{v.stewardAction ? ` · ${v.stewardAction}` : ""}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {!detailLoading && activeTab === "violations" && (
                    <div className="flex flex-col gap-2">
                        {allViolations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-2">
                                <Shield size={22} className="text-gray-700" />
                                <p className="text-[12px] text-gray-600">No violations recorded.</p>
                            </div>
                        ) : allViolations.map(v => (
                            <div key={v.violationId} className="rounded-lg bg-red-500/[0.04] border border-red-500/10 px-4 py-3 flex flex-col gap-2">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-[12.5px] font-semibold text-white">{v.typeName ?? "Unknown Violation"}</p>
                                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${v.violationStatus === "confirmed" ? "bg-red-500/10 text-red-400" : v.violationStatus === "dismissed" ? "bg-gray-500/10 text-gray-500" : "bg-amber-500/10 text-amber-400"}`}>
                                        {v.violationStatus}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    {v.category && <span className="text-[11px] text-gray-500 capitalize">{v.category}</span>}
                                    <SeverityDots n={v.severity} />
                                    {v.stewardAction && (
                                        <span className={`text-[11px] font-medium capitalize ${STEWARD_COLORS[v.stewardAction] ?? "text-gray-400"}`}>
                                            {v.stewardAction}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer — status actions */}
            <div className="flex gap-2 px-5 py-3 border-t border-border flex-shrink-0">
                {horse.status === "active" && <>
                    <button onClick={() => onStatusChange("inactive")} disabled={statusLoading}
                        className="flex-1 text-[12px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 py-2 rounded-lg transition-colors border border-amber-500/20 disabled:opacity-40">
                        {statusLoading ? <Loader2 size={13} className="animate-spin mx-auto" /> : "Suspend"}
                    </button>
                    <button onClick={() => onStatusChange("retired")} disabled={statusLoading}
                        className="flex-1 text-[12px] font-semibold bg-red-700/20 hover:bg-red-700/30 text-red-400 py-2 rounded-lg transition-colors border border-red-700/30 disabled:opacity-40">
                        {statusLoading ? <Loader2 size={13} className="animate-spin mx-auto" /> : "Retire"}
                    </button>
                </>}
                {horse.status === "inactive" && <>
                    <button onClick={() => onStatusChange("active")} disabled={statusLoading}
                        className="flex-1 text-[12px] font-semibold bg-emerald-700/20 hover:bg-emerald-700/30 text-emerald-400 py-2 rounded-lg transition-colors border border-emerald-700/30 disabled:opacity-40">
                        {statusLoading ? <Loader2 size={13} className="animate-spin mx-auto" /> : "Reactivate"}
                    </button>
                    <button onClick={() => onStatusChange("retired")} disabled={statusLoading}
                        className="flex-1 text-[12px] font-semibold bg-red-700/20 hover:bg-red-700/30 text-red-400 py-2 rounded-lg transition-colors border border-red-700/30 disabled:opacity-40">
                        {statusLoading ? <Loader2 size={13} className="animate-spin mx-auto" /> : "Retire"}
                    </button>
                </>}
                {horse.status === "retired" && (
                    <button onClick={() => onStatusChange("active")} disabled={statusLoading}
                        className="flex-1 text-[12px] font-semibold bg-emerald-700/20 hover:bg-emerald-700/30 text-emerald-400 py-2 rounded-lg transition-colors border border-emerald-700/30 disabled:opacity-40">
                        {statusLoading ? <Loader2 size={13} className="animate-spin mx-auto" /> : "Reactivate"}
                    </button>
                )}
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminHorsesPage() {
    const [horses,       setHorses]       = useState<AdminHorse[]>([]);
    const [page,         setPage]         = useState(1);
    const [limit,        setLimit]        = useState(10);
    const [totalItems,   setTotalItems]   = useState(0);
    const [totalPages,   setTotalPages]   = useState(1);
    const [search,       setSearch]       = useState("");
    const [statusFilter, setStatusFilter] = useState<HorseStatus | "">("");
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState<string | null>(null);
    const [refreshSeed,  setRefreshSeed]  = useState(0);
    const [sortBy,       setSortBy]       = useState<string>('createdAt');
    const [order,        setOrder]        = useState<'asc' | 'desc'>('desc');

    const [selectedHorse,  setSelectedHorse]  = useState<AdminHorse | null>(null);
    const [horseDetail,    setHorseDetail]    = useState<HorseDetail | null>(null);
    const [detailLoading,  setDetailLoading]  = useState(false);
    const [statusLoading,  setStatusLoading]  = useState(false);

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setOrder('asc');
        }
        setPage(1);
    };

    const SortIcon = ({ field }: { field: string }) => {
        if (sortBy !== field) return <ArrowUpDown size={11} className="text-gray-600 ml-1 inline" />;
        return order === 'asc'
            ? <ArrowUp size={11} className="text-gold ml-1 inline" />
            : <ArrowDown size={11} className="text-gold ml-1 inline" />;
    };

    // Fetch list
    useEffect(() => {
        setLoading(true);
        setError(null);
        adminService.getAllHorses(page, limit, search || undefined, statusFilter || undefined, sortBy, order)
            .then((res: any) => {
                const d = res?.data ?? {};
                setHorses(d.items ?? []);
                setTotalItems(d.pagination?.totalItems ?? 0);
                setTotalPages(d.pagination?.totalPages ?? 1);
            })
            .catch((err: any) => setError(err?.msg ?? "Failed to load horses."))
            .finally(() => setLoading(false));
    }, [page, limit, search, statusFilter, sortBy, order, refreshSeed]);

    // Reset page on filter change
    const handleSearch = useCallback((v: string) => { setSearch(v); setPage(1); }, []);
    const handleStatus = useCallback((v: string) => { setStatusFilter(v as any); setPage(1); }, []);
    const handleLimitChange = useCallback((v: number) => { setLimit(v); setPage(1); }, []);

    // Fetch detail on row click
    const handleSelectHorse = useCallback((horse: AdminHorse) => {
        if (selectedHorse?.horseId === horse.horseId) {
            setSelectedHorse(null);
            setHorseDetail(null);
            return;
        }
        setSelectedHorse(horse);
        setHorseDetail(null);
        setDetailLoading(true);
        adminService.getHorseDetail(horse.horseId)
            .then((res: any) => setHorseDetail(res?.data ?? null))
            .catch(() => {})
            .finally(() => setDetailLoading(false));
    }, [selectedHorse]);

    // Status update
    const handleStatusChange = useCallback(async (newStatus: HorseStatus) => {
        if (!selectedHorse) return;
        setStatusLoading(true);
        try {
            await adminService.updateHorseStatus(selectedHorse.horseId, newStatus);
            setHorses(prev => prev.map(h => h.horseId === selectedHorse.horseId ? { ...h, status: newStatus } : h));
            setSelectedHorse(prev => prev ? { ...prev, status: newStatus } : prev);
        } catch (_) {}
        setStatusLoading(false);
    }, [selectedHorse]);

    const panelOpen = selectedHorse !== null;

    return (
        <div className="flex flex-col h-full bg-bg text-white overflow-hidden font-sans">
            <div className="flex-1 flex gap-4 p-8 min-h-0 items-start">

                {/* ── List ── */}
                <main className={`flex flex-col min-w-0 h-full transition-all duration-200 ${panelOpen ? "flex-[0_0_52%]" : "flex-1"}`}>

                    {/* Header */}
                    <header className="pb-5 flex flex-col gap-3 border-b border-border/60 shrink-0">
                        {/* Row 1 */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <h1 className="text-[22px] font-bold text-white tracking-tight leading-tight truncate font-serif">
                                    Horses
                                </h1>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-[10px] font-semibold tracking-wide text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-border uppercase whitespace-nowrap">
                                        All Registered
                                    </span>
                                    <span className="text-[12px] text-gray-500 truncate">· {totalItems} total</span>
                                </div>
                            </div>
                        </div>

                        {/* Row 2 */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="relative flex-1 min-w-0">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text" placeholder="Search name or breed…" value={search}
                                    onChange={e => handleSearch(e.target.value)}
                                    className="w-full bg-surface border border-border rounded-md pl-8 pr-3 text-[11px] text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 h-[32px]"
                                />
                            </div>
                            <select value={statusFilter} onChange={e => handleStatus(e.target.value)}
                                className="w-[130px] shrink-0 bg-surface border border-border rounded-md px-3 text-[11px] text-gray-300 focus:outline-none h-[32px] appearance-none cursor-pointer">
                                <option value="">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Suspended</option>
                                <option value="retired">Retired</option>
                            </select>
                            <select
                                value={`${sortBy}:${order}`}
                                onChange={e => {
                                    const [field, dir] = e.target.value.split(':');
                                    setSortBy(field);
                                    setOrder(dir as 'asc' | 'desc');
                                    setPage(1);
                                }}
                                className="w-[175px] shrink-0 bg-surface border border-border rounded-md px-3 text-[11px] text-gray-300 focus:outline-none h-[32px] appearance-none cursor-pointer"
                            >
                                <option value="createdAt:desc">Newest First</option>
                                <option value="createdAt:asc">Oldest First</option>
                                <option value="horseName:asc">Name A–Z</option>
                                <option value="horseName:desc">Name Z–A</option>
                                <option value="status:asc">Group by Status</option>
                                <option value="healthStatus:asc">Group by Health</option>
                            </select>
                            <select
                                value={limit}
                                onChange={e => handleLimitChange(Number(e.target.value))}
                                className="w-[130px] shrink-0 bg-surface border border-border rounded-md px-3 text-[11px] text-gray-300 focus:outline-none h-[32px] appearance-none cursor-pointer"
                            >
                                {LIMIT_OPTIONS.map(n => (
                                    <option key={n} value={n}>{n} rows</option>
                                ))}
                            </select>
                        </div>
                    </header>

                    {/* Table */}
                    <div className="flex-1 overflow-y-auto pt-6 flex flex-col">
                        <div className="w-full rounded-xl border border-border bg-surface overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface border-b border-border/60">
                                        <th onClick={() => handleSort('horseName')} className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase cursor-pointer hover:text-gray-300 select-none whitespace-nowrap">
                                            Horse <SortIcon field="horseName" />
                                        </th>
                                        {!panelOpen && (
                                            <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Owner</th>
                                        )}
                                        <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Breed</th>
                                        {!panelOpen && (
                                            <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Gender</th>
                                        )}
                                        {!panelOpen && (
                                            <th onClick={() => handleSort('healthStatus')} className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase cursor-pointer hover:text-gray-300 select-none whitespace-nowrap">
                                                Health <SortIcon field="healthStatus" />
                                            </th>
                                        )}
                                        <th onClick={() => handleSort('status')} className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase cursor-pointer hover:text-gray-300 select-none whitespace-nowrap">
                                            Status <SortIcon field="status" />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center">
                                                <Loader2 size={22} className="text-gray-600 animate-spin mx-auto" />
                                            </td>
                                        </tr>
                                    ) : error ? (
                                        <tr>
                                            <td colSpan={6} className="p-4">
                                                <ErrorState message={error} onRetry={() => setRefreshSeed(s => s + 1)} />
                                            </td>
                                        </tr>
                                    ) : horses.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-10 text-center">
                                                <p className="text-[12px] text-gray-600">No horses found.</p>
                                            </td>
                                        </tr>
                                    ) : horses.map(horse => {
                                        const s = STATUS_CFG[horse.status];
                                        const h = HEALTH_CFG[horse.healthStatus];
                                        const isSelected = selectedHorse?.horseId === horse.horseId;

                                        return (
                                            <tr key={horse.horseId} onClick={() => handleSelectHorse(horse)}
                                                className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${isSelected ? "bg-red-900/10" : ""}`}>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <HorseAvatar src={horse.img} name={horse.horseName} />
                                                        <div className="min-w-0">
                                                            <p className="text-[13px] text-white font-medium truncate">{horse.horseName}</p>
                                                            {!panelOpen && <p className="text-[11px] text-gray-600 truncate">{fmtDate(horse.dateOfBirth)}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                {!panelOpen && <td className="p-4"><p className="text-[12px] text-gray-400 truncate">{horse.ownerName ?? "—"}</p></td>}
                                                <td className="p-4"><p className="text-[12px] text-gray-400 truncate">{horse.breed ?? "—"}</p></td>
                                                {!panelOpen && <td className="p-4"><p className="text-[12px] text-gray-400 capitalize">{horse.gender ?? "—"}</p></td>}
                                                {!panelOpen && <td className="p-4"><span className={`text-[12px] font-medium ${h.color}`}>{h.label}</span></td>}
                                                <td className="p-4">
                                                    <span className={`flex items-center gap-1 text-[12px] font-medium ${s.color}`}>
                                                        {s.icon}
                                                        {!panelOpen && <span className="hidden xl:inline">{s.label}</span>}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            <Pagination page={page} totalPages={totalPages} totalItems={totalItems} limit={limit} onPageChange={setPage} />
                        </div>
                    </div>
                </main>

                {/* ── Detail panel ── */}
                {panelOpen && (
                    <div className="flex-1 min-w-[460px] h-full">
                        <HorseDetailPanel
                            horse={selectedHorse!}
                            detail={horseDetail}
                            detailLoading={detailLoading}
                            onClose={() => { setSelectedHorse(null); setHorseDetail(null); }}
                            onStatusChange={handleStatusChange}
                            statusLoading={statusLoading}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
