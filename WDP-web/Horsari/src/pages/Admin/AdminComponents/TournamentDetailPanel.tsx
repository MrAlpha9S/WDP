import { useState, useEffect, useCallback } from "react";
import {
    X, Loader2, Trophy, Calendar, DollarSign, Users, Flag,
    AlertCircle, CheckCircle2, MapPin, Pencil, Ban
} from "lucide-react";
import type { TournamentDetailData, TournamentRankEntry, RoundBreakdownEntry } from "../../../shared/types/TournamentTypes";
import { adminService } from "../../../api/adminService";
import { CancelTournamentModal } from "../modal/CancelTournamentModal";

interface TournamentDetailPanelProps {
    selectedTournamentId: string;
    onRefresh?: () => void;
    onClose?: () => void;
    onEdit?: () => void;
}

// The only forward transition an admin can trigger from a given status — mirrors
// AdminService.updateTournamentStats's supported cases (see backend/services/AdminService.js).
const NEXT_STATUS: Record<string, { target: string; label: string } | undefined> = {
    draft: { target: 'scheduled', label: 'Schedule Tournament' },
    scheduled: { target: 'ongoing', label: 'Start Tournament' },
    ongoing: { target: 'completed', label: 'Mark Completed' },
};

const TOURNAMENT_STATUS_COLORS: Record<string, string> = {
    draft:     'bg-amber-500/15 text-amber-400 border-amber-500/30',
    scheduled: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    ongoing:   'bg-blue-500/15 text-blue-400 border-blue-500/30',
    completed: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const ROUND_STATUS_COLORS: Record<string, string> = {
    draft:                'bg-amber-500/15 text-amber-400 border-amber-500/30',
    scheduled:            'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    prepared:             'bg-violet-500/15 text-violet-400 border-violet-500/30',
    running:              'bg-blue-500/15 text-blue-400 border-blue-500/30',
    awaitingConfirmation: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    completed:            'bg-gray-500/15 text-gray-400 border-gray-500/30',
    cancelled:            'bg-red-500/15 text-red-400 border-red-500/30',
};

const RANK_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function fmtDate(raw: string | null | undefined) {
    if (!raw) return '—';
    return new Date(raw).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ordinal(n: number) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function RoundResultCell({ rd }: { rd: RoundBreakdownEntry }) {
    if (rd.type === 'result') {
        const pos = rd.finishPosition!;
        const cls = pos === 1 ? 'text-amber-400 font-bold'
            : pos === 2 ? 'text-gray-200 font-semibold'
            : pos === 3 ? 'text-amber-600 font-semibold'
            : 'text-gray-400';
        return <span className={`text-[11px] ${cls}`}>{ordinal(pos)}</span>;
    }
    if (rd.type === 'not_registered') {
        return <span className="text-gray-700 text-[10px]">—</span>;
    }
    const s = rd.registrationStatus;
    if (s === 'cancelled') {
        return <span className="text-[9px] font-bold text-gray-500 bg-gray-500/10 border border-gray-500/20 px-1.5 py-0.5 rounded">DNS</span>;
    }
    if (s === 'failed') {
        return <span className="text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">Failed</span>;
    }
    if (s === 'rejected') {
        return <span className="text-[9px] font-bold text-red-300/60 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">Rejected</span>;
    }
    // accepted / verified — differentiate by round status
    if (rd.roundStatus === 'awaitingConfirmation') {
        return <span className="text-[9px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded">Awaiting</span>;
    }
    if (rd.roundStatus === 'completed') {
        if (s !== 'verified') {
            return <span className="text-[9px] font-bold text-gray-400 bg-gray-500/10 border border-gray-500/20 px-1.5 py-0.5 rounded">Pending Result</span>;
        }
        return <span className="text-[9px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded">DNF</span>;
    }
    if (rd.roundStatus === 'running') {
        return <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded">Live</span>;
    }
    return <span className="text-gray-600 text-[10px]">—</span>;
}

export default function TournamentDetailPanel({ selectedTournamentId, onRefresh, onClose, onEdit }: TournamentDetailPanelProps) {
    const [detail, setDetail] = useState<TournamentDetailData | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    const [ranking, setRanking] = useState<TournamentRankEntry[]>([]);
    const [loadingRanking, setLoadingRanking] = useState(false);
    const [rankingError, setRankingError] = useState<string | null>(null);
    const [showRanking, setShowRanking] = useState(false);

    const [statusUpdating, setStatusUpdating] = useState(false);
    const [statusError, setStatusError] = useState<string | null>(null);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<string | null>(null);

    const fetchDetail = useCallback(() => {
        if (!selectedTournamentId) return;
        setLoadingDetail(true);
        setDetailError(null);
        adminService.getTournamentDetail(selectedTournamentId)
            .then(res => { if (res.data) setDetail(res.data); })
            .catch(err => setDetailError(err?.msg || 'Failed to load tournament details'))
            .finally(() => setLoadingDetail(false));
    }, [selectedTournamentId]);

    useEffect(() => {
        setDetail(null);
        setDetailError(null);
        setRanking([]);
        setRankingError(null);
        setShowRanking(false);
        setStatusError(null);
        setIsCancelModalOpen(false);
        setPendingStatus(null);
        fetchDetail();
    }, [selectedTournamentId]);

    const handleViewRanking = async () => {
        if (showRanking) { setShowRanking(false); return; }
        if (ranking.length > 0) { setShowRanking(true); return; }
        setLoadingRanking(true);
        setRankingError(null);
        try {
            const res = await adminService.getTournamentRanking(selectedTournamentId);
            setRanking(res.data);
            setShowRanking(true);
        } catch (err: any) {
            setRankingError(err?.msg || 'Failed to load ranking');
        } finally {
            setLoadingRanking(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!detail?.tournament || newStatus === detail.tournament.status) return;

        if (newStatus === 'cancelled') {
            setIsCancelModalOpen(true);
            return;
        }
        setStatusUpdating(true);
        setStatusError(null);
        try {
            await adminService.updateTournamentStatus(selectedTournamentId, newStatus);
            fetchDetail();
            onRefresh?.();
        } catch (err: any) {
            setStatusError(err?.msg || 'Failed to update status');
        } finally {
            setStatusUpdating(false);
        }
    };

    const t = detail?.tournament;
    const statusColor = t ? (TOURNAMENT_STATUS_COLORS[t.status] ?? 'bg-amber-500/15 text-amber-400 border-amber-500/30') : '';
    const isCompleted = t?.status === 'completed';

    return (
        <aside
            className="h-full bg-surface border border-border/60 rounded-xl flex flex-col overflow-hidden shadow-lg shadow-black/20"
            style={{ animation: 'panelIn 0.18s ease-out' }}
        >
            <style>{`@keyframes panelIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }`}</style>

            <div className="flex flex-col flex-1 min-h-0">

                {/* ── Header ── */}
                <div className="px-5 py-5 shrink-0 border-b border-border/60 bg-surface">
                    {loadingDetail && !detail ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 size={22} className="animate-spin text-gold" />
                        </div>
                    ) : detailError && !detail ? (
                        <div className="flex items-center gap-2 text-[12px] text-red-400 py-2">
                            <AlertCircle size={14} className="shrink-0" /> {detailError}
                        </div>
                    ) : t ? (
                        <>
                            <div className="flex justify-between items-start gap-4 mb-3">
                                <div className="flex flex-col gap-2 min-w-0">
                                    <h2 className="text-[20px] font-bold tracking-tight leading-tight text-white truncate">
                                        {t.tournamentName}
                                    </h2>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${statusColor}`}>
                                            {t.status}
                                        </span>
                                        {NEXT_STATUS[t.status] && (
                                            <button
                                                onClick={() => setPendingStatus(NEXT_STATUS[t.status]!.target)}
                                                disabled={statusUpdating}
                                                className="text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {NEXT_STATUS[t.status]!.label}
                                            </button>
                                        )}
                                        {statusUpdating && <Loader2 size={12} className="animate-spin text-gray-400" />}
                                    </div>
                                    {statusError && (
                                        <span className="text-[11px] text-red-400">{statusError}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0 mt-1">
                                    <button
                                        onClick={onEdit}
                                        className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded border border-blue-500/20 transition-colors"
                                        title="Edit Tournament"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    {t.status !== 'completed' && t.status !== 'cancelled' && (
                                        <button
                                            onClick={() => setIsCancelModalOpen(true)}
                                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded border border-red-500/20 transition-colors"
                                            title="Cancel Tournament"
                                        >
                                            <Ban size={14} />
                                        </button>
                                    )}
                                    <button
                                        onClick={onClose}
                                        className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded border border-border transition-colors"
                                        title="Close Panel"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-gray-400">
                                <span className="flex items-center gap-1.5 whitespace-nowrap">
                                    <Calendar size={14} className="text-gray-500" />
                                    {fmtDate(t.startDate ?? undefined)} → {fmtDate(t.endDate ?? undefined)}
                                </span>
                                {t.prizePool != null && t.prizePool > 0 && (
                                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                                        <DollarSign size={14} className="text-gray-500" />
                                        {t.prizePool.toLocaleString()} Prize Pool
                                    </span>
                                )}
                            </div>

                            {/* Description */}
                            {t.description && (
                                <p className="mt-2 text-[12px] text-gray-500 leading-relaxed line-clamp-2">
                                    {t.description}
                                </p>
                            )}

                            {/* Race summary chips */}
                            {detail && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {(['scheduled','prepared','running','awaitingConfirmation','completed','cancelled','draft'] as const).map(s => {
                                        const count = detail.raceRounds.filter(r => r.status === s).length;
                                        if (!count) return null;
                                        return (
                                            <span key={s} className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${ROUND_STATUS_COLORS[s]}`}>
                                                {s} {count}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Champion banner */}
                            {isCompleted && t.championHorseName && (
                                <div className="mt-3 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                                    <Trophy size={14} className="text-amber-400 shrink-0" />
                                    <span className="text-[12px] text-amber-300 font-semibold">
                                        Champion: <span className="text-amber-200">{t.championHorseName}</span>
                                    </span>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex justify-between items-center">
                            <span className="text-[13px] text-gray-500 italic">Select a tournament</span>
                            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded transition-colors">
                                <X size={14} />
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Content ── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-4 relative">
                    {loadingDetail && (
                        <div className="absolute inset-0 z-10 bg-surface/80 backdrop-blur-sm flex items-center justify-center">
                            <Loader2 size={32} className="animate-spin text-gold" />
                        </div>
                    )}

                    {/* ── Race Rounds ── */}
                    <div className="flex flex-col gap-3">
                        {/* View Ranking button */}
                        <button
                                onClick={handleViewRanking}
                                disabled={loadingRanking}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-bold rounded-lg border transition-colors disabled:opacity-60 disabled:cursor-not-allowed bg-gold/10 text-gold border-gold/20 hover:bg-gold/20"
                            >
                                {loadingRanking
                                    ? <><Loader2 size={14} className="animate-spin" /> Loading Ranking…</>
                                    : <><Trophy size={14} /> {showRanking ? 'Hide Ranking' : 'View Ranking'}</>
                                }
                            </button>

                            {rankingError && (
                                <div className="flex items-center gap-2 text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                    <AlertCircle size={13} className="shrink-0" /> {rankingError}
                                </div>
                            )}

                            {/* Ranking table */}
                            {showRanking && ranking.length > 0 && (
                                <div className="bg-surface rounded-xl border border-border/60 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2">
                                        <Trophy size={14} className="text-gold" />
                                        <span className="text-[12px] font-bold text-white uppercase tracking-wider">Current Standings</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="text-left border-collapse" style={{ minWidth: '100%' }}>
                                            <thead>
                                                <tr className="bg-bg border-b border-border/60">
                                                    <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">Rank</th>
                                                    <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">Horse</th>
                                                    <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">Owner</th>
                                                    <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-500 text-right whitespace-nowrap">Score</th>
                                                    <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-500 text-center whitespace-nowrap">Races</th>
                                                    <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-500 text-center whitespace-nowrap">Wins</th>
                                                    <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-500 text-center whitespace-nowrap">Podiums</th>
                                                    {detail?.raceRounds.map((rr, ri) => (
                                                        <th key={rr._id} title={rr.roundName} className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gold/70 text-center whitespace-nowrap border-l border-white/[0.04]">
                                                            R{ri + 1}
                                                        </th>
                                                    ))}
                                                    <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-500 text-right whitespace-nowrap border-l border-white/[0.04]">Prize</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/[0.03]">
                                                {ranking.map((entry, idx) => (
                                                    <tr
                                                        key={entry.horseId + idx}
                                                        className={`transition-colors hover:bg-white/[0.02] ${entry.rank === 1 ? 'bg-amber-500/5' : ''}`}
                                                    >
                                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[12px] font-bold text-gray-400">
                                                                    {RANK_MEDALS[entry.rank] ?? `#${entry.rank}`}
                                                                </span>
                                                                {entry.rank === 1 && isCompleted && (
                                                                    <CheckCircle2 size={11} className="text-amber-400" />
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <span className="text-[12px] font-semibold text-white truncate max-w-[90px] block">
                                                                {entry.horseName}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <span className="text-[11px] text-gray-400 truncate max-w-[80px] block">
                                                                {entry.ownerName}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                                            <span className="text-[13px] font-bold text-gold">{entry.score}</span>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                                            <span className="text-[12px] text-gray-300">{entry.totalRaces}</span>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                                            <span className="text-[12px] text-emerald-400 font-semibold">{entry.wins}</span>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                                            <span className="text-[12px] text-amber-400">{entry.podiums}</span>
                                                        </td>
                                                        {entry.roundBreakdown.map((rd, rdIdx) => (
                                                            <td key={rd.roundId?.toString() ?? rdIdx} className="px-3 py-2.5 text-center whitespace-nowrap border-l border-white/[0.04]">
                                                                <RoundResultCell rd={rd} />
                                                            </td>
                                                        ))}
                                                        <td className="px-3 py-2.5 text-right whitespace-nowrap border-l border-white/[0.04]">
                                                            <span className="text-[11px] text-gray-300">
                                                                {entry.totalPrizeMoney > 0 ? `$${entry.totalPrizeMoney.toLocaleString()}` : '—'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="px-4 py-2 border-t border-border/60 bg-bg">
                                        <p className="text-[10px] text-gray-600">
                                            Points: 1st=60 · 2nd=40 · 3rd=30 · 4th=20 · 5th+=10 · Official results only
                                        </p>
                                    </div>
                                </div>
                            )}

                            {showRanking && ranking.length === 0 && !loadingRanking && !rankingError && (
                                <div className="text-[12px] text-gray-500 italic text-center bg-surface rounded-xl border border-border/60 p-6">
                                    No official race results recorded yet.
                                </div>
                            )}

                            {/* Race round cards */}
                            {detail?.raceRounds.length === 0 && (
                                <div className="text-[13px] text-gray-500 italic text-center bg-surface rounded-xl border border-border/60 p-8">
                                    No race rounds in this tournament.
                                </div>
                            )}
                            {detail?.raceRounds.map((rr) => {
                                const roundColor = ROUND_STATUS_COLORS[rr.status] ?? 'bg-amber-500/15 text-amber-400 border-amber-500/30';
                                return (
                                    <div key={rr._id} className="bg-surface p-4 rounded-xl border border-border/60 flex flex-col gap-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[14px] font-bold text-white truncate">{rr.roundName}</span>
                                            <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${roundColor}`}>
                                                {rr.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-[12px]">
                                            <div className="flex items-center gap-1.5 text-gray-400">
                                                <Calendar size={12} className="text-gray-500 shrink-0" />
                                                <span>{fmtDate(rr.raceDate)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-gray-400">
                                                <Flag size={12} className="text-gray-500 shrink-0" />
                                                <span>{rr.trackLength ? `${rr.trackLength}m` : '—'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-gray-400">
                                                <Users size={12} className="text-gray-500 shrink-0" />
                                                <span>{rr.participantCount}/{rr.maxParticipants} participants</span>
                                            </div>
                                            {rr.location && (
                                                <div className="flex items-center gap-1.5 text-gray-400">
                                                    <MapPin size={12} className="text-gray-500 shrink-0" />
                                                    <span className="truncate">{rr.location}</span>
                                                </div>
                                            )}
                                        </div>
                                        {(rr.firstPlacePrize > 0 || rr.secondPlacePrize > 0 || rr.thirdPlacePrize > 0) && (
                                            <div className="flex items-center gap-3 pt-2 border-t border-border/60 text-[11px]">
                                                <Trophy size={11} className="text-amber-400 shrink-0" />
                                                <span className="text-amber-400 font-semibold">
                                                    {rr.firstPlacePrize > 0 ? `${rr.currencyType} ${rr.firstPlacePrize.toLocaleString()}` : '—'}
                                                </span>
                                                <span className="text-gray-600">/</span>
                                                <span className="text-gray-400">
                                                    {rr.secondPlacePrize > 0 ? `${rr.currencyType} ${rr.secondPlacePrize.toLocaleString()}` : '—'}
                                                </span>
                                                <span className="text-gray-600">/</span>
                                                <span className="text-gray-500">
                                                    {rr.thirdPlacePrize > 0 ? `${rr.currencyType} ${rr.thirdPlacePrize.toLocaleString()}` : '—'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                </div>
            </div>

            <CancelTournamentModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onSuccess={() => { fetchDetail(); onRefresh?.(); }}
                tournamentId={selectedTournamentId}
                tournamentName={t?.tournamentName ?? ''}
            />

            {/* ── Status Change Confirmation Modal ── */}
            {pendingStatus && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#161616] border border-white/10 rounded-xl shadow-2xl w-[400px] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#1a1a1a]">
                            <h3 className="text-[16px] font-bold text-white">Confirm Status Change</h3>
                            <button
                                onClick={() => !statusUpdating && setPendingStatus(null)}
                                disabled={statusUpdating}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-[14px] text-gray-300 leading-relaxed">
                                Are you sure you want to mark{" "}
                                <strong className="text-white">{t?.tournamentName}</strong>
                                {" "}as <strong className="text-white capitalize">{pendingStatus}</strong>?
                            </p>
                            {statusError && (
                                <p className="text-[12px] text-red-400 mt-3 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{statusError}</p>
                            )}
                        </div>
                        <div className="p-5 border-t border-white/5 bg-[#1a1a1a] flex justify-end gap-3">
                            <button
                                onClick={() => setPendingStatus(null)}
                                disabled={statusUpdating}
                                className="px-4 py-2 text-[13px] font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors disabled:opacity-50"
                            >
                                Go Back
                            </button>
                            <button
                                onClick={async () => {
                                    const target = pendingStatus;
                                    await handleStatusChange(target);
                                    setPendingStatus(null);
                                }}
                                disabled={statusUpdating}
                                className="px-4 py-2 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {statusUpdating ? (
                                    <><Loader2 size={14} className="animate-spin" /> Updating...</>
                                ) : (
                                    "Confirm"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
