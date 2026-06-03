import { X } from "lucide-react";
import type { Tournament } from "../../../shared/types/TournamentTypes";

interface CreateTournamentModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingTournament: Tournament | null;
}

export function CreateTournamentModal({ isOpen, onClose, editingTournament }: CreateTournamentModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-[500px] bg-[#161616] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]">
                    <h2 className="text-[18px] font-bold text-white tracking-tight leading-tight">
                        {editingTournament ? "Edit Tournament" : "Create New Tournament"}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 flex flex-col gap-4">
                    <div>
                        <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Tournament Name</label>
                        <input type="text" defaultValue={editingTournament?.name || ""} placeholder="e.g. Winter Cup" className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50" />
                    </div>
                    
                    <div>
                        <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Description</label>
                        <textarea defaultValue={editingTournament?.description || ""} rows={3} placeholder="Brief description..." className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 resize-none"></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Start Date</label>
                            <input type="date" defaultValue={editingTournament?.startDate || ""} className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 [color-scheme:dark]" />
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">End Date</label>
                            <input type="date" defaultValue={editingTournament?.endDate || ""} className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 [color-scheme:dark]" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Prize Pool</label>
                            <input type="text" defaultValue={editingTournament?.prizePool || ""} placeholder="$100,000" className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50" />
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Status</label>
                            <select defaultValue={editingTournament?.status || "Upcoming"} className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 appearance-none">
                                <option value="upcoming">Upcoming</option>
                                <option value="live">Live</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-white/5 bg-[#1a1a1a] flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 rounded text-[13px] font-medium text-gray-400 hover:text-white transition-colors">
                        Cancel
                    </button>
                    <button onClick={onClose} className="px-5 py-2 rounded text-[13px] font-medium text-white bg-red-700 hover:bg-red-600 transition-colors shadow-lg shadow-red-900/20">
                        {editingTournament ? "Save Changes" : "Create Tournament"}
                    </button>
                </div>
            </div>
        </div>
    );
}
