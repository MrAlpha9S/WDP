import { useState, useEffect, useRef, useCallback } from "react";
import { GanttChart, List, Plus, Loader2 } from "lucide-react";
import { Pagination } from "../../components/Pagination";
import type { ViewMode } from "../../shared/types/RaceTypes";
import CreateRaceModal from "./modal/CreateRaceModal";
import RaceDetailsPanel from "./AdminComponents/RaceDetailsPanel";
import { adminService, type RaceRoundData, type TournamentNameOption } from "../../api/adminService";
import { useSocket } from "../../providers/SocketProvider";
import { ErrorState } from "../../components/ErrorState";
import { calendarDayKey } from "../../utils/raceDayUtil";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import StatusBadge, { type BadgeTone } from "../../components/ui/StatusBadge";

// RaceRound.status is a fixed schema enum (entities/RaceRound.js) — hardcoded here
// rather than derived from fetched data, since fetched data is now itself
// status-filtered server-side and would otherwise collapse the option list.
const RACE_STATUSES = ["draft", "scheduled", "running", "completed", "cancelled", "awaitingConfirmation", "prepared"];
const RACE_ROUNDS_LIMIT_OPTIONS = [5, 10, 25, 50, 100, 200];

// One tone per status — covers all 7 RACE_STATUSES with the 6 hues the design
// token set defines; draft/awaitingConfirmation share amber since neither is
// visually distinct enough from the others to warrant expanding the token set further.
const RACE_STATUS_TONE: Record<string, BadgeTone> = {
    cancelled: "red",
    running: "blue",
    completed: "neutral",
    scheduled: "green",
    prepared: "violet",
    draft: "amber",
    awaitingConfirmation: "amber",
};
const RACE_STATUS_DOT: Record<string, string> = {
    cancelled: "bg-red", running: "bg-blue", completed: "bg-white/40",
    scheduled: "bg-green", prepared: "bg-violet", draft: "bg-amber", awaitingConfirmation: "bg-amber",
};

