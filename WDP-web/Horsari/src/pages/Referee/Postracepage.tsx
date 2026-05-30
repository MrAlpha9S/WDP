import { useState } from "react";
import { AlertTriangle, Camera, ChevronLeft, ChevronRight, Flag, Medal, Play, Pause, SkipBack, SkipForward, Trophy, Video } from "lucide-react";
import { RACE, HORSES, LOGGED_INCIDENTS, ordinal } from "./types/RaceData";

// ── Race video clips ──────────────────────────────────────────────────────────

const RACE_CLIPS = [
    { id: 1, label: "Main Broadcast", timestamp: "0:00 – 1:48", src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80", duration: "1:48" },
    { id: 2, label: "Head-On View", timestamp: "0:00 – 1:48", src: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=900&q=80", duration: "1:48" },
    { id: 3, label: "Drone Cam", timestamp: "0:00 – 1:48", src: "https://images.unsplash.com/photo-1566033117334-c8a4f80c8df4?w=900&q=80", duration: "1:48" },
    { id: 4, label: "Finish Line Cam", timestamp: "1:42 – 1:50", src: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=900&q=80", duration: "0:08" },
    { id: 5, label: "Jockey Cam #1", timestamp: "0:00 – 1:48", src: "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=900&q=80", duration: "1:48" },
];

function VideoReviewPanel() {
    const [activeClip, setActiveClip] = useState(RACE_CLIPS[0]);
    const [playing, setPlaying] = useState(false);
    const activeIdx = RACE_CLIPS.findIndex(c => c.id === activeClip.id);

    return (
        <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
                <h2 className="text-[13px] font-bold text-white flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    <Video size={14} className="text-blue-400" /> Race Video Review
                </h2>
                <span className="text-[11px] text-gray-600 font-medium">{RACE_CLIPS.length} clips</span>
            </div>

            {/* Video player */}
            <div className="relative mx-4 mt-4 rounded-xl overflow-hidden aspect-video bg-black">
                <img src={activeClip.src} alt={activeClip.label} className="w-full h-full object-cover opacity-80 transition-all duration-300" />

                {/* Clip label overlay */}
                <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    <Video size={10} className="text-blue-400" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">{activeClip.label}</span>
                </div>

                {/* Duration badge */}
                <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur px-2 py-0.5 rounded-lg">
                    <span className="text-[10px] font-mono text-gray-300">{activeClip.duration}</span>
                </div>

                {/* Timestamp */}
                <div className="absolute bottom-2.5 left-2.5 bg-black/70 backdrop-blur px-2.5 py-1 rounded-lg">
                    <span className="text-[10px] text-gray-400 font-mono">{activeClip.timestamp}</span>
                </div>

                {/* Play/pause overlay */}
                <button
                    onClick={() => setPlaying(p => !p)}
                    className="absolute inset-0 flex items-center justify-center group"
                >
                    <div className={["w-12 h-12 rounded-full flex items-center justify-center transition-all duration-150 backdrop-blur",
                        playing ? "bg-white/10 opacity-0 group-hover:opacity-100" : "bg-black/60 group-hover:bg-black/80",
                    ].join(" ")}>
                        {playing
                            ? <Pause size={20} className="text-white" />
                            : <Play size={20} className="text-white ml-0.5" />
                        }
                    </div>
                </button>
            </div>

            {/* Playback controls */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/6">
                <div className="flex items-center gap-1">
                    <button onClick={() => setActiveClip(RACE_CLIPS[Math.max(0, activeIdx - 1)])}
                        disabled={activeIdx === 0}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/8 disabled:opacity-30 transition-all">
                        <SkipBack size={13} />
                    </button>
                    <button onClick={() => setPlaying(p => !p)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/8 text-white hover:bg-white/12 transition-all">
                        {playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                    </button>
                    <button onClick={() => setActiveClip(RACE_CLIPS[Math.min(RACE_CLIPS.length - 1, activeIdx + 1)])}
                        disabled={activeIdx === RACE_CLIPS.length - 1}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/8 disabled:opacity-30 transition-all">
                        <SkipForward size={13} />
                    </button>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                    <span>{activeIdx + 1}</span><span>/</span><span>{RACE_CLIPS.length}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setActiveClip(RACE_CLIPS[Math.max(0, activeIdx - 1)])}
                        className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-0.5">
                        <ChevronLeft size={11} /> Prev
                    </button>
                    <span className="text-gray-700 mx-1">·</span>
                    <button onClick={() => setActiveClip(RACE_CLIPS[Math.min(RACE_CLIPS.length - 1, activeIdx + 1)])}
                        className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-0.5">
                        Next <ChevronRight size={11} />
                    </button>
                </div>
            </div>

            {/* Clip list */}
            <div className="p-3 flex flex-col gap-1.5">
                {RACE_CLIPS.map((clip, i) => (
                    <button key={clip.id} onClick={() => { setActiveClip(clip); setPlaying(false); }}
                        className={["w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                            activeClip.id === clip.id
                                ? "bg-blue-500/10 border border-blue-700/40"
                                : "bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10",
                        ].join(" ")}
                    >
                        <div className={["w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold",
                            activeClip.id === clip.id ? "bg-blue-600 text-white" : "bg-white/8 text-gray-500"].join(" ")}>
                            {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={["text-[12px] font-semibold truncate",
                                activeClip.id === clip.id ? "text-blue-300" : "text-white"].join(" ")}>
                                {clip.label}
                            </p>
                            <p className="text-[10.5px] text-gray-600 mt-0.5">{clip.timestamp}</p>
                        </div>
                        <span className="text-[10px] font-mono text-gray-600 shrink-0">{clip.duration}</span>
                        {activeClip.id === clip.id && playing && (
                            <span className="flex items-center gap-0.5 shrink-0">
                                {[0, 1, 2].map(b => (
                                    <span key={b} className="w-0.5 bg-blue-400 rounded-full animate-pulse"
                                        style={{ height: 8 + b * 4, animationDelay: `${b * 0.15}s` }} />
                                ))}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function PostRacePage() {
    const [objectionResolved, setObjectionResolved] = useState(false);
    const [published, setPublished] = useState(false);
    const sorted = [...HORSES].sort((a, b) => (a.finishPosition ?? 9) - (b.finishPosition ?? 9));
    const hasObjection = sorted.some(h => h.objection) && !objectionResolved;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
            <div className="flex flex-col gap-5">

                {/* Finish order */}
                <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
                        <h2 className="text-[13px] font-bold text-white flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                            <Medal size={14} className="text-yellow-500" /> Official Finish Order
                        </h2>
                        {hasObjection && (
                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-700/50 px-2.5 py-1 rounded-full animate-pulse">
                                <AlertTriangle size={10} /> Objection Filed
                            </span>
                        )}
                    </div>
                    <div className="p-3 flex flex-col gap-2">
                        {sorted.map(horse => {
                            const pos = horse.finishPosition ?? 0;
                            const posColor = pos === 1 ? "text-yellow-400" : pos === 2 ? "text-gray-300" : pos === 3 ? "text-amber-500" : "text-gray-600";
                            const posBg = pos === 1 ? "bg-yellow-600" : pos === 2 ? "bg-gray-500" : pos === 3 ? "bg-amber-700" : "bg-white/8";
                            return (
                                <div key={horse.number} className={["rounded-xl border px-4 py-3 flex items-center gap-3",
                                    horse.objection && !objectionResolved ? "border-red-800/60 bg-red-500/5"
                                        : pos <= 3 ? "border-white/10 bg-white/[0.03]"
                                            : "border-white/6 bg-white/[0.02]"].join(" ")}
                                >
                                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-black shrink-0 text-white ${posBg}`}>{pos}</span>
                                    <span className="w-6 h-6 rounded-full bg-white/8 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">{horse.number}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={["text-[13.5px] font-bold",
                                            horse.objection && !objectionResolved ? "text-red-400" : pos <= 3 ? "text-white" : "text-gray-400"].join(" ")}>
                                            {horse.name}
                                        </p>
                                        <p className="text-[11.5px] text-gray-500 mt-0.5">{horse.jockey}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`text-[13px] font-bold font-mono ${posColor}`}>{horse.finishTime}</p>
                                        <p className={`text-[10px] font-bold uppercase mt-0.5 ${posColor}`}>{ordinal(pos)}</p>
                                    </div>
                                    {horse.objection && !objectionResolved && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-700/40 px-2 py-0.5 rounded-full ml-1 shrink-0">
                                            <Flag size={9} /> Objection
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Video review */}
                <VideoReviewPanel />

                {/* Incident review */}
                <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-white/8">
                        <h2 className="text-[13px] font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Incident Review</h2>
                    </div>
                    <div className="p-3 flex flex-col gap-2">
                        {LOGGED_INCIDENTS.map(inc => (
                            <div key={inc.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/6">
                                <AlertTriangle size={13} className="text-red-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-semibold text-white">{inc.label}</p>
                                    <p className="text-[11.5px] text-gray-500 mt-0.5">{inc.horse} &nbsp;·&nbsp; at {inc.time}</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-green-700/50 text-green-400 bg-green-500/10 hover:bg-green-500/20 transition-all">Dismiss</button>
                                    <button className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-red-700/50 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all">Penalize</button>
                                </div>
                            </div>
                        ))}
                        {LOGGED_INCIDENTS.length === 0 && (
                            <p className="text-[12.5px] text-gray-600 text-center py-4">No incidents recorded</p>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT */}
            <div className="flex flex-col gap-5">

                {/* Finish photo */}
                <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/8">
                        <h2 className="text-[12px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                            <Camera size={13} className="text-green-500" /> Finish Photo
                        </h2>
                    </div>
                    <div className="relative m-3 rounded-xl overflow-hidden aspect-video bg-black">
                        <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" alt="Finish" className="w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[11px] font-bold text-white uppercase tracking-wider bg-black/60 px-3 py-1 rounded-lg">Photo Finish</span>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-[#1a1a1a] rounded-xl border border-white/8 p-4">
                    <h2 className="text-[10.5px] font-bold uppercase tracking-widest text-gray-600 mb-3">Race Summary</h2>
                    {[
                        { label: "Winner", value: "Thunderstrike" },
                        { label: "Time", value: RACE.officialTime },
                        { label: "Incidents", value: `${LOGGED_INCIDENTS.length}` },
                        { label: "Objections", value: objectionResolved ? "1 (resolved)" : "1 (pending)" },
                    ].map(item => (
                        <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                            <span className="text-[12px] text-gray-500">{item.label}</span>
                            <span className="text-[12px] font-semibold text-white">{item.value}</span>
                        </div>
                    ))}
                </div>

                {/* Publish */}
                <div className="flex flex-col gap-2.5">
                    <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-gray-400 text-[13px] font-semibold hover:border-white/20 hover:text-gray-200 transition-all duration-150">
                        <Camera size={14} /> Review Finish Photo
                    </button>
                    <button
                        onClick={() => !hasObjection && setPublished(true)}
                        className={["w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold uppercase tracking-widest transition-all duration-150",
                            published ? "bg-green-700 text-white cursor-default"
                                : hasObjection ? "bg-white/5 border border-white/8 text-gray-600 cursor-not-allowed"
                                    : "bg-green-700 text-white hover:bg-green-600 shadow-lg shadow-green-900/30",
                        ].join(" ")}
                    >
                        <Trophy size={14} />
                        {published ? "Results Published ✓" : hasObjection ? "Awaiting Objection" : "Publish Official Results"}
                    </button>
                </div>
            </div>
        </div>
    );
}