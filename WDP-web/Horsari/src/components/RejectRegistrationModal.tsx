import { Loader2, AlertTriangle } from "lucide-react";

interface RejectRegistrationModalProps {
    target: { id: string; label: string } | null;
    pending: boolean;
    error: string | null;
    onConfirm: () => void;
    onCancel: () => void;
}

// Shared "reject this registration" confirmation — see useRejectRegistration for the
// control flow. Used by every page that shows an owner's own registration.
export function RejectRegistrationModal({ target, pending, error, onConfirm, onCancel }: RejectRegistrationModalProps) {
    if (!target) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-[400px] bg-surface border border-red-500/20 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                <div className="p-6 flex flex-col items-center text-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                        <AlertTriangle size={24} />
                    </div>

                    <h2 className="text-[18px] font-bold text-white tracking-tight leading-tight">
                        Reject Registration
                    </h2>

                    <p className="text-[13px] text-gray-400">
                        Are you sure you want to reject your registration for <span className="text-white font-semibold">{target.label}</span>? This action is permanent and cannot be undone.
                    </p>

                    {error && (
                        <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] p-3 rounded text-left mt-2">
                            {error}
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-border/60 bg-surface-raised flex justify-end gap-3">
                    <button onClick={onCancel} disabled={pending} className="px-5 py-2 rounded text-[13px] font-medium text-gray-400 hover:text-white transition-colors disabled:opacity-50">
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={pending} className="flex items-center gap-2 px-5 py-2 rounded text-[13px] font-medium text-white bg-red-700 hover:bg-red-600 transition-colors shadow-lg shadow-red-900/20 disabled:opacity-50">
                        {pending && <Loader2 size={14} className="animate-spin" />}
                        Reject
                    </button>
                </div>
            </div>
        </div>
    );
}
