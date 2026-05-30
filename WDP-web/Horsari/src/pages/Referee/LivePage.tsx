import { useState } from "react";
import {
    AlertTriangle, Camera, CheckCircle2, ChevronDown, ChevronRight,
    Flag, RefreshCw, Shield, ShieldAlert, Trophy, Zap,
} from "lucide-react";
import { RACE, HORSES, LOGGED_INCIDENTS, HORSE_COLORS, HORSE_PROGRESS, CAMERAS } from "./data/RaceData";
import type { IncidentType } from "./types/RaceTypes";

// ── Incident data (with icons) ────────────────────────────────────────────────

const INCIDENTS: IncidentType[] = [
    { id: "lane", label: "Lane Cutting", icon: <RefreshCw size={16} /> },
    { id: "whip", label: "Whip Misuse", icon: <Zap size={16} /> },
    { id: "interfere", label: "Interference", icon: <ShieldAlert size={16} /> },
    { id: "custom", label: "Custom Flag", icon: <Flag size={16} /> },
];

// ── Incident button ───────────────────────────────────────────────────────────

function IncidentButton({ incident }: { incident: IncidentType }) {
    const [active, setActive] = useState(false);
    return (
        <button type="button" onClick={() => setActive(p => !p)}
            className={["group flex flex-col items-center justify-center gap-2 py-4 rounded-xl border text-center transition-all duration-200 cursor-pointer select-none",
                active ? "border-red-700 bg-red-500/10 text-red-400" : "border-white/8 bg-white/[0.03] text-gray-500 hover:border-white/15 hover:bg-white/[0.06] hover:text-gray-300",
            ].join(" ")}
        >
            <span className={active ? "text-red-400" : "text-gray-600 group-hover:text-gray-400"}>{incident.icon}</span>
            <span className="text-[12px] font-semibold leading-tight">{incident.label}</span>
        </button>
    );
}

// ── Position track ────────────────────────────────────────────────────────────

