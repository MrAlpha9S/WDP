import { AlertTriangle } from "lucide-react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";

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
        <Modal
            title="Reject Registration"
            size="sm"
            onClose={onCancel}
            closeOnBackdrop={!pending}
            footer={<>
                <Button variant="secondary" size="sm" disabled={pending} onClick={onCancel}>
                    Cancel
                </Button>
                <Button variant="destructive" size="sm" loading={pending} onClick={onConfirm}>
                    Reject
                </Button>
            </>}
        >
            <div className="flex flex-col items-center text-center gap-4 py-2">
                <div className="w-12 h-12 rounded-full bg-red/10 flex items-center justify-center text-red">
                    <AlertTriangle size={24} />
                </div>

                <p className="text-[13px] text-text-muted">
                    Are you sure you want to reject your registration for <span className="text-text font-semibold">{target.label}</span>? This action is permanent and cannot be undone.
                </p>

                {error && (
                    <div className="w-full bg-error-bg border border-error-border text-red text-[13px] p-3 rounded-lg text-left">
                        {error}
                    </div>
                )}
            </div>
        </Modal>
    );
}
