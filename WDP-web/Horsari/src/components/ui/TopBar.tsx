import { useState, useRef, useEffect, type ReactNode } from "react";
import { ChevronDown, User, LogOut } from "lucide-react";
import { useAuth } from "../../providers/AuthProvider";
import { useSocket } from "../../providers/SocketProvider";
import { useNavigate } from "react-router-dom";
import horsariLogo from "../../assets/horsari_logo_in_image.png";

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

interface TopBarProps {
    logo?: ReactNode;
    onProfileClick: () => void;
    onLogout?: () => void;
}

export default function TopBar({ logo, onProfileClick, onLogout }: TopBarProps) {
    const { user, logout } = useAuth();
    const { connected: wsConnected } = useSocket();
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

    const handleLogout = async () => {
        setMenuOpen(false);
        if (onLogout) {
            onLogout();
            return;
        }
        await logout();
        navigate("/login", { replace: true });
    };

    return (
        <nav className="w-full border-b border-border bg-surface font-sans">
            <div className="max-w-[1440px] mx-auto px-6 h-14 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {logo ?? (
                        <img src={horsariLogo} alt="Horsari" className="h-8 w-auto" />
                    )}
                    <span
                        className="text-[15px] font-bold tracking-widest text-[#AB3030] uppercase font-mono"
                        style={{ letterSpacing: "0.18em" }}
                    >
                        Horsari
                    </span>
                    <span
                        className={`w-1.5 h-1.5 rounded-full ${wsConnected ? "bg-green animate-pulse" : "bg-red"}`}
                        title={wsConnected ? "Connected" : "Disconnected"}
                    />
                </div>

                <div className="flex items-center gap-3">
                    {user && (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setMenuOpen((o) => !o)}
                                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-surface-raised transition-colors duration-150 cursor-pointer"
                            >
                                <div className="w-7 h-7 rounded-full bg-gold text-bg flex items-center justify-center text-[11px] font-bold shadow-sm overflow-hidden">
                                    {user.image ? (
                                        <img src={user.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        getInitials(user)
                                    )}
                                </div>
                                <ChevronDown
                                    size={13}
                                    className={`text-text-muted transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
                                />
                            </button>

                            {menuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-surface-raised rounded-xl border border-border shadow-xl py-1.5 z-50 text-text">
                                    <div className="px-4 py-3 border-b border-border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gold text-bg flex items-center justify-center text-[13px] font-bold shrink-0 overflow-hidden">
                                                {user.image ? (
                                                    <img src={user.image} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    getInitials(user)
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                {user.name && (
                                                    <p className="text-[13px] font-semibold text-text truncate">{user.name}</p>
                                                )}
                                                <p className="text-[12px] text-text-muted truncate">{user.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="py-1">
                                        <button
                                            onClick={() => { setMenuOpen(false); onProfileClick(); }}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-[13.5px] text-text-muted hover:text-text hover:bg-surface transition-colors duration-100 cursor-pointer"
                                        >
                                            <User size={15} className="text-text-muted" />
                                            My Profile
                                        </button>

                                        <div className="my-1 border-t border-border" />

                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-[13.5px] text-red hover:bg-red/10 transition-colors duration-100 cursor-pointer"
                                        >
                                            <LogOut size={15} className="text-red" />
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
