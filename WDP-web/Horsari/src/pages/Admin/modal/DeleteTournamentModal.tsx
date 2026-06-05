import { X, Loader2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { adminService } from "../../../api/adminService";
import type { Tournament } from "../../../shared/types/TournamentTypes";

interface DeleteTournamentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (id: string) => void;
    tournament: Tournament | null;
}

export function DeleteTournamentModal({ isOpen, onClose, onSuccess, tournament }: DeleteTournamentModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen || !tournament) return null;

    const handleDelete = async () => {
        setLoading(true);
        setError("");
        try {
            await adminService.deleteTournament(tournament.id);
            onSuccess(tournament.id);
            onClose();
        } catch (err: any) {
            setError(err.msg || "Failed to delete tournament.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-[400px] bg-[#161616] border border-red-500/20 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                <div className="p-6 flex flex-col items-center text-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                        <AlertTriangle size={24} />
                    </div>
                    
                    <h2 className="text-[18px] font-bold text-white tracking-tight leading-tight">
                        Delete Tournament
                    </h2>
                    
                    <p className="text-[13px] text-gray-400">
                        Are you sure you want to delete <span className="text-white font-semibold">{tournament.name}</span>? This action cannot be undone and will permanently remove the tournament and its data.
                    </p>

                    {error && (
                        <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] p-3 rounded text-left mt-2">
                            {error}
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-white/5 bg-[#1a1a1a] flex justify-end gap-3">
                    <button onClick={onClose} disabled={loading} className="px-5 py-2 rounded text-[13px] font-medium text-gray-400 hover:text-white transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleDelete} disabled={loading} className="flex items-center gap-2 px-5 py-2 rounded text-[13px] font-medium text-white bg-red-700 hover:bg-red-600 transition-colors shadow-lg shadow-red-900/20 disabled:opacity-50">
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
