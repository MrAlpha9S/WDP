import { Bell, ChevronDown, Trophy } from "lucide-react";

export type RefereeTab = "Dashboard" | "Tournaments" | "Inbox" | "Management";

export const REFEREE_TABS: RefereeTab[] = ["Dashboard", "Tournaments", "Inbox", "Management"];

interface NavBarProps {
    activeTab: RefereeTab;
    onTabChange: (tab: RefereeTab) => void;
}

export default function RefereeNavBar({ activeTab, onTabChange }: NavBarProps) {
    return (
        <nav
            className="w-full border-b border-white/10 bg-[#0f0f0f]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                {/* Logo */}
                <span
                    className="text-[15px] font-bold tracking-widest text-red-500 uppercase"
                    style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "0.18em" }}
                >
                    Horsari
                </span>

                {/* Nav tabs */}
                <ul className="flex items-center gap-1">
                    {REFEREE_TABS.map((tab) => {
                        const isActive = tab === activeTab;
                        return (
                            <li key={tab}>
                                <button
                                    onClick={() => onTabChange(tab)}
                                    className={`px-4 py-1.5 rounded text-[13.5px] font-medium transition-colors duration-150 relative ${isActive
                                        ? "text-white"
                                        : "text-gray-400 hover:text-gray-200"
                                        }`}
                                >
                                    {tab}
                                    {isActive && (
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-red-600 rounded-full" />
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>

                {/* Right icons */}
                <div className="flex items-center gap-3">
                    <button className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors duration-150">
                        <Bell size={17} />
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                    </button>
                    <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-white/5 transition-colors duration-150">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center">
                            <Trophy size={12} className="text-red-200" />
                        </div>
                        <ChevronDown size={13} className="text-gray-500" />
                    </button>
                </div>
            </div>
        </nav>
    );
}