import { useState, useEffect, useRef } from "react";
import {
  TrendingUp, TrendingDown, Minus, Trophy,
  BarChart2, Search, ChevronRight,
  Loader2, AlertTriangle,
} from "lucide-react";
import { horseOwnerService, type FinancialSummary, type FinancialRaceRow } from "../../../api/horseOwnerService";
import PaymentsPanel from "../../../components/PaymentsPanel";

// ── Types ─────────────────────────────────────────────────────────────────────
type ChartRange = "7D" | "30D" | "ALL";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return `${n}`;
}

function positionLabel(pos: number | null) {
  if (pos == null) return "—";
  const suffixes = ["st", "nd", "rd"];
  return `${pos}${suffixes[pos - 1] ?? "th"}`;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, subColor }: {
  icon: React.ReactNode; label: string; value: string; sub: string; subColor: string;
}) {
  return (
    <div className="bg-[#1a1a1a] border border-white/8 rounded-xl px-5 py-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[10.5px] font-bold tracking-widest text-gray-600 uppercase">{label}</p>
        <span className="text-gray-600">{icon}</span>
      </div>
      <p className="text-[30px] font-bold text-white leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
        {value}
      </p>
      <p className={`text-[11.5px] font-medium flex items-center gap-1 ${subColor}`}>{sub}</p>
    </div>
  );
}

// ── Placeholder bar chart (static until real time-series data exists) ─────────
const CHART_DATA: Record<ChartRange, { label: string; value: number; highlight: boolean }[]> = {
  "7D": [
    { label: "MON", value: 30, highlight: false },
    { label: "TUE", value: 55, highlight: false },
    { label: "WED", value: 90, highlight: true },
    { label: "THU", value: 40, highlight: false },
    { label: "FRI", value: 70, highlight: false },
    { label: "SAT", value: 35, highlight: false },
    { label: "SUN", value: 50, highlight: false },
  ],
  "30D": [
    { label: "W1", value: 35, highlight: false },
    { label: "W2", value: 82, highlight: true },
    { label: "W3", value: 50, highlight: false },
    { label: "W4", value: 65, highlight: false },
  ],
  "ALL": [
    { label: "Q1", value: 40, highlight: false },
    { label: "Q2", value: 60, highlight: false },
    { label: "Q3", value: 88, highlight: true },
    { label: "Q4", value: 55, highlight: false },
  ],
};

