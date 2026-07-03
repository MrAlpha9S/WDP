import { useState, useEffect, useCallback } from "react";
import {
    X, Loader2, Trophy, Calendar, DollarSign, Users, Flag,
    AlertCircle, CheckCircle2, Award, MapPin, BarChart2
} from "lucide-react";
import type { TournamentDetailData, TournamentRankEntry } from "../../../shared/types/TournamentTypes";
import { adminService } from "../../../api/adminService";

interface TournamentDetailPanelProps {
    selectedTournamentId: string;
    onRefresh?: () => void;
    onClose?: () => void;
}

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

export default function TournamentDetailPanel({ selectedTournamentId, onRefresh, onClose }: TournamentDetailPanelProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'rounds'>('overview');
    const [detail, setDetail] = useState<TournamentDetailData | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    const [ranking, setRanking] = useState<TournamentRankEntry[]>([]);
    const [loadingRanking, setLoadingRanking] = useState(false);
    const [rankingError, setRankingError] = useState<string | null>(null);
    const [showRanking, setShowRanking] = useState(false);

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
        setActiveTab('overview');
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

    const t = detail?.tournament;
    const statusColor = t ? (TOURNAMENT_STATUS_COLORS[t.status] ?? 'bg-amber-500/15 text-amber-400 border-amber-500/30') : '';
    const isCompleted = t?.status === 'completed';

    const tabs: Array<{ key: 'overview' | 'rounds'; label: string }> = [
        { key: 'overview', label: 'Overview' },
        { key: 'rounds',   label: `Race Rounds${detail ? ` (${detail.raceRounds.length})` : ''}` },
    ];

    return (
        <aside
            className="h-full bg-[#161616] border border-white/[0.05] rounded-xl flex flex-col overflow-hidden shadow-lg shadow-black/20"
            style={{ animation: 'panelIn 0.18s ease-out' }}
        >
            <style>{`@keyframes panelIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }`}</style>

            <div className="flex flex-col flex-1 min-h-0">

                {/* ── Header ── */}
                <div className="px-5 py-5 shrink-0 border-b border-white/[0.05] bg-[#1a1a1a]">
                    {loadingDetail && !detail ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 size={22} className="animate-spin text-[#f3b2a5]" />
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
                                    <span className={`self-start text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${statusColor}`}>
                                        {t.status}
                                    </span>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded border border-white/10 transition-colors shrink-0 mt-1"
                                    title="Close Panel"
                                >
                                    <X size={14} />
                                </button>
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

                {/* ── Tabs ── */}
                <div className="flex items-center border-b border-white/[0.05] shrink-0 bg-[#161616]">
                    {tabs.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors border-b-2 ${
                                activeTab === key
                                    ? 'text-[#f3b2a5] border-[#f3b2a5] bg-[#f3b2a5]/5'
                                    : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* ── Tab Content ── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-4 relative">
                    {loadingDetail && (
                        <div className="absolute inset-0 z-10 bg-[#161616]/80 backdrop-blur-sm flex items-center justify-center">
                            <Loader2 size={32} className="animate-spin text-[#f3b2a5]" />
                        </div>
                    )}

                    {/* ── Overview Tab ── */}
                    {activeTab === 'overview' && t && (
                        <div className="flex flex-col gap-4">
                            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex flex-col gap-4">
                                <h3 className="text-[13px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <Flag size={16} className="text-gray-500" /> Tournament Info
                                </h3>
                                <div className="grid grid-cols-[110px_1fr] gap-y-3 gap-x-4 text-[13px]">
                                    <span className="text-gray-500 font-medium">Name</span>
                                    <span className="text-white">{t.tournamentName}</span>
                                    <span className="text-gray-500 font-medium">Status</span>
                                    <span className={`self-start text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${statusColor}`}>
                                        {t.status}
                                    </span>
                                    <span className="text-gray-500 font-medium">Start</span>
                                    <span className="text-white">{fmtDate(t.startDate ?? undefined)}</span>
                                    <span className="text-gray-500 font-medium">End</span>
                                    <span className="text-white">{fmtDate(t.endDate ?? undefined)}</span>
                                    {t.prizePool != null && (
                                        <>
                                            <span className="text-gray-500 font-medium">Prize Pool</span>
                                            <span className="text-[#f3b2a5] font-semibold">{t.prizePool.toLocaleString()} pts</span>
                                        </>
                                    )}
                                    {t.description && (
                                        <>
                                            <span className="text-gray-500 font-medium">Description</span>
                                            <span className="text-gray-300 leading-relaxed">{t.description}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {isCompleted && t.championHorseName && (
                                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex flex-col gap-2">
                                    <h3 className="text-[13px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                                        <Trophy size={16} className="text-amber-400" /> Tournament Champion
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <Award size={32} className="text-amber-400 shrink-0" />
                                        <div>
                                            <p className="text-[16px] font-bold text-white">{t.championHorseName}</p>
                                            <p className="text-[11px] text-amber-400/70">Official tournament winner</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {detail && (
                                <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                                    <h3 className="text-[13px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                        <BarChart2 size={16} className="text-gray-500" /> Race Summary
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['draft','scheduled','prepared','running','awaitingConfirmation','completed','cancelled'] as const).map(s => {
                                            const count = detail.raceRounds.filter(r => r.status === s).length;
                                            if (!count) return null;
                                            return (
                                                <div key={s} className={`rounded-lg px-2.5 py-2 flex flex-col gap-0.5 border ${ROUND_STATUS_COLORS[s]}`}>
                                                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">{s}</span>
                                                    <span className="text-[15px] font-bold">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Race Rounds Tab ── */}
                    {activeTab === 'rounds' && (
                        <div className="flex flex-col gap-3">
                            {/* View Ranking button */}
                            <button
                                onClick={handleViewRanking}
                                disabled={loadingRanking}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-bold rounded-lg border transition-colors disabled:opacity-60 disabled:cursor-not-allowed bg-[#f3b2a5]/10 text-[#f3b2a5] border-[#f3b2a5]/20 hover:bg-[#f3b2a5]/20"
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
                                <div className="bg-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                                        <Trophy size={14} className="text-[#f3b2a5]" />
                                        <span className="text-[12px] font-bold text-white uppercase tracking-wider">Current Standings</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-[#111] border-b border-white/5">
                                                    <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-500">Rank</th>
                                                    <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-500">Horse</th>
                                                    <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-500">Owner</th>
                                                    <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-500 text-right">Score</th>
                                                    <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-500 text-center">Races</th>
                                                    <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-500 text-center">Wins</th>
                                                    <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-500 text-center">Podiums</th>
                                                    <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-500 text-right">Prize</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/[0.03]">
                                                {ranking.map((entry, idx) => (
                                                    <tr
                                                        key={entry.horseId + idx}
                                                        className={`transition-colors hover:bg-white/[0.02] ${entry.rank === 1 ? 'bg-amber-500/5' : ''}`}
                                                    >
                                                        <td className="px-3 py-2.5">
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
                                                        <td className="px-3 py-2.5 text-right">
                                                            <span className="text-[13px] font-bold text-[#f3b2a5]">{entry.score}</span>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            <span className="text-[12px] text-gray-300">{entry.totalRaces}</span>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            <span className="text-[12px] text-emerald-400 font-semibold">{entry.wins}</span>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            <span className="text-[12px] text-amber-400">{entry.podiums}</span>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right">
                                                            <span className="text-[11px] text-gray-300">
                                                                {entry.totalPrizeMoney > 0 ? `$${entry.totalPrizeMoney.toLocaleString()}` : '—'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="px-4 py-2 border-t border-white/5 bg-[#111]">
                                        <p className="text-[10px] text-gray-600">
                                            Points: 1st=60 · 2nd=40 · 3rd=30 · 4th=20 · 5th+=10 · Official results only
                                        </p>
                                    </div>
                                </div>
                            )}

                            {showRanking && ranking.length === 0 && !loadingRanking && !rankingError && (
                                <div className="text-[12px] text-gray-500 italic text-center bg-[#1a1a1a] rounded-xl border border-white/5 p-6">
                                    No official race results recorded yet.
                                </div>
                            )}

                            {/* Race round cards */}
                            {detail?.raceRounds.length === 0 && (
                                <div className="text-[13px] text-gray-500 italic text-center bg-[#1a1a1a] rounded-xl border border-white/5 p-8">
                                    No race rounds in this tournament.
                                </div>
                            )}
                            {detail?.raceRounds.map((rr) => {
                                const roundColor = ROUND_STATUS_COLORS[rr.status] ?? 'bg-amber-500/15 text-amber-400 border-amber-500/30';
                                return (
                                    <div key={rr._id} className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex flex-col gap-3">
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
                                            <div className="flex items-center gap-3 pt-2 border-t border-white/5 text-[11px]">
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
                    )}
                </div>
            </div>
        </aside>
    );
}
