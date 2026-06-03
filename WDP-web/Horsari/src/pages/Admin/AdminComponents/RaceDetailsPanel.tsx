import { Search } from "lucide-react";
import type { ScheduledRace } from "../../../shared/types/RaceTypes";

interface RaceDetailsPanelProps {
    selectedRace?: ScheduledRace;
}

export default function RaceDetailsPanel({ selectedRace }: RaceDetailsPanelProps) {
    return (
        <aside className="h-full bg-[#161616] border border-white/[0.05] rounded-xl flex flex-col overflow-hidden shadow-lg shadow-black/20">
            {selectedRace ? (
                <div className="flex flex-col h-full">
                    {/* Details Header */}
                    <div className="px-5 py-6 shrink-0 border-b border-white/[0.05] bg-[#1a1a1a]">
                        <h2 className="text-[18px] font-bold text-white mb-1 tracking-tight leading-tight">{selectedRace.title}</h2>
                        <p className="text-[12px] text-gray-400 mb-3">{selectedRace.tournament}</p>
                        <div className="flex items-center gap-4 text-[11px] font-medium text-gray-500">
                            <span>📅 {selectedRace.date}</span>
                            <span>🕒 {selectedRace.time}</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                        {/* Enrolled Horses */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-[12px] font-bold text-white uppercase tracking-widest">Enrolled</h3>
                                <span className="text-[11px] font-medium text-gray-500">{selectedRace.participants.length} / {selectedRace.maxSlots}</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                {selectedRace.participants.map(p => (
                                    <div key={p.horseId} className="flex items-center justify-between p-2.5 rounded bg-[#1f1a1a] border border-white/5">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[13px] font-semibold text-white">{p.horseName}</span>
                                            <span className="text-[11px] text-[#f3b2a5]">Jockey: {p.jockeyName}</span>
                                        </div>
                                        <span className="text-[11px] text-gray-500 font-mono bg-white/5 px-1.5 py-0.5 rounded">Rtg {p.rating}</span>
                                    </div>
                                ))}
                                {selectedRace.participants.length === 0 && (
                                    <div className="text-[12px] text-gray-500 italic p-2 text-center">No horses enrolled yet.</div>
                                )}
                            </div>
                        </div>

                        {/* Pending Invites */}
                        {selectedRace.pendingInvites.length > 0 && selectedRace.participants.length < selectedRace.maxSlots && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Pending Invites</h3>
                                    <span className="text-[11px] font-medium text-amber-500/80">{selectedRace.pendingInvites.length} pending</span>
                                </div>
                                <div className="flex flex-col gap-2 opacity-80">
                                    {selectedRace.pendingInvites.map(inv => (
                                        <div key={inv.id} className="flex items-center justify-between p-2.5 rounded bg-transparent border border-white/5 border-dashed">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[13px] font-medium text-gray-300">{inv.horseName}</span>
                                                <span className="text-[11px] text-gray-500">Owner: {inv.ownerName}</span>
                                            </div>
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50"></span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <Search className="text-gray-500" size={20} />
                    </div>
                    <h3 className="text-[14px] font-bold text-white mb-1">No Race Selected</h3>
                    <p className="text-[12px] text-gray-500 leading-relaxed">
                        Click on a scheduled race from the timeline or table to view enrolled horses and pending invites.
                    </p>
                </div>
            )}
        </aside>
    );
}
