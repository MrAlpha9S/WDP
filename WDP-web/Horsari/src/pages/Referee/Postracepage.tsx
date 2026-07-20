import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, Camera, Flag, Medal, Trophy, Video } from "lucide-react";
import { ordinal } from "../../shared/data/RaceData";
import { refereeService } from "../../api/refereeService";
import type { ViolationRecord } from "../../api/refereeService";
import MuxPlayer from "@mux/mux-player-react";

function VideoReviewPanel({ raceRound }: { raceRound: any }) {
    const playbackId = raceRound?.muxVodPlaybackId || raceRound?.muxPlaybackId;

    return (
        <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
                <h2 className="text-[13px] font-bold text-white flex items-center gap-2 font-serif">
                    <Video size={14} className="text-blue-400" /> Race Video Review
                </h2>
                {playbackId && <span className="text-[11px] text-gray-600 font-medium">VOD Playback</span>}
            </div>

            {/* Video player */}
            <div className="relative mx-4 mt-4 mb-4 rounded-xl overflow-hidden aspect-video bg-black">
                {playbackId ? (
                    <MuxPlayer
                        playbackId={playbackId}
                        className="w-full h-full"
                        style={{ aspectRatio: "16/9" }}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full text-gray-500">
                        <Video size={32} className="mb-2 opacity-50" />
                        <p className="text-[12px] font-medium">Recording is being processed...</p>
                        <p className="text-[10px] text-gray-600 mt-1">Check back shortly.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

type DistUnit = 'lengths' | 'metres';
const fmtLength = (l: number | null | undefined, unit: DistUnit = 'lengths'): string => {
    if (l == null || l === 0) return '—';
    if (unit === 'metres') return `+${(l * 2.4).toFixed(1)} m`;
    if (l <= 0.1)  return 'Nse';
    if (l <= 0.2)  return 'Hd';
    if (l <= 0.35) return 'Nk';
    const whole = Math.floor(l);
    const frac  = Math.round((l - whole) * 4) / 4;
    const f     = frac === 0 ? '' : frac === 0.25 ? '¼' : frac === 0.5 ? '½' : '¾';
    return whole === 0 ? `${f}L` : `${whole}${f}L`;
};

export default function PostRacePage() {
    const { raceRoundId } = useParams<{ raceRoundId: string }>();
    const [objectionResolved] = useState(false);
    const [published, setPublished] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    const [raceRound, setRaceRound] = useState<any>(null);
    const [distUnit, setDistUnit] = useState<DistUnit>('lengths');
    const [violations, setViolations] = useState<ViolationRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!raceRoundId) return;
        const fetchData = async () => {
            try {
                setLoading(true);
                const [raceRes, violRes] = await Promise.all([
                    refereeService.getRaceRoundById(raceRoundId),
                    refereeService.getRaceRoundViolations(raceRoundId)
                ]);
                setRaceRound(raceRes.data);
                setViolations(violRes.data ?? []);
            } catch (err) {
                console.error("Error fetching post-race data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [raceRoundId]);

    // Show all horses that were eligible to run (approved or verified),
    // excluding those that were rejected, failed pre-race checks, no-showed, or never processed.
    const EXCLUDED_STATUSES = new Set(['pending', 'failed', 'rejected', 'cancelled']);
    const registrations = (raceRound?.Registration || []).filter(
        (r: any) => !EXCLUDED_STATUSES.has(r.registrationStatus)
    );
    const sorted = [...registrations].sort((a: any, b: any) => {
        const posA = a.RaceResult?.finishPosition ?? 999;
        const posB = b.RaceResult?.finishPosition ?? 999;
        return posA - posB;
    });

    const hasObjection = violations.some(v => v.violationStatus === 'pending') && !objectionResolved;

    const handleDismiss = async (violationId: string) => {
        try {
            await refereeService.deleteViolation(violationId);
            setViolations(prev => prev.filter(v => v._id !== violationId));
        } catch (err) {
            console.error("Error dismissing violation:", err);
            alert("Failed to dismiss violation");
        }
    };

    const handlePenalize = async (violationId: string) => {
        try {
            await refereeService.confirmViolation(violationId);
            setViolations(prev => prev.map(v => v._id === violationId ? { ...v, violationStatus: 'confirmed' } : v));
        } catch (err) {
            console.error("Error confirming violation:", err);
            alert("Failed to confirm violation");
        }
    };

    const handlePublish = async () => {
        if (hasObjection || published || !raceRoundId || isPublishing) return;
        try {
            setIsPublishing(true);
            await refereeService.confirmRaceResult(raceRoundId);
            setPublished(true);
        } catch (err) {
            console.error("Error publishing results:", err);
            alert("Failed to publish results");
        } finally {
            setIsPublishing(false);
        }
    };

    if (loading) {
        return <div className="text-white p-5 flex items-center gap-3"><div className="w-5 h-5 border-2 border-t-blue-500 border-white/20 rounded-full animate-spin"/> Loading race results...</div>;
    }

    return (
        <div className="flex flex-col gap-5">
            {/* ─ Status badges ─────────────────────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 flex-wrap">
                {raceRound?.status === 'awaitingConfirmation' && (
                    <div className="flex items-center gap-2 self-start px-3 py-1.5 rounded-xl border border-amber-700/60 bg-amber-500/10 text-amber-400 text-[11px] font-bold font-mono">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        Awaiting Admin Confirmation
                    </div>
                )}
            </div>
            {/* ──────────────────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
            <div className="flex flex-col gap-5">

                {/* Finish order */}
                <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
                        <h2 className="text-[13px] font-bold text-white flex items-center gap-2 font-serif">
                            <Medal size={14} className="text-yellow-500" /> Official Finish Order
                        </h2>
                        <div className="flex items-center gap-2">
                            {hasObjection && (
                                <span className="flex items-center gap-1.5 text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-700/50 px-2.5 py-1 rounded-full animate-pulse">
                                    <AlertTriangle size={10} /> Objection Filed
                                </span>
                            )}
                            <div className="flex items-center gap-0.5 bg-white/5 border border-white/8 rounded-lg p-0.5">
                                {(['lengths', 'metres'] as DistUnit[]).map(u => (
                                    <button key={u} onClick={() => setDistUnit(u)}
                                        className={["text-[10px] font-bold font-mono px-2 py-1 rounded-md transition-all", distUnit === u ? "bg-white/15 text-white" : "text-gray-600 hover:text-gray-400"].join(" ")}>
                                        {u === 'lengths' ? 'L' : 'm'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="p-3 flex flex-col gap-2">
                        {sorted.map(reg => {
                            const horse = reg.Horse || {};
                            const confirmedInv = reg.Invitations?.find((inv: any) => inv.isJockeyInRace)
                                ?? reg.Invitations?.[0];
                            const jockeyName = (confirmedInv?.jockeyId?._id as any)?.fullName
                                ?? (confirmedInv?.jockeyId as any)?.fullName
                                ?? "Unknown Jockey";
                            const result = reg.RaceResult || {};
                            const pos = result.finishPosition ?? 0;
                            const posColor = pos === 1 ? "text-yellow-400" : pos === 2 ? "text-gray-300" : pos === 3 ? "text-amber-500" : "text-gray-600";
                            const posBg = pos === 1 ? "bg-yellow-600" : pos === 2 ? "bg-gray-500" : pos === 3 ? "bg-amber-700" : "bg-white/8";
                            
                            const hasHorseObjection = violations.some(v => {
                                const vRegId = typeof v.registrationId === 'string' ? v.registrationId : v.registrationId?._id;
                                return vRegId === reg._id && v.violationStatus === 'pending';
                            });

                            return (
                                <div key={reg._id} className={["rounded-xl border px-4 py-3 flex items-center gap-3",
                                    hasHorseObjection && !objectionResolved ? "border-red-800/60 bg-red-500/5"
                                        : pos > 0 && pos <= 3 ? "border-white/10 bg-white/[0.03]"
                                            : "border-white/6 bg-white/[0.02]"].join(" ")}
                                >
                                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-black shrink-0 text-white ${posBg}`}>{pos || "-"}</span>
                                    <span className="w-6 h-6 rounded-full bg-white/8 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">{horse.horseNumber || "?"}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={["text-[13.5px] font-bold",
                                            hasHorseObjection && !objectionResolved ? "text-red-400" : pos > 0 && pos <= 3 ? "text-white" : "text-gray-400"].join(" ")}>
                                            {horse.horseName || "Unknown Horse"}
                                        </p>
                                        <p className="text-[11.5px] text-gray-500 mt-0.5">{jockeyName}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`text-[13px] font-bold font-mono ${posColor}`}>{result.finishTime || "--:--"}</p>
                                        <p className={`text-[10px] font-bold uppercase mt-0.5 ${posColor}`}>{pos > 0 ? ordinal(pos) : "N/A"}</p>
                                        {result.distance != null && result.distance > 0 && (
                                            <p className="text-[10px] font-mono text-gray-500 mt-0.5">{fmtLength(result.distance, distUnit)}</p>
                                        )}
                                    </div>
                                    {hasHorseObjection && !objectionResolved && (
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
                <VideoReviewPanel raceRound={raceRound} />

                {/* Incident review */}
                <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-white/8">
                        <h2 className="text-[13px] font-bold text-white font-serif">Incident Review</h2>
                    </div>
                    <div className="p-3 flex flex-col gap-2">
                        {violations.map(inc => {
                            const regId = typeof inc.registrationId === 'string' ? inc.registrationId : inc.registrationId?._id;
                            const reg = registrations.find((r: any) => r._id === regId);
                            const horseName = reg?.Horse?.horseName || "Unknown Horse";

                            return (
                                <div key={inc._id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/6">
                                    <AlertTriangle size={13} className="text-red-500 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold text-white">{inc.violationTypeId?.violationName || "Unknown Violation"}</p>
                                        <p className="text-[11.5px] text-gray-500 mt-0.5">{horseName} &nbsp;·&nbsp; {inc.description || "No description"}</p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        {inc.violationStatus === 'pending' ? (
                                            <>
                                                <button onClick={() => handleDismiss(inc._id)} className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-green-700/50 text-green-400 bg-green-500/10 hover:bg-green-500/20 transition-all">Dismiss</button>
                                                <button onClick={() => handlePenalize(inc._id)} className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-red-700/50 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all">Penalize</button>
                                            </>
                                        ) : (
                                            <span className="text-[11px] font-bold text-gray-500 capitalize">{inc.violationStatus}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {violations.length === 0 && (
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
                        { label: "Winner", value: sorted.length > 0 && sorted[0].RaceResult?.finishPosition === 1 ? sorted[0].Horse?.horseName : "Pending" },
                        { label: "Time", value: sorted.length > 0 && sorted[0].RaceResult?.finishPosition === 1 ? sorted[0].RaceResult?.finishTime : "--:--" },
                        { label: "Margin", value: fmtLength(sorted[0]?.RaceResult?.distance, distUnit) },
                        { label: "Incidents", value: `${violations.length}` },
                        { label: "Objections", value: objectionResolved ? `${violations.length} (resolved)` : `${violations.filter(v => v.violationStatus === 'pending').length} (pending)` },
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
                        onClick={handlePublish}
                        disabled={hasObjection || published || isPublishing}
                        className={["w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold uppercase tracking-widest transition-all duration-150",
                            published ? "bg-green-700 text-white cursor-default"
                                : hasObjection ? "bg-white/5 border border-white/8 text-gray-600 cursor-not-allowed"
                                    : "bg-green-700 text-white hover:bg-green-600 shadow-lg shadow-green-900/30",
                        ].join(" ")}
                    >
                        <Trophy size={14} />
                        {isPublishing ? "Publishing..." : published ? "Results Published ✓" : hasObjection ? "Awaiting Objection" : "Publish Official Results"}
                    </button>
                </div>
            </div>
            </div>{/* end grid */}
        </div>
    );
}