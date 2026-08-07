import { useState, useEffect, useCallback } from "react";
import { Search, ShieldAlert, CheckCircle, XCircle } from "lucide-react";
import ViolationTypeModal from "./AdminComponents/ViolationTypeModal";
import { adminService } from "../../api/adminService";
import { Pagination } from "../../components/Pagination";
import { ErrorState } from "../../components/ErrorState";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import SortableTh from "../../components/ui/SortableTh";
import { useSortableColumns } from "../../hooks/useSortableColumns";
import type { ViolationTypeEntity, ViolationRacePhase, ViolationCategory } from "../../shared/types/ViolationTypes";

const PHASE_BADGE: Record<ViolationRacePhase, string> = {
    'pre-race':    'bg-violet/15 text-violet border-violet/30',
    'during-race': 'bg-blue/15 text-blue border-blue/30',
    'after-race':  'bg-orange/15 text-orange border-orange/30',
};

// 'medication' kept raw (pink) — no pink token exists and this is the only
// place it's used, so it wasn't worth expanding the token set for one badge.
const CATEGORY_BADGE: Record<ViolationCategory, string> = {
    'riding':          'bg-green/15 text-green border-green/30',
    'horse-safety':    'bg-red/15 text-red border-red/30',
    'medication':      'bg-pink-500/15 text-pink-400 border-pink-500/30',
    'betting':         'bg-amber/15 text-amber border-amber/30',
    'administrative':  'bg-white/8 text-text-muted border-white/15',
};

const SEVERITY_COLOR = ['', 'text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-400', 'text-red-500'];

