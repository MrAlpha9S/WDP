import { useEffect, useState } from "react";
import { Search, ChevronDown, SlidersHorizontal, Plus, MoreVertical } from "lucide-react";
import { horseOwnerService, type Horse } from "../../../api/horseOwnerService";

// ── Types ─────────────────────────────────────────────────────────────────────
type HorseStatus = "Racing" | "Training" | "Resting" | "Injured";

interface HorseCard {
  id: string;
  name: string;
  age: number;
  color: string;
  sex: string;
  grade: string;
  status: HorseStatus;
  image: string;
  nextRaceDate?: string;
  nextRaceVenue?: string;
  jockey?: string;
  regimen?: string;
  trainer?: string;
  returnEst?: string;
  statusNote?: string;
}

// ── Mapper ────────────────────────────────────────────────────────────────────
function mapHorseToCard(h: Horse): HorseCard {
  const age = Math.floor(
    (Date.now() - new Date(h.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)
  );

  const mapStatus = (): HorseStatus => {
    if (h.healthStatus !== "healthy") return "Injured";
    if (h.status === "active") return "Racing";
    return "Resting";
  };

  const status = mapStatus();

  return {
    id: h._id,
    name: h.horseName,
    age,
    color: h.breed,
    sex: h.gender === "male" ? "Colt" : "Filly",
    grade: "Listed",
    status,
    image: "https://images.unsplash.com/photo-1553284965-5dd67167ac2f?w=600&q=80",
    // Populate contextual fields based on mapped status
    ...(status === "Racing" && {
      nextRaceDate: "TBD",
      nextRaceVenue: "TBD",
      jockey: "TBD",
    }),
    ...(status === "Training" && {
      regimen: "General",
      trainer: "TBD",
    }),
    ...((status === "Resting" || status === "Injured") && {
      returnEst: "TBD",
      statusNote: status === "Injured" ? "Medical Review" : "Post-Race Rest",
    }),
  };
}

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUSES: ("All Statuses" | HorseStatus)[] = [
  "All Statuses",
  "Racing",
  "Training",
  "Resting",
  "Injured",
];

const CLASSES = ["All Classes", "Grade 1", "Grade 2", "Grade 3", "Listed"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusDot(status: HorseStatus) {
  const colors: Record<HorseStatus, string> = {
    Racing: "bg-green-400",
    Training: "bg-yellow-400",
    Resting: "bg-gray-400",
    Injured: "bg-red-400",
  };
  return colors[status];
}

function statusLabel(status: HorseStatus) {
  const styles: Record<HorseStatus, string> = {
    Racing: "text-green-400",
    Training: "text-yellow-400",
    Resting: "text-gray-400",
    Injured: "text-red-400",
  };
  return styles[status];
}

// ── Info grid cell ────────────────────────────────────────────────────────────
function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#1e1e1e] rounded-lg px-3 py-2.5 border border-white/6">
      <p className="text-[10px] font-semibold tracking-widest text-gray-600 uppercase mb-1">
        {label}
      </p>
      <p className="text-[13px] font-semibold text-white leading-snug">{value}</p>
    </div>
  );
}

