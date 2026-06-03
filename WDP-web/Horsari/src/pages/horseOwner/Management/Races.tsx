import { Calendar, MapPin, Plus } from "lucide-react";
import { type MyRace, type RaceStatus, MY_RACES } from "../../../types/Racingtypes";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<RaceStatus, { label: string; dot: string; text: string; bg: string }> = {
  LIVE:     { label: "LIVE",     dot: "bg-red-400 animate-pulse", text: "text-red-400",    bg: "bg-red-500/20 border-red-500/40"  },
  UPCOMING: { label: "UPCOMING", dot: "bg-yellow-400",            text: "text-yellow-300", bg: "bg-black/50 border-white/15"      },
  FINISHED: { label: "FINISHED", dot: "bg-gray-500",              text: "text-gray-400",   bg: "bg-black/50 border-white/10"      },
};

// ── Race Card ─────────────────────────────────────────────────────────────────
function RaceCard({ race }: { race: MyRace }) {
  const cfg        = STATUS_CFG[race.status];
  const isLive     = race.status === "LIVE";
  const isFinished = race.status === "FINISHED";

  return (
    <div
      className={`bg-[#1a1a1a] rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 hover:shadow-xl hover:shadow-black/50 ${
        isFinished ? "border-white/5 opacity-70" : "border-white/8 hover:border-white/15"
      }`}
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden bg-[#111]">
        <img
          src={race.image}
          alt={race.name}
          className={`w-full h-full object-cover ${isFinished ? "grayscale brightness-50" : ""}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />
        <div
          className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10.5px] font-bold backdrop-blur-sm ${cfg.bg} ${cfg.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-4 flex flex-col gap-3 flex-1">
        <h3
          className="text-[16px] font-bold text-white leading-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {race.name}
        </h3>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
            <Calendar size={11} className="shrink-0" />
            {race.date}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
            <MapPin size={11} className="shrink-0" />
            {race.venue}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[9.5px] font-semibold tracking-widest text-gray-600 uppercase mb-0.5">Horse</p>
            <p className="text-[12.5px] font-semibold text-red-400">{race.horse}</p>
          </div>
          <div>
            <p className="text-[9.5px] font-semibold tracking-widest text-gray-600 uppercase mb-0.5">Jockey</p>
            <p className="text-[12.5px] font-semibold text-red-400">{race.jockey}</p>
          </div>
        </div>

        <button
          className={`w-full py-2.5 rounded-lg text-[11.5px] font-bold tracking-widest uppercase transition-all duration-150 mt-auto ${
            isLive
              ? "bg-red-700 hover:bg-red-600 text-white shadow-lg shadow-red-900/40"
              : isFinished
              ? "border border-white/8 text-gray-600 cursor-default"
              : "border border-white/15 text-gray-300 hover:border-white/30 hover:text-white"
          }`}
        >
          {isLive ? "View Live Track" : isFinished ? "View Results" : "Manage Entry"}
        </button>
      </div>
    </div>
  );
}

// ── Register tile ─────────────────────────────────────────────────────────────
function RegisterTile() {
  return (
    <div className="bg-[#161616] rounded-2xl border border-dashed border-white/15 flex flex-col items-center justify-center gap-3 min-h-[280px] cursor-pointer hover:border-red-700/50 hover:bg-red-950/10 transition-all duration-200 group">
      <div className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center group-hover:border-red-600/50 transition-colors duration-200">
        <Plus size={18} className="text-gray-600 group-hover:text-red-500 transition-colors duration-200" />
      </div>
      <p className="text-[13px] font-semibold text-gray-600 group-hover:text-gray-400 transition-colors duration-200">
        Register New Race
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RacesPage() {
  return (
    <div
      className="flex-1 px-8 py-8 min-h-screen bg-[#111111]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="mb-6">
        <p className="text-[11px] font-bold tracking-[0.2em] text-gray-600 uppercase mb-1">
          Race Management
        </p>
        <h1
          className="text-[32px] font-bold text-white leading-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          My Races
        </h1>
        <p className="text-[13px] text-gray-500 mt-1">
          Oversee your current racing roster and entries.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {MY_RACES.map((race) => (
          <RaceCard key={race.id} race={race} />
        ))}
        <RegisterTile />
      </div>
    </div>
  );
}