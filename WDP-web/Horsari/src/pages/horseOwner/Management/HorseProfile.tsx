import { useState, useEffect, useCallback } from "react";
import {
  X, Calendar, MapPin, Flag, Trophy,
  ShieldAlert, Loader2, AlertCircle, ChevronRight, Clock,
} from "lucide-react";
import {
  horseOwnerService,
  type HorseProfileData,
  type HorseRegistrationEntry,
  type HorseViolationEntry,
} from "../../../api/horseOwnerService";
import { RejectRegistrationModal } from "../../../components/RejectRegistrationModal";
import { useRejectRegistration } from "../../../hooks/useRejectRegistration";

// ── Props ─────────────────────────────────────────────────────────────────────
interface HorseProfileProps {
  horseId: string | null;
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  return iso ? iso.split("T")[0] : "—";
}

function calcAge(dateOfBirth: string): number {
  return Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365));
}

// ── Finish position badge ─────────────────────────────────────────────────────
function PositionBadge({ position, regStatus }: { position: number | null | undefined; regStatus: string }) {
  if (position === 1) return <span className="text-[13px] font-bold text-yellow-400">1st</span>;
  if (position === 2) return <span className="text-[13px] font-bold text-gray-300">2nd</span>;
  if (position === 3) return <span className="text-[13px] font-bold text-amber-600">3rd</span>;
  if (position != null) return <span className="text-[13px] font-semibold text-gray-400">{position}th</span>;
  if (regStatus === "failed") return <span className="text-[13px] font-semibold text-red-500">DNF</span>;
  return <span className="text-[13px] text-gray-600">—</span>;
}

// ── Reg status chip ───────────────────────────────────────────────────────────
const REG_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "PENDING",   color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-600/40" },
  accepted:  { label: "ACCEPTED",  color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-600/40"    },
  verified:  { label: "VERIFIED",  color: "text-green-400",  bg: "bg-green-500/10 border-green-600/40"  },
  failed:    { label: "FAILED",    color: "text-red-400",    bg: "bg-red-500/10 border-red-700/40"      },
  rejected:  { label: "REJECTED",  color: "text-gray-400",   bg: "bg-gray-500/10 border-gray-600/40"   },
  cancelled: { label: "CANCELLED", color: "text-gray-400",   bg: "bg-gray-500/10 border-gray-600/40"   },
};

function RegChip({ status }: { status: string }) {
  const cfg = REG_CFG[status] ?? REG_CFG.pending;
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cfg.color} ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

// ── Steward action chip ───────────────────────────────────────────────────────
function StewardChip({ action }: { action: string }) {
  const severe = ["suspended", "disqualified", "permanent-ban", "investigation"].includes(action);
  const mid    = ["fine"].includes(action);
  const color  = severe ? "text-red-400 bg-red-500/10 border-red-700/40"
    : mid      ? "text-orange-400 bg-orange-500/10 border-orange-700/40"
    :            "text-yellow-400 bg-yellow-500/10 border-yellow-700/40";
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${color} capitalize`}>
      {action.replace(/-/g, " ")}
    </span>
  );
}

// ── Violation status chip ─────────────────────────────────────────────────────
function ViolationStatusChip({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    pending:   "text-yellow-400 bg-yellow-500/10 border-yellow-600/40",
    confirmed: "text-red-400 bg-red-500/10 border-red-700/40",
    dismissed: "text-gray-500 bg-gray-500/10 border-gray-600/30",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${cfg[status] ?? cfg.pending}`}>
      {status}
    </span>
  );
}

// ── Severity dots ─────────────────────────────────────────────────────────────
function SeverityDots({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`w-1.5 h-1.5 rounded-full ${i < level ? "bg-red-500" : "bg-white/10"}`} />
      ))}
    </div>
  );
}

// ── Stat cell ─────────────────────────────────────────────────────────────────
function StatCell({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="bg-[#1e1e1e] rounded-xl px-3 py-3 border border-border text-center">
      <p className="text-[9px] font-semibold tracking-widest text-gray-600 uppercase mb-1">{label}</p>
      <p className={`text-[18px] font-bold ${accent ? "text-yellow-400" : "text-white"}`}>{value}</p>
    </div>
  );
}

