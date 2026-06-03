import { useEffect } from "react";
import {
  X, Trophy, TrendingUp, MapPin, Star, Calendar, Weight, Diamond, User,
} from "lucide-react";

// ── Types (re-exported so Jockeys.tsx can import from one place) ──────────────
export type JockeyStatus = "Available" | "In Talks" | "Unavailable";
export type JockeyRank   = "Elite" | "Pro" | "Veteran" | "Apprentice";

export interface Jockey {
  id: number;
  name: string;
  rank: JockeyRank;
  country: string;
  status: JockeyStatus;
  winRate: number;
  starts: number;
  wins: number;
  places: number;
  baseFee: number | null;
  weight: string;
  age: number;
  experience: string;
  specialties: string[];
  recentRaces: { race: string; position: string; horse: string; date: string }[];
  image: string | null;
}

// ── Config ────────────────────────────────────────────────────────────────────
export const STATUS_CFG: Record<JockeyStatus, { dot: string; text: string; bg: string; border: string }> = {
  Available:   { dot: "bg-green-400",  text: "text-green-400",  bg: "bg-green-500/15",  border: "border-green-500/30"  },
  "In Talks":  { dot: "bg-yellow-400", text: "text-yellow-400", bg: "bg-yellow-500/15", border: "border-yellow-500/30" },
  Unavailable: { dot: "bg-gray-500",   text: "text-gray-400",   bg: "bg-white/8",       border: "border-white/10"       },
};

const POSITION_COLOR: Record<string, string> = {
  "1st": "text-yellow-400",
  "2nd": "text-gray-300",
  "3rd": "text-orange-400",
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface JockeyDetailModalProps {
  jockey:  Jockey;
  onClose: () => void;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export default function JockeyDetailModal({ jockey, onClose }: JockeyDetailModalProps) {
  const cfg           = STATUS_CFG[jockey.status];
  const isUnavailable = jockey.status === "Unavailable";

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-[#1a1a1a] rounded-2xl border border-white/10 shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Hero banner */}
        <div className="relative h-48 bg-[#111] shrink-0 overflow-hidden">
          {jockey.image ? (
            <img
              src={jockey.image}
              alt={jockey.name}
              className={`w-full h-full object-cover object-top ${isUnavailable ? "grayscale brightness-40" : ""}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#161616]">
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
              className="text-[26px] font-bold text-white leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {jockey.name}
            </h2>
            <p className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase mt-0.5">
              {jockey.rank} Rank · {jockey.country}
            </p>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: <Trophy    size={13} className="text-yellow-400" />, label: "Win Rate",     value: `${jockey.winRate}%`,          color: "text-green-400" },
              { icon: <TrendingUp size={13} className="text-blue-400"  />, label: "Total Starts", value: jockey.starts.toLocaleString(), color: "text-white"     },
              { icon: <Star      size={13} className="text-orange-400" />, label: "Wins",         value: jockey.wins.toLocaleString(),   color: "text-white"     },
              { icon: <Calendar  size={13} className="text-purple-400" />, label: "Experience",   value: jockey.experience,              color: "text-white"     },
            ].map((s) => (
              <div key={s.label} className="bg-[#141414] rounded-xl px-3 py-3 border border-white/6 text-center">
                <div className="flex justify-center mb-1.5">{s.icon}</div>
                <p className={`text-[15px] font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-600 uppercase tracking-wide mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Details row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Weight  size={14} />, label: "Weight",   value: jockey.weight  },
              { icon: <MapPin  size={14} />, label: "Country",  value: jockey.country },
              { icon: <Diamond size={14} />, label: "Base Fee", value: jockey.baseFee !== null ? `$${jockey.baseFee.toLocaleString()}` : "Contract" },
            ].map((item) => (
              <div key={item.label} className="bg-[#141414] rounded-xl px-4 py-3 border border-white/6 flex items-center gap-2.5">
                <span className="text-gray-500 shrink-0">{item.icon}</span>
                <div>
                  <p className="text-[10px] text-gray-600 uppercase tracking-wide">{item.label}</p>
                  <p className="text-[13px] font-semibold text-white mt-0.5">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Specialties */}
          <div>
            <p className="text-[11px] font-semibold tracking-widest text-gray-600 uppercase mb-2.5">
              Specialties
            </p>
            <div className="flex flex-wrap gap-2">
              {jockey.specialties.map((s) => (
                <span
                  key={s}
                  className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[12px] text-gray-300 font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Recent Races */}
          <div>
            <p className="text-[11px] font-semibold tracking-widest text-gray-600 uppercase mb-2.5">
              Recent Races
            </p>
            <div className="space-y-2">
              {jockey.recentRaces.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-[#141414] border border-white/6 rounded-xl px-4 py-3"
                >
                  <div>
                    <p className="text-[13px] font-semibold text-white">{r.race}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">on {r.horse} · {r.date}</p>
                  </div>
                  <span className={`text-[14px] font-bold ${POSITION_COLOR[r.position] ?? "text-gray-500"}`}>
                    {r.position}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/8 flex gap-3 shrink-0 bg-[#1a1a1a]">
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