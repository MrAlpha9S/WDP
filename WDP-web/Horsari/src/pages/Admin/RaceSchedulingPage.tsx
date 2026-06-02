import { useState } from "react";
import { Search, GripVertical, Settings, Users, Plus, LayoutGrid, List, X, Calendar, MapPin, Trophy as TrophyIcon } from "lucide-react";

// ── Types ─────────────

type ViewMode = "timeline" | "table";
type RaceType = "Stakes" | "Allowance" | "Claiming" | "Maiden";

interface Track {
    id: string;
    name: string;
    surface: string;
    distance: string;
}

interface Participant {
    horseId: string;
    horseName: string;
    jockeyId: string;
    jockeyName: string;
    rating: number;
}

interface PendingInvite {
    id: string;
    ownerName: string;
    horseName: string;
}

interface ScheduledRace {
    id: string;
    title: string;
    date: string;
    time: string; // e.g. "14:15"
    trackId: string;
    tournament: string;
    status: "Upcoming" | "Live" | "Completed";
    maxSlots: number;
    participants: Participant[];
    pendingInvites: PendingInvite[];
    // For CSS positioning in a simple visual demo:
    leftPercent: string;
    widthPercent: string;
}

// ── Mock Data ──────────

const TRACKS: Track[] = [
    { id: "t1", name: "Alpha Track", surface: "Turf", distance: "1.2mi" },
    { id: "t2", name: "Beta Circuit", surface: "Dirt", distance: "1.5mi" },
];

const SCHEDULED_RACES: ScheduledRace[] = [
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

interface MockHorse {
    id: string;
    name: string;
    wins: number;
}

interface MockHorseOwner {
    id: string;
    ownerName: string;
    horses: MockHorse[];
}

const MOCK_OWNERS: MockHorseOwner[] = [
    { id: "o1", ownerName: "Emma Stone", horses: [{ id: "h1", name: "Silver Bullet", wins: 0 }] }, // Maiden
    { id: "o2", ownerName: "Oliver Hartley", horses: [{ id: "h2", name: "Thunder Strike", wins: 5 }] }, // Stakes, Claiming
    { id: "o3", ownerName: "John Doe", horses: [{ id: "h3", name: "Wind Runner", wins: 1 }] }, // Allowance, Claiming
    { id: "o4", ownerName: "James Weston", horses: [{ id: "h4", name: "Shadowfax", wins: 0 }] }, // Maiden
    { id: "o5", ownerName: "Mike Ross", horses: [{ id: "h5", name: "Desert Rose", wins: 12 }] }, // Stakes, Claiming
];

const MOCK_REFEREES = [
    { id: "r1", name: "David Sterling", experience: "Senior (10+ yrs)" },
    { id: "r2", name: "Amanda Hayes", experience: "Mid (5+ yrs)" },
    { id: "r3", name: "Marcus Johnson", experience: "Senior (12+ yrs)" },
    { id: "r4", name: "Elena Rodriguez", experience: "Junior (2+ yrs)" }
];

const checkEligibility = (horse: MockHorse, type: RaceType) => {
    switch (type) {
        case "Maiden": return horse.wins === 0;
        case "Allowance": return horse.wins > 0 && horse.wins <= 2;
        case "Stakes": return horse.wins >= 3;
        case "Claiming": return true;
        default: return true;
    }
}

const TIME_SLOTS = ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];

