import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import RefereeNavBar, { REFEREE_TABS, type RefereeTab } from "./RefereeComponents/NavBar";
import RefereeDashboard from "./Homepage";
import ManagementPage from "./ManagementPage";
import InboxPage from "./InboxPage";
import TournamentListPage from "./TournamentListPage";
import StatisticsPage from "./StatisticsPage";
import { useParams } from "react-router-dom";

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ── Tab → component map ───────────────────────────────────────────────────────

function ActiveView({ tab }: { tab: RefereeTab }) {
    switch (tab) {
        case "Dashboard":    return <RefereeDashboard />;
        case "Management":   return <ManagementPage />;
        case "Inbox":        return <InboxPage />;
        case "Tournaments":  return <TournamentListPage />;
        case "Statistics":   return <StatisticsPage />;
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

    useEffect(() => {
        const socket = io(SOCKET_URL, { withCredentials: true });
        socketRef.current = socket;

        socket.on('connect', () => setWsConnected(true));
        socket.on('disconnect', () => setWsConnected(false));

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, []);

    return (
        <div
            className="min-h-screen bg-[#111111] text-white font-sans"
        >
            <RefereeNavBar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                wsConnected={wsConnected}
            />
            <ActiveView tab={activeTab} />
        </div>
    );
}
