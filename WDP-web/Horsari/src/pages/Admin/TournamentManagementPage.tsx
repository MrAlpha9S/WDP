import { useState } from "react";
import { Search, Plus, LayoutGrid, List, Calendar as CalendarIcon, Edit, Trash2, ArrowRight, X, ChevronLeft, ChevronRight } from "lucide-react";
import { type AdminTab } from "./AdminComponents/NavBar";

// ── Types ─────────────
type ViewMode = "table" | "calendar";

interface Tournament {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    prizePool: string;
    status: "Upcoming" | "Active" | "Completed";
}

// ── Mock Data ──────────
const INITIAL_TOURNAMENTS: Tournament[] = [
    {
        id: "t1",
        name: "Autumn Series",
        description: "The premier autumn racing circuit.",
        startDate: "2024-11-01",
        endDate: "2024-11-30",
        prizePool: "$500,000",
        status: "Upcoming"
    },
    {
        id: "t2",
        name: "Global Championship",
        description: "The biggest event of the year.",
        startDate: "2024-12-10",
        endDate: "2024-12-25",
        prizePool: "$2,000,000",
        status: "Upcoming"
    },
    {
        id: "t3",
        name: "Summer Sprint Cup",
        description: "Fast-paced summer races.",
        startDate: "2024-06-01",
        endDate: "2024-06-15",
        prizePool: "$250,000",
        status: "Completed"
    }
];

interface Props {
    setActiveTab: (tab: AdminTab) => void;
}

