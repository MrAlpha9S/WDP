import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { RefetchButton } from "../../components/RefetchButton";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { PHASE_CONFIG, derivePhase } from "../../shared/data/RaceData";
import type { RacePhase, HorseEntry } from "../../shared/types/RaceTypes";
import PreRacePage from "./Preracepage";
import LivePage from "./LivePage.tsx";
import PostRacePage from "./Postracepage.tsx";
import { RaceSocketContext } from "../../providers/useRaceSocket";
import type {
    RaceRoundDetail,
    RegistrationDetail,
    RaceUpdate,
    RaceFinishedPayload,
} from "../../providers/useRaceSocket";
import { refereeService } from "../../api/refereeService";
import { TOKEN_KEY } from "../../utils/constants";

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapHorses(registrations: RegistrationDetail[] = []): HorseEntry[] {
    return registrations.map((reg, idx) => {
        // Mirror PreRacePage: jockey comes from the Invitations array, not reg.Jockey
        const confirmedInv = reg.Invitations?.find(inv => inv.isJockeyInRace)
            ?? reg.Invitations?.find(inv => inv.jockeyConfirmation);
        const jockeyName = (confirmedInv?.jockeyId?._id as any)?.fullName
            ?? (reg.Jockey?._id as any)?.fullName  // secondary fallback
            ?? "No Jockey";
        const jockeyId = String(
            (confirmedInv?.jockeyId?._id as any)?._id
            ?? (reg.Jockey?._id as any)?._id
            ?? ""
        );
        return {
            number: idx + 1,
            name: reg.Horse?.horseName ?? `Horse #${idx + 1}`,
            jockey: jockeyName,
            trainer: "-",
            weight: "-",
            microchipId: "",
            photo: "",
            mainJockey: {
                id: jockeyId,
                name: jockeyName,
                license: "",
                role: "main",
                weight: "-",
            },
            backupJockey: { id: "", name: "N/A", license: "", role: "backup", weight: "-" },
            gearStatus: "cleared",
            jockeyStatus: "cleared",
            position: idx + 1,
            finishPosition: reg.RaceResult?.finishPosition,
            finishTime: reg.RaceResult?.finishTime,
            objection: false,
        };
    });
}

// ── Page header ───────────────────────────────────────────────────────────────

function PageHeader({ phase, raceRound, onBack, wsConnected, onRefetch, lastUpdated }: {
    phase: RacePhase;
    raceRound: RaceRoundDetail | null;
    onBack: () => void;
    wsConnected: boolean;
    onRefetch: () => void | Promise<void>;
    lastUpdated: number | null;
}) {
    const cfg = PHASE_CONFIG[phase];
    const title = raceRound?.roundName ?? "Race Monitor";
    const subtitle = [
        raceRound?.location,
        raceRound?.raceGround,
        raceRound?.trackLength ? `${raceRound.trackLength}m` : null,
    ].filter(Boolean).join(" · ");

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-5">
                <button onClick={onBack} className="flex items-center gap-2 text-[13px] text-gray-500 font-medium hover:text-gray-200 transition-colors group">
                    <ArrowLeft size={14} className="transition-transform duration-150 group-hover:-translate-x-0.5" />
                    Back to Tournaments
                </button>
                <RefetchButton onRefetch={onRefetch} lastUpdated={lastUpdated} />
            </div>
            <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${cfg.dot} ${"pulse" in cfg && wsConnected ? "animate-pulse" : ""}`} />
                <span className={`text-[11px] font-bold uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
            </div>
            <div>
                <h1
                    className="text-[26px] font-bold text-white leading-tight tracking-tight font-serif"
                >
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-[13px] text-gray-500 mt-0.5">{subtitle}</p>
                )}
            </div>
        </div>
    );
}

// ── Dev switcher (only rendered in dev builds) ────────────────────────────────

