import { useState, useEffect } from "react";
import { LayoutGrid, List, Plus, Loader2 } from "lucide-react";
import { Pagination } from "../../components/Pagination";
import type { ViewMode } from "../../shared/types/RaceTypes";
import CreateRaceModal from "./modal/CreateRaceModal";
import RaceDetailsPanel from "./AdminComponents/RaceDetailsPanel";
import { adminService, type RaceRoundData } from "../../api/adminService";

export default function RaceSchedulingPage() {
    const [viewMode, setViewMode] = useState<ViewMode>("timeline");
    const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [raceToEdit, setRaceToEdit] = useState<any>(null);
    const [selectedTournament, setSelectedTournament] = useState<string>("All");
    const [selectedStatus, setSelectedStatus] = useState<string>("All");
    const [tablePage, setTablePage] = useState(1);
    const TABLE_ITEMS_PER_PAGE = 5;

    const [tournaments, setTournaments] = useState<any[]>([]);
    const [raceRoundsData, setRaceRoundsData] = useState<RaceRoundData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);


    const TIME_SLOTS = ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];

    const fetchData = async () => {
        setLoading(true);
        try {
            const tournamentsRes = await adminService.getTournamentsWithDetails(1, 100);
            setTournaments(tournamentsRes.data?.items || []);

            const raceRoundsRes = await adminService.getRaceRounds();
            setRaceRoundsData(raceRoundsRes.data?.items ?? []);
        } catch (err) {
            console.error("Failed to fetch scheduling data", err);
        } finally {
            setLoading(false);
        }
    };


    const handleDataRefresh = async (updateInfo?: { type: 'CREATE' | 'UPDATE'; tournament_id?: string; raceRound_id?: string }) => {
        await fetchData();
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        setTablePage(1);
    }, [selectedTournament, selectedStatus, selectedDate, viewMode]);

    const handleEditRace = async (race: any) => {
        if (!race) return;
        const rawRace = raceRoundsData.find(r => r._id === race.id);
        if (rawRace) {
            try {
                const res = await adminService.getRaceRoundDetail(rawRace._id);
                if (res.data) {
                    setRaceToEdit(res.data);
                    setIsCreateModalOpen(true);
                }
            } catch (err) {
                console.error("Failed to fetch detailed race for edit", err);
            }
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

    const ALL_RACES = raceRoundsData.map((rr) => {
        const dateObj = new Date(rr.raceDate);
        const timeStr = isNaN(dateObj.getTime()) ? "TBD" : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = isNaN(dateObj.getTime()) ? "TBD" : dateObj.toLocaleDateString();
        const { leftPercent, widthPercent } = getTimelineOffsets(rr.raceDate);

        const parentTournament = tournaments.find(t => t.tournament._id === rr.tournamentId);
        const tournamentName = parentTournament ? parentTournament.tournament.tournamentName : "Unknown Tournament";

        return {
            id: rr._id,
            trackId: rr.location || "TBD",
            title: rr.roundName,
            tournament: tournamentName,
            date: dateStr,
            time: timeStr,
            status: rr.status,
            participants: [],
            referees: [],
            pendingInvites: [],
            maxSlots: rr.maxParticipants || 0,
            leftPercent,
            widthPercent,
            rawDate: dateObj,
            trackLength: rr.trackLength || 0,
            raceType: rr.RaceType || rr.raceType || "Standard"
        };
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
        <div className="flex flex-col h-full bg-[#111111] text-white overflow-hidden font-sans">


            {/* ── Top Content Area ── */}
            <div className="flex-1 flex gap-4 px-6 py-5 min-h-0">

                {/* ── Main Timeline Area ── */}
                <main className={`flex flex-col min-w-0 h-full transition-all duration-200 ${selectedRaceId ? "flex-[0_0_55%]" : "flex-1"}`}>
                    {/* Header — row 1: title + actions, row 2: view toggle + filters */}
                    <header className="pb-5 flex flex-col gap-3 border-b border-white/5 shrink-0">
                        {/* Row 1 */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <h1 className="text-[22px] font-bold text-white tracking-tight leading-tight truncate font-serif">
                                    Master Race Schedule
                                </h1>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-[10px] font-semibold tracking-wide text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase whitespace-nowrap">
                                        All Scheduled Races
                                    </span>
                                    <span className="text-[12px] text-gray-500 truncate">· {selectedTournament === "All" ? "Across All Tournaments" : selectedTournament}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="shrink-0 flex items-center gap-2 px-4 text-[12px] font-medium text-white bg-[#ab3030] rounded hover:bg-[#8f2828] transition-colors shadow-lg shadow-red-900/20 h-[32px]"
                            >
                                <Plus size={13} /> Create Race
                            </button>
                        </div>

                        {/* Row 2 */}
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* View Mode Toggle */}
                            <div className="flex bg-[#1a1a1a] p-1 rounded-lg border border-white/5 shrink-0">
                                <button
                                    onClick={() => setViewMode("timeline")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${viewMode === "timeline" ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-white"}`}
                                >
                                    <LayoutGrid size={13} /> Timeline
                                </button>
                                <button
                                    onClick={() => setViewMode("table")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${viewMode === "table" ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-white"}`}
                                >
                                    <List size={13} /> Table
                                </button>
                            </div>

                            <select
                                value={selectedTournament}
                                onChange={(e) => setSelectedTournament(e.target.value)}
                                className="flex-1 min-w-0 bg-[#1a1a1a] border border-white/10 rounded-md px-3 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
                            >
                                <option value="All">All Tournaments</option>
                                {tournaments.map(t => (
                                    <option key={t.tournament._id} value={t.tournament.tournamentName}>{t.tournament.tournamentName}</option>
                                ))}
                            </select>

                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-[130px] shrink-0 bg-[#1a1a1a] border border-white/10 rounded-md px-3 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer capitalize"
                            >
                                <option value="All">All Statuses</option>
                                {uniqueStatuses.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
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
                                <div className="min-w-[1600px] border border-white/5 rounded-lg bg-[#161616]">
                                    {/* Time Headers */}
                                    <div className="sticky top-0 z-40 flex border-b border-white/5 bg-[#1a1a1a]">
                                        <div className="sticky left-0 z-50 w-[200px] shrink-0 border-r border-white/5 px-2 py-3 flex items-center justify-between bg-[#151515] shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
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
                                                <div className="sticky left-0 z-30 w-[200px] shrink-0 border-r border-white/5 p-5 bg-[#181818] flex flex-col justify-center gap-1 shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
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
                                                                className={`absolute top-1/2 -translate-y-1/2 h-[70px] border rounded-md p-3 shadow-lg shadow-black/40 transition-all cursor-pointer flex flex-col justify-between ${race.status === 'cancelled' ? 'bg-[#161111] border-red-900/30 opacity-60 z-0' : 'bg-[#1f1a1a] z-10'
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
                                                                        <span className={`w-1.5 h-1.5 rounded-full ${race.status === 'cancelled' ? 'bg-red-500' :
                                                                            race.status === 'running' ? 'bg-blue-500' :
                                                                                race.status === 'completed' ? 'bg-gray-500' :
                                                                                    race.status === 'scheduled' ? 'bg-emerald-500' :
                                                                                        race.status === 'prepared' ? 'bg-violet-500' :
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
                                            {filteredRaces.slice((tablePage - 1) * TABLE_ITEMS_PER_PAGE, tablePage * TABLE_ITEMS_PER_PAGE).map(race => {
                                                const isSelected = selectedRaceId === race.id;
                                                return (
                                                    <tr
                                                        key={race.id}
                                                        onClick={() => setSelectedRaceId(isSelected ? null : race.id)}
                                                        className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${isSelected ? "bg-red-900/10" : ""}`}
                                                    >
                                                        <td className="p-4">
                                                            <div className={`text-[13px] font-semibold ${race.status === 'cancelled' ? 'text-gray-500 line-through' : 'text-white'}`}>{race.title}</div>
                                                            <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border inline-block mt-1 ${race.status === 'cancelled' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                                                                race.status === 'scheduled' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                                                                    race.status === 'running' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                                                                        race.status === 'completed' ? 'bg-gray-500/15 text-gray-400 border-gray-500/30' :
                                                                            race.status === 'prepared' ? 'bg-violet-500/15 text-violet-400 border-violet-500/30' :
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
                                    <Pagination
                                        page={tablePage}
                                        totalPages={Math.ceil(filteredRaces.length / TABLE_ITEMS_PER_PAGE) || 1}
                                        totalItems={filteredRaces.length}
                                        limit={TABLE_ITEMS_PER_PAGE}
                                        onPageChange={setTablePage}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* ── Right Panel (Race Details) ── */}
                {selectedRaceId && (
                    <div className="flex-1 min-w-[380px] min-h-0">
                        <RaceDetailsPanel
                            selectedRace={selectedRace as any}
                            onRefresh={handleDataRefresh}
                            onEdit={() => handleEditRace(selectedRace)}
                            onClose={() => setSelectedRaceId(null)}
                        />
                    </div>
                )}
            </div>



            {/* Modals */}
            <CreateRaceModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setRaceToEdit(null);
                }}
                onSuccess={() => handleDataRefresh()}
                raceToEdit={raceToEdit}
            />
        </div>
    );
}
