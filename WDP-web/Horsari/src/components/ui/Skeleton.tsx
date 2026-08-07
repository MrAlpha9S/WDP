// Shared loading-placeholder primitives — retires the per-page hand-tuned
// `*Skeleton` components (JockeySkeleton, RegistrationRowSkeleton, etc.) that
// each redeclared the same `animate-pulse` + `bg-white/5` divs with slightly
// different radii/spacing. Compose these instead of writing new ones.

interface SkeletonLineProps {
    width?: string;
    height?: string;
    className?: string;
}

export function SkeletonLine({ width = "100%", height = "0.875rem", className }: SkeletonLineProps) {
    return (
        <div
            className={`rounded bg-white/6 animate-pulse ${className ?? ""}`}
            style={{ width, height }}
        />
    );
}

interface SkeletonCardProps {
    /** Number of body lines beneath the media block. */
    lines?: number;
    className?: string;
}

export function SkeletonCard({ lines = 3, className }: SkeletonCardProps) {
    return (
        <div className={`bg-surface rounded-2xl border border-border/60 overflow-hidden animate-pulse ${className ?? ""}`}>
            <div className="h-28 bg-white/5" />
            <div className="px-4 pt-3 pb-4 flex flex-col gap-3">
                {Array.from({ length: lines }).map((_, i) => (
                    <div key={i} className="h-4 rounded bg-white/6" style={{ width: i === 0 ? "70%" : "45%" }} />
                ))}
            </div>
        </div>
    );
}

interface SkeletonRowProps {
    columns?: number;
    className?: string;
}

export function SkeletonRow({ columns = 4, className }: SkeletonRowProps) {
    return (
        <div className={`rounded-xl bg-white/4 border border-border/60 p-4 flex items-center gap-4 animate-pulse ${className ?? ""}`}>
            {Array.from({ length: columns }).map((_, i) => (
                <div key={i} className="h-3.5 rounded bg-white/6 flex-1" />
            ))}
        </div>
    );
}
