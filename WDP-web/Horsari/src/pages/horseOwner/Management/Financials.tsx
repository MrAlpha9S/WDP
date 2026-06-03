import { useState } from "react";
import {
  TrendingUp, TrendingDown, Minus, Trophy,
  Wallet, BarChart2, Search, ChevronRight,
  Plus, Minus as MinusIcon,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type ChartRange = "7D" | "30D" | "ALL";
type Outcome = "win" | "loss";

interface ActivityRow {
  id: number;
  race: string;
  horse: string;
  jockey: string;
  entryFee: number;
  outcome: number; // positive = win, negative = loss
  type: Outcome;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const ACTIVITY: ActivityRow[] = [
  { id: 1, race: "Emerald Derby Final",      horse: "Midnight Comet",   jockey: "V. Rossi",   entryFee: 500,  outcome: 12500,  type: "win"  },
  { id: 2, race: "Golden Sands Sprint",      horse: "Sandstorm Walker", jockey: "A. Dubois",  entryFee: 1200, outcome: -1200,  type: "loss" },
  { id: 3, race: "Royal Oaks Invitational",  horse: "Royal Majesty",    jockey: "M. Smith",   entryFee: 2500, outcome: 45000,  type: "win"  },
  { id: 4, race: "Winter Classic Stakes",    horse: "Frostbite",        jockey: "K. Tanaka",  entryFee: 800,  outcome: -800,   type: "loss" },
  { id: 5, race: "Ascot Heritage Cup",       horse: "Crimson Velocity", jockey: "L. Dettori", entryFee: 1500, outcome: 8200,   type: "win"  },
  { id: 6, race: "Dubai Midnight Classic",   horse: "Iron Ledger",      jockey: "F. Dettori", entryFee: 3000, outcome: -3000,  type: "loss" },
];

// Chart bars per range (heights as % of max, label, highlight)
const CHART_DATA: Record<ChartRange, { label: string; value: number; highlight: boolean }[]> = {
  "7D": [
    { label: "MON", value: 30, highlight: false },
    { label: "TUE", value: 55, highlight: false },
    { label: "WED", value: 90, highlight: true  },
    { label: "THU", value: 40, highlight: false },
    { label: "FRI", value: 70, highlight: false },
    { label: "SAT", value: 35, highlight: false },
    { label: "SUN", value: 50, highlight: false },
  ],
  "30D": [
    { label: "JAN 01", value: 35, highlight: false },
    { label: "JAN 10", value: 82, highlight: true  },
    { label: "JAN 20", value: 50, highlight: false },
    { label: "JAN 25", value: 65, highlight: false },
    { label: "JAN 30", value: 75, highlight: false },
  ],
  "ALL": [
    { label: "Q1", value: 40, highlight: false },
    { label: "Q2", value: 60, highlight: false },
    { label: "Q3", value: 88, highlight: true  },
    { label: "Q4", value: 55, highlight: false },
    { label: "Q5", value: 72, highlight: false },
    { label: "Q6", value: 45, highlight: false },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return `${n}`;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, sub, subColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  subColor: string;
}) {
  return (
    <div className="bg-[#1a1a1a] border border-white/8 rounded-xl px-5 py-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[10.5px] font-bold tracking-widest text-gray-600 uppercase">{label}</p>
        <span className="text-gray-600">{icon}</span>
      </div>
      <p className="text-[30px] font-bold text-white leading-none"
        style={{ fontFamily: "'Playfair Display', serif" }}>
        {value}
      </p>
      <p className={`text-[11.5px] font-medium flex items-center gap-1 ${subColor}`}>
        {sub}
      </p>
    </div>
  );
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({ range }: { range: ChartRange }) {
  const bars = CHART_DATA[range];
  const peak = bars.find((b) => b.highlight);

  return (
    <div className="flex items-end gap-2 h-36 w-full">
      {bars.map((bar, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          {bar.highlight && (
            <span className="text-[9.5px] font-bold text-white bg-red-700 px-1.5 py-0.5 rounded whitespace-nowrap">
              28k
            </span>
          )}
          <div
            className={`w-full rounded-t transition-all duration-500 min-h-[4px] ${
              bar.highlight ? "bg-red-600" : "bg-[#2e2e2e] hover:bg-[#3e3e3e]"
            }`}
            style={{ height: `${bar.value}%` }}
          />
          <span className="text-[9px] text-gray-600 whitespace-nowrap">{bar.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Top-up Panel ──────────────────────────────────────────────────────────────
function TopUpPanel() {
  const [amount, setAmount] = useState(0);
  const pts = Math.floor(amount / 1000);

  return (
    <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Wallet size={14} className="text-yellow-500" />
        <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">Top Up Points</p>
      </div>

      {/* Amount input */}
      <div>
        <p className="text-[10px] font-semibold tracking-widest text-gray-600 uppercase mb-2">
          Enter Amount (VND)
        </p>
        <div className="bg-[#111] border border-white/10 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-[22px] font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            {amount.toLocaleString()}
          </span>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setAmount((a) => a + 100000)}
              className="w-5 h-5 rounded bg-white/8 flex items-center justify-center text-gray-400 hover:bg-white/15 hover:text-white transition-colors duration-100"
            >
              <Plus size={10} />
            </button>
            <button
              onClick={() => setAmount((a) => Math.max(0, a - 100000))}
              className="w-5 h-5 rounded bg-white/8 flex items-center justify-center text-gray-400 hover:bg-white/15 hover:text-white transition-colors duration-100"
            >
              <MinusIcon size={10} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-[11px] text-gray-600">Expected Points:</p>
          <p className={`text-[11px] font-bold ${pts > 0 ? "text-yellow-400" : "text-gray-600"}`}>
            {pts.toLocaleString()} PTS
          </p>
        </div>
      </div>

      {/* Quick amounts */}
      <div className="grid grid-cols-3 gap-2">
        {[100000, 500000, 1000000].map((val) => (
          <button
            key={val}
            onClick={() => setAmount(val)}
            className={`py-1.5 rounded-lg text-[11.5px] font-semibold border transition-all duration-150 ${
              amount === val
                ? "bg-yellow-600/20 border-yellow-600/50 text-yellow-400"
                : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
            }`}
          >
            {val >= 1000000 ? `${val / 1000000}M` : `${val / 1000}k`}
          </button>
        ))}
      </div>

      {/* Purchase button */}
      <button
        disabled={pts === 0}
        className={`w-full py-2.5 rounded-lg text-[12px] font-bold tracking-widest uppercase transition-all duration-150 ${
          pts > 0
            ? "bg-yellow-600 hover:bg-yellow-500 text-black shadow-lg shadow-yellow-900/30"
            : "bg-[#222] border border-white/8 text-gray-600 cursor-not-allowed"
        }`}
      >
        Purchase Points
      </button>

      <p className="text-[10px] text-gray-700 text-center">
        Exchange rate: 1,000 VND = 1 Point
      </p>
    </div>
  );
}

// ── Financials Page ───────────────────────────────────────────────────────────
export default function FinancialsPage() {
  const [chartRange, setChartRange] = useState<ChartRange>("30D");
  const [search,     setSearch]     = useState("");

  const filtered = ACTIVITY.filter(
    (r) =>
      r.race.toLowerCase().includes(search.toLowerCase()) ||
      r.horse.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="flex-1 px-8 py-8 min-h-screen bg-[#111111] text-white"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Top header ───────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-gray-600 uppercase mb-1">Management</p>
          <h1 className="text-[28px] font-black text-white tracking-tight uppercase"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            Financial Overview
          </h1>
          <p className="text-[12.5px] text-gray-500 mt-1">
            Real-time point accumulation and race performance metrics.
          </p>
        </div>

        {/* Balance badges */}
        <div className="flex items-center gap-3 mt-1">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl px-5 py-3 text-center">
            <p className="text-[9.5px] font-bold tracking-widest text-gray-500 uppercase mb-1">Total Earnings</p>
            <p className="text-[18px] font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              1,245,000 <span className="text-[11px] text-gray-500 font-semibold">PTS</span>
            </p>
          </div>
          <div className="bg-red-800 border border-red-700/60 rounded-xl px-5 py-3 text-center shadow-lg shadow-red-900/40">
            <p className="text-[9.5px] font-bold tracking-widest text-red-300 uppercase mb-1">Available Balance</p>
            <p className="text-[18px] font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              48,250 <span className="text-[11px] text-red-300 font-semibold">PTS</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<TrendingUp size={15} />}
          label="Total Wins"
          value="142"
          sub="↑ +12.5% vs last month"
          subColor="text-green-400"
        />
        <StatCard
          icon={<TrendingDown size={15} />}
          label="Total Losses"
          value="68"
          sub="↓ -4.2% reduction streak"
          subColor="text-red-400"
        />
        <StatCard
          icon={<Minus size={15} />}
          label="Net Profit"
          value="+842k"
          sub="◎ ROI: 164%"
          subColor="text-yellow-400"
        />
        <StatCard
          icon={<Trophy size={15} />}
          label="Global Rank"
          value="#24"
          sub="★ Top 2% of Performers"
          subColor="text-yellow-400"
        />
      </div>

      {/* ── Main grid: chart + top-up ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-5 mb-6">

        {/* Performance Trends chart */}
        <div className="col-span-2 bg-[#1a1a1a] border border-white/8 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart2 size={14} className="text-red-500" />
              <p className="text-[12px] font-bold tracking-widest text-gray-400 uppercase">
                Performance Trends
              </p>
            </div>
            <div className="flex items-center bg-[#111] border border-white/8 rounded-lg overflow-hidden">
              {(["7D", "30D", "ALL"] as ChartRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setChartRange(r)}
                  className={`px-3.5 py-1.5 text-[11px] font-bold transition-colors duration-150 ${
                    chartRange === r
                      ? "bg-red-700 text-white"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <BarChart range={chartRange} />
        </div>

        {/* Top Up Points */}
        <TopUpPanel />
      </div>

      {/* ── Recent Activity ───────────────────────────────────────────────── */}
      <div className="bg-[#1a1a1a] border border-white/8 rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <p className="text-[13px] font-semibold text-white">Recent Activity</p>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              type="text"
              placeholder="Search races..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#111] border border-white/10 rounded-lg pl-8 pr-4 py-1.5 text-[12px] text-gray-300 placeholder-gray-600 focus:outline-none focus:border-white/20 transition-colors duration-150 w-44"
            />
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] px-6 py-2.5 border-b border-white/5">
          {["Race Name", "Horse", "Jockey", "Entry Fee", "Outcome"].map((h) => (
            <span key={h} className="text-[10px] font-bold tracking-widest text-gray-600 uppercase">
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {filtered.map((row, i) => (
          <div
            key={row.id}
            className={`grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] px-6 py-3.5 items-center hover:bg-white/[0.025] transition-colors duration-150 ${
              i !== filtered.length - 1 ? "border-b border-white/5" : ""
            }`}
          >
            {/* Race name + icon */}
            <div className="flex items-center gap-2.5">
              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                row.type === "win" ? "bg-red-900/60" : "bg-gray-800"
              }`}>
                <Trophy size={10} className={row.type === "win" ? "text-red-400" : "text-gray-600"} />
              </div>
              <span className="text-[13px] font-medium text-white">{row.race}</span>
            </div>
            <span className="text-[13px] text-gray-400">{row.horse}</span>
            <span className="text-[13px] text-gray-400">{row.jockey}</span>
            <span className="text-[13px] text-gray-400">{row.entryFee.toLocaleString()} pts</span>
            <span className={`text-[13.5px] font-bold ${row.outcome > 0 ? "text-green-400" : "text-red-400"}`}>
              {row.outcome > 0 ? "+" : ""}{row.outcome.toLocaleString()} pts
            </span>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-10 text-center text-gray-600 text-[13px]">No races found.</div>
        )}

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/8 flex justify-center">
          <button className="flex items-center gap-1.5 text-[11.5px] font-bold tracking-widest text-red-500 hover:text-red-400 uppercase transition-colors duration-150">
            View Full Transaction History <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}