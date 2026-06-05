import { useState } from "react";
import { Search, Shield, X, AlertCircle, Loader2, ChevronDown, ChevronUp, Calendar, Clock, Tag, Ban, Pencil } from "lucide-react";
import type { ScheduledRace } from "../../../shared/types/RaceTypes";
import { adminService } from "../../../api/adminService";

interface RaceDetailsPanelProps {
    selectedRace?: ScheduledRace;
    onRefresh?: () => void;
    onEdit?: () => void;
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

export default function RaceDetailsPanel({ selectedRace, onRefresh, onEdit }: RaceDetailsPanelProps) {
    const [isCancelling, setIsCancelling] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [expandedSection, setExpandedSection] = useState<'registrations' | 'referees' | null>('registrations');

    const handleCancelRace = async () => {
        if (!selectedRace) return;
        setIsCancelling(true);
        try {
            await adminService.cancelRaceRound(selectedRace.id);
            setIsCancelModalOpen(false);
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error("Failed to cancel race round:", error);
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <aside className="h-full bg-[#161616] border border-white/[0.05] rounded-xl flex flex-col overflow-hidden shadow-lg shadow-black/20">
            {selectedRace ? (
                <div className="flex flex-col h-full">
                    {/* ── Header ── */}
                    <div className="px-5 py-6 shrink-0 border-b border-white/[0.05] bg-[#1a1a1a]">
                        <div className="flex flex-col gap-1 mb-4">
                            <div className="flex justify-between items-start w-full gap-4">
                                <div className="flex flex-col gap-2">
                                    <h2 className={`text-[22px] font-bold tracking-tight leading-tight ${selectedRace.status === 'cancelled' ? 'text-gray-500 line-through' : 'text-white'}`}>
                                        {selectedRace.title}
                                    </h2>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border inline-block ${
                                            selectedRace.status === 'cancelled' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                                            selectedRace.status === 'scheduled' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                                            selectedRace.status === 'running' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                                            selectedRace.status === 'completed' ? 'bg-gray-500/15 text-gray-400 border-gray-500/30' :
                                            'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                        }`}>
                                            {selectedRace.status}
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
                                    {selectedRace.status !== 'cancelled' && selectedRace.status !== 'completed' && selectedRace.status !== 'running' && (
                                        <button
                                            onClick={() => setIsCancelModalOpen(true)}
                                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded border border-red-500/20 transition-colors"
                                            title="Cancel Race"
                                        >
                                            <Ban size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-medium text-gray-400">
                            <span className="flex items-center gap-1.5 whitespace-nowrap"><Calendar size={14} className="text-gray-500" /> {selectedRace.date}</span>
                            <span className="flex items-center gap-1.5 whitespace-nowrap"><Clock size={14} className="text-gray-500" /> {selectedRace.time}</span>
                            {selectedRace.raceType && <span className="flex items-center gap-1.5 whitespace-nowrap"><Tag size={14} className="text-gray-500" /> {selectedRace.raceType}</span>}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-6">

                        {/* ── Registrations ── */}
                        <div className="bg-[#181818] border border-white/5 rounded-lg overflow-hidden shrink-0">
                            <button
                                onClick={() => setExpandedSection(prev => prev === 'registrations' ? null : 'registrations')}
                                className="w-full flex items-center justify-between p-3 bg-[#1c1c1c] hover:bg-[#202020] transition-colors"
                            >
                                <h3 className="text-[12px] font-bold text-white uppercase tracking-widest">Registrations</h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-[11px] font-medium text-gray-500">
                                        {(selectedRace.participants as any[]).filter((p: any) => p.status === 'approved').length}
                                        {" "}/ {selectedRace.maxSlots} approved
                                    </span>
                                    {expandedSection === 'registrations' ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                                </div>
                            </button>
                            {expandedSection === 'registrations' && (
                                <div className="flex flex-col gap-2 p-3 border-t border-white/5 max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {((selectedRace.participants as any[]) ?? []).map((p: any) => {
                                    const colorClass = STATUS_COLORS[p.status] ?? STATUS_COLORS.pending;
                                    return (
                                        <div key={p.registrationId ?? p.ownerName} className="p-2.5 rounded bg-[#1f1a1a] border border-white/5 flex flex-col gap-1.5">
                                            {/* Row 1: owner + status */}
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[13px] font-semibold text-white truncate">{p.ownerName}</span>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${colorClass}`}>
                                                    {STATUS_LABEL[p.status] ?? p.status}
                                                </span>
                                            </div>
                                            {/* Row 2: horse + jockey */}
                                            {(p.horseName || p.jockeyName) && (
                                                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                                                    {p.horseName && <span>🐎 {p.horseName}</span>}
                                                    {p.jockeyName && <span className="text-[#f3b2a5]">🎽 {p.jockeyName}</span>}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {((selectedRace.participants as any[]) ?? []).length === 0 && (
                                    <div className="text-[12px] text-gray-500 italic p-2 text-center">No registrations yet.</div>
                                )}
                                </div>
                            )}
                        </div>

                        {/* ── Referees ── */}
                        <div className="bg-[#181818] border border-white/5 rounded-lg overflow-hidden shrink-0">
                            <button
                                onClick={() => setExpandedSection(prev => prev === 'referees' ? null : 'referees')}
                                className="w-full flex items-center justify-between p-3 bg-[#1c1c1c] hover:bg-[#202020] transition-colors"
                            >
                                <h3 className="text-[12px] font-bold text-white uppercase tracking-widest">Referees</h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-[11px] font-medium text-gray-500">
                                        {((selectedRace as any).referees ?? []).length} assigned
                                    </span>
                                    {expandedSection === 'referees' ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                                </div>
                            </button>
                            {expandedSection === 'referees' && (
                                <div className="flex flex-col gap-2 p-3 border-t border-white/5 max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {(((selectedRace as any).referees ?? []) as any[]).map((ref: any) => {
                                    const colorClass = STATUS_COLORS[ref.assignmentStatus] ?? STATUS_COLORS.pending;
                                    return (
                                        <div key={ref.refereeId ?? ref.fullName} className="flex items-center justify-between p-2.5 rounded bg-[#1f1a1a] border border-white/5">
                                            <div className="flex items-center gap-2">
                                                <Shield size={12} className="text-gray-500 shrink-0" />
                                                <span className="text-[13px] font-semibold text-white truncate">{ref.fullName}</span>
                                                {ref.fee !== undefined && (
                                                    <span className="text-[11px] text-gray-400">(${ref.fee})</span>
                                                )}
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${colorClass}`}>
                                                {STATUS_LABEL[ref.assignmentStatus] ?? ref.assignmentStatus}
                                            </span>
                                        </div>
                                    );
                                })}
                                {(((selectedRace as any).referees ?? []) as any[]).length === 0 && (
                                    <div className="text-[12px] text-gray-500 italic p-2 text-center">No referees assigned.</div>
                                )}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <Search className="text-gray-500" size={20} />
                    </div>
                    <h3 className="text-[14px] font-bold text-white mb-1">No Race Selected</h3>
                    <p className="text-[12px] text-gray-500 leading-relaxed">
                        Click on a scheduled race from the timeline or table to view registrations and assigned referees.
                    </p>
                </div>
            )}

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
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Cancelling...
                                    </>
                                ) : (
                                    "Yes, Cancel Race"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
