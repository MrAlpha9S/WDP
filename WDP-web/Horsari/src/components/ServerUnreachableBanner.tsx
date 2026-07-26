import { AlertCircle, X } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";
import { NETWORK_ERROR_MESSAGE } from "../api/axios";

// App-shell-level banner shown when session rehydration couldn't reach the
// server. Distinct from a real "your session expired" logout — the session
// is kept intact, this just tells the user connectivity is the problem.
export function ServerUnreachableBanner() {
    const { serverUnreachable, dismissServerUnreachable } = useAuth();

    if (!serverUnreachable) return null;

    return (
        <div className="sticky top-0 z-[999] flex items-center justify-center gap-3 bg-red-950/90 border-b border-red-800/50 px-4 py-2.5 text-[13px] text-red-300 backdrop-blur-sm">
            <AlertCircle size={14} className="shrink-0" />
            <span>{NETWORK_ERROR_MESSAGE}</span>
            <button
                type="button"
                onClick={dismissServerUnreachable}
                aria-label="Dismiss"
                className="ml-2 text-red-400 hover:text-white transition-colors shrink-0"
            >
                <X size={14} />
            </button>
        </div>
    );
}