export default function RaceSchedulingPage() {
    const [viewMode, setViewMode] = useState<ViewMode>("timeline");
    const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [raceToEdit, setRaceToEdit] = useState<any>(null);
    const [selectedTournament, setSelectedTournament] = useState<string>("All");
    const [selectedStatus, setSelectedStatus] = useState<string>("All");
    const [selectedRaceType, setSelectedRaceType] = useState<string>("All");
    const [raceRoundsLimit, setRaceRoundsLimit] = useState<number>(50);
    const [tablePage, setTablePage] = useState(1);

    const [tournaments, setTournaments] = useState<TournamentNameOption[]>([]);
    const [raceTypes, setRaceTypes] = useState<string[]>([]);
    const [raceTypesActiveOnly, setRaceTypesActiveOnly] = useState(true);
    const [raceRoundsData, setRaceRoundsData] = useState<RaceRoundData[]>([]);
    const [raceRoundsPagination, setRaceRoundsPagination] = useState({ totalItems: 0, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    // Distinct Vietnam-calendar-day keys with matching race rounds — the Timeline view's
    // actual "pagination": each entry is a fetchable day, independent of raceRoundsLimit.
    const [timelineDates, setTimelineDates] = useState<string[]>([]);
    const timelineScrollRef = useRef<HTMLDivElement>(null);


    // Full-day axis (00:00 -> 23:59). Ticks are shown every 2h so labels don't
    // crowd the header; race positioning below still derives from the full
    // 24h range so a race's left offset stays accurate to the minute.
    const TIMELINE_TOTAL_HOURS = 24;
    const TIME_SLOTS = Array.from({ length: TIMELINE_TOTAL_HOURS / 2 }, (_, i) => `${String(i * 2).padStart(2, '0')}:00`);
    // Each 2h slot gets a fixed pixel width (the timeline area scrolls
    // horizontally, so we don't need to squeeze columns to fit the viewport)
    // and a race block spans a full slot's width so its title/time don't clip.
    const TIMELINE_COLUMN_WIDTH = 220;
    const TIMELINE_LABEL_WIDTH = 200;
    const TIMELINE_CONTENT_WIDTH = TIMELINE_LABEL_WIDTH + TIME_SLOTS.length * TIMELINE_COLUMN_WIDTH;

    // Table view pages through the server's results (page/limit). Timeline view instead
    // fetches one calendar day at a time via `date` — the day itself is the "page", drawn
    // from `timelineDates` (see fetchTimelineDates below) rather than a row-offset, since a
    // race round happens on one specific day rather than spanning a range the way a
    // tournament does. If no day is selected yet (dates still loading, or none match the
    // current filters), there's nothing sensible to fetch, so it's skipped entirely.
    const fetchData = useCallback(async (pageOverride?: number) => {
        setLoading(true);
        setError(null);
        try {
            const tournamentsRes = await adminService.getTournamentNames();
            setTournaments(tournamentsRes.data || []);

            const isTable = viewMode === 'table';
            if (!isTable && !selectedDate) {
                setRaceRoundsData([]);
                setRaceRoundsPagination({ totalItems: 0, totalPages: 1 });
                return;
            }

            const page = isTable ? (pageOverride ?? tablePage) : 1;
            const raceRoundsRes = await adminService.getRaceRounds(
                selectedTournament !== "All" ? selectedTournament : undefined, undefined, page, raceRoundsLimit,
                selectedStatus !== "All" ? selectedStatus : undefined,
                undefined, undefined, undefined,
                selectedRaceType !== "All" ? selectedRaceType : undefined,
                isTable ? undefined : (selectedDate ?? undefined),
            );
            setRaceRoundsData(raceRoundsRes.data?.items ?? []);
            setRaceRoundsPagination({
                totalItems: raceRoundsRes.data?.pagination?.totalItems ?? 0,
                totalPages: raceRoundsRes.data?.pagination?.totalPages ?? 1,
            });
        } catch (err: any) {
            console.error("Failed to fetch scheduling data", err);
            setError(err?.msg ?? "Failed to fetch scheduling data.");
        } finally {
            setLoading(false);
        }
    }, [viewMode, selectedDate, selectedTournament, selectedStatus, selectedRaceType, raceRoundsLimit, tablePage]);

    // The Timeline day-navigation list — independent of raceRoundsLimit/tablePage, since
    // it's a lightweight day list, not full race data. Mirrors how TournamentManagementPage's
    // fetchCalendarTournaments fetches its own month-scoped data separately from the table.
    const fetchTimelineDates = useCallback(async () => {
        try {
            const res = await adminService.getRaceRoundDates(
                selectedTournament !== "All" ? selectedTournament : undefined,
                selectedStatus !== "All" ? selectedStatus : undefined,
                selectedRaceType !== "All" ? selectedRaceType : undefined,
            );
            setTimelineDates(res.data?.dates ?? []);
        } catch (err) {
            console.error("Failed to fetch race round dates", err);
        }
    }, [selectedTournament, selectedStatus, selectedRaceType]);

    useEffect(() => { fetchTimelineDates(); }, [fetchTimelineDates]);

    const handleDataRefresh = useCallback(async () => {
        await fetchData();
        fetchTimelineDates();
    }, [fetchData, fetchTimelineDates]);

    const handleTablePageChange = (p: number) => {
        setTablePage(p);
        fetchData(p);
    };

    // Race-type dropdown options — independent of the race-rounds fetch above,
    // only re-runs when the active/inactive-rules toggle changes.
    useEffect(() => {
        // Toggle ON → only active rules; toggle OFF → all rules (both active and
        // inactive), i.e. no isActive filter at all — NOT isActive:false, which
        // would incorrectly show only inactive rules.
        adminService.getRaceTypes(raceTypesActiveOnly ? true : undefined)
            .then(res => setRaceTypes(res.data ?? []))
            .catch(() => { });
    }, [raceTypesActiveOnly]);

    // Any RaceRound mutation, from any source (admin or referee action, the
    // simulation engine, another admin's tab), broadcasts raceround_updated —
    // keep this page's schedule live instead of only ever fetching once.
    const { socket } = useSocket();
    useEffect(() => {
        if (!socket) return;
        socket.on("raceround_updated", handleDataRefresh);
        return () => { socket.off("raceround_updated", handleDataRefresh); };
    }, [socket, handleDataRefresh]);

    useEffect(() => {
        setTablePage(1);
        fetchData(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTournament, selectedStatus, selectedRaceType, raceRoundsLimit, viewMode, selectedDate]);

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
        // Base 00:00 = 0%, 24:00 = 100% — same range as TIME_SLOTS above.
        const offset = Math.max(0, Math.min(hours, TIMELINE_TOTAL_HOURS));
        const leftPercent = (offset / TIMELINE_TOTAL_HOURS) * 100;
        return {
            leftPercent: `${leftPercent}%`,
            widthPercent: `${(2 / TIMELINE_TOTAL_HOURS) * 100}%` // fixed 2-hour duration for visual — matches one timeline column's width
        };
    };

    const ALL_RACES = raceRoundsData.map((rr) => {
        const dateObj = new Date(rr.raceDate);
        const timeStr = isNaN(dateObj.getTime()) ? "TBD" : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        // Vietnam-anchored day key — matches timelineDates/selectedDate so a race's day never
        // disagrees with the day list it's meant to be filed under (see fetchTimelineDates).
        // `dateLabel` is the separate, human-readable string the Table view displays.
        const dateStr = isNaN(dateObj.getTime()) ? "TBD" : calendarDayKey(rr.raceDate);
        const dateLabel = isNaN(dateObj.getTime()) ? "TBD" : dateObj.toLocaleDateString();
        const { leftPercent, widthPercent } = getTimelineOffsets(rr.raceDate);

        const parentTournament = tournaments.find(t => t._id === rr.tournamentId);
        const tournamentName = parentTournament ? parentTournament.tournamentName : "Unknown Tournament";

        return {
            id: rr._id,
            trackId: rr.location || "TBD",
            title: rr.roundName,
            tournament: tournamentName,
            date: dateStr,
            dateLabel,
            time: timeStr,
            status: rr.status,
            participants: [],
            referees: [],
            pendingInvites: [],
            acceptedCount: rr.acceptedCount ?? 0,
            maxSlots: rr.maxParticipants || 0,
            leftPercent,
            widthPercent,
            rawDate: dateObj,
            trackLength: rr.trackLength || 0,
            raceType: rr.RaceType || rr.raceType || "Standard"
        };
    });

    // Day list comes from the server (fetchTimelineDates) rather than being derived from
    // whatever races happen to already be loaded — see the comment on fetchData above.
    const uniqueDates = timelineDates;

    // Auto-select a date if none is selected
    useEffect(() => {
        if (uniqueDates.length > 0 && (!selectedDate || !uniqueDates.includes(selectedDate))) {
            setSelectedDate(uniqueDates[0]);
        } else if (uniqueDates.length === 0 && selectedDate) {
            setSelectedDate(null);
        }
    }, [uniqueDates, selectedDate]);

    // Tournament/status/race type are now all filtered server-side (see fetchData),
    // so ALL_RACES already only contains matching rounds — no client-side
    // matchTournament/matchStatus/matchRaceType needed here.
    const filteredRaces = ALL_RACES.filter(r => {
        const matchDate = viewMode === "timeline" && selectedDate ? r.date === selectedDate : true;
        return matchDate;
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

    // selectedDate is the canonical "YYYY-MM-DD" Vietnam day key (for matching/fetching) —
    // format it for display rather than showing the raw key.
    const selectedDateLabel = selectedDate
        ? new Date(`${selectedDate}T00:00:00+07:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : "N/A";

    // Whenever the visible day (or a filter narrowing its races) changes,
    // snap the horizontal scroll so the day's earliest race is right next to
    // the sticky track-label column, instead of leaving the user to hunt for
    // it by scrolling right themselves.
    useEffect(() => {
        const container = timelineScrollRef.current;
        if (!container || viewMode !== "timeline" || filteredRaces.length === 0) return;
        const earliest = filteredRaces.reduce((min, r) => r.rawDate.getTime() < min.rawDate.getTime() ? r : min);
        const offsetWithinTimeline = (parseFloat(earliest.leftPercent) / 100) * (TIME_SLOTS.length * TIMELINE_COLUMN_WIDTH);
        const SCROLL_PADDING = 24;
        container.scrollLeft = Math.max(0, offsetWithinTimeline - SCROLL_PADDING);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate, viewMode, selectedTournament, selectedStatus, selectedRaceType]);

    return (
        <div className="flex flex-col h-full bg-bg text-text overflow-hidden font-sans">


            {/* ── Top Content Area ── */}
            <div className="flex-1 flex gap-4 px-6 py-5 min-h-0">

                {/* ── Main Timeline Area ── */}
                <main className={`flex flex-col min-w-0 h-full transition-all duration-200 ${selectedRaceId ? "flex-[0_0_55%]" : "flex-1"}`}>
                    {/* Header — row 1: title + actions, row 2: view toggle + filters */}
                    <header className="pb-5 flex flex-col gap-3 border-b border-border/60 shrink-0">
                        <PageHeader
                            title="Master Race Schedule"
                            eyebrow="All Scheduled Races"
                            subtext={selectedTournament === "All" ? "Across All Tournaments" : (tournaments.find(t => t._id === selectedTournament)?.tournamentName ?? "Unknown Tournament")}
                            actions={
                                <Button size="sm" leftIcon={<Plus size={13} />} onClick={() => setIsCreateModalOpen(true)}>
                                    Create Race
                                </Button>
                            }
                        />

                        {/* Row 2 */}
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* View Mode Toggle */}
                            <div className="flex bg-surface p-1 rounded-lg border border-border/60 shrink-0">
                                <button
                                    onClick={() => setViewMode("timeline")}
                                    aria-pressed={viewMode === "timeline"}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${viewMode === "timeline" ? "bg-white/10 text-text shadow-sm" : "text-text-muted hover:text-text"}`}
                                >
                                    <GanttChart size={13} /> Timeline
                                </button>
                                <button
                                    onClick={() => setViewMode("table")}
                                    aria-pressed={viewMode === "table"}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${viewMode === "table" ? "bg-white/10 text-text shadow-sm" : "text-text-muted hover:text-text"}`}
                                >
                                    <List size={13} /> Table
                                </button>
                            </div>

                            <select
                                value={selectedTournament}
                                onChange={(e) => setSelectedTournament(e.target.value)}
                                aria-label="Filter by tournament"
                                className="flex-1 min-w-0 bg-surface border border-border rounded-md px-3 text-[11px] text-text-muted focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
                            >
                                <option value="All">All Tournaments</option>
                                {tournaments.map(t => (
                                    <option key={t._id} value={t._id}>{t.tournamentName}</option>
                                ))}
                            </select>

                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                aria-label="Filter by status"
                                className="w-[150px] shrink-0 bg-surface border border-border rounded-md px-3 text-[11px] text-text-muted focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer capitalize"
                            >
                                <option value="All">All Statuses</option>
                                {RACE_STATUSES.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>

                            <select
                                value={selectedRaceType}
                                onChange={(e) => setSelectedRaceType(e.target.value)}
                                aria-label="Filter by race type"
                                className="w-[150px] shrink-0 bg-surface border border-border rounded-md px-3 text-[11px] text-text-muted focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
                            >
                                <option value="All">All Race Types</option>
                                {raceTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>

                            <button
                                onClick={() => setRaceTypesActiveOnly(v => !v)}
                                title="Toggle whether the race-type list includes retired (inactive) eligibility rules"
                                aria-pressed={raceTypesActiveOnly}
                                className={`shrink-0 px-3 h-[32px] rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${raceTypesActiveOnly ? "bg-white/10 border-border text-text" : "bg-surface border-border text-text-muted hover:text-text"}`}
                            >
                                Active rules only
                            </button>

                            <select
                                value={raceRoundsLimit}
                                onChange={(e) => setRaceRoundsLimit(Number(e.target.value))}
                                aria-label="Rows per page"
                                className="w-[130px] shrink-0 bg-surface border border-border rounded-md px-3 text-[11px] text-text-muted focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
                            >
                                {RACE_ROUNDS_LIMIT_OPTIONS.map(n => (
                                    <option key={n} value={n}>{n} rows</option>
                                ))}
                            </select>
                        </div>
                    </header>

                    {/* Main Content Area (Timeline or Table) */}
                    <div className="flex-1 relative mt-6 rounded-xl border border-border/60 overflow-hidden min-h-0">
                        {loading && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-surface/80 backdrop-blur-sm">
                                <Loader2 className="animate-spin text-red" size={32} />
                            </div>
                        )}
                        {!loading && error ? (
                            <div className="h-full w-full flex items-center justify-center bg-surface p-6">
                                <ErrorState message={error} onRetry={fetchData} className="max-w-md" />
                            </div>
                        ) : (
                            <div ref={timelineScrollRef} className="h-full w-full overflow-auto bg-surface custom-scrollbar">
                                {viewMode === "timeline" ? (
                                    <div style={{ minWidth: TIMELINE_CONTENT_WIDTH }} className="border border-border/60 rounded-lg bg-surface">
                                        {/* Time Headers */}
                                        <div className="sticky top-0 z-40 flex border-b border-border/60 bg-surface">
                                            <div className="sticky left-0 z-50 w-[200px] shrink-0 border-r border-border/60 px-2 py-3 flex items-center justify-between bg-bg shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
                                                <button
                                                    onClick={handlePrevDate}
                                                    disabled={!uniqueDates.length || selectedDate === uniqueDates[0]}
                                                    aria-label="Previous day"
                                                    className="p-1 text-text-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-md hover:bg-white/5 flex items-center justify-center cursor-pointer"
                                                >
                                                    &larr;
                                                </button>
                                                <div className="text-[11px] font-bold tracking-widest text-text uppercase text-center flex-1">
                                                    {selectedDateLabel}
                                                </div>
                                                <button
                                                    onClick={handleNextDate}
                                                    disabled={!uniqueDates.length || selectedDate === uniqueDates[uniqueDates.length - 1]}
                                                    aria-label="Next day"
                                                    className="p-1 text-text-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-md hover:bg-white/5 flex items-center justify-center cursor-pointer"
                                                >
                                                    &rarr;
                                                </button>
                                            </div>
                                            <div className="flex">
                                                {TIME_SLOTS.map((time, idx) => (
                                                    <div key={idx} style={{ width: TIMELINE_COLUMN_WIDTH }} className="relative shrink-0 py-4">
                                                        {/* Tick mark + label sit at the left edge — this is the 00:00/02:00/... instant,
                                                            not a label for the whole column, which would read as a duration. */}
                                                        <div className="absolute left-0 top-0 bottom-0 w-px bg-border/70" />
                                                        <span className="absolute left-0 -translate-x-1/2 bg-surface px-1 text-[11px] font-medium text-text-muted font-mono">{time}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Tracks and Race Rows */}
                                        <div className="flex flex-col">
                                            {TRACKS_DYNAMIC.length === 0 && !loading && (
                                                <div className="p-8 text-center text-text-muted text-[13px]">No races scheduled for this date.</div>
                                            )}
                                            {TRACKS_DYNAMIC.map(track => (
                                                <div key={track.id} className="flex border-b border-border/60 last:border-b-0 min-h-[120px]">

                                                    {/* Track Info (Y-axis label) */}
                                                    <div className="sticky left-0 z-30 w-[200px] shrink-0 border-r border-border/60 p-5 bg-surface flex flex-col justify-center gap-1 shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
                                                        <span className="text-[14px] font-semibold text-text truncate">{track.name}</span>
                                                        <span className="text-[12px] text-text-muted">{track.surface}</span>
                                                    </div>

                                                    {/* Timeline area for this track */}
                                                    <div style={{ width: TIME_SLOTS.length * TIMELINE_COLUMN_WIDTH }} className="shrink-0 relative flex">
                                                        {/* Background Grid Lines — one at each tick's exact position (its left
                                                            edge), matching the header ticks above rather than boxing each
                                                            2h span as if it were a single labeled cell. */}
                                                        {TIME_SLOTS.map((_, idx) => (
                                                            <div key={idx} style={{ width: TIMELINE_COLUMN_WIDTH }} className="shrink-0 border-l border-border/60" />
                                                        ))}

                                                        {/* Placed Races */}
                                                        {filteredRaces.filter(r => r.trackId === track.id).map(race => {
                                                            const isSelected = selectedRaceId === race.id;
                                                            return (
                                                                <button
                                                                    key={race.id}
                                                                    type="button"
                                                                    onClick={() => setSelectedRaceId(isSelected ? null : race.id)}
                                                                    aria-pressed={isSelected}
                                                                    className={`absolute top-1/2 -translate-y-1/2 h-[70px] border rounded-md p-3 shadow-lg shadow-black/40 transition-all cursor-pointer flex flex-col justify-between text-left ${race.status === 'cancelled' ? 'bg-error-bg border-red/20 opacity-60 z-0' : 'bg-surface-raised z-10'
                                                                        } ${isSelected ? "border-red ring-1 ring-red/50 !z-20" : "border-gold/30 hover:border-gold/60"}`}
                                                                    style={{ left: race.leftPercent, width: race.widthPercent }}
                                                                >
                                                                    <div className="flex justify-between items-start">
                                                                        <span className={`text-[13px] font-semibold truncate pr-2 ${race.status === 'cancelled' ? 'text-text-muted line-through' : 'text-text'}`}>{race.title}</span>
                                                                        <span className="text-[12px] font-medium text-gold shrink-0">{race.time}</span>
                                                                    </div>
                                                                    <div className="flex items-center justify-between mt-auto">
                                                                        <div className="flex gap-1 items-center">
                                                                            {race.status === 'cancelled' && <span className="text-[10px] text-red font-bold uppercase mr-1">Cancelled</span>}
                                                                            <span className={`w-1.5 h-1.5 rounded-full ${RACE_STATUS_DOT[race.status] ?? 'bg-amber'}`}></span>
                                                                        </div>
                                                                    </div>
                                                                </button>
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
                                                <tr className="bg-surface border-b border-border/60">
                                                    <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase">Race Name</th>
                                                    <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase">Track</th>
                                                    <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase">Tournament</th>
                                                    <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase">Date & Time</th>
                                                    <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase">Capacity</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {filteredRaces.map(race => {
                                                    const isSelected = selectedRaceId === race.id;
                                                    return (
                                                        <tr
                                                            key={race.id}
                                                            role="button"
                                                            tabIndex={0}
                                                            aria-pressed={isSelected}
                                                            onClick={() => setSelectedRaceId(isSelected ? null : race.id)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter" || e.key === " ") {
                                                                    e.preventDefault();
                                                                    setSelectedRaceId(isSelected ? null : race.id);
                                                                }
                                                            }}
                                                            className={`hover:bg-white/[0.02] transition-colors cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/40 ${isSelected ? "bg-red-900/10" : ""}`}
                                                        >
                                                            <td className="p-4">
                                                                <div className={`text-[13px] font-semibold ${race.status === 'cancelled' ? 'text-text-muted line-through' : 'text-text'}`}>{race.title}</div>
                                                                <div className="mt-1 inline-block">
                                                                    <StatusBadge label={race.status} tone={RACE_STATUS_TONE[race.status] ?? "amber"} dot={false} />
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="text-[13px] text-text-muted">{race.trackId}</div>
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="text-[13px] text-text-muted">{race.tournament}</div>
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="text-[13px] text-text-muted">{race.dateLabel}</div>
                                                                <div className="text-[11px] text-text-muted/70 mt-0.5 font-mono">{race.time}</div>
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden w-24">
                                                                        <div
                                                                            className="h-full bg-green rounded-full"
                                                                            style={{ width: `${(race.acceptedCount / Math.max(race.maxSlots, 1)) * 100}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-[12px] font-medium text-text-muted min-w-[32px]">
                                                                        {race.acceptedCount}/{race.maxSlots}
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
                                            totalPages={raceRoundsPagination.totalPages}
                                            totalItems={raceRoundsPagination.totalItems}
                                            limit={raceRoundsLimit}
                                            onPageChange={handleTablePageChange}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
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
