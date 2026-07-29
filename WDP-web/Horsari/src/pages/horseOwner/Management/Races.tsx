import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Plus, Loader2, AlertCircle, X, Trophy, ShieldAlert, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { type MyRace, type RaceStatus } from "../../../types/Racingtypes";
import { horseOwnerService, type RaceInvitationEntry } from "../../../api/horseOwnerService";
import { RefetchButton } from "../../../components/RefetchButton";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  return iso.split("T")[0];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToMyRace(raw: any, i: number): MyRace {
  const roundStatus = (raw?.raceRound?.status ?? "").toLowerCase();

  const statusMap: Record<string, RaceStatus> = {
    running: "LIVE",
    completed: "FINISHED",
    scheduled: "UPCOMING",
    prepared: "PREPARING",
    draft: "UPCOMING",
    cancelled: "FINISHED",
  };
  const status: RaceStatus = statusMap[roundStatus] ?? "UPCOMING";

  return {
    id: raw.registration?._id ?? raw.raceRound?._id ?? String(i),
    name: raw.raceRound?.roundName ?? "Unnamed Race",
    status,
    date: raw.raceRound?.raceDate ? formatDate(raw.raceRound.raceDate) : "TBA",
    venue: raw.raceRound?.location ?? "TBA",
    horse: raw.horse?.horseName ?? raw.horseName ?? "TBA",
    jockey: raw.jockey?.fullName ?? raw.jockeyName ?? "TBA",
    image: raw.raceRound?.coverImage ?? raw.image ?? "/track.png",
    raceRoundId: raw.raceRound?._id ?? null,
  };
}

// ── Status configs ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<RaceStatus, { label: string; dot: string; text: string; bg: string }> = {
  LIVE: { label: "LIVE", dot: "bg-red-400 animate-pulse", text: "text-red-400", bg: "bg-red-500/20 border-red-500/40" },
  UPCOMING: { label: "UPCOMING", dot: "bg-yellow-400", text: "text-yellow-300", bg: "bg-black/50 border-white/15" },
  FINISHED: { label: "FINISHED", dot: "bg-gray-500", text: "text-gray-400", bg: "bg-black/50 border-border" },
  PREPARING: { label: "PREPARING", dot: "bg-yellow-400", text: "text-yellow-300", bg: "bg-black/50 border-white/15" },
};

const REG_STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "PENDING", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-600/40" },
  approved: { label: "APPROVED", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-600/40" },
  verified: { label: "VERIFIED", color: "text-green-400", bg: "bg-green-500/10 border-green-600/40" },
  failed: { label: "FAILED", color: "text-red-400", bg: "bg-red-500/10 border-red-700/40" },
  rejected: { label: "CANCELLED", color: "text-gray-400", bg: "bg-gray-500/10 border-gray-600/40" },
  cancelled: { label: "CANCELLED", color: "text-gray-400", bg: "bg-gray-500/10 border-gray-600/40" },
};

const INV_STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "PENDING", color: "text-gray-400", bg: "bg-gray-500/10 border-gray-600/30" },
  accepted: { label: "ACCEPTED", color: "text-green-400", bg: "bg-green-500/10 border-green-600/40" },
  declined: { label: "DECLINED", color: "text-red-400", bg: "bg-red-500/10 border-red-700/40" },
  cancelled: { label: "CANCELLED", color: "text-gray-400", bg: "bg-gray-500/10 border-gray-600/30" },
  didNotAttend: { label: "NO-SHOW", color: "text-red-400", bg: "bg-red-500/10 border-red-700/40" },
};

