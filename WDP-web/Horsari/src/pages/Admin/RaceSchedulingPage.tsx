import { useState, useEffect } from "react";
import { LayoutGrid, List, Plus, Settings, Users, Loader2 } from "lucide-react";
import { TIME_SLOTS } from "../../shared/data/RaceData";
import type { ViewMode } from "../../shared/types/RaceTypes";
import CreateRaceModal from "./modal/CreateRaceModal";
import RaceDetailsPanel from "./AdminComponents/RaceDetailsPanel";
import { adminService, type TournamentRaceData } from "../../api/adminService";

export default function RaceSchedulingPage() {
    const [viewMode, setViewMode] = useState<ViewMode>("timeline");
    const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [raceToEdit, setRaceToEdit] = useState<any>(null);
    const [selectedTournament, setSelectedTournament] = useState<string>("All");
    const [selectedStatus, setSelectedStatus] = useState<string>("All");

    const [tournaments, setTournaments] = useState<any[]>([]);
    const [raceRoundsData, setRaceRoundsData] = useState<TournamentRaceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tournamentsRes, raceRoundsRes] = await Promise.all([
                adminService.getTournamentsWithDetails(1, 100),
                adminService.getRaceRounds()
            ]);
            setTournaments(tournamentsRes.data?.items || []);
            setRaceRoundsData(raceRoundsRes.data || []);
        } catch (err) {
            console.error("Failed to fetch scheduling data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEditRace = (race: any) => {
        if (!race) return;
        const rawRace = raceRoundsData.flatMap(t => t.RaceRound).find(r => r._id === race.id);
        if (rawRace) {
            setRaceToEdit(rawRace);
            setIsCreateModalOpen(true);
        }
    };

    const getTimelineOffsets = (dateString: string) => {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return { leftPercent: "0%", widthPercent: "15%" };

        const hours = d.getHours() + d.getMinutes() / 60;
        // Base 09:00 = 0%, 17:00 = 100%
        const totalHours = 8; // 17 - 9
        const offset = Math.max(0, Math.min(hours - 9, totalHours));
        const leftPercent = (offset / totalHours) * 100;
        return {
            leftPercent: `${leftPercent}%`,
            widthPercent: "12.5%" // fixed 1-hour duration for visual
        };
    };

    const ALL_RACES = raceRoundsData.flatMap(t => {
        return t.RaceRound.map((rr) => {
            const dateObj = new Date(rr.raceDate);
            const timeStr = isNaN(dateObj.getTime()) ? "TBD" : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = isNaN(dateObj.getTime()) ? "TBD" : dateObj.toLocaleDateString();
            const { leftPercent, widthPercent } = getTimelineOffsets(rr.raceDate);

            return {
                id: rr._id,
                trackId: rr.location || "TBD",
                title: rr.roundName,
                tournament: t.Tournaments_name,
                date: dateStr,
                time: timeStr,
                status: rr.status,
                participants: (rr.Registration || []).map((reg) => ({
                    registrationId: reg._id,
                    ownerName: reg.Owner?.fullName ?? 'Unknown Owner',  // Owner is now plain User {_id, fullName}
                    horseName: reg.Horse?.horseName ?? null,
                    jockeyName: reg.Jockey?._id?.fullName ?? null,
                    status: reg.registrationStatus ?? 'pending',
                })),
                referees: (rr.Referee || []).map((ref) => ({
                    refereeId: ref.refereeId,
                    fullName: ref.fullName ?? 'Unknown Referee',  // fullName is now a top-level field
                    assignmentStatus: ref.assignmentStatus ?? 'pending',
                    fee: ref.fee,
                })),
                pendingInvites: [],
                maxSlots: rr.maxParticipants || 0,
                leftPercent,
                widthPercent,
                rawDate: dateObj,
                trackLength: rr.trackLength || 0,
                raceType: rr.RaceType || rr.raceType || "Standard"
            };
        });
    });

    // Date computation
    const uniqueDates = Array.from(new Set(ALL_RACES.map(r => r.date))).filter(d => d !== "TBD");
    uniqueDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    // Auto-select a date if none is selected
    useEffect(() => {
        if (uniqueDates.length > 0 && (!selectedDate || !uniqueDates.includes(selectedDate))) {
            setSelectedDate(uniqueDates[0]);
        }
    }, [uniqueDates, selectedDate]);

    const uniqueStatuses = Array.from(new Set(ALL_RACES.map(r => r.status))).filter(Boolean);

    // Apply tournament filter and conditionally apply date filter (only for timeline view)
    const filteredRaces = ALL_RACES.filter(r => {
        const matchTournament = selectedTournament === "All" || r.tournament === selectedTournament;
        const matchStatus = selectedStatus === "All" || r.status === selectedStatus;
        const matchDate = viewMode === "timeline" && selectedDate ? r.date === selectedDate : true;
        return matchTournament && matchStatus && matchDate;
    }).sort((a, b) => {
        if (a.status === 'cancelled' && b.status !== 'cancelled') return 1;
        if (a.status !== 'cancelled' && b.status === 'cancelled') return -1;
        return a.rawDate.getTime() - b.rawDate.getTime();
    });

    const TRACKS_DYNAMIC = Array.from(new Set(filteredRaces.map(r => r.trackId))).map(loc => ({
        id: loc,
        name: loc,
        surface: "Dirt", // default fallback
        distance: "1200m" // default fallback
    }));

    const selectedRace = ALL_RACES.find(r => r.id === selectedRaceId);

    const handlePrevDate = () => {
        if (!selectedDate) return;
        const currentIndex = uniqueDates.indexOf(selectedDate);
        if (currentIndex > 0) {
            setSelectedDate(uniqueDates[currentIndex - 1]);
        }
    };

    const handleNextDate = () => {
        if (!selectedDate) return;
        const currentIndex = uniqueDates.indexOf(selectedDate);
        if (currentIndex < uniqueDates.length - 1) {
            setSelectedDate(uniqueDates[currentIndex + 1]);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#111111] text-white overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

            {/* ── Top Content Area ── */}
            <div className="flex-1 grid grid-cols-[340px_1fr] gap-8 p-8 min-h-0">

                {/* ── Left Panel (Race Details) ── */}
                <RaceDetailsPanel 
                    selectedRace={selectedRace as any} 
                    onRefresh={fetchData} 
                    onEdit={() => handleEditRace(selectedRace)}
                />

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
                                {tournaments.map(t => (
                                    <option key={t.tournament._id} value={t.tournament.tournamentName}>{t.tournament.tournamentName}</option>
                                ))}
                            </select>

                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="bg-[#1a1a1a] border border-white/10 rounded-md px-3 text-[12px] text-gray-300 focus:outline-none focus:border-white/20 h-[34px] appearance-none cursor-pointer capitalize"
                            >
                                <option value="All">All Statuses</option>
                                {uniqueStatuses.map(status => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
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
                    <div className="flex-1 relative mt-6 rounded-xl border border-white/5 overflow-hidden min-h-0">
                        {loading && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#141414]/80 backdrop-blur-sm">
                                <Loader2 className="animate-spin text-red-500" size={32} />
                            </div>
                        )}
                        <div className="h-full w-full overflow-auto bg-[#141414] custom-scrollbar">
                            {viewMode === "timeline" ? (
                            <div className="min-w-[1600px] border border-white/5 rounded-lg overflow-hidden bg-[#161616]">
                                {/* Time Headers */}
                                <div className="sticky top-0 z-30 flex border-b border-white/5 bg-[#1a1a1a]">
                                    <div className="w-[200px] shrink-0 border-r border-white/5 px-2 py-3 flex items-center justify-between bg-[#151515]">
                                        <button
                                            onClick={handlePrevDate}
                                            disabled={!uniqueDates.length || selectedDate === uniqueDates[0]}
                                            className="p-1 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded hover:bg-white/5 flex items-center justify-center"
                                        >
                                            &larr;
                                        </button>
                                        <div className="text-[11px] font-bold tracking-widest text-white uppercase text-center flex-1">
                                            {selectedDate || "N/A"}
                                        </div>
                                        <button
                                            onClick={handleNextDate}
                                            disabled={!uniqueDates.length || selectedDate === uniqueDates[uniqueDates.length - 1]}
                                            className="p-1 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded hover:bg-white/5 flex items-center justify-center"
                                        >
                                            &rarr;
                                        </button>
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
                                    {TRACKS_DYNAMIC.length === 0 && !loading && (
                                        <div className="p-8 text-center text-gray-500 text-[13px]">No races scheduled for this date.</div>
                                    )}
                                    {TRACKS_DYNAMIC.map(track => (
                                        <div key={track.id} className="flex border-b border-white/5 last:border-b-0 min-h-[120px]">

                                            {/* Track Info (Y-axis label) */}
                                            <div className="w-[200px] shrink-0 border-r border-white/5 p-5 bg-[#181818] flex flex-col justify-center gap-1">
                                                <span className="text-[14px] font-semibold text-white truncate">{track.name}</span>
                                                <span className="text-[12px] text-gray-500">{track.surface}</span>
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
                                                            className={`absolute top-1/2 -translate-y-1/2 h-[70px] border rounded-md p-3 shadow-lg shadow-black/40 transition-all cursor-pointer flex flex-col justify-between ${
                                                                race.status === 'cancelled' ? 'bg-[#161111] border-red-900/30 opacity-60 z-0' : 'bg-[#1f1a1a] z-10'
                                                            } ${isSelected ? "border-red-500 ring-1 ring-red-500/50 !z-20" : "border-[#f3b2a5]/30 hover:border-[#f3b2a5]/60"}`}
                                                            style={{ left: race.leftPercent, width: race.widthPercent }}
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <span className={`text-[13px] font-semibold truncate pr-2 ${race.status === 'cancelled' ? 'text-gray-500 line-through' : 'text-white'}`}>{race.title}</span>
                                                                <span className="text-[12px] font-medium text-[#f3b2a5] shrink-0">{race.time}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between mt-auto">
                                                                <span className="text-[11px] text-gray-400">{race.participants.filter((p: any) => p.status === 'approved').length}/{race.maxSlots} Slots</span>
                                                                <div className="flex gap-1 items-center">
                                                                    {race.status === 'cancelled' && <span className="text-[10px] text-red-500 font-bold uppercase mr-1">Cancelled</span>}
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                                        race.status === 'cancelled' ? 'bg-red-500' :
                                                                        race.status === 'running' ? 'bg-blue-500' :
                                                                        race.status === 'completed' ? 'bg-gray-500' :
                                                                        race.status === 'scheduled' ? 'bg-emerald-500' :
                                                                        'bg-amber-500'
                                                                    }`}></span>
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
                                            const isSelected = selectedRaceId === race.id;
                                            return (
                                                <tr
                                                    key={race.id}
                                                    onClick={() => setSelectedRaceId(isSelected ? null : race.id)}
                                                    className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${isSelected ? "bg-red-900/10" : ""}`}
                                                >
                                                    <td className="p-4">
                                                        <div className={`text-[13px] font-semibold ${race.status === 'cancelled' ? 'text-gray-500 line-through' : 'text-white'}`}>{race.title}</div>
                                                        <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border inline-block mt-1 ${
                                                            race.status === 'cancelled' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                                                            race.status === 'scheduled' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                                                            race.status === 'running' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                                                            race.status === 'completed' ? 'bg-gray-500/15 text-gray-400 border-gray-500/30' :
                                                            'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                                        }`}>{race.status}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="text-[13px] text-gray-300">{race.trackId}</div>
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
                                                                    style={{ width: `${(race.participants.filter((p: any) => p.status === 'approved').length / Math.max(race.maxSlots, 1)) * 100}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[12px] font-medium text-gray-400 min-w-[32px]">
                                                                {race.participants.filter((p: any) => p.status === 'approved').length}/{race.maxSlots}
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

            {/* Modals */}
            <CreateRaceModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setRaceToEdit(null);
                }}
                onSuccess={fetchData}
                raceToEdit={raceToEdit}
            />
        </div>
    );
}
