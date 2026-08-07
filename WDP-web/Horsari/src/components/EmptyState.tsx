import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
    message: string;
    icon?: ReactNode;
    action?: ReactNode;
    className?: string;
}

// Shared "nothing here yet" box — pairs with ErrorState/RefetchButton to
// complete the loading → error → empty → populated quartet every list page
// should render (the pattern Jockeys.tsx already follows end-to-end, but ad
// hoc centered `<p>` text elsewhere). Kept visually calmer than ErrorState
// (no red) since an empty list isn't a failure.
export function EmptyState({ message, icon, action, className }: EmptyStateProps) {
    return (
        <div
            className={[
                "flex flex-col items-center justify-center gap-3 text-center",
                "bg-white/3 border border-border rounded-xl px-5 py-10",
                className ?? "",
            ].join(" ")}
        >
            <span className="text-text-muted/60">{icon ?? <Inbox size={22} />}</span>
            <p className="text-[13px] text-text-muted">{message}</p>
            {action}
        </div>
    );
}
