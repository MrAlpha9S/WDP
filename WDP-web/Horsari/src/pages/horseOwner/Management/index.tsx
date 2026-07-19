import { useState } from "react";
import Sidebar, { type ManagementTab } from "./SideBar";
import HorsesPage      from "./Horses";
import JockeysPage     from "./Jockeys";
import RacesPage       from "./Races";
import InvitationsPage from "./Invitations";
import FinancialsPage  from "./Financials";

// ── Placeholder ───────────────────────────────────────────────────────────────
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 min-h-[60vh]">
      <p
        className="text-[30px] font-bold text-white font-serif"
      >
        {title}
      </p>
      <p className="text-[13px] text-gray-600">This section is coming soon.</p>
    </div>
  );
}

// ── Tab → view ────────────────────────────────────────────────────────────────
function ActiveView({
  tab,
  onPendingChange,
  onTabChange,
}: {
  tab: ManagementTab;
  onPendingChange: (count: number) => void;
  onTabChange: (tab: ManagementTab) => void;
}) {
  switch (tab) {
    case "Horses":      return <HorsesPage />;
    case "Jockeys":     return <JockeysPage />;
    case "Stable":      return <ComingSoon title="Stable" />;
    case "Marketplace": return <ComingSoon title="Marketplace" />;
    case "Financials":  return <FinancialsPage />;
    case "Races":       return <RacesPage onNavigateToInvitations={() => onTabChange("Invitations")} />;
    case "Invitations": return <InvitationsPage onPendingChange={onPendingChange} />;
  }
}

// ── Management Page ───────────────────────────────────────────────────────────
export default function ManagementPage({ initialTab }: { initialTab?: ManagementTab }) {
  const [activeTab,          setActiveTab]          = useState<ManagementTab>(initialTab ?? "Horses");
  const [pendingInvitations, setPendingInvitations] = useState(2);

  return (
    <div
      className="flex min-h-screen bg-[#111111] text-white font-sans"
    >
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingInvitations={pendingInvitations}
      />
      <ActiveView tab={activeTab} onPendingChange={setPendingInvitations} onTabChange={setActiveTab} />
    </div>
  );
}