// ── Active registration card ──────────────────────────────────────────────────
function ActiveRegCard({ entry, onRequestReject }: { entry: HorseRegistrationEntry; onRequestReject: (id: string, label: string) => void }) {
  const rr  = entry.raceRound;
  const reg = entry.registration;
  const canReject = reg.registrationStatus === "pending" || reg.registrationStatus === "accepted";

  const statusGlow =
    reg.registrationStatus === "verified"
      ? "border-green-700/40 bg-green-900/10"
      : reg.registrationStatus === "accepted"
      ? "border-blue-700/40 bg-blue-900/10"
      : "border-yellow-700/40 bg-yellow-900/10";

  return (
    <div className={`rounded-xl border px-4 py-3.5 flex items-center gap-4 ${statusGlow}`}>
      <Clock size={16} className="text-yellow-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-white truncate font-serif">
          {rr?.roundName ?? "Race Round"}
        </p>
        <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap mt-0.5">
          {rr?.raceDate && (
            <span className="flex items-center gap-1"><Calendar size={10} />{formatDate(rr.raceDate)}</span>
          )}
          {rr?.location && (
            <span className="flex items-center gap-1"><MapPin size={10} />{rr.location}</span>
          )}
          {reg.laneNumber != null && (
            <span className="text-gray-500">Lane {reg.laneNumber}</span>
          )}
        </div>
      </div>
      {canReject && (
        <button
          onClick={() => onRequestReject(reg._id, rr?.roundName ?? "this race")}
          className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-red-700/40 text-red-400 hover:bg-red-700/10 transition-colors duration-150 shrink-0"
        >
          Reject
        </button>
      )}
      <RegChip status={reg.registrationStatus} />
    </div>
  );
}

