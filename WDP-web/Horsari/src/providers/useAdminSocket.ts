import { createContext, useContext } from "react";
import type { Socket } from "socket.io-client";
import type { AdminNotification } from "../types/AdminNotification";

// ── Shape of values shared across all admin pages ─────────────────────────────

export interface AdminSocketContextValue {
    /** Raw socket.io instance — emit events from any admin child page */
    socket: Socket | null;
    /** True when the socket handshake with the backend has completed */
    wsConnected: boolean;
    /** Growing counter from the backend admin_ping event (null until first ping) */
    wsCount: number | null;
    /** All current notifications (read + unread) */
    notifications: AdminNotification[];
    /** Number of unread notifications — drives the bell badge */
    unreadCount: number;
    /** Remove a single notification by id */
    dismissNotification: (id: string) => void;
    /** Remove all notifications */
    clearAllNotifications: () => void;
    /** Mark all notifications as read (clears the badge) */
    markAllRead: () => void;
}

// ── Context (created once, provided by AdminDashboardPage) ────────────────────

export const AdminSocketContext = createContext<AdminSocketContextValue>({
    socket: null,
    wsConnected: false,
    wsCount: null,
    notifications: [],
    unreadCount: 0,
    dismissNotification: () => {},
    clearAllNotifications: () => {},
    markAllRead: () => {},
});

// ── Consumer hook ─────────────────────────────────────────────────────────────

/**
 * Access the shared WebSocket connection and notification state owned by AdminDashboardPage.
 * Must be used inside a component that is a descendant of AdminDashboardPage.
 *
 * @example
 * const { socket, wsConnected, notifications, dismissNotification } = useAdminSocket();
 * socket?.emit('admin_action', { ... });
 */
export function useAdminSocket(): AdminSocketContextValue {
    return useContext(AdminSocketContext);
}
