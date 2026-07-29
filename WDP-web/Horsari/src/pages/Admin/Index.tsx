import { useState, useEffect } from "react";
import {
    House,
    FileText,
    User,
    AlertTriangle,
    ShieldAlert,
    ChartColumn,
    Wallet,
    Inbox,
} from "lucide-react";
import { ADMIN_TABS, type AdminTab } from "./AdminComponents/NavBar";
import TopBar from "../../components/ui/TopBar";
import Sidebar, { type SidebarGroup } from "../../components/ui/Sidebar";
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
import AdminProfilePage from "./AdminProfilePage";
import { useParams, useNavigate } from "react-router-dom";
import { TOKEN_KEY } from "../../utils/constants";


// ── Placeholder pages for non-Dashboard tabs ──────────────────────────────────
function ComingSoon({ title }: { title: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <p
                className="text-[32px] font-bold text-white font-serif"
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
        case "Profile":
            return <AdminProfilePage />;
        default:
            return <ComingSoon title={tab} />;
    }
}

// ── Sidebar items ──────────────────────────────────────────────────────────────
const SIDEBAR_GROUPS: SidebarGroup<AdminTab>[] = [
    {
        items: [
            { key: "Dashboard", label: "Dashboard", icon: <House size={17} /> },
            { key: "Statistics", label: "Statistics", icon: <ChartColumn size={17} /> },
        ],
    },
    {
        label: "Management",
        items: [
            { key: "Horses", label: "Horses", icon: <User size={17} /> },
            { key: "Users", label: "Users", icon: <User size={17} /> },
            { key: "Rules Managment", label: "Rules Managment", icon: <FileText size={17} /> },
            { key: "Tournaments", label: "Tournaments", icon: <FileText size={17} /> },
            { key: "Races", label: "Races", icon: <FileText size={17} /> },
        ],
    },
    {
        label: "Operations",
        items: [
            { key: "Inbox", label: "Inbox", icon: <Inbox size={17} /> },
            { key: "Financial", label: "Financial", icon: <Wallet size={17} /> },
            { key: "Violations", label: "Violations", icon: <AlertTriangle size={17} /> },
            { key: "Violation Types", label: "Violation Types", icon: <ShieldAlert size={17} /> },
        ],
    },
];

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
        "Profile",
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
        <div className="h-screen bg-bg text-text flex flex-col overflow-hidden font-sans">
            <TopBar onProfileClick={() => navigate("/admin/profile")} />

            <div className="flex-1 flex min-h-0">
                <Sidebar
                    title="Management"
                    subtitle="Admin Tools"
                    groups={SIDEBAR_GROUPS}
                    activeKey={activeTab}
                    onSelect={setActiveTab}
                />
                <div className="flex-1 min-h-0 overflow-auto">
                    <ActiveView tab={activeTab} setActiveTab={setActiveTab} />
                </div>
            </div>
        </div>
    );
}