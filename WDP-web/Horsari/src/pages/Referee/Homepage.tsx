import { useState } from "react";
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Flag,
    MapPin,
    XCircle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type InviteStatus = "pending" | "accepted" | "declined";
type RaceType = "Stakes" | "Allowance" | "Claiming" | "Maiden";
type GradeLevel = "G1" | "G2" | "G3" | "Listed" | "Open";

interface UpcomingRace {
    id: string;
    label: string;
    venue: string;
    trackLocation: string;
    date: Date;
    time: string;
    role: string;
    raceType: RaceType;
    gradeLevel: GradeLevel;
    status: "confirmed" | "tentative";
}

interface RecentInvite {
    id: string;
    raceLabel: string;
    venue: string;
    trackLocation: string;
    date: string;
    role: string;
    raceType: RaceType;
    gradeLevel: GradeLevel;
    sentAt: string;
    status: InviteStatus;
    isNew?: boolean;
    fee: number;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const TODAY = new Date(2024, 10, 2);

const UPCOMING: UpcomingRace[] = [
    { id: "R-1005", label: "The Pegasus Cup", venue: "Churchill Downs", trackLocation: "Louisville, KY, USA", date: new Date(2024, 10, 2), time: "3:30 PM ET", role: "Head Referee", raceType: "Stakes", gradeLevel: "G1", status: "confirmed" },
    { id: "R-1002", label: "Dubai World Sprint", venue: "Meydan Racecourse", trackLocation: "Dubai, UAE", date: new Date(2024, 10, 5), time: "7:00 PM GST", role: "Gate Referee", raceType: "Allowance", gradeLevel: "Open", status: "confirmed" },
    { id: "R-998", label: "Ascot Gold Cup", venue: "Ascot Racecourse", trackLocation: "Ascot, Berkshire, UK", date: new Date(2024, 10, 8), time: "2:15 PM GMT", role: "Track Referee", raceType: "Stakes", gradeLevel: "G1", status: "tentative" },
    { id: "R-1010", label: "Breeders' Cup Mile", venue: "Santa Anita Park", trackLocation: "Arcadia, CA, USA", date: new Date(2024, 10, 14), time: "5:00 PM PT", role: "Head Referee", raceType: "Stakes", gradeLevel: "G1", status: "confirmed" },
    { id: "R-1015", label: "Japan Cup", venue: "Tokyo Racecourse", trackLocation: "Fuchu, Tokyo, Japan", date: new Date(2024, 10, 24), time: "3:40 PM JST", role: "Gate Referee", raceType: "Stakes", gradeLevel: "G1", status: "tentative" },
    { id: "R-1018", label: "Hong Kong Mile", venue: "Sha Tin Racecourse", trackLocation: "Sha Tin, New Territories, HK", date: new Date(2024, 11, 8), time: "4:30 PM HKT", role: "Head Referee", raceType: "Claiming", gradeLevel: "G2", status: "confirmed" },
];

const INVITES: RecentInvite[] = [
    { id: "INV-3041", raceLabel: "The Pegasus Cup", venue: "Churchill Downs", trackLocation: "Louisville, KY, USA", date: "Nov 2, 2024", role: "Head Referee", raceType: "Stakes", gradeLevel: "G1", sentAt: "2h ago", status: "pending", isNew: true, fee: 850 },
    { id: "INV-3039", raceLabel: "Dubai World Sprint", venue: "Meydan Racecourse", trackLocation: "Dubai, UAE", date: "Nov 5, 2024", role: "Gate Referee", raceType: "Allowance", gradeLevel: "Open", sentAt: "5h ago", status: "pending", isNew: true, fee: 620 },
    { id: "INV-3035", raceLabel: "Ascot Gold Cup", venue: "Ascot Racecourse", trackLocation: "Ascot, Berkshire, UK", date: "Nov 8, 2024", role: "Track Referee", raceType: "Stakes", gradeLevel: "G1", sentAt: "Yesterday", status: "pending", fee: 700 },
    { id: "INV-3028", raceLabel: "Ascot Stakes", venue: "Ascot Racecourse", trackLocation: "Ascot, Berkshire, UK", date: "Oct 24, 2024", role: "Head Referee", raceType: "Claiming", gradeLevel: "G3", sentAt: "3d ago", status: "accepted", fee: 780 },
    { id: "INV-3021", raceLabel: "Kentucky Prep", venue: "Churchill Downs", trackLocation: "Louisville, KY, USA", date: "Oct 20, 2024", role: "Gate Referee", raceType: "Maiden", gradeLevel: "Open", sentAt: "5d ago", status: "declined", fee: 500 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstDayOfMonth(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const RACE_TYPE_DOT: Record<RaceType, string> = {
    Stakes: "bg-red-500",
    Allowance: "bg-blue-500",
    Claiming: "bg-orange-500",
    Maiden: "bg-purple-500",
};

const GRADE_STYLE: Record<GradeLevel, string> = {
    G1: "border-yellow-700/60 text-yellow-400 bg-yellow-500/10",
    G2: "border-gray-600/60 text-gray-400 bg-white/5",
    G3: "border-amber-700/60 text-amber-400 bg-amber-500/10",
    Listed: "border-sky-700/60 text-sky-400 bg-sky-500/10",
    Open: "border-white/10 text-gray-500 bg-transparent",
};

const TYPE_STYLE: Record<RaceType, string> = {
    Stakes: "border-red-800/60 text-red-400 bg-red-500/10",
    Allowance: "border-blue-800/60 text-blue-400 bg-blue-500/10",
    Claiming: "border-orange-800/60 text-orange-400 bg-orange-500/10",
    Maiden: "border-purple-800/60 text-purple-400 bg-purple-500/10",
};

function GradeBadge({ grade }: { grade: GradeLevel }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-black tracking-wide ${GRADE_STYLE[grade]}`}>
            {grade}
        </span>
    );
}

function RaceTypeBadge({ type }: { type: RaceType }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold ${TYPE_STYLE[type]}`}>
            {type}
        </span>
    );
}

function StatusPill({ status }: { status: InviteStatus }) {
    const cfg = {
        pending: "border-yellow-700/60 text-yellow-400 bg-yellow-500/10",
        accepted: "border-green-700/60 text-green-400 bg-green-500/10",
        declined: "border-white/10 text-gray-600 bg-transparent",
    }[status];
    const dot = {
        pending: "bg-yellow-500",
        accepted: "bg-green-500",
        declined: "bg-gray-600",
    }[status];
    const label = { pending: "Pending", accepted: "Accepted", declined: "Declined" }[status];
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${cfg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {label}
        </span>
    );
}

// ── Calendar ──────────────────────────────────────────────────────────────────

function Calendar({ races }: { races: UpcomingRace[] }) {
    const [viewMonth, setViewMonth] = useState(TODAY.getMonth());
    const [viewYear, setViewYear] = useState(TODAY.getFullYear());
    const [selected, setSelected] = useState<Date>(TODAY);

    const totalDays = daysInMonth(viewYear, viewMonth);
    const firstDay = firstDayOfMonth(viewYear, viewMonth);

    const raceDays = races.reduce<Record<string, UpcomingRace[]>>((acc, r) => {
        const key = `${r.date.getFullYear()}-${r.date.getMonth()}-${r.date.getDate()}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(r);
        return acc;
    }, {});

    const prevMonth = () =>
        viewMonth === 0 ? (setViewMonth(11), setViewYear((y) => y - 1)) : setViewMonth((m) => m - 1);
    const nextMonth = () =>
        viewMonth === 11 ? (setViewMonth(0), setViewYear((y) => y + 1)) : setViewMonth((m) => m + 1);

    const selectedRaces = races.filter((r) => isSameDay(r.date, selected));
    const nearest = races.filter((r) => r.date >= TODAY).sort((a, b) => a.date.getTime() - b.date.getTime())[0];

    return (
        <div className="flex flex-col gap-4">

            {/* Calendar Grid */}
            <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
                {/* Nav */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
                    <button
                        onClick={prevMonth}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/12 text-gray-500 hover:border-white/25 hover:text-gray-300 transition-all"
                    >
                        <ChevronLeft size={13} />
                    </button>
                    <span className="text-[14px] font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {MONTHS[viewMonth]} {viewYear}
                    </span>
                    <button
                        onClick={nextMonth}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/12 text-gray-500 hover:border-white/25 hover:text-gray-300 transition-all"
                    >
                        <ChevronRight size={13} />
                    </button>
                </div>

                {/* Day names */}
                <div className="grid grid-cols-7 px-3 pt-3 pb-1">
                    {DAYS.map((d) => (
                        <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-gray-600 pb-1">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 px-3 pb-3 gap-y-1">
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                    {Array.from({ length: totalDays }).map((_, i) => {
                        const day = i + 1;
                        const date = new Date(viewYear, viewMonth, day);
                        const key = `${viewYear}-${viewMonth}-${day}`;
                        const dayRaces = raceDays[key] ?? [];
                        const isToday = isSameDay(date, TODAY);
                        const isSel = isSameDay(date, selected);
                        const isNearest = nearest && isSameDay(date, nearest.date);
                        const isPast = date < TODAY && !isToday;

                        return (
                            <button
                                key={day}
                                onClick={() => setSelected(date)}
                                className={[
                                    "relative flex flex-col items-center justify-start pt-1.5 pb-1 rounded-xl transition-all duration-150 min-h-[46px]",
                                    isSel ? "bg-red-900" : "",
                                    !isSel && isNearest ? "ring-2 ring-red-600 ring-inset" : "",
                                    !isSel && isToday && !isNearest ? "bg-white/6" : "",
                                    !isSel && !isNearest && !isToday ? "hover:bg-white/4" : "",
                                    isPast ? "opacity-35" : "",
                                ].join(" ")}
                            >
                                <span className={[
                                    "text-[12px] font-semibold leading-none",
                                    isSel ? "text-white" : isToday ? "text-red-500" : "text-gray-400",
                                ].join(" ")}>
                                    {day}
                                </span>
                                {dayRaces.length > 0 && (
                                    <div className="flex items-center gap-0.5 mt-1">
                                        {dayRaces.slice(0, 3).map((r, ri) => (
                                            <span
                                                key={ri}
                                                className={`w-1.5 h-1.5 rounded-full ${isSel ? "bg-white/60" : RACE_TYPE_DOT[r.raceType]}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 px-5 py-3 border-t border-white/6 flex-wrap">
                    {(Object.entries(RACE_TYPE_DOT) as [RaceType, string][]).map(([type, dot]) => (
                        <span key={type} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                            <span className={`w-2 h-2 rounded-full ${dot}`} /> {type}
                        </span>
                    ))}
                </div>
            </div>

            {/* Selected Day Detail */}
            <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
                <div className="px-5 py-3 border-b border-white/8">
                    <p className="text-[10.5px] font-bold uppercase tracking-widest text-gray-600">
                        {`${DAYS[selected.getDay()]}, ${MONTHS[selected.getMonth()]} ${selected.getDate()}`}
                    </p>
                </div>
                {selectedRaces.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                        <p className="text-[13px] text-gray-600">No races scheduled.</p>
                    </div>
                ) : (
                    <div>
                        {selectedRaces.map((race, i) => (
                            <div
                                key={race.id}
                                className={`flex items-start gap-3 px-5 py-4 ${i !== selectedRaces.length - 1 ? "border-b border-white/5" : ""}`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${race.status === "confirmed" ? "bg-red-900/40" : "bg-white/5"}`}>
                                    <Flag size={14} className={race.status === "confirmed" ? "text-red-500" : "text-gray-600"} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[14px] font-bold text-white">{race.label}</span>
                                        <GradeBadge grade={race.gradeLevel} />
                                        <RaceTypeBadge type={race.raceType} />
                                        {race.status === "tentative" && (
                                            <span className="text-[10px] text-gray-600 border border-white/10 px-1.5 py-0.5 rounded">Tentative</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        <MapPin size={11} className="text-red-600 shrink-0" />
                                        <span className="text-[12px] text-gray-300 font-semibold">{race.venue}</span>
                                        <span className="text-[12px] text-gray-600">· {race.trackLocation}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                        <span className="flex items-center gap-1 text-[12px] text-gray-500">
                                            <Clock size={10} className="text-red-600" /> {race.time}
                                        </span>
                                        <span className="text-[11px] font-semibold text-gray-500 bg-white/6 px-2 py-0.5 rounded">
                                            {race.role}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Next Race Callout */}
            {nearest && (
                <div className="bg-red-900 rounded-xl px-5 py-4 border border-red-800/40">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-300 mb-1">Next Race</p>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p
                            className="text-[16px] font-bold text-white leading-tight"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            {nearest.label}
                        </p>
                        <span className="text-[10px] font-black tracking-wide border border-white/20 text-white/80 bg-white/10 px-2 py-0.5 rounded">
                            {nearest.gradeLevel}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <MapPin size={11} className="text-red-300 shrink-0" />
                        <span className="text-[12px] text-red-200 font-medium">{nearest.venue}</span>
                        <span className="text-[12px] text-red-400">· {nearest.trackLocation}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-3">
                        <Clock size={11} className="text-red-300" />
                        <span className="text-[12px] text-red-200">
                            {isSameDay(nearest.date, TODAY) ? "Today" : `${MONTHS[nearest.date.getMonth()]} ${nearest.date.getDate()}`}
                            {" · "}{nearest.time}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-white bg-white/15 px-2.5 py-1 rounded-lg">
                            {nearest.role}
                        </span>
                        <RaceTypeBadge type={nearest.raceType} />
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Invite Sidebar ─────────────────────────────────────────────────────────────

function InviteSidebar({ invites: initial }: { invites: RecentInvite[] }) {
    const [invites, setInvites] = useState(initial);

    const handleAccept = (id: string) =>
        setInvites((p) => p.map((i) => i.id === id ? { ...i, status: "accepted" as InviteStatus, isNew: false } : i));
    const handleDecline = (id: string) =>
        setInvites((p) => p.map((i) => i.id === id ? { ...i, status: "declined" as InviteStatus, isNew: false } : i));

    const pendingCount = invites.filter((i) => i.status === "pending").length;

    return (
        <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden h-fit">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                <div>
                    <h2
                        className="text-[14px] font-bold text-white"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        Recent Invitations
                    </h2>
                    <p className="text-[11px] text-gray-600 mt-0.5">Race assignments sent to you</p>
                </div>
                {pendingCount > 0 && (
                    <span className="w-6 h-6 rounded-full bg-red-700 text-white text-[11px] font-bold flex items-center justify-center">
                        {pendingCount}
                    </span>
                )}
            </div>

            {/* Invite list */}
            <div className="divide-y divide-white/5">
                {invites.map((inv) => {
                    const isPending = inv.status === "pending";
                    return (
                        <div
                            key={inv.id}
                            className={`px-5 py-4 transition-colors ${isPending ? "hover:bg-white/[0.02]" : "opacity-60"}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isPending ? "bg-red-900/40" : "bg-white/5"}`}>
                                    <Flag size={13} className={isPending ? "text-red-500" : "text-gray-600"} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    {/* Title row */}
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[13px] font-bold text-white truncate">{inv.raceLabel}</span>
                                        {inv.isNew && (
                                            <span className="text-[9px] font-bold uppercase tracking-widest bg-red-700 text-white px-1.5 py-0.5 rounded-full shrink-0">
                                                New
                                            </span>
                                        )}
                                    </div>

                                    {/* Badges + date */}
                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                        <GradeBadge grade={inv.gradeLevel} />
                                        <RaceTypeBadge type={inv.raceType} />
                                        <span className="text-[11px] text-gray-600">{inv.date}</span>
                                    </div>

                                    {/* Venue */}
                                    <div className="flex items-start gap-1.5 mt-1.5">
                                        <MapPin size={10} className="text-red-600 shrink-0 mt-0.5" />
                                        <div className="min-w-0">
                                            <span className="text-[11px] font-semibold text-gray-400">{inv.venue}</span>
                                            <span className="text-[11px] text-gray-600"> · {inv.trackLocation}</span>
                                        </div>
                                    </div>

                                    {/* Status + fee + sent */}
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-2">
                                            <StatusPill status={inv.status} />
                                            <span className="text-[11px] font-bold text-gray-400">${inv.fee.toLocaleString()}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-600">{inv.sentAt}</span>
                                    </div>

                                    {/* Actions */}
                                    {isPending && (
                                        <div className="flex items-center gap-2 mt-2.5">
                                            <button
                                                onClick={() => handleDecline(inv.id)}
                                                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-white/10 text-[11px] font-semibold text-gray-500 hover:border-white/20 hover:text-gray-300 transition-all"
                                            >
                                                <XCircle size={11} className="text-gray-600" /> Decline
                                            </button>
                                            <button
                                                onClick={() => handleAccept(inv.id)}
                                                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-700 text-white text-[11px] font-bold hover:bg-red-600 transition-all"
                                            >
                                                <CheckCircle2 size={11} /> Accept
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/8">
                <button className="w-full flex items-center justify-center gap-1.5 text-[12px] text-red-500 font-semibold hover:text-red-400 transition-colors">
                    View all invitations <ChevronRight size={13} />
                </button>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
    return (
        <div className="min-h-screen bg-[#0f0f0f]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-7">
                    <h1
                        className="text-[26px] font-bold text-white tracking-tight"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        Dashboard
                    </h1>
                    <p className="text-[13px] text-gray-500 mt-0.5">
                        Your upcoming race schedule and recent invitations.
                    </p>
                </div>

                {/* Main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
                    <Calendar races={UPCOMING} />
                    <InviteSidebar invites={INVITES} />
                </div>
            </div>
        </div>
    );
}