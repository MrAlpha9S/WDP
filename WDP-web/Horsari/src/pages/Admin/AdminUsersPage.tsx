import { useState } from "react";
import {
    Search, User, CheckCircle, XCircle, Clock
} from "lucide-react";
import UserDetailPanel from "./AdminComponents/UserDetailPanel";

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole = "HorseOwner" | "Jockey" | "Referee" | "Spectator" | "Admin";
export type UserStatus = "active" | "pending" | "suspended";

export interface BaseUser {
    userId: string; userName: string; email: string; fullName: string;
    dateOfBirth: string; phoneNumber: string; image: string;
    role: UserRole; confirm: boolean; updatedAt: string; status: UserStatus;
}

export interface HorseData { id: string; name: string; breed: string; age: number; status: string; }
export interface HorseOwnerData { address: string; licenseStatus: string; licenseLink: string; horses?: HorseData[]; }
export interface RaceHistoryData { id: string; raceName: string; date: string; position: number; prize: number; }
export interface JockeyData { height: number; weight: number; matchesRaced: number; totalWins: number; ranking: number; status: string; licenseLink: string; licenseStatus: string; raceHistory?: RaceHistoryData[]; }
export interface RefereeData { certificationNumber: string; licenseNumber: string; }
export interface SpectatorData { rewardPoints: number; }
export interface AdminData { adminLevel: number; }

export type RoleData =
    | { role: "HorseOwner"; data: HorseOwnerData }
    | { role: "Jockey"; data: JockeyData }
    | { role: "Referee"; data: RefereeData }
    | { role: "Spectator"; data: SpectatorData }
    | { role: "Admin"; data: AdminData };

export type FullUser = BaseUser & RoleData;

// ── Mock data ─────────────────────────────────────────────────────────────────

