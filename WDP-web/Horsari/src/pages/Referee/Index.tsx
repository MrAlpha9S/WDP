import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { TOKEN_KEY } from "../../utils/constants";
import RefereeNavBar, { REFEREE_TABS, type RefereeTab } from "./RefereeComponents/NavBar";
import RefereeDashboard from "./Homepage";
import ManagementPage from "./ManagementPage";
import InboxPage from "./InboxPage";
import TournamentListPage from "./TournamentListPage";
import { useParams } from "react-router-dom";

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ── Tab → component map ───────────────────────────────────────────────────────

function ActiveView({ tab }: { tab: RefereeTab }) {
    switch (tab) {
        case "Dashboard":    return <RefereeDashboard />;
        case "Management":   return <ManagementPage />;
        case "Inbox":        return <InboxPage />;
        case "Tournaments":  return <TournamentListPage />;
        default:             return <RefereeDashboard />;
    }
}

// ── Dashboard Page ────────────────────────────────────────────────────────────

export default function RefereeDashboardPage() {
    const { tabs } = useParams<{ tabs: string }>();

    const allTabs = [...REFEREE_TABS, "Inbox"] as RefereeTab[];

    const initialTab = allTabs.find(
        t => t.toLowerCase() === tabs?.toLowerCase()
    ) ?? "Dashboard";

    const [activeTab, setActiveTab] = useState<RefereeTab>(initialTab);

    useEffect(() => {
        const matchingTab = allTabs.find(t => t.toLowerCase() === tabs?.toLowerCase());
        if (matchingTab) setActiveTab(matchingTab);
    }, [tabs]);

    // ── WebSocket ─────────────────────────────────────────────────────────────

    const socketRef = useRef<Socket | null>(null);
    const [wsConnected, setWsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY) ?? '';
        const socket = io(SOCKET_URL, { withCredentials: true });
        socketRef.current = socket;

        socket.on('connect', () => {
            setWsConnected(true);
            socket.emit('join_referee', { token });
        });
        socket.on('disconnect', () => setWsConnected(false));

        // Notifications sent to this referee's personal room (referee:${userId})
        socket.on('referee_notification', () => {
            setUnreadCount(prev => prev + 1);
        });

        // Race status changes relevant to the referee
        socket.on('race_status_update', () => {
            setUnreadCount(prev => prev + 1);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, []);

    // Clear badge when the user opens Inbox
    const handleTabChange = (tab: RefereeTab) => {
        if (tab === "Inbox") setUnreadCount(0);
        setActiveTab(tab);
    };

    return (
        <div
            className="min-h-screen bg-[#111111] text-white"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            <RefereeNavBar
                activeTab={activeTab}
                onTabChange={handleTabChange}
                wsConnected={wsConnected}
                unreadCount={unreadCount}
            />
            <ActiveView tab={activeTab} />
        </div>
    );
}
