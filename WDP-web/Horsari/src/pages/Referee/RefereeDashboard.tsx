import { useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, Flag, MapPin, XCircle } from "lucide-react";

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
    race: string;
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

const TODAY = new Date(2024, 10, 2); // Nov 2, 2024

const UPCOMING: UpcomingRace[] = [
    { id: "R-1005", label: "The Pegasus Cup", venue: "Churchill Downs", trackLocation: "Louisville, KY, USA", date: new Date(2024, 10, 2), time: "3:30 PM ET", role: "Head Referee", raceType: "Stakes", gradeLevel: "G1", status: "confirmed" },
    { id: "R-1002", label: "Dubai World Sprint", venue: "Meydan Racecourse", trackLocation: "Dubai, UAE", date: new Date(2024, 10, 5), time: "7:00 PM GST", role: "Gate Referee", raceType: "Allowance", gradeLevel: "Open", status: "confirmed" },
    { id: "R-998", label: "Ascot Gold Cup", venue: "Ascot Racecourse", trackLocation: "Ascot, Berkshire, UK", date: new Date(2024, 10, 8), time: "2:15 PM GMT", role: "Track Referee", raceType: "Stakes", gradeLevel: "G1", status: "tentative" },
    { id: "R-1010", label: "Breeders' Cup Mile", venue: "Santa Anita Park", trackLocation: "Arcadia, CA, USA", date: new Date(2024, 10, 14), time: "5:00 PM PT", role: "Head Referee", raceType: "Stakes", gradeLevel: "G1", status: "confirmed" },
    { id: "R-1015", label: "Japan Cup", venue: "Tokyo Racecourse", trackLocation: "Fuchu, Tokyo, Japan", date: new Date(2024, 10, 24), time: "3:40 PM JST", role: "Gate Referee", raceType: "Stakes", gradeLevel: "G1", status: "tentative" },
    { id: "R-1018", label: "Hong Kong Mile", venue: "Sha Tin Racecourse", trackLocation: "Sha Tin, New Territories, HK", date: new Date(2024, 11, 8), time: "4:30 PM HKT", role: "Head Referee", raceType: "Claiming", gradeLevel: "G2", status: "confirmed" },
];

