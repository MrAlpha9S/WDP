import { useState, useEffect } from "react";
import { House, Inbox, ChartColumn } from "lucide-react";
import { REFEREE_TABS, type RefereeTab } from "./RefereeComponents/NavBar";
import TopBar from "../../components/ui/TopBar";
import Sidebar, { type SidebarGroup } from "../../components/ui/Sidebar";
import RefereeDashboard from "./Homepage";
import InboxPage from "./InboxPage";
import StatisticsPage from "./StatisticsPage";
import RefereeProfilePage from "./RefereeProfilePage";
import { useParams, useNavigate } from "react-router-dom";

// ── Tab → component map ───────────────────────────────────────────────────────

function ActiveView({ tab }: { tab: RefereeTab }) {
    switch (tab) {
        case "Dashboard":    return <RefereeDashboard />;
        case "Inbox":        return <InboxPage />;
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

    const allTabs = [...REFEREE_TABS, "Inbox", "Profile"] as RefereeTab[];

    const initialTab = allTabs.find(
        t => t.toLowerCase() === tabs?.toLowerCase()
    ) ?? "Dashboard";

    const [activeTab, setActiveTab] = useState<RefereeTab>(initialTab);

    useEffect(() => {
        const matchingTab = allTabs.find(t => t.toLowerCase() === tabs?.toLowerCase());
        if (matchingTab) setActiveTab(matchingTab);
    }, [tabs]);

    const handleTabChange = (tab: RefereeTab) => {
        navigate(`/referee/${encodeURIComponent(tab)}`);
    };

    return (
        <div className="h-screen bg-bg text-text flex flex-col overflow-hidden font-sans">
            <TopBar onProfileClick={() => navigate("/referee/profile")} />

            <div className="flex-1 flex min-h-0">
                <Sidebar
                    title="Referee Console"
                    subtitle="Referee Tools"
                    groups={SIDEBAR_GROUPS}
                    activeKey={activeTab}
                    onSelect={handleTabChange}
                />
                <div className="flex-1 min-h-0 overflow-auto">
                    <ActiveView tab={activeTab} />
                </div>
            </div>
        </div>
    );
}