function PositionTrack({ showOnStream }: { showOnStream: boolean }) {
    return (
        <div className="bg-[#0f0f0f] rounded-xl border border-white/8 p-4">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-500">Track Position</h2>
                <div className="flex items-center gap-2">
                    {showOnStream && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-700/40 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" /> On Stream
                        </span>
                    )}
                    <span className="text-[10px] text-gray-600 font-mono">{RACE.pace} · {RACE.position}</span>
                </div>
            </div>
            <div className="relative h-10 bg-white/[0.03] rounded-full border border-white/6 overflow-visible mx-2">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase tracking-widest text-gray-700">Start</div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase tracking-widest text-gray-700">Finish</div>
                {HORSES.map(horse => {
                    const pct = HORSE_PROGRESS[horse.number] ?? 50;
                    const color = HORSE_COLORS[horse.number] ?? "#6b7280";
                    const isLeader = horse.position === 1;
                    const hasFlag = horse.gearStatus === "review";
                    return (
                        <div key={horse.number}
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5"
                            style={{ left: `${pct}%` }}
                        >
                            {hasFlag && <span className="text-[8px] text-red-400 font-black leading-none">⚑</span>}
                            <div className="flex items-center justify-center text-[10px] font-black text-white shadow-lg transition-all duration-500"
                                style={{
                                    width: isLeader ? 26 : 22, height: isLeader ? 26 : 22,
                                    borderRadius: "50%", background: color,
                                    boxShadow: isLeader ? `0 0 10px ${color}80` : undefined,
                                    border: hasFlag ? "2px solid #ef4444" : `2px solid ${color}60`,
                                }}
                            >{horse.number}</div>
                            {isLeader && <span className="text-[7px] font-black text-yellow-400 leading-none">▲</span>}
                        </div>
                    );
                })}
            </div>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
                {[...HORSES].sort((a, b) => (a.position ?? 9) - (b.position ?? 9)).map(h => (
                    <div key={h.number} className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: HORSE_COLORS[h.number] }} />
                        <span className="text-[10px] text-gray-500">{h.name.split(" ")[0]}</span>
                        {h.position === 1 && <span className="text-[9px] text-yellow-400 font-black">1st</span>}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LivePage() {
    const cleared = HORSES.filter(h => h.gearStatus === "cleared").length;
    const hasReview = HORSES.some(h => h.gearStatus === "review");
    const [verificationOpen, setVerificationOpen] = useState(false);
    const [activeCam, setActiveCam] = useState(1);
    const [showTrackOnStream, setShowTrackOnStream] = useState(false);
    const cam = CAMERAS.find(c => c.id === activeCam)!;

    return (
        <div className="flex flex-col gap-4">

            {/* Row 1: Camera + Incident Log */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">

                {/* Camera */}
                <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8">
                        <div className="flex items-center gap-2 flex-wrap">
                            {CAMERAS.map(c => (
                                <button key={c.id} onClick={() => setActiveCam(c.id)}
                                    className={["flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all",
                                        activeCam === c.id ? "bg-red-700 text-white" : "text-gray-500 bg-white/5 hover:bg-white/10 hover:text-gray-300",
                                    ].join(" ")}
                                >
                                    <Camera size={10} />
                                    CAM {c.id}
                                    {activeCam === c.id && <span className="text-[9px] text-red-200 font-medium hidden sm:inline">· {c.label}</span>}
                                </button>
                            ))}
                        </div>
                        <button className="flex items-center gap-1 text-[11px] text-gray-500 font-medium hover:text-gray-200 transition-colors shrink-0">
                            Fullscreen <ChevronRight size={12} />
                        </button>
                    </div>

                    <div className="relative mx-3 mt-3 mb-3 rounded-xl overflow-hidden aspect-video bg-black">
                        <img src={cam.src} alt="Race feed" className="w-full h-full object-cover opacity-90 transition-all duration-300" />

                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-red-700/90 backdrop-blur px-2 py-1 rounded-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live · {cam.label}</span>
                        </div>

                        <div className="absolute bottom-2.5 left-2.5 bg-black/70 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-3">
                            <div>
                                <p className="text-[8px] text-gray-400 uppercase tracking-wider font-medium">Pace</p>
                                <p className="text-[11px] font-bold text-white">{RACE.pace} / {RACE.position}</p>
                            </div>
                            <div className="w-px h-5 bg-white/10" />
                            <div>
                                <p className="text-[8px] text-gray-400 uppercase tracking-wider font-medium">Leader</p>
                                <p className="text-[11px] font-bold text-red-400">{RACE.leader}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowTrackOnStream(v => !v)}
                            className={["absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all",
                                showTrackOnStream ? "bg-yellow-600 text-white" : "bg-black/60 text-gray-400 border border-white/15 hover:border-white/30 hover:text-white",
                            ].join(" ")}
                        >
                            ⊙ Track
                        </button>

                        {showTrackOnStream && (
                            <div className="absolute bottom-10 left-2.5 right-2.5 bg-black/75 backdrop-blur rounded-xl px-3 py-2 border border-white/10">
                                <div className="relative h-7 bg-white/[0.06] rounded-full overflow-visible">
                                    <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[7px] font-black uppercase tracking-widest text-gray-600">S</div>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[7px] font-black uppercase tracking-widest text-gray-600">F</div>
                                    {HORSES.map(horse => {
                                        const pct = HORSE_PROGRESS[horse.number] ?? 50;
                                        const color = HORSE_COLORS[horse.number] ?? "#6b7280";
                                        const isLeader = horse.position === 1;
                                        return (
                                            <div key={horse.number} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2" style={{ left: `${pct}%` }}>
                                                <div className="flex items-center justify-center text-[9px] font-black text-white"
                                                    style={{
                                                        width: isLeader ? 22 : 18, height: isLeader ? 22 : 18,
                                                        borderRadius: "50%", background: color,
                                                        boxShadow: isLeader ? `0 0 8px ${color}` : undefined,
                                                    }}
                                                >{horse.number}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Incident log */}
                <div className="bg-[#1a1a1a] rounded-xl border border-white/8 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0">
                        <h2 className="text-[13px] font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Incident Log</h2>
                        <span className="text-[11px] text-gray-600 font-medium">{LOGGED_INCIDENTS.length} logged</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 p-3  border-white/6 shrink-0">
                        {INCIDENTS.map(inc => <IncidentButton key={inc.id} incident={inc} />)}
                    </div>
                    {/* <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1.5 min-h-0">
                        {LOGGED_INCIDENTS.length === 0 && (
                            <p className="text-[12px] text-gray-600 text-center py-6">No incidents logged</p>
                        )}
                        {LOGGED_INCIDENTS.map(inc => (
                            <div key={inc.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-red-500/5 border border-red-800/30">
                                <AlertTriangle size={11} className="text-red-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-semibold text-red-400 truncate">{inc.label}</p>
                                    <p className="text-[10.5px] text-gray-600 mt-0.5">{inc.horse}</p>
                                </div>
                                <span className="text-[10px] text-gray-600 font-mono shrink-0">{inc.time}</span>
                            </div>
                        ))}
                    </div> */}
                </div>
            </div>

            {/* Row 2: Position track */}
            <PositionTrack showOnStream={showTrackOnStream} />

            {/* Row 3: Stats + Actions + Verification */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_300px] gap-4">

                <div className="bg-[#1a1a1a] rounded-xl border border-white/8 p-4">
                    <h2 className="text-[10.5px] font-bold uppercase tracking-widest text-gray-600 mb-3">Race Stats</h2>
                    {[
                        { label: "Elapsed", value: RACE.officialTime },
                        { label: "Current Pace", value: `${RACE.pace} / ${RACE.position}` },
                        { label: "Leader", value: RACE.leader },
                        { label: "Incidents", value: `${LOGGED_INCIDENTS.length}` },
                    ].map(item => (
                        <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                            <span className="text-[12px] text-gray-500">{item.label}</span>
                            <span className="text-[12px] font-semibold text-white">{item.value}</span>
                        </div>
                    ))}
                </div>

                <div className="bg-[#1a1a1a] rounded-xl border border-white/8 p-4">
                    <h2 className="text-[10.5px] font-bold uppercase tracking-widest text-gray-600 mb-3">Actions</h2>
                    <div className="flex flex-col gap-2.5">
                        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-gray-400 text-[12px] font-semibold hover:border-white/20 hover:text-gray-200 transition-all">
                            <Camera size={13} /> Review Finish Photo
                        </button>
                        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-700 text-white text-[12px] font-bold uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-900/40 transition-all">
                            <Trophy size={13} /> Publish Results
                        </button>
                    </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
                    <button onClick={() => setVerificationOpen(o => !o)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
                    >
                        <h2 className="text-[12px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                            <Shield size={13} className="text-red-500" /> Verification
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className={["text-[11px] font-bold px-2.5 py-0.5 rounded-full border",
                                hasReview ? "text-red-400 bg-red-500/10 border-red-700/60" : "text-green-400 bg-green-500/10 border-green-700/60"].join(" ")}>
                                {cleared}/{HORSES.length} Cleared
                            </span>
                            <ChevronDown size={13} className={`text-gray-600 transition-transform duration-200 ${verificationOpen ? "rotate-180" : ""}`} />
                        </div>
                    </button>
                    {verificationOpen && (
                        <div className="p-3 flex flex-col gap-2 border-t border-white/8">
                            {HORSES.map(horse => {
                                const isReview = horse.gearStatus === "review";
                                return (
                                    <div key={horse.number} className={["rounded-xl border", isReview ? "border-red-800/60 bg-red-500/5" : "border-white/8 bg-white/[0.03]"].join(" ")}>
                                        <div className="px-3 py-2.5 flex items-center gap-2.5">
                                            <span className={["w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
                                                isReview ? "bg-red-700 text-white" : "bg-white/8 text-gray-400"].join(" ")}>
                                                {horse.number}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className={["text-[12.5px] font-semibold truncate", isReview ? "text-red-400" : "text-white"].join(" ")}>{horse.name}</p>
                                                <p className={["text-[11px]", isReview ? "text-red-600" : "text-gray-500"].join(" ")}>{horse.jockey}</p>
                                            </div>
                                            {isReview
                                                ? <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border border-red-800/60 text-red-400 bg-red-500/10">Review</span>
                                                : <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                                            }
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
