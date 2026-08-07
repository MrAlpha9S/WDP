import { useEffect } from "react";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export type ModalSize = "sm" | "md" | "lg";

interface ModalProps {
    onClose: () => void;
    title: ReactNode;
    subtitle?: ReactNode;
    icon?: ReactNode;
    size?: ModalSize;
    children: ReactNode;
    footer?: ReactNode;
    /** Set false for destructive confirms where an accidental backdrop click shouldn't dismiss. */
    closeOnBackdrop?: boolean;
}

const SIZE_CLASSES: Record<ModalSize, string> = {
    sm: "max-w-[400px]",
    md: "max-w-[480px]",
    lg: "max-w-[640px]",
};

// Shared modal frame — retires the four independently hand-built modal
// shells (RejectRegistrationModal, ScheduleConfirmModal, Horses.tsx's
// EditHorseModal/RegisterHorseModal, Referee LivePage's HorsePickerModal),
// which had drifted to different max-widths, header paddings, and
// close-button conventions. Backdrop blur + card frame + header/body/footer
// slots only — page-specific content stays with the caller.
export default function Modal({
    onClose,
    title,
    subtitle,
    icon,
    size = "md",
    children,
    footer,
    closeOnBackdrop = true,
}: ModalProps) {
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : undefined}
            onMouseDown={(e) => {
                if (closeOnBackdrop && e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className={`w-full ${SIZE_CLASSES[size]} bg-surface-raised border border-border rounded-xl shadow-2xl shadow-black/40 flex flex-col max-h-[90vh]`}
                style={{ animation: "modalIn 0.15s ease-out" }}
            >
                <style>{`@keyframes modalIn { from { opacity: 0; transform: scale(0.97) translateY(4px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>

                <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border shrink-0">
                    <div className="flex items-start gap-3 min-w-0">
                        {icon && <span className="shrink-0 mt-0.5">{icon}</span>}
                        <div className="min-w-0">
                            <h2 className="text-[15px] font-bold text-text leading-tight truncate">{title}</h2>
                            {subtitle && <p className="text-[12px] text-text-muted mt-0.5">{subtitle}</p>}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="shrink-0 p-1.5 bg-white/5 hover:bg-white/10 text-text-muted hover:text-text rounded border border-border transition-colors cursor-pointer"
                    >
                        <X size={14} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4">{children}</div>

                {footer && (
                    <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
