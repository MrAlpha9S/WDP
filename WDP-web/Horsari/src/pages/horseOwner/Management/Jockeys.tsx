import { useState, useEffect } from "react";
import { ChevronDown, SlidersHorizontal, User, Diamond, Loader2 } from "lucide-react";
import JockeyDetailModal, { type Jockey, STATUS_CFG } from "../../../components/ownerComponents/JockeyModal/Jockeydetailmodal";
import HireJockeyModal from "../../../components/ownerComponents/JockeyModal/Hirejockey";
import { horseOwnerService } from "../../../api/horseOwnerService";

const RANKS   = ["All", "Elite", "Pro", "Veteran", "Apprentice"] as const;
const WEIGHTS = ["Weight: All", "Under 54kg", "54–56kg", "Over 56kg"];
const REGIONS = ["Region: Global", "Europe", "Asia", "Americas", "Oceania"];

// ── API mapper ────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiToJockey(raw: any, index: number): Jockey {
  // Derive age from dateOfBirth
  const age = raw.dateOfBirth
    ? new Date().getFullYear() - new Date(raw.dateOfBirth).getFullYear()
    : 0;

  const VALID_STATUSES = ["Available", "In Talks", "Unavailable"] as const;
  const VALID_RANKS = ["Elite", "Pro", "Veteran", "Apprentice"] as const;

  const statusMap: Record<string, string> = {
    active:      "Available",
    pending:     "In Talks",
    inactive:    "Unavailable",
    available:   "Available",
    "in talks":  "In Talks",
    unavailable: "Unavailable",
  };

  const rawStatus = (raw.licenseStatus ?? raw.status ?? "").toLowerCase();
  const mappedStatus = statusMap[rawStatus] ?? "Unavailable";
  const status = VALID_STATUSES.includes(mappedStatus as typeof VALID_STATUSES[number])
    ? (mappedStatus as Jockey["status"])
    : "Unavailable";

  const rawRankValue = typeof raw.ranking === "string"
    ? raw.ranking
    : typeof raw.rank === "string"
      ? raw.rank
      : "";
  const rank = VALID_RANKS.includes(rawRankValue as typeof VALID_RANKS[number])
    ? (rawRankValue as Jockey["rank"])
    : "Apprentice";

  return {
    id:          raw._id                             ?? index,
    name:        raw.fullName      ?? raw.username   ?? "Unknown",
    rank:        rank,
    country:     raw.country       ?? "N/A",
    status:      status,
    winRate:     raw.totalWins && raw.matchesRaced
                   ? parseFloat(((raw.totalWins / raw.matchesRaced) * 100).toFixed(1))
                   : 0,
    starts:      raw.matchesRaced  ?? 0,
    wins:        raw.totalWins     ?? 0,
    places:      raw.places        ?? 0,
    baseFee:     raw.baseFee       ?? null,
    weight:      raw.weight ? `${raw.weight} kg` : "N/A",
    age,
    experience:  raw.experience    ?? "N/A",
    specialties: raw.specialties   ?? [],
    recentRaces: raw.recentRaces   ?? [],
    image:       raw.image || null,
  };
}