function BarChart({ range }: { range: ChartRange }) {
  const bars = CHART_DATA[range];
  return (
    <div className="flex items-end gap-2 h-36 w-full">
      {bars.map((bar, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          {bar.highlight && (
            <span className="text-[9.5px] font-bold text-white bg-red-700 px-1.5 py-0.5 rounded whitespace-nowrap">
              Peak
            </span>
          )}
          <div
            className={`w-full rounded-t transition-all duration-500 min-h-[4px] ${bar.highlight ? "bg-red-600" : "bg-[#2e2e2e] hover:bg-[#3e3e3e]"}`}
            style={{ height: `${bar.value}%` }}
          />
          <span className="text-[9px] text-gray-600 whitespace-nowrap">{bar.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Violation badge ───────────────────────────────────────────────────────────
function ViolationBadge({ count }: { count: number }) {
  if (count === 0) return <span className="text-gray-600 text-[12px]">—</span>;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-900/20 border border-red-700/30 rounded px-2 py-0.5">
      <AlertTriangle size={10} /> {count}
    </span>
  );
}

// ── Financials Page ───────────────────────────────────────────────────────────
export default function FinancialsPage() {
  const [chartRange, setChartRange] = useState<ChartRange>("30D");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [rows, setRows] = useState<FinancialRaceRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [rowsError, setRowsError] = useState<string | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [search]);

  // Fetch summary once
  useEffect(() => {
    let cancelled = false;
    async function fetchSummary() {
      try {
        setSummaryLoading(true);
        const res = await horseOwnerService.getFinancialSummary();
        if (!cancelled) setSummary(res.data);
      } catch {
        // leave summary null, stat cards show "—"
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    }
    fetchSummary();
    return () => { cancelled = true; };
  }, []);

  // Fetch race results when page or search changes
  useEffect(() => {
    let cancelled = false;
    async function fetchRows() {
      try {
        setRowsLoading(true);
        setRowsError(null);
        const res = await horseOwnerService.getFinancialRaceResults(page, 10, debouncedSearch || undefined);
        if (cancelled) return;
        setRows(res.data.items);
        setTotalPages(res.data.pagination.totalPages);
      } catch (err: unknown) {
        if (!cancelled) {
          setRowsError(err instanceof Error ? err.message : "Failed to load race results.");
        }
      } finally {
        if (!cancelled) setRowsLoading(false);
      }
    }
    fetchRows();
    return () => { cancelled = true; };
  }, [page, debouncedSearch]);

  const s = summary;

  return (
    <div className="flex-1 px-8 py-8 min-h-screen bg-[#111111] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Top header ───────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-gray-600 uppercase mb-1">Management</p>
          <h1 className="text-[28px] font-black text-white tracking-tight uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>
            Financial Overview
          </h1>
          <p className="text-[12.5px] text-gray-500 mt-1">Race earnings, jockey payouts, and violation reports.</p>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl px-5 py-3 text-center">
            <p className="text-[9.5px] font-bold tracking-widest text-gray-500 uppercase mb-1">Net Profit</p>
            <p className="text-[18px] font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              {summaryLoading ? "…" : fmt(s?.netProfit ?? 0)}
              {" "}<span className="text-[11px] text-gray-500 font-semibold">₫</span>
            </p>
          </div>
          <div className="bg-red-800 border border-red-700/60 rounded-xl px-5 py-3 text-center shadow-lg shadow-red-900/40">
            <p className="text-[9.5px] font-bold tracking-widest text-red-300 uppercase mb-1">Balance</p>
            <p className="text-[18px] font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              {summaryLoading ? "…" : fmt(s?.balance ?? 0)}
              {" "}<span className="text-[11px] text-red-300 font-semibold">₫</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<TrendingUp size={15} />}
          label="Total Wins"
          value={summaryLoading ? "…" : String(s?.totalWins ?? 0)}
          sub={`out of ${s?.totalRaces ?? 0} races`}
          subColor="text-green-400"
        />
        <StatCard
          icon={<TrendingDown size={15} />}
          label="Total Losses"
          value={summaryLoading ? "…" : String(s?.totalLosses ?? 0)}
          sub="non-winning finishes"
          subColor="text-red-400"
        />
        <StatCard
          icon={<Minus size={15} />}
          label="Total Prize"
          value={summaryLoading ? "…" : `+${fmt(s?.totalPrize ?? 0)}`}
          sub={`Jockey payout: ${fmt(s?.totalJockeyPayout ?? 0)} ₫`}
          subColor="text-yellow-400"
        />
        <StatCard
          icon={<Trophy size={15} />}
          label="Violations"
          value={summaryLoading ? "…" : String(s?.totalViolations ?? 0)}
          sub={s?.totalViolations ? "review required" : "clean record"}
          subColor={s?.totalViolations ? "text-red-400" : "text-gray-500"}
        />
      </div>

      {/* ── Race Activity ─────────────────────────────────────────────────── */}
      <div className="bg-[#1a1a1a] border border-white/8 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <p className="text-[13px] font-semibold text-white">Race Activity</p>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              type="text"
              placeholder="Search races or horses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-[#111] border border-white/10 rounded-lg pl-8 pr-4 py-1.5 text-[12px] text-gray-300 placeholder-gray-600 focus:outline-none focus:border-white/20 transition-colors duration-150 w-52"
            />
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr_1fr] px-6 py-2.5 border-b border-white/5">
          {["Race", "Horse", "Jockey", "Position", "Prize", "Jockey Pay", "Violations"].map(h => (
            <span key={h} className="text-[10px] font-bold tracking-widest text-gray-600 uppercase">{h}</span>
          ))}
        </div>

        {/* Loading */}
        {rowsLoading && (
          <div className="flex items-center justify-center gap-2 py-10 text-gray-600 text-[12px]">
            <Loader2 size={13} className="animate-spin" /> Loading…
          </div>
        )}

        {/* Error */}
        {!rowsLoading && rowsError && (
          <div className="px-6 py-6 text-[13px] text-red-400">{rowsError}</div>
        )}

        {/* Empty */}
        {!rowsLoading && !rowsError && rows.length === 0 && (
          <div className="py-10 text-center text-gray-600 text-[13px]">No race activity found.</div>
        )}

        {/* Rows */}
        {!rowsLoading && !rowsError && rows.map((row, i) => (
          <div
            key={String(row.registrationId)}
            className={`grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr_1fr] px-6 py-3.5 items-center hover:bg-white/[0.025] transition-colors duration-150 ${i !== rows.length - 1 ? "border-b border-white/5" : ""}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${row.finishPosition === 1 ? "bg-red-900/60" : "bg-gray-800"}`}>
                <Trophy size={10} className={row.finishPosition === 1 ? "text-red-400" : "text-gray-600"} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-white truncate">{row.race.name}</p>
                {row.race.date && (
                  <p className="text-[10px] text-gray-600">
                    {new Date(row.race.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                )}
              </div>
            </div>
            <span className="text-[13px] text-gray-400 truncate">{row.horse.name}</span>
            <span className="text-[13px] text-gray-400 truncate">{row.jockey?.name ?? "—"}</span>
            <span className={`text-[13px] font-semibold ${row.finishPosition === 1 ? "text-yellow-400" : row.finishPosition != null ? "text-gray-300" : "text-gray-600"}`}>
              {positionLabel(row.finishPosition)}
            </span>
            <span className={`text-[13.5px] font-bold ${row.prizeMoney > 0 ? "text-green-400" : "text-gray-600"}`}>
              {row.prizeMoney > 0 ? `+${fmt(row.prizeMoney)}` : "—"} ₫
            </span>
            <span className="text-[13px] text-gray-500">
              {row.jockeyPayout > 0 ? `-${fmt(row.jockeyPayout)} ₫` : "—"}
            </span>
            <ViolationBadge count={row.violations.length} />
          </div>
        ))}

        {/* Pagination */}
        {totalPages > 1 && !rowsLoading && (
          <div className="px-6 py-3.5 border-t border-white/8 flex items-center justify-between">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="text-[11.5px] font-bold text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
            >
              ← Prev
            </button>
            <span className="text-[11px] text-gray-600">Page {page} of {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="text-[11.5px] font-bold text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
            >
              Next →
            </button>
          </div>
        )}

        {/* Footer */}
        {totalPages <= 1 && rows.length > 0 && (
          <div className="px-6 py-3.5 border-t border-white/8 flex justify-center">
            <button className="flex items-center gap-1.5 text-[11.5px] font-bold tracking-widest text-red-500 hover:text-red-400 uppercase transition-colors duration-150">
              View Full Transaction History <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Payment verification (statistical wallet tracking only) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <PaymentsPanel
          title="Payments to Jockeys"
          fetchPayments={(page, sortBy, order) => horseOwnerService.getPayments(page, 10, undefined, 'payer', sortBy, order)}
          onConfirm={horseOwnerService.confirmPaymentPaid}
          myRoleSide="payer"
          confirmLabel="Confirm Paid"
          cacheKey="owner-payments-payer"
        />
        <PaymentsPanel
          title="Prize Money Owed to You"
          fetchPayments={(page, sortBy, order) => horseOwnerService.getPayments(page, 10, undefined, 'payee', sortBy, order)}
          onConfirm={horseOwnerService.confirmPaymentReceived}
          myRoleSide="payee"
          confirmLabel="Confirm Received"
          cacheKey="owner-payments-payee"
        />
      </div>
    </div>
  );
}
