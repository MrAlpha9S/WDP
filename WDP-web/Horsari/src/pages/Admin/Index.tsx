import { useState, useEffect, useRef } from "react";
import AdminNavBar, { ADMIN_TABS, type AdminTab } from "./AdminComponents/NavBar";
import AdminSidebar from "./AdminComponents/SideBar";
import SystemDashboardPage from "./SystemDashBoardPage";
import RaceSchedulingPage from "./RaceSchedulingPage";
import TournamentManagementPage from "./TournamentManagementPage";
import AdminUsersPage from "./AdminUsersPage";
import AdminHorsesPage from "./AdminHorsesPage";
import AdminRuleManagementPage from "./AdminRuleManagementPage";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { AdminSocketContext } from "../../providers/useAdminSocket";
import type { AdminNotification } from "../../types/AdminNotification";
import { useParams, useNavigate } from "react-router-dom";
import { TOKEN_KEY } from "../../utils/constants";
import { adminService } from "../../api/adminService";

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
            return <SystemDashboardPage />;
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
    const socketRef = useRef<Socket | null>(null);
    const [wsConnected, setWsConnected] = useState(false);
    const [wsCount, setWsCount] = useState<number | null>(null);
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [eventCounts, setEventCounts] = useState({ pendingCertifications: 0, racesReadyToStart: 0, activeTournaments: 0, pendingRegistrations: 0 });

    // Seed counts immediately on mount so badges are populated before the first WS push
    useEffect(() => {
        adminService.getImportantEvents().then((res: any) => {
            const d = res?.data ?? {};
            setEventCounts({
                pendingCertifications: (d.pendingCertifications ?? []).length,
                racesReadyToStart:     (d.racesReadyToStart     ?? []).length,
                activeTournaments:     (d.activeTournaments     ?? []).length,
                pendingRegistrations:  (d.pendingRegistrations  ?? []).length,
            });
        }).catch(() => {});
    }, []);

    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY) ?? '';
        const socket = io(SOCKET_URL, { withCredentials: true });
        socketRef.current = socket;

        socket.on('connect', () => {
            setWsConnected(true);
            // Authenticate into the admin room
            socket.emit('join_admin', { token });
        });
        socket.on('disconnect', () => setWsConnected(false));
        socket.on('admin_ping', ({ count }: { count: number }) => setWsCount(count));
        socket.on('admin_notification', (notif: AdminNotification) => {
            setNotifications(prev => [
                { ...notif, read: false, timestamp: new Date(notif.timestamp) },
                ...prev,
            ]);
        });
        socket.on('admin:events_update', (counts: typeof eventCounts) => {
            setEventCounts(counts);
        });

        return () => { socket.disconnect(); };
    }, []);

    const dismissNotification = (id: string) =>
        setNotifications(prev => prev.filter(n => n.id !== id));
    const clearAllNotifications = () => setNotifications([]);
    const markAllRead = () =>
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const unreadCount = notifications.filter(n => !n.read).length;
    // ─────────────────────────────────────────────────────────────────

    // Support matching both navbar tabs and sidebar tabs from URL
    const allTabs = [
        ...ADMIN_TABS,
        "Inbox",
        "Home",
        "Roles & Permissions",
        "Horses",
        "Rules Managment",
        "Activity Logs"
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
            wsCount,
            notifications,
            unreadCount,
            eventCounts,
            dismissNotification,
            clearAllNotifications,
            markAllRead,
        }}>
        <div
            className="min-h-screen bg-[#111111] text-white flex flex-col"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            <AdminNavBar activeTab={activeTab} onTabChange={setActiveTab} />

            {/* ─ WS status badge ───────────────────────────────────────────── */}
            <div className="px-6 pt-2 pb-0">
                <div className={[
                    "inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-[11px] font-bold font-mono transition-all duration-300",
                    wsConnected
                        ? "border-emerald-700/60 bg-emerald-500/10 text-emerald-400"
                        : "border-red-800/50 bg-red-500/10 text-red-500 animate-pulse",
                ].join(" ")}>
                    <span className={["w-1.5 h-1.5 rounded-full", wsConnected ? "bg-emerald-400 animate-pulse" : "bg-red-500"].join(" ")} />
                    {wsConnected
                        ? <>Admin WS Connected &nbsp;·&nbsp; ping #{wsCount ?? "…"}</>
                        : <>Admin WS Disconnected</>}
                </div>
            </div>
            {/* ─────────────────────────────────────────────────────────────────── */}

            <div className="flex-1 flex min-h-0">
                <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
                <div className="flex-1 overflow-auto">
                    <ActiveView tab={activeTab} setActiveTab={setActiveTab} />
                </div>
            </div>
        </div>
        </AdminSocketContext.Provider>
    );
}