import { useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Flag, Search, User } from "lucide-react";
import { INCIDENTS, JOCKEYS, STATUSES, type ViolationStatus, type Incident } from "./data/ManagementData";

// ── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ViolationStatus }) {
    const styles: Record<ViolationStatus, string> = {
        "Confirmed": "border-red-800/60 text-red-400 bg-red-500/10",
        "Pending Review": "border-yellow-700/60 text-yellow-400 bg-yellow-500/10",
        "Dismissed": "border-white/10 text-gray-600 bg-transparent",
    };
    const dot: Record<ViolationStatus, string> = {
        "Confirmed": "bg-red-500",
        "Pending Review": "bg-yellow-500",
        "Dismissed": "bg-gray-600",
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${styles[status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dot[status]}`} />
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

    const filtered = INCIDENTS.filter(inc => {
        const matchSearch = search === "" || inc.id.toLowerCase().includes(search.toLowerCase());
        const matchJockey = jockey === "All Jockeys" || inc.offender === jockey;
        const matchStatus = statusFilter === "All Statuses" || inc.status === statusFilter;
        return matchSearch && matchJockey && matchStatus;
    });

    const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[13px] text-gray-300 placeholder-gray-600 outline-none focus:border-white/25 focus:bg-white/8 transition-all";
    const selectCls = "bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[13px] text-gray-300 outline-none focus:border-white/25 transition-all appearance-none cursor-pointer w-full";

    return (
        <div className="min-h-screen bg-[#0f0f0f]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="max-w-5xl mx-auto px-5 py-8">

                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-[26px] font-bold text-white tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                            Violation Management
                        </h1>
                        <p className="text-[13px] text-gray-500 mt-0.5">Review and record referee identified infractions.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-700 text-white text-[13px] font-bold uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-900/40 transition-all duration-150"
                    >
                        <AlertCircle size={14} /> Record Incident
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-[#1a1a1a] rounded-xl border border-white/8 px-5 py-4 mb-5">
                    <div className="flex flex-wrap gap-3 items-end">

                        {/* Search */}
                        <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Race ID</label>
                            <div className="relative flex items-center">
                                <Search size={13} className="absolute left-3 text-gray-600 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search by ID..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className={`${inputCls} pl-8`}
                                />
                            </div>
                        </div>

                        {/* Jockey filter */}
                        <div className="flex flex-col gap-1.5 min-w-[160px]">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Jockey</label>
                            <select value={jockey} onChange={e => setJockey(e.target.value)} className={selectCls}>
                                {JOCKEYS.map(j => <option key={j} className="bg-[#1a1a1a]">{j}</option>)}
                            </select>
                        </div>

                        {/* Status filter */}
                        <div className="flex flex-col gap-1.5 min-w-[160px]">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Status</label>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectCls}>
                                <option className="bg-[#1a1a1a]">All Statuses</option>
                                {STATUSES.map(s => <option key={s} className="bg-[#1a1a1a]">{s}</option>)}
                            </select>
                        </div>

                        {/* Clear */}
                        <button
                            onClick={() => { setSearch(""); setJockey("All Jockeys"); setStatusFilter("All Statuses"); }}
                            className="px-4 py-2 rounded-lg border border-white/10 text-[13px] font-semibold text-gray-500 hover:border-white/20 hover:text-gray-300 transition-all duration-150 self-end"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">

                    {/* Table head */}
                    <div className="grid grid-cols-[110px_170px_180px_160px_1fr_140px_80px] gap-0 border-b border-white/8 px-5 py-2.5">
                        {["Incident ID", "Timestamp", "Race", "Offender", "Violation Type", "Status", "Actions"].map(col => (
                            <span key={col} className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{col}</span>
                        ))}
                    </div>

                    {/* Rows */}
                    {filtered.length === 0 ? (
                        <div className="px-5 py-12 text-center text-[13px] text-gray-600">No incidents match your filters.</div>
                    ) : (
                        filtered.map((inc, i) => (
                            <div
                                key={inc.id}
                                className={[
                                    "grid grid-cols-[110px_170px_180px_160px_1fr_140px_80px] gap-0 px-5 py-3.5 items-center transition-colors duration-150 hover:bg-white/[0.02]",
                                    i !== filtered.length - 1 ? "border-b border-white/5" : "",
                                ].join(" ")}
                            >
                                <span className="text-[13px] font-bold text-white">{inc.id}</span>
                                <span className="text-[12px] text-gray-500 font-mono">{inc.timestamp}</span>
                                <div className="flex items-center gap-1.5">
                                    <Flag size={12} className="text-red-600 shrink-0" />
                                    <span className="text-[13px] text-gray-300 font-medium">
                                        {inc.race} <span className="text-gray-600 font-normal">({inc.raceLabel})</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <User size={12} className="text-gray-600 shrink-0" />
                                    <span className="text-[13px] text-gray-300">{inc.offender}</span>
                                </div>
                                <span className="text-[13px] text-gray-300">{inc.violationType}</span>
                                <div><StatusBadge status={inc.status} /></div>
                                <div className="flex items-center gap-2">
                                    <button className="text-[12px] font-semibold text-red-500 hover:text-red-400 transition-colors">Edit</button>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-5 py-3 border-t border-white/8">
                        <span className="text-[12px] text-gray-600">Showing 1 to {filtered.length} of 124 incidents</span>
                        <div className="flex items-center gap-1">
                            <button className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300 transition-all">
                                <ChevronLeft size={13} />
                            </button>
                            <button className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300 transition-all">
                                <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Record Incident Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-[#1a1a1a] rounded-xl border border-white/10 w-full max-w-md p-6 shadow-2xl">
                        <h2 className="text-[20px] font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
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
                                    <label className="text-[12px] font-semibold text-gray-400">{label}</label>
                                    <input type="text" placeholder={placeholder} className={inputCls} />
                                </div>
                            ))}

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[12px] font-semibold text-gray-400">Status</label>
                                <select className={selectCls}>
                                    {STATUSES.map(s => <option key={s} className="bg-[#1a1a1a]">{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-2.5 rounded-xl border border-white/10 text-[13px] font-semibold text-gray-500 hover:border-white/20 hover:text-gray-300 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-2.5 rounded-xl bg-red-700 text-white text-[13px] font-bold uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-900/40 transition-all"
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