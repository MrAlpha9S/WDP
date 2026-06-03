import { useState } from "react";
import { ChevronDown, SlidersHorizontal, User, Diamond } from "lucide-react";
import JockeyDetailModal, { type Jockey, STATUS_CFG } from "../../../components/ownerComponents/JockeyModal/Jockeydetailmodal";

// ── Mock data ─────────────────────────────────────────────────────────────────
const JOCKEYS: Jockey[] = [
  {
    id: 1,
    name: "Marcus Vance",
    rank: "Elite",
    country: "UK",
    status: "Available",
    winRate: 24.5,
    starts: 1402,
    wins: 344,
    places: 289,
    baseFee: 2500,
    weight: "54 kg",
    age: 34,
    experience: "12 years",
    specialties: ["Flat Racing", "Long Distance", "Muddy Track"],
    recentRaces: [
      { race: "Royal Ascot",    position: "1st", horse: "Crimson Velocity", date: "Jun 2024" },
      { race: "Epsom Derby",    position: "2nd", horse: "Storm Cipher",     date: "Jun 2024" },
      { race: "Dubai World Cup",position: "1st", horse: "Iron Ledger",      date: "Mar 2024" },
    ],
    image: "https://images.unsplash.com/photo-1628157588553-5eeea00af15c?w=600&q=80",
  },
  {
    id: 2,
    name: "Elena Rostova",
    rank: "Pro",
    country: "AUS",
    status: "In Talks",
    winRate: 18.2,
    starts: 858,
    wins: 156,
    places: 201,
    baseFee: 1200,
    weight: "52 kg",
    age: 27,
    experience: "7 years",
    specialties: ["Sprint", "Turf", "All Weather"],
    recentRaces: [
      { race: "Melbourne Cup",  position: "3rd", horse: "Ember Crown",       date: "Nov 2024" },
      { race: "Cox Plate",      position: "1st", horse: "Midnight Protocol", date: "Oct 2024" },
      { race: "Caulfield Cup",  position: "2nd", horse: "Night Fury",        date: "Oct 2024" },
    ],
    image: "https://images.unsplash.com/photo-1546961342-ea5f62d5a27b?w=600&q=80",
  },
  {
    id: 3,
    name: "Takeshi Sato",
    rank: "Veteran",
    country: "JPN",
    status: "Unavailable",
    winRate: 31.4,
    starts: 3210,
    wins: 1008,
    places: 742,
    baseFee: null,
    weight: "55 kg",
    age: 44,
    experience: "22 years",
    specialties: ["All Surfaces", "Stakes Racing", "International"],
    recentRaces: [
      { race: "Japan Cup",   position: "1st", horse: "Thunderstrike",    date: "Nov 2024" },
      { race: "Arima Kinen", position: "1st", horse: "Crimson Velocity", date: "Dec 2023" },
      { race: "Tenno Sho",   position: "2nd", horse: "Silver Bullet",    date: "Oct 2023" },
    ],
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80",
  },
  {
    id: 4,
    name: "David Chen",
    rank: "Apprentice",
    country: "USA",
    status: "Available",
    winRate: 12.1,
    starts: 145,
    wins: 18,
    places: 34,
    baseFee: 500,
    weight: "53 kg",
    age: 21,
    experience: "2 years",
    specialties: ["Dirt Track", "Short Sprint"],
    recentRaces: [
      { race: "Santa Anita Stakes", position: "4th", horse: "Ember Crown",  date: "Jan 2025" },
      { race: "Del Mar Futurity",   position: "2nd", horse: "Storm Cipher", date: "Sep 2024" },
      { race: "Breeders Cup",       position: "5th", horse: "Night Fury",   date: "Nov 2024" },
    ],
    image: null,
  },
  {
    id: 5,
    name: "Luca Ferrari",
    rank: "Pro",
    country: "ITA",
    status: "Available",
    winRate: 22.7,
    starts: 976,
    wins: 221,
    places: 198,
    baseFee: 1800,
    weight: "54 kg",
    age: 31,
    experience: "9 years",
    specialties: ["Turf", "Group 1", "European Circuit"],
    recentRaces: [
      { race: "Premio Presidente", position: "1st", horse: "Iron Ledger",       date: "Nov 2024" },
      { race: "Arc de Triomphe",   position: "3rd", horse: "Midnight Protocol", date: "Oct 2024" },
      { race: "Italian Derby",     position: "1st", horse: "Crimson Velocity",  date: "May 2024" },
    ],
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80",
  },
  {
    id: 6,
    name: "Amara Diallo",
    rank: "Elite",
    country: "FRA",
    status: "In Talks",
    winRate: 28.9,
    starts: 2105,
    wins: 608,
    places: 431,
    baseFee: 3200,
    weight: "53 kg",
    age: 36,
    experience: "14 years",
    specialties: ["Flat", "Group 1", "Soft Ground"],
    recentRaces: [
      { race: "Prix de l'Arc",       position: "1st", horse: "Ember Crown",  date: "Oct 2024" },
      { race: "Prix du Jockey Club", position: "1st", horse: "Storm Cipher", date: "Jun 2024" },
      { race: "Longchamp Classic",   position: "2nd", horse: "Silver Bullet",date: "Sep 2024" },
    ],
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80",
  },
  {
    id: 7,
    name: "Carlos Mendez",
    rank: "Veteran",
    country: "ARG",
    status: "Available",
    winRate: 19.3,
    starts: 1780,
    wins: 344,
    places: 312,
    baseFee: 950,
    weight: "56 kg",
    age: 40,
    experience: "18 years",
    specialties: ["Dirt", "Long Distance", "South American Circuit"],
    recentRaces: [
      { race: "Gran Premio Nacional", position: "1st", horse: "Iron Ledger",   date: "Nov 2024" },
      { race: "Jockey Club Arg.",     position: "2nd", horse: "Night Fury",    date: "Oct 2024" },
      { race: "Palermo Stakes",       position: "1st", horse: "Thunderstrike", date: "Aug 2024" },
    ],
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
  },
  {
    id: 8,
    name: "Yuki Tanaka",
    rank: "Apprentice",
    country: "JPN",
    status: "Unavailable",
    winRate: 8.6,
    starts: 62,
    wins: 5,
    places: 12,
    baseFee: 300,
    weight: "51 kg",
    age: 19,
    experience: "1 year",
    specialties: ["Turf", "Short Distance"],
    recentRaces: [
      { race: "Hanshin Juvenile", position: "6th", horse: "Silver Bullet", date: "Dec 2024" },
      { race: "Kokura Sprint",    position: "3rd", horse: "Night Fury",    date: "Aug 2024" },
      { race: "Niigata Debut",    position: "1st", horse: "Ember Crown",   date: "Jul 2024"  },
    ],
    image: null,
  },
];

