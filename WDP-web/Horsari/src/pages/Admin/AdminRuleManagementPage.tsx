import { useState, useEffect } from "react";
import { Search, ScrollText, CheckCircle, XCircle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import RuleDetailPanel from "./AdminComponents/RuleDetailPanel";
import RuleModal from "./AdminComponents/RuleModal";
import { adminService } from "../../api/adminService";
import { Pagination } from "../../components/Pagination";
import { ErrorState } from "../../components/ErrorState";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RaceEligibilityRule {
    _id: string;
    minAge: number | null;
    maxAge: number | null;
    minRacesRun: number;
    minRacesWon: number;
    requiredGender: "male" | "female" | null;
    requiredBreed: string | null;
    licenseRequired: boolean;
    requireNomination: boolean;
    isActive: boolean;
    raceType: string | null;
    create_at: string;
    updated_at: string;
}



export const STATUS_STYLES: Record<"active" | "inactive", { icon: React.ReactNode; text: string; color: string }> = {
    active: { icon: <CheckCircle size={13} />, text: "Active", color: "text-emerald-400" },
    inactive: { icon: <XCircle size={13} />, text: "Inactive", color: "text-gray-500" },
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminRuleManagementPage() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"All" | "active" | "inactive">("All");
    const [selectedRule, setSelectedRule] = useState<RaceEligibilityRule | null>(null);
    const [rules, setRules] = useState<RaceEligibilityRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalRule, setModalRule] = useState<RaceEligibilityRule | null>(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [sortBy, setSortBy] = useState<string>('createdAt');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const totalPages = Math.ceil(totalItems / limit) || 1;

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
            ? <ArrowUp size={11} className="text-gold ml-1 inline" />
            : <ArrowDown size={11} className="text-gold ml-1 inline" />;
    };

    useEffect(() => { setPage(1); }, [search, limit]);
    useEffect(() => { fetchRules(); }, [page, limit, search, sortBy, order]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchRules = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await adminService.getRules(page, limit, search || undefined, sortBy, order);
            const items: RaceEligibilityRule[] = res.data?.items ?? [];
            setRules(items);
            setTotalItems(res.data?.pagination?.totalItems ?? items.length);
            if (selectedRule) {
                const updatedSelected = items.find((r: any) => r._id === selectedRule._id);
                setSelectedRule(updatedSelected || null);
            }
        } catch (err: any) {
            console.error("Failed to load rules", err);
            setError(err?.msg ?? "Failed to load rules.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRule = async (data: any) => {
        if (modalRule) {
            await adminService.updateRule(modalRule._id, data);
        } else {
            await adminService.createRule(data);
        }
        await fetchRules();
    };

    const handleToggleActive = async (rule: RaceEligibilityRule) => {
        try {
            await adminService.updateRule(rule._id, { isActive: !rule.isActive });
            await fetchRules();
        } catch (error) {
            console.error("Failed to toggle active", error);
        }
    };

    const openCreateModal = () => {
        setModalRule(null);
        setIsModalOpen(true);
    };

    const openEditModal = (rule: RaceEligibilityRule) => {
        setModalRule(rule);
        setIsModalOpen(true);
    };

    // search is handled server-side; only apply status filter client-side
    const filtered = rules.filter(r =>
        statusFilter === "All" || (statusFilter === "active" ? r.isActive : !r.isActive)
    );

    const panelOpen = selectedRule !== null;

    return (
        <div className="flex flex-col h-full bg-bg text-white overflow-hidden font-sans">
            <div className="flex-1 flex gap-4 p-8 min-h-0 items-start">
                <main className={`flex flex-col min-w-0 h-full transition-all duration-200 ${panelOpen ? "flex-[0_0_50%]" : "flex-1"}`}>

                    {/* Header */}
                    <header className="pb-5 flex flex-col gap-3 border-b border-border/60 shrink-0">
                        {/* Row 1 */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <h1 className="text-[22px] font-bold text-white tracking-tight leading-tight truncate font-serif">
                                    Eligibility Rules
                                </h1>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-[10px] font-semibold tracking-wide text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-border uppercase whitespace-nowrap">
                                        All Rules
                                    </span>
                                    <span className="text-[12px] text-gray-500 truncate">· {totalItems} rule{totalItems !== 1 ? "s" : ""}</span>
                                </div>
                            </div>
                            <button onClick={openCreateModal} className="shrink-0 flex items-center gap-2 px-4 text-[12px] font-medium text-white bg-[#ab3030] rounded hover:bg-[#8f2828] transition-colors shadow-lg shadow-red-900/20 h-[32px]">
                                + Create Rule
                            </button>
                        </div>

                        {/* Row 2 */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="relative flex-1 min-w-0">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search type or breed…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full bg-surface border border-border rounded-md pl-8 pr-3 text-[11px] text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 h-[32px] transition-colors"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="w-[130px] shrink-0 bg-surface border border-border rounded-md px-3 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
                            >
                                <option value="All">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            <select
                                value={`${sortBy}:${order}`}
                                onChange={e => {
                                    const [field, dir] = e.target.value.split(':');
                                    setSortBy(field);
                                    setOrder(dir as 'asc' | 'desc');
                                    setPage(1);
                                }}
                                className="w-[175px] shrink-0 bg-surface border border-border rounded-md px-3 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
                            >
                                <option value="createdAt:desc">Newest First</option>
                                <option value="createdAt:asc">Oldest First</option>
                                <option value="raceType:asc">Race Type A–Z</option>
                                <option value="raceType:desc">Race Type Z–A</option>
                                <option value="minAge:asc">Age Limit Low–High</option>
                                <option value="minAge:desc">Age Limit High–Low</option>
                                <option value="isActive:desc">Active First</option>
                                <option value="isActive:asc">Inactive First</option>
                            </select>
                            <select
                                value={limit}
                                onChange={(e) => setLimit(Number(e.target.value))}
                                className="w-[130px] shrink-0 bg-surface border border-border rounded-md px-3 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
                            >
                                {[5, 10, 25, 50, 100].map(n => (
                                    <option key={n} value={n}>{n} rows</option>
                                ))}
                            </select>
                        </div>
                    </header>

                    {/* Table Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pt-6">
                        <div className="w-full rounded-xl border border-border bg-surface overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface border-b border-border/60">
                                        <th onClick={() => handleSort('raceType')} className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase cursor-pointer hover:text-gray-300 select-none whitespace-nowrap">
                                            Race Type <SortIcon field="raceType" />
                                        </th>
                                        <th onClick={() => handleSort('minAge')} className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase cursor-pointer hover:text-gray-300 select-none whitespace-nowrap">
                                            Age Limit <SortIcon field="minAge" />
                                        </th>
                                        <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Requirements</th>
                                        {!panelOpen && (
                                            <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Licenses</th>
                                        )}
                                        <th onClick={() => handleSort('isActive')} className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase cursor-pointer hover:text-gray-300 select-none whitespace-nowrap">
                                            Status <SortIcon field="isActive" />
                                        </th>
                                        {!panelOpen && (
                                            <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Updated</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {!error && filtered.map(rule => {
                                        const isSelected = selectedRule?._id === rule._id;
                                        const statusStyle = STATUS_STYLES[rule.isActive ? "active" : "inactive"];

                                        return (
                                            <tr
                                                key={rule._id}
                                                onClick={() => setSelectedRule(isSelected ? null : rule)}
                                                className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${isSelected ? "bg-red-900/10" : ""}`}
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-8 h-8 rounded bg-white/5 border border-border flex items-center justify-center text-gray-400">
                                                            <ScrollText size={14} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[13px] text-white font-medium truncate">{rule.raceType || <span className="italic text-gray-500">Any</span>}</p>
                                                            {!panelOpen && <p className="text-[11px] text-gray-600 truncate">{rule._id.slice(-6)}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <p className="text-[12px] text-gray-300">
                                                        {rule.minAge == null && rule.maxAge == null ? <span className="italic text-gray-500">Any Age</span> :
                                                            `${rule.minAge ?? 'Min'} - ${rule.maxAge ?? 'Max'} yrs`}
                                                    </p>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-0.5">
                                                        <p className="text-[11px] text-gray-400">Runs: <span className="text-gray-200">{rule.minRacesRun}</span> | Wins: <span className="text-gray-200">{rule.minRacesWon}</span></p>
                                                        {!panelOpen && (
                                                            <p className="text-[11px] text-gray-500">
                                                                Breed: {rule.requiredBreed || "Any"} | Gender: {rule.requiredGender || "Any"}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                {!panelOpen && (
                                                    <td className="p-4">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className={rule.licenseRequired ? "text-[11px] text-emerald-400" : "text-[11px] text-gray-500"}>
                                                                {rule.licenseRequired ? "License Req." : "No License Req."}
                                                            </span>
                                                            <span className={rule.requireNomination ? "text-[11px] text-emerald-400" : "text-[11px] text-gray-500"}>
                                                                {rule.requireNomination ? "Nomination Req." : "No Nomination Req."}
                                                            </span>
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="p-4">
                                                    <span className={`flex items-center gap-1 text-[12px] font-medium ${statusStyle.color}`}>
                                                        {statusStyle.icon}
                                                        {!panelOpen && <span className="hidden xl:inline">{statusStyle.text}</span>}
                                                    </span>
                                                </td>
                                                {!panelOpen && (
                                                    <td className="p-4">
                                                        <p className="text-[11px] text-gray-600">{new Date(rule.updated_at).toLocaleDateString()}</p>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-[13px] text-gray-500">Loading rules...</td>
                                        </tr>
                                    ) : error ? (
                                        <tr>
                                            <td colSpan={6} className="p-4"><ErrorState message={error} onRetry={fetchRules} /></td>
                                        </tr>
                                    ) : filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={6}>
                                                <div className="py-10 text-center">
                                                    <ScrollText size={22} className="text-gray-700 mx-auto mb-2" />
                                                    <p className="text-[12px] text-gray-600">No rules found.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            limit={limit}
                            onPageChange={setPage}
                        />
                    </div>
                </main>

                {/* Detail panel */}
                {panelOpen && (
                    <div className="flex-1 min-w-[500px] h-full">
                        <RuleDetailPanel
                            rule={selectedRule!}
                            onClose={() => setSelectedRule(null)}
                            onEdit={openEditModal}
                            onToggleActive={handleToggleActive}
                        />
                    </div>
                )}
            </div>

            {/* Modal */}
            <RuleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveRule}
                rule={modalRule}
            />
        </div>
    );
}
