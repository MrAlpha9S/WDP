import type { ReactNode } from "react";
import { AlertTriangle, ClipboardList, Flag, Info, Trophy, UserPlus, X, ChevronRight } from "lucide-react";
import type { AdminNotification, NotificationEventType } from "../../../types/AdminNotification";

// ── Per-type visual config ─────────────────────────────────────────────────────

interface TypeConfig {
    borderColor: string;
    bgColor: string;
    iconColor: string;
    badgeColor: string;
    badgeText: string;
    icon: ReactNode;
}

const TYPE_CONFIG: Record<NotificationEventType, TypeConfig> = {
    race_started: {
        borderColor: "border-l-red-600",
        bgColor: "hover:bg-red-500/5",
        iconColor: "text-red-400",
        badgeColor: "bg-red-500/15 text-red-400 border-red-700/40",
        badgeText: "Race Started",
        icon: <Flag size={13} />,
    },
    race_ended: {
        borderColor: "border-l-green-600",
        bgColor: "hover:bg-green-500/5",
        iconColor: "text-green-400",
        badgeColor: "bg-green-500/15 text-green-400 border-green-700/40",
        badgeText: "Race Ended",
        icon: <Trophy size={13} />,
    },
    new_registration: {
        borderColor: "border-l-yellow-500",
        bgColor: "hover:bg-yellow-500/5",
        iconColor: "text-yellow-400",
        badgeColor: "bg-yellow-500/15 text-yellow-400 border-yellow-700/40",
        badgeText: "Registration",
        icon: <ClipboardList size={13} />,
    },
    new_user: {
        borderColor: "border-l-blue-500",
        bgColor: "hover:bg-blue-500/5",
        iconColor: "text-blue-400",
        badgeColor: "bg-blue-500/15 text-blue-400 border-blue-700/40",
        badgeText: "New User",
        icon: <UserPlus size={13} />,
    },
    objection_filed: {
        borderColor: "border-l-orange-500",
        bgColor: "hover:bg-orange-500/5",
        iconColor: "text-orange-400",
        badgeColor: "bg-orange-500/15 text-orange-400 border-orange-700/40",
        badgeText: "Objection",
        icon: <AlertTriangle size={13} />,
    },
    system_alert: {
        borderColor: "border-l-gray-500",
        bgColor: "hover:bg-gray-500/5",
        iconColor: "text-gray-400",
        badgeColor: "bg-gray-500/15 text-gray-400 border-gray-700/40",
        badgeText: "System",
        icon: <Info size={13} />,
    },
};

// ── Relative timestamp ─────────────────────────────────────────────────────────

function relativeTime(date: Date): string {
    const diff = Date.now() - new Date(date).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`;
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface NotificationBoxProps {
    notification: AdminNotification;
    onDismiss: (id: string) => void;
    onAction: (notification: AdminNotification) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function NotificationBox({ notification, onDismiss, onAction }: NotificationBoxProps) {
    const cfg = TYPE_CONFIG[notification.type];

    return (
        <div
            className={[
                "relative group flex gap-3 px-4 py-3 border-l-[3px] transition-colors duration-150 cursor-default",
                cfg.borderColor,
                cfg.bgColor,
                !notification.read ? "bg-white/[0.025]" : "",
            ].join(" ")}
        >
            {/* Unread dot */}
            {!notification.read && (
                <span className="absolute top-3.5 right-8 w-1.5 h-1.5 rounded-full bg-red-500" />
            )}

            {/* Dismiss button */}
            <button
                onClick={() => onDismiss(notification.id)}
                className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 p-0.5 rounded-md text-gray-600 hover:text-gray-300 hover:bg-white/8 transition-all duration-100"
                title="Dismiss"
            >
                <X size={12} />
            </button>

            {/* Icon */}
            <div className={["mt-0.5 shrink-0", cfg.iconColor].join(" ")}>
                {cfg.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-4">
                {/* Badge + timestamp */}
                <div className="flex items-center gap-1.5 mb-1">
                    <span className={["text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border", cfg.badgeColor].join(" ")}>
                        {cfg.badgeText}
                    </span>
                    <span className="text-[10px] text-gray-600 font-mono">
                        {relativeTime(notification.timestamp)}
                    </span>
                </div>

                {/* Title */}
                <p className="text-[12.5px] font-semibold text-white leading-tight">
                    {notification.title}
                </p>

                {/* Message */}
                <p className="text-[11.5px] text-gray-500 mt-0.5 leading-snug">
                    {notification.message}
                </p>

                {/* Action button */}
                {notification.actionLabel && (
                    <button
                        onClick={() => onAction(notification)}
                        className={["mt-2 flex items-center gap-0.5 text-[11px] font-semibold transition-opacity duration-100", cfg.iconColor, "hover:opacity-80"].join(" ")}
                    >
                        {notification.actionLabel}
                        <ChevronRight size={11} />
                    </button>
                )}
            </div>
        </div>
    );
}
