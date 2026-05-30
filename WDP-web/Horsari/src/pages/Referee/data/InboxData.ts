import type { RaceInvite, RaceType } from "../types/InboxTypes";

// ── Invite mock data ───────────────────────────────────────────────────────────

export const INVITES: RaceInvite[] = [
    {
        id: "INV-3041", race: "R-1005", raceLabel: "The Pegasus Cup",
        venue: "Churchill Downs", trackLocation: "Louisville, KY, USA",
        date: "Nov 2, 2024", time: "3:30 PM ET",
        role: "Head Referee", sentAt: "2 hours ago", status: "pending", isNew: true,
        raceType: "Stakes", gradeLevel: "G1", distance: "1 1/8 Miles", track: "Dirt, Fast",
        entries: 14, assignedBy: "James Whitfield",
        notes: "High-profile Grade I race. Full stewards panel required on site by 1:00 PM.",
        fee: 850, paymentStatus: "unpaid",
    },
    {
        id: "INV-3039", race: "R-1002", raceLabel: "Dubai World Sprint",
        venue: "Meydan Racecourse", trackLocation: "Dubai, UAE",
        date: "Nov 5, 2024", time: "7:00 PM GST",
        role: "Gate Referee", sentAt: "5 hours ago", status: "pending", isNew: true,
        raceType: "Allowance", gradeLevel: "Open", distance: "6 Furlongs", track: "Turf, Good",
        entries: 10, assignedBy: "Amir Al-Hassan",
        notes: "International event. Gate inspection required 90 minutes prior to post time.",
        fee: 620, paymentStatus: "unpaid",
    },
    {
        id: "INV-3035", race: "R-998", raceLabel: "Ascot Gold Cup",
        venue: "Ascot Racecourse", trackLocation: "Ascot, Berkshire, UK",
        date: "Nov 8, 2024", time: "2:15 PM GMT",
        role: "Track Referee", sentAt: "Yesterday", status: "pending",
        raceType: "Stakes", gradeLevel: "G1", distance: "2 Miles 4 Furlongs", track: "Turf, Soft",
        entries: 12, assignedBy: "Oliver Hartley",
        notes: "Longest flat race of the season. Track condition report expected morning of race.",
        fee: 700, paymentStatus: "unpaid",
    },
    {
        id: "INV-3028", race: "R-990", raceLabel: "Ascot Stakes",
        venue: "Ascot Racecourse", trackLocation: "Ascot, Berkshire, UK",
        date: "Oct 24, 2024", time: "4:00 PM GMT",
        role: "Head Referee", sentAt: "3 days ago", status: "accepted",
        raceType: "Claiming", gradeLevel: "G3", distance: "1 Mile", track: "Turf, Good",
        entries: 11, assignedBy: "Oliver Hartley",
        notes: "Standard Grade III. Brief pre-race debrief with stewards at 2:30 PM.",
        fee: 780, paymentStatus: "processing", paymentMethod: "Bank Transfer",
    },
    {
        id: "INV-3021", race: "R-985", raceLabel: "Kentucky Prep",
        venue: "Churchill Downs", trackLocation: "Louisville, KY, USA",
        date: "Oct 20, 2024", time: "1:00 PM ET",
        role: "Gate Referee", sentAt: "5 days ago", status: "declined",
        raceType: "Maiden", gradeLevel: "Open", distance: "7 Furlongs", track: "Dirt, Fast",
        entries: 9, assignedBy: "James Whitfield",
        notes: "Prep race for the Kentucky Derby. Standard gate protocols apply.",
        fee: 500, paymentStatus: "unpaid",
    },
];

// ── Race type descriptions ─────────────────────────────────────────────────────

export const RACE_TYPE_DESCRIPTIONS: Record<RaceType, string> = {
    Stakes:    "Top tier — highest prize money.",
    Allowance: "Mid-level — horses that have won but aren't ready for stakes.",
    Claiming:  "Any owner can purchase a horse at the listed price before the race.",
    Maiden:    "For horses that have never won a race.",
};