// ── Horse card ────────────────────────────────────────────────────────────────
function HorseCardItem({ horse }: { horse: HorseCard }) {
  return (
    <div className="bg-[#1a1a1a] rounded-2xl border border-white/8 overflow-hidden flex flex-col group hover:border-white/15 transition-colors duration-200">
      <div className="relative h-52 overflow-hidden bg-[#111]">
        <img
          src={horse.image}
          alt={horse.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
          <span className={`w-1.5 h-1.5 rounded-full ${statusDot(horse.status)}`} />
          <span className={`text-[11px] font-semibold tracking-wide ${statusLabel(horse.status)}`}>
            {horse.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="px-5 pt-4 pb-5 flex flex-col gap-4 flex-1">
        <div>
          <h3
            className="text-[18px] font-bold text-white leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {horse.name}
          </h3>
          <p className="text-[11px] font-semibold tracking-widest text-gray-600 uppercase mt-0.5">
            {horse.age}YO {horse.color} {horse.sex} · {horse.grade}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {horse.status === "Racing" && horse.nextRaceDate && horse.jockey && (
            <>
              <InfoCell label="Next Race" value={`${horse.nextRaceDate} • ${horse.nextRaceVenue}`} />
              <InfoCell label="Jockey" value={horse.jockey} />
            </>
          )}
          {horse.status === "Training" && horse.regimen && horse.trainer && (
            <>
              <InfoCell label="Regimen" value={horse.regimen} />
              <InfoCell label="Trainer" value={horse.trainer} />
            </>
          )}
          {(horse.status === "Resting" || horse.status === "Injured") &&
            horse.returnEst &&
            horse.statusNote && (
              <>
                <InfoCell label="Return Est." value={horse.returnEst} />
                <InfoCell label="Status" value={horse.statusNote} />
              </>
            )}
        </div>

        <div className="flex items-center gap-2 mt-auto">
          <button className="flex-1 py-2.5 rounded-lg border border-red-700/60 text-red-400 text-[12.5px] font-semibold hover:bg-red-700/10 hover:border-red-600 transition-all duration-150 tracking-wide">
            VIEW PROFILE
          </button>
          <button className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:border-white/25 transition-all duration-150 shrink-0">
            <MoreVertical size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Horses page ───────────────────────────────────────────────────────────────
export default function HorsesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All Statuses" | HorseStatus>("All Statuses");
  const [classFilter, setClassFilter] = useState("All Classes");
  const [userHorse, setUserHorse] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHorse = async () => {
      try {
        const data = await horseOwnerService.getUserHorse();
        console.log('Data: ', data.data.horses)
        setUserHorse(data.data.horses ?? []);
      } finally {
        setLoading(false);
      }
    };
    fetchHorse();
  }, []);

  const horses: HorseCard[] = userHorse.map(mapHorseToCard);

  const filtered = horses.filter((h) => {
    const matchSearch = h.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All Statuses" || h.status === statusFilter;
    const matchClass = classFilter === "All Classes" || h.grade === classFilter;
    return matchSearch && matchStatus && matchClass;
  });

  return (
    <div className="flex-1 px-8 py-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1
            className="text-[36px] font-bold text-white leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Active Roster
          </h1>
          <p className="text-[13px] text-gray-500 mt-1">
            Manage your stable's performance, health, and race entries.
          </p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-red-700 hover:bg-red-600 text-white text-[12.5px] font-bold tracking-widest rounded-lg transition-colors duration-150 shadow-lg shadow-red-900/40 uppercase mt-1">
          <Plus size={14} />
          Register New Horse
        </button>
      </div>

      <div className="flex items-center gap-3 mt-6 mb-7">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            placeholder="Search horses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-[13px] text-gray-300 placeholder-gray-600 focus:outline-none focus:border-white/25 transition-colors duration-150"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="appearance-none bg-[#1a1a1a] border border-white/10 rounded-lg pl-4 pr-9 py-2.5 text-[13px] text-gray-300 focus:outline-none focus:border-white/25 cursor-pointer transition-colors duration-150"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="appearance-none bg-[#1a1a1a] border border-white/10 rounded-lg pl-4 pr-9 py-2.5 text-[13px] text-gray-300 focus:outline-none focus:border-white/25 cursor-pointer transition-colors duration-150"
          >
            {CLASSES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>

        <div className="ml-auto flex items-center gap-2 text-[12px] text-gray-500 font-medium">
          <SlidersHorizontal size={13} />
          {filtered.length} RESULTS
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-600">
          <p className="text-[15px] font-medium">Loading horses...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-600">
          <p className="text-[15px] font-medium">No horses match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((horse) => (
            <HorseCardItem key={horse.id} horse={horse} />
          ))}
        </div>
      )}
    </div>
  );
}