import { useState, useEffect, useRef } from "react";
import AdminNavBar, { ADMIN_TABS, type AdminTab } from "./AdminComponents/NavBar";
import AdminSidebar from "./AdminComponents/SideBar";
import SystemDashboardPage from "./SystemDashBoardPage";
import AdminStatisticsPage from "./AdminStatisticsPage";
import RaceSchedulingPage from "./RaceSchedulingPage";
import TournamentManagementPage from "./TournamentManagementPage";
import AdminUsersPage from "./AdminUsersPage";
import AdminHorsesPage from "./AdminHorsesPage";
import AdminRuleManagementPage from "./AdminRuleManagementPage";
import ViolationManagementPage from "./ViolationManagementPage";
import ViolationTypeManagementPage from "./ViolationTypeManagementPage";
import AdminInvitationsPage from "./AdminInvitationsPage";
import AdminPaymentsPage from "./AdminPaymentsPage";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { AdminSocketContext } from "../../providers/useAdminSocket";
import { useParams, useNavigate } from "react-router-dom";
import { TOKEN_KEY } from "../../utils/constants";

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';


// ── Placeholder pages for non-Dashboard tabs ──────────────────────────────────
function ComingSoon({ title }: { title: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <p
                className="text-[32px] font-bold text-white"
                style={{ fontFamily: "'Playfair Display', serif" }}
            >
                {title}
            </p>
            <p className="text-[14px] text-gray-500">This section is coming soon.</p>
        </div>
    );
}

// ── Tab → component map ───────────────────────────────────────────────────────
function ActiveView({ tab, setActiveTab }: { tab: AdminTab, setActiveTab: (tab: AdminTab) => void }) {
    switch (tab) {
        case "Dashboard":
            return <SystemDashboardPage setActiveTab={setActiveTab} />;
        case "Statistics":
            return <AdminStatisticsPage />;
        case "Races":
            return <RaceSchedulingPage />;
        case "Tournaments":
            return <TournamentManagementPage setActiveTab={setActiveTab} />;
        case "Users":
            return <AdminUsersPage />;
        case "Horses":
            return <AdminHorsesPage />;
        case "Rules Managment":
            return <AdminRuleManagementPage />;
        case "Violations":
            return <ViolationManagementPage />;
        case "Violation Types":
            return <ViolationTypeManagementPage />;
        case "Inbox":
            return <AdminInvitationsPage />;
        case "Financial":
            return <AdminPaymentsPage />;
        default:
            return <ComingSoon title={tab} />;
    }
}

// ── Dashboard Page ─────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
    const { tabs } = useParams<{ tabs: string }>();
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            navigate("/login", { replace: true });
        }
    }, [navigate]);

    // ── Shared WebSocket connection ───────────────────────────────────────────
    // Kept alive (even with no notification code left) because
    // TournamentManagementPage listens for the global 'tournament:status_changed'
    // broadcast via this same socket.
    const socketRef = useRef<Socket | null>(null);
    const [wsConnected, setWsConnected] = useState(false);

    useEffect(() => {
        const socket = io(SOCKET_URL, { withCredentials: true });
        socketRef.current = socket;

        socket.on('connect', () => setWsConnected(true));
        socket.on('disconnect', () => setWsConnected(false));

        return () => { socket.disconnect(); };
    }, []);
    // ─────────────────────────────────────────────────────────────────

    // Support matching both navbar tabs and sidebar tabs from URL
    const allTabs = [
        ...ADMIN_TABS,
        "Inbox",
        "Home",
        "Roles & Permissions",
        "Horses",
        "Rules Managment",
        "Activity Logs",
        "Violations",
        "Violation Types",
        "Statistics",
    ] as AdminTab[];

    const initialTab = allTabs.find(
        t => t.toLowerCase() === tabs?.toLowerCase()
    ) ?? "Dashboard";

    const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

    useEffect(() => {
        const matchingTab = allTabs.find(
            t => t.toLowerCase() === tabs?.toLowerCase()
        );
        if (matchingTab) {
            setActiveTab(matchingTab);
        }
    }, [tabs]);

    return (
        <AdminSocketContext.Provider value={{
            socket: socketRef.current,
            wsConnected,
        }}>
        <div
            className="h-screen bg-[#111111] text-white flex flex-col overflow-hidden"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            <AdminNavBar activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="flex-1 flex min-h-0">
                <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
                <div className="flex-1 min-h-0 overflow-auto">
                    <ActiveView tab={activeTab} setActiveTab={setActiveTab} />
                </div>
            </div>
        </div>
        </AdminSocketContext.Provider>
    );
}