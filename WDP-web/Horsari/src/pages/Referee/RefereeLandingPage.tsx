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
        <div
            className={[
                "rounded-2xl bg-white border shadow-sm transition-shadow duration-200",
                isReview ? "border-red-200 shadow-red-100" : "border-gray-100 hover:shadow-md",
            ].join(" ")}
        >
            <div className="px-4 py-3 flex items-center gap-3">
                <span className={[
                    "w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0",
                    isReview ? "bg-red-800 text-white" : "bg-gray-100 text-gray-600",
                ].join(" ")}>
                    {horse.number}
                </span>
                <div className="flex-1 min-w-0">
                    <p className={["text-[14px] font-semibold leading-snug", isReview ? "text-red-900" : "text-gray-900"].join(" ")}>
                        {horse.name}
                    </p>
                    <p className={["text-[12px] mt-0.5", isReview ? "text-red-400" : "text-gray-500"].join(" ")}>
                        {horse.jockey}
                    </p>
                </div>
                {isReview ? (
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border border-red-300 text-red-700 bg-red-50">
                        Review
                    </span>
                ) : (
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
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
                "group flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border text-center transition-all duration-200 cursor-pointer select-none",
                active
                    ? "border-red-300 bg-red-50 text-red-800 shadow-sm"
                    : "border-gray-100 bg-white text-gray-500 shadow-sm hover:shadow-md hover:border-gray-200 hover:text-gray-700",
            ].join(" ")}
        >
            <span className={active ? "text-red-700" : "text-gray-400 group-hover:text-gray-600"}>
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

                    {/* ── Live badge + title row ── */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                            <span className="text-[11px] font-bold uppercase tracking-widest text-red-600">
                                Live Monitoring
                            </span>
                        </div>
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <h1
                                    className="text-[28px] font-semibold text-gray-900 leading-tight tracking-tight"
                                    style={{ fontFamily: "'Playfair Display', serif" }}
                                >
                                    Race {RACE.number}: {RACE.title}
                                </h1>
                                <p className="text-[13px] text-gray-500 mt-0.5">
                                    Track: {RACE.track}, {RACE.condition} &nbsp;·&nbsp; Distance: {RACE.distance}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white shadow-sm text-gray-600 text-[13px] font-medium hover:border-gray-300 hover:text-gray-800 transition-all">
                                    <RefreshCw size={13} className="text-red-700" />
                                    Previous Race
                                </button>
                                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl px-5 py-2 text-right">
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Official Time</p>
                                    <p className="text-[22px] font-black text-red-800 tracking-tight leading-tight">
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
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                                    <div className="flex items-center gap-2 text-gray-500 text-[12px] font-semibold uppercase tracking-wider">
                                        <Camera size={13} className="text-red-700" />
                                        Camera 1: Panning Main
                                    </div>
                                    <button className="flex items-center gap-1 text-[13px] text-red-800 font-medium hover:underline">
                                        Fullscreen <ChevronRight size={14} />
                                    </button>
                                </div>
                                <div className="relative mx-4 my-4 rounded-xl overflow-hidden aspect-video bg-gray-100">
                                    <img
                                        src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"
                                        alt="Race feed"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-800/90 backdrop-blur px-2.5 py-1 rounded-lg">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                        <span className="text-[11px] font-bold text-white uppercase tracking-wider">Live</span>
                                    </div>
                                    <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur px-4 py-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Pace</p>
                                            <p className="text-[13px] font-bold text-gray-900">{RACE.pace} / {RACE.position}</p>
                                        </div>
                                        <div className="w-px h-7 bg-gray-200" />
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Leader</p>
                                            <p className="text-[13px] font-bold text-red-800">{RACE.leader}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Rapid Incident Log */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h2
                                        className="text-xl font-semibold text-gray-900 tracking-tight"
                                        style={{ fontFamily: "'Playfair Display', serif" }}
                                    >
                                        Rapid Incident Log
                                    </h2>
                                    <button className="flex items-center gap-1 text-[13px] text-red-800 font-medium hover:underline">
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
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                    <h2
                                        className="text-[13px] font-bold uppercase tracking-wider text-gray-600 flex items-center gap-2"
                                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                                    >
                                        <Shield size={13} className="text-red-700" />
                                        Verification List
                                    </h2>
                                    <span className="text-[12px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
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
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                                <h2
                                    className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3"
                                >
                                    Post-Race Actions
                                </h2>
                                <div className="flex flex-col gap-2.5">
                                    <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-[13px] font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all duration-150">
                                        <Camera size={14} />
                                        Review Finish Photo
                                    </button>
                                    <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-800 text-white text-[13px] font-bold uppercase tracking-widest hover:bg-red-900 shadow-sm hover:shadow-md hover:shadow-red-900/25 transition-all duration-150">
                                        <Trophy size={14} />
                                        Publish Official Results
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-red-100 py-4 bg-[#fdf5f5]">
                <div className="max-w-5xl mx-auto px-5 flex items-center justify-between text-[12px] text-gray-400">
                    <span>© 2024 Equine Elite Management System</span>
                    <div className="flex items-center gap-4">
                        <a href="#" className="hover:text-gray-600 transition-colors">Help/Support</a>
                        <a href="#" className="hover:text-gray-600 transition-colors">Settings</a>
                        <a href="#" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
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