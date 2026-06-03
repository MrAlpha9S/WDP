import { useState, useEffect } from "react";
import AdminNavBar, { ADMIN_TABS, type AdminTab } from "./AdminComponents/NavBar";
import AdminSidebar from "./AdminComponents/SideBar";
import SystemDashboardPage from "./SystemDashBoardPage";
import RaceSchedulingPage from "./RaceSchedulingPage";
import TournamentManagementPage from "./TournamentManagementPage";

import { useParams } from "react-router-dom";


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
        default:
            return <ComingSoon title={tab} />;
    }
}

// ── Dashboard Page ─────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
    const { tabs } = useParams<{ tabs: string }>();

    // Support matching both navbar tabs and sidebar tabs from URL
    const allTabs = [
        ...ADMIN_TABS, 
        "Inbox", 
        "Home", 
        "Roles & Permissions", 
        "Horses", 
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
        <div
            className="min-h-screen bg-[#111111] text-white flex flex-col"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            <AdminNavBar activeTab={activeTab} onTabChange={setActiveTab} />
            
            <div className="flex-1 flex min-h-0">
                <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
                <div className="flex-1 overflow-auto">
                    <ActiveView tab={activeTab} setActiveTab={setActiveTab} />
                </div>
            </div>
        </div>
    );
}