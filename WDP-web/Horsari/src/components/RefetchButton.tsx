import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { formatAgo } from "../utils/formatAgo";

interface RefetchButtonProps {
    onRefetch: () => void | Promise<void>;
    lastUpdated: number | null;
    loading?: boolean;
    className?: string;
}

// Manual refresh trigger + a ticking "last updated X ago" label. Doesn't own
// fetch logic or lastUpdated state itself — the caller sets lastUpdated
// (Date.now()) at the end of its own fetch function, keeping this dumb and
// reusable across every page's differently-shaped fetch function.
export function RefetchButton({ onRefetch, lastUpdated, loading, className }: RefetchButtonProps) {
    const [now, setNow] = useState(() => Date.now());
    const [internalLoading, setInternalLoading] = useState(false);

    useEffect(() => {
        if (lastUpdated == null) return;
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, [lastUpdated]);

    const isLoading = loading ?? internalLoading;

    const handleClick = async () => {
        if (isLoading) return;
        setInternalLoading(true);
        try {
            await onRefetch();
        } finally {
            setInternalLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={isLoading}
            className={[
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11.5px] font-medium transition-colors",
                "bg-[#1a1a1a] border-white/10 text-gray-400 hover:text-white hover:bg-[#252525]",
                isLoading ? "opacity-60 cursor-not-allowed" : "",
                className ?? "",
            ].join(" ")}
            title="Refetch"
        >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
            <span>{lastUpdated != null ? `Updated ${formatAgo(lastUpdated, now)}` : "Refetch"}</span>
        </button>
    );
}
