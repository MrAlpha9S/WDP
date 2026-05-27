import { useState } from "react";
import Sidebar, { type ManagementTab } from "./SideBar";
import HorsesPage from "./Horses";
import JockeysPage from "./Jockeys";

// ── Placeholder for tabs not yet built ───────────────────────────────────────
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 min-h-[60vh]">
      <p
        className="text-[30px] font-bold text-white"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {title}
      </p>
      <p className="text-[13px] text-gray-600">This section is coming soon.</p>
    </div>
  );
}

// ── Tab → view map ────────────────────────────────────────────────────────────
function ActiveView({ tab }: { tab: ManagementTab }) {
  switch (tab) {
    case "Horses":      return <HorsesPage />;
    case "Jockeys":     return <JockeysPage />;
    case "Stable":      return <ComingSoon title="Stable" />;
    case "Marketplace": return <ComingSoon title="Marketplace" />;
    case "Financials":  return <ComingSoon title="Financials" />;
  }
}

// ── Management Page ───────────────────────────────────────────────────────────
export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState<ManagementTab>("Horses");

  return (
    <div
      className="flex min-h-screen bg-[#111111] text-white"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <ActiveView tab={activeTab} />
    </div>
  );
}