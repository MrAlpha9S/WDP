import { useEffect, useState } from "react";
import {
  X, Trophy, TrendingUp, Star, Weight, Diamond, User, Loader2, ShieldAlert,
} from "lucide-react";
import type { JockeyViolationEntry } from "../../../api/horseOwnerService";

// ── Types (re-exported so Jockeys.tsx can import from one place) ──────────────
export type JockeyStatus = "Available" | "In Talks" | "Unavailable";

export interface Jockey {
  id: number;
  name: string;
  rank: number | null;
  totalJockeys: number;
  status: JockeyStatus;
  winRate: number;
  starts: number;
  wins: number;
  places: number;
  weight: string;
  age: number;
  specialties: string[];
  recentRaces: { race: string; position: string; horse: string; date: string; attendance?: "no_show" | "main" | "backup"; bookingFees?: number }[];
  image: string | null;
  violations: JockeyViolationEntry[];
  totalPrize?: number;
  bookingFee: number;
}

// ── Config ────────────────────────────────────────────────────────────────────
export const STATUS_CFG: Record<JockeyStatus, { dot: string; text: string; bg: string; border: string }> = {
  Available:   { dot: "bg-green-400",  text: "text-green-400",  bg: "bg-green-500/15",  border: "border-green-500/30"  },
  "In Talks":  { dot: "bg-yellow-400", text: "text-yellow-400", bg: "bg-yellow-500/15", border: "border-yellow-500/30" },
  Unavailable: { dot: "bg-gray-500",   text: "text-gray-400",   bg: "bg-white/8",       border: "border-border"       },
};

const POSITION_COLOR: Record<string, string> = {
  "1st": "text-yellow-400",
  "2nd": "text-gray-300",
  "3rd": "text-orange-400",
};

const ATTENDANCE_CFG: Record<string, { label: string; text: string; bg: string; border: string }> = {
  no_show: { label: "No-Show", text: "text-red-400",  bg: "bg-red-500/10",  border: "border-red-700/40" },
  main:    { label: "Main",    text: "text-white",     bg: "bg-white/5",     border: "border-border"   },
  backup:  { label: "Backup",  text: "text-blue-400",  bg: "bg-blue-500/10", border: "border-blue-700/40" },
};

function severityColor(s?: number) {
  if (!s) return "bg-gray-600";
  if (s <= 2) return "bg-yellow-500";
  if (s === 3) return "bg-orange-500";
  return "bg-red-500";
}

type Tab = "overview" | "history" | "violations";

// ── Overview tab ──────────────────────────────────────────────────────────────
function OverviewTab({ jockey }: { jockey: Jockey }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {[
        { icon: <Trophy    size={13} className="text-yellow-400" />, label: "Win Rate",     value: `${jockey.winRate}%`,          color: "text-green-400" },
        { icon: <TrendingUp size={13} className="text-blue-400"  />, label: "Total Starts", value: jockey.starts.toLocaleString(), color: "text-white"     },
        { icon: <Star      size={13} className="text-orange-400" />, label: "Wins",         value: jockey.wins.toLocaleString(),   color: "text-white"     },
        { icon: <Weight    size={13} className="text-orange-400" />, label: "Weight",       value: jockey.weight,                  color: "text-white"     },
      ].map((s) => (
        <div key={s.label} className="bg-surface rounded-xl px-3 py-3 border border-border/60 text-center">
          <div className="flex justify-center mb-1.5">{s.icon}</div>
          <p className={`text-[15px] font-bold ${s.color}`}>{s.value}</p>
          <p className="text-[10px] text-gray-600 uppercase tracking-wide mt-0.5">{s.label}</p>
        </div>
      ))}
      <div className="col-span-2 bg-surface rounded-xl px-3 py-3 border border-border/60 text-center">
        <p className="text-[15px] font-bold text-white">
          {jockey.rank != null ? `#${jockey.rank} of ${jockey.totalJockeys}` : "Unranked"}
        </p>
        <p className="text-[10px] text-gray-600 uppercase tracking-wide mt-0.5">Rank</p>
      </div>
      <div className="col-span-2 bg-surface rounded-xl px-3 py-3 border border-border/60 text-center">
        <p className="text-[15px] font-bold text-white">{jockey.bookingFee.toLocaleString()} ₫</p>
        <p className="text-[10px] text-gray-600 uppercase tracking-wide mt-0.5">Default Booking Fee</p>
      </div>
      {jockey.totalPrize != null && jockey.totalPrize > 0 && (
        <div className="col-span-4 bg-surface rounded-xl px-3 py-3 border border-border/60 text-center">
          <p className="text-[15px] font-bold text-yellow-400">{jockey.totalPrize.toLocaleString()} ₫</p>
          <p className="text-[10px] text-gray-600 uppercase tracking-wide mt-0.5">Total Prize Earned</p>
        </div>
      )}
    </div>
  );
}

