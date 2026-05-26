import { useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Flag, Search, User } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ViolationStatus = "Confirmed" | "Pending Review" | "Dismissed";

interface Incident {
    id: string;
    timestamp: string;
    race: string;
    raceLabel: string;
    offender: string;
    offenderType: "jockey" | "horse";
    violationType: string;
    status: ViolationStatus;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const INCIDENTS: Incident[] = [
    {
        id: "VI0-8492",
        timestamp: "2024-10-24  14:32:05",
        race: "R-992",
        raceLabel: "Dubai Turf",
        offender: "Marcus Vance",
        offenderType: "jockey",
        violationType: "Interference (Whip)",
        status: "Confirmed",
    },
    {
        id: "VI0-8491",
        timestamp: "2024-10-24  12:15:22",
        race: "R-990",
        raceLabel: "Ascot Stakes",
        offender: "Elena Rostova",
        offenderType: "jockey",
        violationType: "Weighing In Irregularity",
        status: "Pending Review",
    },
    {
        id: "VI0-8488",
        timestamp: "2024-10-23  16:45:00",
        race: "R-985",
        raceLabel: "Kentucky Prep",
        offender: "Midnight Runner",
        offenderType: "horse",
        violationType: "Gate Break Violation",
        status: "Dismissed",
    },
];

const JOCKEYS = ["All Jockeys", "Marcus Vance", "Elena Rostova"];
const STATUSES: ViolationStatus[] = ["Confirmed", "Pending Review", "Dismissed"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ViolationStatus }) {
    const styles: Record<ViolationStatus, string> = {
        "Confirmed": "bg-red-50 border-red-300 text-red-700",
        "Pending Review": "bg-amber-50 border-amber-300 text-amber-700",
        "Dismissed": "bg-gray-100 border-gray-300 text-gray-500",
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${styles[status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === "Confirmed" ? "bg-red-500" :
                    status === "Pending Review" ? "bg-amber-500" : "bg-gray-400"
                }`} />
            {status}
        </span>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ViolationManagementPage() {
    const [search, setSearch] = useState("");
    const [jockey, setJockey] = useState("All Jockeys");
    const [statusFilter, setStatusFilter] = useState("All Statuses");
    const [showModal, setShowModal] = useState(false);

    const filtered = INCIDENTS.filter((inc) => {
        const matchSearch = search === "" || inc.id.toLowerCase().includes(search.toLowerCase());
        const matchJockey = jockey === "All Jockeys" || inc.offender === jockey;
        const matchStatus = statusFilter === "All Statuses" || inc.status === statusFilter;
        return matchSearch && matchJockey && matchStatus;
    });

    return (
        <div
            className="min-h-screen bg-[#fdf5f5]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            <div
                className="min-h-screen"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(220,38,38,0.06) 38px, rgba(220,38,38,0.06) 40px)",
                }}
            >
                <div className="max-w-5xl mx-auto px-5 py-8">

                    {/* ── Header ── */}
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <h1
                                className="text-[26px] font-semibold text-gray-900 tracking-tight"
                                style={{ fontFamily: "'Playfair Display', serif" }}
                            >
                                Violation Management
                            </h1>
                            <p className="text-[13px] text-gray-500 mt-0.5">
                                Review and record referee identified infractions.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-800 text-white text-[13px] font-bold uppercase tracking-widest hover:bg-red-900 shadow-sm hover:shadow-md hover:shadow-red-900/25 transition-all duration-150"
                        >
                            <AlertCircle size={14} />
                            Record Incident
                        </button>
                    </div>

                    {/* ── Filters ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 mb-5">
                        <div className="flex flex-wrap gap-3 items-end">

                            {/* Search */}
                            <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Race ID</label>
                                <div className="relative flex items-center">
                                    <Search size={13} className="absolute left-3 text-gray-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Search by ID..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-[13px] text-gray-800 placeholder-gray-400 outline-none focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-100 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Jockey filter */}
                            <div className="flex flex-col gap-1.5 min-w-[160px]">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Jockey</label>
                                <select
                                    value={jockey}
                                    onChange={(e) => setJockey(e.target.value)}
                                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-gray-400 focus:bg-white transition-all appearance-none cursor-pointer"
                                >
                                    {JOCKEYS.map((j) => <option key={j}>{j}</option>)}
                                </select>
                            </div>

                            {/* Status filter */}
                            <div className="flex flex-col gap-1.5 min-w-[160px]">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-gray-400 focus:bg-white transition-all appearance-none cursor-pointer"
                                >
                                    <option>All Statuses</option>
                                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                                </select>
                            </div>

                            {/* Clear */}
                            <button
                                onClick={() => { setSearch(""); setJockey("All Jockeys"); setStatusFilter("All Statuses"); }}
                                className="px-4 py-2 rounded-lg border border-gray-200 text-[13px] font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all duration-150 self-end"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>

                    {/* ── Table ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Table head */}
                        <div className="grid grid-cols-[110px_170px_180px_160px_1fr_140px_80px] gap-0 border-b border-gray-100 px-5 py-2.5">
                            {["Incident ID", "Timestamp", "Race", "Offender", "Violation Type", "Status", "Actions"].map((col) => (
                                <span key={col} className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    {col}
                                </span>
                            ))}
                        </div>

                        {/* Rows */}
                        {filtered.length === 0 ? (
                            <div className="px-5 py-12 text-center text-[13px] text-gray-400">
                                No incidents match your filters.
                            </div>
                        ) : (
                            filtered.map((inc, i) => (
                                <div
                                    key={inc.id}
                                    className={[
                                        "grid grid-cols-[110px_170px_180px_160px_1fr_140px_80px] gap-0 px-5 py-3.5 items-center transition-colors duration-150 hover:bg-gray-50/60",
                                        i !== filtered.length - 1 ? "border-b border-gray-100" : "",
                                    ].join(" ")}
                                >
                                    {/* ID */}
                                    <span className="text-[13px] font-bold text-gray-800">{inc.id}</span>

                                    {/* Timestamp */}
                                    <span className="text-[12px] text-gray-500 font-mono">{inc.timestamp}</span>

                                    {/* Race */}
                                    <div className="flex items-center gap-1.5">
                                        <Flag size={12} className="text-red-700 shrink-0" />
                                        <span className="text-[13px] text-gray-700 font-medium">
                                            {inc.race} <span className="text-gray-400 font-normal">({inc.raceLabel})</span>
                                        </span>
                                    </div>

                                    {/* Offender */}
                                    <div className="flex items-center gap-1.5">
                                        <User size={12} className="text-gray-400 shrink-0" />
                                        <span className="text-[13px] text-gray-700">{inc.offender}</span>
                                    </div>

                                    {/* Violation Type */}
                                    <span className="text-[13px] text-gray-700">{inc.violationType}</span>

                                    {/* Status */}
                                    <div><StatusBadge status={inc.status} /></div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button className="text-[12px] font-semibold text-red-800 hover:underline transition-colors">
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Pagination */}
                        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                            <span className="text-[12px] text-gray-400">
                                Showing 1 to {filtered.length} of 124 incidents
                            </span>
                            <div className="flex items-center gap-1">
                                <button className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all">
                                    <ChevronLeft size={13} />
                                </button>
                                <button className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all">
                                    <ChevronRight size={13} />
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* ── Record Incident Modal ── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6">
                        <h2
                            className="text-[20px] font-semibold text-gray-900 mb-1"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            Record Incident
                        </h2>
                        <p className="text-[13px] text-gray-500 mb-5">Log a new referee-identified infraction.</p>

                        <div className="flex flex-col gap-4">
                            {[
                                { label: "Race ID", placeholder: "e.g. R-992" },
                                { label: "Offender Name", placeholder: "Jockey or horse name" },
                                { label: "Violation Type", placeholder: "e.g. Interference (Whip)" },
                            ].map(({ label, placeholder }) => (
                                <div key={label} className="flex flex-col gap-1.5">
                                    <label className="text-[12px] font-semibold text-gray-600">{label}</label>
                                    <input
                                        type="text"
                                        placeholder={placeholder}
                                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-800 placeholder-gray-400 outline-none focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-100 transition-all"
                                    />
                                </div>
                            ))}

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[12px] font-semibold text-gray-600">Status</label>
                                <select className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-700 outline-none focus:border-gray-400 focus:bg-white transition-all appearance-none">
                                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-2.5 rounded-xl bg-red-800 text-white text-[13px] font-bold uppercase tracking-widest hover:bg-red-900 shadow-sm transition-all"
                            >
                                Save Incident
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}