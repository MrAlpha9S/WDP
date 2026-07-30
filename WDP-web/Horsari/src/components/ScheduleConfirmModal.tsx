import { TriangleAlert, X, Loader2 } from "lucide-react";

interface ScheduleConfirmModalProps {
    open: boolean;
    title: string;
    message: string;
    actionVerb: string;
    /** Gerund form shown while pending, e.g. "Starting..." / "Preparing..." (irregular, so not derived from actionVerb). */
    pendingLabel: string;
    pending: boolean;
    error?: string | null;
    onConfirm: () => void;
    onCancel: () => void;
}

// Shared "are you sure you want to do this outside its normal schedule?" confirmation,
// used by both the Admin start-race action and the Referee prepare/finalize action —
// see useScheduleGate in utils/raceDayUtil.ts for the gating logic that decides when to
// show this.
export function ScheduleConfirmModal({ open, title, message, actionVerb, pendingLabel, pending, error, onConfirm, onCancel }: ScheduleConfirmModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#161616] border border-white/10 rounded-xl shadow-2xl w-[400px] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#1a1a1a]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-full">
                            <TriangleAlert className="text-amber-500" size={20} />
                        </div>
                        <h3 className="text-[16px] font-bold text-white">{title}</h3>
                    </div>
                    <button
                        onClick={() => !pending && onCancel()}
                        disabled={pending}
                        className="text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-[14px] text-gray-300 leading-relaxed">
                        {message} Are you sure you want to {actionVerb.toLowerCase()} it anyway?
                    </p>
                    {error && (
                        <p className="text-[12px] text-red-400 mt-3 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{error}</p>
                    )}
                </div>
                <div className="p-5 border-t border-white/5 bg-[#1a1a1a] flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        disabled={pending}
                        className="px-4 py-2 text-[13px] font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors disabled:opacity-50"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={pending}
                        className="px-4 py-2 text-[13px] font-medium text-white bg-amber-600 hover:bg-amber-700 rounded transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {pending ? (
                            <><Loader2 size={14} className="animate-spin" /> {pendingLabel}</>
                        ) : (
                            `Yes, ${actionVerb} Anyway`
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
