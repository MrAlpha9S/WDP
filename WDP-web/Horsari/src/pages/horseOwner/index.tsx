import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LayoutDashboard, House, Users, Wallet, Flag, Mail } from "lucide-react";
import TopBar from "../../components/ui/TopBar";
import Sidebar, { type SidebarGroup } from "../../components/ui/Sidebar";
import HomePage from "./HomePage";
import OwnerProfilePage from "./OwnerProfilePage";
import HorsesPage from "./Management/Horses";
import JockeysPage from "./Management/Jockeys";
import RacesPage from "./Management/Races";
import InvitationsPage from "./Management/Invitations";
import FinancialsPage from "./Management/Financials";
import { type ManagementTab } from "./Management/SideBar";

type OwnerNavKey = "Dashboard" | ManagementTab | "Profile";

// ── Tab → component map ───────────────────────────────────────────────────────
function ActiveView({
  tab,
  onNavigate,
  onPendingChange,
}: {
  tab: OwnerNavKey;
  onNavigate: (mgmtTab: ManagementTab) => void;
  onPendingChange: (count: number) => void;
}) {
  switch (tab) {
    case "Dashboard":    return <HomePage onNavigate={onNavigate} />;
    case "Horses":       return <HorsesPage />;
    case "Jockeys":      return <JockeysPage />;
    case "Financials":   return <FinancialsPage />;
    case "Races":        return <RacesPage />;
    case "Invitations":  return <InvitationsPage onPendingChange={onPendingChange} />;
    case "Profile":      return <OwnerProfilePage />;
    default:             return <HomePage onNavigate={onNavigate} />;
  }
}

// ── Sidebar items ──────────────────────────────────────────────────────────────
const SIDEBAR_GROUPS: SidebarGroup<OwnerNavKey>[] = [
  {
    items: [
      { key: "Dashboard", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
    ],
  },
  {
    label: "Stable",
    items: [
      { key: "Horses", label: "Horses", icon: <House size={16} /> },
      { key: "Jockeys", label: "Jockeys", icon: <Users size={16} /> },
      { key: "Financials", label: "Financials", icon: <Wallet size={16} /> },
    ],
  },
  {
    label: "Racing",
    items: [
      { key: "Races", label: "Races", icon: <Flag size={16} /> },
      { key: "Invitations", label: "Invitations", icon: <Mail size={16} /> },
    ],
  },
];

const ALL_OWNER_TABS: OwnerNavKey[] = [
  "Dashboard",
  "Horses",
  "Jockeys",
  "Financials",
  "Races",
  "Invitations",
  "Profile",
];

// ── Dashboard Page ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { tabs } = useParams<{ tabs: string }>();
  const navigate = useNavigate();

  const initialTab =
    ALL_OWNER_TABS.find((t) => t.toLowerCase() === tabs?.toLowerCase()) ?? "Dashboard";

  const [activeTab, setActiveTab] = useState<OwnerNavKey>(initialTab);
  const [pendingInvitations, setPendingInvitations] = useState(0);

  useEffect(() => {
    const matchingTab = ALL_OWNER_TABS.find((t) => t.toLowerCase() === tabs?.toLowerCase());
    if (matchingTab) setActiveTab(matchingTab);
  }, [tabs]);

  const handleTabChange = (tab: OwnerNavKey) => {
    navigate(`/owner/${encodeURIComponent(tab)}`);
  };

  const groups = SIDEBAR_GROUPS.map((g) =>
    g.label === "Racing"
      ? {
          ...g,
          items: g.items.map((item) =>
            item.key === "Invitations" ? { ...item, badge: pendingInvitations } : item
          ),
        }
      : g
  );

  return (
    <div className="h-screen bg-bg text-text flex flex-col overflow-hidden font-sans">
      <TopBar onProfileClick={() => navigate("/owner/profile")} />

      <div className="flex-1 flex min-h-0">
        <Sidebar
          title="Management"
          subtitle="Owner Tools"
          groups={groups}
          activeKey={activeTab}
          onSelect={handleTabChange}
        />
        <div className="flex-1 min-h-0 overflow-auto">
          <ActiveView
            tab={activeTab}
            onNavigate={handleTabChange}
            onPendingChange={setPendingInvitations}
          />
        </div>
      </div>
    </div>
  );
}
