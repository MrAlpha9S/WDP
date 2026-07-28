import { Loader2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { adminService } from "../../../api/adminService";

interface CancelTournamentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    tournamentId: string;
    tournamentName: string;
}

export function CancelTournamentModal({ isOpen, onClose, onSuccess, tournamentId, tournamentName }: CancelTournamentModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleCancel = async () => {
        setLoading(true);
        setError("");
        try {
            await adminService.updateTournamentStatus(tournamentId, "cancelled");
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.msg || "Failed to cancel tournament.");
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
                        Cancel Tournament
                    </h2>

                    <p className="text-[13px] text-gray-400">
                        Are you sure you want to cancel <span className="text-white font-semibold">{tournamentName}</span>? All of its unfinished race rounds will be cancelled, pending predictions on them will be refunded, and this cannot be undone.
                    </p>

                    {error && (
                        <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] p-3 rounded text-left mt-2">
                            {error}
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-white/5 bg-[#1a1a1a] flex justify-end gap-3">
                    <button onClick={onClose} disabled={loading} className="px-5 py-2 rounded text-[13px] font-medium text-gray-400 hover:text-white transition-colors">
                        Keep Tournament
                    </button>
                    <button onClick={handleCancel} disabled={loading} className="flex items-center gap-2 px-5 py-2 rounded text-[13px] font-medium text-white bg-red-700 hover:bg-red-600 transition-colors shadow-lg shadow-red-900/20 disabled:opacity-50">
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        Cancel Tournament
                    </button>
                </div>
            </div>
        </div>
    );
}
