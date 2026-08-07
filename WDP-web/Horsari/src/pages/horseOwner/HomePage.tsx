import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flag, TrendingUp, Mail, ChevronRight, Mic2,
  Users, Loader2, Trophy, MapPin, Radio, Calendar,
  UserPlus, X, CheckCircle2, XCircle, Check, Search, Ruler,
} from "lucide-react";
import {
  horseOwnerService,
  type DashboardSummary,
  type TopPerformer,
  type BrowsableRace,
  type BrowseFilterOptions,
  type OwnedHorseListItem,
} from "../../api/horseOwnerService";
import { type ManagementTab } from "./Management/SideBar";
import { useSocket } from "../../providers/SocketProvider";
import { RefetchButton } from "../../components/RefetchButton";
import { ErrorState } from "../../components/ErrorState";

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
    pending: "border-amber/40 text-amber bg-amber/10",
    accepted: "border-green/40 text-green bg-green/10",
    verified: "border-blue/40  text-blue  bg-blue/10",
    failed: "border-red/40   text-red   bg-red/10",
    rejected: "border-red/40   text-red   bg-red/10",
    cancelled: "border-white/20 text-text-muted bg-white/8",
  };
  return (
    <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded border capitalize ${cfg[status] ?? cfg.pending}`}>
      {status}
    </span>
  );
}

// ── Race status pill ──────────────────────────────────────────────────────────
const RACE_STATUS_CFG: Record<string, { label: string; cls: string }> = {
  running: { label: "LIVE", cls: "text-red bg-red/20 border-red/30" },
  scheduled: { label: "Upcoming", cls: "text-blue bg-blue/15 border-blue/25" },
  awaitingConfirmation: { label: "Confirming", cls: "text-amber bg-amber/15 border-amber/25" },
  prepared: { label: "Ready", cls: "text-green bg-green/15 border-green/25" },
};

// Mirrors registerForRace's own duplicate-registration guard on the backend
// (`existingReg && !['cancelled', 'rejected'].includes(existingReg.registrationStatus)`):
// a cancelled or rejected registration doesn't hold a slot, so it shouldn't
// block (or be mistaken for) re-registering.
function hasActiveRegistration(race: BrowsableRace): boolean {
  return !!race.ownerRegistration && !["cancelled", "rejected"].includes(race.ownerRegistration.status);
}

// Mirrors registerForRace's own eligibility gate: only scheduled, non-live
// rounds are joinable, and a null maxParticipants means uncapped (no slot
// check to fail), not "unregisterable" — `!= null` alone would hide the
// Register button on every uncapped race.
function canRegisterForRace(race: BrowsableRace): boolean {
  return !race.isLive
    && race.status === "scheduled"
    && !hasActiveRegistration(race)
    && (race.maxParticipants == null || race.currentParticipants < race.maxParticipants);
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded ${className}`} />;
}

// Mirrors the backend's HorseOwnerService._checkHorseEligibility field-for-field
// (same shape used in Races.tsx's RaceDetailModal), applied here against a
// BrowsableRace's already-fetched `eligibility` object.
function isHorseEligible(horse: OwnedHorseListItem, rule: NonNullable<BrowsableRace["eligibility"]>): boolean {
  if (horse.status !== "active" || horse.healthStatus !== "healthy") return false;
  if (rule.requiredBreed && horse.breed !== rule.requiredBreed) return false;
  if (rule.requiredGender && rule.requiredGender !== "both" && rule.requiredGender !== horse.gender) return false;

  const currentYear = new Date().getFullYear();
  const horseAge = horse.dateOfBirth ? currentYear - new Date(horse.dateOfBirth).getFullYear() : 0;
  if (rule.minAge != null && horseAge < rule.minAge) return false;
  if (rule.maxAge != null && horseAge > rule.maxAge) return false;

  if (rule.minRacesWon != null || rule.minRacesRun != null) {
    const racesRun = horse.raceResults?.length ?? 0;
    const wins = horse.raceResults?.filter((r) => r.finishPosition === 1).length ?? 0;
    if (rule.minRacesRun != null && racesRun < rule.minRacesRun) return false;
    if (rule.minRacesWon != null && wins < rule.minRacesWon) return false;
  }

  return true;
}

