import { useState } from "react";
import { LayoutGrid, List, Plus, Settings, Users } from "lucide-react";
import { SCHEDULED_RACES, TRACKS, TIME_SLOTS } from "../../shared/data/RaceData";
import type { ViewMode } from "../../shared/types/RaceTypes";
import { TOURNAMENTS } from "../../shared/data/TournamentData";
import CreateRaceModal from "./modal/CreateRaceModal";
import RaceDetailsPanel from "./AdminComponents/RaceDetailsPanel";

export default function RaceSchedulingPage() {
    const [viewMode, setViewMode] = useState<ViewMode>("timeline");
    const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTournament, setSelectedTournament] = useState<string>("All");

    const filteredRaces = selectedTournament === "All" 
        ? SCHEDULED_RACES 
        : SCHEDULED_RACES.filter(r => r.tournament === selectedTournament);

    const selectedRace = SCHEDULED_RACES.find(r => r.id === selectedRaceId);

    return (
        <div className="flex flex-col h-full bg-[#111111] text-white overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

            {/* ── Top Content Area ── */}
            <div className="flex-1 grid grid-cols-[280px_1fr] gap-8 p-8 min-h-0">

                {/* ── Left Panel (Race Details) ── */}
                <RaceDetailsPanel selectedRace={selectedRace} />

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
                                <span className="text-[13px] text-gray-500">· {selectedTournament === "All" ? "Across All Tournaments" : selectedTournament}</span>
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

                        <div className="flex gap-3 items-center">
                            <select 
                                value={selectedTournament} 
                                onChange={(e) => setSelectedTournament(e.target.value)}
                                className="bg-[#1a1a1a] border border-white/10 rounded-md px-3 text-[12px] text-gray-300 focus:outline-none focus:border-white/20 h-[34px] appearance-none cursor-pointer"
                            >
                                <option value="All">All Tournaments</option>
                                {TOURNAMENTS.map(t => (
                                    <option key={t.id} value={t.name}>{t.name}</option>
                                ))}
                            </select>

                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2 px-5 text-[13px] font-medium text-white bg-[#ab3030] rounded hover:bg-[#8f2828] transition-colors shadow-lg shadow-red-900/20 h-[34px]"
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
                                                {filteredRaces.filter(r => r.trackId === track.id).map(race => {
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
                                        {filteredRaces.map(race => {
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
            <CreateRaceModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
        </div>
    );
}
