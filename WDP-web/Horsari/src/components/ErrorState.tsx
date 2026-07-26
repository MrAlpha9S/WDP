import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
    message: string;
    onRetry?: () => void | Promise<void>;
    className?: string;
}

// Shared "can't load this" box: red-bordered card + icon + message + optional
// retry button. Extracted from the pattern already used in
// Management/Races.tsx, Jockeys.tsx and Invitations.tsx so every page renders
// the same error affordance instead of ad-hoc copies.
export function ErrorState({ message, onRetry, className }: ErrorStateProps) {
    return (
        <div
            className={[
                "flex items-center justify-between gap-3 text-red-400 text-[13px]",
                "bg-red-900/10 border border-red-700/30 rounded-xl px-5 py-4",
                className ?? "",
            ].join(" ")}
        >
            <span className="flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                {message}
            </span>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-lg border border-red-700/40 text-[11.5px] font-medium text-red-300 hover:text-white hover:bg-red-900/30 transition-colors"
                >
                    <RefreshCw size={12} />
                    <span>Retry</span>
                </button>
            )}
        </div>
    );
}
