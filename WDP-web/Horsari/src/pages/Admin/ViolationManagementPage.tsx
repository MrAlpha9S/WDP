import { useState, useEffect, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import ViolationDetailPanel from "./AdminComponents/ViolationDetailPanel";
import { adminService } from "../../api/adminService";
import { Pagination } from "../../components/Pagination";
import { ErrorState } from "../../components/ErrorState";
import PageHeader from "../../components/ui/PageHeader";
import SortableTh from "../../components/ui/SortableTh";
import StatusBadge, { type BadgeTone } from "../../components/ui/StatusBadge";
import { useSortableColumns } from "../../hooks/useSortableColumns";
import type { ViolationEntity, ViolationStatus } from "../../shared/types/ViolationTypes";

const STATUS_TONE: Record<ViolationStatus, BadgeTone> = {
    pending: 'amber',
    confirmed: 'green',
    dismissed: 'neutral',
};

const PHASE_BADGE: Record<string, string> = {
    'pre-race':    'bg-violet/15 text-violet border border-violet/30',
    'during-race': 'bg-blue/15 text-blue border border-blue/30',
    'after-race':  'bg-orange/15 text-orange border border-orange/30',
};

// Kept as raw Tailwind rather than tokenized: this is a 5-step severity
// gradient (green -> yellow -> orange -> red -> red) and the design token set
// only has one step per hue (no yellow), so tokenizing it would collapse
// severities 4 and 5 into a visually identical color and lose the distinction.
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
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [severityFilter, setSeverityFilter] = useState<string>('All');
    const [selectedViolation, setSelectedViolation] = useState<ViolationEntity | null>(null);
    const { sortBy, order, setSortBy, setOrder, handleSort } = useSortableColumns("created_at", "desc", () => setPage(1));
    const totalPages = Math.ceil(totalItems / limit) || 1;

    const fetchViolations = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await adminService.getAllViolations(
                page, limit,
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
        } catch (err: any) {
            setViolations([]);
            setError(err?.msg ?? "Failed to load violations.");
        } finally {
            setLoading(false);
        }
    }, [page, limit, statusFilter, severityFilter, sortBy, order]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { setPage(1); }, [statusFilter, severityFilter, limit]);
    useEffect(() => { fetchViolations(); }, [fetchViolations]);

    const handleDismissed = (id: string) => {
        setViolations(prev => prev.map(v => v._id === id ? { ...v, violationStatus: 'dismissed' } : v));
        if (selectedViolation?._id === id) {
            setSelectedViolation(prev => prev ? { ...prev, violationStatus: 'dismissed' } : null);
        }
    };

    const panelOpen = selectedViolation !== null;

    return (
        <div className="flex flex-col h-full bg-bg text-text overflow-hidden font-sans">
            <div className="flex-1 flex gap-4 p-8 min-h-0 items-start">
                <main className={`flex flex-col min-w-0 h-full transition-all duration-200 ${panelOpen ? 'flex-[0_0_50%]' : 'flex-1'}`}>

                    {/* Header */}
                    <header className="pb-5 flex flex-col gap-3 border-b border-border/60 shrink-0">
                        <PageHeader
                            title="Violations"
                            eyebrow="All Races"
                            subtext={`${totalItems} violation${totalItems !== 1 ? 's' : ''}`}
                        />

                        <div className="flex items-center gap-3 flex-wrap">
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                aria-label="Filter by status"
                                className="w-[150px] shrink-0 bg-surface border border-border rounded-md px-3 text-[11px] text-text-muted focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
                            >
                                <option value="All">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="dismissed">Dismissed</option>
                            </select>
                            <select
                                value={severityFilter}
                                onChange={e => setSeverityFilter(e.target.value)}
                                aria-label="Filter by severity"
                                className="w-[140px] shrink-0 bg-surface border border-border rounded-md px-3 text-[11px] text-text-muted focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
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
                                aria-label="Sort violations"
                                className="w-[175px] shrink-0 bg-surface border border-border rounded-md px-3 text-[11px] text-text-muted focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
                            >
                                <option value="created_at:desc">Newest First</option>
                                <option value="created_at:asc">Oldest First</option>
                                <option value="severity:asc">Severity Low–High</option>
                                <option value="severity:desc">Severity High–Low</option>
                                <option value="violationStatus:asc">Group by Status</option>
                            </select>
                            <select
                                value={limit}
                                onChange={e => setLimit(Number(e.target.value))}
                                aria-label="Rows per page"
                                className="w-[130px] shrink-0 bg-surface border border-border rounded-md px-3 text-[11px] text-text-muted focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
                            >
                                {[5, 10, 25, 50, 100].map(n => (
                                    <option key={n} value={n}>{n} rows</option>
                                ))}
                            </select>
                        </div>
                    </header>

                    {/* Table */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pt-6">
                        <div className="w-full rounded-xl border border-border bg-surface overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface border-b border-border/60">
                                        <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase">Type</th>
                                        {!panelOpen && (
                                            <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase">Race Round</th>
                                        )}
                                        <SortableTh field="severity" activeField={sortBy} order={order} onSort={handleSort}>Severity</SortableTh>
                                        {!panelOpen && (
                                            <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase">Steward Action</th>
                                        )}
                                        <SortableTh field="violationStatus" activeField={sortBy} order={order} onSort={handleSort}>Status</SortableTh>
                                        <SortableTh field="created_at" activeField={sortBy} order={order} onSort={handleSort}>Date</SortableTh>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {!error && violations.map(v => {
                                        const vt = v.violationTypeId;
                                        const isSelected = selectedViolation?._id === v._id;
                                        return (
                                            <tr
                                                key={v._id}
                                                role="button"
                                                tabIndex={0}
                                                aria-pressed={isSelected}
                                                onClick={() => setSelectedViolation(isSelected ? null : v)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        setSelectedViolation(isSelected ? null : v);
                                                    }
                                                }}
                                                className={`hover:bg-white/[0.02] transition-colors cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/40 ${isSelected ? 'bg-gold/5 border-l-2 border-gold' : ''}`}
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-8 h-8 rounded bg-white/5 border border-border flex items-center justify-center text-text-muted shrink-0">
                                                            <AlertTriangle size={14} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[13px] text-text font-medium truncate">
                                                                {vt?.violationName ?? <span className="italic text-text-muted">Unknown</span>}
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
                                                        <p className="text-[12px] text-text-muted font-medium">{getRoundName(v)}</p>
                                                        <p className="text-[11px] text-text-muted/70">{getRoundDate(v)}</p>
                                                    </td>
                                                )}

                                                <td className="p-4">
                                                    <span className={`text-[13px] font-bold ${SEVERITY_COLOR[v.severity] ?? 'text-text-muted'}`}>
                                                        {v.severity}/5
                                                    </span>
                                                </td>

                                                {!panelOpen && (
                                                    <td className="p-4">
                                                        <span className="text-[12px] text-text-muted capitalize">
                                                            {v.stewardAction ? v.stewardAction.replace(/-/g, ' ') : '—'}
                                                        </span>
                                                    </td>
                                                )}

                                                <td className="p-4">
                                                    <StatusBadge label={v.violationStatus} tone={STATUS_TONE[v.violationStatus]} dot={false} />
                                                </td>

                                                <td className="p-4">
                                                    <p className="text-[11px] text-text-muted/70">{fmtDate(v.created_at)}</p>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {loading ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-[13px] text-text-muted">Loading violations…</td></tr>
                                    ) : error ? (
                                        <tr><td colSpan={6} className="p-4"><ErrorState message={error} onRetry={fetchViolations} /></td></tr>
                                    ) : violations.length === 0 ? (
                                        <tr><td colSpan={6}>
                                            <div className="py-10 text-center">
                                                <AlertTriangle size={22} className="text-text-muted/60 mx-auto mb-2" />
                                                <p className="text-[12px] text-text-muted">No violations found.</p>
                                            </div>
                                        </td></tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                        <Pagination page={page} totalPages={totalPages} totalItems={totalItems} limit={limit} onPageChange={setPage} />
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
