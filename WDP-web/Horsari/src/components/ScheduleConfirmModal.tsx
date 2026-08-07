import { TriangleAlert } from "lucide-react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";

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
        <Modal
            title={title}
            icon={<div className="p-2 bg-amber/20 rounded-full"><TriangleAlert className="text-amber" size={20} /></div>}
            size="sm"
            onClose={() => !pending && onCancel()}
            closeOnBackdrop={!pending}
            footer={<>
                <Button variant="secondary" size="sm" disabled={pending} onClick={onCancel}>
                    Go Back
                </Button>
                <Button
                    size="sm"
                    loading={pending}
                    className="bg-amber hover:bg-amber/85"
                    onClick={onConfirm}
                >
                    {pending ? pendingLabel : `Yes, ${actionVerb} Anyway`}
                </Button>
            </>}
        >
            <p className="text-[14px] text-text-muted leading-relaxed">
                {message} Are you sure you want to {actionVerb.toLowerCase()} it anyway?
            </p>
            {error && (
                <p className="text-[12px] text-red mt-3 bg-error-bg border border-error-border rounded-lg px-3 py-2">{error}</p>
            )}
        </Modal>
    );
}
