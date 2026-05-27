import { useState } from "react";
import { ChevronDown, SlidersHorizontal, User, Diamond } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type JockeyStatus = "Available" | "In Talks" | "Unavailable";
type JockeyRank = "Elite" | "Pro" | "Veteran" | "Apprentice";

interface Jockey {
  id: number;
  name: string;
  rank: JockeyRank;
  country: string;
  status: JockeyStatus;
  winRate: number;
  starts: number;
  baseFee: number | null; // null = on contract
  image: string | null;
}

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
    baseFee: 2500,
    image: "https://images.unsplash.com/photo-1628157588553-5eeea00af15c?w=400&q=80",
  },
  {
    id: 2,
    name: "Elena Rostova",
    rank: "Pro",
    country: "AUS",
    status: "In Talks",
    winRate: 18.2,
    starts: 858,
    baseFee: 1200,
    image: "https://images.unsplash.com/photo-1546961342-ea5f62d5a27b?w=400&q=80",
  },
  {
    id: 3,
    name: "Takeshi Sato",
    rank: "Veteran",
    country: "JPN",
    status: "Unavailable",
    winRate: 31.4,
    starts: 3210,
    baseFee: null,
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80",
  },
  {
    id: 4,
    name: "David Chen",
    rank: "Apprentice",
    country: "USA",
    status: "Available",
    winRate: 12.1,
    starts: 145,
    baseFee: 500,
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
    baseFee: 1800,
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
  },
  {
    id: 6,
    name: "Amara Diallo",
    rank: "Elite",
    country: "FRA",
    status: "In Talks",
    winRate: 28.9,
    starts: 2105,
    baseFee: 3200,
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80",
  },
  {
    id: 7,
    name: "Carlos Mendez",
    rank: "Veteran",
    country: "ARG",
    status: "Available",
    winRate: 19.3,
    starts: 1780,
    baseFee: 950,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  },
  {
    id: 8,
    name: "Yuki Tanaka",
    rank: "Apprentice",
    country: "JPN",
    status: "Unavailable",
    winRate: 8.6,
    starts: 62,
    baseFee: 300,
    image: null,
  },
];

const RANKS: ("All" | JockeyRank)[] = ["All", "Elite", "Pro", "Veteran", "Apprentice"];
const WEIGHTS = ["Weight: All", "Under 54kg", "54–56kg", "Over 56kg"];
const REGIONS = ["Region: Global", "Europe", "Asia", "Americas", "Oceania"];

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<
  JockeyStatus,
  { dot: string; text: string; bg: string; border: string }
> = {
  Available: {
    dot: "bg-green-400",
    text: "text-green-400",
    bg: "bg-green-500/15",
    border: "border-green-500/30",
  },
  "In Talks": {
    dot: "bg-yellow-400",
    text: "text-yellow-400",
    bg: "bg-yellow-500/15",
    border: "border-yellow-500/30",
  },
  Unavailable: {
    dot: "bg-gray-500",
    text: "text-gray-400",
    bg: "bg-white/8",
    border: "border-white/10",
  },
};