// ── Race history tab ──────────────────────────────────────────────────────────
function RaceHistoryTab({ history, onRequestReject }: { history: HorseRegistrationEntry[]; onRequestReject: (id: string, label: string) => void }) {
  const ACTIVE = ["pending", "accepted", "verified"];

  const upcoming  = history.filter(e => ACTIVE.includes(e.registration.registrationStatus) && !e.result);
  const pastRaces = history.filter(e => e.result != null);

  // Horse has never been registered for any race
  if (history.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white/2 px-5 py-12 text-center">
        <Trophy size={32} className="text-gray-700 mx-auto mb-3" />
        <p className="text-[14px] font-semibold text-gray-500 mb-1">No races entered yet</p>
        <p className="text-[12px] text-gray-600 max-w-xs mx-auto leading-relaxed">
          This horse hasn't been registered for any race. Register them for an upcoming event to track their performance here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Upcoming / active registrations */}
      {upcoming.length > 0 && (
        <div>
          <p className="text-[10px] font-bold tracking-widest text-yellow-600 uppercase mb-2 flex items-center gap-1.5">
            <Clock size={10} /> Currently Registering · {upcoming.length} race{upcoming.length > 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {upcoming.map(e => <ActiveRegCard key={String(e.registration._id)} entry={e} onRequestReject={onRequestReject} />)}
          </div>
        </div>
      )}

      {/* Past race results */}
      {pastRaces.length > 0 ? (
        <div>
          {upcoming.length > 0 && (
            <p className="text-[10px] font-bold tracking-widest text-gray-600 uppercase mb-2">Race Results</p>
          )}
          <div className="space-y-2">
            {pastRaces.map((entry) => {
              const rr  = entry.raceRound;
              const res = entry.result;
              const reg = entry.registration;

              return (
                <div key={String(reg._id)} className="bg-[#1e1e1e] rounded-xl border border-border px-4 py-3.5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-[13px] font-bold text-white truncate font-serif">
                        {rr?.roundName ?? "—"}
                      </p>
                      {rr?.tournament && (
                        <span className="text-[10px] text-gray-600 bg-white/5 border border-border px-1.5 py-0.5 rounded">
                          {rr.tournament.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
                      {rr?.raceDate && (
                        <span className="flex items-center gap-1"><Calendar size={10} />{formatDate(rr.raceDate)}</span>
                      )}
                      {rr?.location && (
                        <span className="flex items-center gap-1"><MapPin size={10} />{rr.location}</span>
                      )}
                      {rr?.trackLength && (
                        <span className="flex items-center gap-1"><Flag size={10} />{rr.trackLength}m</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <RegChip status={reg.registrationStatus} />
                    <div className="text-center min-w-[36px]">
                      <p className="text-[9px] font-semibold tracking-widest text-gray-600 uppercase mb-0.5">Pos.</p>
                      <PositionBadge position={res?.finishPosition} regStatus={reg.registrationStatus} />
                    </div>
                    <div className="text-center min-w-[56px]">
                      <p className="text-[9px] font-semibold tracking-widest text-gray-600 uppercase mb-0.5">Prize</p>
                      <p className="text-[12px] font-semibold text-green-400">
                        {res?.prizeMoney ? `${res.prizeMoney.toLocaleString()} ₫` : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        upcoming.length > 0 && (
          <div className="rounded-xl border border-border bg-white/2 px-4 py-6 text-center">
            <p className="text-[13px] text-gray-600">No race results yet — awaiting upcoming event.</p>
          </div>
        )
      )}
    </div>
  );
}

// ── Violations tab ────────────────────────────────────────────────────────────
function ViolationsTab({ violations }: { violations: HorseViolationEntry[] }) {
  if (violations.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white/2 px-5 py-10 text-center">
        <ShieldAlert size={28} className="text-gray-700 mx-auto mb-3" />
        <p className="text-[13px] text-gray-600">No violations on record.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {violations.map((v) => (
        <div key={String(v._id)} className="bg-[#1e1e1e] rounded-xl border border-border px-4 py-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-white mb-0.5">
                {v.violationType?.violationName ?? "Unknown Violation"}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-gray-500 flex-wrap">
                <span className="capitalize text-gray-500 bg-white/5 border border-border px-1.5 py-0.5 rounded text-[10px]">
                  {v.violationType?.category ?? "—"}
                </span>
                {v.raceRound?.roundName && (
                  <span className="flex items-center gap-1"><Flag size={10} />{v.raceRound.roundName}</span>
                )}
                {v.raceRound?.raceDate && (
                  <span className="flex items-center gap-1"><Calendar size={10} />{formatDate(v.raceRound.raceDate)}</span>
                )}
              </div>
            </div>
            <SeverityDots level={v.severity ?? v.violationType?.severity ?? 0} />
          </div>

          {v.description && (
            <p className="text-[12px] text-gray-500 mb-3 leading-relaxed">{v.description}</p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {v.stewardAction && <StewardChip action={v.stewardAction} />}
            <ViolationStatusChip status={v.violationStatus} />
            {v.actualPenalty && (
              <span className="text-[10px] text-gray-600 bg-white/5 border border-border px-2 py-0.5 rounded">
                {v.actualPenalty}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────
function OverviewTab({ stats }: { stats: HorseProfileData["stats"] }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      <StatCell label="Races"    value={stats.totalRaces} />
      <StatCell label="Wins"     value={stats.wins} accent />
      <StatCell label="Podiums"  value={stats.podiums} />
      <StatCell label="Win Rate" value={`${stats.winRate}%`} />
      <StatCell label="Prize"    value={stats.totalPrize > 0 ? `${stats.totalPrize.toLocaleString()} ₫` : "—"} />
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
type Tab = "overview" | "history" | "violations";

export default function HorseProfile({ horseId, onClose }: HorseProfileProps) {
  const [data, setData] = useState<HorseProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  const load = useCallback(async () => {
    if (!horseId) return;
    try {
      setLoading(true);
      setError(null);
      setData(null);
      const res = await horseOwnerService.getHorseProfile(horseId);
      setData(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load horse profile.");
    } finally {
      setLoading(false);
    }
  }, [horseId]);

  useEffect(() => {
    if (!horseId) { setData(null); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horseId]);

  const reject = useRejectRegistration(() => { load(); });

  if (!horseId) return null;

  const ACTIVE_STATUSES = ["pending", "accepted", "verified"];
  const activeRegCount  = data
    ? data.raceHistory.filter(e => ACTIVE_STATUSES.includes(e.registration.registrationStatus) && !e.result).length
    : 0;

  const healthColor = !data ? "" :
    data.horse.healthStatus === "healthy"  ? "text-green-400 bg-green-500/10 border-green-600/40" :
    data.horse.healthStatus === "injured"  ? "text-red-400 bg-red-500/10 border-red-700/40" :
    "text-yellow-400 bg-yellow-500/10 border-yellow-600/40";

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl flex flex-col bg-bg rounded-2xl border border-border shadow-2xl font-sans"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Sticky header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <p className="text-[11px] font-bold tracking-[0.2em] text-gray-600 uppercase">Horse Profile</p>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-gray-500 hover:text-white hover:border-white/25 transition-all duration-150"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-3 text-gray-500">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-[13px]">Loading profile…</span>
              </div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-xl border border-red-700/30 bg-red-900/10 px-4 py-4 flex items-center justify-between gap-3">
              <span className="flex items-center gap-3 min-w-0">
                <AlertCircle size={15} className="text-red-500 shrink-0" />
                <p className="text-[13px] text-red-400">{error}</p>
              </span>
              <button
                type="button"
                onClick={load}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-700/40 text-[11.5px] font-medium text-red-300 hover:text-white hover:bg-red-900/30 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Content */}
          {!loading && data && (() => {
            const { horse, stats, raceHistory, violations } = data;
            const age = horse.dateOfBirth ? calcAge(horse.dateOfBirth) : null;

            return (
              <>
                {/* Hero */}
                <div className="bg-surface rounded-2xl border border-border p-5 flex items-center gap-5">
                  <div className="w-20 h-20 rounded-xl bg-bg border border-border flex items-center justify-center shrink-0">
                    <img
                      src={(horse as typeof horse & { img?: string }).img ?? "/jumping-horse-silhouette-facing-left-side-view.png"}
                      alt={horse.horseName}
                      onError={(e) => { e.currentTarget.src = "/jumping-horse-silhouette-facing-left-side-view.png"; }}
                      className="h-14 w-14 object-contain opacity-60"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[22px] font-bold text-white leading-tight font-serif">
                      {horse.horseName}
                    </h2>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {[horse.breed, horse.gender === "male" ? "Male" : "Female", age != null ? `${age}YO` : null]
                        .filter(Boolean).join(" · ")}
                    </p>
                    {activeRegCount > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Clock size={11} className="text-yellow-500" />
                        <span className="text-[11px] font-semibold text-yellow-500">
                          Registering for {activeRegCount} race{activeRegCount > 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize ${healthColor}`}>
                      {horse.healthStatus}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/12 text-gray-500 capitalize">
                      {horse.status}
                    </span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-xl w-fit">
                  {([
                    { id: "overview"   as Tab, label: "Overview",     count: 0 },
                    { id: "history"    as Tab, label: "Race History", count: raceHistory.length },
                    { id: "violations" as Tab, label: "Violations",   count: violations.length  },
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
                      <ChevronRight size={11} className="text-gray-600" />
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                {tab === "overview"   && <OverviewTab stats={stats} />}
                {tab === "history"    && <RaceHistoryTab history={raceHistory} onRequestReject={reject.requestReject} />}
                {tab === "violations" && <ViolationsTab violations={violations} />}

                {/* bottom padding */}
                <div className="h-2" />
              </>
            );
          })()}
        </div>
      </div>
    </div>
    <RejectRegistrationModal
      target={reject.target}
      pending={reject.pending}
      error={reject.error}
      onConfirm={reject.confirm}
      onCancel={reject.cancel}
    />
    </>
  );
}
