import { createContext, useContext } from "react";
import type { Socket } from "socket.io-client";

// ── Shape of values shared across all admin pages ─────────────────────────────

export interface AdminSocketContextValue {
    /** Raw socket.io instance — emit/listen for events from any admin child page */
    socket: Socket | null;
    /** True when the socket handshake with the backend has completed */
    wsConnected: boolean;
}

// ── Context (created once, provided by AdminDashboardPage) ────────────────────

export const AdminSocketContext = createContext<AdminSocketContextValue>({
    socket: null,
    wsConnected: false,
});

// ── Consumer hook ─────────────────────────────────────────────────────────────

export function useAdminSocket(): AdminSocketContextValue {
    return useContext(AdminSocketContext);
}
