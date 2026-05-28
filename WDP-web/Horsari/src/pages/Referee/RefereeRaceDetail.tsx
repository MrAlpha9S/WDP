import { useState } from "react";
import {
    Camera,
    CheckCircle2,
    ChevronRight,
    Flag,
    RefreshCw,
    Shield,
    ShieldAlert,
    Trophy,
    Zap,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type VerificationStatus = "cleared" | "review" | "pending";

interface HorseEntry {
    number: number;
    name: string;
    jockey: string;
    status: VerificationStatus;
}

interface IncidentType {
    id: string;
    label: string;
    icon: React.ReactNode;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const RACE = {
    number: 7,
    title: "The Pegasus Cup",
    track: "Dirt",
    condition: "Fast",
    distance: "1 1/8 Miles",
    pace: "23.4s",
    position: "4F",
    leader: "#4 Thunderstrike",
    officialTime: "01:48.23",
};

const HORSES: HorseEntry[] = [
    { number: 1, name: "Midnight Eclipse", jockey: "J: J. Rosario", status: "cleared" },
    { number: 2, name: "Stormbringer", jockey: "J: L. Ortiz Jr.", status: "cleared" },
    { number: 3, name: "Golden Horizon", jockey: "J: F. Prat", status: "cleared" },
    { number: 4, name: "Thunderstrike", jockey: "Gear Check Flag", status: "review" },
];

const INCIDENTS: IncidentType[] = [
    { id: "lane", label: "Lane Cutting", icon: <RefreshCw size={18} /> },
    { id: "whip", label: "Whip Misuse", icon: <Zap size={18} /> },
    { id: "interfere", label: "Interference", icon: <ShieldAlert size={18} /> },
    { id: "custom", label: "Custom Flag", icon: <Flag size={18} /> },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function HorseRow({ horse }: { horse: HorseEntry }) {
    const isReview = horse.status === "review";
    return (
        <div className={[
            "rounded-xl border transition-all duration-200",
            isReview ? "border-red-800/60 bg-red-500/5" : "border-white/8 bg-white/[0.03] hover:bg-white/[0.05]",
        ].join(" ")}>
            <div className="px-4 py-3 flex items-center gap-3">
                <span className={[
                    "w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0",
                    isReview ? "bg-red-700 text-white" : "bg-white/8 text-gray-400",
                ].join(" ")}>
                    {horse.number}
                </span>
                <div className="flex-1 min-w-0">
                    <p className={["text-[14px] font-semibold leading-snug", isReview ? "text-red-400" : "text-white"].join(" ")}>
                        {horse.name}
                    </p>
                    <p className={["text-[12px] mt-0.5", isReview ? "text-red-600" : "text-gray-500"].join(" ")}>
                        {horse.jockey}
                    </p>
                </div>
                {isReview ? (
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border border-red-800/60 text-red-400 bg-red-500/10">
                        Review
                    </span>
                ) : (
                    <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                )}
            </div>
        </div>
    );
}

function IncidentButton({ incident }: { incident: IncidentType }) {
    const [active, setActive] = useState(false);
    return (
        <button
            type="button"
            onClick={() => setActive((p) => !p)}
            className={[
                "group flex flex-col items-center justify-center gap-2 py-4 rounded-xl border text-center transition-all duration-200 cursor-pointer select-none",
                active
                    ? "border-red-700 bg-red-500/10 text-red-400"
                    : "border-white/8 bg-white/[0.03] text-gray-500 hover:border-white/15 hover:bg-white/[0.06] hover:text-gray-300",
            ].join(" ")}
        >
            <span className={active ? "text-red-400" : "text-gray-600 group-hover:text-gray-400"}>
                {incident.icon}
            </span>
            <span className="text-[12px] font-semibold leading-tight">{incident.label}</span>
        </button>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RaceMonitorPage() {
    const cleared = HORSES.filter((h) => h.status === "cleared").length;
    const total = HORSES.length;

    return (
        <div className="min-h-screen bg-[#0f0f0f]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="max-w-5xl mx-auto px-5 py-8">

                {/* ── Live badge + title row ── */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[11px] font-bold uppercase tracking-widest text-red-500">
                            Live Monitoring
                        </span>
                    </div>
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h1
                                className="text-[28px] font-bold text-white leading-tight tracking-tight"
                                style={{ fontFamily: "'Playfair Display', serif" }}
                            >
                                Race {RACE.number}: {RACE.title}
                            </h1>
                            <p className="text-[13px] text-gray-500 mt-0.5">
                                Track: {RACE.track}, {RACE.condition} &nbsp;·&nbsp; Distance: {RACE.distance}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-gray-400 text-[13px] font-medium hover:border-white/20 hover:text-gray-200 transition-all">
                                <RefreshCw size={13} className="text-red-500" />
                                Previous Race
                            </button>
                            <div className="bg-[#1a1a1a] border border-white/8 rounded-xl px-5 py-2 text-right">
                                <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">Official Time</p>
                                <p
                                    className="text-[22px] font-black text-red-500 tracking-tight leading-tight"
                                    style={{ fontFamily: "'Playfair Display', serif" }}
                                >
                                    {RACE.officialTime}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Main two-column layout ── */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">

                    {/* LEFT — Camera + Incident Log */}
                    <div className="flex flex-col gap-5">

                        {/* Camera feed */}
                        <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
                                <div className="flex items-center gap-2 text-gray-500 text-[12px] font-semibold uppercase tracking-wider">
                                    <Camera size={13} className="text-red-500" />
                                    Camera 1: Panning Main
                                </div>
                                <button className="flex items-center gap-1 text-[13px] text-red-500 font-medium hover:text-red-400 transition-colors">
                                    Fullscreen <ChevronRight size={14} />
                                </button>
                            </div>
                            <div className="relative mx-4 my-4 rounded-xl overflow-hidden aspect-video bg-black">
                                <img
                                    src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"
                                    alt="Race feed"
                                    className="w-full h-full object-cover opacity-90"
                                />
                                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-700/90 backdrop-blur px-2.5 py-1 rounded-lg">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">Live</span>
                                </div>
                                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur px-4 py-2 rounded-xl border border-white/10 flex items-center gap-4">
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Pace</p>
                                        <p className="text-[13px] font-bold text-white">{RACE.pace} / {RACE.position}</p>
                                    </div>
                                    <div className="w-px h-7 bg-white/10" />
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Leader</p>
                                        <p className="text-[13px] font-bold text-red-400">{RACE.leader}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Rapid Incident Log */}
                        <div className="bg-[#1a1a1a] rounded-xl border border-white/8 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2
                                    className="text-[18px] font-bold text-white tracking-tight"
                                    style={{ fontFamily: "'Playfair Display', serif" }}
                                >
                                    Rapid Incident Log
                                </h2>
                                <button className="flex items-center gap-1 text-[13px] text-red-500 font-medium hover:text-red-400 transition-colors">
                                    View all <ChevronRight size={14} />
                                </button>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                                {INCIDENTS.map((inc) => (
                                    <IncidentButton key={inc.id} incident={inc} />
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT — Verification + Post-Race */}
                    <div className="flex flex-col gap-5">

                        {/* Verification List */}
                        <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                                <h2 className="text-[12px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                    <Shield size={13} className="text-red-500" />
                                    Verification List
                                </h2>
                                <span className="text-[11px] font-bold text-green-400 bg-green-500/10 border border-green-700/60 px-2.5 py-0.5 rounded-full">
                                    {cleared}/{total} Cleared
                                </span>
                            </div>
                            <div className="p-3 flex flex-col gap-2">
                                {HORSES.map((horse) => (
                                    <HorseRow key={horse.number} horse={horse} />
                                ))}
                            </div>
                        </div>

                        {/* Post-Race Actions */}
                        <div className="bg-[#1a1a1a] rounded-xl border border-white/8 p-4">
                            <h2 className="text-[10.5px] font-bold uppercase tracking-widest text-gray-600 mb-3">
                                Post-Race Actions
                            </h2>
                            <div className="flex flex-col gap-2.5">
                                <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-gray-400 text-[13px] font-semibold hover:border-white/20 hover:text-gray-200 transition-all duration-150">
                                    <Camera size={14} />
                                    Review Finish Photo
                                </button>
                                <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-700 text-white text-[13px] font-bold uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-900/40 transition-all duration-150">
                                    <Trophy size={14} />
                                    Publish Official Results
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            {/* Footer */}
            <footer className="border-t border-white/8 py-4 mt-8">
                <div className="max-w-5xl mx-auto px-5 flex items-center justify-between text-[12px] text-gray-600">
                    <span>© 2024 Equine Elite Management System</span>
                    <div className="flex items-center gap-4">
                        <a href="#" className="hover:text-gray-400 transition-colors">Help/Support</a>
                        <a href="#" className="hover:text-gray-400 transition-colors">Settings</a>
                        <a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
                    </div>
                    <span
                        className="font-black uppercase tracking-widest text-gray-500 text-[11px]"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        Equine Elite
                    </span>
                </div>
            </footer>
        </div>
    );
}