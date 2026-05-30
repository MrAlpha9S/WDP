import type { Tournament, RaceRound, LeaderEntry } from "../types/TournamentTypes";

// ── Color map ─────────────────────────────────────────────────────────────────

export const T_COLOR: Record<string, { band: string; dot: string; label: string; border: string }> = {
    red:    { band: "bg-red-500/15",    dot: "bg-red-500",    label: "text-red-400",    border: "border-red-700/40"    },
    blue:   { band: "bg-blue-500/15",   dot: "bg-blue-500",   label: "text-blue-400",   border: "border-blue-700/40"   },
    amber:  { band: "bg-amber-500/15",  dot: "bg-amber-500",  label: "text-amber-400",  border: "border-amber-700/40"  },
    purple: { band: "bg-purple-500/15", dot: "bg-purple-500", label: "text-purple-400", border: "border-purple-700/40" },
    green:  { band: "bg-green-500/15",  dot: "bg-green-500",  label: "text-green-400",  border: "border-green-700/40"  },
    sky:    { band: "bg-sky-500/15",    dot: "bg-sky-500",    label: "text-sky-400",    border: "border-sky-700/40"    },
    orange: { band: "bg-orange-500/15", dot: "bg-orange-500", label: "text-orange-400", border: "border-orange-700/40" },
};

// ── Calendar constants ─────────────────────────────────────────────────────────

export const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
export const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export const TODAY_ISO = "2024-11-02";
export const TODAY = new Date(2024, 10, 2);

// ── Calendar helpers ──────────────────────────────────────────────────────────

