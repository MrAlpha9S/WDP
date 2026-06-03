import type { Track, ScheduledRace, MockHorseOwner, MockHorse, RaceType } from "../../../shared/types/RaceTypes";

export const TRACKS: Track[] = [
    { id: "t1", name: "Alpha Track", surface: "Turf", distance: "1.2mi" },
    { id: "t2", name: "Beta Circuit", surface: "Dirt", distance: "1.5mi" },
];

export const SCHEDULED_RACES: ScheduledRace[] = [
    {
        id: "r1",
        title: "Ascot Gold Cup",
        date: "2024-11-08",
        time: "14:15",
        trackId: "t1",
        tournament: "Autumn Series",
        status: "Upcoming",
        maxSlots: 10,
        participants: [
            { horseId: "h1", horseName: "Thunderbolt", jockeyId: "j1", jockeyName: "Sarah Miller", rating: 94 },
            { horseId: "h2", horseName: "Midnight Eclipse", jockeyId: "j2", jockeyName: "James Smith", rating: 88 },
            { horseId: "h3", horseName: "Crimson Tide", jockeyId: "j3", jockeyName: "Alex Vance", rating: 91 },
        ],
        pendingInvites: [
            { id: "inv1", ownerName: "Oliver Hartley", horseName: "Silver Bullet" },
            { id: "inv2", ownerName: "Emma Stone", horseName: "Shadowfax" }
        ],
        leftPercent: "8%",     // visually placed after 14:00
        widthPercent: "16%"    // visually ~30 mins length
    },
    {
        id: "r2",
        title: "Dubai World Cup",
        date: "2024-12-15",
        time: "15:15",
        trackId: "t2",
        tournament: "Global Championship",
        status: "Upcoming",
        maxSlots: 12,
        participants: [
            { horseId: "h4", horseName: "Desert Rose", jockeyId: "j4", jockeyName: "Mike Ross", rating: 95 },
            { horseId: "h5", horseName: "Sandstorm", jockeyId: "j5", jockeyName: "Liam Neeson", rating: 90 },
        ],
        pendingInvites: [
            { id: "inv3", ownerName: "John Doe", horseName: "Mirage" }
        ],
        leftPercent: "41.5%",  // visually placed after 15:00
        widthPercent: "21%"    // visually ~40 mins length
    }
];

export const MOCK_OWNERS: MockHorseOwner[] = [
    { id: "o1", ownerName: "Emma Stone", horses: [{ id: "h1", name: "Silver Bullet", wins: 0 }] }, // Maiden
    { id: "o2", ownerName: "Oliver Hartley", horses: [{ id: "h2", name: "Thunder Strike", wins: 5 }] }, // Stakes, Claiming
    { id: "o3", ownerName: "John Doe", horses: [{ id: "h3", name: "Wind Runner", wins: 1 }] }, // Allowance, Claiming
    { id: "o4", ownerName: "James Weston", horses: [{ id: "h4", name: "Shadowfax", wins: 0 }] }, // Maiden
    { id: "o5", ownerName: "Mike Ross", horses: [{ id: "h5", name: "Desert Rose", wins: 12 }] }, // Stakes, Claiming
];

export const MOCK_REFEREES = [
    { id: "r1", name: "David Sterling", experience: "Senior (10+ yrs)" },
    { id: "r2", name: "Amanda Hayes", experience: "Mid (5+ yrs)" },
    { id: "r3", name: "Marcus Johnson", experience: "Senior (12+ yrs)" },
    { id: "r4", name: "Elena Rodriguez", experience: "Junior (2+ yrs)" }
];

export const checkEligibility = (horse: MockHorse, type: RaceType) => {
    switch (type) {
        case "Maiden": return horse.wins === 0;
        case "Allowance": return horse.wins > 0 && horse.wins <= 2;
        case "Stakes": return horse.wins >= 3;
        case "Claims": return true;
        default: return true;
    }
}

export const TIME_SLOTS = ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];
