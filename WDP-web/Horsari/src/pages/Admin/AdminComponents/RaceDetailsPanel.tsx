import { useState, useEffect, useCallback } from "react";
import {
    Shield, X, AlertCircle, Loader2, Calendar, Clock, Tag, Ban, Pencil,
    Map, Flag, Users, DollarSign, Trophy, Play, CheckCircle2, Radio,
    Copy, Check, Video, Tv, TriangleAlert, TrendingUp, BarChart2, Percent, Wand2
} from "lucide-react";
import type { ScheduledRace } from "../../../shared/types/RaceTypes";
import { adminService } from "../../../api/adminService";
import { useSocket } from "../../../providers/SocketProvider";
import { useScheduleGate } from "../../../utils/raceDayUtil";
import { ScheduleConfirmModal } from "../../../components/ScheduleConfirmModal";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";

interface RaceDetailsPanelProps {
    selectedRace?: ScheduledRace;
    onRefresh?: () => void;
    onEdit?: () => void;
    onClose?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
    accepted: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    pending: "bg-amber-500/15  text-amber-400  border-amber-500/30",
    rejected: "bg-red-500/15    text-red-400    border-red-500/30",
    assigned: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};
const STATUS_LABEL: Record<string, string> = {
    accepted: "Accepted",
    pending: "Pending",
    rejected: "Rejected",
    assigned: "Assigned",
};

const VIOLATION_STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-500/15   text-amber-400   border-amber-500/30",
    confirmed: "bg-red-500/15     text-red-400     border-red-500/30",
    dismissed: "bg-white/5        text-gray-500    border-border",
};
const VIOLATION_PHASE_BADGE: Record<string, string> = {
    'pre-race': "bg-violet-500/15 text-violet-400 border border-violet-500/30",
    'during-race': "bg-blue-500/15   text-blue-400   border border-blue-500/30",
    'after-race': "bg-orange-500/15 text-orange-400 border border-orange-500/30",
};
const VIOLATION_SEVERITY_COLOR: string[] = ['', 'text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-400', 'text-red-500'];
const VIOLATION_STEWARD_STYLES: Record<string, string> = {
    'no-action': 'text-gray-400',
    warning: 'text-yellow-400',
    fine: 'text-orange-400',
    suspended: 'text-red-400',
    disqualified: 'text-red-500',
    demoted: 'text-orange-500',
    investigation: 'text-blue-400',
    'permanent-ban': 'text-red-600',
};
const fmtViolationDate = (raw?: string | null) => {
    if (!raw) return null;
    return new Date(raw).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};




function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { }
    };
    return (
        <button
            onClick={handleCopy}
            className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title="Copy to clipboard"
        >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
        </button>
    );
}

