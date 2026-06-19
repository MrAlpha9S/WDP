import { useRef, useEffect } from "react";
import { Bell, Trash2 } from "lucide-react";
import type { AdminNotification } from "../../../types/AdminNotification";
import NotificationBox from "./NotificationBox";

// ── Props ──────────────────────────────────────────────────────────────────────

interface NotificationPopupProps {
    notifications: AdminNotification[];
    unreadCount: number;
    onDismiss: (id: string) => void;
    onAction: (notification: AdminNotification) => void;
    onClearAll: () => void;
    onClose: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function NotificationPopup({
    notifications,
    unreadCount,
    onDismiss,
    onAction,
    onClearAll,
    onClose,
}: NotificationPopupProps) {
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        }
        // slight delay so the button click that opened this doesn't immediately close it
        const t = setTimeout(() => document.addEventListener("mousedown", handleClick), 0);
        return () => {
            clearTimeout(t);
            document.removeEventListener("mousedown", handleClick);
        };
    }, [onClose]);

    return (
        <div
            ref={ref}
            className="absolute right-0 top-full mt-2 w-[360px] bg-[#161616] border border-white/10 rounded-2xl shadow-2xl shadow-black/70 z-50 overflow-hidden"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                <div className="flex items-center gap-2">
                    <Bell size={14} className="text-gray-400" />
                    <span className="text-[13px] font-bold text-white">Notifications</span>
                    {unreadCount > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </div>
                {notifications.length > 0 && (
                    <button
                        onClick={onClearAll}
                        className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-red-400 transition-colors duration-100"
                    >
                        <Trash2 size={11} />
                        Clear all
                    </button>
                )}
            </div>

            {/* ── Notification list ────────────────────────────────────────────── */}
            <div className="max-h-[400px] overflow-y-auto divide-y divide-white/[0.04]">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                            <Bell size={18} className="text-gray-600" />
                        </div>
                        <p className="text-[12.5px] text-gray-600 font-medium">No notifications yet</p>
                    </div>
                ) : (
                    notifications.map(n => (
                        <NotificationBox
                            key={n.id}
                            notification={n}
                            onDismiss={onDismiss}
                            onAction={onAction}
                        />
                    ))
                )}
            </div>

            {/* ── Footer ──────────────────────────────────────────────────────── */}
            {notifications.length > 0 && (
                <div className="px-4 py-2.5 border-t border-white/6 text-center">
                    <span className="text-[11px] text-gray-600">
                        {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
                        {unreadCount > 0 ? ` · ${unreadCount} unread` : " · all read"}
                    </span>
                </div>
            )}
        </div>
    );
}
