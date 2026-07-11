import { useState, useEffect, useCallback } from "react";
import { Search, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import ViolationDetailPanel from "./AdminComponents/ViolationDetailPanel";
import { adminService } from "../../api/adminService";
import { Pagination } from "../../components/Pagination";
import type { ViolationEntity, ViolationStatus } from "../../shared/types/ViolationTypes";

const STATUS_BADGE: Record<ViolationStatus, string> = {
    pending:   'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    confirmed: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    dismissed: 'bg-gray-500/15 text-gray-400 border border-gray-500/30',
};

const PHASE_BADGE: Record<string, string> = {
    'pre-race':    'bg-violet-500/15 text-violet-400 border border-violet-500/30',
    'during-race': 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    'after-race':  'bg-orange-500/15 text-orange-400 border border-orange-500/30',
};

const SEVERITY_COLOR = ['', 'text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-400', 'text-red-500'];

function fmtDate(raw: string | null | undefined) {
    if (!raw) return '—';
    return new Date(raw).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getRoundName(v: ViolationEntity): string {
    if (!v.raceRoundId) return '—';
    if (typeof v.raceRoundId === 'object') return v.raceRoundId.roundName;
    return '—';
}

function getRoundDate(v: ViolationEntity): string {
    if (!v.raceRoundId || typeof v.raceRoundId !== 'object') return '';
    return fmtDate(v.raceRoundId.raceDate);
}

export default function ViolationManagementPage() {
    const [violations, setViolations] = useState<ViolationEntity[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [severityFilter, setSeverityFilter] = useState<string>('All');
    const [selectedViolation, setSelectedViolation] = useState<ViolationEntity | null>(null);
    const [sortBy, setSortBy] = useState<string>('created_at');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const LIMIT = 10;
    const totalPages = Math.ceil(totalItems / LIMIT) || 1;

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setOrder('asc');
        }
        setPage(1);
    };

    const SortIcon = ({ field }: { field: string }) => {
        if (sortBy !== field) return <ArrowUpDown size={11} className="text-gray-600 ml-1 inline" />;
        return order === 'asc'
            ? <ArrowUp size={11} className="text-[#f3b2a5] ml-1 inline" />
            : <ArrowDown size={11} className="text-[#f3b2a5] ml-1 inline" />;
    };

    const fetchViolations = useCallback(async () => {
        try {
            setLoading(true);
            const res = await adminService.getAllViolations(
                page, LIMIT,
                statusFilter !== 'All' ? statusFilter : undefined,
                severityFilter !== 'All' ? Number(severityFilter) : undefined,
                undefined,
                sortBy,
                order,
            );
            const items: ViolationEntity[] = res.data?.items ?? [];
            setViolations(items);
            setTotalItems(res.data?.pagination?.totalItems ?? items.length);
            if (selectedViolation) {
                const updated = items.find(v => v._id === selectedViolation._id);
                setSelectedViolation(updated ?? null);
            }
        } catch {
            setViolations([]);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, severityFilter, sortBy, order]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { setPage(1); }, [statusFilter, severityFilter]);
    useEffect(() => { fetchViolations(); }, [fetchViolations]);

    const handleDismissed = (id: string) => {
        setViolations(prev => prev.map(v => v._id === id ? { ...v, violationStatus: 'dismissed' } : v));
        if (selectedViolation?._id === id) {
            setSelectedViolation(prev => prev ? { ...prev, violationStatus: 'dismissed' } : null);
        }
    };

    const panelOpen = selectedViolation !== null;

    return (
        <div className="flex flex-col h-full bg-[#111111] text-white overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="flex-1 flex gap-4 p-8 min-h-0 items-start">
                <main className={`flex flex-col min-w-0 h-full transition-all duration-200 ${panelOpen ? 'flex-[0_0_50%]' : 'flex-1'}`}>

                    {/* Header */}
                    <header className="pb-5 flex flex-col gap-3 border-b border-white/5 shrink-0">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <h1 className="text-[22px] font-bold text-white tracking-tight leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                                    Violations
                                </h1>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-[10px] font-semibold tracking-wide text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase whitespace-nowrap">
                                        All Races
                                    </span>
                                    <span className="text-[12px] text-gray-500">· {totalItems} violation{totalItems !== 1 ? 's' : ''}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="w-[150px] shrink-0 bg-[#1a1a1a] border border-white/10 rounded-md px-3 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
                            >
                                <option value="All">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="dismissed">Dismissed</option>
                            </select>
                            <select
                                value={severityFilter}
                                onChange={e => setSeverityFilter(e.target.value)}
                                className="w-[140px] shrink-0 bg-[#1a1a1a] border border-white/10 rounded-md px-3 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
                            >
                                <option value="All">All Severities</option>
                                {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>Severity {s}</option>)}
                            </select>
                            <select
                                value={`${sortBy}:${order}`}
                                onChange={e => {
                                    const [field, dir] = e.target.value.split(':');
                                    setSortBy(field);
                                    setOrder(dir as 'asc' | 'desc');
                                    setPage(1);
                                }}
                                className="w-[175px] shrink-0 bg-[#1a1a1a] border border-white/10 rounded-md px-3 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
                            >
                                <option value="created_at:desc">Newest First</option>
                                <option value="created_at:asc">Oldest First</option>
                                <option value="severity:asc">Severity Low–High</option>
                                <option value="severity:desc">Severity High–Low</option>
                                <option value="violationStatus:asc">Group by Status</option>
                            </select>
                        </div>
                    </header>

                    {/* Table */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pt-6">
                        <div className="w-full rounded-xl border border-white/[0.07] bg-[#141414] overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#1a1a1a] border-b border-white/5">
                                        <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Type</th>
                                        {!panelOpen && (
                                            <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Race Round</th>
                                        )}
                                        <th onClick={() => handleSort('severity')} className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase cursor-pointer hover:text-gray-300 select-none whitespace-nowrap">
                                            Severity <SortIcon field="severity" />
                                        </th>
                                        {!panelOpen && (
                                            <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Steward Action</th>
                                        )}
                                        <th onClick={() => handleSort('violationStatus')} className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase cursor-pointer hover:text-gray-300 select-none whitespace-nowrap">
                                            Status <SortIcon field="violationStatus" />
                                        </th>
                                        <th onClick={() => handleSort('created_at')} className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase cursor-pointer hover:text-gray-300 select-none whitespace-nowrap">
                                            Date <SortIcon field="created_at" />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {violations.map(v => {
                                        const vt = v.violationTypeId;
                                        const isSelected = selectedViolation?._id === v._id;
                                        return (
                                            <tr
                                                key={v._id}
                                                onClick={() => setSelectedViolation(isSelected ? null : v)}
                                                className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${isSelected ? 'bg-[#f3b2a5]/5 border-l-2 border-[#f3b2a5]' : ''}`}
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 shrink-0">
                                                            <AlertTriangle size={14} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[13px] text-white font-medium truncate">
                                                                {vt?.violationName ?? <span className="italic text-gray-500">Unknown</span>}
                                                            </p>
                                                            {vt?.type && (
                                                                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${PHASE_BADGE[vt.type] ?? ''}`}>
                                                                    {vt.type}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {!panelOpen && (
                                                    <td className="p-4">
                                                        <p className="text-[12px] text-gray-300 font-medium">{getRoundName(v)}</p>
                                                        <p className="text-[11px] text-gray-600">{getRoundDate(v)}</p>
                                                    </td>
                                                )}

                                                <td className="p-4">
                                                    <span className={`text-[13px] font-bold ${SEVERITY_COLOR[v.severity] ?? 'text-gray-300'}`}>
                                                        {v.severity}/5
                                                    </span>
                                                </td>

                                                {!panelOpen && (
                                                    <td className="p-4">
                                                        <span className="text-[12px] text-gray-400 capitalize">
                                                            {v.stewardAction.replace(/-/g, ' ')}
                                                        </span>
                                                    </td>
                                                )}

                                                <td className="p-4">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${STATUS_BADGE[v.violationStatus]}`}>
                                                        {v.violationStatus}
                                                    </span>
                                                </td>

                                                <td className="p-4">
                                                    <p className="text-[11px] text-gray-600">{fmtDate(v.created_at)}</p>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {loading ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-[13px] text-gray-500">Loading violations…</td></tr>
                                    ) : violations.length === 0 ? (
                                        <tr><td colSpan={6}>
                                            <div className="py-10 text-center">
                                                <AlertTriangle size={22} className="text-gray-700 mx-auto mb-2" />
                                                <p className="text-[12px] text-gray-600">No violations found.</p>
                                            </div>
                                        </td></tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                        <Pagination page={page} totalPages={totalPages} totalItems={totalItems} limit={LIMIT} onPageChange={setPage} />
                    </div>
                </main>

                {/* Detail panel */}
                {panelOpen && (
                    <div className="flex-1 min-w-[420px] h-full">
                        <ViolationDetailPanel
                            violation={selectedViolation!}
                            onClose={() => setSelectedViolation(null)}
                            onDismissed={handleDismissed}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
