import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import type { HorseEntry } from "../../shared/types/RaceTypes";
import { RaceSocketContext } from "../../providers/useRaceSocket";
import type {
    RaceRoundDetail,
    RegistrationDetail,
    RaceUpdate,
    RaceFinishedPayload,
} from "../../providers/useRaceSocket";
import { refereeService } from "../../api/refereeService";
import { horseOwnerService } from "../../api/horseOwnerService";
import { TOKEN_KEY } from "../../utils/constants";
import OwnerLivePage from "./OwnerLivePage";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapHorses(registrations: RegistrationDetail[] = []): HorseEntry[] {
    return registrations.map((reg, idx) => {
        const confirmedInv = reg.Invitations?.find(inv => inv.isJockeyInRace)
            ?? reg.Invitations?.find(inv => inv.jockeyConfirmation);
        const jockeyName = (confirmedInv?.jockeyId?._id as any)?.fullName
            ?? (reg.Jockey?._id as any)?.fullName
            ?? "No Jockey";
        return {
            number: idx + 1,
            name: reg.Horse?.horseName ?? `Horse #${idx + 1}`,
            jockey: jockeyName,
            trainer: "-",
            weight: "-",
            microchipId: "",
            photo: "",
            mainJockey: { id: "", name: jockeyName, license: "", role: "main", weight: "-" },
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

// ── Entry point ───────────────────────────────────────────────────────────────

export default function OwnerRaceMonitorIndex() {
    const navigate = useNavigate();
    const { raceRoundId } = useParams<{ raceRoundId: string }>();

    // Full race data (for all horses position track)
    const [raceRound, setRaceRound] = useState<RaceRoundDetail | null>(null);
    const [horses, setHorses] = useState<HorseEntry[]>([]);

    // Owner-scoped detail data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [ownerRegistration, setOwnerRegistration] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [ownerResult, setOwnerResult] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [violations, setViolations] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Live socket state
    const [liveUpdate, setLiveUpdate] = useState<RaceUpdate | null>(null);
    const [raceFinished, setRaceFinished] = useState<RaceFinishedPayload | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const [wsConnected, setWsConnected] = useState(false);
    const [wsCount, setWsCount] = useState<number | null>(null);

    // Fetch on mount
    useEffect(() => {
        if (!raceRoundId) { setError("No race round specified."); setLoading(false); return; }

        const load = async () => {
            try {
                const [fullRes, ownerRes] = await Promise.all([
                    refereeService.getRaceRoundById(raceRoundId),
                    horseOwnerService.getRaceDetail(raceRoundId),
                ]);
                if (fullRes.code === 200 && fullRes.data) {
                    setRaceRound(fullRes.data);
                    setHorses(mapHorses(fullRes.data.Registration ?? []));
                }
                if (ownerRes?.data) {
                    const ownerData = ownerRes.data;
                    // Merge raceRound from fullRes if ownerRes doesn't have it
                    if (!ownerData.raceRound && fullRes.data) {
                        ownerData.raceRound = fullRes.data;
                    }
                    setOwnerRegistration(ownerData.registration ?? null);
                    setOwnerResult(ownerData.registration?.raceResult ?? null);
                    setViolations(ownerData.registration?.violations ?? []);
                }
            } catch {
                setError("Failed to load race data.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [raceRoundId]);

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
        } catch { /* silent */ }
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
                refereeService.getRaceRoundById(raceRoundId)
                    .then(res => { if (res.code === 200 && res.data) setRaceRound(res.data); })
                    .catch(() => {});
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
            <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center gap-4">
                <p className="text-[14px] text-red-400 font-medium">{error}</p>
                <button onClick={() => navigate("/owner")} className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-200 transition-colors">
                    <ArrowLeft size={13} /> Back to Dashboard
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
            <div className="min-h-screen bg-[#0f0f0f]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <div className="max-w-5xl mx-auto px-5 py-8">
                    {/* Header */}
                    <div className="mb-6">
                        <button onClick={() => navigate("/owner")} className="flex items-center gap-2 text-[13px] text-gray-500 font-medium hover:text-gray-200 transition-colors mb-5 group">
                            <ArrowLeft size={14} className="transition-transform duration-150 group-hover:-translate-x-0.5" />
                            Back to Dashboard
                        </button>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[11px] font-bold uppercase tracking-widest text-red-400">Live Race</span>
                        </div>
                        <h1 className="text-[26px] font-bold text-white leading-tight tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
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
                    />
                </div>

                <footer className="border-t border-white/8 py-4 mt-8">
                    <div className="max-w-5xl mx-auto px-5 flex items-center justify-between text-[12px] text-gray-600">
                        <span>© 2024 Equine Elite Management System</span>
                        <span className="font-black uppercase tracking-widest text-gray-500 text-[11px]" style={{ fontFamily: "'Playfair Display', serif" }}>
                            Equine Elite
                        </span>
                    </div>
                </footer>
            </div>
        </RaceSocketContext.Provider>
    );
}
