import { useState } from "react";
import { Users, Trophy, ClipboardList, DollarSign, Eye, Settings, CheckSquare, Radio } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ApprovalRole = "Horse Owner" | "Jockey" | "Referee" | "Trainer";
type RaceStatus = "LIVE" | "PRE-RACE" | "POST-RACE";

type InvitationStatus = "Pending" | "Accepted" | "Declined";

interface Invitee {
    id: string;
    name: string;
    role: ApprovalRole;
    dateInvited: string;
    status: InvitationStatus;
    initials: string;
    color: string;
    registeredRace?: string;
    raceSlotsFilled?: number;
    raceTotalSlots?: number;
    horseSelected?: string;
    mainJockeyName?: string;
    mainJockeyStatus?: InvitationStatus;
    backupJockeyName?: string;
    backupJockeyStatus?: InvitationStatus;
}

interface ActiveRace {
    id: string;
    status: RaceStatus;
    name: string;
    detail: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const INVITEES: Invitee[] = [
    { 
        id: "1", 
        name: "James Weston", 
        role: "Horse Owner", 
        dateInvited: "Oct 24, 09:12", 
        status: "Accepted",
        initials: "JW", 
        color: "#3b4a6b",
        registeredRace: "Dubai World Cup",
        raceSlotsFilled: 8,
        raceTotalSlots: 10,
        horseSelected: "Thunderbolt",
        mainJockeyName: "Sarah Miller",
        mainJockeyStatus: "Accepted",
        backupJockeyName: "Mike Ross",
        backupJockeyStatus: "Pending"
    },
    { 
        id: "2", 
        name: "Sarah Miller", 
        role: "Jockey", 
        dateInvited: "Oct 23, 14:45", 
        status: "Pending",
        initials: "SM", 
        color: "#4a3b6b",
        registeredRace: "Ascot Gold Cup",
        raceSlotsFilled: 10,
        raceTotalSlots: 10,
    },
    { 
        id: "3", 
        name: "David Ross", 
        role: "Referee", 
        dateInvited: "Oct 23, 11:20", 
        status: "Accepted",
        initials: "DR", 
        color: "#3b6b4a" 
    },
];

const ACTIVE_RACES: ActiveRace[] = [
    { id: "1", status: "LIVE", name: "Dubai World Cup", detail: "Race 4 · 1200m" },
    { id: "2", status: "PRE-RACE", name: "Ascot Gold Cup", detail: "Starts in 15m" },
    { id: "3", status: "POST-RACE", name: "Kentucky Derby", detail: "Results Pending" },
];

const ROLE_COLORS: Record<ApprovalRole, string> = {
    "Horse Owner": "#2d3748",
    "Jockey": "#1a2a3a",
    "Referee": "#2a2a2a",
    "Trainer": "#1a3a2a",
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    sub,
    subColor = "text-gray-500",
    icon,
    highlight = false,
}: {
    label: string;
    value: string;
    sub: string;
    subColor?: string;
    icon: React.ReactNode;
    highlight?: boolean;
}) {
    return (
        <div
            className={`rounded-xl p-5 flex flex-col gap-3 border ${highlight
                ? "border-red-600/40 bg-[#1a0f0f]"
                : "border-white/[0.07] bg-[#141414]"
                }`}
        >
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase">
                    {label}
                </p>
                <span className="text-gray-600">{icon}</span>
            </div>
            <p
                className={`text-[28px] font-bold leading-none ${highlight ? "text-red-400" : "text-white"
                    }`}
                style={{ fontFamily: "'Playfair Display', serif" }}
            >
                {value}
            </p>
            <p className={`text-[12px] ${subColor}`}>{sub}</p>
        </div>
    );
}

function RaceStatusBadge({ status }: { status: RaceStatus }) {
    if (status === "LIVE") {
        return (
            <span className="flex items-center gap-1 text-[9px] font-bold tracking-widest text-red-400">
                <Radio size={8} className="text-red-400" />
                LIVE
            </span>
        );
    }
    if (status === "PRE-RACE") {
        return (
            <span className="text-[9px] font-bold tracking-widest text-amber-500">
                PRE-RACE
            </span>
        );
    }
    return (
        <span className="text-[9px] font-bold tracking-widest text-gray-500">
            POST-RACE
        </span>
    );
}

