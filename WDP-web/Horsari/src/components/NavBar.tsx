import { useState, useRef, useEffect } from "react";
import { Search, LogOut, User } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";
import { useNavigate } from "react-router-dom";

const NAV_LINKS_OWNER = ["Races", "Results", "Predict", "News"];
const NAV_LINKS_REFEREE = ["Races", "Tournament", "Inbox", "Management"];

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

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [links, setLinks] = useState<string[]>([])



  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    if (user?.role == "referee") {
      setLinks(NAV_LINKS_REFEREE)
    }
    else {
      setLinks(NAV_LINKS_OWNER) //Default Link
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-6">

        {/* Left: Logo + Links */}
        <div className="flex items-center gap-8">
          <a href="/" className="font-serif text-[22px] font-semibold text-gray-900 tracking-tight whitespace-nowrap select-none"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            Velosteed
          </a>
          <ul className="hidden md:flex items-center gap-1 list-none m-0 p-0">
            {links.map((label) => (
              <li key={label}>
                <a href={user?.role == 'referee' ? `/referee/${label.toLowerCase()}` : `/${label.toLowerCase()}`}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-md transition-colors duration-150">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2.5">
          {/* Search */}
          <label className="hidden sm:flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 min-w-47.5 cursor-text focus-within:border-gray-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-gray-200 transition-all duration-150">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input type="text" placeholder="Search races, horses..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-[13px] text-gray-700 placeholder-gray-400 w-full" />
          </label>

          {user ? (
            /* ── Avatar + dropdown ── */
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full hover:bg-gray-100 transition-colors duration-150 group"
                aria-label="Account menu"
              >
                {/* Avatar circle */}
                <div className="w-8 h-8 rounded-full bg-red-800 text-white flex items-center justify-center text-[13px] font-bold select-none ring-2 ring-white group-hover:ring-gray-200 transition-all">
                  {getInitials(user)}
                </div>
                {/* Name (hidden on small screens) */}
                <span className="hidden sm:block text-[13px] font-medium text-gray-700 max-w-27.5 truncate">
                  {user.name ?? user.email}
                </span>
                {/* Chevron */}
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className={`text-gray-400 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-100 shadow-xl shadow-black/10 py-1.5 z-50 animate-in">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-red-800 text-white flex items-center justify-center text-[13px] font-bold shrink-0">
                        {getInitials(user)}
                      </div>
                      <div className="min-w-0">
                        {user.name && (
                          <p className="text-[13px] font-semibold text-gray-900 truncate">{user.name}</p>
                        )}
                        <p className="text-[12px] text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <button
                      onClick={() => { setMenuOpen(false); navigate("/profile"); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-[13.5px] text-gray-700 hover:bg-gray-50 transition-colors duration-100"
                    >
                      <User size={15} className="text-gray-400" />
                      My Profile
                    </button>

                    <div className="my-1 border-t border-gray-100" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-[13.5px] text-red-700 hover:bg-red-50 transition-colors duration-100"
                    >
                      <LogOut size={15} className="text-red-500" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── Guest buttons ── */
            <>
              <a href="/signup"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3.5 py-1.5 rounded-lg transition-colors duration-150">
                Sign up
              </a>
              <a href="/login"
                className="text-sm font-semibold text-white bg-red-800 hover:bg-red-900 px-4 py-1.5 rounded-lg shadow-sm hover:shadow-md hover:shadow-red-900/25 transition-all duration-150">
                Login
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}