const RANKS    = ["All", "Elite", "Pro", "Veteran", "Apprentice"] as const;
const WEIGHTS  = ["Weight: All", "Under 54kg", "54–56kg", "Over 56kg"];
const REGIONS  = ["Region: Global", "Europe", "Asia", "Americas", "Oceania"];

// ── Filter dropdown ───────────────────────────────────────────────────────────
function FilterSelect({
  options, value, onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-[#1a1a1a] border border-white/10 rounded-lg pl-4 pr-8 py-2 text-[12.5px] text-gray-300 focus:outline-none focus:border-white/25 cursor-pointer transition-colors duration-150"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown
        size={12}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
      />
    </div>
  );
}

// ── Jockey Card ───────────────────────────────────────────────────────────────
function JockeyCard({
  jockey,
  onDetail,
}: {
  jockey: Jockey;
  onDetail: () => void;
}) {
  const cfg           = STATUS_CFG[jockey.status];
  const isUnavailable = jockey.status === "Unavailable";

  return (
    <div
      className={`bg-[#1a1a1a] rounded-2xl border border-white/8 overflow-hidden flex flex-col transition-all duration-200 ${
        !isUnavailable
          ? "hover:border-white/15 hover:shadow-xl hover:shadow-black/40"
          : "opacity-80"
      }`}
    >
      {/* Image */}
      <div className="relative h-52 bg-[#111] overflow-hidden">
        {jockey.image ? (
          <img
            src={jockey.image}
            alt={jockey.name}
            className={`w-full h-full object-cover object-top ${
              isUnavailable ? "grayscale brightness-50" : ""
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#161616]">
            <User size={48} className="text-gray-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/10 to-transparent" />
        <div
          className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${cfg.bg} ${cfg.border} ${cfg.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {jockey.status}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-4 pb-5 flex flex-col gap-3 flex-1">
        <div>
          <h3
            className="text-[19px] font-bold text-white leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {jockey.name}
          </h3>
          <p className="text-[10.5px] font-semibold tracking-widest text-gray-600 uppercase mt-0.5">
            {jockey.rank} Rank · {jockey.country}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#141414] rounded-lg px-3 py-2.5 border border-white/6">
            <p className="text-[10px] font-semibold tracking-widest text-gray-600 uppercase mb-1">
              Win Rate
            </p>
            <p className={`text-[15px] font-bold ${isUnavailable ? "text-gray-500" : "text-green-400"}`}>
              {jockey.winRate}%
            </p>
          </div>
          <div className="bg-[#141414] rounded-lg px-3 py-2.5 border border-white/6">
            <p className="text-[10px] font-semibold tracking-widest text-gray-600 uppercase mb-1">
              Starts
            </p>
            <p className="text-[15px] font-bold text-white">{jockey.starts.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-[#141414] rounded-lg px-3 py-2.5 border border-white/6 flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-widest text-gray-600 uppercase">
            Base Fee / Race
          </p>
          <p className="text-[13.5px] font-bold text-white">
            {jockey.baseFee !== null ? `$${jockey.baseFee.toLocaleString()}` : "Contract"}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={onDetail}
            className="flex-1 py-2.5 rounded-lg border border-white/12 text-gray-300 text-[12px] font-semibold hover:border-white/28 hover:text-white transition-all duration-150"
          >
            Details
          </button>
          <button
            disabled={isUnavailable}
            className={`flex-1 py-2.5 rounded-lg text-[12px] font-bold transition-all duration-150 flex items-center justify-center gap-1.5 ${
              isUnavailable
                ? "bg-[#242424] border border-white/8 text-gray-600 cursor-not-allowed"
                : "bg-red-700 hover:bg-red-600 text-white shadow-lg shadow-red-900/30"
            }`}
          >
            {isUnavailable ? "Unavailable" : (
              <>Hire <Diamond size={11} className="text-red-300" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function JockeysPage() {
  const [rankFilter,   setRankFilter]   = useState("All");
  const [weightFilter, setWeightFilter] = useState("Weight: All");
  const [regionFilter, setRegionFilter] = useState("Region: Global");
  const [visibleCount, setVisibleCount] = useState(8);
  const [selected,     setSelected]     = useState<Jockey | null>(null);

  const filtered = JOCKEYS.filter((j) => rankFilter === "All" || j.rank === rankFilter);
  const visible  = filtered.slice(0, visibleCount);

  return (
    <div className="flex-1 px-8 py-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Modal */}
      {selected && (
        <JockeyDetailModal jockey={selected} onClose={() => setSelected(null)} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-[36px] font-bold text-white leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Jockey Marketplace
          </h1>
          <p className="text-[13px] text-gray-500 mt-1">
            Browse, evaluate, and hire elite riders for your stable.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <SlidersHorizontal size={14} className="text-gray-500" />
          <FilterSelect
            options={RANKS.map((r) => (r === "All" ? "Rank: All" : r))}
            value={rankFilter === "All" ? "Rank: All" : rankFilter}
            onChange={(v) => setRankFilter(v === "Rank: All" ? "All" : v)}
          />
          <FilterSelect options={WEIGHTS} value={weightFilter} onChange={setWeightFilter} />
          <FilterSelect options={REGIONS} value={regionFilter} onChange={setRegionFilter} />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {visible.map((jockey) => (
          <JockeyCard
            key={jockey.id}
            jockey={jockey}
            onDetail={() => setSelected(jockey)}
          />
        ))}
      </div>

      {/* Load more */}
      {visibleCount < filtered.length && (
        <div className="flex justify-center mt-10">
          <button
            onClick={() => setVisibleCount((c) => c + 4)}
            className="flex items-center gap-2 text-[13px] text-gray-400 font-medium hover:text-white transition-colors duration-150"
          >
            Load More <ChevronDown size={15} />
          </button>
        </div>
      )}
    </div>
  );
}