function severityColor(s?: number) {
  if (!s) return "bg-gray-600";
  if (s <= 2) return "bg-yellow-500";
  if (s === 3) return "bg-orange-500";
  return "bg-red-500";
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ── Race Detail Modal ─────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RaceDetailModal({ raceRoundId, onClose }: { raceRoundId: string; onClose: () => void }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "entry" | "results">("overview");

  useEffect(() => {
    let cancelled = false;
    horseOwnerService.getRaceDetail(raceRoundId)
      .then((res) => {
        if (!cancelled) setDetail(res?.data ?? null);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.msg ?? "Failed to load race detail.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [raceRoundId]);

  const raceRound = detail?.raceRound;
  const reg = detail?.registration;
  const competition = detail?.competition;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[90vh] shadow-2xl shadow-black/60 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">Race Detail</p>
            <h2 className="text-[17px] font-bold text-white leading-tight font-serif">
              {raceRound?.roundName ?? "Loading…"}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 transition-colors ml-4 mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-5">
          {loading && (
            <div className="flex items-center gap-2 text-gray-600 text-[12px] py-8 justify-center">
              <Loader2 size={14} className="animate-spin" /> Loading…
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center gap-2 text-red-400 text-[12px]">
              <AlertCircle size={13} /> {error}
            </div>
          )}

          {!loading && !error && detail && (
            <>
              {/* Compact identity strip */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  {raceRound?.status && (() => {
                    const statusMap: Record<string, RaceStatus> = {
                      running: "LIVE", completed: "FINISHED", scheduled: "UPCOMING",
                      prepared: "PREPARING", draft: "UPCOMING", cancelled: "FINISHED",
                    };
                    const rs: RaceStatus = statusMap[raceRound.status] ?? "UPCOMING";
                    const cfg = STATUS_CFG[rs];
                    return (
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    );
                  })()}
                  {raceRound?.tournamentId?.tournamentName && (
                    <span className="text-[11px] text-gray-500">{raceRound.tournamentId.tournamentName}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Calendar size={11} className="shrink-0" />
                    {raceRound?.raceDate ? formatDate(raceRound.raceDate) : "TBA"}
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <MapPin size={11} className="shrink-0" />
                    {raceRound?.location ?? "TBA"}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-xl w-fit flex-wrap">
                {([
                  { id: "overview" as const, label: "Overview", count: competition?.competitors?.length ?? 0 },
                  { id: "entry" as const, label: "My Entry", count: reg?.invitations?.length ?? 0 },
                  { id: "results" as const, label: "Results", count: reg?.violations?.length ?? 0 },
                ]).map(({ id, label, count }) => (
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

              {/* Overview tab */}
              {tab === "overview" && (
                <div className="flex flex-col gap-5">
                  {/* Prize breakdown */}
                  {(raceRound?.firstPlacePrize || raceRound?.secondPlacePrize || raceRound?.thirdPlacePrize) ? (
                    <div className="flex items-center gap-3">
                      {raceRound?.firstPlacePrize > 0 && (
                        <div className="flex items-center gap-1 text-[11px]">
                          <Trophy size={10} className="text-yellow-400" />
                          <span className="text-yellow-400 font-semibold">{raceRound.firstPlacePrize.toLocaleString()} ₫</span>
                        </div>
                      )}
                      {raceRound?.secondPlacePrize > 0 && (
                        <span className="text-[11px] text-gray-500">{raceRound.secondPlacePrize.toLocaleString()} ₫</span>
                      )}
                      {raceRound?.thirdPlacePrize > 0 && (
                        <span className="text-[11px] text-gray-500">{raceRound.thirdPlacePrize.toLocaleString()} ₫</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-[12px] text-gray-600">No prize money set for this race.</p>
                  )}

                  {/* Competitors */}
                  {competition && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Competitors</p>
                        <span className="text-[11px] text-gray-500">
                          {competition.confirmedCount}/{competition.maxParticipants ?? "?"} · {competition.openSlots} open
                        </span>
                      </div>
                      {competition.competitors?.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {competition.competitors.map((c: any) => (
                            <div
                              key={c.registrationId}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-border bg-white/[0.02] text-[12px]"
                            >
                              <Users size={12} className="text-gray-600 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="text-white font-semibold truncate">{c.horseName ?? "Unnamed Horse"}</span>
                                {c.ownerName && <span className="text-gray-600"> · {c.ownerName}</span>}
                              </div>
                              {c.jockeyName && (
                                <span className="text-gray-500 text-[11px] shrink-0">{c.jockeyName}</span>
                              )}
                              {c.laneNumber != null && (
                                <span className="text-[10px] text-gray-600 bg-white/5 border border-border px-1.5 py-0.5 rounded-full shrink-0">
                                  Lane {c.laneNumber}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[12px] text-gray-600">No other confirmed entries yet.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* My Entry tab */}
              {tab === "entry" && (
                reg ? (
                  <div className="flex flex-col gap-4">
                    {/* Registration status */}
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Registration</p>
                      {(() => {
                        const cfg = REG_STATUS_CFG[reg.registrationStatus] ?? REG_STATUS_CFG.pending;
                        return (
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Horse card */}
                    {reg.horse && (
                      <div className="bg-bg rounded-xl border border-border p-3 flex items-center gap-3">
                        <img
                          src={reg.horse.img ?? "/jumping-horse-silhouette-facing-left-side-view.png"}
                          alt={reg.horse.horseName}
                          onError={(e) => { e.currentTarget.src = "/jumping-horse-silhouette-facing-left-side-view.png"; }}
                          className="w-12 h-12 rounded-lg object-contain shrink-0 opacity-70"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-bold text-red-400 truncate">{reg.horse.horseName}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {[reg.horse.breed, reg.horse.gender].filter(Boolean).join(" · ")}
                          </p>
                          <p className="text-[11px] text-gray-600 mt-0.5">
                            {reg.horse.healthStatus ?? "Unknown health"}
                            {reg.laneNumber != null ? ` · Lane ${reg.laneNumber}` : ""}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Jockey invitations */}
                    {reg.invitations?.length > 0 ? (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-2">Jockey Invitations</p>
                        <div className="flex flex-col gap-1.5">
                          {reg.invitations.map((inv: any) => {
                            const isSelected = reg.jockeyInRaceId && String(inv._id) === String(reg.jockeyInRaceId);
                            const invCfg = INV_STATUS_CFG[inv.invitationStatus] ?? INV_STATUS_CFG.pending;
                            return (
                              <div
                                key={inv._id}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-[12px] ${isSelected ? "border-yellow-600/40 bg-yellow-500/5" : "border-border bg-white/[0.02]"}`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-white font-semibold truncate">
                                      {inv.jockey?.fullName ?? "Unknown Jockey"}
                                    </span>
                                    {isSelected && (
                                      <span className="text-[9px] font-black uppercase tracking-wider text-yellow-400 bg-yellow-500/15 border border-yellow-600/30 px-1.5 py-0.5 rounded-full">
                                        In Race
                                      </span>
                                    )}
                                    {inv.isBackup && (
                                      <span className="text-[9px] font-bold uppercase text-gray-500 bg-white/5 border border-border px-1.5 py-0.5 rounded-full">
                                        Backup
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-gray-600">{inv.percentagePayout}% payout</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {inv.jockeyConfirmation && (
                                    <span className="text-green-400 text-[10px]">✓</span>
                                  )}
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg border ${invCfg.bg} ${invCfg.color}`}>
                                    {invCfg.label}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[12px] text-gray-600">No jockey invitations sent yet.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-[13px] text-gray-500 text-center py-4">You haven't registered for this race.</p>
                )
              )}

              {/* Results tab */}
              {tab === "results" && (
                reg ? (
                  <div className="flex flex-col gap-4">
                    {/* Race result */}
                    {reg.raceResult ? (
                      <div className="bg-bg rounded-xl border border-border p-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-2">Race Result</p>
                        {reg.raceResult.resultStatus === "cancelled" ? (
                          <div className="flex items-center gap-2 text-red-400 text-[13px] font-bold">
                            <ShieldAlert size={14} /> DISQUALIFIED
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-3">
                            {reg.raceResult.finishPosition != null && (
                              <div>
                                <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">Finish</p>
                                <p className="text-[18px] font-black text-white">{ordinal(reg.raceResult.finishPosition)}</p>
                              </div>
                            )}
                            {reg.raceResult.finishTime && (
                              <div>
                                <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">Time</p>
                                <p className="text-[13px] font-bold text-white font-mono">{reg.raceResult.finishTime}</p>
                              </div>
                            )}
                            {reg.raceResult.prizeMoney > 0 && (
                              <div>
                                <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">Prize</p>
                                <p className="text-[13px] font-bold text-yellow-400">{reg.raceResult.prizeMoney.toLocaleString()} ₫</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[13px] text-gray-500 text-center py-4">This race hasn't been run yet.</p>
                    )}

                    {/* Violations */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-2 flex items-center gap-1.5">
                        <ShieldAlert size={11} /> Violations ({reg.violations?.length ?? 0})
                      </p>
                      {reg.violations?.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {reg.violations.map((v: any) => {
                            const vtName = v.violationTypeId?.violationName ?? "Violation";
                            const severity = v.violationTypeId?.severity ?? v.severity;
                            const isOwnerReg = v.registrationId && String(v.registrationId) === String(reg._id);
                            return (
                              <div
                                key={v._id}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-[12px] ${isOwnerReg ? "border-red-800/50 bg-red-500/5" : "border-border bg-white/[0.02]"}`}
                              >
                                <span className={`w-2 h-2 rounded-full shrink-0 ${severityColor(severity)}`} />
                                <span className={`flex-1 ${isOwnerReg ? "text-red-400" : "text-gray-400"}`}>{vtName}</span>
                                <span className="text-[10px] text-gray-600 capitalize">{v.violationStatus}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[12px] text-gray-600">No violations logged.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] text-gray-500 text-center py-4">You haven't registered for this race.</p>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Race Card ─────────────────────────────────────────────────────────────────
function RaceCard({ race, onDetail, onLive }: { race: MyRace; onDetail: () => void; onLive: () => void }) {
  const cfg = STATUS_CFG[race.status];
  const isLive = race.status === "LIVE";
  const isFinished = race.status === "FINISHED";

  return (
    <div
      className={`bg-surface rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 hover:shadow-xl hover:shadow-black/50 ${isFinished ? "border-border/60 opacity-70" : "border-border hover:border-white/15"}`}
    >
      <div className="relative h-28 overflow-hidden bg-bg flex items-center justify-center">
        <img
          src={race.image}
          alt={race.name}
          className={`h-16 w-16 object-contain opacity-20 ${isFinished ? "grayscale" : ""}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />
        <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10.5px] font-bold backdrop-blur-sm ${cfg.bg} ${cfg.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </div>
      </div>

      <div className="px-4 pt-3 pb-4 flex flex-col gap-3 flex-1">
        <h3 className="text-[16px] font-bold text-white leading-tight font-serif">
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

        <div>
          <p className="text-[9.5px] font-semibold tracking-widest text-gray-600 uppercase mb-0.5">Horse</p>
          <p className="text-[12.5px] font-semibold text-red-400">{race.horse}</p>
        </div>

        {isLive ? (
          <button
            onClick={onLive}
            className="w-full py-2.5 rounded-lg text-[11.5px] font-bold tracking-widest uppercase transition-all duration-150 mt-auto bg-red-700 hover:bg-red-600 text-white shadow-lg shadow-red-900/40"
          >
            View Live Track
          </button>
        ) : (
          <button
            onClick={onDetail}
            className={`w-full py-2.5 rounded-lg text-[11.5px] font-bold tracking-widest uppercase transition-all duration-150 mt-auto ${isFinished
              ? "border border-border text-gray-500 hover:text-gray-300 hover:border-white/15"
              : "border border-white/15 text-gray-300 hover:border-white/30 hover:text-white"
              }`}
          >
            {isFinished ? "View Results" : "Manage Entry"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function RaceSkeleton() {
  return (
    <div className="bg-surface rounded-2xl border border-border/60 overflow-hidden flex flex-col animate-pulse">
      <div className="h-40 bg-white/5" />
      <div className="px-4 pt-3 pb-4 flex flex-col gap-3">
        <div className="h-4 w-3/4 bg-white/8 rounded" />
        <div className="space-y-1.5">
          <div className="h-3 w-1/2 bg-white/5 rounded" />
          <div className="h-3 w-2/3 bg-white/5 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-8 bg-white/5 rounded" />
          <div className="h-8 bg-white/5 rounded" />
        </div>
        <div className="h-9 bg-white/5 rounded-lg mt-auto" />
      </div>
    </div>
  );
}

// ── Register tile ─────────────────────────────────────────────────────────────
function RegisterTile({ onClick }: { onClick: () => void }) {
  return (
    <div onClick={onClick} className="bg-surface rounded-2xl border border-dashed border-white/15 flex flex-col items-center justify-center gap-3 min-h-[280px] cursor-pointer hover:border-red-700/50 hover:bg-red-950/10 transition-all duration-200 group">
      <div className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center group-hover:border-red-600/50 transition-colors duration-200">
        <Plus size={18} className="text-gray-600 group-hover:text-red-500 transition-colors duration-200" />
      </div>
      <p className="text-[13px] font-semibold text-gray-600 group-hover:text-gray-400 transition-colors duration-200">
        Register New Race
      </p>
    </div>
  );
}

// ── Filter config ─────────────────────────────────────────────────────────────
type FilterTab = "ALL" | "LIVE" | "UPCOMING" | "FINISHED";

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "LIVE", label: "Live" },
  { id: "UPCOMING", label: "Upcoming" },
  { id: "FINISHED", label: "Finished" },
];

const RACES_PAGE_SIZE = 12;

// ── Pagination bar ────────────────────────────────────────────────────────────
function PaginationBar({ page, totalPages, onPrev, onNext }: {
  page: number; totalPages: number; onPrev: () => void; onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <button onClick={onPrev} disabled={page === 1}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-[12px] text-gray-400 font-semibold disabled:opacity-30 hover:border-white/25 hover:text-white transition-all duration-150">
        <ChevronLeft size={13} /> Prev
      </button>
      <span className="text-[12px] text-gray-500 font-medium">Page {page} of {totalPages}</span>
      <button onClick={onNext} disabled={page === totalPages}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-[12px] text-gray-400 font-semibold disabled:opacity-30 hover:border-white/25 hover:text-white transition-all duration-150">
        Next <ChevronRight size={13} />
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RacesPage({ onNavigateToInvitations }: { onNavigateToInvitations: () => void }) {
  const navigate = useNavigate();
  const [races, setRaces] = useState<MyRace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRaceRoundId, setSelectedRaceRoundId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
  const [page, setPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const fetchRaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await horseOwnerService.getHorseOwnerInvitations();
      const list: RaceInvitationEntry[] = data?.data?.items ?? [];
      setRaces(list.map((r, i) => mapToMyRace(r, i)));
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Failed to load races.";
      setError(message);
    } finally {
      setLoading(false);
      setLastUpdated(Date.now());
    }
  }, []);

  useEffect(() => {
    fetchRaces();
  }, [fetchRaces]);

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [activeFilter]);

  const filteredRaces = activeFilter === "ALL"
    ? races
    : activeFilter === "UPCOMING"
      ? races.filter((r) => r.status === "UPCOMING" || r.status === "PREPARING")
      : races.filter((r) => r.status === activeFilter);

  // Count per tab for badges
  const counts: Record<FilterTab, number> = {
    ALL: races.length,
    LIVE: races.filter(r => r.status === "LIVE").length,
    UPCOMING: races.filter(r => r.status === "UPCOMING" || r.status === "PREPARING").length,
    FINISHED: races.filter(r => r.status === "FINISHED").length,
  };

  const totalPages = Math.max(1, Math.ceil(filteredRaces.length / RACES_PAGE_SIZE));
  const pagedRaces = filteredRaces.slice((page - 1) * RACES_PAGE_SIZE, page * RACES_PAGE_SIZE);

  return (
    <div className="flex-1 px-8 py-8 min-h-screen bg-bg flex flex-col font-sans">
      <header className="pb-5 flex flex-col gap-3 border-b border-border/60 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[22px] font-bold text-white tracking-tight leading-tight truncate font-serif">
              My Races
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[10px] font-semibold tracking-wide text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-border uppercase whitespace-nowrap">
                Race Management
              </span>
              <span className="text-[12px] text-gray-500 truncate">
                · {activeFilter === "ALL" ? "All Races" : activeFilter.charAt(0) + activeFilter.slice(1).toLowerCase()}
              </span>
            </div>
          </div>
          <RefetchButton onRefetch={fetchRaces} lastUpdated={lastUpdated} />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.id;
            const count = counts[tab.id];
            const isLiveTab = tab.id === "LIVE";
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={[
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold border transition-all duration-150",
                  isActive
                    ? isLiveTab
                      ? "bg-red-700/30 border-red-600/50 text-red-300"
                      : "bg-white/10 border-white/20 text-white"
                    : "bg-transparent border-border text-gray-500 hover:border-white/15 hover:text-gray-300",
                ].join(" ")}
              >
                {isLiveTab && isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                )}
                {tab.label}
                {count > 0 && (
                  <span className={[
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                    isActive
                      ? isLiveTab ? "bg-red-600/40 text-red-300" : "bg-white/15 text-white"
                      : "bg-white/5 text-gray-600",
                  ].join(" ")}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>
      <div className="flex-1 pt-5">

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-600 text-[12px] mb-2">
              <Loader2 size={13} className="animate-spin" /> Loading races…
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <RaceSkeleton key={i} />)}
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-center gap-2 text-red-400 text-[13px] bg-red-900/10 border border-red-700/30 rounded-xl px-5 py-4">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </div>
        )}

        {/* Empty filtered */}
        {!loading && !error && filteredRaces.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <p className="text-[14px] font-semibold text-gray-500">
              {activeFilter === "ALL" ? "No races found." : `No ${activeFilter.toLowerCase()} races.`}
            </p>
            {activeFilter !== "ALL" && (
              <button
                onClick={() => setActiveFilter("ALL")}
                className="text-[12px] text-gray-600 hover:text-gray-300 transition-colors underline underline-offset-2"
              >
                Show all races
              </button>
            )}
            {activeFilter === "ALL" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full mt-4">
                <RegisterTile onClick={onNavigateToInvitations} />
              </div>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && !error && filteredRaces.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {pagedRaces.map((race) => (
                <RaceCard
                  key={race.id}
                  race={race}
                  onDetail={() => race.raceRoundId && setSelectedRaceRoundId(race.raceRoundId)}
                  onLive={() => race.raceRoundId && navigate(`/owner/race-monitor/${race.raceRoundId}`)}
                />
              ))}
              {activeFilter === "ALL" && page === 1 && <RegisterTile onClick={onNavigateToInvitations} />}
            </div>
            <PaginationBar page={page} totalPages={totalPages} onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
          </>
        )}

        {/* Detail modal */}
        {selectedRaceRoundId && (
          <RaceDetailModal
            raceRoundId={selectedRaceRoundId}
            onClose={() => setSelectedRaceRoundId(null)}
          />
        )}
      </div>
    </div>
  );
}
