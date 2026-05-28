import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertCircle, CheckCircle2, ChevronLeft, ChevronRight,
    Clock, Flag, Globe, MapPin, Trophy, Users, X,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type TournamentStatus = "live" | "upcoming" | "completed";
type AssignmentStatus = "assigned" | "partial" | "none";
type RaceStatus = "completed" | "live" | "upcoming";
type RaceType = "Stakes" | "Allowance" | "Claiming" | "Maiden" | "Claims";
type GradeLevel = "G1" | "G2" | "G3" | "Listed" | "Open";
type ModalTab = "overview" | "races";

interface Tournament {
    id: string;
    name: string;
    series: string;
    country: string;
    location: string;
    startDate: string;
    endDate: string;
    /** ISO yyyy-mm-dd for calendar logic */
    startISO: string;
    endISO: string;
    totalRaces: number;
    completedRaces: number;
    prizePool: string;
    status: TournamentStatus;
    assignment: AssignmentStatus;
    assignedRaces: number;
    grade: "G1" | "G2" | "G3" | "Listed";
    description: string;
    /** Tailwind color key used for the duration band */
    color: string;
}

interface RaceRound {
    id: string;
    round: number;
    label: string;
    venue: string;
    trackLocation: string;
    date: string;
    dateISO: string;
    time: string;
    raceType: RaceType;
    gradeLevel: GradeLevel;
    distance: string;
    track: string;
    entries: number;
    prizePool: string;
    status: RaceStatus;
    role: string | null;
    violations: number;
    tournamentId: string;
}

