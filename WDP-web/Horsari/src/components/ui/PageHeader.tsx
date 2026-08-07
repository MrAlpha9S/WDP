import type { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    eyebrow: string;
    subtext?: string;
    actions?: ReactNode;
    className?: string;
}

// The Admin module's header treatment (H1 + uppercase eyebrow chip + item-count
// subtext) was the most consistent pattern the design audit found — same shape
// independently rebuilt in AdminUsersPage, TournamentManagementPage,
// ViolationManagementPage, SystemDashBoardPage. Formalized here so new pages
// (and eventually those four) share one implementation instead of four.
export default function PageHeader({ title, eyebrow, subtext, actions, className }: PageHeaderProps) {
    return (
        <div className={`flex items-start justify-between gap-4 ${className ?? ""}`}>
            <div className="min-w-0">
                <h1 className="text-[22px] font-bold text-text tracking-tight leading-tight truncate">
                    {title}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] font-semibold tracking-wide text-text-muted bg-white/5 px-2 py-0.5 rounded border border-border uppercase whitespace-nowrap">
                        {eyebrow}
                    </span>
                    {subtext && <span className="text-[12px] text-text-muted truncate">· {subtext}</span>}
                </div>
            </div>
            {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
        </div>
    );
}