function RaceIcon({ status }: { status: RaceStatus }) {
    const cls = "text-gray-500 hover:text-gray-300 transition-colors cursor-pointer";
    if (status === "LIVE") return <Eye size={14} className={cls} />;
    if (status === "PRE-RACE") return <Settings size={14} className={cls} />;
    return <CheckSquare size={14} className={cls} />;
}

function StatusBadge({ status }: { status: InvitationStatus }) {
    const colors = {
        Pending: "text-amber-400 bg-amber-400/10 border border-amber-400/20",
        Accepted: "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20",
        Declined: "text-red-400 bg-red-400/10 border border-red-400/20"
    };
    return (
        <span className={`text-[12px] px-2.5 py-1.5 rounded font-medium ${colors[status]}`}>
            {status}
        </span>
    );
}

function JockeyStatusText({ status }: { status?: InvitationStatus }) {
    if (!status) return <span className="text-gray-600 font-normal italic">None</span>;
    const colors = {
        Pending: "text-amber-400",
        Accepted: "text-emerald-400",
        Declined: "text-red-400"
    };
    return <span className={`font-medium ${colors[status]}`}>{status}</span>;
}

// ── Dashboard Page ────────────────────────────────────────────────────────────

export default function SystemDashboardPage() {
    const [invites, setInvites] = useState(INVITEES);

    const handleRevoke = (id: string) =>
        setInvites((prev) => prev.filter((a) => a.id !== id));

    return (
        <div className="px-8 py-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {/* Header */}
            <div className="mb-7">
                <h1
                    className="text-[26px] font-bold text-white tracking-tight"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                >
                    System Dashboard
                </h1>
                <p className="text-[13px] text-gray-500 mt-0.5">
                    High-level overview and administrative controls.
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <StatCard
                    label="Total Users"
                    value="1.2k"
                    sub="+5% this week"
                    subColor="text-emerald-500"
                    icon={<Users size={16} />}
                />
                <StatCard
                    label="Active Tournaments"
                    value="4"
                    sub="Across 3 regions"
                    icon={<Trophy size={16} />}
                />
                <StatCard
                    label="Pending Horse Owners"
                    value="15"
                    sub="Requires follow-up"
                    subColor="text-gray-500"
                    icon={<ClipboardList size={16} />}
                    highlight
                />
                <StatCard
                    label="Revenue"
                    value="$45k"
                    sub="+12% vs last month"
                    subColor="text-emerald-500"
                    icon={<DollarSign size={16} />}
                />
            </div>

            {/* Bottom grid: Invitation Status + Active Races */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">

                {/* Invitation Status */}
                <div className="rounded-xl border border-white/[0.07] bg-[#141414] p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-[17px] font-semibold text-white">
                            Horse Owner Invitation
                        </h2>
                        <button className="text-[13px] text-gray-400 hover:text-white border border-white/[0.1] px-4 py-1.5 rounded-lg transition-colors">
                            View All
                        </button>
                    </div>

                    {/* Table header */}
                    <div className="grid grid-cols-[1.3fr_110px_100px_3.5fr_100px] gap-4 pb-3 border-b border-white/[0.07] mb-2">
                        {["Invitee", "Role", "Status", "Details", "Action"].map((h) => (
                            <p key={h} className="text-[12px] font-semibold tracking-widest text-gray-500 uppercase">
                                {h}
                            </p>
                        ))}
                    </div>

                    {/* Rows */}
                    <div className="flex flex-col divide-y divide-white/[0.05]">
                        {invites.map((a) => (
                            <div
                                key={a.id}
                                className="grid grid-cols-[1.3fr_110px_100px_3.5fr_100px] gap-4 items-center py-4"
                            >
                                {/* Invitee */}
                                <div className="flex items-center gap-3.5">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white/80 flex-shrink-0"
                                        style={{ background: a.color }}
                                    >
                                        {a.initials}
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[15px] text-white font-medium">
                                            {a.name}
                                        </span>
                                        <span className="text-[12px] text-gray-500">
                                            {a.dateInvited}
                                        </span>
                                    </div>
                                </div>

                                {/* Role badge */}
                                <div>
                                    <span
                                        className="text-[12px] text-gray-200 px-3 py-1.5 rounded"
                                        style={{ background: ROLE_COLORS[a.role] }}
                                    >
                                        {a.role}
                                    </span>
                                </div>

                                {/* Status */}
                                <div>
                                    <StatusBadge status={a.status} />
                                </div>

                                {/* Details */}
                                <div>
                                    <div className="flex flex-col gap-2.5 text-[13px] text-gray-400 leading-snug">
                                        {/* Registered Race Info (Shown for everyone if available) */}
                                        {a.registeredRace && (
                                            <div className="flex flex-col gap-1 border-b border-white/5 pb-2.5">
                                                <p className="flex items-center gap-2">
                                                    <span className="text-gray-500 font-medium">Race:</span> 
                                                    <span className="text-white font-medium">{a.registeredRace}</span>
                                                </p>
                                                {a.raceTotalSlots && (
                                                    <p className="text-[11.5px] flex items-center gap-2 mt-0.5">
                                                        <span className="text-gray-500">Horse Slots:</span>
                                                        <span className={`${a.raceSlotsFilled && a.raceSlotsFilled >= a.raceTotalSlots ? "text-red-400" : "text-emerald-400"} font-medium`}>
                                                            {a.raceSlotsFilled}/{a.raceTotalSlots} Filled
                                                        </span>
                                                        {a.raceSlotsFilled && a.raceSlotsFilled >= a.raceTotalSlots && (
                                                            <span className="text-red-500/80 italic ml-1">(Overflow - Prioritizing early acceptances)</span>
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Additional Role Specific Details */}
                                        {a.role === "Horse Owner" ? (
                                            <>
                                                <p className="flex items-center gap-2">
                                                    <span className="text-gray-500 font-medium">Selected Horse:</span> 
                                                    <span className="text-white font-medium bg-white/5 px-2 py-0.5 rounded border border-white/10">{a.horseSelected || "None"}</span>
                                                </p>
                                                <div className="flex flex-col gap-1.5 mt-1 border-l-2 border-white/5 pl-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-[100px] text-gray-500">Main Jockey:</span>
                                                        <span className="text-gray-200 w-[120px]">{a.mainJockeyName || "-"}</span>
                                                        <JockeyStatusText status={a.mainJockeyStatus} />
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-[100px] text-gray-500">Backup Jockey:</span>
                                                        <span className="text-gray-200 w-[120px]">{a.backupJockeyName || "-"}</span>
                                                        <JockeyStatusText status={a.backupJockeyStatus} />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            !a.registeredRace && <span className="text-[13px] text-gray-600 italic">No additional details</span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div>
                                    <button
                                        onClick={() => handleRevoke(a.id)}
                                        className="text-[13px] font-medium text-gray-400 hover:text-white border border-white/[0.1] hover:border-red-500/50 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Revoke
                                    </button>
                                </div>
                            </div>
                        ))}

                        {invites.length === 0 && (
                            <p className="text-[14px] text-gray-500 py-8 text-center font-medium">
                                No pending invitations.
                            </p>
                        )}
                    </div>
                </div>

                {/* Active Races */}
                <div className="rounded-xl border border-white/[0.07] bg-[#141414] p-5">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-[15px] font-semibold text-white">
                            Active Races
                        </h2>
                        <Radio size={14} className="text-red-500" />
                    </div>

                    <div className="flex flex-col gap-3">
                        {ACTIVE_RACES.map((race) => (
                            <div
                                key={race.id}
                                className="rounded-lg bg-[#1a1a1a] border border-white/[0.05] px-4 py-3 flex items-center justify-between"
                            >
                                <div>
                                    <RaceStatusBadge status={race.status} />
                                    <p className="text-[13px] font-semibold text-white mt-1 leading-snug">
                                        {race.name}
                                    </p>
                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                        {race.detail}
                                    </p>
                                </div>
                                <RaceIcon status={race.status} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}