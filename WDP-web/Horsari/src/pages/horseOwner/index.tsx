import { useState } from "react";
import NavBar, { type Tab } from "../../components/ownerComponents/Navbar";
import HomePage from "./HomePage";
import ManagementPage from "./Management";
import { type ManagementTab } from "./Management/SideBar";

// ── Tab → component map ───────────────────────────────────────────────────────
function ActiveView({ tab, initialMgmtTab, onNavigate }: {
  tab: Tab;
  initialMgmtTab: ManagementTab | null;
  onNavigate: (mgmtTab: ManagementTab) => void;
}) {
  switch (tab) {
    case "Dashboard":
      return <HomePage onNavigate={onNavigate} />;
    case "Management":
      return <ManagementPage initialTab={initialMgmtTab ?? undefined} />;
  }
}

// ── Dashboard Page ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Dashboard");
  const [initialMgmtTab, setInitialMgmtTab] = useState<ManagementTab | null>(null);

  function handleNavigate(mgmtTab: ManagementTab) {
    setInitialMgmtTab(mgmtTab);
    setActiveTab("Management");
  }

  return (
    <div
      className="min-h-screen bg-[#111111] text-white"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <NavBar activeTab={activeTab} onTabChange={setActiveTab} />
      <ActiveView tab={activeTab} initialMgmtTab={initialMgmtTab} onNavigate={handleNavigate} />
    </div>
  );
}