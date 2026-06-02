import {
    House,
    ShieldCheck,
    Activity,
    FileText,
    User
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
    { tab: "Home", icon: <House size={17} /> },
    { tab: "Horses", icon: <User size={17} /> },
    { tab: "Roles & Permissions", icon: <ShieldCheck size={17} /> },
    { tab: "Activity Logs", icon: <Activity size={17} /> },
    { tab: "Inbox", icon: <FileText size={17} /> },
    { tab: "Races", icon: <FileText size={17} /> },
    { tab: "Tournaments", icon: <FileText size={17} /> },
];

export default function AdminSidebar({ activeTab, onTabChange }: SidebarProps) {
    return (
        <aside
            className="w-[185px] shrink-0 bg-[#161616] border-r border-white/10 flex flex-col pt-7 pb-6"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            {/* Section label */}
            <div className="px-5 mb-6">
                <p className="text-[13px] font-semibold text-white leading-tight">
                    Management
                </p>
                <p className="text-[10px] font-semibold tracking-widest text-gray-600 uppercase mt-0.5">
                    Owner Tools
                </p>
            </div>

            {/* Nav items */}
            <nav className="flex flex-col gap-0.5 px-3">
                {ITEMS.map(({ tab, icon }) => {
                    const isActive = tab === activeTab;
                    return (
                        <button
                            key={tab}
                            onClick={() => onTabChange(tab)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all duration-150 w-full text-left ${isActive
                                ? "bg-red-700 text-white shadow-lg shadow-red-900/30"
                                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                                }`}
                        >
                            <span className={isActive ? "text-white" : "text-gray-500"}>
                                {icon}
                            </span>
                            {tab}
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}