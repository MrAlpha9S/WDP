import { useState, useRef, useEffect } from "react";
import { Bell, ChevronDown, User, LogOut } from "lucide-react";
import { useAuth } from "../../../providers/AuthProvider";
import { useNavigate } from "react-router-dom";

export type AdminTab = "Dashboard" | "Home" | "Tournaments" | "Users" | "Financial" | "Races" | "Roles & Permissions" | "Horses" | "Activity Logs" | "Inbox";

export const ADMIN_TABS: AdminTab[] = [];

interface NavBarProps {
    activeTab: AdminTab;
    onTabChange: (tab: AdminTab) => void;
}

function getInitials(user: { name?: string; email: string }) {
    if (user.name) {
        return user.name
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    }
    return user.email[0].toUpperCase();
}

export default function AdminNavBar({ activeTab, onTabChange }: NavBarProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        setMenuOpen(false);
        logout();
        navigate("/login", { replace: true });
    };

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
                    {ADMIN_TABS.map((tab) => {
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
                    <button className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors duration-150" onClick={() => onTabChange("Inbox")}>
                        <Bell size={17} />
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                    </button>
                    {user && (
                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-white/5 transition-colors duration-150">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center text-[11px] font-bold text-white shadow-sm border border-red-800/50">
                                    {getInitials(user)}
                                </div>
                                <ChevronDown size={13} className={`text-gray-500 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`} />
                            </button>

                            {/* Dropdown */}
                            {menuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] rounded-xl border border-white/10 shadow-xl py-1.5 z-50 animate-in text-gray-200">
                                    {/* User info header */}
                                    <div className="px-4 py-3 border-b border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-700 to-red-900 text-white flex items-center justify-center text-[13px] font-bold shrink-0">
                                                {getInitials(user)}
                                            </div>
                                            <div className="min-w-0">
                                                {user.name && (
                                                    <p className="text-[13px] font-semibold text-white truncate">{user.name}</p>
                                                )}
                                                <p className="text-[12px] text-gray-400 truncate">{user.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu items */}
                                    <div className="py-1">
                                        <button
                                            onClick={() => { setMenuOpen(false); navigate("/profile"); }}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-[13.5px] text-gray-300 hover:text-white hover:bg-white/5 transition-colors duration-100"
                                        >
                                            <User size={15} className="text-gray-400" />
                                            My Profile
                                        </button>

                                        <div className="my-1 border-t border-white/5" />

                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-[13.5px] text-red-400 hover:bg-red-500/10 transition-colors duration-100"
                                        >
                                            <LogOut size={15} className="text-red-500" />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}