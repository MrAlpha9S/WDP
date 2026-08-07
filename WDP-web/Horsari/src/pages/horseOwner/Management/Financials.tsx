import { useState, useEffect, useRef, useCallback } from "react";
import {
  TrendingUp, TrendingDown, Coins, Trophy,
  BarChart2, Search,
  Loader2, AlertTriangle, Medal, Calendar
} from "lucide-react";
import { horseOwnerService, type FinancialSummary, type FinancialRaceRow } from "../../../api/horseOwnerService";
import PaymentsPanel from "../../../components/PaymentsPanel";
import { useSocket } from "../../../providers/SocketProvider";
import { RefetchButton } from "../../../components/RefetchButton";
import { ErrorState } from "../../../components/ErrorState";

// ── Types ─────────────────────────────────────────────────────────────────────
type ChartRange = "day" | "week" | "month" | "year";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) { return n.toLocaleString("vi-VN"); }

function positionLabel(pos: number | null) {
  if (pos == null) return "—";
  const suffixes = ["st", "nd", "rd"];
  return `${pos}${suffixes[pos - 1] ?? "th"}`;
}

function fmtDate(d: string, groupBy: ChartRange) {
    let y, m, day;
    if (groupBy === 'day' && d.length >= 10) {
        [y, m, day] = d.split('-');
        return `${day}/${m}/${y}`;
    }
    if (groupBy === 'week') {
        const [yy, w] = d.split('-');
        const date = new Date(parseInt(yy), 0, 1 + (parseInt(w) - 1) * 7);
        day = date.getDate().toString().padStart(2, '0');
        m = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${m}/${date.getFullYear()}`;
    }
    if (groupBy === 'month') {
        [y, m] = d.split('-');
        return `01/${m}/${y}`;
    }
    if (groupBy === 'year') {
        return `01/01/${d}`;
    }
    return d;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, subColor, loading }: {
  icon: React.ReactNode; label: string; value: string; sub: string; subColor: string; loading?: boolean;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl px-5 py-4 flex flex-col gap-2 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        {icon}
      </div>
      <div className="flex items-center justify-between relative z-10">
        <p className="text-[10.5px] font-bold tracking-widest text-text-muted uppercase">{label}</p>
      </div>
      <p className="text-[28px] font-black text-text leading-none tracking-tight font-sans">
        {loading ? <span className="animate-pulse text-text-muted/50">…</span> : value}
      </p>
      <p className={`text-[11.5px] font-medium flex items-center gap-1 ${subColor} relative z-10`}>
        {loading ? <span className="animate-pulse text-text-muted/50">Loading</span> : sub}
      </p>
    </div>
  );
}

// ── Chart Component ───────────────────────────────────────────────────────────
function EarningsChart() {
    const [series, setSeries] = useState<{ date: string, grossPrize: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [groupBy, setGroupBy] = useState<ChartRange>('day');

    useEffect(() => {
        let active = true;
        setLoading(true);
        horseOwnerService.getEarningsSeries(groupBy).then(res => {
            if (active) setSeries(res.data);
        }).finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [groupBy]);

    const W = 1000, H = 300;
    const maxVal = Math.max(...series.map(s => s.grossPrize), 1);
    const pad = 40;
    const toX = (i: number) => pad + (i / Math.max(series.length - 1, 1)) * (W - pad * 2);
    const toY = (v: number) => H - pad - (v / maxVal) * (H - pad * 2);

    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    return (
        <div className="bg-surface border border-border rounded-xl p-5 flex flex-col xl:col-span-2 h-[420px]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-semibold text-text flex items-center gap-2">
                    <BarChart2 size={15} className="text-emerald-500" /> Gross Earnings Trend
                </h3>
                <div className="flex items-center bg-bg rounded-lg p-1 border border-border">
                    {(['day', 'week', 'month', 'year'] as const).map(g => (
                        <button key={g} onClick={() => setGroupBy(g)} className={`px-3 py-1 text-[11px] font-bold uppercase rounded-md transition-colors ${groupBy === g ? 'bg-emerald-500/20 text-emerald-400' : 'text-text-muted hover:text-text'}`}>
                            {g}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-text-muted/70" />
                </div>
            ) : series.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-[12px] text-text-muted">No data</div>
            ) : (
                <div className="relative flex-1 min-w-0"
                     onMouseLeave={() => setHoveredIdx(null)}
                     onMouseMove={(e) => {
                         const rect = e.currentTarget.getBoundingClientRect();
                         const x = e.clientX - rect.left;
                         const pct = Math.max(0, Math.min(1, x / rect.width));
                         setHoveredIdx(Math.round(pct * (series.length - 1)));
                     }}>
                    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                        {/* Grid */}
                        {[0, 0.5, 1].map(t => (
                            <line key={t} x1={pad} x2={W - pad} y1={pad + t * (H - pad * 2)} y2={pad + t * (H - pad * 2)} stroke="#ffffff" strokeOpacity={0.05} strokeWidth={1} />
                        ))}
                        {/* Dividers & Labels */}
                        {series.map((s, i) => (
                            <g key={i}>
                                <line x1={toX(i)} x2={toX(i)} y1={pad} y2={H - pad} stroke="#ffffff" strokeOpacity={0.02} strokeWidth={1} />
                                {series.length <= 15 || i % Math.ceil(series.length / 10) === 0 ? (
                                    <text x={toX(i)} y={H - 10} fill="#666" fontSize="11" textAnchor="middle" fontWeight="bold">
                                        {fmtDate(s.date, groupBy).slice(0, 5)}
                                    </text>
                                ) : null}
                            </g>
                        ))}
                        {/* Line */}
                        <polyline
                            points={series.map((s, i) => `${toX(i)},${toY(s.grossPrize)}`).join(" ")}
                            fill="none" stroke="#10b981" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
                        />
                        {/* Hover point */}
                        {hoveredIdx !== null && (
                            <circle cx={toX(hoveredIdx)} cy={toY(series[hoveredIdx].grossPrize)} r={4} fill="#10b981" />
                        )}
                    </svg>

                    {/* Tooltip */}
                    {hoveredIdx !== null && (
                        <div 
                            className="absolute bg-[#1e1e1e] border border-border rounded-lg px-3 py-2 text-[11px] text-text-muted whitespace-nowrap pointer-events-none z-10 shadow-xl transition-all duration-75"
                            style={{ 
                                left: `${(toX(hoveredIdx) / W) * 100}%`,
                                top: '5%',
                                transform: 'translateX(-50%)'
                            }}
                        >
                            <p className="font-bold text-text mb-1">{fmtDate(series[hoveredIdx].date, groupBy)}</p>
                            <p><span className="text-emerald-400">●</span> Gross Prize: {fmt(series[hoveredIdx].grossPrize)} ₫</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Top Performers Component ──────────────────────────────────────────────────
function TopPerformers() {
    const [performers, setPerformers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        horseOwnerService.getTopPerformers(5).then(res => setPerformers(res.data)).finally(() => setLoading(false));
    }, []);

    return (
        <div className="bg-surface border border-border rounded-xl p-5 flex flex-col xl:col-span-1 h-[420px]">
            <h3 className="text-[13px] font-semibold text-text flex items-center gap-2 mb-4">
                <Medal size={15} className="text-amber" /> Top Earning Horses
            </h3>
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-text-muted/70" />
                </div>
            ) : performers.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-[12px] text-text-muted">No horses found</div>
            ) : (
                <div className="flex flex-col gap-3">
                    {performers.map((p, i) => (
                        <div key={p.id} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-border/60 rounded-lg hover:bg-white/[0.04] transition-colors">
                            <span className="text-[16px] font-black text-text-muted/70 w-4">{i + 1}</span>
                            <div className="w-10 h-10 rounded-md bg-[#222] border border-border overflow-hidden shrink-0 flex items-center justify-center">
                                {p.img ? (
                                    <img 
                                        src={p.img} 
                                        alt="" 
                                        className="w-full h-full object-cover" 
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = "/jumping-horse-silhouette-facing-left-side-view.png";
                                            e.currentTarget.className = "w-full h-full object-contain p-2 opacity-50 filter invert";
                                        }}
                                    />
                                ) : (
                                    <img 
                                        src="/jumping-horse-silhouette-facing-left-side-view.png" 
                                        alt="" 
                                        className="w-full h-full object-contain p-2 opacity-50 filter invert" 
                                    />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-text truncate">{p.name}</p>
                                <p className="text-[11px] text-text-muted">{p.wins} wins / {p.totalRaces} races</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[13.5px] font-black text-emerald-400">{fmt(p.prizeMoney || 0)} ₫</p>
                                <p className="text-[10px] text-text-muted">Win Rate: {p.winRate}%</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Violation badge ───────────────────────────────────────────────────────────
function ViolationBadge({ count }: { count: number }) {
  if (count === 0) return <span className="text-text-muted/70 text-[12px]">—</span>;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red bg-red-900/20 border border-error-border rounded px-2 py-0.5">
      <AlertTriangle size={10} /> {count}
    </span>
  );
}

// ── Financials Page ───────────────────────────────────────────────────────────
export default function FinancialsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [rows, setRows] = useState<FinancialRaceRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [rowsError, setRowsError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [search]);

  // Fetch summary (wallet balance, net profit, etc.) — also re-run whenever a
  // payment fully settles, since that's when the wallet balance actually changes.
  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      setSummaryError(null);
      const res = await horseOwnerService.getFinancialSummary();
      setSummary(res.data);
    } catch (err: any) {
      // leave summary as-is, but surface the failure
      setSummaryError(err?.msg ?? "Failed to load financial summary.");
    } finally {
      setSummaryLoading(false);
      setLastUpdated(Date.now());
    }
  }, []);

  const refetchAll = useCallback(() => {
    fetchSummary();
    setRefreshTick((t) => t + 1);
  }, [fetchSummary]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  // Live refetch when a payment-related notification arrives.
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;
    const handler = (payload: { type?: string }) => {
      if (payload?.type?.startsWith("payment_")) {
        fetchSummary();
        setRefreshTick((t) => t + 1);
      }
    };
    socket.on("notification_created", handler);
    return () => { socket.off("notification_created", handler); };
  }, [socket, fetchSummary]);

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
  }, [page, debouncedSearch, refreshTick]);

  const s = summary;

  return (
    <div className="flex-1 px-8 py-8 min-h-screen bg-bg text-text font-sans">

      {/* ── Top header ───────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-emerald-600 uppercase mb-1">Owner Dashboard</p>
          <h1 className="text-[28px] font-black text-text tracking-tight uppercase font-serif">
            Financials & Earnings
          </h1>
          <p className="text-[13px] text-text-muted mt-1">Track your horse's performance, race earnings, and payments.</p>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <RefetchButton onRefetch={refetchAll} lastUpdated={lastUpdated} />
          <div className="bg-surface border border-border rounded-xl px-5 py-3 text-center">
            <p className="text-[9.5px] font-bold tracking-widest text-text-muted uppercase mb-1">Net Profit</p>
            <p className="text-[18px] font-black text-text font-sans">
              {summaryLoading ? "…" : fmt(s?.netProfit ?? 0)}
              {" "}<span className="text-[11px] text-text-muted font-semibold">₫</span>
            </p>
          </div>
          <div className="bg-emerald-900/40 border border-emerald-500/50 rounded-xl px-5 py-3 text-center shadow-lg shadow-emerald-900/20">
            <p className="text-[9.5px] font-bold tracking-widest text-emerald-400 uppercase mb-1">Wallet Balance</p>
            <p className="text-[18px] font-black text-text font-sans">
              {summaryLoading ? "…" : fmt(s?.wallet ?? 0)}
              {" "}<span className="text-[11px] text-emerald-400 font-semibold">₫</span>
            </p>
          </div>
        </div>
      </div>

      {summaryError && !summaryLoading && (
        <div className="mb-6">
          <ErrorState message={summaryError} onRetry={fetchSummary} />
        </div>
      )}

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          loading={summaryLoading}
          icon={<TrendingUp size={24} className="text-emerald-500" />}
          label="Total Wins"
          value={String(s?.totalWins ?? 0)}
          sub={`out of ${s?.totalRaces ?? 0} races`}
          subColor="text-emerald-400"
        />
        <StatCard
          loading={summaryLoading}
          icon={<TrendingDown size={24} className="text-red" />}
          label="Total Losses"
          value={String(s?.totalLosses ?? 0)}
          sub="non-winning finishes"
          subColor="text-red"
        />
        <StatCard
          loading={summaryLoading}
          icon={<Coins size={24} className="text-blue-500" />}
          label="Total Prize"
          value={`+${fmt(s?.totalPrize ?? 0)}`}
          sub={`Jockey payout: ${fmt(s?.totalJockeyPayout ?? 0)} ₫`}
          subColor="text-blue"
        />
        <StatCard
          loading={summaryLoading}
          icon={<AlertTriangle size={24} className={s?.totalViolations ? "text-amber-500" : "text-text-muted"} />}
          label="Violations"
          value={String(s?.totalViolations ?? 0)}
          sub={s?.totalViolations ? "review required" : "clean record"}
          subColor={s?.totalViolations ? "text-amber-400" : "text-text-muted"}
        />
      </div>

      {/* ── Charts & Performers ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <EarningsChart />
          <TopPerformers />
      </div>

      {/* ── Race Activity ─────────────────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden mb-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-[#1f1f1f]">
          <p className="text-[14px] font-bold text-text">Race Activity & Ledger</p>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search races or horses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-bg border border-border rounded-lg pl-8 pr-4 py-1.5 text-[12px] text-text-muted placeholder-text-muted focus:outline-none focus:border-white/20 transition-colors duration-150 w-64"
            />
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_1.5fr_1fr] px-6 py-3 border-b border-border/60 bg-[#171717]">
          {["Race", "Horse", "Jockey", "Position", "Gross Prize", "Jockey Pay", "Violations"].map(h => (
            <span key={h} className="text-[10px] font-bold tracking-widest text-text-muted uppercase">{h}</span>
          ))}
        </div>

        {/* Loading */}
        {rowsLoading && (
          <div className="flex items-center justify-center gap-2 py-12 text-text-muted text-[12px]">
            <Loader2 size={16} className="animate-spin" /> Fetching ledger...
          </div>
        )}

        {/* Error */}
        {!rowsLoading && rowsError && (
          <div className="px-6 py-6 text-[13px] text-red">{rowsError}</div>
        )}

        {/* Empty */}
        {!rowsLoading && !rowsError && rows.length === 0 && (
          <div className="py-12 text-center text-text-muted text-[13px]">No race activity found.</div>
        )}

        {/* Rows */}
        {!rowsLoading && !rowsError && rows.map((row, i) => (
          <div
            key={String(row.registrationId)}
            className={`grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_1.5fr_1fr] px-6 py-4 items-center hover:bg-white/[0.03] transition-colors duration-150 ${i !== rows.length - 1 ? "border-b border-border/60" : ""}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${row.finishPosition === 1 ? "bg-emerald-900/40 border border-emerald-500/20" : "bg-white/5 border border-border"}`}>
                <Trophy size={14} className={row.finishPosition === 1 ? "text-emerald-400" : "text-text-muted"} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-text truncate">{row.race.name}</p>
                {row.race.date && (
                  <p className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5">
                    <Calendar size={10} /> {new Date(row.race.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                )}
              </div>
            </div>
            <span className="text-[13px] font-medium text-text-muted truncate">{row.horse.name}</span>
            <span className="text-[13px] text-text-muted truncate">{row.jockey?.name ?? "—"}</span>
            <span className={`text-[13px] font-bold ${row.finishPosition === 1 ? "text-amber" : row.finishPosition != null ? "text-text-muted" : "text-text-muted/70"}`}>
              {positionLabel(row.finishPosition)}
            </span>
            <span className={`text-[14px] font-black ${row.prizeMoney > 0 ? "text-emerald-400" : "text-text-muted/70"}`}>
              {row.prizeMoney > 0 ? `+${fmt(row.prizeMoney)} ₫` : "—"}
            </span>
            <span className="text-[13px] font-semibold text-text-muted">
              {row.jockeyPayout > 0 ? `-${fmt(row.jockeyPayout)} ₫` : "—"}
            </span>
            <ViolationBadge count={row.violations.length} />
          </div>
        ))}

        {/* Pagination */}
        {totalPages > 1 && !rowsLoading && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-[#171717]">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="text-[12px] font-bold text-text-muted hover:text-text disabled:opacity-30 transition-colors"
            >
              ← Previous
            </button>
            <span className="text-[11px] font-medium text-text-muted">Page {page} of {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="text-[12px] font-bold text-text-muted hover:text-text disabled:opacity-30 transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Payment verification (statistical wallet tracking only) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PaymentsPanel
          title="Payments to Jockeys"
          fetchPayments={(page, limit, sortBy, order) => horseOwnerService.getPayments(page, limit, undefined, 'payer', sortBy, order)}
          onConfirm={horseOwnerService.confirmPaymentPaid}
          myRoleSide="payer"
          confirmLabel="Confirm Paid"
          cacheKey="owner-payments-payer"
          onSettled={fetchSummary}
        />
        <PaymentsPanel
          title="Prize Money Owed to You"
          fetchPayments={(page, limit, sortBy, order) => horseOwnerService.getPayments(page, limit, undefined, 'payee', sortBy, order)}
          onConfirm={horseOwnerService.confirmPaymentReceived}
          myRoleSide="payee"
          confirmLabel="Confirm Received"
          cacheKey="owner-payments-payee"
          onSettled={fetchSummary}
        />
      </div>
    </div>
  );
}