export default function TournamentManagementPage({ setActiveTab }: Props) {
    const [viewMode, setViewMode] = useState<ViewMode>("table");
    const [tournaments, setTournaments] = useState<Tournament[]>(INITIAL_TOURNAMENTS);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

    // Filtered Data
    const filteredTournaments = tournaments.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Delete Handler
    const handleDelete = (id: string) => {
        setTournaments(tournaments.filter(t => t.id !== id));
    };

    // Open Modal for Create or Edit
    const openModal = (tournament?: Tournament) => {
        setEditingTournament(tournament || null);
        setIsModalOpen(true);
    };

    // Calendar State & Logic
    const [currentDate, setCurrentDate] = useState(new Date());

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
        return tournaments.filter(t => t.startDate <= dateStr && t.endDate >= dateStr);
    };

    return (
        <div className="flex flex-col h-full bg-[#111111] text-white overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            
            {/* ── Top Content Area ── */}
            <div className="flex-1 grid grid-cols-[280px_1fr] gap-8 p-8 min-h-0">
                
                {/* ── Left Panel (Overview & Filters) ── */}
                <aside className="h-full bg-[#161616] border border-white/[0.05] rounded-xl flex flex-col overflow-hidden shadow-lg shadow-black/20">
                    <div className="px-5 py-6 shrink-0 border-b border-white/[0.05] bg-[#1a1a1a]">
                        <h2 className="text-[18px] font-bold text-white tracking-tight leading-tight">Overview</h2>
                        <p className="text-[12px] text-gray-400 mt-1">Filter and view tournament stats.</p>
                    </div>
                    
                    <div className="p-5 flex flex-col gap-6 overflow-y-auto">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Search</label>
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                <input 
                                    type="text" 
                                    placeholder="Search name..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#111] border border-white/10 rounded-md py-2.5 pl-9 pr-3 text-[13px] text-white focus:outline-none focus:border-red-500/50"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Quick Stats</label>
                            <div className="flex flex-col gap-3">
                                <div className="bg-[#1f1a1a] border border-white/5 p-3 rounded flex items-center justify-between">
                                    <span className="text-[13px] text-gray-400 font-medium">Total Active</span>
                                    <span className="text-[14px] font-bold text-emerald-400">
                                        {tournaments.filter(t => t.status === "Active").length}
                                    </span>
                                </div>
                                <div className="bg-[#1f1a1a] border border-white/5 p-3 rounded flex items-center justify-between">
                                    <span className="text-[13px] text-gray-400 font-medium">Upcoming</span>
                                    <span className="text-[14px] font-bold text-amber-400">
                                        {tournaments.filter(t => t.status === "Upcoming").length}
                                    </span>
                                </div>
                                <div className="bg-[#1f1a1a] border border-white/5 p-3 rounded flex items-center justify-between">
                                    <span className="text-[13px] text-gray-400 font-medium">Completed</span>
                                    <span className="text-[14px] font-bold text-gray-300">
                                        {tournaments.filter(t => t.status === "Completed").length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* ── Main Area ── */}
                <main className="flex flex-col min-w-0 h-full">
                    
                    {/* ── Header ── */}
                    <header className="pb-6 flex items-center justify-between border-b border-white/5 shrink-0">
                        <div>
                            <h1 className="text-[26px] font-bold text-white tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                                Tournament Management
                            </h1>
                            <p className="text-[13px] text-gray-500 mt-1">Manage racing tournaments, schedules, and prize pools.</p>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex bg-[#1a1a1a] p-1 rounded-lg border border-white/5 mx-auto">
                            <button 
                                onClick={() => setViewMode("table")}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors ${viewMode === "table" ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-white"}`}
                            >
                                <List size={14} /> Table
                            </button>
                            <button 
                                onClick={() => setViewMode("calendar")}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors ${viewMode === "calendar" ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-white"}`}
                            >
                                <CalendarIcon size={14} /> Calendar
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => openModal()}
                                className="flex items-center gap-2 px-5 py-2 text-[13px] font-medium text-white bg-[#ab3030] rounded hover:bg-[#8f2828] transition-colors shadow-lg shadow-red-900/20"
                            >
                                <Plus size={14} /> Create Tournament
                            </button>
                        </div>
                    </header>

                    {/* ── Main Content Area ── */}
                    <div className="flex-1 overflow-auto bg-[#141414] mt-6 rounded-xl border border-white/5">
                        {viewMode === "table" ? (
                    <div className="bg-[#161616] border border-white/5 rounded-lg overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#1a1a1a] border-b border-white/5">
                                    <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Tournament Name</th>
                                    <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Duration</th>
                                    <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Status</th>
                                    <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase">Prize Pool</th>
                                    <th className="p-4 text-[11px] font-bold tracking-widest text-gray-500 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredTournaments.map(t => (
                                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4">
                                            <div className="text-[13px] font-semibold text-white">{t.name}</div>
                                            <div className="text-[11px] text-gray-500 mt-0.5">{t.description}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-[12px] text-gray-300">{t.startDate} to</div>
                                            <div className="text-[12px] text-gray-300">{t.endDate}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${
                                                t.status === "Active" ? "bg-emerald-500/20 text-emerald-400" :
                                                t.status === "Upcoming" ? "bg-amber-500/20 text-amber-400" :
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
                                                    onClick={() => setActiveTab("Races")}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-[12px] text-gray-300 transition-colors"
                                                >
                                                    Manage Races <ArrowRight size={12} />
                                                </button>
                                                <button 
                                                    onClick={() => openModal(t)}
                                                    className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(t.id)}
                                                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredTournaments.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-[13px] text-gray-500">
                                            No tournaments found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="bg-[#161616] border border-white/5 rounded-lg p-6">
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
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-emerald-500/80"></span> Active</div>
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-amber-500/80"></span> Upcoming</div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-7 gap-px bg-white/10 border border-white/10 rounded-lg overflow-hidden">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                                <div key={day} className="bg-[#1a1a1a] p-3 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">
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
                                    <div key={idx} className={`min-h-[100px] bg-[#161616] p-2 border-t border-r border-white/5 ${!isCurrentMonth && 'opacity-30'}`}>
                                        <span className={`text-[12px] font-semibold ${isCurrentMonth ? 'text-gray-300' : 'text-gray-600'}`}>
                                            {displayNum}
                                        </span>
                                        {/* Tournament Blocks */}
                                        <div className="mt-2 flex flex-col gap-1">
                                            {cellTournaments.map(t => (
                                                <div 
                                                    key={t.id} 
                                                    className={`p-1.5 border rounded text-[10px] truncate leading-tight ${
                                                        t.status === "Active" ? "bg-emerald-900/40 border-emerald-500/40 text-emerald-200" :
                                                        t.status === "Upcoming" ? "bg-amber-500/20 border-amber-500/40 text-amber-200" :
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
            </main>
        </div>

            {/* ── Create/Edit Modal ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-[500px] bg-[#161616] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]">
                            <h2 className="text-[18px] font-bold text-white tracking-tight leading-tight">
                                {editingTournament ? "Edit Tournament" : "Create New Tournament"}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Tournament Name</label>
                                <input type="text" defaultValue={editingTournament?.name || ""} placeholder="e.g. Winter Cup" className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50" />
                            </div>
                            
                            <div>
                                <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Description</label>
                                <textarea defaultValue={editingTournament?.description || ""} rows={3} placeholder="Brief description..." className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 resize-none"></textarea>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Start Date</label>
                                    <input type="date" defaultValue={editingTournament?.startDate || ""} className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 [color-scheme:dark]" />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">End Date</label>
                                    <input type="date" defaultValue={editingTournament?.endDate || ""} className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 [color-scheme:dark]" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Prize Pool</label>
                                    <input type="text" defaultValue={editingTournament?.prizePool || ""} placeholder="$100,000" className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50" />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Status</label>
                                    <select defaultValue={editingTournament?.status || "Upcoming"} className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 appearance-none">
                                        <option value="Upcoming">Upcoming</option>
                                        <option value="Active">Active</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t border-white/5 bg-[#1a1a1a] flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded text-[13px] font-medium text-gray-400 hover:text-white transition-colors">
                                Cancel
                            </button>
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded text-[13px] font-medium text-white bg-red-700 hover:bg-red-600 transition-colors shadow-lg shadow-red-900/20">
                                {editingTournament ? "Save Changes" : "Create Tournament"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
