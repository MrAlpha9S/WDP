import { useState, useEffect } from "react";
import RefereeNavBar, { REFEREE_TABS, type RefereeTab } from "./RefereeComponents/NavBar";
import RefereeDashboard from "./Homepage";
import ManagementPage from "./ManagementPage";
import InboxPage from "./InboxPage";
import TournamentListPage from "./TournamentListPage";
import { useParams } from "react-router-dom";



// ── Tab → component map ───────────────────────────────────────────────────────
function ActiveView({ tab }: { tab: RefereeTab }) {
    switch (tab) {
        case "Dashboard":
            return <RefereeDashboard />;
        case "Management":
            return <ManagementPage />;
        case "Inbox":
            return <InboxPage />
        case "Tournaments":
            return <TournamentListPage />
    }
}

// ── Dashboard Page ─────────────────────────────────────────────────────────────
export default function RefereeDashboardPage() {
    const { tabs } = useParams<{ tabs: string }>();

    const allTabs = [...REFEREE_TABS, "Inbox"] as RefereeTab[];

    const initialTab = allTabs.find(
        t => t.toLowerCase() === tabs?.toLowerCase()
    ) ?? "Dashboard";

    const [activeTab, setActiveTab] = useState<RefereeTab>(initialTab);

    useEffect(() => {
        const matchingTab = allTabs.find(
            t => t.toLowerCase() === tabs?.toLowerCase()
        );
        if (matchingTab) {
            setActiveTab(matchingTab);
        }
    }, [tabs]);

    return (
        <div
            className="min-h-screen bg-[#111111] text-white"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            <RefereeNavBar activeTab={activeTab} onTabChange={setActiveTab} />
            <ActiveView tab={activeTab} />
        </div>
    );
}