// ── Shared types ──────────────────────────────────────────────────────────────
export type RaceStatus   = "LIVE" | "UPCOMING" | "FINISHED";
export type InviteStatus = "Pending" | "Accepted" | "Denied";

export interface MyRace {
  id: number;
  name: string;
  date: string;
  venue: string;
  horse: string;
  jockey: string;
  status: RaceStatus;
  image: string;
}

export interface Invitation {
  id: number;
  name: string;
  type: "Race" | "Tournament";
  date: string;
  venue: string;
  horse: string;
  jockey: string;
  prize: string;
  distance: string;
  grade: string;
  image: string;
  sentBy: string;
  sentAt: string;
  status: InviteStatus;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
export const MY_RACES: MyRace[] = [
  {
    id: 1,
    name: "Ascot Prestige Cup",
    date: "Today, 14:58 PM",
    venue: "Belmont Racecourse",
    horse: "Thunder Bolt",
    jockey: "L. Dettori",
    status: "LIVE",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
  },
  {
    id: 2,
    name: "Derby Mùa Thu",
    date: "Oct 12, 10:00 AM",
    venue: "Longchamp Paris",
    horse: "Midnight Star",
    jockey: "R. Moore",
    status: "UPCOMING",
    image: "https://images.unsplash.com/photo-1525543907410-b2562b6796b6?w=600&q=80",
  },
  {
    id: 3,
    name: "Melbourne Sprint",
    date: "Nov 3, 3:30 PM",
    venue: "Flemington Track",
    horse: "Crimson Velocity",
    jockey: "J. Velazquez",
    status: "UPCOMING",
    image: "https://images.unsplash.com/photo-1553284965-5dd67167ac2f?w=600&q=80",
  },
  {
    id: 4,
    name: "Dubai World Cup",
    date: "Mar 28, 7:00 PM",
    venue: "Meydan Racecourse",
    horse: "Iron Ledger",
    jockey: "F. Dettori",
    status: "FINISHED",
    image: "https://images.unsplash.com/photo-1567163437983-b0d9a2b5b369?w=600&q=80",
  },
];

export const INITIAL_INVITATIONS: Invitation[] = [
  {
    id: 1,
    name: "Royal Ascot Championship",
    type: "Race",
    date: "Jun 18, 2025 · 2:00 PM",
    venue: "Ascot Racecourse, UK",
    horse: "Crimson Velocity",
    jockey: "M. Vance",
    prize: "$250,000",
    distance: "2400m",
    grade: "Grade 1",
    image: "https://images.unsplash.com/photo-1508817628294-5a453fa0b8fb?w=600&q=80",
    sentBy: "Royal Ascot Admin",
    sentAt: "2 hours ago",
    status: "Pending",
  },
  {
    id: 2,
    name: "Autumn Grand Tournament",
    type: "Tournament",
    date: "Oct 5–7, 2025",
    venue: "Churchill Downs, USA",
    horse: "Thunder Bolt",
    jockey: "L. Dettori",
    prize: "$1,200,000",
    distance: "Multiple",
    grade: "Group Special",
    image: "https://images.unsplash.com/photo-1598901847919-b2a5e9e00f64?w=600&q=80",
    sentBy: "Churchill Downs Authority",
    sentAt: "Yesterday",
    status: "Pending",
  },
  {
    id: 3,
    name: "Longchamp Classic",
    type: "Race",
    date: "Sep 6, 2025 · 4:30 PM",
    venue: "ParisLongchamp, FRA",
    horse: "Midnight Star",
    jockey: "A. Diallo",
    prize: "$400,000",
    distance: "2000m",
    grade: "Grade 1",
    image: "https://images.unsplash.com/photo-1553284965-5dd67167ac2f?w=600&q=80",
    sentBy: "France Galop Committee",
    sentAt: "3 days ago",
    status: "Accepted",
  },
  {
    id: 4,
    name: "Singapore Gold Cup",
    type: "Race",
    date: "Aug 22, 2025 · 5:00 PM",
    venue: "Kranji Racecourse, SGP",
    horse: "Iron Ledger",
    jockey: "T. Sato",
    prize: "$180,000",
    distance: "1800m",
    grade: "Grade 2",
    image: "https://images.unsplash.com/photo-1525543907410-b2562b6796b6?w=600&q=80",
    sentBy: "Singapore Turf Club",
    sentAt: "5 days ago",
    status: "Denied",
  },
];