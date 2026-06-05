import { Search, Shield } from "lucide-react";
import type { ScheduledRace } from "../../../shared/types/RaceTypes";

interface RaceDetailsPanelProps {
    selectedRace?: ScheduledRace;
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

export default function RaceDetailsPanel({ selectedRace }: RaceDetailsPanelProps) {
    return (
        <aside className="h-full bg-[#161616] border border-white/[0.05] rounded-xl flex flex-col overflow-hidden shadow-lg shadow-black/20">
            {selectedRace ? (
                <div className="flex flex-col h-full">
                    {/* ── Header ── */}
                    <div className="px-5 py-6 shrink-0 border-b border-white/[0.05] bg-[#1a1a1a]">
                        <h2 className="text-[18px] font-bold text-white mb-1 tracking-tight leading-tight">{selectedRace.title}</h2>
                        <p className="text-[12px] text-gray-400 mb-3">{selectedRace.tournament}</p>
                        <div className="flex items-center gap-4 text-[11px] font-medium text-gray-500">
                            <span>📅 {selectedRace.date}</span>
                            <span>🕒 {selectedRace.time}</span>
                            {selectedRace.raceType && <span>🏷️ {selectedRace.raceType}</span>}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-6">

                        {/* ── Registrations ── */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-[12px] font-bold text-white uppercase tracking-widest">Registrations</h3>
                                <span className="text-[11px] font-medium text-gray-500">
                                    {(selectedRace.participants as any[]).filter((p: any) => p.status === 'approved').length}
                                    {" "}/ {selectedRace.maxSlots} approved
                                </span>
                            </div>
                            <div className="flex flex-col gap-2">
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
                        </div>

                        {/* ── Referees ── */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-[12px] font-bold text-white uppercase tracking-widest">Referees</h3>
                                <span className="text-[11px] font-medium text-gray-500">
                                    {((selectedRace as any).referees ?? []).length} assigned
                                </span>
                            </div>
                            <div className="flex flex-col gap-2">
                                {(((selectedRace as any).referees ?? []) as any[]).map((ref: any) => {
                                    const colorClass = STATUS_COLORS[ref.assignmentStatus] ?? STATUS_COLORS.pending;
                                    return (
                                        <div key={ref.refereeId ?? ref.fullName} className="flex items-center justify-between p-2.5 rounded bg-[#1f1a1a] border border-white/5">
                                            <div className="flex items-center gap-2">
                                                <Shield size={12} className="text-gray-500 shrink-0" />
                                                <span className="text-[13px] font-semibold text-white truncate">{ref.fullName}</span>
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
        </aside>
    );
}
