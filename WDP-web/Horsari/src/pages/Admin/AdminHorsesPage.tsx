import { useState } from "react";
import {
    X, Search, CheckCircle, XCircle, Clock,
    Image as ImageIcon, ExternalLink, Calendar,
    ShieldCheck, Activity, User, Trophy,
    Timer,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type HorseStatus = "active" | "injured" | "retired" | "pending";
type HorseGender = "Stallion" | "Mare" | "Gelding" | "Filly" | "Colt";
type HorseHealth = "Excellent" | "Good" | "Fair" | "Poor";
type ResultStatus = "Official" | "Disqualified" | "Pending";

interface Horse {
    horseId: string;
    ownerId: string;
    ownerName: string;
    horseName: string;
    breed: string;
    gender: HorseGender;
    healthStatus: HorseHealth;
    registrationDate: string;
    status: HorseStatus;
    img: string;
    dateOfBirth: string;
}

interface RaceResult {
    resultId: string;
    registrationId: string;
    publishedByAdminId: string;
    finishPosition: number;
    finishTime: string;
    prizeMoney: number;
    resultStatus: ResultStatus;
    // joined fields
    jockeyName: string;
    roundName: string;
    raceDate: string;
    location: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const HORSES: Horse[] = [
    {
        horseId: "h1", ownerId: "u1", ownerName: "James Weston",
        horseName: "Desert Storm", breed: "Arabian", gender: "Stallion",
        healthStatus: "Excellent", registrationDate: "2022-04-10",
        status: "active", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Collage_of_Nine_Horses.jpg/640px-Collage_of_Nine_Horses.jpg", dateOfBirth: "2018-06-15",
    },
    {
        horseId: "h2", ownerId: "u1", ownerName: "James Weston",
        horseName: "Golden Mirage", breed: "Thoroughbred", gender: "Mare",
        healthStatus: "Good", registrationDate: "2021-09-03",
        status: "active", img: "", dateOfBirth: "2017-03-22",
    },
    {
        horseId: "h3", ownerId: "u5", ownerName: "Ryan Brown",
        horseName: "Silver Blaze", breed: "Quarter Horse", gender: "Gelding",
        healthStatus: "Fair", registrationDate: "2023-01-18",
        status: "injured", img: "", dateOfBirth: "2019-11-07",
    },
    {
        horseId: "h4", ownerId: "u5", ownerName: "Ryan Brown",
        horseName: "Midnight Thunder", breed: "Andalusian", gender: "Stallion",
        healthStatus: "Excellent", registrationDate: "2020-07-29",
        status: "active", img: "", dateOfBirth: "2016-08-14",
    },
    {
        horseId: "h5", ownerId: "u1", ownerName: "James Weston",
        horseName: "Scarlet Rose", breed: "Warmblood", gender: "Filly",
        healthStatus: "Good", registrationDate: "2024-02-11",
        status: "pending", img: "", dateOfBirth: "2021-05-30",
    },
    {
        horseId: "h6", ownerId: "u5", ownerName: "Ryan Brown",
        horseName: "Iron Duke", breed: "Thoroughbred", gender: "Colt",
        healthStatus: "Poor", registrationDate: "2019-12-05",
        status: "retired", img: "", dateOfBirth: "2015-01-19",
    },
];

// Race results keyed by horseId
const RACE_RESULTS: Record<string, RaceResult[]> = {
    h1: [
        { resultId: "r1", registrationId: "reg1", publishedByAdminId: "admin01", finishPosition: 1, finishTime: "1:42.38", prizeMoney: 15000, resultStatus: "Official", jockeyName: "Sarah Miller", roundName: "Dubai World Cup – Round 4", raceDate: "2024-10-20", location: "Meydan Racecourse" },
        { resultId: "r2", registrationId: "reg2", publishedByAdminId: "admin01", finishPosition: 3, finishTime: "1:43.91", prizeMoney: 4000, resultStatus: "Official", jockeyName: "Sarah Miller", roundName: "Ascot Gold Cup – Round 2", raceDate: "2024-09-14", location: "Ascot Racecourse" },
        { resultId: "r3", registrationId: "reg3", publishedByAdminId: "admin01", finishPosition: 2, finishTime: "1:41.77", prizeMoney: 8000, resultStatus: "Official", jockeyName: "Lily Chang", roundName: "Kentucky Derby – Round 1", raceDate: "2024-05-04", location: "Churchill Downs" },
    ],
    h2: [
        { resultId: "r4", registrationId: "reg4", publishedByAdminId: "admin01", finishPosition: 4, finishTime: "1:45.20", prizeMoney: 1500, resultStatus: "Official", jockeyName: "Lily Chang", roundName: "Dubai World Cup – Round 3", raceDate: "2024-10-15", location: "Meydan Racecourse" },
    ],
    h4: [
        { resultId: "r5", registrationId: "reg5", publishedByAdminId: "admin01", finishPosition: 1, finishTime: "1:39.55", prizeMoney: 20000, resultStatus: "Official", jockeyName: "Sarah Miller", roundName: "Dubai World Cup – Round 1", raceDate: "2024-10-05", location: "Meydan Racecourse" },
        { resultId: "r6", registrationId: "reg6", publishedByAdminId: "admin01", finishPosition: 2, finishTime: "2:01.14", prizeMoney: 7500, resultStatus: "Disqualified", jockeyName: "Sarah Miller", roundName: "Ascot Gold Cup – Round 1", raceDate: "2024-08-22", location: "Ascot Racecourse" },
    ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<HorseStatus, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
    active: { icon: <CheckCircle size={13} />, label: "Active", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    injured: { icon: <Activity size={13} />, label: "Injured", color: "text-amber-400", bg: "bg-amber-500/10" },
    retired: { icon: <XCircle size={13} />, label: "Retired", color: "text-gray-500", bg: "bg-white/[0.05]" },
    pending: { icon: <Clock size={13} />, label: "Pending", color: "text-blue-400", bg: "bg-blue-500/10" },
};

const HEALTH_STYLES: Record<HorseHealth, { color: string }> = {
    Excellent: { color: "text-emerald-400" },
    Good: { color: "text-teal-400" },
    Fair: { color: "text-amber-400" },
    Poor: { color: "text-red-400" },
};

const RESULT_STATUS_STYLES: Record<ResultStatus, { color: string; bg: string }> = {
    Official: { color: "text-emerald-400", bg: "bg-emerald-500/10" },
    Disqualified: { color: "text-red-400", bg: "bg-red-500/10" },
    Pending: { color: "text-amber-400", bg: "bg-amber-500/10" },
};

const GENDER_COLORS: Record<HorseGender, string> = {
    Stallion: "#3b4a6b",
    Mare: "#6b3b5a",
    Gelding: "#3b5a6b",
    Filly: "#5a3b6b",
    Colt: "#4a6b3b",
};

const POSITION_STYLES: Record<number, { color: string; label: string }> = {
    1: { color: "text-amber-400", label: "1st" },
    2: { color: "text-gray-300", label: "2nd" },
    3: { color: "text-orange-400", label: "3rd" },
};

function positionLabel(pos: number) {
    return POSITION_STYLES[pos]?.label ?? `${pos}th`;
}
function positionColor(pos: number) {
    return POSITION_STYLES[pos]?.color ?? "text-gray-500";
}

function horseInitials(name: string) {
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

// ── Detail sub-components ─────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 py-2.5 border-b border-white/[0.05] last:border-0">
            <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium flex-shrink-0">{label}</span>
            <span className="text-[12px] text-gray-200 text-right">{value}</span>
        </div>
    );
}

// ── Horse image banner (compact, top of panel) ────────────────────────────────

function HorseImageBanner({ href, name, gender }: { href: string; name: string; gender: HorseGender }) {
    const [errored, setErrored] = useState(false);
    const [expanded, setExpanded] = useState(false);

    if (!href || errored) {
        return (
            <div
                className="w-full h-28 flex items-center justify-center gap-2 text-gray-700 border-b border-white/[0.05]"
                style={{ background: GENDER_COLORS[gender] + "22" }}
            >
                <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-bold text-white/60"
                    style={{ background: GENDER_COLORS[gender] }}
                >
                    {horseInitials(name)}
                </div>
            </div>
        );
    }

    return (
        <>
            <div
                className="relative w-full h-28 overflow-hidden border-b border-white/[0.05] cursor-pointer group flex-shrink-0"
                onClick={() => setExpanded(true)}
            >
                <img
                    src={href}
                    alt={name}
                    onError={() => setErrored(true)}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-[11px] font-semibold text-white bg-black/50 px-2.5 py-1 rounded-full">
                        <ExternalLink size={10} /> Full size
                    </span>
                </div>
            </div>

            {expanded && (
                <div
                    className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
                    onClick={() => setExpanded(false)}
                >
                    <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setExpanded(false)}
                            className="absolute -top-3 -right-3 z-10 w-7 h-7 rounded-full bg-[#1a1a1a] border border-white/[0.1] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={13} />
                        </button>
                        <img src={href} alt={name} className="w-full rounded-xl border border-white/[0.1] shadow-2xl" />
                        <p className="text-center text-[12px] text-gray-500 mt-3">{name}</p>
                    </div>
                </div>
            )}
        </>
    );
}

// ── Race Results Tab ──────────────────────────────────────────────────────────

function RaceResultsTab({ horseId }: { horseId: string }) {
    const results = RACE_RESULTS[horseId] ?? [];

    if (results.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                <Trophy size={22} className="text-gray-700" />
                <p className="text-[12px] text-gray-600">No race results recorded.</p>
            </div>
        );
    }

    // Summary stats
    const wins = results.filter(r => r.finishPosition === 1 && r.resultStatus === "Official").length;
    const totalPrize = results.reduce((s, r) => s + (r.resultStatus !== "Disqualified" ? r.prizeMoney : 0), 0);

    return (
        <div className="flex flex-col gap-3">
            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-2">
                {[
                    { label: "Races", value: results.length, color: "text-white" },
                    { label: "Wins", value: wins, color: "text-amber-400" },
                    { label: "Prize Money", value: `$${totalPrize.toLocaleString()}`, color: "text-emerald-400" },
                ].map(s => (
                    <div key={s.label} className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2 text-center">
                        <p className={`text-[15px] font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Result cards */}
            <div className="flex flex-col gap-2">
                {results.map(r => {
                    const rs = RESULT_STATUS_STYLES[r.resultStatus];
                    return (
                        <div key={r.resultId} className="rounded-lg bg-white/[0.02] border border-white/[0.06] px-4 py-3 flex flex-col gap-2">
                            {/* Round name + status */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-[12.5px] font-semibold text-white truncate">{r.roundName}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="flex items-center gap-1 text-[11px] text-gray-500">
                                            <Calendar size={10} />{r.raceDate}
                                        </span>
                                        <span className="text-gray-700">·</span>
                                        <span className="text-[11px] text-gray-500 truncate">{r.location}</span>
                                    </div>
                                </div>
                                <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${rs.bg} ${rs.color}`}>
                                    {r.resultStatus}
                                </span>
                            </div>

                            {/* Stats row */}
                            <div className="grid grid-cols-4 gap-2 pt-1 border-t border-white/[0.05]">
                                <div>
                                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">Position</p>
                                    <p className={`text-[13px] font-bold mt-0.5 ${positionColor(r.finishPosition)}`}>
                                        {positionLabel(r.finishPosition)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">Time</p>
                                    <p className="text-[12px] text-gray-300 font-medium mt-0.5 flex items-center gap-1">
                                        <Timer size={10} className="text-gray-600" />{r.finishTime}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">Prize</p>
                                    <p className="text-[12px] text-emerald-400 font-medium mt-0.5">
                                        ${r.prizeMoney.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">Jockey</p>
                                    <p className="text-[11px] text-gray-300 mt-0.5 truncate">{r.jockeyName}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

type DetailTab = "info" | "results";

function HorseDetailPanel({ horse, onClose }: { horse: Horse; onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<DetailTab>("info");
    const status = STATUS_STYLES[horse.status];
    const health = HEALTH_STYLES[horse.healthStatus];

    return (
        <div
            className="flex flex-col bg-[#141414] border border-white/[0.07] rounded-xl overflow-hidden"
            style={{ animation: "panelIn 0.18s ease-out" }}
        >
            <style>{`@keyframes panelIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }`}</style>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07] flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full bg-amber-400" />
                    <p className="text-[13px] font-semibold text-white">Horse Detail</p>
                </div>
                <button onClick={onClose} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors">
                    <X size={14} />
                </button>
            </div>

            {/* Horse image — compact banner at top */}
            <HorseImageBanner href={horse.img} name={horse.horseName} gender={horse.gender} />

            {/* Identity strip */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.05]">
                <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-white">{horse.horseName}</p>
                    <p className="text-[11px] text-gray-500">{horse.breed} · {horse.gender}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                        {status.icon}{status.label}
                    </span>
                    <span className={`text-[11px] font-medium ${health.color}`}>{horse.healthStatus}</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex px-5 gap-1 pt-2 pb-0 border-b border-white/[0.07]">
                {([
                    { id: "info" as DetailTab, label: "Info", icon: <User size={11} /> },
                    { id: "results" as DetailTab, label: "Race Results", icon: <Trophy size={11} /> },
                ]).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium transition-colors relative ${activeTab === tab.id
                                ? "text-white"
                                : "text-gray-500 hover:text-gray-300"
                            }`}
                    >
                        {tab.icon}{tab.label}
                        {activeTab === tab.id && (
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-amber-400 rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">

                {activeTab === "info" && (
                    <div className="grid grid-cols-2 gap-3">

                        {/* Left column — Horse details */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-3.5 rounded-full bg-amber-400" />
                                <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Horse</p>
                            </div>
                            <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] px-3 flex flex-col">
                                <DetailRow label="ID" value={<span className="text-gray-500 font-mono text-[11px]">{horse.horseId}</span>} />
                                <DetailRow label="Born" value={
                                    <span className="flex items-center gap-1"><Calendar size={10} className="text-gray-600" />{horse.dateOfBirth}</span>
                                } />
                                <DetailRow label="Registered" value={
                                    <span className="flex items-center gap-1"><ShieldCheck size={10} className="text-gray-600" />{horse.registrationDate}</span>
                                } />
                                <DetailRow label="Health" value={
                                    <span className={`font-semibold ${health.color}`}>{horse.healthStatus}</span>
                                } />
                                <DetailRow label="Status" value={
                                    <span className={`flex items-center gap-1 font-medium ${status.color}`}>{status.icon}{status.label}</span>
                                } />
                            </div>
                        </div>

                        {/* Right column — Owner */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-3.5 rounded-full bg-blue-400" />
                                <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Owner</p>
                            </div>
                            <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] px-3 flex flex-col">
                                <DetailRow label="Name" value={
                                    <span className="flex items-center gap-1"><User size={10} className="text-gray-600" />{horse.ownerName}</span>
                                } />
                                <DetailRow label="ID" value={<span className="text-gray-500 font-mono text-[11px]">{horse.ownerId}</span>} />
                            </div>
                        </div>

                    </div>
                )}

                {activeTab === "results" && (
                    <RaceResultsTab horseId={horse.horseId} />
                )}
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-5 py-3 border-t border-white/[0.07] flex-shrink-0">
                <button className="flex-1 text-[12px] font-semibold bg-white/[0.05] hover:bg-white/[0.09] text-gray-300 py-2 rounded-lg transition-colors border border-white/[0.07]">
                    Edit Horse
                </button>
                {horse.status === "active" ? (
                    <button className="flex-1 text-[12px] font-semibold bg-red-700/20 hover:bg-red-700/30 text-red-400 py-2 rounded-lg transition-colors border border-red-700/30">
                        Retire
                    </button>
                ) : horse.status === "pending" ? (
                    <button className="flex-1 text-[12px] font-semibold bg-emerald-700/20 hover:bg-emerald-700/30 text-emerald-400 py-2 rounded-lg transition-colors border border-emerald-700/30">
                        Approve
                    </button>
                ) : (
                    <button className="flex-1 text-[12px] font-semibold bg-blue-700/20 hover:bg-blue-700/30 text-blue-400 py-2 rounded-lg transition-colors border border-blue-700/30">
                        Reactivate
                    </button>
                )}
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminHorsesPage() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<HorseStatus | "All">("All");
    const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);

    const filtered = HORSES.filter(h => {
        const matchSearch =
            h.horseName.toLowerCase().includes(search.toLowerCase()) ||
            h.breed.toLowerCase().includes(search.toLowerCase()) ||
            h.ownerName.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "All" || h.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const panelOpen = selectedHorse !== null;

    return (
        <div className="flex flex-col h-full bg-[#111111] text-white overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="flex-1 flex gap-4 p-8 min-h-0 items-start">
                <main className={`flex flex-col min-w-0 h-full transition-all duration-200 ${panelOpen ? "flex-[0_0_50%]" : "flex-1"}`}>
                    
                    {/* Header */}
                    <header className="pb-6 flex items-center justify-between border-b border-white/5 shrink-0">
                        <div>
                            <h1 className="text-[26px] font-bold text-white tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                                Horses
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] font-semibold tracking-wide text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase">
                                    All Registered Horses
                                </span>
                                <span className="text-[13px] text-gray-500">· {filtered.length} horse{filtered.length !== 1 ? "s" : ""}</span>
                            </div>
                        </div>

                        <div className="flex gap-3 items-center">
                            <div className="relative w-56">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search by name, breed, owner…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-md pl-8 pr-3 text-[12px] text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 h-[34px] transition-colors"
                                />
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="bg-[#1a1a1a] border border-white/10 rounded-md px-3 text-[12px] text-gray-300 focus:outline-none focus:border-white/20 h-[34px] appearance-none cursor-pointer capitalize"
                            >
                                <option value="All">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="injured">Injured</option>
                                <option value="pending">Pending</option>
                                <option value="retired">Retired</option>
                            </select>

                            <button className="flex items-center gap-2 px-5 text-[13px] font-medium text-white bg-[#ab3030] rounded hover:bg-[#8f2828] transition-colors shadow-lg shadow-red-900/20 h-[34px]">
                                + Add Horse
                            </button>
                        </div>
                    </header>

                    {/* Table Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pt-6">
                        <div className="w-full rounded-xl border border-white/[0.07] bg-[#141414] overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#1a1a1a] border-b border-white/5">
                                        {(panelOpen
                                            ? ["Horse", "Breed", "Status"]
                                            : ["Horse", "Owner", "Breed", "Gender", "Health", "Status"]
                                        ).map(h => (
                                            <th key={h} className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filtered.map(horse => {
                                        const status = STATUS_STYLES[horse.status];
                                        const health = HEALTH_STYLES[horse.healthStatus];
                                        const isSelected = selectedHorse?.horseId === horse.horseId;
                                        const hasResults = (RACE_RESULTS[horse.horseId]?.length ?? 0) > 0;

                                        return (
                                            <tr
                                                key={horse.horseId}
                                                onClick={() => setSelectedHorse(isSelected ? null : horse)}
                                                className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${isSelected ? "bg-red-900/10" : ""}`}
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div
                                                            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white/80 flex-shrink-0"
                                                            style={{ background: GENDER_COLORS[horse.gender] }}
                                                        >
                                                            {horseInitials(horse.horseName)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="text-[13px] text-white font-medium truncate">{horse.horseName}</p>
                                                                {hasResults && <Trophy size={10} className="text-amber-500 flex-shrink-0" />}
                                                            </div>
                                                            {!panelOpen && <p className="text-[11px] text-gray-600 truncate">{horse.dateOfBirth}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                {!panelOpen && (
                                                    <td className="p-4">
                                                        <p className="text-[12px] text-gray-400 truncate">{horse.ownerName}</p>
                                                    </td>
                                                )}
                                                <td className="p-4">
                                                    <p className="text-[12px] text-gray-400 truncate">{horse.breed}</p>
                                                </td>
                                                {!panelOpen && (
                                                    <td className="p-4">
                                                        <p className="text-[12px] text-gray-400">{horse.gender}</p>
                                                    </td>
                                                )}
                                                {!panelOpen && (
                                                    <td className="p-4">
                                                        <span className={`text-[12px] font-medium ${health.color}`}>{horse.healthStatus}</span>
                                                    </td>
                                                )}
                                                <td className="p-4">
                                                    <span className={`flex items-center gap-1 text-[12px] font-medium ${status.color}`}>
                                                        {status.icon}
                                                        {!panelOpen && <span className="hidden xl:inline">{status.label}</span>}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={6}>
                                                <div className="py-10 text-center">
                                                    <p className="text-[12px] text-gray-600">No horses found.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>

                {/* Detail panel */}
                {panelOpen && (
                    <div className="flex-1 min-w-[500px] h-full">
                        <HorseDetailPanel horse={selectedHorse!} onClose={() => setSelectedHorse(null)} />
                    </div>
                )}
            </div>
        </div>
    );
}