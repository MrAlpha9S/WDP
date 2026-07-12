import {
    House,
    FileText,
    User,
    AlertTriangle,
    ShieldAlert,
    ChartColumn,
    Wallet,
    Inbox,
} from "lucide-react";
import { type AdminTab } from "./NavBar";

interface SidebarProps {
    activeTab: AdminTab | null;
    onTabChange: (tab: AdminTab) => void;
}

interface SidebarItem {
    tab: AdminTab;
    icon: React.ReactNode;
}

const ITEMS: SidebarItem[] = [
    { tab: "Dashboard",       icon: <House         size={17} /> },
    { tab: "Statistics",      icon: <ChartColumn   size={17} /> },
    { tab: "Horses",          icon: <User          size={17} /> },
    { tab: "Users",           icon: <User          size={17} /> },
    { tab: "Rules Managment", icon: <FileText      size={17} /> },
    { tab: "Tournaments",     icon: <FileText      size={17} /> },
    { tab: "Races",           icon: <FileText      size={17} /> },
    { tab: "Inbox",           icon: <Inbox         size={17} /> },
    { tab: "Financial",       icon: <Wallet        size={17} /> },
    { tab: "Violations",      icon: <AlertTriangle size={17} /> },
    { tab: "Violation Types", icon: <ShieldAlert   size={17} /> },
];

export default function AdminSidebar({ activeTab, onTabChange }: SidebarProps) {
    return (
        <aside
            className="w-[185px] shrink-0 bg-[#161616] border-r border-white/10 flex flex-col pt-7 pb-6"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            <div className="px-5 mb-6">
                <p className="text-[13px] font-semibold text-white leading-tight">
                    Management
                </p>
                <p className="text-[10px] font-semibold tracking-widest text-gray-600 uppercase mt-0.5">
                    Admin Tools
                </p>
            </div>

            <nav className="flex flex-col gap-0.5 px-3">
                {ITEMS.map(({ tab, icon }) => {
                    const isActive = tab === activeTab;
                    return (
                        <button
                            key={tab}
                            onClick={() => onTabChange(tab)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all duration-150 w-full text-left ${
                                isActive
                                    ? "bg-red-700 text-white shadow-lg shadow-red-900/30"
                                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                            }`}
                        >
                            <span className={isActive ? "text-white" : "text-gray-500"}>
                                {icon}
                            </span>
                            <span className="flex-1">{tab}</span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}