type RegisterToastState = { type: "success" | "error"; message: string; detail?: string } | null;

// ── Register modal ────────────────────────────────────────────────────────────
// A horse is NOT picked here — registering just claims a slot. The owner
// assigns a horse afterward, from the race/registration detail view, right
// when they invite a jockey (HireJockeyModal's horse-picker step is what
// actually sets Registration.horseId).
function RegisterRaceModal({ race, onClose, onRegistered }: {
  race: BrowsableRace;
  onClose: () => void;
  onRegistered: (registrationId: string) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<RegisterToastState>(null);
  const [horses, setHorses] = useState<OwnedHorseListItem[]>([]);
  const [horsesLoading, setHorsesLoading] = useState(true);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    horseOwnerService.getUserHorse(1, 100)
      .then((res) => { if (!cancelled) setHorses(res.data?.items ?? []); })
      .catch(() => { if (!cancelled) setHorses([]); })
      .finally(() => { if (!cancelled) setHorsesLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const eligibleHorses = race.eligibility
    ? horses.filter((h) => isHorseEligible(h, race.eligibility!))
    : horses.filter((h) => h.status === "active" && h.healthStatus === "healthy");

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const res = await horseOwnerService.registerForRace(race.id);
      const registrationId = (res.data as any)?._id ?? "";
      setToast({ type: "success", message: "Registered!" });
      setTimeout(() => onRegistered(registrationId), 1500);
    } catch (err: any) {
      setToast({ type: "error", message: "Registration Failed", detail: err?.msg ?? "Failed to register for this race." });
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 font-sans">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-bg border border-border rounded-2xl shadow-2xl shadow-black/90 flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-border shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center shrink-0">
                <Flag size={16} className="text-red" />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-text-muted/70 uppercase">Registering</p>
                <h2 className="text-[18px] font-bold text-text leading-tight font-serif">{race.name}</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/5 border border-border flex items-center justify-center text-text-muted hover:text-text hover:bg-white/10 transition-all duration-150"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Body — full race round detail */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">
          {/* Identity strip */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {(() => {
                const cfg = RACE_STATUS_CFG[race.status] ?? { label: race.status, cls: "text-text-muted bg-white/5 border-border" };
                return (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
                    {cfg.label}
                  </span>
                );
              })()}
              {race.tournament && (
                <span className="text-[12px] text-text-muted">{race.tournament.name}</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <div className="flex items-center gap-1.5 text-text-muted">
                <Calendar size={11} className="shrink-0" /> {fmtDate(race.date)}
              </div>
              <div className="flex items-center gap-1.5 text-text-muted">
                <MapPin size={11} className="shrink-0" /> {race.location ?? "TBA"}
              </div>
            </div>
          </div>

          {/* Race info */}
          <div className="bg-surface p-4 rounded-xl border border-border flex flex-col gap-3">
            <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Race Info</h3>
            <div className="grid grid-cols-[110px_1fr] gap-y-2.5 gap-x-4 text-[12.5px]">
              <span className="text-text-muted font-medium">Race Type</span>
              <span className="text-text">{race.raceType ?? <span className="text-text-muted/70 italic">N/A</span>}</span>
              <span className="text-text-muted font-medium">Entries</span>
              <span className="text-text">
                {race.maxParticipants != null ? `${race.currentParticipants}/${race.maxParticipants}` : race.currentParticipants} entries
              </span>
              <span className="text-text-muted font-medium">Entry Fee</span>
              <span className="text-text">{race.entryFee > 0 ? `${race.entryFee.toLocaleString()} ₫` : "Free"}</span>
            </div>
          </div>

          {/* Prize pool */}
          <div className="bg-surface p-4 rounded-xl border border-border flex flex-col gap-3">
            <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
              <Trophy size={12} className="text-gold" /> Prize Pool
            </h3>
            <div className="grid grid-cols-[110px_1fr] gap-y-2.5 gap-x-4 text-[12.5px]">
              <span className="text-text-muted font-medium">1st Place</span>
              <span className="text-gold font-semibold">{race.prizes.first > 0 ? `${race.prizes.first.toLocaleString()} ₫` : <span className="text-text-muted/70 italic font-normal">N/A</span>}</span>
              <span className="text-text-muted font-medium">2nd Place</span>
              <span className="text-gold font-semibold">{race.prizes.second > 0 ? `${race.prizes.second.toLocaleString()} ₫` : <span className="text-text-muted/70 italic font-normal">N/A</span>}</span>
              <span className="text-text-muted font-medium">3rd Place</span>
              <span className="text-gold font-semibold">{race.prizes.third > 0 ? `${race.prizes.third.toLocaleString()} ₫` : <span className="text-text-muted/70 italic font-normal">N/A</span>}</span>
            </div>
          </div>

          {/* My eligible horses — informational only, no picker: nothing here is
              selected or submitted, it just shows what could race here. */}
          <div className="bg-surface p-4 rounded-xl border border-border flex flex-col gap-3">
            <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
              My Eligible Horses{!horsesLoading && ` (${eligibleHorses.length})`}
            </h3>

            {horsesLoading && (
              <div className="flex items-center gap-2 text-text-muted/70 text-[12px] py-1">
                <Loader2 size={12} className="animate-spin" /> Checking your stable…
              </div>
            )}

            {!horsesLoading && eligibleHorses.length === 0 && (
              <p className="text-[12px] text-amber-500/80">
                None of your horses are currently eligible for this race — you need at least one eligible horse to register.
              </p>
            )}

            {!horsesLoading && eligibleHorses.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {eligibleHorses.map((h) => (
                  <span key={h._id} className="text-[11px] text-text-muted bg-white/5 border border-border px-2 py-1 rounded-lg">
                    {h.horseName}
                    {(h.breed || h.gender) && (
                      <span className="text-text-muted/70"> · {[h.breed, h.gender].filter(Boolean).join(" · ")}</span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Registration note */}
          <div className="flex items-start gap-2 text-[12px] text-text-muted bg-white/[0.02] border border-border/60 rounded-xl px-4 py-3">
            <Check size={13} className="text-text-muted shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Confirming reserves a slot under your name using one of your eligible horses. You'll assign the specific horse afterward from the race's detail view, when you invite a jockey.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-bg shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-white/12 text-text-muted text-[13px] font-semibold hover:border-white/25 hover:text-text transition-all duration-150"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting || horsesLoading || eligibleHorses.length === 0}
            title={!horsesLoading && eligibleHorses.length === 0 ? "You need at least one eligible horse to register" : undefined}
            className={`flex-1 py-2.5 rounded-lg text-[13px] font-bold transition-all duration-150 flex items-center justify-center gap-2 ${!submitting && !horsesLoading && eligibleHorses.length > 0
              ? "bg-red hover:bg-red/85 text-text shadow-lg shadow-red-900/30"
              : "bg-surface border border-border text-text-muted/70 cursor-not-allowed"
              }`}
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {submitting ? "Registering…" : "Confirm Registration"}
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="absolute inset-0 flex items-center justify-center z-10 rounded-2xl bg-black/60 backdrop-blur-[2px]">
            <div className={`flex flex-col items-center gap-3 px-8 py-6 rounded-2xl border shadow-2xl
      ${toast.type === "success"
                ? "bg-[#0d1f0d] border-green/30"
                : "bg-[#1f0d0d] border-red/30"}`}
            >
              {toast.type === "success"
                ? <CheckCircle2 size={36} className="text-green" />
                : <XCircle size={36} className="text-red" />
              }
              <p className={`text-[16px] font-bold ${toast.type === "success" ? "text-green" : "text-red"}`}>
                {toast.message}
              </p>
              {toast.detail && (
                <p className="text-[12px] text-text-muted text-center max-w-[220px] leading-relaxed">
                  {toast.detail}
                </p>
              )}
              {toast.type === "error" && (
                <button
                  onClick={() => setToast(null)}
                  className="mt-1 text-[11px] text-text-muted hover:text-text underline underline-offset-2 transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
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
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [performersError, setPerformersError] = useState<string | null>(null);
  const [racesError, setRacesError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [registeringRace, setRegisteringRace] = useState<BrowsableRace | null>(null);

  // Race Browser search/filters
  const [raceSearch, setRaceSearch] = useState("");
  const [raceTypeFilter, setRaceTypeFilter] = useState("");
  const [tournamentFilter, setTournamentFilter] = useState("");
  const [distanceFilter, setDistanceFilter] = useState("");
  const [filterOptions, setFilterOptions] = useState<BrowseFilterOptions>({ raceTypes: [], tournaments: [], distances: [] });
  const hasActiveRaceFilters = Boolean(raceSearch || raceTypeFilter || tournamentFilter || distanceFilter);
  const clearRaceFilters = () => {
    setRaceSearch("");
    setRaceTypeFilter("");
    setTournamentFilter("");
    setDistanceFilter("");
  };

  // Live refetch on any notification addressed to this horse owner.
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;
    const handler = () => setRefreshTick((t) => t + 1);
    socket.on("notification_created", handler);
    return () => { socket.off("notification_created", handler); };
  }, [socket]);

  useEffect(() => {
    let cancelled = false;

    async function fetchSummaryAndPerformers() {
      setSummaryError(null);
      setPerformersError(null);

      const [sumRes, perfRes] = await Promise.allSettled([
        horseOwnerService.getDashboardSummary(),
        horseOwnerService.getTopPerformers(3),
      ]);

      if (cancelled) return;

      if (sumRes.status === "fulfilled") {
        setSummary(sumRes.value.data);
      } else {
        setSummaryError((sumRes.reason as any)?.msg ?? "Failed to load dashboard summary.");
      }
      if (perfRes.status === "fulfilled") {
        setPerformers(perfRes.value.data);
      } else {
        setPerformersError((perfRes.reason as any)?.msg ?? "Failed to load top performers.");
      }

      setSummaryLoading(false);
      setPerformersLoading(false);
      setLastUpdated(Date.now());
    }

    fetchSummaryAndPerformers();
    return () => { cancelled = true; };
  }, [refreshTick]);

  // Races refetch independently whenever search/filters change, resetting to
  // page 1 (dashboard summary/top performers only refetch on refreshTick).
  useEffect(() => {
    let cancelled = false;

    async function fetchRaces() {
      setRacesLoading(true);
      setRacesError(null);
      try {
        const res = await horseOwnerService.browseRaces({
          page: 1,
          limit: 10,
          search: raceSearch || undefined,
          raceType: raceTypeFilter || undefined,
          tournamentId: tournamentFilter || undefined,
          distance: distanceFilter ? Number(distanceFilter) : undefined,
        });
        if (cancelled) return;
        const { items, pagination, filterOptions: fo } = res.data;
        setRaces(items);
        setRacesPage(1);
        setRacesHasMore(pagination.currentPage < pagination.totalPages);
        // Only page-1 responses include filterOptions — keep the prior value otherwise.
        if (fo) setFilterOptions(fo);
      } catch (err: any) {
        if (!cancelled) setRacesError(err?.msg ?? "Failed to load races.");
      } finally {
        if (!cancelled) setRacesLoading(false);
      }
    }

    fetchRaces();
    return () => { cancelled = true; };
  }, [raceSearch, raceTypeFilter, tournamentFilter, distanceFilter, refreshTick]);

  async function loadMoreRaces() {
    if (racesLoadingMore || !racesHasMore) return;
    setRacesLoadingMore(true);
    try {
      const next = racesPage + 1;
      const res = await horseOwnerService.browseRaces({
        page: next,
        limit: 10,
        search: raceSearch || undefined,
        raceType: raceTypeFilter || undefined,
        tournamentId: tournamentFilter || undefined,
        distance: distanceFilter ? Number(distanceFilter) : undefined,
      });
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

  function handleRegistered(registrationId: string) {
    if (!registeringRace) return;
    const raceId = registeringRace.id;
    setRaces(prev => prev.map(r => r.id === raceId
      ? { ...r, ownerRegistration: { status: "accepted", registrationId }, currentParticipants: r.currentParticipants + 1 }
      : r
    ));
    setRegisteringRace(null);
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-text leading-tight font-serif">
              Welcome back
            </h1>
            <p className="text-[13px] text-text-muted mt-0.5">
              Here's your stable overview for today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <RefetchButton onRefetch={() => setRefreshTick((t) => t + 1)} lastUpdated={lastUpdated} />
            <button
              onClick={() => onNavigate("Jockeys")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/15 text-[13px] font-medium text-text-muted hover:border-white/30 hover:text-text transition-colors duration-150"
            >
              <Users size={14} /> Hire Jockey
            </button>
            <button
              onClick={() => onNavigate("Horses")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red text-[13px] font-semibold text-text hover:bg-red/85 transition-colors duration-150 shadow-lg shadow-red-900/40"
            >
              <Flag size={14} /> My Horses
            </button>
          </div>
        </div>

        {summaryError && (
          <ErrorState message={summaryError} onRetry={() => setRefreshTick((t) => t + 1)} />
        )}

        {/* ── Stat Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "TOTAL HORSES",
              value: summaryLoading ? null : String(summary?.totalHorses ?? 0),
              sub: "in your stable",
              subColor: "text-text-muted",
              icon: <Flag size={16} className="text-text-muted/70" />,
            },
            {
              label: "ACTIVE RACES",
              value: summaryLoading ? null : String(summary?.upcomingRacesCount ?? 0),
              sub: "registered & live",
              subColor: "text-red",
              icon: <TrendingUp size={16} className="text-text-muted/70" />,
            },
            {
              label: "PENDING INVITATIONS",
              value: summaryLoading ? null : String(summary?.activeInvitationsCount ?? 0),
              sub: "awaiting jockey reply",
              subColor: "text-red",
              icon: <Mail size={16} className="text-text-muted/70" />,
            },
          ].map((card) => (
            <div key={card.label} className="bg-surface rounded-xl border border-border px-6 py-5 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold tracking-widest text-text-muted uppercase mb-2">{card.label}</p>
                {card.value == null
                  ? <Skeleton className="h-10 w-16 mt-1 mb-2" />
                  : <p className="text-[38px] font-bold leading-none text-text font-sans">{card.value}</p>
                }
                <p className={`text-[12px] mt-1.5 font-medium ${card.subColor}`}>{card.sub}</p>
              </div>
              <div className="mt-1">{card.icon}</div>
            </div>
          ))}
        </div>

        {/* ── My Upcoming Races + Top Performers ─────────────────────────── */}
        {(() => {
          const myRaces = races.filter(r => hasActiveRegistration(r) || r.isLive).slice(0, 5);
          return (
            <div className="grid grid-cols-3 gap-6">

              {/* My Upcoming Races table */}
              <div className="col-span-2 bg-surface rounded-xl border border-border overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <h2 className="text-[15px] font-semibold text-text">My Upcoming Races</h2>
                  <button
                    onClick={() => onNavigate("Invitations")}
                    className="flex items-center gap-1 text-[12px] text-red font-medium hover:text-red transition-colors duration-150"
                  >
                    VIEW ALL <ChevronRight size={13} />
                  </button>
                </div>

                {/* Table header */}
                <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] px-6 py-2 border-b border-border/60">
                  {["RACE", "DATE / VENUE", "SPOTS", "1ST PRIZE", ""].map((h) => (
                    <span key={h} className="text-[10.5px] font-semibold tracking-widest text-text-muted/70 uppercase">{h}</span>
                  ))}
                </div>

                {racesLoading && (
                  <div className="flex items-center gap-2 px-6 py-6 text-text-muted/70 text-[12px]">
                    <Loader2 size={13} className="animate-spin" /> Loading…
                  </div>
                )}

                {!racesLoading && racesError && (
                  <div className="px-6 py-6">
                    <ErrorState message={racesError} onRetry={() => setRefreshTick((t) => t + 1)} />
                  </div>
                )}

                {!racesLoading && !racesError && myRaces.length === 0 && (
                  <div className="px-6 py-8 text-center text-[13px] text-text-muted/70">
                    You haven't registered for any upcoming races yet.
                  </div>
                )}

                {!racesLoading && !racesError && myRaces.map((race, i) => (
                  <div
                    key={String(race.id)}
                    className={`grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] px-6 py-4 items-center hover:bg-white/[0.03] transition-colors duration-150 ${i !== myRaces.length - 1 ? "border-b border-border/60" : ""}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {race.isLive && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-red bg-red/20 border border-red/30 px-1.5 py-0.5 rounded">
                            <Radio size={9} className="animate-pulse" /> LIVE
                          </span>
                        )}
                        <p className="text-[13.5px] font-semibold text-text truncate">{race.name}</p>
                      </div>
                      {race.tournament && (
                        <p className="text-[11px] text-text-muted mt-0.5 truncate">{race.tournament.name}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-[13px] text-text-muted">{fmtDate(race.date)}</p>
                      {race.location && (
                        <p className="text-[11px] text-text-muted/70 flex items-center gap-1 mt-0.5">
                          <MapPin size={9} /> {race.location}
                        </p>
                      )}
                    </div>

                    <p className="text-[13px] text-text-muted">
                      {race.maxParticipants != null
                        ? `${race.currentParticipants}/${race.maxParticipants}`
                        : race.currentParticipants}
                    </p>

                    <p className="text-[13px] text-gold font-semibold">
                      {race.prizes.first > 0 ? `${fmt(race.prizes.first)} ₫` : "—"}
                    </p>

                    <div className="flex items-center gap-2 shrink-0">
                      {race.isLive ? (
                        <button
                          onClick={() => navigate(`/owner/race-monitor/${race.id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red hover:bg-red/85 text-text text-[11.5px] font-bold transition-colors duration-150 shadow-lg shadow-red-900/40"
                        >
                          <Radio size={11} /> Watch Live
                        </button>
                      ) : hasActiveRegistration(race) ? (
                        <RegistrationChip status={race.ownerRegistration!.status} />
                      ) : null}
                    </div>
                  </div>
                ))}

                {!racesLoading && myRaces.length > 0 && (
                  <div className="px-6 py-3 border-t border-border/60 flex justify-end">
                    <button
                      onClick={() => onNavigate("Invitations")}
                      className="flex items-center gap-1 text-[11.5px] font-bold tracking-widest text-red hover:text-red uppercase transition-colors duration-150"
                    >
                      View all my races <ChevronRight size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Top Performers */}
              <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <h2 className="text-[15px] font-semibold text-text">Top Performers</h2>
                  <Mic2 size={15} className="text-text-muted/70" />
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

                  {!performersLoading && performersError && (
                    <div className="px-5 py-4">
                      <ErrorState message={performersError} onRetry={() => setRefreshTick((t) => t + 1)} />
                    </div>
                  )}

                  {!performersLoading && !performersError && performers.length === 0 && (
                    <p className="px-5 py-6 text-center text-[12.5px] text-text-muted/70">No race history yet.</p>
                  )}

                  {!performersLoading && !performersError && performers.map((p, i) => (
                    <div key={String(p.id)} className="flex items-center gap-3 px-5 py-4">
                      <span
                        className={`text-[18px] font-bold w-6 text-center shrink-0 font-sans ${i === 0 ? "text-red" : "text-text-muted/70"}`}
                      >
                        {i + 1}
                      </span>
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-surface-raised shrink-0 flex items-center justify-center">
                        {p.img
                          ? <img src={p.img} alt={p.name} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = "none"; }} />
                          : <Trophy size={14} className="text-text-muted/70" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-text truncate">{p.name}</p>
                        <p className="text-[11px] text-text-muted mt-0.5">
                          {p.totalRaces > 0 ? `Win Rate: ${p.winRate}% (${p.wins}/${p.totalRaces})` : "No races yet"}
                        </p>
                        <div className="mt-1.5 h-1 bg-white/8 rounded-full overflow-hidden">
                          <div className="h-full bg-red rounded-full transition-all duration-500" style={{ width: `${p.winRate}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Race Browser ──────────────────────────────────────────────── */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <h2 className="text-[15px] font-semibold text-text">Race Browser</h2>
              <p className="text-[11px] text-text-muted/70 mt-0.5">All active races</p>
            </div>
            {racesLoading && <Loader2 size={13} className="animate-spin text-text-muted/70" />}
          </div>

          {/* Search + filters */}
          <div className="flex items-center gap-3 flex-wrap px-6 pt-4">
            <div className="relative flex-1 min-w-[160px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search races…"
                value={raceSearch}
                onChange={(e) => setRaceSearch(e.target.value)}
                className="w-full bg-bg border border-border rounded-md pl-8 pr-3 text-[11px] text-text placeholder:text-text-muted focus:outline-none focus:border-white/20 h-[32px]"
              />
            </div>
            <select
              value={raceTypeFilter}
              onChange={(e) => setRaceTypeFilter(e.target.value)}
              className="w-[150px] shrink-0 bg-bg border border-border rounded-md px-3 text-[11px] text-text-muted focus:outline-none h-[32px] appearance-none cursor-pointer"
            >
              <option value="">All Types</option>
              {filterOptions.raceTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              value={tournamentFilter}
              onChange={(e) => setTournamentFilter(e.target.value)}
              className="w-[170px] shrink-0 bg-bg border border-border rounded-md px-3 text-[11px] text-text-muted focus:outline-none h-[32px] appearance-none cursor-pointer"
            >
              <option value="">All Tournaments</option>
              {filterOptions.tournaments.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <select
              value={distanceFilter}
              onChange={(e) => setDistanceFilter(e.target.value)}
              className="w-[140px] shrink-0 bg-bg border border-border rounded-md px-3 text-[11px] text-text-muted focus:outline-none h-[32px] appearance-none cursor-pointer"
            >
              <option value="">All Distances</option>
              {filterOptions.distances.map((d) => (
                <option key={d} value={d}>{d}m</option>
              ))}
            </select>
            {hasActiveRaceFilters && (
              <button
                onClick={clearRaceFilters}
                className="flex items-center gap-1 text-[11px] font-semibold text-text-muted hover:text-text transition-colors shrink-0"
              >
                <X size={11} /> Clear filters
              </button>
            )}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-6 py-5">
            {racesLoading && Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-full rounded-xl bg-white/4 border border-border/60 p-4 space-y-3 animate-pulse">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-5 w-4/5 rounded" />
                <Skeleton className="h-3 w-3/5 rounded" />
                <div className="pt-2 space-y-2">
                  <Skeleton className="h-3 w-full rounded" />
                  <Skeleton className="h-3 w-2/3 rounded" />
                </div>
              </div>
            ))}

            {!racesLoading && racesError && (
              <div className="col-span-full py-4">
                <ErrorState message={racesError} onRetry={() => setRefreshTick((t) => t + 1)} />
              </div>
            )}

            {!racesLoading && !racesError && races.length === 0 && (
              <div className="col-span-full flex flex-col items-center gap-2 py-8 text-center">
                <p className="text-[13px] text-text-muted/70">
                  {hasActiveRaceFilters ? "No races match your filters." : "No active races at the moment."}
                </p>
                {hasActiveRaceFilters && (
                  <button
                    onClick={clearRaceFilters}
                    className="text-[12px] text-text-muted/70 hover:text-text-muted transition-colors underline underline-offset-2"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {!racesLoading && !racesError && races.map((race) => {
              const statusCfg = RACE_STATUS_CFG[race.status] ?? { label: race.status, cls: "text-text-muted bg-white/5 border-border" };
              return (
                <div
                  key={String(race.id)}
                  className="w-full rounded-xl bg-surface border border-border hover:border-white/16 transition-colors duration-150 flex flex-col overflow-hidden"
                >
                  {/* Top accent bar for live races */}
                  {race.isLive && (
                    <div className="h-0.5 bg-gradient-to-r from-red to-red/60" />
                  )}

                  <div className="p-4 flex flex-col gap-3 flex-1">
                    {/* Status + live */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {race.isLive && (
                        <span className="flex items-center gap-1 text-[9.5px] font-bold text-red bg-red/20 border border-red/30 px-1.5 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-red animate-pulse" /> LIVE
                        </span>
                      )}
                      <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border ${statusCfg.cls}`}>
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Race name */}
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-bold text-text leading-snug line-clamp-2 font-serif">
                        {race.name}
                      </p>
                      {race.tournament && (
                        <p className="text-[10.5px] text-text-muted mt-0.5 truncate">{race.tournament.name}</p>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 flex-1">
                      {race.date && (
                        <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                          <Calendar size={10} className="shrink-0" />
                          <span>{fmtDate(race.date)}</span>
                        </div>
                      )}
                      {race.location && (
                        <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                          <MapPin size={10} className="shrink-0" />
                          <span className="truncate">{race.location}</span>
                        </div>
                      )}
                      {race.maxParticipants != null && (
                        <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                          <Users size={10} className="shrink-0" />
                          <span>{race.currentParticipants}/{race.maxParticipants} entries</span>
                        </div>
                      )}
                      {race.raceType && (
                        <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                          <Flag size={10} className="shrink-0" />
                          <span className="truncate">{race.raceType}</span>
                        </div>
                      )}
                      {race.trackLength != null && (
                        <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                          <Ruler size={10} className="shrink-0" />
                          <span>{race.trackLength}m</span>
                        </div>
                      )}
                    </div>

                    {/* Prize + action */}
                    <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-semibold tracking-widest text-text-muted/70 uppercase">1st Prize</p>
                        <p className="text-[13px] font-bold text-gold mt-0.5">
                          {race.prizes.first > 0 ? `${fmt(race.prizes.first)} ₫` : "—"}
                        </p>
                      </div>
                      {hasActiveRegistration(race) ? (
                        <RegistrationChip status={race.ownerRegistration!.status} />
                      ) : canRegisterForRace(race) ? (
                        <button
                          onClick={() => setRegisteringRace(race)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-red hover:bg-red/85 text-text shadow-lg shadow-red-900/40 transition-colors duration-150"
                        >
                          <UserPlus size={10} /> Register
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/owner/race-monitor/${race.id}`)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors duration-150 ${race.isLive
                              ? "bg-red hover:bg-red/85 text-text shadow-lg shadow-red-900/40"
                              : "bg-white/8 hover:bg-white/14 text-text-muted"
                            }`}
                        >
                          <Radio size={10} /> Watch
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load more / end-of-list footer */}
          {!racesLoading && !racesError && racesHasMore && (
            <div className="flex justify-center pb-5">
              <button
                onClick={loadMoreRaces}
                disabled={racesLoadingMore}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-text-muted hover:border-white/25 hover:text-gray-200 disabled:opacity-50 transition-all duration-150 text-[12px] font-semibold"
              >
                {racesLoadingMore
                  ? <Loader2 size={14} className="animate-spin" />
                  : <ChevronRight size={14} />
                }
                {racesLoadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}

          {!racesLoading && !racesError && !racesHasMore && races.length > 0 && (
            <p className="text-center text-[11px] text-text-muted/50 pb-5">All races loaded</p>
          )}
        </div>


      </div>

      {registeringRace && (
        <RegisterRaceModal
          race={registeringRace}
          onClose={() => setRegisteringRace(null)}
          onRegistered={handleRegistered}
        />
      )}
    </div>
  );
}
