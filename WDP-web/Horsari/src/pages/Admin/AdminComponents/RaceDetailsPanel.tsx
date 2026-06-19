import { useState, useEffect, useCallback } from "react";
import {
    Shield, X, AlertCircle, Loader2, Calendar, Clock, Tag, Ban, Pencil,
    Map, Flag, Users, DollarSign, Trophy, Play, CheckCircle2, Radio,
    Copy, Check, Video, Tv, TriangleAlert
} from "lucide-react";
import type { ScheduledRace } from "../../../shared/types/RaceTypes";
import { adminService } from "../../../api/adminService";

interface RaceDetailsPanelProps {
    selectedRace?: ScheduledRace;
    onRefresh?: (updateInfo?: { type: 'CREATE' | 'UPDATE'; tournament_id?: string; raceRound_id?: string }) => void;
    onEdit?: () => void;
    onClose?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
    approved:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    pending:   "bg-amber-500/15  text-amber-400  border-amber-500/30",
    rejected:  "bg-red-500/15    text-red-400    border-red-500/30",
    assigned:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};
const STATUS_LABEL: Record<string, string> = {
    approved: "Approved",
    pending:  "Pending",
    rejected: "Rejected",
    assigned: "Assigned",
};

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {}
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
    const [isConfirming, setIsConfirming] = useState(false);
    const [isConfirmResultModalOpen, setIsConfirmResultModalOpen] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    // Tab State — includes 'stream' tab for running races
    const [activeTab, setActiveTab] = useState<'overview' | 'registrations' | 'referees' | 'stream'>('overview');

    const [detailedParticipants, setDetailedParticipants] = useState<any[]>([]);
    const [detailedReferees, setDetailedReferees] = useState<any[]>([]);
    const [detailedOverview, setDetailedOverview] = useState<any>(null);
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
                        address: data.address,
                        trackLength: data.trackLength,
                        raceGround: data.raceGround,
                        maxParticipants: data.maxParticipants,
                        raceType: data.RaceType || data.raceType,
                        firstPlacePrize: data.firstPlacePrize,
                        secondPlacePrize: data.secondPlacePrize,
                        thirdPlacePrize: data.thirdPlacePrize,
                        currencyType: data.currencyType || "USD",
                    });

                    const parts = (res.data.Registration || []).map((reg: any) => ({
                        registrationId: reg._id,
                        ownerName: reg.Owner?.fullName ?? null,
                        horseName: reg.Horse?.horseName ?? null,
                        jockeyName: reg.Jockey?._id?.fullName ?? null,
                        isJockeyInRace: reg.isJockeyInRace ?? false,
                        status: reg.registrationStatus ?? 'pending',
                        sum_prediction: reg.sum_prediction,
                        raceResult: reg.RaceResult
                    }));
                    setDetailedParticipants(parts);

                    const refs = (res.data.Referee || []).map((ref: any) => ({
                        refereeId: ref.refereeId,
                        fullName: ref.fullName ?? null,
                        assignmentStatus: ref.assignmentStatus ?? 'pending',
                        fee: ref.fee,
                    }));
                    setDetailedReferees(refs);
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
        } else {
            setDetailedParticipants([]);
            setDetailedReferees([]);
            setDetailedOverview(null);
        }
    }, [selectedRace?.id]);

    // When stream tab is opened for a running race, auto-fetch
    useEffect(() => {
        if (activeTab === 'stream' && selectedRace?.id) {
            if (selectedRace.status === 'running' && !streamInfo && !streamLoading) {
                fetchStreamInfo();
            }
            if (selectedRace.status === 'completed' && !vodInfo && !vodLoading) {
                fetchVOD();
            }
        }
    }, [activeTab]);

    // ── Action Handlers ────────────────────────────────────────────────────────

    const handleStartRace = async () => {
        if (!selectedRace) return;
        setIsStarting(true);
        setActionError(null);
        try {
            await adminService.setRaceRoundStatus(selectedRace.id, 'running');
            if (onRefresh) onRefresh({ type: 'UPDATE', raceRound_id: selectedRace.id });
            fetchDetails();
        } catch (error: any) {
            setActionError(error?.msg || 'Failed to start race');
        } finally {
            setIsStarting(false);
        }
    };

    const handleCancelRace = async () => {
        if (!selectedRace) return;
        setIsCancelling(true);
        setActionError(null);
        try {
            await adminService.setRaceRoundStatus(selectedRace.id, 'cancelled');
            setIsCancelModalOpen(false);
            if (onRefresh) onRefresh({ type: 'UPDATE', raceRound_id: selectedRace.id });
            fetchDetails();
        } catch (error: any) {
            setActionError(error?.msg || 'Failed to cancel race');
        } finally {
            setIsCancelling(false);
        }
    };

    const handleConfirmResult = async () => {
        if (!selectedRace) return;
        setIsConfirming(true);
        setActionError(null);
        try {
            await adminService.confirmRaceResult(selectedRace.id);
            setIsConfirmResultModalOpen(false);
            if (onRefresh) onRefresh({ type: 'UPDATE', raceRound_id: selectedRace.id });
            fetchDetails();
        } catch (error: any) {
            setActionError(error?.msg || 'Failed to confirm results');
        } finally {
            setIsConfirming(false);
        }
    };

    if (!selectedRace) return null;

    const status = selectedRace.status;
    const isPrepared = status === 'prepared';
    const isRunning = status === 'running';
    const isCompleted = status === 'completed';
    const isCancelled = status === 'cancelled';

    const tabs: Array<{ key: 'overview' | 'registrations' | 'referees' | 'stream'; label: string }> = [
        { key: 'overview', label: 'Overview' },
        { key: 'registrations', label: 'Registrations' },
        { key: 'referees', label: 'Referees' },
    ];
    if (isRunning || isCompleted) {
        tabs.push({ key: 'stream', label: isRunning ? '🔴 Stream' : 'VOD' });
    }

    return (
        <aside
            className="h-full bg-[#161616] border border-white/[0.05] rounded-xl flex flex-col overflow-hidden shadow-lg shadow-black/20"
            style={{ animation: "panelIn 0.18s ease-out" }}
        >
            <style>{`@keyframes panelIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }`}</style>

            <div className="flex flex-col h-full">
                {/* ── Header ── */}
                <div className="px-5 py-5 shrink-0 border-b border-white/[0.05] bg-[#1a1a1a]">
                    <div className="flex flex-col gap-1 mb-3">
                        <div className="flex justify-between items-start w-full gap-4">
                            <div className="flex flex-col gap-2">
                                <h2 className={`text-[22px] font-bold tracking-tight leading-tight ${isCancelled ? 'text-gray-500 line-through' : 'text-white'}`}>
                                    {selectedRace.title}
                                </h2>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border inline-block ${
                                        isCancelled  ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                                        status === 'scheduled' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                                        isRunning    ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                                        isCompleted  ? 'bg-gray-500/15 text-gray-400 border-gray-500/30' :
                                        isPrepared   ? 'bg-violet-500/15 text-violet-400 border-violet-500/30' :
                                        'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                    }`}>
                                        {isRunning ? (
                                            <span className="flex items-center gap-1">
                                                <Radio size={8} className="animate-pulse" /> {status}
                                            </span>
                                        ) : status}
                                    </span>
                                    <span className="text-[14px] font-medium text-[#f3b2a5]">{selectedRace.tournament}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 pt-1">
                                <button
                                    onClick={onEdit}
                                    className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded border border-blue-500/20 transition-colors"
                                    title="Edit Race"
                                >
                                    <Pencil size={14} />
                                </button>
                                {!isCancelled && !isCompleted && !isRunning && (
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
                                    className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded border border-white/10 transition-colors ml-1"
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
                        {(detailedOverview?.raceType || selectedRace.raceType) && (
                            <span className="flex items-center gap-1.5 whitespace-nowrap"><Tag size={14} className="text-gray-500" /> {detailedOverview?.raceType || selectedRace.raceType}</span>
                        )}
                    </div>

                    {/* ── Action Buttons ── */}
                    {(isPrepared || isRunning) && (
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
                                <button
                                    onClick={() => setIsConfirmResultModalOpen(true)}
                                    disabled={isConfirming}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
                                >
                                    {isConfirming ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                                    {isConfirming ? 'Confirming…' : 'Confirm Race Results'}
                                </button>
                            )}
                            {actionError && (
                                <div className="flex items-center gap-2 text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                    <TriangleAlert size={13} className="shrink-0" />
                                    {actionError}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Tabs ── */}
                <div className="flex items-center border-b border-white/[0.05] shrink-0 bg-[#161616]">
                    {tabs.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors border-b-2 ${
                                activeTab === key
                                    ? "text-[#f3b2a5] border-[#f3b2a5] bg-[#f3b2a5]/5"
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
                        <div className="absolute inset-0 z-10 bg-[#161616]/80 backdrop-blur-sm flex items-center justify-center">
                            <Loader2 size={32} className="animate-spin text-red-500" />
                        </div>
                    )}

                    {/* ── Overview Tab ── */}
                    {activeTab === 'overview' && (
                        <div className="flex flex-col gap-4">
                            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex flex-col gap-4">
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

                            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex flex-col gap-4">
                                <h3 className="text-[13px] font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                                    <Flag size={16} className="text-gray-500" /> Track & Limits
                                </h3>
                                <div className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-4 text-[13px]">
                                    <span className="text-gray-500 font-medium">Track Length</span>
                                    <span className="text-white">{detailedOverview?.trackLength ? `${detailedOverview.trackLength}m` : <span className="text-gray-600 italic">N/A</span>}</span>
                                    <span className="text-gray-500 font-medium">Max Slots</span>
                                    <span className="text-white">{detailedOverview?.maxParticipants || selectedRace.maxSlots || <span className="text-gray-600 italic">N/A</span>}</span>
                                    <span className="text-gray-500 font-medium">Race Type</span>
                                    <span className="text-white">{detailedOverview?.raceType || selectedRace.raceType || <span className="text-gray-600 italic">N/A</span>}</span>
                                </div>
                            </div>

                            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex flex-col gap-4">
                                <h3 className="text-[13px] font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                                    <Trophy size={16} className="text-gray-500" /> Prize Pool
                                </h3>
                                <div className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-4 text-[13px]">
                                    <span className="text-gray-500 font-medium">1st Place</span>
                                    <span className="text-[#f3b2a5] font-semibold">{detailedOverview?.firstPlacePrize ? `${detailedOverview?.currencyType} ${detailedOverview.firstPlacePrize.toLocaleString()}` : <span className="text-gray-600 italic font-normal">N/A</span>}</span>
                                    <span className="text-gray-500 font-medium">2nd Place</span>
                                    <span className="text-[#f3b2a5] font-semibold">{detailedOverview?.secondPlacePrize ? `${detailedOverview?.currencyType} ${detailedOverview.secondPlacePrize.toLocaleString()}` : <span className="text-gray-600 italic font-normal">N/A</span>}</span>
                                    <span className="text-gray-500 font-medium">3rd Place</span>
                                    <span className="text-[#f3b2a5] font-semibold">{detailedOverview?.thirdPlacePrize ? `${detailedOverview?.currencyType} ${detailedOverview.thirdPlacePrize.toLocaleString()}` : <span className="text-gray-600 italic font-normal">N/A</span>}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Registrations Tab ── */}
                    {activeTab === 'registrations' && (
                        <div className="flex flex-col gap-3">
                            {detailedParticipants.map((p: any, idx: number) => {
                                const colorClass = STATUS_COLORS[p.status] ?? STATUS_COLORS.pending;
                                return (
                                    <div key={p.registrationId ?? idx} className="p-4 rounded-xl bg-[#1a1a1a] border border-white/5 flex flex-col gap-4">
                                        <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-3">
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
                                                <span className="text-gray-500 font-medium flex items-center gap-1"><DollarSign size={12}/> Prediction Pool</span>
                                                <span className="text-[#f3b2a5] font-semibold">{p.sum_prediction != null ? `${p.sum_prediction} pts` : <span className="text-gray-600 italic font-normal">N/A</span>}</span>
                                            </div>
                                            {p.raceResult && (
                                                <>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-gray-500 font-medium flex items-center gap-1"><Trophy size={12}/> Finish Pos</span>
                                                        <span className="text-amber-400 font-semibold">#{p.raceResult.finishPosition}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-gray-500 font-medium flex items-center gap-1"><Clock size={12}/> Finish Time</span>
                                                        <span className="text-gray-300 font-semibold">{p.raceResult.finishTime}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-gray-500 font-medium flex items-center gap-1"><DollarSign size={12}/> Prize</span>
                                                        <span className="text-[#f3b2a5] font-semibold">{p.raceResult.prizeMoney > 0 ? `${detailedOverview?.currencyType ?? 'USD'} ${p.raceResult.prizeMoney.toLocaleString()}` : '-'}</span>
                                                    </div>
                                                </>
                                            )}
                                            {!p.raceResult && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-gray-500 font-medium flex items-center gap-1"><Trophy size={12}/> Result</span>
                                                    <span className="text-gray-600 italic font-normal">N/A</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {detailedParticipants.length === 0 && !loadingDetails && (
                                <div className="text-[13px] text-gray-500 italic p-8 text-center bg-[#1a1a1a] rounded-xl border border-white/5">No registrations yet.</div>
                            )}
                        </div>
                    )}

                    {/* ── Referees Tab ── */}
                    {activeTab === 'referees' && (
                        <div className="flex flex-col gap-3">
                            {detailedReferees.map((ref: any, idx: number) => {
                                const colorClass = STATUS_COLORS[ref.assignmentStatus] ?? STATUS_COLORS.pending;
                                return (
                                    <div key={ref.refereeId ?? idx} className="flex flex-col gap-3 p-4 rounded-xl bg-[#1a1a1a] border border-white/5">
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
                                            <span className="text-[#f3b2a5] font-semibold">{ref.fee != null ? `$${ref.fee}` : <span className="text-gray-600 italic font-normal">N/A</span>}</span>
                                        </div>
                                    </div>
                                );
                            })}
                            {detailedReferees.length === 0 && !loadingDetails && (
                                <div className="text-[13px] text-gray-500 italic p-8 text-center bg-[#1a1a1a] rounded-xl border border-white/5">No referees assigned.</div>
                            )}
                        </div>
                    )}

                    {/* ── Stream / VOD Tab ── */}
                    {activeTab === 'stream' && (
                        <div className="flex flex-col gap-4">
                            {/* ── LIVE Stream Info (running races) ── */}
                            {isRunning && (
                                <div className="bg-[#1a1a1a] p-4 rounded-xl border border-blue-500/20 flex flex-col gap-4">
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
                                                    <div className="flex items-center gap-2 bg-[#111] rounded-lg px-3 py-2 border border-white/5">
                                                        <span className="text-gray-300 font-mono text-[12px] truncate flex-1">{streamInfo.rtmpUrl}</span>
                                                        <CopyButton text={streamInfo.rtmpUrl} />
                                                    </div>
                                                </div>
                                            )}
                                            {streamInfo.streamKey && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-gray-500 font-medium text-[11px] uppercase tracking-wider">Stream Key</span>
                                                    <div className="flex items-center gap-2 bg-[#111] rounded-lg px-3 py-2 border border-white/5">
                                                        <span className="text-gray-300 font-mono text-[12px] truncate flex-1 select-all">{streamInfo.streamKey}</span>
                                                        <CopyButton text={streamInfo.streamKey} />
                                                    </div>
                                                </div>
                                            )}
                                            {streamInfo.playbackId && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-gray-500 font-medium text-[11px] uppercase tracking-wider">Viewer Playback ID</span>
                                                    <div className="flex items-center gap-2 bg-[#111] rounded-lg px-3 py-2 border border-white/5">
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
                                <div className="bg-[#1a1a1a] p-4 rounded-xl border border-violet-500/20 flex flex-col gap-4">
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
                                                    <div className="flex items-center gap-2 bg-[#111] rounded-lg px-3 py-2 border border-white/5">
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

            {/* ── Cancel Confirmation Modal ── */}
            {isCancelModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#161616] border border-white/10 rounded-xl shadow-2xl w-[400px] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#1a1a1a]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-500/20 rounded-full">
                                    <AlertCircle className="text-red-500" size={20} />
                                </div>
                                <h3 className="text-[16px] font-bold text-white">Cancel Race Round</h3>
                            </div>
                            <button
                                onClick={() => !isCancelling && setIsCancelModalOpen(false)}
                                disabled={isCancelling}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-[14px] text-gray-300 leading-relaxed">
                                Are you sure you want to cancel <strong className="text-white">{selectedRace?.title}</strong>?
                            </p>
                            <p className="text-[13px] text-gray-400 mt-2">
                                This will also cancel all associated registrations, referee assignments, and invitations. This action cannot be undone.
                            </p>
                            {actionError && (
                                <p className="text-[12px] text-red-400 mt-3 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{actionError}</p>
                            )}
                        </div>
                        <div className="p-5 border-t border-white/5 bg-[#1a1a1a] flex justify-end gap-3">
                            <button
                                onClick={() => setIsCancelModalOpen(false)}
                                disabled={isCancelling}
                                className="px-4 py-2 text-[13px] font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors disabled:opacity-50"
                            >
                                Keep Race
                            </button>
                            <button
                                onClick={handleCancelRace}
                                disabled={isCancelling}
                                className="px-4 py-2 text-[13px] font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {isCancelling ? (
                                    <><Loader2 size={14} className="animate-spin" /> Cancelling...</>
                                ) : (
                                    "Yes, Cancel Race"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Confirm Results Modal ── */}
            {isConfirmResultModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#161616] border border-white/10 rounded-xl shadow-2xl w-[420px] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#1a1a1a]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded-full">
                                    <CheckCircle2 className="text-emerald-400" size={20} />
                                </div>
                                <h3 className="text-[16px] font-bold text-white">Confirm Race Results</h3>
                            </div>
                            <button
                                onClick={() => !isConfirming && setIsConfirmResultModalOpen(false)}
                                disabled={isConfirming}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-[14px] text-gray-300 leading-relaxed">
                                Confirm and officially publish the results for <strong className="text-white">{selectedRace?.title}</strong>?
                            </p>
                            <p className="text-[13px] text-gray-400 mt-2">
                                All pending results will be marked as <strong className="text-white">official</strong>, the race will be closed, and notifications will be sent. This action cannot be undone.
                            </p>
                            {actionError && (
                                <p className="text-[12px] text-red-400 mt-3 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{actionError}</p>
                            )}
                        </div>
                        <div className="p-5 border-t border-white/5 bg-[#1a1a1a] flex justify-end gap-3">
                            <button
                                onClick={() => setIsConfirmResultModalOpen(false)}
                                disabled={isConfirming}
                                className="px-4 py-2 text-[13px] font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmResult}
                                disabled={isConfirming}
                                className="px-4 py-2 text-[13px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {isConfirming ? (
                                    <><Loader2 size={14} className="animate-spin" /> Confirming...</>
                                ) : (
                                    <><CheckCircle2 size={14} /> Yes, Confirm Results</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
