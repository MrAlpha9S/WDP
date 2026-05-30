import type { UpcomingRace, RecentInvite, RaceType, GradeLevel } from "../types/HomepageTypes";

// ── Date constants ─────────────────────────────────────────────────────────────

export const TODAY = new Date(2024, 10, 2);

// ── Calendar helpers ───────────────────────────────────────────────────────────

export const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
export function firstDayOfMonth(y: number, m: number) { return new Date(y, m, 1).getDay(); }
export function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

// ── Style maps ─────────────────────────────────────────────────────────────────

export const RACE_TYPE_DOT: Record<RaceType, string> = {
    Stakes: "bg-red-500",
    Allowance: "bg-blue-500",
    Claiming: "bg-orange-500",
    Maiden: "bg-purple-500",
};

export const GRADE_STYLE: Record<GradeLevel, string> = {
    G1: "border-yellow-700/60 text-yellow-400 bg-yellow-500/10",
    G2: "border-gray-600/60 text-gray-400 bg-white/5",
    G3: "border-amber-700/60 text-amber-400 bg-amber-500/10",
    Listed: "border-sky-700/60 text-sky-400 bg-sky-500/10",
    Open: "border-white/10 text-gray-500 bg-transparent",
};

export const TYPE_STYLE: Record<RaceType, string> = {
    Stakes: "border-red-800/60 text-red-400 bg-red-500/10",
    Allowance: "border-blue-800/60 text-blue-400 bg-blue-500/10",
    Claiming: "border-orange-800/60 text-orange-400 bg-orange-500/10",
    Maiden: "border-purple-800/60 text-purple-400 bg-purple-500/10",
};

// ── Upcoming races mock data ────────────────────────────────────────────────────

export const UPCOMING: UpcomingRace[] = [
    { id: "R-1005", label: "The Pegasus Cup", venue: "Churchill Downs", trackLocation: "Louisville, KY, USA", date: new Date(2024, 10, 2), time: "3:30 PM ET", role: "Head Referee", raceType: "Stakes", gradeLevel: "G1", status: "confirmed" },
    { id: "R-1002", label: "Dubai World Sprint", venue: "Meydan Racecourse", trackLocation: "Dubai, UAE", date: new Date(2024, 10, 5), time: "7:00 PM GST", role: "Gate Referee", raceType: "Allowance", gradeLevel: "Open", status: "confirmed" },
    { id: "R-998", label: "Ascot Gold Cup", venue: "Ascot Racecourse", trackLocation: "Ascot, Berkshire, UK", date: new Date(2024, 10, 8), time: "2:15 PM GMT", role: "Track Referee", raceType: "Stakes", gradeLevel: "G1", status: "tentative" },
    { id: "R-1010", label: "Breeders' Cup Mile", venue: "Santa Anita Park", trackLocation: "Arcadia, CA, USA", date: new Date(2024, 10, 14), time: "5:00 PM PT", role: "Head Referee", raceType: "Stakes", gradeLevel: "G1", status: "confirmed" },
    { id: "R-1015", label: "Japan Cup", venue: "Tokyo Racecourse", trackLocation: "Fuchu, Tokyo, Japan", date: new Date(2024, 10, 24), time: "3:40 PM JST", role: "Gate Referee", raceType: "Stakes", gradeLevel: "G1", status: "tentative" },
    { id: "R-1018", label: "Hong Kong Mile", venue: "Sha Tin Racecourse", trackLocation: "Sha Tin, New Territories, HK", date: new Date(2024, 11, 8), time: "4:30 PM HKT", role: "Head Referee", raceType: "Claiming", gradeLevel: "G2", status: "confirmed" },
];

// ── Recent invites mock data ───────────────────────────────────────────────────

export const INVITES: RecentInvite[] = [
    { id: "INV-3041", raceLabel: "The Pegasus Cup", venue: "Churchill Downs", trackLocation: "Louisville, KY, USA", date: "Nov 2, 2024", role: "Head Referee", raceType: "Stakes", gradeLevel: "G1", sentAt: "2h ago", status: "pending", isNew: true, fee: 850 },
    { id: "INV-3039", raceLabel: "Dubai World Sprint", venue: "Meydan Racecourse", trackLocation: "Dubai, UAE", date: "Nov 5, 2024", role: "Gate Referee", raceType: "Allowance", gradeLevel: "Open", sentAt: "5h ago", status: "pending", isNew: true, fee: 620 },
    { id: "INV-3035", raceLabel: "Ascot Gold Cup", venue: "Ascot Racecourse", trackLocation: "Ascot, Berkshire, UK", date: "Nov 8, 2024", role: "Track Referee", raceType: "Stakes", gradeLevel: "G1", sentAt: "Yesterday", status: "pending", fee: 700 },
];
