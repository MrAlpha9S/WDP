import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flag, TrendingUp, Mail, ChevronRight, Mic2,
  Users, Loader2, Trophy, MapPin, Radio, Calendar,
} from "lucide-react";
import {
  horseOwnerService,
  type DashboardSummary,
  type TopPerformer,
  type BrowsableRace,
} from "../../api/horseOwnerService";
import { type ManagementTab } from "./Management/SideBar";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function fmtDate(d: string | null) {
  if (!d) return "TBD";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Registration status chip ──────────────────────────────────────────────────
function RegistrationChip({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    pending: "border-yellow-600/60 text-yellow-400 bg-yellow-500/10",
    approved: "border-green-600/60  text-green-400  bg-green-500/10",
    verified: "border-blue-600/60   text-blue-400   bg-blue-500/10",
    failed: "border-red-600/60    text-red-400    bg-red-500/10",
    rejected: "border-red-600/60    text-red-400    bg-red-500/10",
    cancelled: "border-gray-600/60   text-gray-400   bg-gray-500/10",
  };
  return (
    <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded border capitalize ${cfg[status] ?? cfg.pending}`}>
      {status}
    </span>
  );
}

// ── Race status pill ──────────────────────────────────────────────────────────
const RACE_STATUS_CFG: Record<string, { label: string; cls: string }> = {
  running: { label: "LIVE", cls: "text-red-400 bg-red-900/30 border-red-700/40" },
  scheduled: { label: "Upcoming", cls: "text-blue-400 bg-blue-900/20 border-blue-700/30" },
  awaitingConfirmation: { label: "Confirming", cls: "text-yellow-400 bg-yellow-900/20 border-yellow-700/30" },
  prepared: { label: "Ready", cls: "text-green-400 bg-green-900/20 border-green-700/30" },
};

// ── Loading skeleton ──────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded ${className}`} />;
}

// ── Dashboard Page ─────────────────────────────────────────────────────────────
export default function DashboardPage({ onNavigate }: { onNavigate: (tab: ManagementTab) => void }) {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [performers, setPerformers] = useState<TopPerformer[]>([]);
  const [races, setRaces] = useState<BrowsableRace[]>([]);
  const [racesPage, setRacesPage] = useState(1);
  const [racesHasMore, setRacesHasMore] = useState(false);
  const [racesLoadingMore, setRacesLoadingMore] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [performersLoading, setPerformersLoading] = useState(true);
  const [racesLoading, setRacesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      const [sumRes, perfRes, raceRes] = await Promise.allSettled([
        horseOwnerService.getDashboardSummary(),
        horseOwnerService.getTopPerformers(3),
        horseOwnerService.browseRaces(1, 10),
      ]);

      if (cancelled) return;

      if (sumRes.status === "fulfilled") { setSummary(sumRes.value.data); }
      if (perfRes.status === "fulfilled") { setPerformers(perfRes.value.data); }
      if (raceRes.status === "fulfilled") {
        const { items, pagination } = raceRes.value.data;
        setRaces(items);
        setRacesPage(1);
        setRacesHasMore(pagination.currentPage < pagination.totalPages);
      }

      setSummaryLoading(false);
      setPerformersLoading(false);
      setRacesLoading(false);
    }

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  async function loadMoreRaces() {
    if (racesLoadingMore || !racesHasMore) return;
    setRacesLoadingMore(true);
    try {
      const next = racesPage + 1;
      const res = await horseOwnerService.browseRaces(next, 10);
      const { items, pagination } = res.data;
      setRaces(prev => [...prev, ...items]);
      setRacesPage(next);
      setRacesHasMore(pagination.currentPage < pagination.totalPages);
    } catch {
      // silent — user can retry
    } finally {
      setRacesLoadingMore(false);
    }
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-white leading-tight font-serif">
              Welcome back
            </h1>
            <p className="text-[13px] text-gray-500 mt-0.5">
              Here's your stable overview for today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate("Jockeys")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/15 text-[13px] font-medium text-gray-300 hover:border-white/30 hover:text-white transition-colors duration-150"
            >
              <Users size={14} /> Hire Jockey
            </button>
            <button
              onClick={() => onNavigate("Horses")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-700 text-[13px] font-semibold text-white hover:bg-red-600 transition-colors duration-150 shadow-lg shadow-red-900/40"
            >
              <Flag size={14} /> My Horses
            </button>
          </div>
        </div>

        {/* ── Stat Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "TOTAL HORSES",
              value: summaryLoading ? null : String(summary?.totalHorses ?? 0),
              sub: "in your stable",
              subColor: "text-gray-500",
              icon: <Flag size={16} className="text-gray-600" />,
            },
            {
              label: "ACTIVE RACES",
              value: summaryLoading ? null : String(summary?.upcomingRacesCount ?? 0),
              sub: "registered & live",
              subColor: "text-red-400",
              icon: <TrendingUp size={16} className="text-gray-600" />,
            },
            {
              label: "PENDING INVITATIONS",
              value: summaryLoading ? null : String(summary?.activeInvitationsCount ?? 0),
              sub: "awaiting jockey reply",
              subColor: "text-red-400",
              icon: <Mail size={16} className="text-gray-600" />,
            },
          ].map((card) => (
            <div key={card.label} className="bg-[#1a1a1a] rounded-xl border border-white/8 px-6 py-5 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase mb-2">{card.label}</p>
                {card.value == null
                  ? <Skeleton className="h-10 w-16 mt-1 mb-2" />
                  : <p className="text-[38px] font-bold leading-none text-white font-sans">{card.value}</p>
                }
                <p className={`text-[12px] mt-1.5 font-medium ${card.subColor}`}>{card.sub}</p>
              </div>
              <div className="mt-1">{card.icon}</div>
            </div>
          ))}
        </div>

        {/* ── My Upcoming Races + Top Performers ─────────────────────────── */}
        {(() => {
          const myRaces = races.filter(r => r.ownerRegistration != null || r.isLive).slice(0, 5);
          return (
            <div className="grid grid-cols-3 gap-6">

              {/* My Upcoming Races table */}
              <div className="col-span-2 bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                  <h2 className="text-[15px] font-semibold text-white">My Upcoming Races</h2>
                  <button
                    onClick={() => onNavigate("Invitations")}
                    className="flex items-center gap-1 text-[12px] text-red-500 font-medium hover:text-red-400 transition-colors duration-150"
                  >
                    VIEW ALL <ChevronRight size={13} />
                  </button>
                </div>

                {/* Table header */}
                <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] px-6 py-2 border-b border-white/5">
                  {["RACE", "DATE / VENUE", "SPOTS", "1ST PRIZE", ""].map((h) => (
                    <span key={h} className="text-[10.5px] font-semibold tracking-widest text-gray-600 uppercase">{h}</span>
                  ))}
                </div>

                {racesLoading && (
                  <div className="flex items-center gap-2 px-6 py-6 text-gray-600 text-[12px]">
                    <Loader2 size={13} className="animate-spin" /> Loading…
                  </div>
                )}

                {!racesLoading && myRaces.length === 0 && (
                  <div className="px-6 py-8 text-center text-[13px] text-gray-600">
                    You haven't registered for any upcoming races yet.
                  </div>
                )}

                {!racesLoading && myRaces.map((race, i) => (
                  <div
                    key={String(race.id)}
                    className={`grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] px-6 py-4 items-center hover:bg-white/[0.03] transition-colors duration-150 ${i !== myRaces.length - 1 ? "border-b border-white/5" : ""}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {race.isLive && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-900/30 border border-red-700/40 px-1.5 py-0.5 rounded">
                            <Radio size={9} className="animate-pulse" /> LIVE
                          </span>
                        )}
                        <p className="text-[13.5px] font-semibold text-white truncate">{race.name}</p>
                      </div>
                      {race.tournament && (
                        <p className="text-[11px] text-gray-500 mt-0.5 truncate">{race.tournament.name}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-[13px] text-gray-300">{fmtDate(race.date)}</p>
                      {race.location && (
                        <p className="text-[11px] text-gray-600 flex items-center gap-1 mt-0.5">
                          <MapPin size={9} /> {race.location}
                        </p>
                      )}
                    </div>

                    <p className="text-[13px] text-gray-400">
                      {race.maxParticipants != null
                        ? `${race.currentParticipants}/${race.maxParticipants}`
                        : race.currentParticipants}
                    </p>

                    <p className="text-[13px] text-yellow-400 font-semibold">
                      {race.prizes.first > 0 ? `${fmt(race.prizes.first)} ₫` : "—"}
                    </p>

                    <div className="flex items-center gap-2 shrink-0">
                      {race.isLive ? (
                        <button
                          onClick={() => navigate(`/owner/race-monitor/${race.id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-[11.5px] font-bold transition-colors duration-150 shadow-lg shadow-red-900/40"
                        >
                          <Radio size={11} /> Watch Live
                        </button>
                      ) : race.ownerRegistration ? (
                        <RegistrationChip status={race.ownerRegistration.status} />
                      ) : null}
                    </div>
                  </div>
                ))}

                {!racesLoading && myRaces.length > 0 && (
                  <div className="px-6 py-3 border-t border-white/5 flex justify-end">
                    <button
                      onClick={() => onNavigate("Invitations")}
                      className="flex items-center gap-1 text-[11.5px] font-bold tracking-widest text-red-500 hover:text-red-400 uppercase transition-colors duration-150"
                    >
                      View all my races <ChevronRight size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Top Performers */}
              <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                  <h2 className="text-[15px] font-semibold text-white">Top Performers</h2>
                  <Mic2 size={15} className="text-gray-600" />
                </div>

                <div className="divide-y divide-white/5">
                  {performersLoading && Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-4">
                      <Skeleton className="w-6 h-6 shrink-0" />
                      <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-2/3" />
                        <Skeleton className="h-2.5 w-1/2" />
                        <Skeleton className="h-1 w-full rounded-full" />
                      </div>
                    </div>
                  ))}

                  {!performersLoading && performers.length === 0 && (
                    <p className="px-5 py-6 text-center text-[12.5px] text-gray-600">No race history yet.</p>
                  )}

                  {!performersLoading && performers.map((p, i) => (
                    <div key={String(p.id)} className="flex items-center gap-3 px-5 py-4">
                      <span
                        className={`text-[18px] font-bold w-6 text-center shrink-0 font-sans ${i === 0 ? "text-red-500" : "text-gray-600"}`}
                      >
                        {i + 1}
                      </span>
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-800 shrink-0 flex items-center justify-center">
                        {p.img
                          ? <img src={p.img} alt={p.name} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = "none"; }} />
                          : <Trophy size={14} className="text-gray-600" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-white truncate">{p.name}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {p.totalRaces > 0 ? `Win Rate: ${p.winRate}% (${p.wins}/${p.totalRaces})` : "No races yet"}
                        </p>
                        <div className="mt-1.5 h-1 bg-white/8 rounded-full overflow-hidden">
                          <div className="h-full bg-red-600 rounded-full transition-all duration-500" style={{ width: `${p.winRate}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Race Browser (horizontal scroll) ───────────────────────────── */}
        <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
            <div>
              <h2 className="text-[15px] font-semibold text-white">Race Browser</h2>
              <p className="text-[11px] text-gray-600 mt-0.5">All active races — scroll to explore</p>
            </div>
            {racesLoading && <Loader2 size={13} className="animate-spin text-gray-600" />}
          </div>

          {/* Scroll track */}
          <div
            className="flex gap-4 px-6 py-5 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {racesLoading && Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shrink-0 w-60 rounded-xl bg-white/4 border border-white/6 p-4 space-y-3 animate-pulse">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-5 w-4/5 rounded" />
                <Skeleton className="h-3 w-3/5 rounded" />
                <div className="pt-2 space-y-2">
                  <Skeleton className="h-3 w-full rounded" />
                  <Skeleton className="h-3 w-2/3 rounded" />
                </div>
              </div>
            ))}

            {!racesLoading && races.length === 0 && (
              <p className="text-[13px] text-gray-600 py-4">No active races at the moment.</p>
            )}

            {!racesLoading && races.map((race) => {
              const statusCfg = RACE_STATUS_CFG[race.status] ?? { label: race.status, cls: "text-gray-400 bg-white/5 border-white/10" };
              return (
                <div
                  key={String(race.id)}
                  className="shrink-0 w-60 rounded-xl bg-[#141414] border border-white/8 hover:border-white/16 transition-colors duration-150 flex flex-col overflow-hidden"
                >
                  {/* Top accent bar for live races */}
                  {race.isLive && (
                    <div className="h-0.5 bg-gradient-to-r from-red-600 to-red-900" />
                  )}

                  <div className="p-4 flex flex-col gap-3 flex-1">
                    {/* Status + live */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {race.isLive && (
                        <span className="flex items-center gap-1 text-[9.5px] font-bold text-red-400 bg-red-900/30 border border-red-700/40 px-1.5 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
                        </span>
                      )}
                      <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border ${statusCfg.cls}`}>
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Race name */}
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-bold text-white leading-snug line-clamp-2 font-serif">
                        {race.name}
                      </p>
                      {race.tournament && (
                        <p className="text-[10.5px] text-gray-500 mt-0.5 truncate">{race.tournament.name}</p>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 flex-1">
                      {race.date && (
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                          <Calendar size={10} className="shrink-0" />
                          <span>{fmtDate(race.date)}</span>
                        </div>
                      )}
                      {race.location && (
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                          <MapPin size={10} className="shrink-0" />
                          <span className="truncate">{race.location}</span>
                        </div>
                      )}
                      {race.maxParticipants != null && (
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                          <Users size={10} className="shrink-0" />
                          <span>{race.currentParticipants}/{race.maxParticipants} entries</span>
                        </div>
                      )}
                      {race.raceType && (
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                          <Flag size={10} className="shrink-0" />
                          <span className="truncate">{race.raceType}</span>
                        </div>
                      )}
                    </div>

                    {/* Prize + action */}
                    <div className="pt-3 border-t border-white/6 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-semibold tracking-widest text-gray-600 uppercase">1st Prize</p>
                        <p className="text-[13px] font-bold text-yellow-400 mt-0.5">
                          {race.prizes.first > 0 ? `${fmt(race.prizes.first)} ₫` : "—"}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/owner/race-monitor/${race.id}`)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors duration-150 ${race.isLive
                            ? "bg-red-700 hover:bg-red-600 text-white shadow-lg shadow-red-900/40"
                            : "bg-white/8 hover:bg-white/14 text-gray-300"
                          }`}
                      >
                        <Radio size={10} /> Watch
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Load more card */}
            {!racesLoading && racesHasMore && (
              <div className="shrink-0 w-44 self-stretch flex items-center justify-center">
                <button
                  onClick={loadMoreRaces}
                  disabled={racesLoadingMore}
                  className="flex flex-col items-center gap-2 px-5 py-4 rounded-xl border border-white/10 text-gray-500 hover:border-white/25 hover:text-gray-300 disabled:opacity-50 transition-all duration-150 w-full h-full justify-center"
                >
                  {racesLoadingMore
                    ? <Loader2 size={18} className="animate-spin" />
                    : <ChevronRight size={18} />
                  }
                  <span className="text-[11px] font-semibold tracking-wide">
                    {racesLoadingMore ? "Loading…" : "Load more"}
                  </span>
                </button>
              </div>
            )}

            {!racesLoading && !racesHasMore && races.length > 0 && (
              <div className="shrink-0 self-stretch flex items-center px-2">
                <p className="text-[11px] text-gray-700 writing-mode-vertical whitespace-nowrap">All races loaded</p>
              </div>
            )}
          </div>
        </div>


      </div>
    </div>
  );
}