const USERS: FullUser[] = [
    {
        userId: "u1", userName: "jweston", email: "james@horsari.com", fullName: "James Weston",
        dateOfBirth: "1985-03-12", phoneNumber: "+1 555 0101",
        image: "https://i.pravatar.cc/150?img=11",
        role: "HorseOwner", confirm: true, updatedAt: "2024-10-24", status: "active",
        data: { 
            address: "14 Paddock Lane, Dubai", licenseStatus: "Valid", licenseLink: "https://cdn.horsari.com/licenses/jweston.pdf",
            horses: [
                { id: "h1", name: "Desert Storm", breed: "Arabian", age: 4, status: "Active" },
                { id: "h2", name: "Midnight Runner", breed: "Thoroughbred", age: 3, status: "Injured" }
            ]
        }
    },
    {
        userId: "u2", userName: "smiller", email: "sarah@horsari.com", fullName: "Sarah Miller",
        dateOfBirth: "1994-07-22", phoneNumber: "+1 555 0202",
        image: "https://i.pravatar.cc/150?img=5",
        role: "Jockey", confirm: true, updatedAt: "2024-10-23", status: "active",
        data: { 
            height: 162, weight: 54, matchesRaced: 48, totalWins: 19, ranking: 3, status: "Professional", licenseLink: "https://cdn.horsari.com/licenses/smiller.pdf", licenseStatus: "Valid",
            raceHistory: [
                { id: "r1", raceName: "Dubai World Cup", date: "2024-03-30", position: 1, prize: 5000000 },
                { id: "r2", raceName: "Epsom Derby", date: "2024-06-01", position: 3, prize: 150000 }
            ]
        }
    },
    {
        userId: "u3", userName: "dross", email: "david@horsari.com", fullName: "David Ross",
        dateOfBirth: "1979-11-05", phoneNumber: "+1 555 0303", image: "",
        role: "Referee", confirm: true, updatedAt: "2024-10-23", status: "active",
        data: { certificationNumber: "REF-2024-0391", licenseNumber: "LIC-UK-7821" }
    },
    {
        userId: "u4", userName: "akowalski", email: "anna@horsari.com", fullName: "Anna Kowalski",
        dateOfBirth: "2000-01-30", phoneNumber: "+1 555 0404", image: "",
        role: "Spectator", confirm: true, updatedAt: "2024-10-20", status: "active",
        data: { rewardPoints: 1240 }
    },
    {
        userId: "u5", userName: "rbrown", email: "ryan@horsari.com", fullName: "Ryan Brown",
        dateOfBirth: "1991-06-18", phoneNumber: "+1 555 0505", image: "",
        role: "HorseOwner", confirm: false, updatedAt: "2024-10-19", status: "pending",
        data: { address: "88 Stables Road, Ascot", licenseStatus: "Pending", licenseLink: "https://cdn.horsari.com/licenses/rbrown.pdf" }
    },
    {
        userId: "u6", userName: "lchang", email: "lily@horsari.com", fullName: "Lily Chang",
        dateOfBirth: "1996-09-14", phoneNumber: "+1 555 0606",
        image: "https://i.pravatar.cc/150?img=9",
        role: "Jockey", confirm: true, updatedAt: "2024-10-18", status: "suspended",
        data: { 
            height: 158, weight: 51, matchesRaced: 22, totalWins: 7, ranking: 11, status: "Amateur", licenseLink: "https://cdn.horsari.com/licenses/lchang.pdf", licenseStatus: "Suspended",
            raceHistory: [
                { id: "r3", raceName: "Local Maiden", date: "2024-09-12", position: 1, prize: 5000 },
                { id: "r4", raceName: "Autumn Stakes", date: "2024-10-05", position: 8, prize: 0 }
            ]
        }
    },
    {
        userId: "u7", userName: "admin01", email: "admin@horsari.com", fullName: "System Admin",
        dateOfBirth: "1980-01-01", phoneNumber: "+1 555 0001", image: "",
        role: "Admin", confirm: true, updatedAt: "2024-10-01", status: "active",
        data: { adminLevel: 1 }
    },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export const ROLE_STYLES: Record<UserRole, { bg: string; text: string; label: string }> = {
    HorseOwner: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Horse Owner" },
    Jockey: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Jockey" },
    Referee: { bg: "bg-purple-500/10", text: "text-purple-400", label: "Referee" },
    Spectator: { bg: "bg-teal-500/10", text: "text-teal-400", label: "Spectator" },
    Admin: { bg: "bg-red-500/10", text: "text-red-400", label: "Admin" },
};

export const STATUS_STYLES: Record<UserStatus, { icon: React.ReactNode; text: string; color: string }> = {
    active: { icon: <CheckCircle size={13} />, text: "Active", color: "text-emerald-400" },
    pending: { icon: <Clock size={13} />, text: "Pending", color: "text-amber-400" },
    suspended: { icon: <XCircle size={13} />, text: "Suspended", color: "text-red-400" },
};

function initials(name: string) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ["#3b4a6b", "#4a3b6b", "#3b6b4a", "#6b3b4a", "#4a6b3b", "#6b4a3b", "#3b5a6b"];
function avatarColor(id: string) { return AVATAR_COLORS[id.charCodeAt(1) % AVATAR_COLORS.length]; }

export function accentClass(role: UserRole) {
    return role === "HorseOwner" ? "bg-amber-400"
        : role === "Jockey" ? "bg-blue-400"
            : role === "Referee" ? "bg-purple-400"
                : role === "Spectator" ? "bg-teal-400"
                    : "bg-red-400";
}

// ── Avatar component ──────────────────────────────────────────────────────────
// Shows the image if available, falls back to colored initials circle.

export function Avatar({
    src, name, id, size = "md",
}: {
    src: string; name: string; id: string; size?: "sm" | "md" | "lg";
}) {
    const [errored, setErrored] = useState(false);

    const dim = size === "sm" ? "w-8 h-8 text-[11px]"
        : size === "lg" ? "w-14 h-14 text-[16px]"
            : "w-10 h-10 text-[13px]";

    if (src && !errored) {
        return (
            <img
                src={src}
                alt={name}
                onError={() => setErrored(true)}
                className={`${dim} rounded-full object-cover flex-shrink-0`}
            />
        );
    }

    return (
        <div
            className={`${dim} rounded-full flex items-center justify-center font-bold text-white/80 flex-shrink-0`}
            style={{ background: avatarColor(id) }}
        >
            {initials(name)}
        </div>
    );
}



// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<UserRole | "All">("All");
    const [selectedUser, setSelectedUser] = useState<FullUser | null>(null);

    const filtered = USERS.filter(u => {
        const matchSearch =
            u.fullName.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase()) ||
            u.userName.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === "All" || u.role === roleFilter;
        return matchSearch && matchRole;
    });

    const panelOpen = selectedUser !== null;

    return (
        <div className="flex flex-col h-full bg-[#111111] text-white overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="flex-1 flex gap-4 p-8 min-h-0 items-start">
                <main className={`flex flex-col min-w-0 h-full transition-all duration-200 ${panelOpen ? "flex-[0_0_50%]" : "flex-1"}`}>
                    
                    {/* Header */}
                    <header className="pb-6 flex items-center justify-between border-b border-white/5 shrink-0">
                        <div>
                            <h1 className="text-[26px] font-bold text-white tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                                Users
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] font-semibold tracking-wide text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase">
                                    All Registered Users
                                </span>
                                <span className="text-[13px] text-gray-500">· {filtered.length} user{filtered.length !== 1 ? "s" : ""}</span>
                            </div>
                        </div>

                        <div className="flex gap-3 items-center">
                            <div className="relative w-56">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search users…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-md pl-8 pr-3 text-[12px] text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 h-[34px] transition-colors"
                                />
                            </div>

                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value as any)}
                                className="bg-[#1a1a1a] border border-white/10 rounded-md px-3 text-[12px] text-gray-300 focus:outline-none focus:border-white/20 h-[34px] appearance-none cursor-pointer"
                            >
                                <option value="All">All Roles</option>
                                <option value="HorseOwner">Horse Owner</option>
                                <option value="Jockey">Jockey</option>
                                <option value="Referee">Referee</option>
                                <option value="Spectator">Spectator</option>
                                <option value="Admin">Admin</option>
                            </select>

                            <button className="flex items-center gap-2 px-5 text-[13px] font-medium text-white bg-[#ab3030] rounded hover:bg-[#8f2828] transition-colors shadow-lg shadow-red-900/20 h-[34px]">
                                + Create User
                            </button>
                        </div>
                    </header>

                    {/* Table Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pt-6">
                        <div className="w-full rounded-xl border border-white/[0.07] bg-[#141414] overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#1a1a1a] border-b border-white/5">
                                        {(panelOpen
                                            ? ["User", "Role", "Status"]
                                            : ["User", "Email", "Role", "Status", "Confirmed", "Updated"]
                                        ).map(h => (
                                            <th key={h} className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filtered.map(user => {
                                        const style = ROLE_STYLES[user.role];
                                        const statusStyle = STATUS_STYLES[user.status];
                                        const isSelected = selectedUser?.userId === user.userId;

                                        return (
                                            <tr
                                                key={user.userId}
                                                onClick={() => setSelectedUser(isSelected ? null : user)}
                                                className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${isSelected ? "bg-red-900/10" : ""}`}
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <Avatar src={user.image} name={user.fullName} id={user.userId} size="sm" />
                                                        <div className="min-w-0">
                                                            <p className="text-[13px] text-white font-medium truncate">{user.fullName}</p>
                                                            {!panelOpen && <p className="text-[11px] text-gray-600 truncate">@{user.userName}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                {!panelOpen && (
                                                    <td className="p-4">
                                                        <p className="text-[12px] text-gray-400 truncate">{user.email}</p>
                                                    </td>
                                                )}
                                                <td className="p-4">
                                                    <span className={`inline-flex w-fit text-[11px] font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                                                        {style.label}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`flex items-center gap-1 text-[12px] font-medium ${statusStyle.color}`}>
                                                        {statusStyle.icon}
                                                        {!panelOpen && <span className="hidden xl:inline">{statusStyle.text}</span>}
                                                    </span>
                                                </td>
                                                {!panelOpen && (
                                                    <td className="p-4">
                                                        <span className={user.confirm ? "text-emerald-400" : "text-amber-400"}>
                                                            {user.confirm ? <CheckCircle size={14} /> : <Clock size={14} />}
                                                        </span>
                                                    </td>
                                                )}
                                                {!panelOpen && (
                                                    <td className="p-4">
                                                        <p className="text-[11px] text-gray-600">{user.updatedAt}</p>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={6}>
                                                <div className="py-10 text-center">
                                                    <User size={22} className="text-gray-700 mx-auto mb-2" />
                                                    <p className="text-[12px] text-gray-600">No users found.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>

                {/* Detail panel */}
                {panelOpen && (
                    <div className="flex-1 min-w-[500px] h-full">
                        <UserDetailPanel user={selectedUser!} onClose={() => setSelectedUser(null)} />
                    </div>
                )}
            </div>
        </div>
    );
}