// ── Race history tab ──────────────────────────────────────────────────────────
function HistoryTab({ recentRaces }: { recentRaces: Jockey["recentRaces"] }) {
  if (recentRaces.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white/2 px-5 py-10 text-center">
        <Trophy size={28} className="text-gray-700 mx-auto mb-3" />
        <p className="text-[13px] text-gray-600">No races yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recentRaces.map((r, i) => {
        const attCfg = r.attendance ? ATTENDANCE_CFG[r.attendance] : null;
        return (
          <div
            key={i}
            className="flex items-center justify-between bg-surface border border-border/60 rounded-xl px-4 py-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-semibold text-white">{r.race}</p>
                {attCfg && (
                  <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${attCfg.bg} ${attCfg.border} ${attCfg.text}`}>
                    {attCfg.label}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">on {r.horse} · {r.date}</p>
            </div>
            <div className="text-right">
              <span className={`text-[14px] font-bold ${POSITION_COLOR[r.position] ?? "text-gray-500"}`}>
                {r.attendance === "no_show" ? "—" : r.position}
              </span>
              {r.bookingFees != null && r.bookingFees > 0 && (
                <p className="text-[10px] text-gray-600 mt-0.5">{r.bookingFees.toLocaleString()} ₫</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Violations tab ────────────────────────────────────────────────────────────
function ViolationsTab({ violations }: { violations: JockeyViolationEntry[] }) {
  if (violations.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white/2 px-5 py-10 text-center">
        <ShieldAlert size={28} className="text-gray-700 mx-auto mb-3" />
        <p className="text-[13px] text-gray-600">No violations on record.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {violations.map((v) => (
        <div
          key={v._id}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-border bg-white/[0.02] text-[12px]"
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${severityColor(v.severity ?? v.violationType?.severity)}`} />
          <div className="flex-1 min-w-0">
            <span className="text-gray-300 font-medium truncate">{v.violationType?.violationName ?? "Violation"}</span>
            {v.raceRound?.roundName && (
              <span className="text-gray-600"> · {v.raceRound.roundName}</span>
            )}
          </div>
          <span className="text-[10px] text-gray-600 capitalize shrink-0">{v.violationStatus}</span>
        </div>
      ))}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface JockeyDetailModalProps {
  jockey:  Jockey;
  onClose: () => void;
  loading?: boolean;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export default function JockeyDetailModal({ jockey, onClose, loading = false }: JockeyDetailModalProps) {
  const cfg           = STATUS_CFG[jockey.status];
  const isUnavailable = jockey.status === "Unavailable";
  const [tab, setTab] = useState<Tab>("overview");

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-3xl bg-surface rounded-2xl border border-border shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Hero banner */}
        <div className="relative h-48 bg-bg shrink-0 overflow-hidden">
          {jockey.image ? (
            <img
              src={jockey.image}
              alt={jockey.name}
              className={`w-full h-full object-cover object-top ${isUnavailable ? "grayscale brightness-40" : ""}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface">
              <User size={56} className="text-gray-700" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/30 to-transparent" />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 border border-white/15 flex items-center justify-center text-gray-400 hover:text-white hover:bg-black/70 transition-colors duration-150"
          >
            <X size={15} />
          </button>

          {/* Status badge */}
          <div className={`absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${cfg.bg} ${cfg.border} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {jockey.status}
          </div>

          {/* Name */}
          <div className="absolute bottom-4 left-5">
            <h2
              className="text-[26px] font-bold text-white leading-tight font-serif"
            >
              {jockey.name}
            </h2>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-xl w-fit">
            {([
              { id: "overview"   as Tab, label: "Overview",     count: 0 },
              { id: "history"    as Tab, label: "Race History", count: jockey.recentRaces.length },
              { id: "violations" as Tab, label: "Violations",   count: jockey.violations.length  },
            ] as { id: Tab; label: string; count: number }[]).map(({ id, label, count }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-150 ${
                  tab === id
                    ? "bg-white/8 text-white border border-white/12"
                    : "text-gray-500 hover:text-gray-300 border border-transparent"
                }`}
              >
                {label}
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === id ? "bg-red-700 text-white" : "bg-white/8 text-gray-500"}`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-gray-500">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-[12px]">Loading profile…</span>
              </div>
            </div>
          ) : (
            <>
              {tab === "overview"   && <OverviewTab jockey={jockey} />}
              {tab === "history"    && <HistoryTab recentRaces={jockey.recentRaces} />}
              {tab === "violations" && <ViolationsTab violations={jockey.violations} />}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0 bg-surface">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-white/12 text-gray-400 text-[13px] font-semibold hover:border-white/25 hover:text-white transition-all duration-150"
          >
            Close
          </button>
          {!isUnavailable && (
            <button className="flex-1 py-2.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-[13px] font-bold transition-colors duration-150 shadow-lg shadow-red-900/30 flex items-center justify-center gap-2">
              Hire Jockey
              <Diamond size={13} className="text-red-300" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
