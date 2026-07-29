import { useState, useEffect } from "react";
import { House, Trophy, Inbox, ClipboardList, ChartColumn } from "lucide-react";
import { REFEREE_TABS, type RefereeTab } from "./RefereeComponents/NavBar";
import TopBar from "../../components/ui/TopBar";
import Sidebar, { type SidebarGroup } from "../../components/ui/Sidebar";
import RefereeDashboard from "./Homepage";
import ManagementPage from "./ManagementPage";
import InboxPage from "./InboxPage";
import TournamentListPage from "./TournamentListPage";
import StatisticsPage from "./StatisticsPage";
import RefereeProfilePage from "./RefereeProfilePage";
import { useParams, useNavigate } from "react-router-dom";

// ── Tab → component map ───────────────────────────────────────────────────────

function ActiveView({ tab }: { tab: RefereeTab }) {
    switch (tab) {
        case "Dashboard":    return <RefereeDashboard />;
        case "Management":   return <ManagementPage />;
        case "Inbox":        return <InboxPage />;
        case "Tournaments":  return <TournamentListPage />;
        case "Statistics":   return <StatisticsPage />;
        case "Profile":      return <RefereeProfilePage />;
        default:             return <RefereeDashboard />;
    }
}

// ── Sidebar items ──────────────────────────────────────────────────────────────
const SIDEBAR_GROUPS: SidebarGroup<RefereeTab>[] = [
    {
        items: [
            { key: "Dashboard", label: "Dashboard", icon: <House size={17} /> },
            { key: "Statistics", label: "Statistics", icon: <ChartColumn size={17} /> },
        ],
    },
    {
        label: "Racing",
        items: [
            { key: "Tournaments", label: "Tournaments", icon: <Trophy size={17} /> },
            { key: "Management", label: "Management", icon: <ClipboardList size={17} /> },
        ],
    },
    {
        label: "Operations",
        items: [
            { key: "Inbox", label: "Inbox", icon: <Inbox size={17} /> },
        ],
    },
];

// ── Dashboard Page ────────────────────────────────────────────────────────────

export default function RefereeDashboardPage() {
    const { tabs } = useParams<{ tabs: string }>();
    const navigate = useNavigate();

    const allTabs = [...REFEREE_TABS, "Management", "Inbox", "Profile"] as RefereeTab[];

    const initialTab = allTabs.find(
        t => t.toLowerCase() === tabs?.toLowerCase()
    ) ?? "Dashboard";

    const [activeTab, setActiveTab] = useState<RefereeTab>(initialTab);

    useEffect(() => {
        const matchingTab = allTabs.find(t => t.toLowerCase() === tabs?.toLowerCase());
        if (matchingTab) setActiveTab(matchingTab);
    }, [tabs]);

    return (
        <div className="h-screen bg-bg text-text flex flex-col overflow-hidden font-sans">
            <TopBar onProfileClick={() => navigate("/referee/profile")} />

            <div className="flex-1 flex min-h-0">
                <Sidebar
                    title="Referee Console"
                    subtitle="Referee Tools"
                    groups={SIDEBAR_GROUPS}
                    activeKey={activeTab}
                    onSelect={setActiveTab}
                />
                <div className="flex-1 min-h-0 overflow-auto">
                    <ActiveView tab={activeTab} />
                </div>
            </div>
        </div>
    );
}
