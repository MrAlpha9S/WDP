import { useCallback, useEffect, useState } from "react";
import MuxPlayer from "@mux/mux-player-react";
import {
    AlertTriangle, Camera, CheckCircle2, ChevronDown, ChevronRight,
    Loader2, Shield, ShieldAlert,
} from "lucide-react";
import { CAMERAS, horseColor } from "../../shared/data/RaceData";
import type { HorseEntry } from "../../shared/types/RaceTypes";
import { useRaceSocket } from "../../providers/useRaceSocket";
import type { LiveHorse } from "../../providers/useRaceSocket";
import { refereeService } from "../../api/refereeService";
import type { ViolationTypeRecord, ViolationRecord } from "../../api/refereeService";
import { RefetchButton } from "../../components/RefetchButton";
import { ErrorState } from "../../components/ErrorState";

function severityDot(severity?: number) {
    if (!severity) return "bg-gray-600";
    if (severity <= 2) return "bg-yellow-500";
    if (severity === 3) return "bg-orange-500";
    return "bg-red";
}

function IncidentButton({
    vt,
    activeCount,
    loading,
    onClick,
}: {
    vt: ViolationTypeRecord;
    activeCount: number;
    loading: boolean;
    onClick: () => void;
}) {
    const active = activeCount > 0;
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={loading}
            className={["group flex flex-col items-center justify-center gap-2 py-4 rounded-xl border text-center transition-all duration-200 cursor-pointer select-none relative",
                active ? "border-red-700 bg-red/10 text-red"
                    : "border-border bg-white/[0.03] text-text-muted hover:border-white/15 hover:bg-white/[0.06] hover:text-text-muted",
                loading ? "opacity-60 cursor-not-allowed" : "",
            ].join(" ")}
        >
            {loading
                ? <Loader2 size={16} className="animate-spin shrink-0" />
                : <ShieldAlert size={16} className={active ? "text-red" : "text-text-muted/70 group-hover:text-text-muted"} />
            }
            <span className="text-[11px] font-semibold leading-tight px-1">{vt.violationName}</span>
            <span className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${severityDot(vt.severity)}`} />
            {active && (
                <span className="absolute bottom-2 right-2 text-[9px] font-black text-red uppercase tracking-wider">
                    ×{activeCount}
                </span>
            )}
        </button>
    );
}

// ── Horse picker modal ────────────────────────────────────────────────────────

interface HorseOption {
    registrationId: string;
    number: number;
    name: string;
    jockey: string;
}

function HorsePickerModal({
    vt,
    horses,
    loading,
    onConfirm,
    onClose,
}: {
    vt: ViolationTypeRecord;
    horses: HorseOption[];
    loading: boolean;
    onConfirm: (registrationIds: string[]) => void;
    onClose: () => void;
}) {
    // Race-wide and specific horses are mutually exclusive: picking any horse clears
    // race-wide, and picking race-wide clears any selected horses. Multiple horses can
    // be checked at once (e.g. two horses bumped each other) — one violation record is
    // created per selected horse (or a single race-wide one if none are selected).
    const [raceWide, setRaceWide] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleRaceWide = () => {
        setRaceWide(v => !v);
        setSelectedIds(new Set());
    };
    const toggleHorse = (registrationId: string) => {
        setRaceWide(false);
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(registrationId)) next.delete(registrationId);
            else next.add(registrationId);
            return next;
        });
    };

    const canConfirm = raceWide || selectedIds.size > 0;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-surface-raised border border-border rounded-2xl p-6 w-full max-w-lg max-h-[85vh] shadow-2xl shadow-black/60 flex flex-col gap-5"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between shrink-0">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/70 mb-1">Flag Violation</p>
                        <h3 className="text-[18px] font-bold text-text leading-tight">{vt.violationName}</h3>
                        {vt.severity && (
                            <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded ${severityDot(vt.severity)} bg-opacity-20 text-text`}>
                                Severity {vt.severity}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="text-text-muted/70 hover:text-text-muted text-[20px] leading-none mt-0.5">✕</button>
                </div>

                {/* Horse list */}
                <div className="flex-1 min-h-0 flex flex-col">
                    <p className="text-[11px] text-text-muted uppercase tracking-widest font-bold mb-2.5 shrink-0">
                        Select horse(s) involved
                    </p>
                    <div className="flex flex-col gap-2 overflow-y-auto pr-1">
                        {/* Race-wide option */}
                        <label
                            className={[
                                "flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all",
                                raceWide
                                    ? "border-yellow-600/60 bg-yellow-500/8 text-amber"
                                    : "border-border bg-white/[0.03] text-text-muted hover:border-white/15 hover:text-text-muted",
                            ].join(" ")}
                        >
                            <input
                                type="checkbox"
                                checked={raceWide}
                                onChange={toggleRaceWide}
                                className="w-4 h-4 shrink-0 accent-yellow-500 rounded bg-black border-white/20"
                            />
                            <div>
                                <p className="text-[13px] font-semibold">Race-wide</p>
                                <p className="text-[11px] text-text-muted/70">No specific horse</p>
                            </div>
                        </label>

                        {horses.map(h => {
                            const checked = selectedIds.has(h.registrationId);
                            return (
                                <label
                                    key={h.registrationId}
                                    className={[
                                        "flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all",
                                        checked
                                            ? "border-red-700/60 bg-red/8 text-red-300"
                                            : "border-border bg-white/[0.03] text-text-muted hover:border-white/15 hover:text-text",
                                    ].join(" ")}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleHorse(h.registrationId)}
                                        className="w-4 h-4 shrink-0 accent-red-600 rounded bg-black border-white/20"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold">#{h.number} {h.name}</p>
                                        <p className="text-[11px] text-text-muted/70 truncate">{h.jockey}</p>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1 border-t border-border shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-border text-text-muted text-[13px] font-semibold hover:border-white/20 hover:text-text-muted transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(Array.from(selectedIds))}
                        disabled={loading || !canConfirm}
                        className="flex-1 py-2.5 rounded-xl bg-red text-text text-[13px] font-bold uppercase tracking-widest hover:bg-red/85 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                        {loading ? <Loader2 size={13} className="animate-spin" /> : <ShieldAlert size={13} />}
                        {selectedIds.size > 1 ? `Flag ${selectedIds.size} Horses` : "Flag"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Position track (real-time from socket) ────────────────────────────────────

function formatElapsed(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
}

function PositionTrack({
    liveHorses,
    staticHorses,
    trackLength,
    lineMark,
    showOnStream,
}: {
    liveHorses: LiveHorse[] | null;
    staticHorses: HorseEntry[];
    trackLength: number;
    lineMark: number | null;
    showOnStream: boolean;
}) {
    // Determine display list — prefer live data, fall back to static for layout
    const displayHorses: LiveHorse[] = liveHorses ?? staticHorses.map((h, i) => ({
        registrationId: String(i),
        number: h.number,
        horseName: h.name,
        jockeyName: h.jockey,
        raceStyle: 'Pace' as const,
        currentDistance: 0,
        currentSpeed: 0,
        isFinished: false,
        finishPosition: null,
        finishTime: null,
    }));

    const leader = [...displayHorses].sort((a, b) => b.currentDistance - a.currentDistance)[0];

    return (
        <div className="bg-bg rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-[10.5px] font-bold uppercase tracking-widest text-text-muted/70">Track Position</h2>
                <div className="flex items-center gap-2">
                    {showOnStream && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-red bg-red/10 border border-red/40 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            <span className="w-1 h-1 rounded-full bg-red animate-pulse" /> On Stream
                        </span>
                    )}
                    {leader && (
                        <span className="text-[10px] text-text-muted/70 font-mono">
                            Leader: {leader.horseName} · {leader.currentDistance.toFixed(0)} m
                        </span>
                    )}
                </div>
            </div>

            {/* Track bar — one lane per horse, separated vertically by horse number */}
            <div
                className="relative bg-white/[0.03] rounded-2xl border border-border/60 overflow-visible mx-2"
                style={{ height: `${Math.max(80, displayHorses.length * 30)}px` }}
            >
                {/* Corner labels */}
                <div className="absolute left-10 top-2 text-[8px] font-black uppercase tracking-widest text-text-muted/50">Start</div>
                <div className="absolute right-3 top-2 text-[8px] font-black uppercase tracking-widest text-text-muted/50">{trackLength} m</div>

                {/* Lane guide lines */}
                {displayHorses.map(horse => {
                    const n = displayHorses.length;
                    const topPct = n <= 1 ? 50 : 8 + ((horse.number - 1) / (n - 1)) * 84;
                    const color = horseColor(horse.number);
                    return (
                        <div key={`gl-${horse.registrationId}`}
                            className="absolute pointer-events-none"
                            style={{ left: 38, right: 8, top: `${topPct}%`, height: 1, marginTop: -0.5, background: `${color}20` }}
                        />
                    );
                })}

                {/* Lane labels */}
                {displayHorses.map(horse => {
                    const n = displayHorses.length;
                    const topPct = n <= 1 ? 50 : 8 + ((horse.number - 1) / (n - 1)) * 84;
                    const color = horseColor(horse.number);
                    return (
                        <div key={`lbl-${horse.registrationId}`}
                            className="absolute left-2 -translate-y-1/2 flex items-center gap-1 pointer-events-none"
                            style={{ top: `${topPct}%` }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                            <span className="text-[8px] font-bold text-text-muted/50">#{horse.number}</span>
                        </div>
                    );
                })}

                {/* Next line mark */}
                {lineMark !== null && lineMark < trackLength && (
                    <div
                        className="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none"
                        style={{ left: `${(lineMark / trackLength) * 100}%` }}
                    >
                        <div className="w-px h-full bg-yellow-500/40" />
                        <span className="absolute -top-4 text-[8px] font-bold text-amber/70 -translate-x-1/2">
                            {lineMark} m
                        </span>
                    </div>
                )}

                {/* Horse markers */}
                {displayHorses.map(horse => {
                    const pct = trackLength > 0 ? (horse.currentDistance / trackLength) * 100 : 0;
                    const n = displayHorses.length;
                    const topPct = n <= 1 ? 50 : 8 + ((horse.number - 1) / (n - 1)) * 84;
                    const color = horseColor(horse.number);
                    const isLeader = leader?.registrationId === horse.registrationId;
                    return (
                        <div key={horse.registrationId}
                            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700"
                            style={{ left: `${pct}%`, top: `${topPct}%` }}
                        >
                            <div className="flex items-center justify-center text-[10px] font-black text-text shadow-lg relative"
                                style={{
                                    width: isLeader ? 26 : 22, height: isLeader ? 26 : 22,
                                    borderRadius: "50%", background: color,
                                    boxShadow: isLeader ? `0 0 12px ${color}90` : undefined,
                                    border: `2px solid ${color}80`,
                                }}
                            >
                                {horse.number}
                                {horse.isFinished && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[7px] text-green font-black leading-none">✓</span>
                                )}
                                {isLeader && (
                                    <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[7px] font-black text-amber leading-none">▲</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 flex-wrap">
                {[...displayHorses].sort((a, b) => b.currentDistance - a.currentDistance).map(h => (
                    <div key={h.registrationId} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: horseColor(h.number) }} />
                        <span className="text-[10px] text-text-muted font-medium">#{h.number} {h.horseName.split(" ")[0]}</span>
                        {h.finishPosition === 1 && <span className="text-[9px] text-amber font-black">1st</span>}
                        {h.finishPosition === 2 && <span className="text-[9px] text-text-muted font-black">2nd</span>}
                        {h.finishPosition === 3 && <span className="text-[9px] text-amber-600 font-black">3rd</span>}
                        <span className="text-[9px] text-text-muted/70 font-mono">{h.raceStyle[0]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LivePage() {
    const { horses, raceRound, liveUpdate } = useRaceSocket();
    const [verificationOpen, setVerificationOpen] = useState(false);
    const [selectedHorseRegId, setSelectedHorseRegId] = useState<string | null>(null);
    const [activeCam, setActiveCam] = useState(1);
    const [showTrackOnStream, setShowTrackOnStream] = useState(false);
    const cam = CAMERAS.find(c => c.id === activeCam)!;

    // Mux live stream playback ID comes from the race round fetched on mount
    const muxPlaybackId = raceRound?.muxPlaybackId ?? null;

    // Track Mux playback errors — fall back to placeholder on failure
    const [muxError, setMuxError] = useState(false);
    useEffect(() => { setMuxError(false); }, [muxPlaybackId]); // reset on new ID
    const showMux = !!muxPlaybackId && !muxError;

    // Show YouTube placeholder if no Mux stream (or Mux errored) within 5 seconds
    const [streamTimedOut, setStreamTimedOut] = useState(false);
    useEffect(() => {
        if (showMux) { setStreamTimedOut(false); return; }
        const t = setTimeout(() => setStreamTimedOut(true), 5_000);
        return () => clearTimeout(t);
    }, [showMux]);

    // Derive display values from live update (or fallback to "--")
    const liveHorses = liveUpdate?.horses ?? null;
    const trackLength = liveUpdate?.trackLength ?? raceRound?.trackLength ?? 2000;
    const lineMark = liveUpdate?.lineMark ?? null;
    const elapsed = liveUpdate ? formatElapsed(liveUpdate.elapsedSeconds) : "--:--";
    const leader = liveHorses
        ? [...liveHorses].sort((a, b) => b.currentDistance - a.currentDistance)[0]
        : null;
    const leaderLabel = leader ? `#${leader.number} ${leader.horseName}` : "—";
    const paceMps = leader ? `${leader.currentSpeed.toFixed(1)} m/s` : "—";

    // ── Violation state ───────────────────────────────────────────────────────
    const [violationTypes, setViolationTypes] = useState<ViolationTypeRecord[]>([]);
    const [activeViolations, setActiveViolations] = useState<ViolationRecord[]>([]);
    const [pendingVt, setPendingVt] = useState<ViolationTypeRecord | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [violationsUpdated, setViolationsUpdated] = useState<number | null>(null);
    const [violationsError, setViolationsError] = useState<string | null>(null);

    const fetchViolations = useCallback(() => {
        if (!raceRound?._id) return;
        setViolationsError(null);
        Promise.all([
            refereeService.getViolationTypes('during-race', 1, 200),
            refereeService.getRaceRoundViolations(raceRound._id),
        ]).then(([vtRes, vRes]) => {
            if (Array.isArray(vtRes.data?.items)) setViolationTypes(vtRes.data.items);
            if (Array.isArray(vRes.data)) setActiveViolations(vRes.data);
        }).catch((err: any) => {
            setViolationsError(err?.msg ?? "Failed to load violation data.");
        }).finally(() => setViolationsUpdated(Date.now()));
    }, [raceRound?._id]);

    useEffect(() => {
        fetchViolations();
    }, [fetchViolations]);

    // Count per violation type for badge display
    const violationCountByType = activeViolations.reduce<Record<string, number>>((acc, v) => {
        const typeId = typeof v.violationTypeId === 'object' && v.violationTypeId !== null
            ? v.violationTypeId._id
            : String(v.violationTypeId ?? '');
        if (typeId) acc[typeId] = (acc[typeId] ?? 0) + 1;
        return acc;
    }, {});

    // Build horse options for the modal (prefer live data which has registrationId)
    const horseOptions: HorseOption[] = liveHorses
        ? liveHorses.map(h => ({
            registrationId: h.registrationId,
            number: h.number,
            name: h.horseName,
            jockey: h.jockeyName,
        }))
        : (raceRound?.Registration ?? [])
            .filter((reg: any) => reg.registrationStatus === 'verified')
            .map((reg: any, i: number) => {
                const confirmedInv = reg.Invitations?.find((inv: any) => inv.isJockeyInRace);
                const jockeyName = (confirmedInv?.jockeyId?._id as any)?.fullName
                    ?? (reg.Jockey?._id as any)?.fullName
                    ?? 'No Jockey';
                return {
                    registrationId: reg._id,
                    number: i + 1,
                    name: reg.Horse?.horseName ?? `Horse #${i + 1}`,
                    jockey: jockeyName,
                };
            });

    const sortedByDist = liveHorses ? [...liveHorses].sort((a, b) => b.currentDistance - a.currentDistance) : [];

    const handleConfirmViolation = async (registrationIds: string[]) => {
        if (!raceRound?._id || !pendingVt) return;
        setModalLoading(true);
        try {
            // Empty selection means "race-wide" — a single violation with no registrationId.
            // Otherwise create one violation per selected horse (e.g. two horses bumped
            // each other, both get flagged in one action).
            const targets = registrationIds.length > 0 ? registrationIds : [null];
            const results = await Promise.all(
                targets.map(registrationId =>
                    refereeService.createViolation({
                        raceRoundId: raceRound._id!,
                        violationTypeId: pendingVt._id,
                        ...(registrationId ? { registrationId } : {}),
                    })
                )
            );
            const created = results.map(r => r.data).filter((v): v is ViolationRecord => !!v);
            if (created.length > 0) {
                setActiveViolations(prev => [...prev, ...created]);
            }
        } catch { }
        setModalLoading(false);
        setPendingVt(null);
    };

    const handleDeleteViolation = async (violationId: string) => {
        setDeletingId(violationId);
        try {
            await refereeService.deleteViolation(violationId);
            setActiveViolations(prev => prev.filter(v => v._id !== violationId));
        } catch { }
        setDeletingId(null);
    };

    return (
        <div className="flex flex-col gap-4">

            {/* Row 1: Camera + Incident Log */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">

                {/* Camera */}
                <div className="bg-surface rounded-xl border border-border overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                        <div className="flex items-center gap-2 flex-wrap">
                            {showMux ? (
                                <span className="flex items-center gap-1.5 text-[11px] font-bold text-red">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red animate-pulse" />
                                    Live Stream ('placeholder')
                                </span>
                            ) : (
                                CAMERAS.map(c => (
                                    <button key={c.id} onClick={() => setActiveCam(c.id)}
                                        className={["flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all",
                                            activeCam === c.id ? "bg-red text-text" : "text-text-muted bg-white/5 hover:bg-white/10 hover:text-text-muted",
                                        ].join(" ")}
                                    >
                                        <Camera size={10} />
                                        CAM {c.id}
                                        {activeCam === c.id && <span className="text-[9px] text-red-200 font-medium hidden sm:inline">· {c.label}</span>}
                                    </button>
                                ))
                            )}
                        </div>
                        <button className="flex items-center gap-1 text-[11px] text-text-muted font-medium hover:text-text transition-colors shrink-0">
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

                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-red/90 backdrop-blur px-2 py-1 rounded-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span className="text-[10px] font-bold text-text uppercase tracking-wider">
                                {showMux ? "Live · OBS Stream" : streamTimedOut ? "Placeholder · Awaiting Stream" : `Preview · ${cam.label}`}
                            </span>
                        </div>

                        <div className="absolute bottom-2.5 left-2.5 bg-black/70 backdrop-blur px-3 py-1.5 rounded-lg border border-border flex items-center gap-3">
                            <div>
                                <p className="text-[8px] text-text-muted uppercase tracking-wider font-medium">Pace</p>
                                <p className="text-[11px] font-bold text-text">{paceMps}</p>
                            </div>
                            <div className="w-px h-5 bg-white/10" />
                            <div>
                                <p className="text-[8px] text-text-muted uppercase tracking-wider font-medium">Leader</p>
                                <p className="text-[11px] font-bold text-red">{leaderLabel}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowTrackOnStream(v => !v)}
                            className={["absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all",
                                showTrackOnStream ? "bg-yellow-600 text-text" : "bg-black/60 text-text-muted border border-white/15 hover:border-white/30 hover:text-text",
                            ].join(" ")}
                        >
                            ⊙ Track
                        </button>

                        {showTrackOnStream && (
                            <div className="absolute bottom-10 left-2.5 right-2.5 bg-black/75 backdrop-blur rounded-xl px-3 py-2 border border-border">
                                <div
                                    className="relative bg-white/[0.06] rounded-xl overflow-visible"
                                    style={{ height: `${Math.max(40, (liveHorses?.length ?? 0) * 18)}px` }}
                                >
                                    <div className="absolute left-1 top-1 text-[6px] font-black uppercase tracking-widest text-text-muted/70">S</div>
                                    <div className="absolute right-1 top-1 text-[6px] font-black uppercase tracking-widest text-text-muted/70">F</div>
                                    {(liveHorses ?? []).map(horse => {
                                        const pct = trackLength > 0 ? (horse.currentDistance / trackLength) * 100 : 0;
                                        const total = liveHorses?.length ?? 1;
                                        const topPct = total <= 1 ? 50 : 10 + ((horse.number - 1) / (total - 1)) * 80;
                                        const color = horseColor(horse.number);
                                        const isLeader = leader?.registrationId === horse.registrationId;
                                        return (
                                            <div key={horse.registrationId}
                                                className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700"
                                                style={{ left: `${pct}%`, top: `${topPct}%` }}
                                            >
                                                <div className="flex items-center justify-center text-[8px] font-black text-text"
                                                    style={{
                                                        width: isLeader ? 18 : 14, height: isLeader ? 18 : 14,
                                                        borderRadius: "50%", background: color,
                                                        boxShadow: isLeader ? `0 0 6px ${color}` : undefined,
                                                        border: `1.5px solid ${color}80`,
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
                <div className="bg-surface rounded-xl border border-border flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                        <h2 className="text-[13px] font-bold text-text font-serif">Incident Log</h2>
                        <div className="flex items-center gap-2">
                            {activeViolations.length > 0
                                ? <span className="text-[11px] font-bold text-red flex items-center gap-1"><AlertTriangle size={11} />{activeViolations.length} flagged</span>
                                : <span className="text-[11px] text-text-muted/70 font-medium">0 flagged</span>
                            }
                            <RefetchButton onRefetch={fetchViolations} lastUpdated={violationsUpdated} />
                        </div>
                    </div>

                    {/* Scrollable violation type grid */}
                    <div className="overflow-y-auto" style={{ maxHeight: 280 }}>
                        <div className="grid grid-cols-2 gap-2 p-3">
                            {violationsError
                                ? <div className="col-span-2"><ErrorState message={violationsError} onRetry={fetchViolations} /></div>
                                : violationTypes.length === 0
                                    ? <p className="col-span-2 text-[12px] text-text-muted/70 text-center py-4">Loading violation types…</p>
                                    : violationTypes.map(vt => (
                                        <IncidentButton
                                            key={vt._id}
                                            vt={vt}
                                            activeCount={violationCountByType[vt._id] ?? 0}
                                            loading={pendingVt?._id === vt._id && modalLoading}
                                            onClick={() => setPendingVt(vt)}
                                        />
                                    ))
                            }
                        </div>
                    </div>

                    {/* Flagged violation list with delete */}
                    {activeViolations.length > 0 && (
                        <div className="border-t border-border px-3 py-2 flex flex-col gap-1 max-h-36 overflow-y-auto shrink-0">
                            {activeViolations.map(v => {
                                const vtObj = typeof v.violationTypeId === 'object' && v.violationTypeId !== null ? v.violationTypeId : null;
                                const name = vtObj?.violationName ?? 'Violation';
                                const horseName = v.registrationId
                                    ? horseOptions.find(h => h.registrationId === (typeof v.registrationId === 'string' ? v.registrationId : (v.registrationId as any)?._id))?.name
                                    : null;
                                return (
                                    <div key={v._id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-red/5 border border-red-800/30">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[11px] text-red block truncate">{name}</span>
                                            {horseName && <span className="text-[9px] text-text-muted/70 block truncate">{horseName}</span>}
                                        </div>
                                        {vtObj?.severity && (
                                            <span className="text-[9px] font-bold text-text-muted/70 shrink-0">S{vtObj.severity}</span>
                                        )}
                                        <button
                                            onClick={() => handleDeleteViolation(v._id)}
                                            disabled={deletingId === v._id}
                                            className="text-text-muted/50 hover:text-red transition-colors shrink-0 ml-1"
                                            title="Remove flag"
                                        >
                                            {deletingId === v._id
                                                ? <Loader2 size={11} className="animate-spin" />
                                                : <span className="text-[13px] leading-none">×</span>
                                            }
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Horse picker modal */}
            {pendingVt && (
                <HorsePickerModal
                    vt={pendingVt}
                    horses={horseOptions}
                    loading={modalLoading}
                    onConfirm={handleConfirmViolation}
                    onClose={() => setPendingVt(null)}
                />
            )}

            {/* Row 2: Position track (real-time) */}
            <PositionTrack
                liveHorses={liveHorses}
                staticHorses={horses}
                trackLength={trackLength}
                lineMark={lineMark}
                showOnStream={showTrackOnStream}
            />

            {/* Row 3: Stats + Verification */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">

                <div className="bg-surface rounded-xl border border-border p-4">
                    <h2 className="text-[10.5px] font-bold uppercase tracking-widest text-text-muted/70 mb-3">Race Stats</h2>
                    {[
                        { label: "Elapsed", value: elapsed },
                        { label: "Current Pace", value: paceMps },
                        { label: "Leader", value: leaderLabel },
                        { label: "Next Mark", value: lineMark !== null ? `${lineMark} m` : "—" },
                        { label: "Incidents", value: `${activeViolations.length}` },
                    ].map(item => (
                        <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
                            <span className="text-[12px] text-text-muted">{item.label}</span>
                            <span className="text-[12px] font-semibold text-text">{item.value}</span>
                        </div>
                    ))}
                </div>

                <div className="bg-surface rounded-xl border border-border flex flex-col overflow-hidden">
                    <button onClick={() => setVerificationOpen(o => !o)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors shrink-0"
                    >
                        <h2 className="text-[10.5px] font-bold uppercase tracking-widest text-text-muted/70 flex items-center gap-2">
                            <Shield size={13} className="text-red" /> Horses List
                        </h2>
                        <ChevronDown size={13} className={`text-text-muted/70 transition-transform duration-200 ${verificationOpen ? "rotate-180" : ""}`} />
                    </button>
                    {verificationOpen && (
                        <div className="overflow-y-auto border-t border-border" style={{ maxHeight: 280 }}>
                            <div className="p-3 flex flex-col gap-2">
                                {horseOptions.map(horse => {
                                const isReview = horses.find(h => h.number === horse.number)?.gearStatus === "review";
                                const isSelected = selectedHorseRegId === horse.registrationId;
                                const liveData = liveHorses?.find(h => h.registrationId === horse.registrationId);
                                const position = liveData
                                    ? sortedByDist.findIndex(h => h.registrationId === horse.registrationId) + 1
                                    : null;
                                return (
                                    <div key={horse.registrationId} className={["rounded-xl border overflow-hidden", isReview ? "border-red-800/60 bg-red/5" : "border-border bg-white/[0.03]"].join(" ")}>
                                        <button
                                            onClick={() => setSelectedHorseRegId(id => id === horse.registrationId ? null : horse.registrationId)}
                                            className="w-full px-3 py-2.5 flex items-center gap-2.5 text-left hover:bg-white/[0.03] transition-colors"
                                        >
                                            <span className={["w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
                                                isReview ? "bg-red text-text" : "bg-white/8 text-text-muted"].join(" ")}>
                                                {horse.number}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className={["text-[13.5px] font-bold truncate", isReview ? "text-red" : "text-text"].join(" ")}>{horse.name}</p>
                                                <p className={["text-[11.5px]", isReview ? "text-red-600" : "text-text-muted"].join(" ")}>{horse.jockey}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {isReview
                                                    ? <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border border-red-800/60 text-red bg-red/10">Review</span>
                                                    : <CheckCircle2 size={16} className="text-green-500" />
                                                }
                                                <ChevronDown size={11} className={`text-text-muted/70 transition-transform duration-150 ${isSelected ? "rotate-180" : ""}`} />
                                            </div>
                                        </button>

                                        {isSelected && (
                                            <div className="px-3 pb-3 pt-2 border-t border-border/60 flex flex-col gap-1.5">
                                                {liveData ? (
                                                    <>
                                                        {position !== null && (
                                                            <div className="flex justify-between">
                                                                <span className="text-[10px] text-text-muted/70">Position</span>
                                                                <span className="text-[10px] font-bold text-amber">#{position}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between">
                                                            <span className="text-[10px] text-text-muted/70">Distance</span>
                                                            <span className="text-[10px] font-mono text-text">{liveData.currentDistance.toFixed(0)} m</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-[10px] text-text-muted/70">Speed</span>
                                                            <span className="text-[10px] font-mono text-text">{liveData.currentSpeed.toFixed(1)} m/s</span>
                                                        </div>

                                                        {liveData.isFinished && (
                                                            <>
                                                                <div className="mt-0.5 border-t border-border/60 pt-1.5 flex justify-between">
                                                                    <span className="text-[10px] text-text-muted/70">Finish</span>
                                                                    <span className="text-[10px] font-bold text-green">
                                                                        {liveData.finishPosition === 1 ? "1st" : liveData.finishPosition === 2 ? "2nd" : liveData.finishPosition === 3 ? "3rd" : `#${liveData.finishPosition}`}
                                                                    </span>
                                                                </div>
                                                                {liveData.finishTime !== null && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-[10px] text-text-muted/70">Time</span>
                                                                        <span className="text-[10px] font-mono text-text">{liveData.finishTime}</span>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p className="text-[10px] text-text-muted/70 text-center py-1">No live data yet</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
