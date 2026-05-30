import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { RACE, PHASE_CONFIG } from "./data/RaceData";
import type { RacePhase } from "./types/RaceTypes";
import PreRacePage from "./Preracepage";
import LivePage from "./LivePage.tsx";
import PostRacePage from "./Postracepage.tsx";

// ── Shared header ─────────────────────────────────────────────────────────────

function PageHeader({ phase, onBack }: { phase: RacePhase; onBack: () => void }) {
    const cfg = PHASE_CONFIG[phase];
    return (
        <div className="mb-6">
            <button onClick={onBack} className="flex items-center gap-2 text-[13px] text-gray-500 font-medium hover:text-gray-200 transition-colors mb-5 group">
                <ArrowLeft size={14} className="transition-transform duration-150 group-hover:-translate-x-0.5" />
                Back to Tournaments
            </button>
            <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${cfg.dot} ${"pulse" in cfg ? "animate-pulse" : ""}`} />
                <span className={`text-[11px] font-bold uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-[26px] font-bold text-white leading-tight tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Race {RACE.number}: {RACE.title}
                    </h1>
                    <p className="text-[13px] text-gray-500 mt-0.5">
                        {RACE.venue} &nbsp;·&nbsp; {RACE.track}, {RACE.condition} &nbsp;·&nbsp; {RACE.distance} &nbsp;·&nbsp; {RACE.grade}
                    </p>
                </div>
                {/* <div className={`${cfg.bg} border ${cfg.border} rounded-xl px-4 py-2 text-right`}>
                    <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">
                        {phase === "pre" ? "Post Time" : phase === "live" ? "Elapsed" : "Official Time"}
                    </p>
                    <p className={`text-[20px] font-black tracking-tight leading-tight ${cfg.color}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                        {phase === "pre" ? RACE.scheduledTime : RACE.officialTime}
                    </p>
                </div> */}
            </div>
        </div>
    );
}

// ── Dev switcher ──────────────────────────────────────────────────────────────

function DevSwitcher({ phase, onChange }: { phase: RacePhase; onChange: (p: RacePhase) => void }) {
    return (
        <div className="fixed bottom-5 right-5 z-50 bg-[#111] border border-white/15 rounded-2xl px-4 py-3 shadow-2xl shadow-black/60 flex flex-col gap-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">Dev · Phase</p>
            <div className="flex gap-2">
                {(["pre", "live", "post"] as RacePhase[]).map(p => (
                    <button key={p} onClick={() => onChange(p)}
                        className={["px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all",
                            phase === p
                                ? p === "pre" ? "bg-yellow-600 text-white"
                                    : p === "live" ? "bg-red-700 text-white"
                                        : "bg-green-700 text-white"
                                : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300",
                        ].join(" ")}
                    >
                        {p === "pre" ? "Pre" : p === "live" ? "Live" : "Post"}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── Index (entry point) ───────────────────────────────────────────────────────

export default function RaceMonitorIndex() {
    const navigate = useNavigate();
    const [phase, setPhase] = useState<RacePhase>("live");

    return (
        <div className="min-h-screen bg-[#0f0f0f]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="max-w-5xl mx-auto px-5 py-8">
                <PageHeader phase={phase} onBack={() => navigate("/referee/tournaments")} />
                {phase === "pre" && <PreRacePage />}
                {phase === "live" && <LivePage />}
                {phase === "post" && <PostRacePage />}
            </div>

            <footer className="border-t border-white/8 py-4 mt-8">
                <div className="max-w-5xl mx-auto px-5 flex items-center justify-between text-[12px] text-gray-600">
                    <span>© 2024 Equine Elite Management System</span>
                    <div className="flex items-center gap-4">
                        <a href="#" className="hover:text-gray-400 transition-colors">Help/Support</a>
                        <a href="#" className="hover:text-gray-400 transition-colors">Settings</a>
                        <a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
                    </div>
                    <span className="font-black uppercase tracking-widest text-gray-500 text-[11px]" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Equine Elite
                    </span>
                </div>
            </footer>

            <DevSwitcher phase={phase} onChange={setPhase} />
        </div>
    );
}