const INVITES: RecentInvite[] = [
    { id: "INV-3041", race: "R-1005", raceLabel: "The Pegasus Cup", venue: "Churchill Downs", trackLocation: "Louisville, KY, USA", date: "Nov 2, 2024", role: "Head Referee", raceType: "Stakes", gradeLevel: "G1", sentAt: "2h ago", status: "pending", isNew: true, fee: 850 },
    { id: "INV-3039", race: "R-1002", raceLabel: "Dubai World Sprint", venue: "Meydan Racecourse", trackLocation: "Dubai, UAE", date: "Nov 5, 2024", role: "Gate Referee", raceType: "Allowance", gradeLevel: "Open", sentAt: "5h ago", status: "pending", isNew: true, fee: 620 },
    { id: "INV-3035", race: "R-998", raceLabel: "Ascot Gold Cup", venue: "Ascot Racecourse", trackLocation: "Ascot, Berkshire, UK", date: "Nov 8, 2024", role: "Track Referee", raceType: "Stakes", gradeLevel: "G1", sentAt: "Yesterday", status: "pending", fee: 700 },
    { id: "INV-3028", race: "R-990", raceLabel: "Ascot Stakes", venue: "Ascot Racecourse", trackLocation: "Ascot, Berkshire, UK", date: "Oct 24, 2024", role: "Head Referee", raceType: "Claiming", gradeLevel: "G3", sentAt: "3d ago", status: "accepted", fee: 780 },
    { id: "INV-3021", race: "R-985", raceLabel: "Kentucky Prep", venue: "Churchill Downs", trackLocation: "Louisville, KY, USA", date: "Oct 20, 2024", role: "Gate Referee", raceType: "Maiden", gradeLevel: "Open", sentAt: "5d ago", status: "declined", fee: 500 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstDayOfMonth(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const RACE_TYPE_COLOR: Record<RaceType, string> = {
    Stakes: "bg-red-100 text-red-700 border-red-200",
    Allowance: "bg-blue-100 text-blue-700 border-blue-200",
    Claiming: "bg-orange-100 text-orange-700 border-orange-200",
    Maiden: "bg-purple-100 text-purple-700 border-purple-200",
};
const RACE_TYPE_DOT: Record<RaceType, string> = {
    Stakes: "bg-red-500", Allowance: "bg-blue-500", Claiming: "bg-orange-500", Maiden: "bg-purple-500",
};
const GRADE_COLOR: Record<GradeLevel, string> = {
    G1: "bg-yellow-50 border-yellow-400 text-yellow-700",
    G2: "bg-gray-100 border-gray-400 text-gray-600",
    G3: "bg-amber-50 border-amber-300 text-amber-700",
    Listed: "bg-sky-50 border-sky-300 text-sky-700",
    Open: "bg-gray-50 border-gray-200 text-gray-500",
};

function RaceTypeBadge({ type }: { type: RaceType }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold ${RACE_TYPE_COLOR[type]}`}>
            {type}
        </span>
    );
}
function GradeBadge({ grade }: { grade: GradeLevel }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-black tracking-wide ${GRADE_COLOR[grade]}`}>
            {grade}
        </span>
    );
}
function StatusPill({ status }: { status: InviteStatus }) {
    const map = { pending: "bg-amber-50 border-amber-300 text-amber-700", accepted: "bg-emerald-50 border-emerald-300 text-emerald-700", declined: "bg-gray-100 border-gray-300 text-gray-500" };
    const dot = { pending: "bg-amber-500", accepted: "bg-emerald-500", declined: "bg-gray-400" };
    const label = { pending: "Pending", accepted: "Accepted", declined: "Declined" };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${map[status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dot[status]}`} />{label[status]}
        </span>
    );
}

// ── Calendar ──────────────────────────────────────────────────────────────────

function Calendar({ races }: { races: UpcomingRace[] }) {
    const [viewMonth, setViewMonth] = useState(TODAY.getMonth());
    const [viewYear, setViewYear] = useState(TODAY.getFullYear());
    const [selected, setSelected] = useState<Date | null>(TODAY);

    const totalDays = daysInMonth(viewYear, viewMonth);
    const firstDay = firstDayOfMonth(viewYear, viewMonth);

    const raceDays = races.reduce<Record<string, UpcomingRace[]>>((acc, r) => {
        const key = `${r.date.getFullYear()}-${r.date.getMonth()}-${r.date.getDate()}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(r);
        return acc;
    }, {});

    const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
    const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

    const selectedRaces = selected ? races.filter(r => isSameDay(r.date, selected)) : [];
    const nearest = races.filter(r => r.date >= TODAY).sort((a, b) => a.date.getTime() - b.date.getTime())[0];

    return (
        <div className="flex flex-col gap-4">
            {/* Calendar grid */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                    <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all">
                        <ChevronLeft size={13} />
                    </button>
                    <span className="text-[14px] font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {MONTHS[viewMonth]} {viewYear}
                    </span>
                    <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all">
                        <ChevronRight size={13} />
                    </button>
                </div>
                <div className="grid grid-cols-7 px-3 pt-3 pb-1">
                    {DAYS.map(d => <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-gray-400 pb-1">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 px-3 pb-3 gap-y-1">
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                    {Array.from({ length: totalDays }).map((_, i) => {
                        const day = i + 1;
                        const date = new Date(viewYear, viewMonth, day);
                        const key = `${viewYear}-${viewMonth}-${day}`;
                        const dayRaces = raceDays[key] ?? [];
                        const isToday = isSameDay(date, TODAY);
                        const isSel = selected && isSameDay(date, selected);
                        const isNearest = nearest && isSameDay(date, nearest.date);
                        const isPast = date < TODAY && !isToday;
                        return (
                            <button
                                key={day}
                                onClick={() => setSelected(date)}
                                className={[
                                    "relative flex flex-col items-center justify-start pt-1.5 pb-1 rounded-xl transition-all duration-150 min-h-[46px]",
                                    isSel ? "bg-red-800 shadow-sm shadow-red-900/20" : "",
                                    !isSel && isNearest ? "bg-red-50 ring-2 ring-red-300" : "",
                                    !isSel && isToday && !isNearest ? "bg-gray-100" : "",
                                    !isSel && !isNearest && !isToday ? "hover:bg-gray-50" : "",
                                    isPast ? "opacity-40" : "",
                                ].join(" ")}
                            >
                                <span className={["text-[12px] font-semibold leading-none", isSel ? "text-white" : isToday ? "text-red-800" : "text-gray-700"].join(" ")}>
                                    {day}
                                </span>
                                {dayRaces.length > 0 && (
                                    <div className="flex items-center gap-0.5 mt-1">
                                        {dayRaces.slice(0, 3).map((r, ri) => (
                                            <span key={ri} className={["w-1.5 h-1.5 rounded-full", isSel ? "bg-white/70" : RACE_TYPE_DOT[r.raceType]].join(" ")} />
                                        ))}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
                <div className="flex items-center gap-4 px-5 py-3 border-t border-gray-100 flex-wrap">
                    {(Object.entries(RACE_TYPE_DOT) as [RaceType, string][]).map(([type, dot]) => (
                        <span key={type} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                            <span className={`w-2 h-2 rounded-full ${dot}`} /> {type}
                        </span>
                    ))}
                </div>
            </div>

            {/* Selected day detail */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                        {selected ? `${DAYS[selected.getDay()]}, ${MONTHS[selected.getMonth()]} ${selected.getDate()}` : "Select a date"}
                    </p>
                </div>
                {selectedRaces.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                        <p className="text-[13px] text-gray-400">No races scheduled.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {selectedRaces.map(race => (
                            <div key={race.id} className="px-5 py-4 flex items-start gap-3">
                                <div className={["w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", race.status === "confirmed" ? "bg-red-50" : "bg-gray-100"].join(" ")}>
                                    <Flag size={14} className={race.status === "confirmed" ? "text-red-800" : "text-gray-400"} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    {/* Title + grade + type */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[14px] font-bold text-gray-900">{race.label}</span>
                                        <GradeBadge grade={race.gradeLevel} />
                                        <RaceTypeBadge type={race.raceType} />
                                        {race.status === "tentative" && (
                                            <span className="text-[10px] text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded-md">Tentative</span>
                                        )}
                                    </div>
                                    {/* Venue + location */}
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        <MapPin size={11} className="text-red-700 shrink-0" />
                                        <span className="text-[12px] text-gray-700 font-semibold">{race.venue}</span>
                                        <span className="text-[12px] text-gray-400">· {race.trackLocation}</span>
                                    </div>
                                    {/* Time + role */}
                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                        <span className="flex items-center gap-1 text-[12px] text-gray-500">
                                            <Clock size={10} className="text-red-700" />{race.time}
                                        </span>
                                        <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">{race.role}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Next race callout */}
            {nearest && (
                <div className="bg-red-800 rounded-2xl px-5 py-4 shadow-md shadow-red-900/20">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-200 mb-1">Next Race</p>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-[16px] font-bold text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                            {nearest.label}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-black tracking-wide bg-white/10 border-white/30 text-white`}>
                            {nearest.gradeLevel}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-2">
                        <MapPin size={11} className="text-red-300 shrink-0" />
                        <span className="text-[12px] text-red-200 font-medium">{nearest.venue}</span>
                        <span className="text-[12px] text-red-300">· {nearest.trackLocation}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-3">
                        <Clock size={11} className="text-red-300" />
                        <span className="text-[12px] text-red-200">
                            {isSameDay(nearest.date, TODAY) ? "Today" : `${MONTHS[nearest.date.getMonth()]} ${nearest.date.getDate()}`} · {nearest.time}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-white bg-white/15 px-2.5 py-1 rounded-lg">{nearest.role}</span>
                        <RaceTypeBadge type={nearest.raceType} />
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Invite Sidebar ────────────────────────────────────────────────────────────

function InviteSidebar({ invites: initial }: { invites: RecentInvite[] }) {
    const [invites, setInvites] = useState(initial);
    const handleAccept = (id: string) => setInvites(p => p.map(i => i.id === id ? { ...i, status: "accepted" as InviteStatus, isNew: false } : i));
    const handleDecline = (id: string) => setInvites(p => p.map(i => i.id === id ? { ...i, status: "declined" as InviteStatus, isNew: false } : i));
    const pending = invites.filter(i => i.status === "pending").length;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-fit">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                    <h2 className="text-[14px] font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Recent Invitations</h2>
                    <p className="text-[11px] text-gray-400 mt-0.5">Race assignments sent to you</p>
                </div>
                {pending > 0 && (
                    <span className="w-6 h-6 rounded-full bg-red-800 text-white text-[11px] font-bold flex items-center justify-center">{pending}</span>
                )}
            </div>

            <div className="divide-y divide-gray-100">
                {invites.map(inv => {
                    const isPending = inv.status === "pending";
                    return (
                        <div key={inv.id} className={["px-5 py-4 transition-colors", isPending ? "hover:bg-gray-50/60" : "opacity-70"].join(" ")}>
                            <div className="flex items-start gap-3">
                                <div className={["w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", isPending ? "bg-red-50" : "bg-gray-100"].join(" ")}>
                                    <Flag size={13} className={isPending ? "text-red-800" : "text-gray-400"} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    {/* Title row */}
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[13px] font-bold text-gray-900 truncate">{inv.raceLabel}</span>
                                        {inv.isNew && <span className="text-[9px] font-bold uppercase tracking-widest bg-red-800 text-white px-1.5 py-0.5 rounded-full shrink-0">New</span>}
                                    </div>
                                    {/* Grade + type badges */}
                                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                        <GradeBadge grade={inv.gradeLevel} />
                                        <RaceTypeBadge type={inv.raceType} />
                                        <span className="text-[11px] text-gray-400">{inv.date}</span>
                                    </div>
                                    {/* Venue + track location */}
                                    <div className="flex items-start gap-1.5 mt-1.5">
                                        <MapPin size={10} className="text-red-700 shrink-0 mt-0.5" />
                                        <div className="min-w-0">
                                            <span className="text-[11px] font-semibold text-gray-700">{inv.venue}</span>
                                            <span className="text-[11px] text-gray-400"> · {inv.trackLocation}</span>
                                        </div>
                                    </div>
                                    {/* Status + fee */}
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-2">
                                            <StatusPill status={inv.status} />
                                            <span className="text-[11px] font-bold text-gray-700">${inv.fee.toLocaleString()}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400">{inv.sentAt}</span>
                                    </div>
                                    {/* Quick actions */}
                                    {isPending && (
                                        <div className="flex items-center gap-2 mt-2.5">
                                            <button onClick={() => handleDecline(inv.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all">
                                                <XCircle size={11} className="text-gray-400" /> Decline
                                            </button>
                                            <button onClick={() => handleAccept(inv.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-800 text-white text-[11px] font-bold hover:bg-red-900 transition-all">
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

            <div className="px-5 py-3 border-t border-gray-100">
                <button className="w-full flex items-center justify-center gap-1.5 text-[12px] text-red-800 font-semibold hover:underline">
                    View all invitations <ChevronRight size={13} />
                </button>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RefereeDashboardPage() {
    return (
        <div className="min-h-screen bg-[#fdf5f5]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="min-h-screen" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(220,38,38,0.06) 38px, rgba(220,38,38,0.06) 40px)" }}>
                <div className="max-w-5xl mx-auto px-5 py-8">
                    <div className="mb-7">
                        <h1 className="text-[26px] font-semibold text-gray-900 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Dashboard</h1>
                        <p className="text-[13px] text-gray-500 mt-0.5">Your upcoming race schedule and recent invitations.</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
                        <Calendar races={UPCOMING} />
                        <InviteSidebar invites={INVITES} />
                    </div>
                </div>
            </div>
        </div>
    );
}