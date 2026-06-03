import {
  House,
  Users,
  Building2,
  ShoppingBag,
  Wallet,
  Flag,
  Mail,
} from "lucide-react";

export type ManagementTab =
  | "Horses"
  | "Jockeys"
  | "Stable"
  | "Marketplace"
  | "Financials"
  | "Races"
  | "Invitations";

interface SidebarProps {
  activeTab: ManagementTab;
  onTabChange: (tab: ManagementTab) => void;
  pendingInvitations?: number;
}

interface SidebarItem {
  tab: ManagementTab;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

export default function Sidebar({ activeTab, onTabChange, pendingInvitations = 0 }: SidebarProps) {
  const GROUPS: SidebarGroup[] = [
    {
      label: "Stable",
      items: [
        { tab: "Horses",      icon: <House size={16} /> },
        { tab: "Jockeys",     icon: <Users size={16} /> },
        // { tab: "Stable",      icon: <Building2 size={16} /> },
        // { tab: "Marketplace", icon: <ShoppingBag size={16} /> },
        { tab: "Financials",  icon: <Wallet size={16} /> },
      ],
    },
    {
      label: "Racing",
      items: [
        { tab: "Races",       icon: <Flag size={16} /> },
        { tab: "Invitations", icon: <Mail size={16} />, badge: pendingInvitations },
      ],
    },
  ];

  return (
    <aside
      className="w-[185px] shrink-0 min-h-screen bg-[#161616] border-r border-white/8 flex flex-col pt-7 pb-6"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Header */}
      <div className="px-5 mb-6">
        <p className="text-[13px] font-semibold text-white leading-tight">Management</p>
        <p className="text-[10px] font-semibold tracking-widest text-gray-600 uppercase mt-0.5">
          Owner Tools
        </p>
      </div>

      {/* Groups */}
      <nav className="flex flex-col gap-5 px-3">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[9.5px] font-bold tracking-[0.16em] text-gray-700 uppercase px-3 mb-1.5">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map(({ tab, icon, badge }) => {
                const isActive = tab === activeTab;
                return (
                  <button
                    key={tab}
                    onClick={() => onTabChange(tab)}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all duration-150 w-full text-left ${
                      isActive
                        ? "bg-red-700 text-white shadow-lg shadow-red-900/30"
                        : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                    }`}
                  >
                    <span className={isActive ? "text-white" : "text-gray-500"}>
                      {icon}
                    </span>
                    {tab}
                    {/* Pending badge */}
                    {badge != null && badge > 0 && (
                      <span className="ml-auto w-4 h-4 bg-red-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center shrink-0">
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}