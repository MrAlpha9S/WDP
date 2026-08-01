import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, CalendarDays, List } from "lucide-react";
import type { RecentInvite, InviteStatus } from "../../shared/types/HomepageTypes";
import HomeCalendar from "./RefereeComponents/HomeCalendar";
import InviteSidebar from "./RefereeComponents/InviteSidebar";
import { refereeService, type TournamentNameOption } from "../../api/refereeService";
import type { RaceRoundData } from "../../api/adminService";
import { useSocket } from "../../providers/SocketProvider";
import { RefetchButton } from "../../components/RefetchButton";
import { ErrorState } from "../../components/ErrorState";
import { Pagination } from "../../components/Pagination";

type ViewMode = "calendar" | "table";

// RaceRound.status a referee could ever see assigned to them — 'draft' rounds have no
// referee assignment yet, so it's excluded here (unlike the Admin schedule's full list).
const RACE_STATUSES = ["scheduled", "prepared", "running", "awaitingConfirmation", "completed", "cancelled"];
const LIMIT_OPTIONS = [5, 10, 25, 50, 100];

const STATUS_BADGE: Record<string, string> = {
    scheduled: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    prepared: "bg-violet-500/15 text-violet-400 border-violet-500/30",
    running: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    awaitingConfirmation: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    completed: "bg-gray-500/15 text-gray-400 border-gray-500/30",
    cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
    const navigate = useNavigate();
    const now = new Date();
    const [viewMode, setViewMode] = useState<ViewMode>("calendar");
    const [viewMonth, setViewMonth] = useState(now.getMonth());
    const [viewYear, setViewYear] = useState(now.getFullYear());

    const [tournaments, setTournaments] = useState<TournamentNameOption[]>([]);
    const [selectedTournament, setSelectedTournament] = useState("All");
    const [selectedStatus, setSelectedStatus] = useState("All");

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const totalPages = Math.ceil(totalItems / limit) || 1;

    const [races, setRaces] = useState<RaceRoundData[]>([]);
    const [activeRules, setActiveRules] = useState<any[]>([]);
    const [invites, setInvites] = useState<RecentInvite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTick, setRefreshTick] = useState(0);
    const [lastUpdated, setLastUpdated] = useState<number | null>(null);

    // Live refetch on any notification addressed to this referee.
    const { socket } = useSocket();
    useEffect(() => {
        if (!socket) return;
        const handler = () => setRefreshTick((t) => t + 1);
        socket.on("notification_created", handler);
        return () => { socket.off("notification_created", handler); };
    }, [socket]);

    // This referee's tournaments — Tournament filter options + id→name lookup. Lightweight
    // endpoint (id+name only), same pattern RaceSchedulingPage.tsx uses for the Admin schedule.
    useEffect(() => {
        refereeService.getTournamentNames()
            .then((res) => { if (res.code === 200 && res.data) setTournaments(res.data); })
            .catch(() => { });
    }, [refreshTick]);

    const tournamentName = useCallback((tournamentId?: string) => {
        if (!tournamentId) return "Non-tournament";
        return tournaments.find((t) => t._id === tournamentId)?.tournamentName ?? "Unknown Tournament";
    }, [tournaments]);

    // Reset to page 1 whenever a filter/view/limit change would invalidate the current page.
    useEffect(() => { setPage(1); }, [selectedTournament, selectedStatus, limit, viewMode]);

    const handlePrevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
        else setViewMonth((m) => m - 1);
    };
    const handleNextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
        else setViewMonth((m) => m + 1);
    };

    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const tournamentId = selectedTournament !== "All" ? selectedTournament : undefined;
            const status = selectedStatus !== "All" ? selectedStatus : undefined;

            const racesPromise = viewMode === "calendar"
                // Calendar view: every race in the visible month, unpaginated — mirrors
                // AdminService.getTournamentsWithDetails's date-range mode (see plan).
                ? (() => {
                    // Build "YYYY-MM-DD" bounds from the local calendar components directly —
                    // routing a local-midnight Date through .toISOString() first would convert
                    // it to UTC and silently shift the day backward in any positive-UTC
                    // timezone (this app is Vietnam-anchored, UTC+7), clipping the start of
                    // the month off the fetched range.
                    const pad = (n: number) => String(n).padStart(2, '0');
                    const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
                    const monthStart = `${viewYear}-${pad(viewMonth + 1)}-01`;
                    const monthEnd = `${viewYear}-${pad(viewMonth + 1)}-${pad(lastDay)}`;
                    return refereeService.getRefereeRaceRounds(1, 1000, status, undefined, 'raceDate', 'asc', tournamentId, monthStart, monthEnd);
                })()
                // Table view: real pagination, soonest race first.
                : refereeService.getRefereeRaceRounds(page, limit, status, undefined, 'raceDate', 'asc', tournamentId);

            const [racesRes, rulesRes, invitesRes] = await Promise.all([
                racesPromise,
                refereeService.getActiveRules(),
                refereeService.getRefereeInvitations(5, 1),
            ]);

            if (racesRes.code === 200 && racesRes.data) {
                const activeRaces = racesRes.data.items.filter((r) => r.status !== 'cancelled' || viewMode === 'table');
                setRaces(activeRaces);
                setTotalItems(racesRes.data.pagination?.totalItems ?? activeRaces.length);
            }

            if (rulesRes.code === 200 && rulesRes.data) {
                setActiveRules(rulesRes.data.items);
            }

            if (invitesRes.code === 200 && invitesRes.data) {
                const mappedInvites: RecentInvite[] = invitesRes.data.map((inv: any): RecentInvite => {
                    const round: Record<string, any> = inv.raceRoundId ?? {};
                    const dateObj = new Date(round.raceDate ?? new Date());

                    let mappedStatus: InviteStatus = 'pending';
                    if (inv.status === 'assigned') mappedStatus = 'accepted';
                    else if (inv.status === 'rejected') mappedStatus = 'declined';
                    else if (inv.status === 'cancelled') mappedStatus = 'cancelled';

                    return {
                        id: inv._id,
                        raceLabel: round.roundName ?? "Unknown Race",
                        tournamentName: round.tournamentId?.tournamentName ?? "Non-tournament",
                        date: dateObj.toLocaleDateString(),
                        venue: round.location ?? "Unknown Venue",
                        trackLocation: round.address ?? "",
                        status: mappedStatus,
                        fee: inv.fee ?? 0,
                        sentAt: new Date(inv.assignedAt).toLocaleDateString(),
                        isNew: false,
                        role: "Referee",
                        raceType: round.eligibilityRuleId?.raceType ?? "Stakes",
                    };
                });
                setInvites(mappedInvites);
            }
        } catch (err: any) {
            console.error("Failed to fetch referee dashboard data", err);
            setError(err?.msg ?? "Failed to fetch dashboard data.");
        } finally {
            setLoading(false);
            setLastUpdated(Date.now());
        }
    }, [viewMode, viewMonth, viewYear, selectedTournament, selectedStatus, page, limit]);

    useEffect(() => {
        setLoading(true);
        fetchData();
    }, [fetchData, refreshTick]);

    return (
        <div className="min-h-screen font-sans">
            <div className="max-w-5xl mx-auto px-6 py-8">

                {/* Header */}
                <div className="mb-7 flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1
                            className="text-[26px] font-bold text-white tracking-tight font-serif"
                        >
                            Dashboard
                        </h1>
                        <p className="text-[13px] text-gray-500 mt-0.5">
                            Your upcoming race schedule and recent invitations.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <RefetchButton onRefetch={() => setRefreshTick((t) => t + 1)} lastUpdated={lastUpdated} />
                    </div>
                </div>

                {/* Filters row */}
                <div className="flex items-center gap-3 flex-wrap mb-6">
                    <div className="flex bg-surface p-1 rounded-lg border border-border/60 shrink-0">
                        <button
                            onClick={() => setViewMode("calendar")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${viewMode === "calendar" ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-white"}`}
                        >
                            <CalendarDays size={13} /> Calendar
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
                        className="w-[170px] shrink-0 bg-surface border border-border rounded-md px-3 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
                    >
                        <option value="All">All Tournaments</option>
                        {tournaments.map((t) => (
                            <option key={t._id} value={t._id}>{t.tournamentName}</option>
                        ))}
                    </select>

                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-[150px] shrink-0 bg-surface border border-border rounded-md px-3 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer capitalize"
                    >
                        <option value="All">All Statuses</option>
                        {RACE_STATUSES.map((status) => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>

                    {viewMode === "table" && (
                        <select
                            value={limit}
                            onChange={(e) => setLimit(Number(e.target.value))}
                            className="w-[130px] shrink-0 bg-surface border border-border rounded-md px-3 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
                        >
                            {LIMIT_OPTIONS.map((n) => (
                                <option key={n} value={n}>{n} rows</option>
                            ))}
                        </select>
                    )}
                </div>

                {error && !loading && (
                    <div className="mb-6">
                        <ErrorState message={error} onRetry={() => setRefreshTick((t) => t + 1)} />
                    </div>
                )}

                {/* Main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] bg-surface rounded-xl border border-border">
                            <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-4" />
                            <span className="text-[13px] font-medium text-gray-400">Loading schedule...</span>
                        </div>
                    ) : viewMode === "calendar" ? (
                        <HomeCalendar
                            races={races}
                            activeRules={activeRules}
                            viewMonth={viewMonth}
                            viewYear={viewYear}
                            onPrevMonth={handlePrevMonth}
                            onNextMonth={handleNextMonth}
                        />
                    ) : (
                        <div className="bg-surface border border-border rounded-xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface border-b border-border/60">
                                        <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Race Name</th>
                                        <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Tournament</th>
                                        <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Venue</th>
                                        <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Date &amp; Time</th>
                                        <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {races.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-[13px] text-gray-500">
                                                No races found.
                                            </td>
                                        </tr>
                                    ) : races.map((race) => {
                                        const dateObj = new Date(race.raceDate);
                                        return (
                                            <tr
                                                key={race._id}
                                                onClick={() => navigate(`/referee/race-monitor/${race._id}`)}
                                                className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                                            >
                                                <td className="p-4">
                                                    <div className="text-[13px] font-semibold text-white">{race.roundName}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-[13px] text-gray-300">{tournamentName(race.tournamentId)}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-[13px] text-gray-300">{race.location ?? "—"}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-[13px] text-gray-300">{isNaN(dateObj.getTime()) ? "TBD" : dateObj.toLocaleDateString()}</div>
                                                    <div className="text-[11px] text-gray-500 mt-0.5 font-mono">{isNaN(dateObj.getTime()) ? "" : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${STATUS_BADGE[race.status] ?? "bg-amber-500/15 text-amber-400 border-amber-500/30"}`}>
                                                        {race.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <Pagination page={page} totalPages={totalPages} totalItems={totalItems} limit={limit} onPageChange={setPage} />
                        </div>
                    )}
                    <InviteSidebar invites={invites} />
                </div>
            </div>
        </div>
    );
}