function DevSwitcher({ phase, onChange }: { phase: RacePhase; onChange: (p: RacePhase) => void }) {
    return (
        <div className="fixed bottom-5 right-5 z-50 bg-[#111] border border-white/15 rounded-2xl px-4 py-3 shadow-2xl shadow-black/60 flex flex-col gap-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">Dev · Phase</p>
            <div className="flex gap-2">
                {(["pre", "live", "post"] as RacePhase[]).map(p => (
                    <button key={p} onClick={() => onChange(p)}
                        className={[
                            "px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all",
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

// ── Entry point ───────────────────────────────────────────────────────────────

export default function RaceMonitorIndex() {
    const navigate = useNavigate();
    const { raceRoundId } = useParams<{ raceRoundId: string }>();

    const [raceRound, setRaceRound] = useState<RaceRoundDetail | null>(null);
    const [horses, setHorses] = useState<HorseEntry[]>([]);
    const [phase, setPhase] = useState<RacePhase>("pre");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<number | null>(null);

    // Live simulation state from socket
    const [liveUpdate, setLiveUpdate] = useState<RaceUpdate | null>(null);
    const [raceFinished, setRaceFinished] = useState<RaceFinishedPayload | null>(null);

    const refetchRaceRound = useCallback(async () => {
        if (!raceRoundId) {
            setError("No race round specified.");
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const res = await refereeService.getRaceRoundById(raceRoundId);
            if (res.code === 200 && res.data) {
                setRaceRound(res.data);
                setHorses(mapHorses(res.data.Registration ?? []));
                setPhase(derivePhase(res.data.status));
            } else {
                setError(res.msg ?? "Failed to load race round.");
            }
        } catch {
            setError("Failed to load race round.");
        } finally {
            setLoading(false);
            setLastUpdated(Date.now());
        }
    }, [raceRoundId]);

    // Fetch race round on mount
    useEffect(() => {
        refetchRaceRound();
    }, [refetchRaceRound]);

    // Shared WebSocket connection
    const socketRef = useRef<Socket | null>(null);
    const [wsConnected, setWsConnected] = useState(false);
    const [wsCount, setWsCount] = useState<number | null>(null);

    useEffect(() => {
        const socket = io(SOCKET_URL, { withCredentials: true });
        socketRef.current = socket;

        const token = localStorage.getItem(TOKEN_KEY) ?? '';

        socket.on('connect', () => {
            setWsConnected(true);
            if (raceRoundId) socket.emit('join_race', { raceRoundId, token });
        });
        socket.on('disconnect', () => setWsConnected(false));
        socket.on('test_ping', ({ count }: { count: number }) => setWsCount(count));

        // Real-time simulation tick
        socket.on('race_update', (payload: RaceUpdate) => {
            setLiveUpdate(payload);
            setPhase('live');
        });

        // Race simulation finished
        socket.on('race_finished', (payload: RaceFinishedPayload) => {
            setRaceFinished(payload);
            setPhase('post');
        });

        // Admin started / cancelled the race — refetch round so muxPlaybackId is current
        socket.on('race_status_changed', ({ status }: { status: string }) => {
            setPhase(derivePhase(status));
            if (status === 'running') refetchRaceRound();
        });

        return () => { socket.disconnect(); };
    }, [raceRoundId, refetchRaceRound]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center gap-4">
                <p className="text-[14px] text-red-400 font-medium">{error}</p>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => refetchRaceRound()}
                        className="flex items-center gap-1.5 text-[13px] font-semibold text-white bg-red-700 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        Retry
                    </button>
                    <button
                        onClick={() => navigate("/referee/tournaments")}
                        className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-200 transition-colors"
                    >
                        <ArrowLeft size={13} /> Back to Tournaments
                    </button>
                </div>
            </div>
        );
    }

    if (raceRound?.status === "cancelled") {
        return (
            <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center gap-4">
                <p className="text-[14px] text-gray-400">
                    <span className="font-semibold text-white">{raceRound.roundName}</span> has been cancelled.
                </p>
                <button
                    onClick={() => navigate("/referee/tournaments")}
                    className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-200 transition-colors"
                >
                    <ArrowLeft size={13} /> Back to Tournaments
                </button>
            </div>
        );
    }

    return (
        <RaceSocketContext.Provider value={{
            socket: socketRef.current,
            wsConnected,
            wsCount,
            raceRound,
            horses,
            liveUpdate,
            raceFinished,
        }}>
            <div className="min-h-screen bg-[#0f0f0f] font-sans">
                <div className="max-w-5xl mx-auto px-5 py-8">
                    <PageHeader phase={phase} raceRound={raceRound} onBack={() => navigate("/referee/tournaments")} wsConnected={wsConnected} onRefetch={refetchRaceRound} lastUpdated={lastUpdated} />
                    {phase === "pre" && <PreRacePage />}
                    {phase === "live" && <LivePage />}
                    {phase === "post" && <PostRacePage />}
                </div>

                <footer className="border-t border-white/8 py-4 mt-8">
                    <div className="max-w-5xl mx-auto px-5 flex items-center justify-between text-[12px] text-gray-600">
                        <span>© 2026 Equine Elite Management System</span>
                        <div className="flex items-center gap-4">
                            <a href="#" className="hover:text-gray-400 transition-colors">Help/Support</a>
                            <a href="#" className="hover:text-gray-400 transition-colors">Settings</a>
                            <a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
                        </div>
                        <span className="font-black uppercase tracking-widest text-gray-500 text-[11px] font-serif">
                            Equine Elite
                        </span>
                    </div>
                </footer>

                {import.meta.env.DEV && <DevSwitcher phase={phase} onChange={setPhase} />}
            </div>
        </RaceSocketContext.Provider>
    );
}