// ── Filter dropdown ───────────────────────────────────────────────────────────
function FilterSelect({ options, value, onChange }: {
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
      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function JockeySkeleton() {
  return (
    <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden animate-pulse">
      <div className="h-52 bg-white/5" />
      <div className="px-4 pt-4 pb-5 flex flex-col gap-3">
        <div className="h-5 w-2/3 bg-white/8 rounded" />
        <div className="h-3 w-1/2 bg-white/5 rounded" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-12 bg-white/5 rounded-lg" />
          <div className="h-12 bg-white/5 rounded-lg" />
        </div>
        <div className="h-10 bg-white/5 rounded-lg" />
        <div className="flex gap-2 mt-auto">
          <div className="flex-1 h-9 bg-white/5 rounded-lg" />
          <div className="flex-1 h-9 bg-white/5 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ── Jockey Card ───────────────────────────────────────────────────────────────
function JockeyCard({ jockey, onDetail, onHire }: { jockey: Jockey; onDetail: () => void; onHire: () => void }) {
  const cfg           = STATUS_CFG[jockey.status] ?? STATUS_CFG["Unavailable"];
  const isUnavailable = jockey.status === "Unavailable";

  return (
    <div
      className={`bg-[#1a1a1a] rounded-2xl border border-white/8 overflow-hidden flex flex-col transition-all duration-200 ${
        !isUnavailable
          ? "hover:border-white/15 hover:shadow-xl hover:shadow-black/40"
          : "opacity-80"
      }`}
    >
      <div className="relative h-52 bg-[#111] overflow-hidden">
        {jockey.image ? (
          <img
            src={jockey.image}
            alt={jockey.name}
            className={`w-full h-full object-cover object-top ${isUnavailable ? "grayscale brightness-50" : ""}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#161616]">
            <User size={48} className="text-gray-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/10 to-transparent" />
        <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${cfg.bg} ${cfg.border} ${cfg.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {jockey.status}
        </div>
      </div>

      <div className="px-4 pt-4 pb-5 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="text-[19px] font-bold text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            {jockey.name}
          </h3>
          <p className="text-[10.5px] font-semibold tracking-widest text-gray-600 uppercase mt-0.5">
            {jockey.rank} Rank · {jockey.country}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#141414] rounded-lg px-3 py-2.5 border border-white/6">
            <p className="text-[10px] font-semibold tracking-widest text-gray-600 uppercase mb-1">Win Rate</p>
            <p className={`text-[15px] font-bold ${isUnavailable ? "text-gray-500" : "text-green-400"}`}>
              {jockey.winRate}%
            </p>
          </div>
          <div className="bg-[#141414] rounded-lg px-3 py-2.5 border border-white/6">
            <p className="text-[10px] font-semibold tracking-widest text-gray-600 uppercase mb-1">Starts</p>
            <p className="text-[15px] font-bold text-white">{jockey.starts.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-[#141414] rounded-lg px-3 py-2.5 border border-white/6 flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-widest text-gray-600 uppercase">Base Fee / Race</p>
          <p className="text-[13.5px] font-bold text-white">
            {jockey.baseFee !== null ? `$${jockey.baseFee.toLocaleString()}` : "Contract"}
          </p>
        </div>

        <div className="flex gap-2 mt-auto">
          <button
            onClick={onDetail}
            className="flex-1 py-2.5 rounded-lg border border-white/12 text-gray-300 text-[12px] font-semibold hover:border-white/28 hover:text-white transition-all duration-150"
          >
            Details
          </button>
          <button
            disabled={isUnavailable}
            onClick={isUnavailable ? undefined : onHire}
            className={`flex-1 py-2.5 rounded-lg text-[12px] font-bold transition-all duration-150 flex items-center justify-center gap-1.5 ${
              isUnavailable
                ? "bg-[#242424] border border-white/8 text-gray-600 cursor-not-allowed"
                : "bg-red-700 hover:bg-red-600 text-white shadow-lg shadow-red-900/30"
            }`}
          >
            {isUnavailable ? "Unavailable" : <><span>Hire</span> <Diamond size={11} className="text-red-300" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function JockeysPage() {
  const [jockeys,      setJockeys]      = useState<Jockey[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [rankFilter,   setRankFilter]   = useState("All");
  const [weightFilter, setWeightFilter] = useState("Weight: All");
  const [regionFilter, setRegionFilter] = useState("Region: Global");
  const [visibleCount, setVisibleCount] = useState(8);
  const [selected,     setSelected]     = useState<Jockey | null>(null);
  const [hiring,       setHiring]       = useState<Jockey | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchJockeys() {
      try {
        setLoading(true);
        setError(null);
        const data = await horseOwnerService.getAllJockey();

        if (cancelled) return;

        const raw: unknown[] = data?.data?.jockeys ?? [];
        setJockeys(raw.map((item, i) => mapApiToJockey(item, i)));
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : typeof err === "object" && err !== null && "message" in err
                ? String((err as { message: unknown }).message)
                : "Failed to load jockeys.";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchJockeys();
    return () => { cancelled = true; };
  }, []);

  const filtered = jockeys.filter((j) => rankFilter === "All" || j.rank === rankFilter);
  const visible  = filtered.slice(0, visibleCount);

  return (
    <div className="flex-1 px-8 py-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {selected && (
        <JockeyDetailModal jockey={selected} onClose={() => setSelected(null)} />
      )}
      {hiring && (
        <HireJockeyModal
          jockey={hiring}
          onClose={() => setHiring(null)}
          onConfirm={async (payload) => {
            console.log("Hire payload:", payload);
            await horseOwnerService.HireJockey(payload)
            setHiring(null);
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[36px] font-bold text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
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

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-600 text-[12px] mb-2">
            <Loader2 size={13} className="animate-spin" /> Loading jockeys…
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <JockeySkeleton key={i} />)}
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border border-red-700/30 bg-red-900/10 px-5 py-4 text-[13px] text-red-400">
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && jockeys.length === 0 && (
        <div className="rounded-xl border border-white/8 bg-white/3 px-5 py-8 text-center text-[13px] text-gray-600">
          No jockeys found.
        </div>
      )}

      {/* Grid */}
      {!loading && !error && jockeys.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {visible.map((jockey) => (
              <JockeyCard key={jockey.id} jockey={jockey} onDetail={() => setSelected(jockey)} onHire={() => setHiring(jockey)} />
            ))}
          </div>

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
        </>
      )}
    </div>
  );
}