export function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
export function firstDayOfMonth(y: number, m: number) { return new Date(y, m, 1).getDay(); }
export function toISO(y: number, m: number, d: number) {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function tournamentsOnDay(iso: string): Tournament[] {
    return TOURNAMENTS.filter(t => iso >= t.startISO && iso <= t.endISO);
}
export function racesOnDay(iso: string): RaceRound[] {
    return ALL_RACES.filter(r => r.dateISO === iso);
}

// ── Tournament mock data ───────────────────────────────────────────────────────

export const TOURNAMENTS: Tournament[] = [
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

// ── Race mock data ─────────────────────────────────────────────────────────────

export const ALL_RACES: RaceRound[] = [
    { id: "R-1001", round: 1, label: "Kentucky Classic", venue: "Churchill Downs", trackLocation: "Louisville, KY, USA", date: "Oct 2, 2024", dateISO: "2024-10-02", time: "3:30 PM ET", raceType: "Stakes", gradeLevel: "G1", distance: "1 1/4 Miles", track: "Dirt, Fast", entries: 14, prizePool: "$1.5M", status: "completed", role: "Head Referee", violations: 1, tournamentId: "T-001" },
    { id: "R-1002", round: 2, label: "Dubai Desert Crown", venue: "Meydan Racecourse", trackLocation: "Dubai, UAE", date: "Oct 14, 2024", dateISO: "2024-10-14", time: "7:00 PM GST", raceType: "Stakes", gradeLevel: "G1", distance: "1 1/8 Miles", track: "Turf, Good", entries: 12, prizePool: "$2.0M", status: "completed", role: "Gate Referee", violations: 0, tournamentId: "T-001" },
    { id: "R-1003", round: 3, label: "Ascot Gold Cup", venue: "Ascot Racecourse", trackLocation: "Ascot, Berkshire, UK", date: "Oct 24, 2024", dateISO: "2024-10-24", time: "2:15 PM GMT", raceType: "Stakes", gradeLevel: "G1", distance: "2 Miles 4F", track: "Turf, Soft", entries: 12, prizePool: "$1.8M", status: "completed", role: "Track Referee", violations: 1, tournamentId: "T-001" },
    { id: "R-1004", round: 4, label: "Japan Autumn Cup", venue: "Tokyo Racecourse", trackLocation: "Fuchu, Tokyo, Japan", date: "Nov 1, 2024", dateISO: "2024-11-01", time: "3:40 PM JST", raceType: "Stakes", gradeLevel: "G2", distance: "1 1/4 Miles", track: "Turf, Good", entries: 10, prizePool: "$1.2M", status: "completed", role: "Head Referee", violations: 0, tournamentId: "T-001" },
    { id: "R-1005", round: 5, label: "The Pegasus Cup", venue: "Churchill Downs", trackLocation: "Louisville, KY, USA", date: "Nov 2, 2024", dateISO: "2024-11-02", time: "3:30 PM ET", raceType: "Stakes", gradeLevel: "G1", distance: "1 1/8 Miles", track: "Dirt, Fast", entries: 14, prizePool: "$2.2M", status: "live", role: "Head Referee", violations: 0, tournamentId: "T-001" },
    { id: "R-1006", round: 6, label: "Breeders' Cup Mile", venue: "Santa Anita Park", trackLocation: "Arcadia, CA, USA", date: "Nov 14, 2024", dateISO: "2024-11-14", time: "5:00 PM PT", raceType: "Stakes", gradeLevel: "G1", distance: "1 Mile", track: "Turf, Firm", entries: 13, prizePool: "$2.0M", status: "upcoming", role: "Gate Referee", violations: 0, tournamentId: "T-001" },
    { id: "R-1007", round: 7, label: "Hong Kong Mile", venue: "Sha Tin Racecourse", trackLocation: "Sha Tin, New Territories, HK", date: "Dec 8, 2024", dateISO: "2024-12-08", time: "4:30 PM HKT", raceType: "Claims", gradeLevel: "G2", distance: "1 Mile", track: "Turf, Good", entries: 11, prizePool: "$0.9M", status: "upcoming", role: "Head Referee", violations: 0, tournamentId: "T-001" },
    { id: "R-1008", round: 8, label: "World Championship Final", venue: "Longchamp", trackLocation: "Paris, France", date: "Dec 14, 2024", dateISO: "2024-12-14", time: "3:00 PM CET", raceType: "Stakes", gradeLevel: "G1", distance: "1 1/2 Miles", track: "Turf, Good", entries: 16, prizePool: "$3.3M", status: "upcoming", role: null, violations: 0, tournamentId: "T-001" },
    { id: "R-2001", round: 1, label: "BC Juvenile", venue: "Santa Anita Park", trackLocation: "Arcadia, CA, USA", date: "Nov 1, 2024", dateISO: "2024-11-01", time: "1:00 PM PT", raceType: "Stakes", gradeLevel: "G1", distance: "1 Mile", track: "Dirt, Fast", entries: 12, prizePool: "$2.0M", status: "completed", role: null, violations: 0, tournamentId: "T-002" },
    { id: "R-2002", round: 2, label: "BC Classic", venue: "Santa Anita Park", trackLocation: "Arcadia, CA, USA", date: "Nov 2, 2024", dateISO: "2024-11-02", time: "5:30 PM PT", raceType: "Stakes", gradeLevel: "G1", distance: "1 1/4 Miles", track: "Dirt, Fast", entries: 14, prizePool: "$6.0M", status: "live", role: "Head Referee", violations: 0, tournamentId: "T-002" },
    { id: "R-5001", round: 1, label: "Autumn Tenno Sho", venue: "Tokyo Racecourse", trackLocation: "Fuchu, Tokyo, Japan", date: "Oct 6, 2024", dateISO: "2024-10-06", time: "3:40 PM JST", raceType: "Stakes", gradeLevel: "G1", distance: "2000m", track: "Turf, Good", entries: 18, prizePool: "$2.1M", status: "completed", role: "Head Referee", violations: 0, tournamentId: "T-005" },
    { id: "R-5002", round: 2, label: "Kikka Sho", venue: "Kyoto Racecourse", trackLocation: "Kyoto, Japan", date: "Oct 20, 2024", dateISO: "2024-10-20", time: "3:40 PM JST", raceType: "Stakes", gradeLevel: "G1", distance: "3000m", track: "Turf, Good", entries: 18, prizePool: "$1.5M", status: "completed", role: "Gate Referee", violations: 1, tournamentId: "T-005" },
    { id: "R-5003", round: 3, label: "Japan Cup", venue: "Tokyo Racecourse", trackLocation: "Fuchu, Tokyo, Japan", date: "Nov 24, 2024", dateISO: "2024-11-24", time: "3:40 PM JST", raceType: "Stakes", gradeLevel: "G1", distance: "2400m", track: "Turf, Firm", entries: 18, prizePool: "$3.8M", status: "completed", role: "Head Referee", violations: 0, tournamentId: "T-005" },
    { id: "R-7001", round: 1, label: "Prix de l'Arc", venue: "Longchamp", trackLocation: "Paris, France", date: "Oct 6, 2024", dateISO: "2024-10-06", time: "4:05 PM CET", raceType: "Stakes", gradeLevel: "G1", distance: "2400m", track: "Turf, Soft", entries: 20, prizePool: "$5.5M", status: "completed", role: null, violations: 0, tournamentId: "T-007" },
];

export const RACES_BY_TOURNAMENT: Record<string, RaceRound[]> = ALL_RACES.reduce((acc, r) => {
    if (!acc[r.tournamentId]) acc[r.tournamentId] = [];
    acc[r.tournamentId].push(r);
    return acc;
}, {} as Record<string, RaceRound[]>);

// ── Leaderboard mock data ──────────────────────────────────────────────────────

export const LEADERBOARD: LeaderEntry[] = [
    // placements: 8 races — R1–R4 completed, R5 live, R6–R8 upcoming (null)
    { rank: 1, horse: "Thunderstrike", owner: "Blackwood Estate",     points: 142, wins: 3, maxPoints: 142, placements: [1, 1, 2, 1, null, null, null, null] },
    { rank: 2, horse: "Crimson Tide",  owner: "Silver Ridge Farm",    points: 116, wins: 2, maxPoints: 142, placements: [2, 3, 1, 2, null, null, null, null] },
    { rank: 3, horse: "Silver Bullet", owner: "Al-Hassan Racing",     points: 95,  wins: 2, maxPoints: 142, placements: [3, 2, 3, 4, null, null, null, null] },
    { rank: 4, horse: "Night Fury",    owner: "Rostova Stables",      points: 71,  wins: 1, maxPoints: 142, placements: [4, 4, 4, 3, null, null, null, null] },
    { rank: 5, horse: "Golden Horizon",owner: "Vance Thoroughbreds",  points: 51,  wins: 0, maxPoints: 142, placements: [5, 5, 5, 5, null, null, null, null] },
];
