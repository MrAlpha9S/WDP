import { useState } from "react";
import {
  UserPlus,
  PlusCircle,
  Flag,
  Users,
  Mail,
  ChevronRight,
  Mic2,
  BarChart2,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface UpcomingRace {
  id: number;
  name: string;
  class: string;
  horse: string;
  horseImg: string;
  time: string;
  odds: string;
  status: "Preparing" | "Confirmed" | "Pending";
}

interface Performer {
  rank: number;
  name: string;
  img: string;
  winRate: number;
}

interface Activity {
  id: number;
  icon: "user" | "check" | "alert";
  time: string;
  text: string;
  highlight: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const UPCOMING_RACES: UpcomingRace[] = [
  {
    id: 1,
    name: "Dubai World Cup",
    class: "Class A – 2000m",
    horse: "Crimson Tide",
    horseImg: "https://images.unsplash.com/photo-1553284965-5dd67167ac2f?w=80&q=80",
    time: "14:30",
    odds: "5/1",
    status: "Preparing",
  },
  {
    id: 2,
    name: "Ascot Gold Cup",
    class: "Class B – 4000m",
    horse: "Silver Bullet",
    horseImg: "https://images.unsplash.com/photo-1525543907410-b2562b6796b6?w=80&q=80",
    time: "Tomorrow",
    odds: "2/1",
    status: "Confirmed",
  },
  {
    id: 3,
    name: "Melbourne Sprint",
    class: "Class A – 1200m",
    horse: "Night Fury",
    horseImg: "https://images.unsplash.com/photo-1567163437983-b0d9a2b5b369?w=80&q=80",
    time: "Oct 24",
    odds: "10/1",
    status: "Preparing",
  },
];

const TOP_PERFORMERS: Performer[] = [
  {
    rank: 1,
    name: "Crimson Tide",
    img: "https://images.unsplash.com/photo-1553284965-5dd67167ac2f?w=80&q=80",
    winRate: 68,
  },
  {
    rank: 2,
    name: "Silver Bullet",
    img: "https://images.unsplash.com/photo-1525543907410-b2562b6796b6?w=80&q=80",
    winRate: 54,
  },
  {
    rank: 3,
    name: "Night Fury",
    img: "https://images.unsplash.com/photo-1567163437983-b0d9a2b5b369?w=80&q=80",
    winRate: 42,
  },
];

const ACTIVITIES: Activity[] = [
  {
    id: 1,
    icon: "user",
    time: "Just now",
    text: "J. Smith applied to ride ",
    highlight: "Crimson Tide.",
  },
  {
    id: 2,
    icon: "check",
    time: "2 hours ago",
    text: "Race entry approved for ",
    highlight: "Ascot Gold Cup.",
  },
  {
    id: 3,
    icon: "alert",
    time: "Yesterday",
    text: "Medical review required for ",
    highlight: "Thunderstrike.",
  },
];

// Earnings chart bars (relative heights as %)
const EARNINGS_BARS = [
  { label: "W1", value: 35, highlight: false },
  { label: "W2", value: 45, highlight: false },
  { label: "W3", value: 82, highlight: true },
  { label: "W4", value: 50, highlight: false },
  { label: "W5", value: 38, highlight: false },
  { label: "W6", value: 42, highlight: false },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: UpcomingRace["status"] }) {
  const cfg = {
    Preparing: "border border-yellow-600/60 text-yellow-400 bg-yellow-500/10",
    Confirmed: "border border-green-600/60 text-green-400 bg-green-500/10",
    Pending: "border border-gray-600/60 text-gray-400 bg-gray-500/10",
  }[status];
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded ${cfg}`}>
      {status}
    </span>
  );
}

function ActivityIcon({ type }: { type: Activity["icon"] }) {
  if (type === "user")
    return (
      <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
        <Users size={13} className="text-gray-300" />
      </div>
    );
  if (type === "check")
    return (
      <div className="w-7 h-7 rounded-full bg-green-900/60 flex items-center justify-center shrink-0">
        <CheckCircle size={13} className="text-green-400" />
      </div>
    );
  return (
    <div className="w-7 h-7 rounded-full bg-red-900/50 flex items-center justify-center shrink-0">
      <AlertTriangle size={13} className="text-red-400" />
    </div>
  );
}

// ── Dashboard Page ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [earningsPeriod, setEarningsPeriod] = useState("Last 30 Days");

  return (
    <div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1
              className="text-[28px] font-bold text-white leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Welcome back, Alexander
            </h1>
            <p className="text-[13px] text-gray-500 mt-0.5">
              Your stable is operating at peak efficiency. Here is today's overview.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/15 text-[13px] font-medium text-gray-300 hover:border-white/30 hover:text-white transition-colors duration-150">
              <UserPlus size={14} />
              Invite Jockey
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-700 text-[13px] font-semibold text-white hover:bg-red-600 transition-colors duration-150 shadow-lg shadow-red-900/40">
              <PlusCircle size={14} />
              Register New Horse
            </button>
          </div>
        </div>

        {/* ── Stat Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "TOTAL HORSES",
              value: "12",
              sub: "+2 this month",
              subColor: "text-red-400",
              icon: <Flag size={16} className="text-gray-600" />,
            },
            {
              label: "UPCOMING RACES",
              value: "3",
              sub: "Next 48 hrs",
              subColor: "text-gray-500",
              icon: <TrendingUp size={16} className="text-gray-600" />,
            },
            {
              label: "ACTIVE INVITATIONS",
              value: "5",
              sub: "Pending replies",
              subColor: "text-red-400",
              icon: <Mail size={16} className="text-gray-600" />,
            },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-[#1a1a1a] rounded-xl border border-white/8 px-6 py-5 flex items-start justify-between"
            >
              <div>
                <p className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase mb-2">
                  {card.label}
                </p>
                <p
                  className="text-[38px] font-bold leading-none text-white"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {card.value}
                </p>
                <p className={`text-[12px] mt-1.5 font-medium ${card.subColor}`}>
                  {card.sub}
                </p>
              </div>
              <div className="mt-1">{card.icon}</div>
            </div>
          ))}
        </div>

        {/* ── Main Grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-6">

          {/* Left col: Upcoming Races */}
          <div className="col-span-2 bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <h2 className="text-[15px] font-semibold text-white">Upcoming Races</h2>
              <button className="flex items-center gap-1 text-[12px] text-red-500 font-medium hover:text-red-400 transition-colors duration-150">
                VIEW ALL <ChevronRight size={13} />
              </button>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr] px-6 py-2 border-b border-white/5">
              {["RACE NAME", "HORSE", "TIME/ODDS", "STATUS"].map((h) => (
                <span key={h} className="text-[10.5px] font-semibold tracking-widest text-gray-600 uppercase">
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            {UPCOMING_RACES.map((race, i) => (
              <div
                key={race.id}
                className={`grid grid-cols-[2fr_1.5fr_1.5fr_1fr] px-6 py-4 items-center hover:bg-white/[0.03] transition-colors duration-150 ${
                  i !== UPCOMING_RACES.length - 1 ? "border-b border-white/5" : ""
                }`}
              >
                <div>
                  <p className="text-[13.5px] font-semibold text-white">{race.name}</p>
                  <p className="text-[11.5px] text-gray-500 mt-0.5">{race.class}</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-800 shrink-0">
                    <img src={race.horseImg} alt={race.horse} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[13px] text-gray-300">{race.horse}</span>
                </div>
                <div>
                  <span className="text-[13px] text-gray-300">{race.time}</span>
                  <span className="text-gray-600 mx-1.5">|</span>
                  <span className="text-[13px] text-gray-300">{race.odds}</span>
                </div>
                <StatusBadge status={race.status} />
              </div>
            ))}
          </div>

          {/* Right col: Top Performers */}
          <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <h2 className="text-[15px] font-semibold text-white">Top Performers</h2>
              <Mic2 size={15} className="text-gray-600" />
            </div>

            <div className="px-5 py-3 space-y-2">
              {TOP_PERFORMERS.map((p) => (
                <div
                  key={p.rank}
                  className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0"
                >
                  {/* Rank */}
                  <span
                    className={`text-[18px] font-bold w-6 text-center shrink-0 ${
                      p.rank === 1
                        ? "text-red-500"
                        : "text-gray-600"
                    }`}
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {p.rank}
                  </span>

                  {/* Horse img */}
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 shrink-0">
                    <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Info + bar */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate">{p.name}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Win Rate: {p.winRate}%</p>
                    <div className="mt-1.5 h-1 bg-white/8 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-600 rounded-full"
                        style={{ width: `${p.winRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom Grid ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-6">

          {/* Earnings Overview */}
          <div className="col-span-2 bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
                <BarChart2 size={15} className="text-red-500" />
                Earnings Overview
              </h2>
              <div className="relative">
                <select
                  value={earningsPeriod}
                  onChange={(e) => setEarningsPeriod(e.target.value)}
                  className="appearance-none bg-white/5 border border-white/10 rounded-lg text-[12px] text-gray-300 pl-3 pr-7 py-1.5 focus:outline-none cursor-pointer hover:bg-white/8 transition-colors duration-150"
                >
                  <option>Last 30 Days</option>
                  <option>Last 90 Days</option>
                  <option>This Year</option>
                </select>
                <ChevronRight
                  size={12}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-gray-500 pointer-events-none"
                />
              </div>
            </div>

            <div className="px-6 py-6">
              {/* Y-axis labels + bars */}
              <div className="flex gap-4 items-end h-44">
                {/* Y labels */}
                <div className="flex flex-col justify-between h-full text-right pr-2">
                  {["$50k", "$25k", "$0"].map((l) => (
                    <span key={l} className="text-[10.5px] text-gray-600">{l}</span>
                  ))}
                </div>

                {/* Chart */}
                <div className="flex-1 flex items-end gap-3 h-full">
                  {EARNINGS_BARS.map((bar) => (
                    <div key={bar.label} className="flex-1 flex flex-col items-center gap-1.5">
                      {bar.highlight && (
                        <span className="text-[10px] font-bold text-white bg-red-700 px-1.5 py-0.5 rounded">
                          $48k
                        </span>
                      )}
                      <div
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          bar.highlight ? "bg-red-600" : "bg-[#2e2e2e] hover:bg-[#3a3a3a]"
                        }`}
                        style={{ height: `${bar.value}%` }}
                      />
                      <span className="text-[10.5px] text-gray-600">{bar.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Horizontal grid lines (decorative) */}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
                <Activity size={14} className="text-red-500" />
                Recent Activity
              </h2>
            </div>

            <div className="px-5 py-3 space-y-0">
              {ACTIVITIES.map((act, i) => (
                <div
                  key={act.id}
                  className={`flex gap-3 py-4 ${
                    i !== ACTIVITIES.length - 1 ? "border-b border-white/5" : ""
                  }`}
                >
                  <ActivityIcon type={act.icon} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-500 mb-0.5">{act.time}</p>
                    <p className="text-[12.5px] text-gray-300 leading-snug">
                      {act.text}
                      <span className="text-white font-semibold">{act.highlight}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 pb-5">
              <button className="w-full text-center text-[12px] font-semibold text-gray-500 hover:text-red-400 transition-colors duration-150 tracking-widest uppercase py-2 border border-white/8 rounded-lg hover:border-red-800/40">
                View All Activity
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}