import { useState, useEffect } from "react";
import {
    Search, User, CheckCircle, XCircle, Clock, Loader2,
    ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import UserDetailPanel from "./AdminComponents/UserDetailPanel";
import { adminService } from "../../api/adminService";
import { Pagination } from "../../components/Pagination";

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole = "HorseOwner" | "Jockey" | "Referee" | "Spectator" | "Admin";
export type UserStatus = "active" | "pending" | "suspended";

export interface BaseUser {
    userId: string; userName: string; email: string; fullName: string;
    dateOfBirth: string; phoneNumber: string; image: string;
    role: UserRole; confirm: boolean; updatedAt: string; status: UserStatus;
}

export interface ViolationData {
    violationId: string;
    typeName: string | null;
    description: string | null;
    severity: number | null;
    stewardAction: string | null;
    violationStatus: string;
    reportedAt: string | null;
    raceRoundId?: string | null;
    roundName?: string | null;
    raceDate?: string | null;
}
export interface HorseData { id: string; name: string; breed: string; age: number; status: string; violations?: ViolationData[]; }
export interface HorseOwnerData { address: string; licenseStatus: string; licenseLink: string; horses?: HorseData[]; }
export interface RaceHistoryData { id: string; raceName: string; date: string; position: number | null; finishTime: string | null; prize: number | null; resultStatus: string | null; distance: number | null; horseName: string | null; horseBreed: string | null; horseImg: string | null; attendance: "no_show" | "main" | "backup"; bookingFees: number; violations?: ViolationData[]; }
export interface JockeyData { height: number; weight: number; matchesRaced: number; totalWins: number; rank: number | null; totalJockeys: number; status: string; licenseLink: string; licenseStatus: string; bookingFee: number; raceHistory?: RaceHistoryData[]; }
export interface RefereeAssignmentData { assignmentId: string; raceRoundId: string | null; roundName: string | null; raceDate: string | null; raceStatus: string | null; assignmentStatus: string; paymentStatus: string; fee: number; violations?: ViolationData[]; }
export interface RefereeData { licenseLink: string; licenseStatus: string; totalAssignments: number; assignments?: RefereeAssignmentData[]; }
export interface SpectatorPredictionData {
    predictionId: string;
    methodName: string | null;
    methodType: string | null;
    predictionStatus: string;
    rewardPoints: number;
    predictedRank: number | null;
    predictedHorse: string | null;
    raceRound: { raceRoundId: string; roundName: string; raceDate: string; status: string } | null;
    tournament: { tournamentId: string; tournamentName: string; status: string } | null;
    createdAt: string | null;
}
export interface SpectatorTransactionData {
    transactionId: string;
    transactionType: string;
    amount: number;
    status: string;
    description: string | null;
    referenceType: string | null;
    date: string;
}
export interface SpectatorData {
    wallet: number;
    predictions: SpectatorPredictionData[];
    transactions: SpectatorTransactionData[];
}
export interface AdminData { adminLevel: number; }

export type RoleData =
    | { role: "HorseOwner"; data: HorseOwnerData }
    | { role: "Jockey"; data: JockeyData }
    | { role: "Referee"; data: RefereeData }
    | { role: "Spectator"; data: SpectatorData }
    | { role: "Admin"; data: AdminData };

export type FullUser = BaseUser & RoleData;

// ── Mock data ─────────────────────────────────────────────────────────────────

function mapRole(backendRole: string): UserRole {
    switch (backendRole) {
        case 'horseowner': return 'HorseOwner';
        case 'jockey': return 'Jockey';
        case 'referee': return 'Referee';
        case 'admin': return 'Admin';
        default: return 'Spectator';
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapViolation(v: any): ViolationData {
    return {
        violationId: String(v.violationId ?? v._id),
        typeName: v.typeName ?? null,
        description: v.description ?? null,
        severity: v.severity ?? null,
        stewardAction: v.stewardAction ?? null,
        violationStatus: v.violationStatus ?? 'pending',
        reportedAt: v.reportedAt ?? null,
        raceRoundId: v.raceRoundId ? String(v.raceRoundId) : null,
        roundName: v.roundName ?? null,
        raceDate: v.raceDate ?? null,
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mergeRoleDetail(base: FullUser, detail: any): FullUser {
    const rp = detail?.roleProfile || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any = base.data;
    if (base.role === 'HorseOwner') {
        data = {
            address: rp.address || 'N/A',
            licenseStatus: rp.licenseStatus || 'N/A',
            licenseLink: rp.licenseLink || '',
            horses: (rp.horses || []).map((h: any) => ({
                id: String(h._id),
                name: h.horseName,
                breed: h.breed || 'Unknown',
                age: h.dateOfBirth
                    ? Math.floor((Date.now() - new Date(h.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000))
                    : 0,
                status: h.status ? (h.status.charAt(0).toUpperCase() + h.status.slice(1)) : 'Unknown',
                violations: (h.violations || []).map(mapViolation),
            })),
        };
    } else if (base.role === 'Jockey') {
        data = {
            height: rp.height ?? 0,
            weight: rp.weight ?? 0,
            matchesRaced: rp.matchesRaced ?? 0,
            totalWins: rp.totalWins ?? 0,
            rank: rp.rank ?? null,
            totalJockeys: rp.totalJockeys ?? 0,
            status: rp.status || 'N/A',
            licenseLink: rp.licenseLink || '',
            licenseStatus: rp.licenseStatus || 'N/A',
            bookingFee: rp.bookingFee ?? 0,
            raceHistory: (rp.raceHistory || []).map((r: any) => ({
                id: String(r.raceRoundId),
                raceName: r.roundName || 'Unknown Race',
                date: r.raceDate ? r.raceDate.split('T')[0] : 'N/A',
                position:     r.finishPosition ?? null,
                finishTime:   r.finishTime     ?? null,
                prize:        r.prizeMoney     ?? null,
                resultStatus: r.resultStatus   ?? null,
                distance:     r.distance       ?? null,
                horseName:    r.horseName      ?? null,
                horseBreed:   r.horseBreed     ?? null,
                horseImg:     r.horseImg       ?? null,
                attendance:   r.attendance     ?? 'main',
                bookingFees:  r.bookingFees    ?? 0,
                violations: (r.violations || []).map(mapViolation),
            })),
        };
    } else if (base.role === 'Referee') {
        data = {
            licenseLink: rp.licenseLink || '',
            licenseStatus: rp.licenseStatus || 'N/A',
            totalAssignments: rp.totalAssignments ?? 0,
            assignments: (rp.assignments || []).map((a: any) => ({
                assignmentId: String(a.assignmentId),
                raceRoundId: a.raceRoundId ? String(a.raceRoundId) : null,
                roundName: a.roundName ?? null,
                raceDate: a.raceDate ? a.raceDate.split('T')[0] : null,
                raceStatus: a.raceStatus ?? null,
                assignmentStatus: a.assignmentStatus ?? 'pending',
                paymentStatus: a.paymentStatus ?? 'unpaid',
                fee: a.fee ?? 0,
                violations: (a.violations || []).map(mapViolation),
            })),
        };
    } else if (base.role === 'Spectator') {
        data = {
            wallet: rp.wallet ?? 0,
            predictions: (rp.predictions ?? []).map((p: any): SpectatorPredictionData => ({
                predictionId:     String(p.predictionId ?? p._id),
                methodName:       p.methodName       ?? null,
                methodType:       p.methodType       ?? null,
                predictionStatus: p.predictionStatus ?? 'pending',
                rewardPoints:     p.rewardPoints     ?? 0,
                predictedRank:    p.predictedRank    ?? null,
                predictedHorse:   p.predictedHorse   ?? null,
                raceRound:        p.raceRound        ?? null,
                tournament:       p.tournament       ?? null,
                createdAt:        p.createdAt        ?? null,
            })),
            transactions: (rp.transactions ?? []).map((t: any): SpectatorTransactionData => ({
                transactionId:   String(t.transactionId ?? t._id),
                transactionType: t.transactionType,
                amount:          t.amount,
                status:          t.status,
                description:     t.description  ?? null,
                referenceType:   t.referenceType ?? null,
                date:            t.date,
            })),
        };
    } else if (base.role === 'Admin') {
        data = { adminLevel: 1 };
    }
    return { ...base, data } as FullUser;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUser(backendUser: any): FullUser {
    const role = mapRole(backendUser.role);
    const base: BaseUser = {
        userId: backendUser._id,
        userName: backendUser.username || "Unknown",
        email: backendUser.email || "",
        fullName: backendUser.fullName || backendUser.username || "Unknown",
        dateOfBirth: backendUser.dateOfBirth ? backendUser.dateOfBirth.split('T')[0] : "N/A",
        phoneNumber: backendUser.phoneNumber || "N/A",
        image: backendUser.image || "",
        role: role,
        confirm: backendUser.status === 'active',
        updatedAt: backendUser.updatedAt ? backendUser.updatedAt.split('T')[0] : "N/A",
        status: backendUser.status === 'inactive' ? 'pending' : backendUser.status as UserStatus || 'active',
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any = {};
    if (role === 'HorseOwner') data = { address: "N/A", licenseStatus: "N/A", licenseLink: "" };
    else if (role === 'Jockey') data = { height: 0, weight: 0, matchesRaced: 0, totalWins: 0, rank: null, totalJockeys: 0, status: "N/A", licenseLink: "", licenseStatus: "N/A" };
    else if (role === 'Referee') data = { certificationNumber: "N/A", licenseNumber: "N/A" };
    else if (role === 'Spectator') data = { wallet: 0, predictions: [], transactions: [] };
    else if (role === 'Admin') data = { adminLevel: 1 };

    return { ...base, data } as FullUser;
}

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
    const [limit, setLimit] = useState<number>(10);
    const [selectedUser, setSelectedUser] = useState<FullUser | null>(null);
    const [users, setUsers] = useState<FullUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [sortBy, setSortBy] = useState<string>('createdAt');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const totalPages = Math.ceil(totalItems / limit) || 1;

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setOrder('asc');
        }
        setPage(1);
    };

    const SortIcon = ({ field }: { field: string }) => {
        if (sortBy !== field) return <ArrowUpDown size={11} className="text-gray-600 ml-1 inline" />;
        return order === 'asc'
            ? <ArrowUp size={11} className="text-[#f3b2a5] ml-1 inline" />
            : <ArrowDown size={11} className="text-[#f3b2a5] ml-1 inline" />;
    };

    // Reset to page 1 when filters change
    useEffect(() => { setPage(1); }, [roleFilter, search, limit]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const skip = (page - 1) * limit;
                const res = await adminService.getAllUsers(roleFilter, search, limit, skip, sortBy, order);
                const mapped = (res?.data?.items || []).map(mapUser);
                setUsers(mapped);
                setTotalItems(res?.data?.pagination?.totalItems ?? mapped.length);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        const timer = setTimeout(fetchUsers, 300);
        return () => clearTimeout(timer);
    }, [roleFilter, search, limit, page, sortBy, order]);

    useEffect(() => {
        if (!selectedUser) return;
        let cancelled = false;
        const fetchDetail = async () => {
            setDetailLoading(true);
            try {
                const res = await adminService.getUsersDetail(selectedUser.userId);
                if (!cancelled && res?.data) {
                    setSelectedUser(prev => prev ? mergeRoleDetail(prev, res.data) : prev);
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (!cancelled) setDetailLoading(false);
            }
        };
        fetchDetail();
        return () => { cancelled = true; };
    }, [selectedUser?.userId]); // eslint-disable-line react-hooks/exhaustive-deps

    const filtered = users;

    const panelOpen = selectedUser !== null;

    return (
        <div className="flex flex-col h-full bg-[#111111] text-white overflow-hidden font-sans">
            <div className="flex-1 flex gap-4 p-8 min-h-0 items-start">
                <main className={`flex flex-col min-w-0 h-full transition-all duration-200 ${panelOpen ? "flex-[0_0_50%]" : "flex-1"}`}>
                    
                    {/* Header */}
                    <header className="pb-5 flex flex-col gap-3 border-b border-white/5 shrink-0">
                        {/* Row 1 */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <h1 className="text-[22px] font-bold text-white tracking-tight leading-tight truncate font-serif">
                                    Users
                                </h1>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-[10px] font-semibold tracking-wide text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase whitespace-nowrap">
                                        All Registered Users
                                    </span>
                                    <span className="text-[12px] text-gray-500 truncate">· {totalItems} user{totalItems !== 1 ? "s" : ""}</span>
                                </div>
                            </div>
                            <button className="shrink-0 flex items-center gap-2 px-4 text-[12px] font-medium text-white bg-[#ab3030] rounded hover:bg-[#8f2828] transition-colors shadow-lg shadow-red-900/20 h-[32px]">
                                + Create User
                            </button>
                        </div>

                        {/* Row 2 */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="relative flex-1 min-w-0">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search users…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-md pl-8 pr-3 text-[11px] text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 h-[32px] transition-colors"
                                />
                            </div>
                            <select
                                value={limit}
                                onChange={(e) => setLimit(Number(e.target.value))}
                                className="shrink-0 bg-[#1a1a1a] border border-white/10 rounded-md px-3 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
                            >
                                <option value={10}>10 / page</option>
                                <option value={25}>25 / page</option>
                                <option value={50}>50 / page</option>
                                <option value={100}>100 / page</option>
                            </select>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value as any)}
                                className="w-[130px] shrink-0 bg-[#1a1a1a] border border-white/10 rounded-md px-3 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
                            >
                                <option value="All">All Roles</option>
                                <option value="HorseOwner">Horse Owner</option>
                                <option value="Jockey">Jockey</option>
                                <option value="Referee">Referee</option>
                                <option value="Spectator">Spectator</option>
                                <option value="Admin">Admin</option>
                            </select>
                            <select
                                value={`${sortBy}:${order}`}
                                onChange={e => {
                                    const [field, dir] = e.target.value.split(':');
                                    setSortBy(field);
                                    setOrder(dir as 'asc' | 'desc');
                                    setPage(1);
                                }}
                                className="w-[175px] shrink-0 bg-[#1a1a1a] border border-white/10 rounded-md px-3 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
                            >
                                <option value="createdAt:desc">Newest First</option>
                                <option value="createdAt:asc">Oldest First</option>
                                <option value="fullName:asc">Name A–Z</option>
                                <option value="fullName:desc">Name Z–A</option>
                                <option value="role:asc">Group by Role</option>
                                <option value="status:asc">Group by Status</option>
                            </select>
                        </div>
                    </header>

                    {/* Table Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pt-6">
                        <div className="w-full rounded-xl border border-white/[0.07] bg-[#141414] overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#1a1a1a] border-b border-white/5">
                                        <th onClick={() => handleSort('fullName')} className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase cursor-pointer hover:text-gray-300 select-none whitespace-nowrap">
                                            User <SortIcon field="fullName" />
                                        </th>
                                        {!panelOpen && (
                                            <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Email</th>
                                        )}
                                        <th onClick={() => handleSort('role')} className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase cursor-pointer hover:text-gray-300 select-none whitespace-nowrap">
                                            Role <SortIcon field="role" />
                                        </th>
                                        <th onClick={() => handleSort('status')} className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase cursor-pointer hover:text-gray-300 select-none whitespace-nowrap">
                                            Status <SortIcon field="status" />
                                        </th>
                                        {!panelOpen && (
                                            <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Confirmed</th>
                                        )}
                                        {!panelOpen && (
                                            <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Updated</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6}>
                                                <div className="py-10 text-center flex flex-col items-center justify-center">
                                                    <Loader2 size={22} className="text-gray-500 animate-spin mb-2" />
                                                    <p className="text-[12px] text-gray-600">Loading users...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={6}>
                                                <div className="py-10 text-center">
                                                    <User size={22} className="text-gray-700 mx-auto mb-2" />
                                                    <p className="text-[12px] text-gray-600">No users found.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map(user => {
                                            const style = ROLE_STYLES[user.role];
                                            const statusStyle = STATUS_STYLES[user.status] || STATUS_STYLES.active;
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
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            limit={limit}
                            onPageChange={setPage}
                        />
                    </div>
                </main>

                {/* Detail panel */}
                {panelOpen && (
                    <div className="flex-1 min-w-[500px] h-full">
                        <UserDetailPanel
                            user={selectedUser!}
                            onClose={() => setSelectedUser(null)}
                            detailLoading={detailLoading}
                            onVerify={async (action) => {
                                await adminService.verifyCertification(selectedUser!.userId, action);
                                const newStatus = action === 'approve' ? 'approved' : 'rejected';
                                setSelectedUser(prev => prev
                                    ? { ...prev, data: { ...(prev.data as any), licenseStatus: newStatus } } as typeof prev
                                    : prev
                                );
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}