import { useState, useEffect, useCallback } from "react";
import { Search, ShieldAlert, CheckCircle, XCircle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import ViolationTypeModal from "./AdminComponents/ViolationTypeModal";
import { adminService } from "../../api/adminService";
import { Pagination } from "../../components/Pagination";
import type { ViolationTypeEntity, ViolationRacePhase, ViolationCategory } from "../../shared/types/ViolationTypes";

const PHASE_BADGE: Record<ViolationRacePhase, string> = {
    'pre-race':    'bg-violet-500/15 text-violet-400 border-violet-500/30',
    'during-race': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'after-race':  'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

const CATEGORY_BADGE: Record<ViolationCategory, string> = {
    'riding':          'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'horse-safety':    'bg-red-500/15 text-red-400 border-red-500/30',
    'medication':      'bg-pink-500/15 text-pink-400 border-pink-500/30',
    'betting':         'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'administrative':  'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

const SEVERITY_COLOR = ['', 'text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-400', 'text-red-500'];

export default function ViolationTypeManagementPage() {
    const [items, setItems] = useState<ViolationTypeEntity[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('All');
    const [categoryFilter, setCategoryFilter] = useState<string>('All');
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalItem, setModalItem] = useState<ViolationTypeEntity | null>(null);
    const [sortBy, setSortBy] = useState<string>('createdAt');
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

    const fetchTypes = useCallback(async () => {
        try {
            setLoading(true);
            const res = await adminService.getAllViolationTypes(
                page, LIMIT,
                search || undefined,
                typeFilter !== 'All' ? typeFilter : undefined,
                categoryFilter !== 'All' ? categoryFilter : undefined,
                sortBy,
                order,
            );
            const list: ViolationTypeEntity[] = res.data?.items ?? [];
            setItems(list);
            setTotalItems(res.data?.pagination?.totalItems ?? list.length);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [page, search, typeFilter, categoryFilter, sortBy, order]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { setPage(1); }, [search, typeFilter, categoryFilter]);
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
        <div className="flex flex-col h-full bg-[#111111] text-white overflow-hidden font-sans">
            <div className="flex-1 flex gap-4 p-8 min-h-0 items-start">
                <main className="flex flex-col min-w-0 h-full flex-1">

                    {/* Header */}
                    <header className="pb-5 flex flex-col gap-3 border-b border-white/5 shrink-0">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <h1 className="text-[22px] font-bold text-white tracking-tight leading-tight font-serif">
                                    Violation Types
                                </h1>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-[10px] font-semibold tracking-wide text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase whitespace-nowrap">
                                        All Types
                                    </span>
                                    <span className="text-[12px] text-gray-500">· {totalItems} type{totalItems !== 1 ? 's' : ''}</span>
                                </div>
                            </div>
                            <button onClick={openCreate} className="shrink-0 flex items-center gap-2 px-4 text-[12px] font-medium text-white bg-[#ab3030] rounded hover:bg-[#8f2828] transition-colors shadow-lg shadow-red-900/20 h-[32px]">
                                + Create Type
                            </button>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="relative flex-1 min-w-0">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search violation types…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-md pl-8 pr-3 text-[11px] text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 h-[32px] transition-colors"
                                />
                            </div>
                            <select
                                value={typeFilter}
                                onChange={e => setTypeFilter(e.target.value)}
                                className="w-[150px] shrink-0 bg-[#1a1a1a] border border-white/10 rounded-md px-3 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
                            >
                                <option value="All">All Phases</option>
                                <option value="pre-race">Pre-Race</option>
                                <option value="during-race">During Race</option>
                                <option value="after-race">After Race</option>
                            </select>
                            <select
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                                className="w-[160px] shrink-0 bg-[#1a1a1a] border border-white/10 rounded-md px-3 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
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
                                className="w-[175px] shrink-0 bg-[#1a1a1a] border border-white/10 rounded-md px-3 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
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
                        </div>
                    </header>

                    {/* Table */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pt-6">
                        <div className="w-full rounded-xl border border-white/[0.07] bg-[#141414] overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#1a1a1a] border-b border-white/5">
                                        <th onClick={() => handleSort('violationName')} className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase cursor-pointer hover:text-gray-300 select-none whitespace-nowrap">
                                            Name <SortIcon field="violationName" />
                                        </th>
                                        <th onClick={() => handleSort('type')} className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase cursor-pointer hover:text-gray-300 select-none whitespace-nowrap">
                                            Phase <SortIcon field="type" />
                                        </th>
                                        <th onClick={() => handleSort('category')} className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase cursor-pointer hover:text-gray-300 select-none whitespace-nowrap">
                                            Category <SortIcon field="category" />
                                        </th>
                                        <th onClick={() => handleSort('severity')} className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase cursor-pointer hover:text-gray-300 select-none whitespace-nowrap">
                                            Severity <SortIcon field="severity" />
                                        </th>
                                        <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase whitespace-nowrap">
                                            Default Penalty
                                        </th>
                                        <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase whitespace-nowrap">
                                            Status
                                        </th>
                                        <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase whitespace-nowrap">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {items.map(item => (
                                        <tr
                                            key={item._id}
                                            onClick={() => openEdit(item)}
                                            className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 shrink-0">
                                                        <ShieldAlert size={14} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] text-white font-medium truncate">{item.violationName}</p>
                                                        {item.violationDescription && (
                                                            <p className="text-[11px] text-gray-600 truncate max-w-[200px]">{item.violationDescription}</p>
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
                                                <span className={`text-[13px] font-bold ${SEVERITY_COLOR[item.severity] ?? 'text-gray-300'}`}>
                                                    {item.severity}/5
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-[12px] text-gray-400 truncate max-w-[160px] block">
                                                    {item.defaultPenalty || <span className="italic text-gray-600">None</span>}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`flex items-center gap-1 text-[12px] font-medium ${item.isActive ? 'text-emerald-400' : 'text-gray-500'}`}>
                                                    {item.isActive
                                                        ? <><CheckCircle size={13} /> Active</>
                                                        : <><XCircle size={13} /> Inactive</>
                                                    }
                                                </span>
                                            </td>
                                            <td className="p-4" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleToggleActive(item)}
                                                    className={`text-[11px] font-bold px-2.5 py-1 rounded border transition-colors ${
                                                        item.isActive
                                                            ? 'border-gray-600/40 text-gray-400 hover:bg-gray-600/20'
                                                            : 'border-emerald-600/40 text-emerald-400 hover:bg-emerald-600/10'
                                                    }`}
                                                >
                                                    {item.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {loading ? (
                                        <tr><td colSpan={7} className="p-8 text-center text-[13px] text-gray-500">Loading…</td></tr>
                                    ) : items.length === 0 ? (
                                        <tr><td colSpan={7}>
                                            <div className="py-10 text-center">
                                                <ShieldAlert size={22} className="text-gray-700 mx-auto mb-2" />
                                                <p className="text-[12px] text-gray-600">No violation types found.</p>
                                            </div>
                                        </td></tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                        <Pagination page={page} totalPages={totalPages} totalItems={totalItems} limit={LIMIT} onPageChange={setPage} />
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