// ── Jockey Card ───────────────────────────────────────────────────────────────
function JockeyCard({ jockey }: { jockey: Jockey }) {
  const cfg = STATUS_CFG[jockey.status];
  const isUnavailable = jockey.status === "Unavailable";
  const isInTalks = jockey.status === "In Talks";

  return (
    <div
      className={`bg-[#1a1a1a] rounded-2xl border border-white/8 overflow-hidden flex flex-col transition-all duration-200 ${
        !isUnavailable ? "hover:border-white/18 hover:shadow-xl hover:shadow-black/40" : "opacity-80"
      }`}
    >
      {/* Image area */}
      <div className="relative h-52 bg-[#111] overflow-hidden">
        {jockey.image ? (
          <img
            src={jockey.image}
            alt={jockey.name}
            className={`w-full h-full object-cover object-top transition-transform duration-500 ${
              !isUnavailable ? "group-hover:scale-105" : ""
            } ${isUnavailable ? "grayscale brightness-50" : ""}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#161616]">
            <User size={48} className="text-gray-700" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/10 to-transparent" />

        {/* Status badge */}
        <div
          className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${cfg.bg} ${cfg.border} ${cfg.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {jockey.status}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-4 pb-5 flex flex-col gap-4 flex-1">
        {/* Name + rank */}
        <div>
          <h3
            className="text-[20px] font-bold text-white leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {jockey.name}
          </h3>
          <p className="text-[10.5px] font-semibold tracking-widest text-gray-600 uppercase mt-0.5">
            {jockey.rank} Rank · {jockey.country}
          </p>
        </div>

        {/* Stats grid */}
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
            <p className="text-[15px] font-bold text-white">
              {jockey.starts.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Base fee */}
        {/* <div className="bg-[#141414] rounded-lg px-3 py-2.5 border border-white/6 flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-widest text-gray-600 uppercase">
            Base Fee / Race
          </p>
          <p className="text-[14px] font-bold text-white">
            {jockey.baseFee !== null ? `$${jockey.baseFee.toLocaleString()}` : "On Contract"}
          </p>
        </div> */}

        {/* CTA */}
        <div className="mt-auto">
          {isUnavailable ? (
            <button
              disabled
              className="w-full py-2.5 rounded-lg bg-[#242424] border border-white/8 text-gray-600 text-[12.5px] font-semibold tracking-wide cursor-not-allowed"
            >
              Unavailable
            </button>
          ) : isInTalks ? (
            <button className="w-full py-2.5 rounded-lg border border-white/15 text-gray-300 text-[12.5px] font-semibold tracking-wide hover:border-white/30 hover:text-white transition-all duration-150 flex items-center justify-center gap-2">
              View Profile
              <span className="text-gray-500">→</span>
            </button>
          ) : (
            <button className="w-full py-2.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-[12.5px] font-bold tracking-wide transition-colors duration-150 shadow-lg shadow-red-900/30 flex items-center justify-center gap-2">
              Hire Jockey
              <Diamond size={12} className="text-red-300" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Filter dropdown ───────────────────────────────────────────────────────────
function FilterSelect({
  options,
  value,
  onChange,
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
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown
        size={12}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
      />
    </div>
  );
}

// ── Jockeys Page ──────────────────────────────────────────────────────────────
export default function JockeysPage() {
  const [rankFilter, setRankFilter] = useState("All");
  const [weightFilter, setWeightFilter] = useState("Weight: All");
  const [regionFilter, setRegionFilter] = useState("Region: Global");
  const [visibleCount, setVisibleCount] = useState(8);

  const filtered = JOCKEYS.filter((j) => {
    const matchRank = rankFilter === "All" || j.rank === rankFilter;
    return matchRank;
  });

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="flex-1 px-8 py-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
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

        {/* Filters */}
        <div className="flex items-center gap-2 mt-2">
          <SlidersHorizontal size={14} className="text-gray-500" />
          <FilterSelect
            options={RANKS.map((r) => (r === "All" ? "Rank: All" : r))}
            value={rankFilter === "All" ? "Rank: All" : rankFilter}
            onChange={(v) => setRankFilter(v === "Rank: All" ? "All" : v)}
          />
          <FilterSelect
            options={WEIGHTS}
            value={weightFilter}
            onChange={setWeightFilter}
          />
          <FilterSelect
            options={REGIONS}
            value={regionFilter}
            onChange={setRegionFilter}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {visible.map((jockey) => (
          <JockeyCard key={jockey.id} jockey={jockey} />
        ))}
      </div>

      {/* Load more */}
      {visibleCount < filtered.length && (
        <div className="flex justify-center mt-10">
          <button
            onClick={() => setVisibleCount((c) => c + 4)}
            className="flex items-center gap-2 text-[13px] text-gray-400 font-medium hover:text-white transition-colors duration-150"
          >
            Load More
            <ChevronDown size={15} />
          </button>
        </div>
      )}
    </div>
  );
}