export default function ViolationTypeManagementPage() {
    const [items, setItems] = useState<ViolationTypeEntity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('All');
    const [categoryFilter, setCategoryFilter] = useState<string>('All');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalItem, setModalItem] = useState<ViolationTypeEntity | null>(null);
    const { sortBy, order, setSortBy, setOrder, handleSort } = useSortableColumns("createdAt", "desc", () => setPage(1));
    const totalPages = Math.ceil(totalItems / limit) || 1;

    const fetchTypes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await adminService.getAllViolationTypes(
                page, limit,
                search || undefined,
                typeFilter !== 'All' ? typeFilter : undefined,
                categoryFilter !== 'All' ? categoryFilter : undefined,
                sortBy,
                order,
            );
            const list: ViolationTypeEntity[] = res.data?.items ?? [];
            setItems(list);
            setTotalItems(res.data?.pagination?.totalItems ?? list.length);
        } catch (err: any) {
            setItems([]);
            setError(err?.msg ?? "Failed to load violation types.");
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, typeFilter, categoryFilter, sortBy, order]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { setPage(1); }, [search, typeFilter, categoryFilter, limit]);
    useEffect(() => { fetchTypes(); }, [fetchTypes]);

    const handleSave = async (data: Partial<ViolationTypeEntity>) => {
        if (modalItem) {
            await adminService.updateViolationType(modalItem._id, data);
        } else {
            await adminService.createViolationType(data);
        }
        await fetchTypes();
    };

    const handleToggleActive = async (item: ViolationTypeEntity) => {
        try {
            await adminService.toggleViolationTypeActive(item._id, !item.isActive);
            await fetchTypes();
        } catch {
            // silent
        }
    };

    const openCreate = () => { setModalItem(null); setIsModalOpen(true); };
    const openEdit = (item: ViolationTypeEntity) => { setModalItem(item); setIsModalOpen(true); };

    return (
        <div className="flex flex-col h-full bg-bg text-text overflow-hidden font-sans">
            <div className="flex-1 flex gap-4 p-8 min-h-0 items-start">
                <main className="flex flex-col min-w-0 h-full flex-1">

                    {/* Header */}
                    <header className="pb-5 flex flex-col gap-3 border-b border-border/60 shrink-0">
                        <PageHeader
                            title="Violation Types"
                            eyebrow="All Types"
                            subtext={`${totalItems} type${totalItems !== 1 ? 's' : ''}`}
                            actions={<Button size="sm" onClick={openCreate}>+ Create Type</Button>}
                        />

                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="relative flex-1 min-w-0">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    type="text"
                                    placeholder="Search violation types…"
                                    aria-label="Search violation types"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full bg-surface border border-border rounded-md pl-8 pr-3 text-[11px] text-text placeholder:text-text-muted focus:outline-none focus:border-white/20 h-[32px] transition-colors"
                                />
                            </div>
                            <select
                                value={typeFilter}
                                onChange={e => setTypeFilter(e.target.value)}
                                aria-label="Filter by phase"
                                className="w-[150px] shrink-0 bg-surface border border-border rounded-md px-3 text-[11px] text-text-muted focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
                            >
                                <option value="All">All Phases</option>
                                <option value="pre-race">Pre-Race</option>
                                <option value="during-race">During Race</option>
                                <option value="after-race">After Race</option>
                            </select>
                            <select
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                                aria-label="Filter by category"
                                className="w-[160px] shrink-0 bg-surface border border-border rounded-md px-3 text-[11px] text-text-muted focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
                            >
                                <option value="All">All Categories</option>
                                <option value="riding">Riding</option>
                                <option value="horse-safety">Horse Safety</option>
                                <option value="medication">Medication</option>
                                <option value="betting">Betting</option>
                                <option value="administrative">Administrative</option>
                            </select>
                            <select
                                value={`${sortBy}:${order}`}
                                onChange={e => {
                                    const [field, dir] = e.target.value.split(':');
                                    setSortBy(field);
                                    setOrder(dir as 'asc' | 'desc');
                                    setPage(1);
                                }}
                                aria-label="Sort violation types"
                                className="w-[175px] shrink-0 bg-surface border border-border rounded-md px-3 text-[11px] text-text-muted focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
                            >
                                <option value="createdAt:desc">Newest First</option>
                                <option value="createdAt:asc">Oldest First</option>
                                <option value="violationName:asc">Name A–Z</option>
                                <option value="violationName:desc">Name Z–A</option>
                                <option value="type:asc">Group by Phase</option>
                                <option value="category:asc">Group by Category</option>
                                <option value="severity:asc">Severity Low–High</option>
                                <option value="severity:desc">Severity High–Low</option>
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
                                        <SortableTh field="violationName" activeField={sortBy} order={order} onSort={handleSort}>Name</SortableTh>
                                        <SortableTh field="type" activeField={sortBy} order={order} onSort={handleSort}>Phase</SortableTh>
                                        <SortableTh field="category" activeField={sortBy} order={order} onSort={handleSort}>Category</SortableTh>
                                        <SortableTh field="severity" activeField={sortBy} order={order} onSort={handleSort}>Severity</SortableTh>
                                        <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase whitespace-nowrap">
                                            Default Penalty
                                        </th>
                                        <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase whitespace-nowrap">
                                            Status
                                        </th>
                                        <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase whitespace-nowrap">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {!error && items.map(item => (
                                        <tr
                                            key={item._id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => openEdit(item)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    openEdit(item);
                                                }
                                            }}
                                            className="hover:bg-white/[0.02] transition-colors cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/40"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-8 h-8 rounded bg-white/5 border border-border flex items-center justify-center text-text-muted shrink-0">
                                                        <ShieldAlert size={14} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] text-text font-medium truncate">{item.violationName}</p>
                                                        {item.violationDescription && (
                                                            <p className="text-[11px] text-text-muted truncate max-w-[200px]">{item.violationDescription}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${PHASE_BADGE[item.type] ?? ''}`}>
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${CATEGORY_BADGE[item.category] ?? ''}`}>
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-[13px] font-bold ${SEVERITY_COLOR[item.severity] ?? 'text-text-muted'}`}>
                                                    {item.severity}/5
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-[12px] text-text-muted truncate max-w-[160px] block">
                                                    {item.defaultPenalty || <span className="italic text-text-muted/70">None</span>}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`flex items-center gap-1 text-[12px] font-medium ${item.isActive ? 'text-green' : 'text-text-muted'}`}>
                                                    {item.isActive
                                                        ? <><CheckCircle size={13} /> Active</>
                                                        : <><XCircle size={13} /> Inactive</>
                                                    }
                                                </span>
                                            </td>
                                            <td className="p-4" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleToggleActive(item)}
                                                    className={`text-[11px] font-bold px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                                                        item.isActive
                                                            ? 'border-white/15 text-text-muted hover:bg-white/8'
                                                            : 'border-green/40 text-green hover:bg-green/10'
                                                    }`}
                                                >
                                                    {item.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {loading ? (
                                        <tr><td colSpan={7} className="p-8 text-center text-[13px] text-text-muted">Loading…</td></tr>
                                    ) : error ? (
                                        <tr><td colSpan={7} className="p-4"><ErrorState message={error} onRetry={fetchTypes} /></td></tr>
                                    ) : items.length === 0 ? (
                                        <tr><td colSpan={7}>
                                            <div className="py-10 text-center">
                                                <ShieldAlert size={22} className="text-text-muted/60 mx-auto mb-2" />
                                                <p className="text-[12px] text-text-muted">No violation types found.</p>
                                            </div>
                                        </td></tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                        <Pagination page={page} totalPages={totalPages} totalItems={totalItems} limit={limit} onPageChange={setPage} />
                    </div>
                </main>
            </div>

            <ViolationTypeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                item={modalItem}
            />
        </div>
    );
}
