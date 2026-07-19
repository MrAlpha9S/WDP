import { useEffect, useRef, useState } from "react";
import MuxPlayer from "@mux/mux-player-react";
import { Camera, ChevronDown, ChevronRight, Loader2, ShieldAlert, Trophy } from "lucide-react";
import { CAMERAS, horseColor } from "../../shared/data/RaceData";
import { useRaceSocket } from "../../providers/useRaceSocket";
import type { LiveHorse } from "../../providers/useRaceSocket";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatElapsed(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
}

function rankSuffix(n: number) {
    if (n === 1) return "🥇";
    if (n === 2) return "🥈";
    if (n === 3) return "🥉";
    return `${n}th`;
}

function severityDot(s?: number) {
    if (!s) return "bg-gray-600";
    if (s <= 2) return "bg-yellow-500";
    if (s === 3) return "bg-orange-500";
    return "bg-red-500";
}

// ── Track View (ported from mobile app TrackView) ─────────────────────────────
const LANE_H = 34;
const MARKER = 26;
const MARKER_OWNER = 32;
const PADDING_L = 40;
const PADDING_R = 12;

function TrackView({
    horses,
    trackLength,
    ownerRegistrationId,
}: {
    horses: LiveHorse[];
    trackLength: number;
    ownerRegistrationId?: string | null;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(entries => {
            for (const e of entries) setWidth(e.contentRect.width);
        });
        ro.observe(el);
        setWidth(el.getBoundingClientRect().width);
        return () => ro.disconnect();
    }, []);

    if (horses.length === 0) {
        return (
            <div className="bg-[#0f0f0f] rounded-xl border border-white/8 p-4 text-center text-[12px] text-gray-600">
                Awaiting race start…
            </div>
        );
    }

    // Dynamic windowing: zoom to where the pack is
    const allPositions = horses.map(h => h.isFinished ? trackLength : h.currentDistance);
    const runningPositions = allPositions.filter(d => d > 0);
    const leadDist = Math.max(...allPositions, 0);
    const trailDist = Math.min(...(runningPositions.length > 0 ? runningPositions : [leadDist]), leadDist);
    const spread = leadDist - trailDist;
    const pad = Math.max(60, spread * 0.15);
    const windowStart = Math.max(0, trailDist - pad);
    const windowEnd = Math.min(trackLength, leadDist + pad);
    const windowRange = Math.max(windowEnd - windowStart, 1);

    const toPct = (dist: number) => Math.max(0, Math.min(1, (dist - windowStart) / windowRange));
    const usable = Math.max(0, width - PADDING_L - PADDING_R - MARKER_OWNER);
    const showFinish = windowEnd >= trackLength * 0.94;

    // 100m checkpoints in visible window
    const firstMark = Math.ceil(windowStart / 100) * 100;
    const checkpoints: number[] = [];
    for (let m = firstMark; m <= windowEnd && m < trackLength; m += 100) {
        checkpoints.push(m);
    }

    const containerH = horses.length * LANE_H + 52;

    return (
        <div className="bg-[#0f0f0f] rounded-xl border border-white/8 p-4">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-500">Track Position</h2>
                <span className="text-[10px] text-gray-600 font-mono">
                    {Math.round(windowStart)}m – {Math.round(windowEnd)}m
                </span>
            </div>

            <div
                ref={containerRef}
                className="relative bg-white/[0.03] rounded-xl border border-white/6 overflow-visible"
                style={{ height: containerH }}
            >
                {/* Lane guides + labels */}
                {horses.map((h, i) => {
                    const cy = 20 + i * LANE_H + LANE_H / 2;
                    const color = horseColor(h.number);
                    return (
                        <div key={`lane-${h.registrationId}`}>
                            {/* Guide line */}
                            <div
                                className="absolute pointer-events-none"
                                style={{ left: PADDING_L, right: PADDING_R, top: cy - 0.5, height: 1, background: `${color}18` }}
                            />
                            {/* Lane label circle */}
                            <div
                                className="absolute flex items-center justify-center"
                                style={{ left: 6, top: 20 + i * LANE_H + (LANE_H - 20) / 2, width: 20, height: 20 }}
                            >
                                <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border"
                                    style={{ background: `${color}28`, borderColor: `${color}50`, color }}
                                >
                                    {h.number}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* 100m checkpoints */}
                {width > 0 && checkpoints.map(m => (
                    <div
                        key={`cp-${m}`}
                        className="absolute pointer-events-none flex flex-col items-center"
                        style={{ left: PADDING_L + toPct(m) * usable }}
                    >
                        <div className="w-px bg-white/10" style={{ height: containerH - 24 }} />
                        <span className="text-[7px] text-gray-700 font-bold mt-0.5 -translate-x-1/2">{m}m</span>
                    </div>
                ))}

                {/* Finish line */}
                {showFinish && width > 0 && (
                    <div
                        className="absolute top-4 bottom-6 w-px bg-green-500/50 pointer-events-none"
                        style={{ right: PADDING_R }}
                    >
                        <span className="absolute top-0 right-1 text-[7px] text-green-500 font-black">F</span>
                    </div>
                )}

                {/* Horse markers */}
                {width > 0 && horses.map((h, i) => {
                    const dist = h.isFinished ? trackLength : h.currentDistance;
                    const left = PADDING_L + toPct(dist) * usable;
                    const top = 20 + i * LANE_H + (LANE_H - MARKER) / 2;
                    const color = horseColor(h.number);
                    const isOwner = ownerRegistrationId && h.registrationId === ownerRegistrationId;
                    const size = isOwner ? MARKER_OWNER : MARKER;
                    const offsetTop = isOwner ? top - (MARKER_OWNER - MARKER) / 2 : top;

                    return (
                        <div
                            key={h.registrationId}
                            className="absolute -translate-x-1/2 flex items-center justify-center transition-all duration-700"
                            style={{ left, top: offsetTop, width: size, height: size }}
                        >
                            <div
                                className="flex items-center justify-center rounded-full text-white font-black"
                                style={{
                                    width: size,
                                    height: size,
                                    fontSize: isOwner ? 12 : 10,
                                    background: h.isFinished ? "#161616" : color,
                                    border: `2px solid ${color}`,
                                    boxShadow: isOwner ? `0 0 0 3px #ffd700, 0 0 8px #ffd70060` : undefined,
                                    color: h.isFinished ? color : "#fff",
                                }}
                            >
                                {h.isFinished ? "✓" : h.number}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Horse Row (ported from mobile HorseRow) ───────────────────────────────────
function HorseRow({
    horse,
    rank,
    trackLength,
    raceFinished,
    isOwner,
}: {
    horse: LiveHorse;
    rank: number;
    trackLength: number;
    raceFinished: boolean;
    isOwner: boolean;
}) {
    const color = horseColor(horse.number);
    const pct = trackLength > 0 ? (horse.currentDistance / trackLength) * 100 : 0;

    return (
        <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all ${isOwner ? "border-yellow-600/30 bg-yellow-500/5 border-l-2 border-l-yellow-400" : "border-white/6 bg-white/[0.02]"}`}>
            {/* Rank */}
            <span className="text-[13px] shrink-0 w-7 text-center">{rankSuffix(rank)}</span>

            {/* Color circle */}
            <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 border"
                style={{ background: `${color}25`, borderColor: color, color }}
            >
                {horse.number}
            </div>

            {/* Name + progress */}
            <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold text-white truncate">{horse.horseName}</p>
                {horse.jockeyName && (
                    <p className="text-[10px] text-gray-500 truncate">{horse.jockeyName}</p>
                )}
                {!raceFinished && !horse.isFinished && (
                    <div className="mt-1 h-1 rounded-full bg-white/8 overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(100, pct)}%`, background: color }}
                        />
                    </div>
                )}
            </div>

            {/* Right: time or speed */}
            <div className="shrink-0 text-right">
                {horse.isFinished && horse.finishTime ? (
                    <>
                        <p className="text-[11px] font-bold text-white font-mono">{horse.finishTime}</p>
                        <p className="text-[9px] text-green-500 font-bold uppercase">Finished</p>
                    </>
                ) : (
                    <>
                        <p className="text-[12px] font-bold font-mono" style={{ color }}>
                            {horse.currentSpeed > 0 ? horse.currentSpeed.toFixed(1) : "—"}
                        </p>
                        <p className="text-[9px] text-gray-600">m/s</p>
                    </>
                )}
            </div>
        </div>
    );
}

// ── My Horse panel ────────────────────────────────────────────────────────────
function MyHorsePanel({
    ownerRegistration,
    ownerResult,
    liveHorses,
    trackLength,
    collapsed,
    onToggle,
}: {
    ownerRegistration: any;
    ownerResult: any;
    liveHorses: LiveHorse[] | null;
    trackLength: number;
    collapsed: boolean;
    onToggle: () => void;
}) {
    const horse = ownerRegistration?.horse;
    const regId = ownerRegistration?._id;

    const liveEntry = liveHorses?.find(h => h.registrationId === regId);
    const sortedByDist = liveHorses ? [...liveHorses].sort((a, b) => b.currentDistance - a.currentDistance) : [];
    const liveRank = liveEntry ? sortedByDist.findIndex(h => h.registrationId === regId) + 1 : null;

    const isDisqualified = ownerResult?.resultStatus === "cancelled";
    const hasOfficialResult = ownerResult && !isDisqualified;

    return (
        <div className="bg-[#1a1a1a] rounded-xl border border-yellow-600/30 overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />
                    <h2 className="text-[12px] font-bold uppercase tracking-wider text-yellow-400">
                        My Horse {horse ? `· ${horse.horseName}` : ""}
                    </h2>
                </div>
                <ChevronDown size={13} className={`text-gray-600 transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`} />
            </button>

            {!collapsed && (
                <div className="px-4 pb-4 border-t border-white/8 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                    {horse && (
                        <div>
                            <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">Horse</p>
                            <p className="text-[13px] font-bold text-red-400">{horse.horseName}</p>
                            <p className="text-[10px] text-gray-500">{horse.breed ?? ""}</p>
                        </div>
                    )}
                    {ownerRegistration?.selectedJockey && (
                        <div>
                            <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">Jockey</p>
                            <p className="text-[12px] font-semibold text-white">{ownerRegistration.selectedJockey.fullName}</p>
                        </div>
                    )}
                    {ownerRegistration?.laneNumber != null && (
                        <div>
                            <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">Lane</p>
                            <p className="text-[22px] font-black text-white">{ownerRegistration.laneNumber}</p>
                        </div>
                    )}
                    {liveEntry && !isDisqualified && !hasOfficialResult && (
                        <>
                            {liveRank && (
                                <div>
                                    <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">Position</p>
                                    <p className="text-[18px] font-black text-white">{rankSuffix(liveRank)}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">Speed</p>
                                <p className="text-[13px] font-bold font-mono text-white">
                                    {liveEntry.currentSpeed > 0 ? `${liveEntry.currentSpeed.toFixed(1)} m/s` : "—"}
                                </p>
                            </div>
                            {liveEntry.isFinished && liveEntry.finishPosition && (
                                <div>
                                    <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">Finish</p>
                                    <p className="text-[18px] font-black text-white">{rankSuffix(liveEntry.finishPosition)}</p>
                                    {liveEntry.finishTime && (
                                        <p className="text-[10px] font-mono text-gray-400">{liveEntry.finishTime}</p>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                    {hasOfficialResult && (
                        <>
                            <div>
                                <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">Official Finish</p>
                                <p className="text-[20px] font-black text-white">{rankSuffix(ownerResult.finishPosition)}</p>
                            </div>
                            {ownerResult.finishTime && (
                                <div>
                                    <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">Time</p>
                                    <p className="text-[12px] font-bold font-mono text-white">{ownerResult.finishTime}</p>
                                </div>
                            )}
                            {ownerResult.prizeMoney > 0 && (
                                <div>
                                    <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">Prize</p>
                                    <p className="text-[14px] font-bold text-yellow-400">${ownerResult.prizeMoney.toLocaleString()}</p>
                                </div>
                            )}
                        </>
                    )}
                    {isDisqualified && (
                        <div className="col-span-2 sm:col-span-4 flex items-center gap-2 text-red-400 text-[13px] font-bold">
                            <ShieldAlert size={14} /> DISQUALIFIED
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Violations panel ──────────────────────────────────────────────────────────
function ViolationsPanel({
    violations,
    ownerRegistrationId,
}: {
    violations: any[];
    ownerRegistrationId?: string | null;
}) {
    if (violations.length === 0) return null;

    return (
        <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                <h2 className="text-[12px] font-bold text-white flex items-center gap-2">
                    <ShieldAlert size={13} className="text-red-500" /> Violations
                </h2>
                <span className="text-[11px] font-bold text-red-400">{violations.length} flagged</span>
            </div>
            <div className="p-3 flex flex-col gap-1.5">
                {violations.map((v: any) => {
                    const vtName = v.violationTypeId?.violationName ?? "Violation";
                    const severity = v.violationTypeId?.severity ?? v.severity;
                    const isOwnerReg = ownerRegistrationId && v.registrationId &&
                        String(v.registrationId) === String(ownerRegistrationId);
                    return (
                        <div
                            key={v._id}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-[12px] ${isOwnerReg ? "border-red-800/50 bg-red-500/8 " : "border-white/8 bg-white/[0.02]"}`}
                        >
                            <span className={`w-2 h-2 rounded-full shrink-0 ${severityDot(severity)}`} />
                            <span className={`flex-1 ${isOwnerReg ? "text-red-400 font-semibold" : "text-gray-400"}`}>{vtName}</span>
                            {severity && <span className="text-[9px] text-gray-600 shrink-0">S{severity}</span>}
                            <span className="text-[10px] text-gray-600 capitalize shrink-0">{v.violationStatus}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Finished Banner (ported from mobile) ──────────────────────────────────────
function FinishedBanner({ raceFinished }: { raceFinished: any }) {
    const [distUnit, setDistUnit] = useState<"metres" | "lengths">("metres");
    const results = raceFinished?.results ?? [];
    const top3 = results.slice(0, 3);

    return (
        <div className="bg-[#1a1a1a] rounded-xl border border-yellow-600/30 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <Trophy size={20} className="text-yellow-400" />
                <h2 className="text-[15px] font-bold text-white font-serif">Race Finished</h2>
            </div>
            <div className="flex flex-col gap-1.5">
                {top3.map((r: any, i: number) => (
                    <div key={r.registrationId} className="flex items-center gap-2.5 text-[13px]">
                        <span className="text-[15px] shrink-0">{rankSuffix(i + 1)}</span>
                        <span className="flex-1 text-white font-semibold truncate">{r.horseName}</span>
                        {r.finishTime && <span className="font-mono text-gray-400 shrink-0">{r.finishTime}</span>}
                        {r.distance && distUnit === "metres" && (
                            <span className="text-gray-600 text-[11px] shrink-0">+{(r.distance * 2.4).toFixed(1)}m</span>
                        )}
                    </div>
                ))}
            </div>
            <button
                onClick={() => setDistUnit(u => u === "metres" ? "lengths" : "metres")}
                className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors self-start"
            >
                {distUnit === "metres" ? "Switch to lengths" : "Switch to metres"}
            </button>
            {raceFinished?.isPendingConfirmation && (
                <p className="text-[11px] text-gray-600 italic">Results pending official confirmation.</p>
            )}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface OwnerLivePageProps {
    ownerRegistration: any;
    ownerResult: any;
    violations: any[];
}

export default function OwnerLivePage({ ownerRegistration, ownerResult, violations }: OwnerLivePageProps) {
    const { raceRound, liveUpdate, raceFinished } = useRaceSocket();

    const [activeCam, setActiveCam] = useState(1);
    const cam = CAMERAS.find(c => c.id === activeCam)!;
    const muxPlaybackId = raceRound?.muxPlaybackId ?? null;
    const [muxError, setMuxError] = useState(false);
    useEffect(() => { setMuxError(false); }, [muxPlaybackId]);
    const showMux = !!muxPlaybackId && !muxError;

    const [streamTimedOut, setStreamTimedOut] = useState(false);
    useEffect(() => {
        if (showMux) { setStreamTimedOut(false); return; }
        const t = setTimeout(() => setStreamTimedOut(true), 5_000);
        return () => clearTimeout(t);
    }, [showMux]);

    const liveHorses = liveUpdate?.horses ?? null;
    const trackLength = liveUpdate?.trackLength ?? raceRound?.trackLength ?? 2000;
    const elapsed = liveUpdate ? formatElapsed(liveUpdate.elapsedSeconds) : "--:--";
    const leader = liveHorses ? [...liveHorses].sort((a, b) => b.currentDistance - a.currentDistance)[0] : null;
    const paceMps = leader ? `${leader.currentSpeed.toFixed(1)} m/s` : "—";
    const leaderLabel = leader ? `#${leader.number} ${leader.horseName}` : "—";

    const ownerRegistrationId = ownerRegistration?._id ?? null;

    const sortedHorses: LiveHorse[] = liveHorses
        ? [...liveHorses].sort((a, b) => {
            if (a.isFinished && b.isFinished)
                return (a.finishPosition ?? 99) - (b.finishPosition ?? 99);
            if (a.isFinished) return -1;
            if (b.isFinished) return 1;
            return b.currentDistance - a.currentDistance;
        })
        : [];

    const [myHorseCollapsed, setMyHorseCollapsed] = useState(false);

    // `raceFinished` only arrives if the live socket event fired during this session — on a
    // cold load after the race already ended, fall back to the REST-fetched raceRound status.
    const isAwaitingConfirmation = raceRound?.status === "awaitingConfirmation" && !raceFinished;
    const isCompletedNoBanner = raceRound?.status === "completed" && !raceFinished;

    return (
        <div className="flex flex-col gap-4">
            {isAwaitingConfirmation && (
                <div className="flex items-center gap-2 self-start px-3 py-1.5 rounded-xl border border-amber-700/60 bg-amber-500/10 text-amber-400 text-[11px] font-bold font-mono">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    Awaiting Admin Confirmation
                </div>
            )}
            {isCompletedNoBanner && (
                <div className="flex items-center gap-2 self-start px-3 py-1.5 rounded-xl border border-green-700/50 bg-green-500/10 text-green-400 text-[11px] font-bold font-mono">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Race Finished
                </div>
            )}

            {/* My Horse panel — shown at top on mobile */}
            {ownerRegistration && (
                <MyHorsePanel
                    ownerRegistration={ownerRegistration}
                    ownerResult={ownerResult}
                    liveHorses={liveHorses}
                    trackLength={trackLength}
                    collapsed={myHorseCollapsed}
                    onToggle={() => setMyHorseCollapsed(v => !v)}
                />
            )}

            {/* Race finished banner */}
            {raceFinished && <FinishedBanner raceFinished={raceFinished} />}

            {/* Stream */}
            <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8">
                    <div className="flex items-center gap-2 flex-wrap">
                        {showMux ? (
                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-red-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                OBS Stream Active
                            </span>
                        ) : (
                            CAMERAS.map(c => (
                                <button key={c.id} onClick={() => setActiveCam(c.id)}
                                    className={["flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all",
                                        activeCam === c.id ? "bg-red-700 text-white" : "text-gray-500 bg-white/5 hover:bg-white/10 hover:text-gray-300",
                                    ].join(" ")}
                                >
                                    <Camera size={10} />
                                    CAM {c.id}
                                </button>
                            ))
                        )}
                    </div>
                    <button className="flex items-center gap-1 text-[11px] text-gray-500 font-medium hover:text-gray-200 transition-colors shrink-0">
                        Fullscreen <ChevronRight size={12} />
                    </button>
                </div>

                <div className="relative mx-3 mt-3 mb-3 rounded-xl overflow-hidden aspect-video bg-black">
                    {showMux ? (
                        <MuxPlayer
                            playbackId={muxPlaybackId!}
                            streamType="live"
                            autoPlay
                            muted
                            className="w-full h-full"
                            style={{ aspectRatio: "16/9" }}
                            onError={() => setMuxError(true)}
                        />
                    ) : streamTimedOut ? (
                        <iframe
                            src="https://www.youtube.com/embed/2rKE4YIrDRk?autoplay=1&mute=1&loop=1&playlist=2rKE4YIrDRk"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                            className="w-full h-full border-0"
                            title="Race stream placeholder"
                        />
                    ) : (
                        <img src={cam.src} alt="Race feed" className="w-full h-full object-cover opacity-90 transition-all duration-300" />
                    )}

                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-red-700/90 backdrop-blur px-2 py-1 rounded-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                            {showMux ? "Live · OBS Stream" : streamTimedOut ? "Placeholder" : `Preview · ${cam.label}`}
                        </span>
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 bg-black/70 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-3">
                        <div>
                            <p className="text-[8px] text-gray-400 uppercase tracking-wider">Pace</p>
                            <p className="text-[11px] font-bold text-white">{paceMps}</p>
                        </div>
                        <div className="w-px h-5 bg-white/10" />
                        <div>
                            <p className="text-[8px] text-gray-400 uppercase tracking-wider">Leader</p>
                            <p className="text-[11px] font-bold text-red-400">{leaderLabel}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Track View (mobile-style dynamic windowing) */}
            {liveHorses && liveHorses.length > 0 && (
                <TrackView
                    horses={liveHorses}
                    trackLength={trackLength}
                    ownerRegistrationId={ownerRegistrationId}
                />
            )}

            {/* Horse standings + Race stats */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
                {/* Horse standings */}
                {sortedHorses.length > 0 && (
                    <div className="bg-[#1a1a1a] rounded-xl border border-white/8 p-4">
                        <h2 className="text-[10.5px] font-bold uppercase tracking-widest text-gray-500 mb-3">Standings</h2>
                        <div className="flex flex-col gap-1.5">
                            {sortedHorses.map((h, i) => (
                                <HorseRow
                                    key={h.registrationId}
                                    horse={h}
                                    rank={i + 1}
                                    trackLength={trackLength}
                                    raceFinished={!!raceFinished}
                                    isOwner={ownerRegistrationId ? h.registrationId === ownerRegistrationId : false}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Race stats + violations */}
                <div className="flex flex-col gap-4">
                    <div className="bg-[#1a1a1a] rounded-xl border border-white/8 p-4">
                        <h2 className="text-[10.5px] font-bold uppercase tracking-widest text-gray-600 mb-3">Race Stats</h2>
                        {[
                            { label: "Race Type", value: raceRound?.RaceType?.raceType ?? "-" },
                            { label: "Elapsed",   value: elapsed     },
                            { label: "Pace",      value: paceMps     },
                            { label: "Leader",    value: leaderLabel },
                            { label: "Track",     value: `${trackLength} m` },
                            { label: "Incidents", value: `${violations.length}` },
                        ].map(item => (
                            <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <span className="text-[12px] text-gray-500">{item.label}</span>
                                <span className="text-[12px] font-semibold text-white">{item.value}</span>
                            </div>
                        ))}
                    </div>

                    <ViolationsPanel violations={violations} ownerRegistrationId={ownerRegistrationId} />
                </div>
            </div>
        </div>
    );
}