interface LeaderEntry {
    rank: number;
    horse: string;
    owner: string;
    points: number;
    wins: number;
    maxPoints: number;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const TOURNAMENTS: Tournament[] = [
    {
        id: "T-001", name: "Global Equine Championship",
        series: "2024 World Championship Series",
        country: "International", location: "6 Countries",
        startDate: "Oct 2, 2024", endDate: "Dec 14, 2024",
        startISO: "2024-10-02", endISO: "2024-12-14",
        totalRaces: 8, completedRaces: 5, prizePool: "$12.4M",
        status: "live", assignment: "assigned", assignedRaces: 6, grade: "G1",
        color: "red",
        description: "The premier international horse racing championship spanning six countries and eight iconic racetracks.",
    },
    {
        id: "T-002", name: "Breeders' Cup World Championships",
        series: "2024 Breeders' Cup",
        country: "USA", location: "Santa Anita Park, CA",
        startDate: "Nov 1, 2024", endDate: "Nov 2, 2024",
        startISO: "2024-11-01", endISO: "2024-11-02",
        totalRaces: 14, completedRaces: 7, prizePool: "$31M",
        status: "live", assignment: "partial", assignedRaces: 3, grade: "G1",
        color: "blue",
        description: "North America's richest racing event, held over two days at Santa Anita Park.",
    },
    {
        id: "T-003", name: "Dubai World Cup Carnival",
        series: "2024–25 UAE Season",
        country: "UAE", location: "Meydan Racecourse, Dubai",
        startDate: "Jan 9, 2025", endDate: "Mar 29, 2025",
        startISO: "2025-01-09", endISO: "2025-03-29",
        totalRaces: 12, completedRaces: 0, prizePool: "$18M",
        status: "upcoming", assignment: "assigned", assignedRaces: 5, grade: "G1",
        color: "amber",
        description: "A series of world-class race meetings building towards the Dubai World Cup.",
    },
    {
        id: "T-004", name: "Ascot Winter Series",
        series: "2024 UK Winter Circuit",
        country: "UK", location: "Ascot Racecourse, Berkshire",
        startDate: "Nov 20, 2024", endDate: "Dec 21, 2024",
        startISO: "2024-11-20", endISO: "2024-12-21",
        totalRaces: 6, completedRaces: 0, prizePool: "$4.2M",
        status: "upcoming", assignment: "partial", assignedRaces: 2, grade: "G2",
        color: "purple",
        description: "A prestigious winter series at the iconic Ascot Racecourse.",
    },
    {
        id: "T-005", name: "Japan Autumn Championship",
        series: "2024 JRA Season",
        country: "Japan", location: "Tokyo Racecourse, Fuchu",
        startDate: "Oct 6, 2024", endDate: "Nov 24, 2024",
        startISO: "2024-10-06", endISO: "2024-11-24",
        totalRaces: 5, completedRaces: 5, prizePool: "$8.7M",
        status: "completed", assignment: "assigned", assignedRaces: 4, grade: "G1",
        color: "green",
        description: "Japan's premier autumn racing series culminating at Tokyo Racecourse.",
    },
    {
        id: "T-006", name: "Hong Kong International Races",
        series: "2024 HKJC International",
        country: "Hong Kong", location: "Sha Tin Racecourse",
        startDate: "Dec 8, 2024", endDate: "Dec 8, 2024",
        startISO: "2024-12-08", endISO: "2024-12-08",
        totalRaces: 4, completedRaces: 0, prizePool: "$22M",
        status: "upcoming", assignment: "none", assignedRaces: 0, grade: "G1",
        color: "sky",
        description: "One of the richest race days on the global calendar.",
    },
    {
        id: "T-007", name: "Prix de l'Arc de Triomphe Weekend",
        series: "2024 ParisLongchamp",
        country: "France", location: "Longchamp, Paris",
        startDate: "Oct 5, 2024", endDate: "Oct 6, 2024",
        startISO: "2024-10-05", endISO: "2024-10-06",
        totalRaces: 7, completedRaces: 7, prizePool: "$9.3M",
        status: "completed", assignment: "none", assignedRaces: 0, grade: "G1",
        color: "orange",
        description: "Europe's most prestigious flat race meeting at the historic Longchamp racecourse.",
    },
];

// Color configs per tournament — bg band + dot colors
const T_COLOR: Record<string, { band: string; dot: string; label: string; border: string }> = {
    red: { band: "bg-red-500/15", dot: "bg-red-500", label: "text-red-400", border: "border-red-700/40" },
    blue: { band: "bg-blue-500/15", dot: "bg-blue-500", label: "text-blue-400", border: "border-blue-700/40" },
    amber: { band: "bg-amber-500/15", dot: "bg-amber-500", label: "text-amber-400", border: "border-amber-700/40" },
    purple: { band: "bg-purple-500/15", dot: "bg-purple-500", label: "text-purple-400", border: "border-purple-700/40" },
    green: { band: "bg-green-500/15", dot: "bg-green-500", label: "text-green-400", border: "border-green-700/40" },
    sky: { band: "bg-sky-500/15", dot: "bg-sky-500", label: "text-sky-400", border: "border-sky-700/40" },
    orange: { band: "bg-orange-500/15", dot: "bg-orange-500", label: "text-orange-400", border: "border-orange-700/40" },
};

const ALL_RACES: RaceRound[] = [
    { id: "R-1001", round: 1, label: "Kentucky Classic", venue: "Churchill Downs", trackLocation: "Louisville, KY, USA", date: "Oct 2, 2024", dateISO: "2024-10-02", time: "3:30 PM ET", raceType: "Stakes", gradeLevel: "G1", distance: "1 1/4 Miles", track: "Dirt, Fast", entries: 14, prizePool: "$1.5M", status: "completed", role: "Head Referee", violations: 1, tournamentId: "T-001" },
    { id: "R-1002", round: 2, label: "Dubai Desert Crown", venue: "Meydan Racecourse", trackLocation: "Dubai, UAE", date: "Oct 14, 2024", dateISO: "2024-10-14", time: "7:00 PM GST", raceType: "Stakes", gradeLevel: "G1", distance: "1 1/8 Miles", track: "Turf, Good", entries: 12, prizePool: "$2.0M", status: "completed", role: "Gate Referee", violations: 0, tournamentId: "T-001" },
    { id: "R-1003", round: 3, label: "Ascot Gold Cup", venue: "Ascot Racecourse", trackLocation: "Ascot, Berkshire, UK", date: "Oct 24, 2024", dateISO: "2024-10-24", time: "2:15 PM GMT", raceType: "Stakes", gradeLevel: "G1", distance: "2 Miles 4F", track: "Turf, Soft", entries: 12, prizePool: "$1.8M", status: "completed", role: "Track Referee", violations: 1, tournamentId: "T-001" },
    { id: "R-1004", round: 4, label: "Japan Autumn Cup", venue: "Tokyo Racecourse", trackLocation: "Fuchu, Tokyo, Japan", date: "Nov 1, 2024", dateISO: "2024-11-01", time: "3:40 PM JST", raceType: "Stakes", gradeLevel: "G2", distance: "1 1/4 Miles", track: "Turf, Good", entries: 10, prizePool: "$1.2M", status: "completed", role: "Head Referee", violations: 0, tournamentId: "T-001" },
    { id: "R-1005", round: 5, label: "The Pegasus Cup", venue: "Churchill Downs", trackLocation: "Louisville, KY, USA", date: "Nov 2, 2024", dateISO: "2024-11-02", time: "3:30 PM ET", raceType: "Stakes", gradeLevel: "G1", distance: "1 1/8 Miles", track: "Dirt, Fast", entries: 14, prizePool: "$2.2M", status: "live", role: "Head Referee", violations: 0, tournamentId: "T-001" },
    { id: "R-1006", round: 6, label: "Breeders' Cup Mile", venue: "Santa Anita Park", trackLocation: "Arcadia, CA, USA", date: "Nov 14, 2024", dateISO: "2024-11-14", time: "5:00 PM PT", raceType: "Stakes", gradeLevel: "G1", distance: "1 Mile", track: "Turf, Firm", entries: 13, prizePool: "$2.0M", status: "upcoming", role: "Gate Referee", violations: 0, tournamentId: "T-001" },
    { id: "R-1007", round: 7, label: "Hong Kong Mile", venue: "Sha Tin Racecourse", trackLocation: "Sha Tin, New Territories, HK", date: "Dec 8, 2024", dateISO: "2024-12-08", time: "4:30 PM HKT", raceType: "Claims", gradeLevel: "G2", distance: "1 Mile", track: "Turf, Good", entries: 11, prizePool: "$0.9M", status: "upcoming", role: "Head Referee", violations: 0, tournamentId: "T-001" },
    { id: "R-1008", round: 8, label: "World Championship Final", venue: "Longchamp", trackLocation: "Paris, France", date: "Dec 14, 2024", dateISO: "2024-12-14", time: "3:00 PM CET", raceType: "Stakes", gradeLevel: "G1", distance: "1 1/2 Miles", track: "Turf, Good", entries: 16, prizePool: "$3.3M", status: "upcoming", role: null, violations: 0, tournamentId: "T-001" },
    // T-002 Breeders Cup
    { id: "R-2001", round: 1, label: "BC Juvenile", venue: "Santa Anita Park", trackLocation: "Arcadia, CA, USA", date: "Nov 1, 2024", dateISO: "2024-11-01", time: "1:00 PM PT", raceType: "Stakes", gradeLevel: "G1", distance: "1 Mile", track: "Dirt, Fast", entries: 12, prizePool: "$2.0M", status: "completed", role: null, violations: 0, tournamentId: "T-002" },
    { id: "R-2002", round: 2, label: "BC Classic", venue: "Santa Anita Park", trackLocation: "Arcadia, CA, USA", date: "Nov 2, 2024", dateISO: "2024-11-02", time: "5:30 PM PT", raceType: "Stakes", gradeLevel: "G1", distance: "1 1/4 Miles", track: "Dirt, Fast", entries: 14, prizePool: "$6.0M", status: "live", role: "Head Referee", violations: 0, tournamentId: "T-002" },
    // T-005 Japan
    { id: "R-5001", round: 1, label: "Autumn Tenno Sho", venue: "Tokyo Racecourse", trackLocation: "Fuchu, Tokyo, Japan", date: "Oct 6, 2024", dateISO: "2024-10-06", time: "3:40 PM JST", raceType: "Stakes", gradeLevel: "G1", distance: "2000m", track: "Turf, Good", entries: 18, prizePool: "$2.1M", status: "completed", role: "Head Referee", violations: 0, tournamentId: "T-005" },
    { id: "R-5002", round: 2, label: "Kikka Sho", venue: "Kyoto Racecourse", trackLocation: "Kyoto, Japan", date: "Oct 20, 2024", dateISO: "2024-10-20", time: "3:40 PM JST", raceType: "Stakes", gradeLevel: "G1", distance: "3000m", track: "Turf, Good", entries: 18, prizePool: "$1.5M", status: "completed", role: "Gate Referee", violations: 1, tournamentId: "T-005" },
    { id: "R-5003", round: 3, label: "Japan Cup", venue: "Tokyo Racecourse", trackLocation: "Fuchu, Tokyo, Japan", date: "Nov 24, 2024", dateISO: "2024-11-24", time: "3:40 PM JST", raceType: "Stakes", gradeLevel: "G1", distance: "2400m", track: "Turf, Firm", entries: 18, prizePool: "$3.8M", status: "completed", role: "Head Referee", violations: 0, tournamentId: "T-005" },
    // T-007 Arc Weekend
    { id: "R-7001", round: 1, label: "Prix de l'Arc", venue: "Longchamp", trackLocation: "Paris, France", date: "Oct 6, 2024", dateISO: "2024-10-06", time: "4:05 PM CET", raceType: "Stakes", gradeLevel: "G1", distance: "2400m", track: "Turf, Soft", entries: 20, prizePool: "$5.5M", status: "completed", role: null, violations: 0, tournamentId: "T-007" },
];

const RACES_BY_TOURNAMENT: Record<string, RaceRound[]> = ALL_RACES.reduce((acc, r) => {
    if (!acc[r.tournamentId]) acc[r.tournamentId] = [];
    acc[r.tournamentId].push(r);
    return acc;
}, {} as Record<string, RaceRound[]>);

const LEADERBOARD: LeaderEntry[] = [
    { rank: 1, horse: "Thunderstrike", owner: "Blackwood Estate", points: 142, wins: 3, maxPoints: 142 },
    { rank: 2, horse: "Crimson Tide", owner: "Silver Ridge Farm", points: 116, wins: 2, maxPoints: 142 },
    { rank: 3, horse: "Silver Bullet", owner: "Al-Hassan Racing", points: 95, wins: 2, maxPoints: 142 },
    { rank: 4, horse: "Night Fury", owner: "Rostova Stables", points: 71, wins: 1, maxPoints: 142 },
    { rank: 5, horse: "Golden Horizon", owner: "Vance Thoroughbreds", points: 51, wins: 0, maxPoints: 142 },
];

// ── Calendar helpers ──────────────────────────────────────────────────────────

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstDayOfMonth(y: number, m: number) { return new Date(y, m, 1).getDay(); }

function toISO(y: number, m: number, d: number) {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Returns tournaments whose duration band covers this ISO date */
function tournamentsOnDay(iso: string): Tournament[] {
    return TOURNAMENTS.filter(t => iso >= t.startISO && iso <= t.endISO);
}

/** Returns races on this exact ISO date */
function racesOnDay(iso: string): RaceRound[] {
    return ALL_RACES.filter(r => r.dateISO === iso);
}

// ── Badge helpers ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TournamentStatus }) {
    const cfg = {
        live: "border-red-800/60 text-red-400 bg-red-500/10",
        upcoming: "border-yellow-700/60 text-yellow-400 bg-yellow-500/10",
        completed: "border-white/10 text-gray-600 bg-transparent",
    }[status];
    const dot = { live: "bg-red-500 animate-pulse", upcoming: "bg-yellow-500", completed: "bg-gray-600" }[status];
    const label = { live: "Live", upcoming: "Upcoming", completed: "Completed" }[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${cfg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {label}
        </span>
    );
}

function GradeBadge({ grade }: { grade: string }) {
    const cfg: Record<string, string> = {
        G1: "border-yellow-700/60 text-yellow-400 bg-yellow-500/10",
        G2: "border-gray-600/60 text-gray-400 bg-white/5",
        G3: "border-amber-700/60 text-amber-400 bg-amber-500/10",
        Listed: "border-sky-700/60 text-sky-400 bg-sky-500/10",
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-black tracking-wide ${cfg[grade] ?? ""}`}>
            {grade}
        </span>
    );
}

function RaceTypeBadge({ type }: { type: string }) {
    const cfg: Record<string, string> = {
        Stakes: "border-red-800/60 text-red-400 bg-red-500/10",
        Allowance: "border-blue-800/60 text-blue-400 bg-blue-500/10",
        Claiming: "border-orange-800/60 text-orange-400 bg-orange-500/10",
        Claims: "border-orange-800/60 text-orange-400 bg-orange-500/10",
        Maiden: "border-purple-800/60 text-purple-400 bg-purple-500/10",
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold ${cfg[type] ?? "border-white/10 text-gray-500"}`}>
            {type}
        </span>
    );
}

function AssignmentTag({ assignment, assignedRaces, totalRaces }: {
    assignment: AssignmentStatus; assignedRaces: number; totalRaces: number;
}) {
    if (assignment === "none") return <span className="text-[11px] text-gray-600 font-medium">Not assigned</span>;
    const cfg = assignment === "assigned"
        ? "border-green-700/60 text-green-400 bg-green-500/10"
        : "border-blue-700/60 text-blue-400 bg-blue-500/10";
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${cfg}`}>
            <Flag size={9} />
            {assignment === "assigned" ? "Assigned" : "Partial"} · {assignedRaces}/{totalRaces} races
        </span>
    );
}

// ── Day popup (shown below calendar when a date is clicked) ───────────────────

function DayPopup({ iso, onSelectTournament }: {
    iso: string;
    onSelectTournament: (t: Tournament) => void;
}) {
    const tournaments = tournamentsOnDay(iso);
    const races = racesOnDay(iso);
    const [y, m, d] = iso.split("-").map(Number);
    const label = `${DAY_NAMES[new Date(y, m - 1, d).getDay()]}, ${MONTH_NAMES[m - 1]} ${d}`;

    if (tournaments.length === 0 && races.length === 0) return null;

    return (
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/8">
                <p className="text-[10.5px] font-bold uppercase tracking-widest text-gray-600">{label}</p>
            </div>

            {/* Active tournaments this day */}
            {tournaments.length > 0 && (
                <div className="px-4 py-3 flex flex-col gap-2 border-b border-white/6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">Tournaments Active</p>
                    {tournaments.map(t => {
                        const c = T_COLOR[t.color];
                        return (
                            <button
                                key={t.id}
                                onClick={() => onSelectTournament(t)}
                                className="flex items-center gap-3 text-left hover:bg-white/[0.03] rounded-lg px-2 py-2 transition-colors"
                            >
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.dot}`} />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-[12.5px] font-bold truncate ${c.label}`}>{t.name}</p>
                                    <p className="text-[10.5px] text-gray-600">{t.series}</p>
                                </div>
                                <StatusBadge status={t.status} />
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Races on this day */}
            {races.length > 0 && (
                <div className="px-4 py-3 flex flex-col gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">Races</p>
                    {races.map(r => {
                        const t = TOURNAMENTS.find(t => t.id === r.tournamentId)!;
                        const c = T_COLOR[t.color];
                        const isLive = r.status === "live";
                        return (
                            <button
                                key={r.id}
                                onClick={() => onSelectTournament(t)}
                                className="flex items-center gap-3 text-left hover:bg-white/[0.03] rounded-lg px-2 py-2 transition-colors"
                            >
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${isLive ? "bg-red-700 text-white" : "bg-white/8 text-gray-500"}`}>
                                    {r.round}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <p className="text-[12.5px] font-bold text-white truncate">{r.label}</p>
                                        {isLive && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-red-700/60 text-red-400 bg-red-500/10 text-[9px] font-bold"><span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />Live</span>}
                                    </div>
                                    <p className="text-[11px] text-gray-600">{r.venue} · {r.time}</p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <GradeBadge grade={r.gradeLevel} />
                                    {r.role && <span className="text-[10px] font-semibold text-gray-500 bg-white/5 px-2 py-0.5 rounded-md">{r.role}</span>}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── Calendar ──────────────────────────────────────────────────────────────────

const TODAY_ISO = "2024-11-02";
const TODAY = new Date(2024, 10, 2);

function TournamentCalendar({ onSelectTournament }: { onSelectTournament: (t: Tournament) => void }) {
    const [viewMonth, setViewMonth] = useState(TODAY.getMonth());
    const [viewYear, setViewYear] = useState(TODAY.getFullYear());
    const [selectedISO, setSelectedISO] = useState<string | null>(TODAY_ISO);

    const totalDays = daysInMonth(viewYear, viewMonth);
    const firstDay = firstDayOfMonth(viewYear, viewMonth);

    const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
    const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

    return (
        <div className={[`grid gap-4 items-start`, selectedISO ? "grid-cols-1 lg:grid-cols-[1fr_300px]" : "grid-cols-1"].join(" ")}>
            <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">

                {/* Nav */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
                    <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/12 text-gray-500 hover:border-white/25 hover:text-gray-300 transition-all">
                        <ChevronLeft size={13} />
                    </button>
                    <span className="text-[14px] font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {MONTH_NAMES[viewMonth]} {viewYear}
                    </span>
                    <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/12 text-gray-500 hover:border-white/25 hover:text-gray-300 transition-all">
                        <ChevronRight size={13} />
                    </button>
                </div>

                {/* Day name headers */}
                <div className="grid grid-cols-7 px-3 pt-3 pb-1">
                    {DAY_NAMES.map(d => (
                        <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-gray-600 pb-1">{d}</div>
                    ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 pb-3">
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}

                    {Array.from({ length: totalDays }).map((_, i) => {
                        const day = i + 1;
                        const iso = toISO(viewYear, viewMonth, day);
                        const tourn = tournamentsOnDay(iso);
                        const races = racesOnDay(iso);
                        const isToday = iso === TODAY_ISO;
                        const isSel = iso === selectedISO;
                        const isPast = iso < TODAY_ISO;
                        const hasRace = races.length > 0;

                        // Stack up to 2 tournament bands (most important first)
                        const sorted = [
                            ...tourn.filter(t => t.assignment !== "none"),
                            ...tourn.filter(t => t.assignment === "none"),
                        ];
                        const bands = sorted.slice(0, 2);

                        return (
                            <div
                                key={day}
                                onClick={() => setSelectedISO(iso)}
                                className={[
                                    "relative flex flex-col items-center justify-start pt-1.5 pb-1.5 cursor-pointer transition-all duration-150 min-h-[52px] mx-0.5 my-0.5 rounded-xl",
                                    isSel ? "bg-red-900 shadow-sm" :
                                        isToday ? "bg-white/[0.05]" : "hover:bg-white/[0.04]",
                                    isPast ? "opacity-40" : "",
                                ].join(" ")}
                            >
                                {/* Tournament duration bands — rendered as thin strips at the bottom of the cell */}
                                {!isSel && bands.length > 0 && (
                                    <div className="absolute bottom-1.5 left-1 right-1 flex flex-col gap-0.5">
                                        {bands.map((t, bi) => {
                                            const c = T_COLOR[t.color];
                                            const isStart = iso === t.startISO;
                                            const isEnd = iso === t.endISO;
                                            return (
                                                <div
                                                    key={t.id}
                                                    className={[
                                                        "h-1 opacity-80",
                                                        c.dot,
                                                        isStart && isEnd ? "rounded-full" :
                                                            isStart ? "rounded-l-full" :
                                                                isEnd ? "rounded-r-full" : "",
                                                    ].join(" ")}
                                                />
                                            );
                                        })}
                                    </div>
                                )}

                                <span className={[
                                    "text-[12px] font-semibold leading-none z-10",
                                    isSel ? "text-white" :
                                        isToday ? "text-red-400 font-bold" :
                                            bands.length > 0 ? "text-gray-200" : "text-gray-500",
                                ].join(" ")}>
                                    {day}
                                </span>

                                {/* Race dots */}
                                {hasRace && (
                                    <div className="flex items-center gap-0.5 mt-1 z-10">
                                        {races.slice(0, 3).map((r, ri) => {
                                            const tc = T_COLOR[TOURNAMENTS.find(t => t.id === r.tournamentId)!.color];
                                            return (
                                                <span
                                                    key={ri}
                                                    className={`w-1.5 h-1.5 rounded-full ${isSel ? "bg-white/70" : tc.dot} ${r.status === "live" ? "ring-1 ring-white/40" : ""}`}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="px-4 py-3 border-t border-white/6 flex flex-wrap gap-x-4 gap-y-1.5">
                    {TOURNAMENTS.filter(t => {
                        // Only show tournaments visible in this month
                        const mStart = toISO(viewYear, viewMonth, 1);
                        const mEnd = toISO(viewYear, viewMonth, daysInMonth(viewYear, viewMonth));
                        return t.startISO <= mEnd && t.endISO >= mStart;
                    }).map(t => {
                        const c = T_COLOR[t.color];
                        return (
                            <button
                                key={t.id}
                                onClick={() => onSelectTournament(t)}
                                className="flex items-center gap-1.5 text-[11px] hover:opacity-80 transition-opacity"
                            >
                                <span className={`w-2.5 h-2.5 rounded-sm ${c.band.replace("/15", "/60")} border ${c.border}`} />
                                <span className={c.label}>{t.name}</span>
                                {t.assignment !== "none" && <Flag size={9} className="text-gray-600" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Day detail panel — right column */}
            {selectedISO && (
                <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
                    <DayPopup iso={selectedISO} onSelectTournament={onSelectTournament} />
                </div>
            )}
        </div>
    );
}

// ── Modal — Overview Tab ──────────────────────────────────────────────────────

function OverviewTab({ t }: { t: Tournament }) {
    const races = RACES_BY_TOURNAMENT[t.id] ?? [];
    const completed = races.filter(r => r.status === "completed").length;
    const violations = races.reduce((a, r) => a + r.violations, 0);
    const liveRace = races.find(r => r.status === "live");
    const c = T_COLOR[t.color];

    return (
        <div className="flex flex-col gap-5">
            <div className="bg-white/[0.03] rounded-xl border border-white/8 px-5 py-4">
                <p className="text-[12.5px] text-gray-400 leading-relaxed mb-4">{t.description}</p>
                <div className="flex items-center gap-x-5 gap-y-1.5 flex-wrap text-[12px] text-gray-500">
                    <span className="flex items-center gap-1.5"><MapPin size={11} className="text-gray-600" />{t.location}</span>
                    <span className="flex items-center gap-1.5"><Globe size={11} className="text-gray-600" />{t.country}</span>
                    <span>{t.startDate} – {t.endDate}</span>
                </div>
                <div className="mt-4">
                    <div className="flex gap-1">
                        {races.map(r => (
                            <div key={r.id} className={`flex-1 h-1.5 rounded-full ${r.status === "completed" ? "bg-gray-600" : r.status === "live" ? c.dot : "bg-white/8"}`} />
                        ))}
                    </div>
                    <div className="flex justify-between mt-1.5">
                        <span className="text-[10px] text-gray-600">Round 1</span>
                        {liveRace && <span className={`text-[10px] font-semibold ${c.label}`}>Round {liveRace.round} · Live</span>}
                        <span className="text-[10px] text-gray-600">Round {t.totalRaces}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {[
                    { label: "Assigned Races", value: `${t.assignedRaces}/${t.totalRaces}`, sub: "of total", subColor: c.label },
                    { label: "Completed", value: `${completed}`, sub: "races done", subColor: "text-gray-500" },
                    { label: "Violations Filed", value: `${violations}`, sub: "this series", subColor: violations > 0 ? "text-yellow-400" : "text-gray-500" },
                    { label: "Total Earnings", value: "$4,310", sub: "series total", subColor: "text-green-400" },
                ].map(card => (
                    <div key={card.label} className="bg-white/[0.03] rounded-xl border border-white/8 px-4 py-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">{card.label}</p>
                        <p className="text-[26px] font-bold text-white leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>{card.value}</p>
                        <p className={`text-[11px] mt-1.5 font-medium ${card.subColor}`}>{card.sub}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white/[0.03] rounded-xl border border-white/8 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
                    <h3 className="text-[13.5px] font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Leaderboard</h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">By Owner</span>
                </div>
                {LEADERBOARD.map(e => {
                    const pct = Math.round((e.points / e.maxPoints) * 100);
                    const rankColor = e.rank === 1 ? c.label : e.rank === 2 ? "text-gray-400" : "text-gray-600";
                    const barColor = e.rank === 1 ? c.dot : e.rank === 2 ? "bg-gray-500" : "bg-gray-700";
                    return (
                        <div key={e.rank} className="flex items-center gap-3 px-5 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                            <span className={`text-[16px] font-bold w-5 text-center shrink-0 ${rankColor}`} style={{ fontFamily: "'Playfair Display', serif" }}>{e.rank}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-white truncate">{e.horse}</p>
                                <p className="text-[11px] text-gray-500 mt-0.5">Owner: {e.owner}</p>
                                <div className="mt-1.5 h-1 bg-white/6 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-[13px] font-bold text-white">{e.points}</p>
                                <p className="text-[10px] text-gray-600 mt-0.5">{e.wins}W</p>
                            </div>
                        </div>
                    );
                })}
            </div>


        </div>
    );
}

// ── Modal — Races Tab ─────────────────────────────────────────────────────────

function RaceDetailPanel({ race, onClose }: { race: RaceRound; onClose: () => void }) {
    return (
        <div className="bg-[#141414] rounded-xl border border-white/10 overflow-hidden mt-1">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{race.label}</span>
                    <GradeBadge grade={race.gradeLevel} />
                    <RaceTypeBadge type={race.raceType} />
                </div>
                <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/8 transition-all">
                    <X size={13} />
                </button>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 gap-2">
                {[
                    { label: "Distance", value: race.distance },
                    { label: "Track Surface", value: race.track },
                    { label: "Entries", value: `${race.entries} horses` },
                    { label: "Prize Pool", value: race.prizePool },
                    { label: "Venue", value: race.venue },
                    { label: "Location", value: race.trackLocation },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-white/[0.03] rounded-lg border border-white/6 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-0.5">{label}</p>
                        <p className="text-[12px] font-semibold text-gray-200">{value}</p>
                    </div>
                ))}
            </div>
            {race.role && (
                <div className="px-4 pb-3 flex items-center justify-between">
                    <span className="text-[11.5px] font-semibold text-gray-500 bg-white/5 px-3 py-1.5 rounded-lg">{race.role}</span>
                    {race.status === "completed" && race.violations > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-red-400 font-semibold"><AlertCircle size={11} />{race.violations} violation{race.violations > 1 ? "s" : ""}</span>
                    )}
                    {race.status === "completed" && race.violations === 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-green-500 font-semibold"><CheckCircle2 size={11} />Clean</span>
                    )}
                </div>
            )}
        </div>
    );
}

function RacesTab({ t, onOpenRaceMonitor }: { t: Tournament; onOpenRaceMonitor: (raceId: string) => void }) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const races = RACES_BY_TOURNAMENT[t.id] ?? [];
    const liveRace = races.find(r => r.status === "live");
    const c = T_COLOR[t.color];

    return (
        <div className="flex flex-col gap-1.5">
            {liveRace && (
                <div className="flex items-center gap-2 mb-2 px-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />
                    <span className={`text-[11px] font-semibold ${c.label}`}>Round {liveRace.round} is currently in progress</span>
                </div>
            )}
            {races.map(race => {
                const isLive = race.status === "live";
                const isCompleted = race.status === "completed";
                const isExpanded = expandedId === race.id;

                return (
                    <div key={race.id}>
                        <div
                            onClick={() => setExpandedId(prev => prev === race.id ? null : race.id)}
                            className={[
                                "relative flex items-center gap-3 px-4 py-3.5 rounded-xl border cursor-pointer transition-all duration-150",
                                isLive
                                    ? `bg-red-500/5 border-red-800/40 hover:border-red-700/60`
                                    : isExpanded
                                        ? "bg-white/[0.04] border-white/12"
                                        : "bg-white/[0.02] border-white/6 hover:bg-white/[0.04] hover:border-white/10",
                            ].join(" ")}
                        >
                            {isLive && <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${c.dot} rounded-l-xl`} />}
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${isLive ? "bg-red-700 text-white" : isCompleted ? "bg-white/8 text-gray-500" : "bg-white/5 text-gray-600"}`}>
                                {race.round}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[13.5px] font-bold ${isCompleted ? "text-gray-400" : "text-white"}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                                        {race.label}
                                    </span>
                                    <GradeBadge grade={race.gradeLevel} />
                                    <RaceTypeBadge type={race.raceType} />
                                    {isLive && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-red-700/60 text-red-400 bg-red-500/10 text-[10px] font-bold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live Now
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-x-3 mt-1 flex-wrap">
                                    <span className="text-[11.5px] text-gray-600 flex items-center gap-1"><MapPin size={10} className={isLive ? "text-red-600" : "text-gray-600"} />{race.venue}</span>
                                    <span className="text-[11.5px] text-gray-600 flex items-center gap-1"><Clock size={10} />{race.date} · {race.time}</span>
                                    <span className="text-[11.5px] text-gray-600 flex items-center gap-1"><Users size={10} />{race.entries}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {race.role && <span className="text-[10.5px] font-semibold text-gray-500 bg-white/5 px-2 py-1 rounded-lg hidden sm:block">{race.role}</span>}
                                {isLive && (
                                    <button
                                        onClick={e => { e.stopPropagation(); onOpenRaceMonitor(race.id); }}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-700 text-white text-[11px] font-bold hover:bg-red-600 transition-all"
                                    >
                                        Monitor
                                    </button>
                                )}
                                <ChevronRight size={13} className={`text-gray-600 transition-transform duration-150 ${isExpanded ? "rotate-90" : ""}`} />
                            </div>
                        </div>
                        {isExpanded && <RaceDetailPanel race={race} onClose={() => setExpandedId(null)} />}
                    </div>
                );
            })}
        </div>
    );
}

// ── Tournament Modal ──────────────────────────────────────────────────────────

function TournamentModal({ tournament: t, onClose, onOpenRaceMonitor }: {
    tournament: Tournament;
    onClose: () => void;
    onOpenRaceMonitor: (raceId: string) => void;
}) {
    const [tab, setTab] = useState<ModalTab>("overview");
    const c = T_COLOR[t.color];

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-full sm:max-w-2xl bg-[#1a1a1a] rounded-t-2xl sm:rounded-2xl border border-white/10 flex flex-col overflow-hidden"
                style={{ maxHeight: "90vh" }}
                onClick={e => e.stopPropagation()}
            >
                {/* Color accent top bar */}
                <div className={`h-0.5 w-full ${c.dot}`} />

                {/* Header */}
                <div className="px-5 pt-4 pb-0 shrink-0">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.band}`}>
                                <Trophy size={17} className={c.label} />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                    <StatusBadge status={t.status} />
                                    <GradeBadge grade={t.grade} />
                                    <AssignmentTag assignment={t.assignment} assignedRaces={t.assignedRaces} totalRaces={t.totalRaces} />
                                </div>
                                <h2 className="text-[20px] font-bold text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                                    {t.name}
                                </h2>
                                <p className="text-[11.5px] text-gray-600 mt-0.5">{t.series}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl border border-white/10 text-gray-500 hover:text-gray-200 hover:border-white/20 transition-all shrink-0">
                            <X size={15} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mt-4 bg-white/[0.04] rounded-xl p-1">
                        {(["overview", "races"] as ModalTab[]).map(key => (
                            <button
                                key={key}
                                onClick={() => setTab(key)}
                                className={[
                                    "flex-1 py-2 rounded-lg text-[13px] font-semibold capitalize transition-all duration-150",
                                    tab === key ? `bg-red-700 text-white shadow-sm` : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]",
                                ].join(" ")}
                            >
                                {key === "overview" ? "Overview" : `Races (${(RACES_BY_TOURNAMENT[t.id] ?? []).length})`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
                    {tab === "overview"
                        ? <OverviewTab t={t} />
                        : <RacesTab t={t} onOpenRaceMonitor={onOpenRaceMonitor} />
                    }
                </div>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface TournamentListPageProps {
    onSelect?: (id: string) => void;
    onOpenRaceMonitor?: (raceId: string) => void;
}

export default function TournamentListPage({ onSelect, onOpenRaceMonitor }: TournamentListPageProps) {
    const navigate = useNavigate();
    const [selected, setSelected] = useState<Tournament | null>(null);

    const handleSelect = (t: Tournament) => {
        setSelected(t);
        onSelect?.(t.id);
    };

    const handleOpenRaceMonitor = (raceId: string) => {
        setSelected(null);
        if (onOpenRaceMonitor) {
            onOpenRaceMonitor(raceId);
        } else {
            navigate(`/referee/race-monitor/`);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f0f]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="max-w-5xl mx-auto px-5 py-8">

                {/* Header */}
                <div className="flex items-start justify-between mb-7">
                    <div>
                        <h1 className="text-[26px] font-bold text-white tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                            Tournaments
                        </h1>
                        <p className="text-[13px] text-gray-500 mt-0.5">Race series and championship events.</p>
                    </div>
                    <div className="bg-[#1a1a1a] border border-white/8 rounded-xl px-4 py-2.5 text-right">
                        <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">Assigned</p>
                        <p className="text-[22px] font-black text-red-500 tracking-tight leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                            {TOURNAMENTS.filter(t => t.assignment !== "none").length}
                        </p>
                    </div>
                </div>

                <TournamentCalendar onSelectTournament={handleSelect} />
            </div>

            {selected && (
                <TournamentModal
                    tournament={selected}
                    onClose={() => setSelected(null)}
                    onOpenRaceMonitor={handleOpenRaceMonitor}
                />
            )}
        </div>
    );
}