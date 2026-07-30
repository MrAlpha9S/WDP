import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Plus, List, Calendar as CalendarIcon, Trash2, ArrowRight, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Pagination } from "../../components/Pagination";
import { type AdminTab } from "./AdminComponents/NavBar";
import type { Tournament } from "../../shared/types/TournamentTypes";
import { CreateTournamentModal } from "./modal/CreateTournamentModal";
import { DeleteTournamentModal } from "./modal/DeleteTournamentModal";
import { adminService } from "../../api/adminService";
import TournamentDetailPanel from "./AdminComponents/TournamentDetailPanel";
import { useSocket } from "../../providers/SocketProvider";
import { ErrorState } from "../../components/ErrorState";

type AdminViewMode = "table" | "calendar";

const TOURNAMENT_LIMIT_OPTIONS = [5, 10, 25, 50, 100];

interface Props {
    setActiveTab: (tab: AdminTab) => void;
}

export default function TournamentManagementPage({ setActiveTab }: Props) {
    const { socket } = useSocket();
    const [viewMode, setViewMode] = useState<AdminViewMode>("table");
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [allTournamentsForCalendar, setAllTournamentsForCalendar] = useState<Tournament[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [limit, setLimit] = useState(10);
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounce search input before it hits the server, mirroring the same
    // pattern used in HorsesPage (src/pages/horseOwner/Management/Horses.tsx)
    useEffect(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => setDebouncedSearch(searchQuery), 400);
        return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
    }, [searchQuery]);

    useEffect(() => { setPage(1); }, [debouncedSearch, limit]);

    const fetchTournaments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminService.getTournamentsWithDetails(page, limit, undefined, undefined, debouncedSearch || undefined);
            if (res?.data?.items) {
                const map = (item: any) => ({
                    id: item.tournament._id,
                    name: item.tournament.tournamentName,
                    description: item.tournament.description || "",
                    startDate: item.tournament.startDate ? new Date(item.tournament.startDate).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }) : "TBD",
                    endDate: item.tournament.endDate ? new Date(item.tournament.endDate).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }) : "TBD",
                    status: item.tournament.status === 'scheduled' ? 'upcoming' : item.tournament.status === 'ongoing' ? 'live' : item.tournament.status,
                    prizePool: `${(item.priceTotalPool || 0).toLocaleString()} VND`,
                    startISO: item.tournament.startDate ? new Date(item.tournament.startDate).toISOString().split("T")[0] : "",
                    endISO: item.tournament.endDate ? new Date(item.tournament.endDate).toISOString().split("T")[0] : ""
                } as Tournament);
                const mapped = res.data.items.filter((item: any) => item.tournament.tournamentName !== "Non-tournament").map(map);
                setTournaments(mapped);
                setTotalItems(res.data.pagination?.totalItems ?? mapped.length);
            }
        } catch (err: any) {
            console.error("Failed to load tournaments:", err);
            setError(err?.msg ?? "Failed to load tournaments.");
        } finally {
            setLoading(false);
        }
    }, [page, limit, debouncedSearch]);

    useEffect(() => { fetchTournaments(); }, [fetchTournaments]);

    // Quick Stats — true counts across every tournament, independent of the
    // paginated/searched `tournaments` list above.
    const [stats, setStats] = useState({ live: 0, upcoming: 0, completed: 0 });

    const fetchStats = useCallback(() => {
        adminService.getTournamentStats().then(res => {
            if (res?.data) setStats(res.data);
        }).catch(() => { });
    }, []);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    // Real-time: auto-update status when the scheduler (or admin) changes it
    useEffect(() => {
        if (!socket) return;
        const onStatusChanged = ({ tournamentId, status }: { tournamentId: string; status: string }) => {
            // Map backend status → frontend display status
            const displayStatus = (status === 'ongoing' ? 'live' : status === 'scheduled' ? 'upcoming' : status) as any;
            const updater = (prev: Tournament[]) =>
                prev.map(t => t.id === tournamentId ? { ...t, status: displayStatus } : t);
            setTournaments(updater);
            setAllTournamentsForCalendar(updater);
            fetchStats();
        };
        socket.on('tournament:status_changed', onStatusChanged);
        return () => { socket.off('tournament:status_changed', onStatusChanged); };
    }, [socket, fetchStats]);

    const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingTournament, setDeletingTournament] = useState<Tournament | null>(null);

    // Delete Handlers
    const openDeleteModal = (tournament: Tournament) => {
        setDeletingTournament(tournament);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteSuccess = (id: string) => {
        setTournaments(tournaments.filter(t => t.id !== id));
        fetchStats();
    };

    // Open Modal for Create or Edit
    const openModal = (tournament?: Tournament) => {
        setEditingTournament(tournament || null);
        setIsModalOpen(true);
    };

    // Calendar State & Logic
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarLoading, setCalendarLoading] = useState(false);

    // Load tournaments overlapping the currently visible month for the calendar view
    const fetchCalendarTournaments = useCallback(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const toISO = (d: Date) => d.toISOString().split("T")[0];
        const monthStart = toISO(new Date(year, month, 1));
        const monthEnd = toISO(new Date(year, month + 1, 0));

        setCalendarLoading(true);
        // No page/limit — a date-range fetch always returns every matching
        // tournament unpaginated (see AdminService.getTournamentsWithDetails).
        adminService.getTournamentsWithDetails(undefined, undefined, monthStart, monthEnd).then(res => {
            if (res?.data?.items) {
                const mapped = res.data.items
                    .filter((item: any) => item.tournament.tournamentName !== "Non-tournament")
                    .map((item: any) => ({
                        id: item.tournament._id,
                        name: item.tournament.tournamentName,
                        description: item.tournament.description || "",
                        startDate: "",
                        endDate: "",
                        status: item.tournament.status === 'scheduled' ? 'upcoming' : item.tournament.status === 'ongoing' ? 'live' : item.tournament.status,
                        prizePool: `${(item.priceTotalPool || 0).toLocaleString()} VND`,
                        startISO: item.tournament.startDate ? new Date(item.tournament.startDate).toISOString().split("T")[0] : "",
                        endISO: item.tournament.endDate ? new Date(item.tournament.endDate).toISOString().split("T")[0] : ""
                    } as Tournament));
                setAllTournamentsForCalendar(mapped);
            }
        }).catch(() => { }).finally(() => setCalendarLoading(false));
    }, [currentDate]);

    useEffect(() => { fetchCalendarTournaments(); }, [fetchCalendarTournaments]);

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const currentMonth = currentDate.getMonth(); // 0-11
    const currentYear = currentDate.getFullYear();
    const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOffset = new Date(currentYear, currentMonth, 1).getDay();
    const totalCells = Math.ceil((daysInCurrentMonth + firstDayOffset) / 7) * 7;

    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    const getTournamentsForDay = (day: number) => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const source = allTournamentsForCalendar.length > 0 ? allTournamentsForCalendar : tournaments;
        return source.filter(t => t.id !== "none" && t.startISO <= dateStr && t.endISO >= dateStr);
    };

    return (
        <div className="flex flex-col h-full bg-bg text-white overflow-hidden font-sans">

            {/* ── Top Content Area ── */}
            <div className="flex-1 flex gap-6 p-8 min-h-0 overflow-hidden">

                {/* ── Left Panel (Overview & Filters) ── */}
                <aside className="w-[240px] shrink-0 h-full bg-surface border border-border/60 rounded-xl flex flex-col overflow-hidden shadow-lg shadow-black/20">
                    <div className="px-5 py-6 shrink-0 border-b border-border/60 bg-surface">
                        <h2 className="text-[18px] font-bold text-white tracking-tight leading-tight">Overview</h2>
                        <p className="text-[12px] text-gray-400 mt-1">Filter and view tournament stats.</p>
                    </div>

                    <div className="p-5 flex flex-col gap-6 overflow-y-auto">

                        {viewMode === "table" && (
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Search</label>
                                <div className="relative w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Search name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-bg border border-border rounded-md py-2.5 pl-9 pr-3 text-[13px] text-white focus:outline-none focus:border-red-500/50"
                                    />
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Quick Stats</label>
                            <div className="flex flex-col gap-3">
                                <div className="bg-[#1f1a1a] border border-border/60 p-3 rounded flex items-center justify-between">
                                    <span className="text-[13px] text-gray-400 font-medium">Total Live</span>
                                    <span className="text-[14px] font-bold text-emerald-400">
                                        {stats.live}
                                    </span>
                                </div>
                                <div className="bg-[#1f1a1a] border border-border/60 p-3 rounded flex items-center justify-between">
                                    <span className="text-[13px] text-gray-400 font-medium">Upcoming</span>
                                    <span className="text-[14px] font-bold text-amber-400">
                                        {stats.upcoming}
                                    </span>
                                </div>
                                <div className="bg-[#1f1a1a] border border-border/60 p-3 rounded flex items-center justify-between">
                                    <span className="text-[13px] text-gray-400 font-medium">Completed</span>
                                    <span className="text-[14px] font-bold text-gray-300">
                                        {stats.completed}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* ── Main Area ── */}
                <main className={`flex flex-col min-w-0 h-full transition-all duration-200 ${selectedTournamentId ? 'flex-[0_0_50%]' : 'flex-1'}`}>

                    {/* ── Header ── */}
                    <header className="pb-5 flex flex-col gap-3 border-b border-border/60 shrink-0">
                        {/* Row 1 */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <h1 className="text-[22px] font-bold text-white tracking-tight leading-tight truncate font-serif">
                                    Tournament Management
                                </h1>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-[10px] font-semibold tracking-wide text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-border uppercase whitespace-nowrap">
                                        All Tournaments
                                    </span>
                                    <span className="text-[12px] text-gray-500 truncate">· Manage schedules and prize pools</span>
                                </div>
                            </div>
                            <button
                                onClick={() => openModal()}
                                className="shrink-0 flex items-center gap-2 px-4 text-[12px] font-medium text-white bg-[#ab3030] rounded hover:bg-[#8f2828] transition-colors shadow-lg shadow-red-900/20 h-[32px]"
                            >
                                <Plus size={13} /> Create Tournament
                            </button>
                        </div>

                        {/* Row 2 */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex bg-surface p-1 rounded-lg border border-border/60 shrink-0">
                                <button
                                    onClick={() => setViewMode("table")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${viewMode === "table" ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-white"}`}
                                >
                                    <List size={13} /> Table
                                </button>
                                <button
                                    onClick={() => setViewMode("calendar")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${viewMode === "calendar" ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-white"}`}
                                >
                                    <CalendarIcon size={13} /> Calendar
                                </button>
                            </div>

                            {viewMode === "table" && (
                                <select
                                    value={limit}
                                    onChange={(e) => setLimit(Number(e.target.value))}
                                    className="w-[130px] shrink-0 bg-surface border border-border rounded-md px-3 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 h-[32px] appearance-none cursor-pointer"
                                >
                                    {TOURNAMENT_LIMIT_OPTIONS.map(n => (
                                        <option key={n} value={n}>{n} rows</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </header>

                    {/* ── Main Content Area ── */}
                    <div className="flex-1 relative mt-6 rounded-xl border border-border/60 overflow-hidden min-h-0">
                        {(viewMode === "table" ? loading : calendarLoading) && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-surface/80 backdrop-blur-sm">
                                <Loader2 className="animate-spin text-red-500" size={32} />
                            </div>
                        )}
                        {viewMode === "table" && !loading && error ? (
                            <div className="h-full w-full flex items-center justify-center bg-surface p-6">
                                <ErrorState message={error} onRetry={fetchTournaments} className="max-w-md" />
                            </div>
                        ) : (
                        <div className="h-full w-full overflow-auto bg-surface custom-scrollbar">
                        {viewMode === "table" ? (
                            <div className="bg-surface border border-border/60 rounded-lg overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-surface border-b border-border/60">
                                            <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Tournament Name</th>
                                            <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Duration</th>
                                            <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Status</th>
                                            <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Prize Pool</th>
                                            <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {tournaments.map(t => (
                                            <tr
                                                key={t.id}
                                                className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${selectedTournamentId === t.id ? 'bg-gold/5 border-l-2 border-gold' : ''}`}
                                                onClick={() => setSelectedTournamentId(prev => prev === t.id ? null : t.id)}
                                            >
                                                <td className="p-4">
                                                    <div className="text-[13px] font-semibold text-white">{t.name}</div>
                                                    <div className="text-[11px] text-gray-500 mt-0.5">{t.description}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-[12px] text-gray-300">{t.startDate} to</div>
                                                    <div className="text-[12px] text-gray-300">{t.endDate}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${t.status === "live" ? "bg-emerald-500/20 text-emerald-400" :
                                                        t.status === "upcoming" ? "bg-amber-500/20 text-amber-400" :
                                                            "bg-gray-500/20 text-gray-400"
                                                        }`}>
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-[13px] font-medium text-emerald-400">{t.prizePool}</div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setActiveTab("Races"); }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-[12px] text-gray-300 transition-colors"
                                                        >
                                                            Manage Races <ArrowRight size={12} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openDeleteModal(t); }}
                                                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {tournaments.length === 0 && !loading && !error && (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-[13px] text-gray-500">
                                                    No tournaments found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                <Pagination
                                    page={page}
                                    totalPages={totalPages}
                                    totalItems={totalItems}
                                    limit={limit}
                                    onPageChange={setPage}
                                />
                            </div>
                        ) : (
                            <div className="bg-surface border border-border/60 rounded-lg p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-[16px] font-bold text-white w-[150px]">{monthName} {currentYear}</h3>
                                        <div className="flex gap-1">
                                            <button onClick={prevMonth} className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white">
                                                <ChevronLeft size={18} />
                                            </button>
                                            <button onClick={nextMonth} className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white">
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 text-[12px] text-gray-400">
                                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-emerald-500/80"></span> Live</div>
                                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-amber-500/80"></span> Upcoming</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-7 gap-px bg-white/10 border border-border rounded-lg overflow-hidden">
                                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                                        <div key={day} className="bg-surface p-3 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                            {day}
                                        </div>
                                    ))}

                                    {/* Calendar Grid */}
                                    {Array.from({ length: totalCells }).map((_, idx) => {
                                        const dayNum = idx - firstDayOffset + 1;
                                        const isCurrentMonth = dayNum > 0 && dayNum <= daysInCurrentMonth;

                                        const cellTournaments = isCurrentMonth ? getTournamentsForDay(dayNum) : [];

                                        // Calculate previous month days for offset
                                        const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);
                                        const displayNum = isCurrentMonth ? dayNum : (dayNum <= 0 ? prevMonthDays + dayNum : dayNum - daysInCurrentMonth);

                                        return (
                                            <div key={idx} className={`min-h-[100px] bg-surface p-2 border-t border-r border-border/60 ${!isCurrentMonth && 'opacity-30'}`}>
                                                <span className={`text-[12px] font-semibold ${isCurrentMonth ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    {displayNum}
                                                </span>
                                                {/* Tournament Blocks */}
                                                <div className="mt-2 flex flex-col gap-1">
                                                    {cellTournaments.map(t => (
                                                        <div
                                                            key={t.id}
                                                            className={`p-1.5 border rounded text-[10px] truncate leading-tight ${t.status === "live" ? "bg-emerald-900/40 border-emerald-500/40 text-emerald-200" :
                                                                t.status === "upcoming" ? "bg-amber-500/20 border-amber-500/40 text-amber-200" :
                                                                    "bg-gray-500/20 border-gray-500/40 text-gray-300"
                                                                }`}
                                                        >
                                                            {t.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        </div>
                        )}
                    </div>
                </main>

                {/* ── Tournament Detail Panel ── */}
                {selectedTournamentId && (
                    <div className="flex-1 min-w-[360px] min-h-0">
                        <TournamentDetailPanel
                            selectedTournamentId={selectedTournamentId}
                            onRefresh={() => { fetchTournaments(); fetchStats(); fetchCalendarTournaments(); }}
                            onClose={() => setSelectedTournamentId(null)}
                            onEdit={() => {
                                const found = tournaments.find(x => x.id === selectedTournamentId);
                                if (found) openModal(found);
                            }}
                        />
                    </div>
                )}
            </div>

            <CreateTournamentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    adminService.getTournamentsWithDetails(1, 100).then(res => {
                        if (res?.data?.items) {
                            const mappedData: Tournament[] = res.data.items
                                .filter((item: any) => item.tournament.tournamentName !== "Non-tournament")
                                .map((item: any) => ({
                                    id: item.tournament._id,
                                    name: item.tournament.tournamentName,
                                    description: item.tournament.description || "",
                                    startDate: item.tournament.startDate ? new Date(item.tournament.startDate).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }) : "TBD",
                                    endDate: item.tournament.endDate ? new Date(item.tournament.endDate).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }) : "TBD",
                                    status: item.tournament.status === 'scheduled' ? 'upcoming' : item.tournament.status === 'ongoing' ? 'live' : item.tournament.status,
                                    prizePool: `${(item.priceTotalPool || 0).toLocaleString()} VND`,
                                    startISO: item.tournament.startDate ? new Date(item.tournament.startDate).toISOString().split("T")[0] : "",
                                    endISO: item.tournament.endDate ? new Date(item.tournament.endDate).toISOString().split("T")[0] : ""
                                }));
                            setTournaments(mappedData);
                        }
                    });
                    fetchCalendarTournaments();
                    fetchStats();
                }}
                editingTournament={editingTournament}
            />

            <DeleteTournamentModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onSuccess={handleDeleteSuccess}
                tournament={deletingTournament}
            />
        </div>
    );
}
