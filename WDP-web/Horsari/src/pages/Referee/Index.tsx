import { useState } from "react";
import RefereeNavBar, { type RefereeTab } from "../../components/refereeComponent/NavBar";
import RefereeDashboard from "./Homepage";
import ManagementPage from "./ManagementPage";
import InboxPage from "./InboxPage";


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
function ActiveView({ tab }: { tab: RefereeTab }) {
    switch (tab) {
        case "Dashboard":
            return <RefereeDashboard />;
        case "Management":
            return <ManagementPage />;
        case "Inbox":
            return <InboxPage />
        case "Tournament":
            return;
    }
}

// ── Dashboard Page ─────────────────────────────────────────────────────────────
export default function RefereeDashboardPage() {
    const [activeTab, setActiveTab] = useState<RefereeTab>("Dashboard");

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