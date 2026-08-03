import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { RefetchButton } from "../../components/RefetchButton";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { PHASE_CONFIG, derivePhase } from "../../shared/data/RaceData";
import { RaceSocketContext } from "../../providers/useRaceSocket";
import type {
    RaceRoundDetail,
    RaceUpdate,
    RaceFinishedPayload,
} from "../../providers/useRaceSocket";
import { horseOwnerService, type RaceCompetition } from "../../api/horseOwnerService";
import { TOKEN_KEY } from "../../utils/constants";
import OwnerLivePage from "./OwnerLivePage";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Owner-facing copy for each RaceRound.status value (color/dot still come from PHASE_CONFIG).
function ownerStatusLabel(status?: string): string {
    switch (status) {
        case "running": return "Live Race";
        case "completed": return "Race Finished";
        case "awaitingConfirmation": return "Awaiting Confirmation";
        default: return "Upcoming Race"; // draft, scheduled, prepared, or unknown
    }
}

// ── Entry point ───────────────────────────────────────────────────────────────

export default function OwnerRaceMonitorIndex() {
    const navigate = useNavigate();
    const { raceRoundId } = useParams<{ raceRoundId: string }>();

    // Full race data (for the stream + track view)
    const [raceRound, setRaceRound] = useState<RaceRoundDetail | null>(null);

    // Owner-scoped detail data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [ownerRegistration, setOwnerRegistration] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [ownerResult, setOwnerResult] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [violations, setViolations] = useState<any[]>([]);
    // Roster of other confirmed entries — independent of the live socket feed,
    // so it's available before the race starts (status: 'prepared') when no
    // race_update has fired yet.
    const [competition, setCompetition] = useState<RaceCompetition | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<number | null>(null);

    // Live socket state
    const [liveUpdate, setLiveUpdate] = useState<RaceUpdate | null>(null);
    const [raceFinished, setRaceFinished] = useState<RaceFinishedPayload | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const [wsConnected, setWsConnected] = useState(false);
    const [wsCount, setWsCount] = useState<number | null>(null);

    // Full refetch — raceRound plus owner-scoped registration/result/violations
    const load = useCallback(async () => {
        if (!raceRoundId) { setError("No race round specified."); setLoading(false); return; }
        try {
            setLoading(true);
            setError(null);
            const ownerRes = await horseOwnerService.getRaceDetail(raceRoundId);
            if (ownerRes?.data) {
                const ownerData = ownerRes.data;
                if (ownerData.raceRound) {
                    setRaceRound(ownerData.raceRound as unknown as RaceRoundDetail);
                }
                setOwnerRegistration(ownerData.registration ?? null);
                setOwnerResult(ownerData.registration?.raceResult ?? null);
                setViolations(ownerData.registration?.violations ?? []);
                setCompetition(ownerData.competition ?? null);
            }
        } catch {
            setError("Failed to load race data.");
        } finally {
            setLoading(false);
            setLastUpdated(Date.now());
        }
    }, [raceRoundId]);

    // Fetch on mount
    useEffect(() => {
        load();
    }, [load]);

    // Refresh owner detail (called when results are confirmed)
    const refreshOwnerDetail = async () => {
        if (!raceRoundId) return;
        try {
            const res = await horseOwnerService.getRaceDetail(raceRoundId);
            if (res?.data?.registration) {
                setOwnerRegistration(res.data.registration);
                setOwnerResult(res.data.registration.raceResult ?? null);
                setViolations(res.data.registration.violations ?? []);
            }
            if (res?.data) {
                setCompetition(res.data.competition ?? null);
            }
        } catch { /* silent */ } finally {
            setLastUpdated(Date.now());
        }
    };

    // WebSocket
    useEffect(() => {
        const socket = io(SOCKET_URL, { withCredentials: true });
        socketRef.current = socket;
        const token = localStorage.getItem(TOKEN_KEY) ?? "";

        socket.on("connect", () => {
            setWsConnected(true);
            if (raceRoundId) socket.emit("join_race", { raceRoundId, token });
        });
        socket.on("disconnect", () => setWsConnected(false));
        socket.on("test_ping", ({ count }: { count: number }) => setWsCount(count));
        socket.on("race_update", (payload: RaceUpdate) => setLiveUpdate(payload));
        socket.on("race_finished", (payload: RaceFinishedPayload) => setRaceFinished(payload));
        socket.on("race_status_changed", ({ status }: { status: string }) => {
            if (status === "running" && raceRoundId) {
                horseOwnerService.getRaceDetail(raceRoundId)
                    .then(res => { if (res?.data?.raceRound) setRaceRound(res.data.raceRound as unknown as RaceRoundDetail); })
                    .catch(() => { });
            }
        });
        // Real-time violation events
        socket.on("violation_created", ({ violation }: { violation: any }) => {
            setViolations(prev => [...prev, violation]);
        });
        socket.on("violation_deleted", ({ violationId }: { violationId: string }) => {
            setViolations(prev => prev.filter(v => v._id !== violationId));
        });
        // Official results confirmed — re-fetch owner detail for updated result/disqualification
        socket.on("race_results_confirmed", () => {
            refreshOwnerDetail();
        });

        return () => { socket.disconnect(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [raceRoundId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4">
                <p className="text-[14px] text-red-400 font-medium">{error}</p>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => load()}
                        className="flex items-center gap-1.5 text-[13px] font-semibold text-white bg-red-700 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        Retry
                    </button>
                    <button onClick={() => navigate("/owner")} className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-200 transition-colors">
                        <ArrowLeft size={13} /> Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (raceRound?.status === "cancelled") {
        return (
            <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4">
                <p className="text-[14px] text-gray-400">
                    <span className="font-semibold text-white">{raceRound.roundName}</span> has been cancelled.
                </p>
                <button onClick={() => navigate("/owner")} className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-200 transition-colors">
                    <ArrowLeft size={13} /> Back to Dashboard
                </button>
            </div>
        );
    }

    const phase = derivePhase(raceRound?.status);
    const phaseCfg = PHASE_CONFIG[phase];

    return (
        <RaceSocketContext.Provider value={{
            socket: socketRef.current,
            wsConnected,
            wsCount,
            raceRound,
            horses: [],
            liveUpdate,
            raceFinished,
        }}>
            <div className="min-h-screen bg-bg font-sans">
                <div className="max-w-5xl mx-auto px-5 py-8">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-5">
                            <button onClick={() => navigate("/owner")} className="flex items-center gap-2 text-[13px] text-gray-500 font-medium hover:text-gray-200 transition-colors group">
                                <ArrowLeft size={14} className="transition-transform duration-150 group-hover:-translate-x-0.5" />
                                Back to Dashboard
                            </button>
                            <RefetchButton onRefetch={load} lastUpdated={lastUpdated} />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`w-2 h-2 rounded-full ${phaseCfg.dot} ${"pulse" in phaseCfg && wsConnected ? "animate-pulse" : ""}`} />
                            <span className={`text-[11px] font-bold uppercase tracking-widest ${phaseCfg.color}`}>{ownerStatusLabel(raceRound?.status)}</span>
                        </div>
                        <h1 className="text-[26px] font-bold text-white leading-tight tracking-tight font-serif">
                            {raceRound?.roundName ?? "Race Monitor"}
                        </h1>
                        <p className="text-[13px] text-gray-500 mt-0.5">
                            {[raceRound?.location, raceRound?.raceGround, raceRound?.trackLength ? `${raceRound.trackLength}m` : null].filter(Boolean).join(" · ")}
                        </p>
                    </div>

                    <OwnerLivePage
                        ownerRegistration={ownerRegistration}
                        ownerResult={ownerResult}
                        violations={violations}
                        competition={competition}
                    />
                </div>

                <footer className="border-t border-border py-4 mt-8">
                    <div className="max-w-5xl mx-auto px-5 flex items-center justify-between text-[12px] text-gray-600">
                        <span>© 2026 Equine Elite Management System</span>
                        <span className="font-black uppercase tracking-widest text-gray-500 text-[11px] font-serif">
                            Equine Elite
                        </span>
                    </div>
                </footer>
            </div>
        </RaceSocketContext.Provider>
    );
}