export default function RaceDetailsPanel({ selectedRace, onRefresh, onEdit, onClose }: RaceDetailsPanelProps) {
    const [isCancelling, setIsCancelling] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [isQuickAssigning, setIsQuickAssigning] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [quickAssignResult, setQuickAssignResult] = useState<string | null>(null);

    // Tab State
    const [activeTab, setActiveTab] = useState<'overview' | 'registrations' | 'referees' | 'pools' | 'violations' | 'stream'>('overview');
    const [distUnit, setDistUnit] = useState<'lengths' | 'metres'>('lengths');
    const fmtLength = (l: number | null | undefined) => {
        if (l == null || l === 0) return '—';
        if (distUnit === 'metres') return `+${(l * 2.4).toFixed(1)} m`;
        if (l <= 0.1) return 'Nse';
        if (l <= 0.2) return 'Hd';
        if (l <= 0.35) return 'Nk';
        const whole = Math.floor(l);
        const frac = Math.round((l - whole) * 4) / 4;
        const f = frac === 0 ? '' : frac === 0.25 ? '¼' : frac === 0.5 ? '½' : '¾';
        return whole === 0 ? `${f}L` : `${whole}${f}L`;
    };

    const [detailedParticipants, setDetailedParticipants] = useState<any[]>([]);
    const [detailedReferees, setDetailedReferees] = useState<any[]>([]);
    const [detailedViolations, setDetailedViolations] = useState<any[]>([]);
    const [detailedOverview, setDetailedOverview] = useState<any>(null);
    const [detailedPools, setDetailedPools] = useState<any[]>([]);
    const [detailedTrackEarnings, setDetailedTrackEarnings] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Stream / VOD state
    const [streamInfo, setStreamInfo] = useState<any>(null);
    const [streamLoading, setStreamLoading] = useState(false);
    const [streamError, setStreamError] = useState<string | null>(null);
    const [vodInfo, setVodInfo] = useState<any>(null);
    const [vodLoading, setVodLoading] = useState(false);
    const [vodError, setVodError] = useState<string | null>(null);

    const fetchDetails = useCallback(() => {
        if (!selectedRace?.id) return;
        setLoadingDetails(true);
        adminService.getRaceRoundDetail(selectedRace.id)
            .then(res => {
                if (res.data) {
                    const data: any = res.data;
                    setDetailedOverview({
                        location: data.location,
                        raceDate: data.raceDate,
                        address: data.address,
                        trackLength: data.trackLength,
                        raceGround: data.raceGround,
                        maxParticipants: data.maxParticipants,
                        raceType: data.RaceType || data.raceType,
                        firstPlacePrize: data.firstPlacePrize,
                        secondPlacePrize: data.secondPlacePrize,
                        thirdPlacePrize: data.thirdPlacePrize,
                        currencyType: data.currencyType || "VND",
                    });

                    const parts = (res.data.Registration || []).map((reg: any) => ({
                        registrationId: reg._id,
                        ownerName: reg.Owner?.fullName ?? null,
                        horseName: reg.Horse?.horseName ?? null,
                        // Only surface the jockey once their invitation has actually
                        // been accepted — a still-pending invite shouldn't read as a
                        // confirmed jockey assignment.
                        jockeyName: reg.JockeyInvitationStatus === 'accepted' ? (reg.Jockey?._id?.fullName ?? null) : null,
                        isJockeyInRace: reg.isJockeyInRace ?? false,
                        status: reg.registrationStatus ?? 'pending',
                        sum_prediction: reg.sum_prediction,
                        raceResult: reg.RaceResult,
                        prizePayment: reg.prizePayment ?? null,
                        jockeyPayment: reg.jockeyPayment ?? null,
                    }));

                    // Violations for this race — cross-referenced against `parts` for
                    // horse/jockey display names, and split out by phase so pre-race
                    // ones can be attached to their owning registration card.
                    // (Plain objects, not `Map`, since the `Map` identifier here is
                    // shadowed by the lucide-react `Map` icon imported above.)
                    const violationsRaw: any[] = (res.data as any).Violations || [];
                    const regIdOf = (v: any) => v.registrationId ? (typeof v.registrationId === 'string' ? v.registrationId : v.registrationId?._id) : null;
                    const regById: Record<string, any> = {};
                    parts.forEach((p: any) => { regById[p.registrationId] = p; });
                    const viols = violationsRaw.map((v: any) => {
                        const reg: any = regById[regIdOf(v)];
                        return {
                            ...v,
                            horseName: reg?.horseName ?? null,
                            jockeyName: reg?.jockeyName ?? null,
                        };
                    });
                    setDetailedViolations(viols);

                    const preRaceByReg: Record<string, any[]> = {};
                    violationsRaw.forEach((v: any) => {
                        if (v.violationTypeId?.type !== 'pre-race') return;
                        const rid = regIdOf(v);
                        if (!rid) return;
                        (preRaceByReg[rid] ||= []).push(v);
                    });
                    const partsWithViolations = parts.map((p: any) => ({
                        ...p,
                        preRaceViolations: preRaceByReg[p.registrationId] || [],
                    }));
                    setDetailedParticipants(partsWithViolations);

                    const refs = (res.data.Referee || []).map((ref: any) => ({
                        refereeId: ref.refereeId,
                        fullName: ref.fullName ?? null,
                        assignmentStatus: ref.assignmentStatus ?? 'pending',
                        fee: ref.fee,
                        payment: ref.payment ?? null,
                    }));
                    setDetailedReferees(refs);

                    setDetailedPools(res.data.predictionPools || []);
                    setDetailedTrackEarnings(res.data.trackEarnings || null);
                }
            })
            .catch(err => console.error("Failed to fetch detailed race info", err))
            .finally(() => setLoadingDetails(false));
    }, [selectedRace?.id]);



    const fetchStreamInfo = useCallback(() => {
        if (!selectedRace?.id) return;
        setStreamLoading(true);
        setStreamError(null);
        adminService.getStreamInfo(selectedRace.id)
            .then(res => { if (res.data) setStreamInfo(res.data); })
            .catch(err => setStreamError(err?.msg || 'Failed to load stream info'))
            .finally(() => setStreamLoading(false));
    }, [selectedRace?.id]);

    const fetchVOD = useCallback(() => {
        if (!selectedRace?.id) return;
        setVodLoading(true);
        setVodError(null);
        adminService.getVOD(selectedRace.id)
            .then(res => { if (res.data) setVodInfo(res.data); })
            .catch(err => setVodError(err?.msg || 'VOD not yet available'))
            .finally(() => setVodLoading(false));
    }, [selectedRace?.id]);

    useEffect(() => {
        if (selectedRace?.id) {
            fetchDetails();
            setStreamInfo(null);
            setVodInfo(null);
            setStreamError(null);
            setVodError(null);
            setActionError(null);
            setActiveTab('overview');
            // Pre-load stream key for prepared races so the UI shows existing credentials
            if (selectedRace.status === 'prepared') {
                fetchStreamInfo();
            }
        } else {
            setDetailedParticipants([]);
            setDetailedReferees([]);
            setDetailedOverview(null);
            setDetailedPools([]);
            setDetailedTrackEarnings(null);
            setDetailedViolations([]);
        }
        // updatedAt (a real RaceRound field, set by Mongoose timestamps) changes
        // whenever this race is actually saved, so this only refetches on an
        // actual edit — not on every unrelated re-render of the parent.
    }, [selectedRace?.id, (selectedRace as any)?.updatedAt]);

    // Any RaceRound mutation from any source broadcasts raceround_updated —
    // refetch this panel's detail live instead of relying solely on the
    // parent re-passing an updated selectedRace.
    const { socket } = useSocket();
    useEffect(() => {
        if (!socket || !selectedRace?.id) return;
        const handler = () => fetchDetails();
        socket.on("raceround_updated", handler);
        return () => { socket.off("raceround_updated", handler); };
    }, [socket, selectedRace?.id, fetchDetails]);

    // When stream tab is opened for a running/awaitingConfirmation race, auto-fetch
    useEffect(() => {
        if (activeTab === 'stream' && selectedRace?.id) {
            if ((selectedRace.status === 'running' || selectedRace.status === 'awaitingConfirmation') && !streamInfo && !streamLoading) {
                fetchStreamInfo();
            }
            if (selectedRace.status === 'completed' && !vodInfo && !vodLoading) {
                fetchVOD();
            }
        }
    }, [activeTab]);

    // ── Action Handlers ────────────────────────────────────────────────────────

    const detailedRaceDate: string | undefined = detailedOverview?.raceDate;
    const startGate = useScheduleGate(detailedRaceDate, { requireStartTime: true });

    const doStartRace = async (override: boolean) => {
        if (!selectedRace) return;
        setIsStarting(true);
        setActionError(null);
        try {
            let liveStream = streamInfo;
            if (!liveStream) {
                setStreamError(null);
                try {
                    const streamRes = await adminService.createStream(selectedRace.id);
                    liveStream = streamRes.data;
                    if (liveStream) setStreamInfo(liveStream);
                } catch (streamErr: any) {
                    setActionError(streamErr?.msg || 'Failed to create stream key');
                    return;
                }
            }
            await adminService.setRaceRoundStatus(selectedRace.id, 'running', override);
            if (onRefresh) onRefresh();
            fetchDetails();
        } catch (error: any) {
            setActionError(error?.msg || 'Failed to start race');
        } finally {
            setIsStarting(false);
            startGate.close();
        }
    };

    const handleStartRace = () => {
        if (!selectedRace) return;
        if (startGate.needsConfirm) {
            startGate.open();
            return;
        }
        doStartRace(false);
    };

    const handleCancelRace = async () => {
        if (!selectedRace) return;
        setIsCancelling(true);
        setActionError(null);
        try {
            await adminService.setRaceRoundStatus(selectedRace.id, 'cancelled');
            setIsCancelModalOpen(false);
            if (onRefresh) onRefresh();
            fetchDetails();
        } catch (error: any) {
            setActionError(error?.msg || 'Failed to cancel race');
        } finally {
            setIsCancelling(false);
        }
    };

    const handleQuickAssign = async () => {
        if (!selectedRace) return;
        setIsQuickAssigning(true);
        setActionError(null);
        setQuickAssignResult(null);
        try {
            const res = await adminService.quickAssignHorsesAndJockeys(selectedRace.id);
            setQuickAssignResult(res.msg);
            fetchDetails();
        } catch (error: any) {
            setActionError(error?.msg || 'Failed to quick-assign horses and jockeys');
        } finally {
            setIsQuickAssigning(false);
        }
    };

    if (!selectedRace) return null;

    // Registrations holding a real race slot right now — accepted (pre-race)
    // or verified (post-referee-review) — vs. the round's participant cap.
    const acceptedRegistrationCount = detailedParticipants.filter(
        (p: any) => p.status === 'accepted' || p.status === 'verified'
    ).length;
    const maxSlots = detailedOverview?.maxParticipants || selectedRace.maxSlots;

    const status = selectedRace.status;
    const isScheduled = status === 'scheduled';
    const isPrepared = status === 'prepared';
    const isRunning = status === 'running';
    const isAwaitingConfirmation = status === 'awaitingConfirmation';
    const isCompleted = status === 'completed';
    const isCancelled = status === 'cancelled';

    const tabs: Array<{ key: 'overview' | 'registrations' | 'referees' | 'pools' | 'violations' | 'stream'; label: string }> = [
        { key: 'overview', label: 'Overview' },
        { key: 'registrations', label: 'Registrations' },
        { key: 'referees', label: 'Referees' },
        { key: 'pools', label: 'Pools' },
        { key: 'violations', label: 'Violations' },
    ];
    if (isRunning || isAwaitingConfirmation || isCompleted) {
        tabs.push({ key: 'stream', label: isRunning || isAwaitingConfirmation ? '🔴 Stream' : 'VOD' });
    }

    return (
        <aside
            className="h-full bg-surface border border-border/60 rounded-xl flex flex-col overflow-hidden shadow-lg shadow-black/20"
            style={{ animation: "panelIn 0.18s ease-out" }}
        >
            <style>{`@keyframes panelIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }`}</style>

            <div className="flex flex-col flex-1 min-h-0">
                {/* ── Header ── */}
                <div className="px-5 py-5 shrink-0 border-b border-border/60 bg-surface">
                    <div className="flex flex-col gap-1 mb-3">
                        <div className="flex justify-between items-start w-full gap-4">
                            <div className="flex flex-col gap-2">
                                <h2 className={`text-[22px] font-bold tracking-tight leading-tight ${isCancelled ? 'text-text-muted line-through' : 'text-text'}`}>
                                    {selectedRace.title}
                                </h2>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border inline-block ${isCancelled ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                                        status === 'scheduled' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                                            isRunning ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                                                isAwaitingConfirmation ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' :
                                                    isCompleted ? 'bg-gray-500/15 text-gray-400 border-gray-500/30' :
                                                        isPrepared ? 'bg-violet-500/15 text-violet-400 border-violet-500/30' :
                                                            'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                        }`}>
                                        {isRunning ? (
                                            <span className="flex items-center gap-1">
                                                <Radio size={8} className="animate-pulse" /> {status}
                                            </span>
                                        ) : status}
                                    </span>
                                    <span className="text-[14px] font-medium text-gold">{selectedRace.tournament}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 pt-1">
                                {isScheduled && detailedParticipants.length > 0 && (
                                    <div className="relative group flex items-center justify-center">
                                        <button
                                            onClick={handleQuickAssign}
                                            disabled={isQuickAssigning}
                                            className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded border border-amber-500/20 transition-colors disabled:opacity-50"
                                            title="Debug: Quick-Assign"
                                        >
                                            {isQuickAssigning ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                                        </button>
                                        <div className="pointer-events-none absolute top-full right-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 w-64 bg-surface border border-amber-500/20 rounded-lg p-3 text-[11px] text-gray-400 shadow-xl">
                                            <span className="block font-bold text-amber-500 mb-1">Debug: Quick-Assign</span>
                                            Auto-pick an eligible horse + jockey for registrations. Leaves already-ready ones untouched. Doesn't verify or start the race.
                                        </div>
                                    </div>
                                )}
                                <button
                                    onClick={onEdit}
                                    disabled={isCompleted || isPrepared}
                                    className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded border border-blue-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-500/10"
                                    title={isCompleted ? "Completed races can't be edited" : isPrepared ? "Prepared races can't be edited — cancel and recreate if changes are needed" : "Edit Race"}
                                >
                                    <Pencil size={14} />
                                </button>
                                {!isCancelled && !isCompleted && !isRunning && !isAwaitingConfirmation && (
                                    <button
                                        onClick={() => setIsCancelModalOpen(true)}
                                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded border border-red-500/20 transition-colors"
                                        title="Cancel Race"
                                    >
                                        <Ban size={14} />
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-1.5 bg-white/5 hover:bg-white/10 text-text-muted hover:text-text rounded border border-border transition-colors ml-1 cursor-pointer"
                                    title="Close Panel"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-medium text-gray-400">
                        <span className="flex items-center gap-1.5 whitespace-nowrap"><Calendar size={14} className="text-gray-500" /> {selectedRace.date}</span>
                        <span className="flex items-center gap-1.5 whitespace-nowrap"><Clock size={14} className="text-gray-500" /> {selectedRace.time}</span>
                        {(detailedOverview?.RaceType || detailedOverview?.raceType || selectedRace.raceType) && (
                            <span className="flex items-center gap-1.5 whitespace-nowrap"><Tag size={14} className="text-gray-500" /> {detailedOverview?.RaceType || detailedOverview?.raceType || selectedRace.raceType}</span>
                        )}
                    </div>

                    {/* ── Action Messages ── */}
                    {(quickAssignResult || actionError) && (
                        <div className="mt-4 flex flex-col gap-2">
                            {quickAssignResult && (
                                <div className="flex items-center gap-2 text-[12px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                                    <CheckCircle2 size={13} className="shrink-0" />
                                    {quickAssignResult}
                                </div>
                            )}
                            {actionError && (
                                <div className="flex items-center gap-2 text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                    <TriangleAlert size={13} className="shrink-0" />
                                    {actionError}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Action Buttons ── */}
                    {(isPrepared || isRunning || isAwaitingConfirmation) && (
                        <div className="mt-4 flex flex-col gap-2">
                            {isPrepared && (
                                <button
                                    onClick={handleStartRace}
                                    disabled={isStarting}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
                                >
                                    {isStarting ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} fill="white" />}
                                    {isStarting ? 'Starting Race…' : 'Start Race'}
                                </button>
                            )}
                            {isRunning && (
                                <div className="flex items-start gap-2 text-[12px] text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2.5">
                                    <Loader2 size={13} className="animate-spin shrink-0 mt-0.5" />
                                    <span>Race is in progress. Waiting for the race to finish and referee to submit results before you can confirm.</span>
                                </div>
                            )}
                            {isAwaitingConfirmation && (
                                <>
                                    <div className="flex items-start gap-2 text-[12px] text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2.5">
                                        <CheckCircle2 size={13} className="shrink-0 mt-0.5 text-orange-400" />
                                        <span>Awaiting Referee race results confirmation</span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Tabs ── */}
                <div className="flex items-center border-b border-border/60 shrink-0 bg-surface">
                    {tabs.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors border-b-2 ${activeTab === key
                                ? "text-gold border-gold bg-gold/5"
                                : "text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5"
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* ── Tab Content ── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-4 relative">
                    {loadingDetails && (
                        <div className="absolute inset-0 z-10 bg-surface/80 backdrop-blur-sm flex items-center justify-center">
                            <Loader2 size={32} className="animate-spin text-red-500" />
                        </div>
                    )}

                    {/* ── Overview Tab ── */}
                    {activeTab === 'overview' && (
                        <div className="flex flex-col gap-4">
                            <div className="bg-surface p-4 rounded-xl border border-border/60 flex flex-col gap-4">
                                <h3 className="text-[13px] font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                                    <Map size={16} className="text-gray-500" /> Location Details
                                </h3>
                                <div className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-4 text-[13px]">
                                    <span className="text-gray-500 font-medium">Location</span>
                                    <span className="text-white">{detailedOverview?.location || <span className="text-gray-600 italic">N/A</span>}</span>
                                    <span className="text-gray-500 font-medium">Address</span>
                                    <span className="text-white">{detailedOverview?.address || <span className="text-gray-600 italic">N/A</span>}</span>
                                    <span className="text-gray-500 font-medium">Race Ground</span>
                                    <span className="text-white">{detailedOverview?.raceGround || <span className="text-gray-600 italic">N/A</span>}</span>
                                </div>
                            </div>

                            <div className="bg-surface p-4 rounded-xl border border-border/60 flex flex-col gap-4">
                                <h3 className="text-[13px] font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                                    <Flag size={16} className="text-gray-500" /> Track & Limits
                                </h3>
                                <div className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-4 text-[13px]">
                                    <span className="text-gray-500 font-medium">Track Length</span>
                                    <span className="text-white">{detailedOverview?.trackLength ? `${detailedOverview.trackLength}m` : <span className="text-gray-600 italic">N/A</span>}</span>
                                    <span className="text-gray-500 font-medium">Max Slots</span>
                                    <span className="text-white">{maxSlots || <span className="text-gray-600 italic">N/A</span>}</span>
                                    <span className="text-gray-500 font-medium">Accepted</span>
                                    <span className={`font-semibold ${maxSlots && acceptedRegistrationCount >= maxSlots ? 'text-amber-400' : 'text-white'}`}>
                                        {maxSlots ? `${acceptedRegistrationCount} / ${maxSlots}` : acceptedRegistrationCount}
                                    </span>
                                    <span className="text-gray-500 font-medium">Race Type</span>
                                    <span className="text-white">{detailedOverview?.RaceType || detailedOverview?.raceType || selectedRace.raceType || <span className="text-gray-600 italic">N/A</span>}</span>
                                </div>
                            </div>

                            <div className="bg-surface p-4 rounded-xl border border-border/60 flex flex-col gap-4">
                                <h3 className="text-[13px] font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                                    <Trophy size={16} className="text-gray-500" /> Prize Pool
                                </h3>
                                <div className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-4 text-[13px]">
                                    <span className="text-gray-500 font-medium">1st Place</span>
                                    <span className="text-gold font-semibold">{detailedOverview?.firstPlacePrize ? `${detailedOverview?.currencyType} ${detailedOverview.firstPlacePrize.toLocaleString()}` : <span className="text-gray-600 italic font-normal">N/A</span>}</span>
                                    <span className="text-gray-500 font-medium">2nd Place</span>
                                    <span className="text-gold font-semibold">{detailedOverview?.secondPlacePrize ? `${detailedOverview?.currencyType} ${detailedOverview.secondPlacePrize.toLocaleString()}` : <span className="text-gray-600 italic font-normal">N/A</span>}</span>
                                    <span className="text-gray-500 font-medium">3rd Place</span>
                                    <span className="text-gold font-semibold">{detailedOverview?.thirdPlacePrize ? `${detailedOverview?.currencyType} ${detailedOverview.thirdPlacePrize.toLocaleString()}` : <span className="text-gray-600 italic font-normal">N/A</span>}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Registrations Tab ── */}
                    {activeTab === 'registrations' && (
                        <div className="flex flex-col gap-3">
                            {detailedParticipants.length > 0 && (
                                <div className="flex justify-end">
                                    <div className="flex items-center gap-0.5 bg-white/5 border border-border rounded-lg p-0.5">
                                        {(['lengths', 'metres'] as const).map(u => (
                                            <button key={u} onClick={() => setDistUnit(u)}
                                                className={["text-[10px] font-bold font-mono px-2 py-1 rounded-md transition-all", distUnit === u ? "bg-white/15 text-white" : "text-gray-600 hover:text-gray-400"].join(" ")}>
                                                {u === 'metres' ? 'm' : 'L'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {detailedParticipants.map((p: any, idx: number) => {
                                const colorClass = STATUS_COLORS[p.status] ?? STATUS_COLORS.pending;
                                return (
                                    <div key={p.registrationId ?? idx} className="p-4 rounded-xl bg-surface border border-border/60 flex flex-col gap-4">
                                        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                                            <div className="flex items-center gap-2">
                                                <Users size={16} className="text-gray-500" />
                                                <span className="text-[14px] font-bold text-white truncate">{p.ownerName || <span className="text-gray-600 italic font-medium">No Owner</span>}</span>
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${colorClass}`}>
                                                {STATUS_LABEL[p.status] ?? p.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[12px]">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500 font-medium">Horse</span>
                                                <span className="text-gray-300 font-semibold">{p.horseName || <span className="text-gray-600 italic font-normal">N/A</span>}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500 font-medium flex items-center gap-1.5">
                                                    Jockey
                                                    {p.isJockeyInRace && (
                                                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                                            Racing
                                                        </span>
                                                    )}
                                                </span>
                                                <span className={`font-semibold ${p.isJockeyInRace ? 'text-emerald-300' : 'text-gray-300'}`}>
                                                    {p.jockeyName || <span className="text-gray-600 italic font-normal">N/A</span>}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500 font-medium flex items-center gap-1"><DollarSign size={12} /> Prediction Pool</span>
                                                <span className="text-gold font-semibold">{p.sum_prediction != null ? `${p.sum_prediction} pts` : <span className="text-gray-600 italic font-normal">N/A</span>}</span>
                                            </div>
                                            {isCompleted && p.raceResult && (
                                                <>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-gray-500 font-medium flex items-center gap-1"><Trophy size={12} /> Finish Pos</span>
                                                        <span className="text-amber-400 font-semibold">#{p.raceResult.finishPosition}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-gray-500 font-medium flex items-center gap-1"><Clock size={12} /> Finish Time</span>
                                                        <span className="text-gray-300 font-semibold">{p.raceResult.finishTime}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-gray-500 font-medium flex items-center gap-1"><Clock size={12} /> Margin</span>
                                                        <span className="text-gray-400 font-semibold">{fmtLength(p.raceResult.distance)}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-gray-500 font-medium flex items-center gap-1"><DollarSign size={12} /> Prize</span>
                                                        <span className="text-gold font-semibold">{p.raceResult.prizeMoney > 0 ? `${detailedOverview?.currencyType ?? 'VND'} ${p.raceResult.prizeMoney.toLocaleString()}` : '-'}</span>
                                                    </div>
                                                </>
                                            )}
                                            {(!isCompleted || !p.raceResult) && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-gray-500 font-medium flex items-center gap-1"><Trophy size={12} /> Result</span>
                                                    <span className="text-gray-600 italic font-normal">
                                                        {isAwaitingConfirmation ? 'Pending confirmation' : 'N/A'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {p.preRaceViolations?.length > 0 && (
                                            <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                                                    <TriangleAlert size={12} className="text-amber-500" /> Pre-Race Violations
                                                </span>
                                                {p.preRaceViolations.map((v: any, vIdx: number) => {
                                                    const vStatusClass = VIOLATION_STATUS_COLORS[v.violationStatus] ?? VIOLATION_STATUS_COLORS.pending;
                                                    const vSeverityClass = VIOLATION_SEVERITY_COLOR[v.severity] || 'text-gray-500';
                                                    return (
                                                        <div key={v._id ?? vIdx} className="flex items-center justify-between gap-2 text-[12px]">
                                                            <span className={`truncate ${vSeverityClass}`}>{v.violationTypeId?.violationName || 'Unknown Violation Type'}</span>
                                                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${vStatusClass}`}>
                                                                {v.violationStatus}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {detailedParticipants.length === 0 && !loadingDetails && (
                                <div className="text-[13px] text-gray-500 italic p-8 text-center bg-surface rounded-xl border border-border/60">No registrations yet.</div>
                            )}
                        </div>
                    )}

                    {/* ── Referees Tab ── */}
                    {activeTab === 'referees' && (
                        <div className="flex flex-col gap-3">
                            {detailedReferees.map((ref: any, idx: number) => {
                                const colorClass = STATUS_COLORS[ref.assignmentStatus] ?? STATUS_COLORS.pending;
                                return (
                                    <div key={ref.refereeId ?? idx} className="flex flex-col gap-3 p-4 rounded-xl bg-surface border border-border/60">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Shield size={16} className="text-gray-500 shrink-0" />
                                                <span className="text-[14px] font-bold text-white truncate">{ref.fullName || <span className="text-gray-600 italic font-medium">Unknown Referee</span>}</span>
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${colorClass}`}>
                                                {STATUS_LABEL[ref.assignmentStatus] ?? ref.assignmentStatus}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[12px]">
                                            <span className="text-gray-500 font-medium">Fee:</span>
                                            <span className="text-gold font-semibold">{ref.fee != null ? `$${ref.fee}` : <span className="text-gray-600 italic font-normal">N/A</span>}</span>
                                        </div>
                                    </div>
                                );
                            })}
                            {detailedReferees.length === 0 && !loadingDetails && (
                                <div className="text-[13px] text-gray-500 italic p-8 text-center bg-surface rounded-xl border border-border/60">No referees assigned.</div>
                            )}
                        </div>
                    )}

                    {/* ── Violations Tab ── */}
                    {activeTab === 'violations' && (
                        <div className="flex flex-col gap-3">
                            {detailedViolations.map((v: any, idx: number) => {
                                const statusClass = VIOLATION_STATUS_COLORS[v.violationStatus] ?? VIOLATION_STATUS_COLORS.pending;
                                const phaseClass = VIOLATION_PHASE_BADGE[v.violationTypeId?.type] ?? "bg-white/5 text-gray-500 border border-border";
                                const severityClass = VIOLATION_SEVERITY_COLOR[v.severity] || 'text-gray-500';
                                const stewardClass = VIOLATION_STEWARD_STYLES[v.stewardAction] ?? 'text-gray-400';
                                return (
                                    <div key={v._id ?? idx} className="p-4 rounded-xl bg-surface border border-border/60 flex flex-col gap-3">
                                        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <TriangleAlert size={16} className="text-gray-500 shrink-0" />
                                                <span className="text-[14px] font-bold text-white truncate">{v.violationTypeId?.violationName || <span className="text-gray-600 italic font-medium">Unknown Violation Type</span>}</span>
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${statusClass}`}>
                                                {v.violationStatus}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {v.violationTypeId?.type && (
                                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${phaseClass}`}>{v.violationTypeId.type}</span>
                                                )}
                                                {v.violationTypeId?.category && (
                                                    <span className="text-[11px] text-gray-500">{v.violationTypeId.category}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-0.5" title={`Severity ${v.severity ?? '—'}/5`}>
                                                {[1, 2, 3, 4, 5].map(n => (
                                                    <span key={n} className={`w-1.5 h-1.5 rounded-full ${n <= (v.severity ?? 0) ? severityClass.replace('text-', 'bg-') : 'bg-white/10'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        {v.description && (
                                            <p className="text-[12px] text-gray-400">{v.description}</p>
                                        )}
                                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[12px]">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500 font-medium">Horse</span>
                                                <span className="text-gray-300 font-semibold">{v.horseName || <span className="text-gray-600 italic font-normal">N/A</span>}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500 font-medium">Jockey</span>
                                                <span className="text-gray-300 font-semibold">{v.jockeyName || <span className="text-gray-600 italic font-normal">N/A</span>}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500 font-medium">Steward Action</span>
                                                <span className={`font-semibold ${stewardClass}`}>{v.stewardAction || <span className="text-gray-600 italic font-normal">N/A</span>}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500 font-medium">Actual Penalty</span>
                                                <span className="text-gray-300 font-semibold">{v.actualPenalty || <span className="text-gray-600 italic font-normal">N/A</span>}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500 font-medium">Reported</span>
                                                <span className="text-gray-300 font-semibold">{fmtViolationDate(v.created_at) || <span className="text-gray-600 italic font-normal">N/A</span>}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {detailedViolations.length === 0 && !loadingDetails && (
                                <div className="text-[13px] text-gray-500 italic p-8 text-center bg-surface rounded-xl border border-border/60">No violations recorded for this race.</div>
                            )}
                        </div>
                    )}

                    {/* ── Pools Tab ── */}
                    {activeTab === 'pools' && (
                        <div className="flex flex-col gap-4">
                            {/* Track Earnings Summary */}
                            {detailedTrackEarnings && (
                                <div className="bg-surface p-4 rounded-xl border border-amber-500/20 flex flex-col gap-3">
                                    <h3 className="text-[13px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                        <TrendingUp size={16} className="text-amber-400" /> Track Earnings (House Take)
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['race_winner', 'race_rank'] as const).map(mt => {
                                            const val = detailedTrackEarnings.byPool?.[mt];
                                            return (
                                                <div key={mt} className="bg-bg rounded-lg px-3 py-2.5 flex flex-col gap-1 border border-border/60">
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                                        {mt === 'race_winner' ? 'Win Pool' : 'Rank Pool'}
                                                    </span>
                                                    <span className="text-[14px] font-bold text-amber-400">
                                                        {val != null ? `${val.toLocaleString()} pts` : '—'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                        <div className="bg-amber-500/10 rounded-lg px-3 py-2.5 flex flex-col gap-1 border border-amber-500/20">
                                            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Total</span>
                                            <span className="text-[14px] font-bold text-amber-300">
                                                {detailedTrackEarnings.totalHouseEarning?.toLocaleString() ?? '—'} pts
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Per-pool cards */}
                            {detailedPools.length === 0 && !loadingDetails && (
                                <div className="text-[13px] text-gray-500 italic p-8 text-center bg-surface rounded-xl border border-border/60">
                                    No prediction pool data available.
                                </div>
                            )}

                            {detailedPools.map((pool: any) => {
                                const isLive = pool.poolStatus === 'live';
                                const isSettled = pool.poolStatus === 'settled';
                                const isRefunded = pool.poolStatus === 'refunded';
                                const isEmpty = pool.poolStatus === 'empty';
                                const label = pool.methodType === 'race_winner' ? 'Win Prediction Pool' : 'Rank Prediction Pool';

                                const statusChip = isLive
                                    ? <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />Live</span>
                                    : isSettled ? <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Settled</span>
                                        : isRefunded ? <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">Refunded</span>
                                            : <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-gray-500 border border-border">No Bets</span>;

                                return (
                                    <div key={pool.methodType} className="bg-surface p-4 rounded-xl border border-border/60 flex flex-col gap-3">
                                        {/* Pool header */}
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[13px] font-bold text-white flex items-center gap-2">
                                                <BarChart2 size={15} className="text-gray-500" /> {label}
                                            </h3>
                                            {statusChip}
                                        </div>

                                        {isEmpty && (
                                            <p className="text-[12px] text-gray-500 italic">No bets placed for this pool type.</p>
                                        )}

                                        {isRefunded && (
                                            <p className="text-[12px] text-amber-400/80">Race cancelled — all {pool.totalRefunded} bets refunded.</p>
                                        )}

                                        {/* Pool stats row */}
                                        {!isEmpty && !isRefunded && (
                                            <div className="grid grid-cols-3 gap-2 text-[11px]">
                                                <div className="bg-bg rounded-lg px-2.5 py-2 flex flex-col gap-0.5 border border-border/60">
                                                    <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Gross Pool</span>
                                                    <span className="text-white font-semibold">{pool.grossPool != null ? `${pool.grossPool.toLocaleString()} pts` : '—'}</span>
                                                </div>
                                                <div className="bg-bg rounded-lg px-2.5 py-2 flex flex-col gap-0.5 border border-border/60">
                                                    <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Net Pool</span>
                                                    <span className="text-white font-semibold">{pool.netPool != null ? `${pool.netPool.toLocaleString()} pts` : '—'}</span>
                                                </div>
                                                <div className="bg-bg rounded-lg px-2.5 py-2 flex flex-col gap-0.5 border border-border/60">
                                                    <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1"><Percent size={8} />Take ({(pool.takeoutRate * 100).toFixed(0)}%)</span>
                                                    <span className="text-amber-400 font-semibold">{pool.houseEarning != null ? `${pool.houseEarning.toLocaleString()} pts` : '—'}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Settled summary */}
                                        {isSettled && (
                                            <div className="grid grid-cols-3 gap-2 text-[11px]">
                                                <div className="bg-emerald-500/5 rounded-lg px-2.5 py-2 flex flex-col gap-0.5 border border-emerald-500/15">
                                                    <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Winners</span>
                                                    <span className="text-emerald-400 font-bold text-[13px]">{pool.totalWinners ?? 0}</span>
                                                </div>
                                                <div className="bg-red-500/5 rounded-lg px-2.5 py-2 flex flex-col gap-0.5 border border-red-500/15">
                                                    <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Losers</span>
                                                    <span className="text-red-400 font-bold text-[13px]">{pool.totalLosers ?? 0}</span>
                                                </div>
                                                <div className="bg-bg rounded-lg px-2.5 py-2 flex flex-col gap-0.5 border border-border/60">
                                                    <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Paid Out</span>
                                                    <span className="text-gold font-semibold">{pool.totalPaidOut != null ? `${pool.totalPaidOut.toLocaleString()} pts` : '—'}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Live per-horse breakdown */}
                                        {isLive && pool.perHorse && pool.perHorse.length > 0 && (
                                            <div className="rounded-lg border border-border/60 overflow-hidden mt-1">
                                                <div className="grid grid-cols-[1fr_56px_50px_56px_64px] text-[9px] uppercase tracking-wider text-gray-500 font-bold px-3 py-2 bg-bg border-b border-border/60">
                                                    <span>Horse</span>
                                                    <span className="text-right">Stake</span>
                                                    <span className="text-right">Share</span>
                                                    <span className="text-right">Odds</span>
                                                    <span className="text-right">1.000₫ Pay</span>
                                                </div>
                                                {pool.perHorse.map((h: any) => (
                                                    <div key={h.registrationId} className="grid grid-cols-[1fr_56px_50px_56px_64px] text-[12px] px-3 py-2.5 border-b border-white/[0.03] last:border-b-0 hover:bg-white/[0.02] transition-colors">
                                                        <span className="text-white font-medium truncate">{h.horseName || <span className="text-gray-600 italic">Unknown</span>}</span>
                                                        <span className="text-right text-gray-300">{h.totalStake}</span>
                                                        <span className="text-right text-gray-300">{h.poolShare}%</span>
                                                        <span className="text-right text-amber-400 font-semibold">{h.odds}×</span>
                                                        <span className="text-right text-gold font-semibold">{h.displayPayout}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {isLive && (
                                            <p className="text-[11px] text-gray-600">{pool.totalBettors} bettor{pool.totalBettors !== 1 ? 's' : ''} · odds update live as more bets are placed</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Stream / VOD Tab ── */}
                    {activeTab === 'stream' && (
                        <div className="flex flex-col gap-4">
                            {/* ── LIVE Stream Info (running / awaiting confirmation) ── */}
                            {(isRunning || isAwaitingConfirmation) && (
                                <div className="bg-surface p-4 rounded-xl border border-blue-500/20 flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[13px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                            <Radio size={16} className="text-red-400 animate-pulse" /> Live Stream (OBS)
                                        </h3>
                                        <button
                                            onClick={fetchStreamInfo}
                                            disabled={streamLoading}
                                            className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                                        >
                                            {streamLoading ? 'Loading…' : 'Refresh'}
                                        </button>
                                    </div>
                                    {streamLoading && (
                                        <div className="flex items-center justify-center py-6">
                                            <Loader2 size={24} className="animate-spin text-blue-400" />
                                        </div>
                                    )}
                                    {streamError && !streamLoading && (
                                        <div className="flex items-center gap-2 text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                            <TriangleAlert size={13} className="shrink-0" />
                                            {streamError}
                                        </div>
                                    )}
                                    {streamInfo && !streamLoading && (
                                        <div className="flex flex-col gap-3 text-[13px]">
                                            {streamInfo.rtmpUrl && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-gray-500 font-medium text-[11px] uppercase tracking-wider">RTMP Ingest URL</span>
                                                    <div className="flex items-center gap-2 bg-bg rounded-lg px-3 py-2 border border-border/60">
                                                        <span className="text-gray-300 font-mono text-[12px] truncate flex-1">{streamInfo.rtmpUrl}</span>
                                                        <CopyButton text={streamInfo.rtmpUrl} />
                                                    </div>
                                                </div>
                                            )}
                                            {streamInfo.streamKey && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-gray-500 font-medium text-[11px] uppercase tracking-wider">Stream Key</span>
                                                    <div className="flex items-center gap-2 bg-bg rounded-lg px-3 py-2 border border-border/60">
                                                        <span className="text-gray-300 font-mono text-[12px] truncate flex-1 select-all">{streamInfo.streamKey}</span>
                                                        <CopyButton text={streamInfo.streamKey} />
                                                    </div>
                                                </div>
                                            )}
                                            {streamInfo.playbackId && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-gray-500 font-medium text-[11px] uppercase tracking-wider">Viewer Playback ID</span>
                                                    <div className="flex items-center gap-2 bg-bg rounded-lg px-3 py-2 border border-border/60">
                                                        <span className="text-gray-300 font-mono text-[12px] truncate flex-1">{streamInfo.playbackId}</span>
                                                        <CopyButton text={streamInfo.playbackId} />
                                                    </div>
                                                </div>
                                            )}
                                            {streamInfo.status && (
                                                <div className="flex items-center gap-2 text-[12px]">
                                                    <span className="text-gray-500">Stream Status:</span>
                                                    <span className={`font-semibold ${streamInfo.status === 'active' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                        {streamInfo.status}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {!streamInfo && !streamLoading && !streamError && (
                                        <button
                                            onClick={fetchStreamInfo}
                                            className="w-full flex items-center justify-center gap-2 py-3 text-[13px] text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/10 transition-colors"
                                        >
                                            <Tv size={15} /> Load Stream Info
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* ── VOD Info (completed races) ── */}
                            {isCompleted && (
                                <div className="bg-surface p-4 rounded-xl border border-violet-500/20 flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[13px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                            <Video size={16} className="text-violet-400" /> VOD Recording
                                        </h3>
                                        <button
                                            onClick={fetchVOD}
                                            disabled={vodLoading}
                                            className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50"
                                        >
                                            {vodLoading ? 'Checking…' : 'Check Again'}
                                        </button>
                                    </div>
                                    {vodLoading && (
                                        <div className="flex items-center justify-center py-6">
                                            <Loader2 size={24} className="animate-spin text-violet-400" />
                                        </div>
                                    )}
                                    {vodError && !vodLoading && (
                                        <div className="flex items-center gap-2 text-[12px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                                            <Clock size={13} className="shrink-0" />
                                            {vodError}
                                        </div>
                                    )}
                                    {vodInfo && !vodLoading && (
                                        <div className="flex flex-col gap-3 text-[13px]">
                                            {vodInfo.vodPlaybackId && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-gray-500 font-medium text-[11px] uppercase tracking-wider">VOD Playback ID</span>
                                                    <div className="flex items-center gap-2 bg-bg rounded-lg px-3 py-2 border border-border/60">
                                                        <span className="text-gray-300 font-mono text-[12px] truncate flex-1">{vodInfo.vodPlaybackId}</span>
                                                        <CopyButton text={vodInfo.vodPlaybackId} />
                                                    </div>
                                                    <a
                                                        href={`https://stream.mux.com/${vodInfo.vodPlaybackId}.m3u8`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="mt-1 text-[11px] text-violet-400 hover:underline"
                                                    >
                                                        Open HLS stream ↗
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {!vodInfo && !vodLoading && !vodError && (
                                        <button
                                            onClick={fetchVOD}
                                            className="w-full flex items-center justify-center gap-2 py-3 text-[13px] text-violet-400 border border-violet-500/20 rounded-lg hover:bg-violet-500/10 transition-colors"
                                        >
                                            <Video size={15} /> Load VOD Info
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Start Race Date-Mismatch Confirmation Modal ── */}
            <ScheduleConfirmModal
                open={startGate.isOpen}
                title="Race Schedule Warning"
                message={startGate.warningMessage}
                actionVerb="Start"
                pendingLabel="Starting..."
                pending={isStarting}
                error={actionError}
                onConfirm={() => doStartRace(true)}
                onCancel={startGate.close}
            />

            {/* ── Cancel Confirmation Modal ── */}
            {isCancelModalOpen && (
                <Modal
                    title="Cancel Race Round"
                    icon={<div className="p-2 bg-red/20 rounded-full"><AlertCircle className="text-red" size={20} /></div>}
                    size="sm"
                    onClose={() => !isCancelling && setIsCancelModalOpen(false)}
                    closeOnBackdrop={!isCancelling}
                    footer={<>
                        <Button variant="secondary" size="sm" disabled={isCancelling} onClick={() => setIsCancelModalOpen(false)}>
                            Keep Race
                        </Button>
                        <Button variant="destructive" size="sm" loading={isCancelling} onClick={handleCancelRace}>
                            {isCancelling ? "Cancelling..." : "Yes, Cancel Race"}
                        </Button>
                    </>}
                >
                    <p className="text-[14px] text-text-muted leading-relaxed">
                        Are you sure you want to cancel <strong className="text-text">{selectedRace?.title}</strong>?
                    </p>
                    <p className="text-[13px] text-text-muted mt-2">
                        This will also cancel all associated registrations, referee assignments, and invitations. This action cannot be undone.
                    </p>
                    {actionError && (
                        <p className="text-[12px] text-red mt-3 bg-error-bg border border-error-border rounded px-3 py-2">{actionError}</p>
                    )}
                </Modal>
            )}

        </aside>
    );
}