export default function RaceSchedulingPage() {
    const [viewMode, setViewMode] = useState<ViewMode>("timeline");
    const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createRaceType, setCreateRaceType] = useState<RaceType>("Stakes");
    const [refereeSearchQuery, setRefereeSearchQuery] = useState("");

    const selectedRace = SCHEDULED_RACES.find(r => r.id === selectedRaceId);

    return (
        <div className="flex flex-col h-full bg-[#111111] text-white overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

            {/* ── Top Content Area ── */}
            <div className="flex-1 grid grid-cols-[280px_1fr] gap-8 p-8 min-h-0">

                {/* ── Left Panel (Race Details) ── */}
                <aside className="h-full bg-[#161616] border border-white/[0.05] rounded-xl flex flex-col overflow-hidden shadow-lg shadow-black/20">
                    {selectedRace ? (
                        <div className="flex flex-col h-full">
                            {/* Details Header */}
                            <div className="px-5 py-6 shrink-0 border-b border-white/[0.05] bg-[#1a1a1a]">
                                <h2 className="text-[18px] font-bold text-white mb-1 tracking-tight leading-tight">{selectedRace.title}</h2>
                                <p className="text-[12px] text-gray-400 mb-3">{selectedRace.tournament}</p>
                                <div className="flex items-center gap-4 text-[11px] font-medium text-gray-500">
                                    <span>📅 {selectedRace.date}</span>
                                    <span>🕒 {selectedRace.time}</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                                {/* Enrolled Horses */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-[12px] font-bold text-white uppercase tracking-widest">Enrolled</h3>
                                        <span className="text-[11px] font-medium text-gray-500">{selectedRace.participants.length} / {selectedRace.maxSlots}</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {selectedRace.participants.map(p => (
                                            <div key={p.horseId} className="flex items-center justify-between p-2.5 rounded bg-[#1f1a1a] border border-white/5">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[13px] font-semibold text-white">{p.horseName}</span>
                                                    <span className="text-[11px] text-[#f3b2a5]">Jockey: {p.jockeyName}</span>
                                                </div>
                                                <span className="text-[11px] text-gray-500 font-mono bg-white/5 px-1.5 py-0.5 rounded">Rtg {p.rating}</span>
                                            </div>
                                        ))}
                                        {selectedRace.participants.length === 0 && (
                                            <div className="text-[12px] text-gray-500 italic p-2 text-center">No horses enrolled yet.</div>
                                        )}
                                    </div>
                                </div>

                                {/* Pending Invites */}
                                {selectedRace.pendingInvites.length > 0 && selectedRace.participants.length < selectedRace.maxSlots && (
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Pending Invites</h3>
                                            <span className="text-[11px] font-medium text-amber-500/80">{selectedRace.pendingInvites.length} pending</span>
                                        </div>
                                        <div className="flex flex-col gap-2 opacity-80">
                                            {selectedRace.pendingInvites.map(inv => (
                                                <div key={inv.id} className="flex items-center justify-between p-2.5 rounded bg-transparent border border-white/5 border-dashed">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[13px] font-medium text-gray-300">{inv.horseName}</span>
                                                        <span className="text-[11px] text-gray-500">Owner: {inv.ownerName}</span>
                                                    </div>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50"></span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                <Search className="text-gray-500" size={20} />
                            </div>
                            <h3 className="text-[14px] font-bold text-white mb-1">No Race Selected</h3>
                            <p className="text-[12px] text-gray-500 leading-relaxed">
                                Click on a scheduled race from the timeline or table to view enrolled horses and pending invites.
                            </p>
                        </div>
                    )}
                </aside>

                {/* ── Main Timeline Area ── */}
                <main className="flex flex-col min-w-0 h-full">
                    {/* Header */}
                    <header className="pb-6 flex items-center justify-between border-b border-white/5 shrink-0">
                        <div>
                            <h1 className="text-[26px] font-bold text-white tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                                Master Race Schedule
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] font-semibold tracking-wide text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase">
                                    All Scheduled Races
                                </span>
                                <span className="text-[13px] text-gray-500">· Across All Tournaments</span>
                            </div>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex bg-[#1a1a1a] p-1 rounded-lg border border-white/5 mx-auto">
                            <button
                                onClick={() => setViewMode("timeline")}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors ${viewMode === "timeline" ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-white"}`}
                            >
                                <LayoutGrid size={14} /> Timeline
                            </button>
                            <button
                                onClick={() => setViewMode("table")}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors ${viewMode === "table" ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-white"}`}
                            >
                                <List size={14} /> Table
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2 px-5 py-2 text-[13px] font-medium text-white bg-[#ab3030] rounded hover:bg-[#8f2828] transition-colors shadow-lg shadow-red-900/20"
                            >
                                <Plus size={14} /> Create Race
                            </button>
                        </div>
                    </header>

                    {/* Main Content Area (Timeline or Table) */}
                    <div className="flex-1 overflow-auto bg-[#141414] mt-6 rounded-xl border border-white/5">
                        {viewMode === "timeline" ? (
                            <div className="min-w-[800px] border border-white/5 rounded-lg overflow-hidden bg-[#161616]">
                                {/* Time Headers */}
                                <div className="flex border-b border-white/5 bg-[#1a1a1a]">
                                    <div className="w-[200px] shrink-0 border-r border-white/5 p-4 flex items-center justify-center">
                                        <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Tracks</span>
                                    </div>
                                    <div className="flex-1 flex">
                                        {TIME_SLOTS.map((time, idx) => (
                                            <div key={idx} className="flex-1 border-r border-white/5 last:border-r-0 py-4 flex justify-center">
                                                <span className="text-[11px] font-medium text-gray-400 font-mono">{time}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Tracks and Race Rows */}
                                <div className="flex flex-col">
                                    {TRACKS.map(track => (
                                        <div key={track.id} className="flex border-b border-white/5 last:border-b-0 min-h-[120px]">

                                            {/* Track Info (Y-axis label) */}
                                            <div className="w-[200px] shrink-0 border-r border-white/5 p-5 bg-[#181818] flex flex-col justify-center gap-1">
                                                <span className="text-[14px] font-semibold text-white">{track.name}</span>
                                                <span className="text-[12px] text-gray-500">{track.surface} · {track.distance}</span>
                                            </div>

                                            {/* Timeline area for this track */}
                                            <div className="flex-1 relative flex">
                                                {/* Background Grid Lines (1 line per time slot) */}
                                                {TIME_SLOTS.map((_, idx) => (
                                                    <div key={idx} className="flex-1 border-r border-white/5 last:border-r-0" />
                                                ))}

                                                {/* Placed Races */}
                                                {SCHEDULED_RACES.filter(r => r.trackId === track.id).map(race => {
                                                    const isSelected = selectedRaceId === race.id;
                                                    return (
                                                        <div
                                                            key={race.id}
                                                            onClick={() => setSelectedRaceId(isSelected ? null : race.id)}
                                                            className={`absolute top-1/2 -translate-y-1/2 h-[70px] bg-[#1f1a1a] border rounded-md p-3 shadow-lg shadow-black/40 transition-all cursor-pointer flex flex-col justify-between ${isSelected ? "border-red-500 ring-1 ring-red-500/50" : "border-[#f3b2a5]/30 hover:border-[#f3b2a5]/60"
                                                                }`}
                                                            style={{ left: race.leftPercent, width: race.widthPercent }}
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <span className="text-[13px] font-semibold text-white truncate pr-2">{race.title}</span>
                                                                <span className="text-[12px] font-medium text-[#f3b2a5] shrink-0">{race.time}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between mt-auto">
                                                                <span className="text-[11px] text-gray-400">{race.participants.length}/{race.maxSlots} Slots</span>
                                                                <div className="flex gap-1">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#1a1a1a] border-b border-white/5">
                                            <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Race Name</th>
                                            <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Track</th>
                                            <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Tournament</th>
                                            <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Date & Time</th>
                                            <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Capacity</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {SCHEDULED_RACES.map(race => {
                                            const track = TRACKS.find(t => t.id === race.trackId);
                                            const isSelected = selectedRaceId === race.id;
                                            return (
                                                <tr
                                                    key={race.id}
                                                    onClick={() => setSelectedRaceId(isSelected ? null : race.id)}
                                                    className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${isSelected ? "bg-red-900/10" : ""}`}
                                                >
                                                    <td className="p-4">
                                                        <div className="text-[13px] font-semibold text-white">{race.title}</div>
                                                        <div className="text-[11px] text-gray-500 mt-0.5">{race.status}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="text-[13px] text-gray-300">{track?.name}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="text-[13px] text-gray-300">{race.tournament}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="text-[13px] text-gray-300">{race.date}</div>
                                                        <div className="text-[11px] text-gray-500 mt-0.5 font-mono">{race.time}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden w-24">
                                                                <div
                                                                    className="h-full bg-emerald-500 rounded-full"
                                                                    style={{ width: `${(race.participants.length / race.maxSlots) * 100}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[12px] font-medium text-gray-400 min-w-[32px]">
                                                                {race.participants.length}/{race.maxSlots}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* ── Global Footer Controls ── */}
            <footer className="shrink-0 px-8 py-4 border-t border-white/5 bg-[#111111] flex items-center justify-between text-gray-400 z-10">
                <div className="flex gap-6">
                    <button className="flex items-center gap-2 text-[12px] font-medium hover:text-white transition-colors">
                        <Settings size={14} /> Round Settings
                    </button>
                    <button className="flex items-center gap-2 text-[12px] font-medium hover:text-white transition-colors">
                        <Users size={14} /> Assign Referees
                    </button>
                </div>
            </footer>

            {/* ── Create Race Modal ── */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-[600px] bg-[#161616] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]">
                            <h2 className="text-[18px] font-bold text-white tracking-tight leading-tight">Create New Race</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[60vh] custom-scrollbar">
                            {/* Form Fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Race Title</label>
                                    <input type="text" placeholder="e.g. Royal Ascot Gold Cup" className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50" />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Tournament</label>
                                    <select className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 appearance-none">
                                        <option value="none">Non-tournament</option>
                                        <option value="autumn">Autumn Series</option>
                                        <option value="global">Global Championship</option>
                                        <option value="summer">Summer Sprint Cup</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Race Type</label>
                                    <select
                                        value={createRaceType}
                                        onChange={(e) => setCreateRaceType(e.target.value as RaceType)}
                                        className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 appearance-none"
                                    >
                                        <option value="Stakes">Stakes (Top tier)</option>
                                        <option value="Allowance">Allowance (Middle tier)</option>
                                        <option value="Claiming">Claiming (Open/Purchase)</option>
                                        <option value="Maiden">Maiden (0 wins)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Track Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                        <input type="text" list="tracks-list" placeholder="Select or enter custom..." className="w-full bg-[#111] border border-white/10 rounded p-2.5 pl-9 text-[13px] text-white focus:outline-none focus:border-red-500/50" />
                                        <datalist id="tracks-list">
                                            {TRACKS.map(t => <option key={t.id} value={t.name} />)}
                                        </datalist>
                                    </div>
                                </div>
                            </div>

                            {createRaceType === "Stakes" && (
                                <div>
                                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Stakes Grade (Subtype)</label>
                                    <select className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 appearance-none">
                                        <option value="G1">Grade 1 (G1)</option>
                                        <option value="G2">Grade 2 (G2)</option>
                                        <option value="G3">Grade 3 (G3)</option>
                                        <option value="Listed">Listed (Ungraded)</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Address</label>
                                <input type="text" placeholder="e.g. 123 Racing Blvd, City" className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                        <input type="date" className="w-full bg-[#111] border border-white/10 rounded p-2.5 pl-9 text-[13px] text-white focus:outline-none focus:border-red-500/50 [color-scheme:dark]" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Start Time</label>
                                    <input type="time" defaultValue="14:00" className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 [color-scheme:dark]" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                                    Invite Horse Owners <span className="text-gray-500 normal-case ml-1 font-normal">(Auto-filtered for {createRaceType} eligibility)</span>
                                </label>
                                <div className="p-3 bg-[#111] border border-white/10 rounded flex flex-col gap-2 max-h-[140px] overflow-y-auto custom-scrollbar">
                                    {MOCK_OWNERS.filter(owner => owner.horses.some(h => checkEligibility(h, createRaceType))).map((owner) => {
                                        const eligibleHorses = owner.horses.filter(h => checkEligibility(h, createRaceType));
                                        return (
                                            <label key={owner.id} className="flex items-start gap-3 p-2 cursor-pointer group hover:bg-white/5 rounded transition-colors">
                                                <input type="checkbox" className="w-3.5 h-3.5 mt-1 accent-red-600 rounded bg-black border-white/20" />
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-semibold text-white group-hover:text-red-400 transition-colors">{owner.ownerName}</span>
                                                    <span className="text-[11px] text-gray-500">
                                                        Eligible: {eligibleHorses.map(h => `${h.name} (${h.wins}w)`).join(", ")}
                                                    </span>
                                                </div>
                                            </label>
                                        );
                                    })}
                                    {MOCK_OWNERS.filter(owner => owner.horses.some(h => checkEligibility(h, createRaceType))).length === 0 && (
                                        <div className="text-[12px] text-gray-500 p-2 italic text-center">No eligible horse owners found for this race type.</div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                                    Assign Referee <span className="text-gray-500 normal-case ml-1 font-normal">(Optional)</span>
                                </label>
                                <div className="p-3 bg-[#111] border border-white/10 rounded flex flex-col gap-2">
                                    <div className="relative mb-2">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                        <input 
                                            type="text" 
                                            placeholder="Search referee by name..." 
                                            value={refereeSearchQuery}
                                            onChange={(e) => setRefereeSearchQuery(e.target.value)}
                                            className="w-full bg-[#1a1a1a] border border-white/10 rounded py-1.5 pl-9 pr-3 text-[12px] text-white focus:outline-none focus:border-red-500/50"
                                        />
                                    </div>
                                    <div className="max-h-[120px] overflow-y-auto custom-scrollbar flex flex-col gap-1">
                                        {MOCK_REFEREES.filter(r => r.name.toLowerCase().includes(refereeSearchQuery.toLowerCase())).map((ref) => (
                                            <label key={ref.id} className="flex items-center gap-3 p-2 cursor-pointer group hover:bg-white/5 rounded transition-colors">
                                                <input type="checkbox" className="w-3.5 h-3.5 accent-red-600 rounded bg-black border-white/20" />
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-semibold text-white group-hover:text-red-400 transition-colors">{ref.name}</span>
                                                    <span className="text-[11px] text-gray-500">{ref.experience}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t border-white/5 bg-[#1a1a1a] flex justify-end gap-3">
                            <button onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2 rounded text-[13px] font-medium text-gray-400 hover:text-white transition-colors">
                                Cancel
                            </button>
                            <button onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2 rounded text-[13px] font-medium text-white bg-red-700 hover:bg-red-600 transition-colors shadow-lg shadow-red-900/20">
                                Create Race
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
