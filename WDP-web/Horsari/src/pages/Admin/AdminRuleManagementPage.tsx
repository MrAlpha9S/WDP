import { useState, useEffect } from "react";
import { Search, ScrollText, CheckCircle, XCircle } from "lucide-react";
import RuleDetailPanel from "./AdminComponents/RuleDetailPanel";
import RuleModal from "./AdminComponents/RuleModal";
import { adminService } from "../../api/adminService";

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

// ── Mock data ─────────────────────────────────────────────────────────────────

// Removed mock data

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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalRule, setModalRule] = useState<RaceEligibilityRule | null>(null);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            setLoading(true);
            const res = await adminService.getRules();
            setRules(res.data);
            if (selectedRule) {
                const updatedSelected = res.data.find((r: any) => r._id === selectedRule._id);
                setSelectedRule(updatedSelected || null);
            }
        } catch (error) {
            console.error("Failed to load rules", error);
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

    const filtered = rules.filter(r => {
        const matchSearch =
            (r.raceType?.toLowerCase().includes(search.toLowerCase()) || false) ||
            (r.requiredBreed?.toLowerCase().includes(search.toLowerCase()) || false);
        const matchStatus = statusFilter === "All" || (statusFilter === "active" ? r.isActive : !r.isActive);
        return matchSearch && matchStatus;
    });

    const panelOpen = selectedRule !== null;

    return (
        <div className="flex flex-col h-full bg-[#111111] text-white overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="flex-1 flex gap-4 p-8 min-h-0 items-start">
                <main className={`flex flex-col min-w-0 h-full transition-all duration-200 ${panelOpen ? "flex-[0_0_50%]" : "flex-1"}`}>

                    {/* Header */}
                    <header className="pb-6 flex items-center justify-between border-b border-white/5 shrink-0">
                        <div>
                            <h1 className="text-[26px] font-bold text-white tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                                Eligibility Rules
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] font-semibold tracking-wide text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase">
                                    All Rules
                                </span>
                                <span className="text-[13px] text-gray-500">· {filtered.length} rule{filtered.length !== 1 ? "s" : ""}</span>
                            </div>
                        </div>

                        <div className="flex gap-3 items-center">
                            <div className="relative w-56">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search type or breed…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-md pl-8 pr-3 text-[12px] text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 h-[34px] transition-colors"
                                />
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="bg-[#1a1a1a] border border-white/10 rounded-md px-3 text-[12px] text-gray-300 focus:outline-none focus:border-white/20 h-[34px] appearance-none cursor-pointer"
                            >
                                <option value="All">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>

                            <button onClick={openCreateModal} className="flex items-center gap-2 px-5 text-[13px] font-medium text-white bg-[#ab3030] rounded hover:bg-[#8f2828] transition-colors shadow-lg shadow-red-900/20 h-[34px]">
                                + Create Rule
                            </button>
                        </div>
                    </header>

                    {/* Table Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pt-6">
                        <div className="w-full rounded-xl border border-white/[0.07] bg-[#141414] overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#1a1a1a] border-b border-white/5">
                                        {(panelOpen
                                            ? ["Race Type", "Age Limit", "Requirements", "Status"]
                                            : ["Race Type", "Age Limit", "Requirements", "Licenses", "Status", "Updated"]
                                        ).map(h => (
                                            <th key={h} className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filtered.map(rule => {
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
                                                        <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
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
