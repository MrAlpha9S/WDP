import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Loader2, AlertCircle, X, Trophy, Flag, ShieldAlert, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { type MyRace, type RaceStatus } from "../../../types/Racingtypes";
import { horseOwnerService, type RaceInvitationEntry, type OwnedHorseListItem } from "../../../api/horseOwnerService";
import { RefetchButton } from "../../../components/RefetchButton";
import ViewToggle, { type ViewMode } from "../../../components/ui/ViewToggle";

// Mirrors the backend's HorseOwnerService._checkHorseEligibility field-for-field
// (same shape as HomePage.tsx's BrowsableRace.eligibility check), applied here
// against a raceRound's populated eligibility rule (raceRound.RaceType from
// getRaceDetail) so this view-only "available horses" list matches exactly
// what the Hire Jockey flow would accept when actually assigning a horse.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isHorseEligible(horse: OwnedHorseListItem, rule: any): boolean {
  if (horse.status !== "active" || horse.healthStatus !== "healthy") return false;
  if (rule?.requiredBreed && horse.breed !== rule.requiredBreed) return false;
  if (rule?.requiredGender && horse.gender !== rule.requiredGender) return false;

  const currentYear = new Date().getFullYear();
  const horseAge = horse.dateOfBirth ? currentYear - new Date(horse.dateOfBirth).getFullYear() : 0;
  if (rule?.minAge != null && horseAge < rule.minAge) return false;
  if (rule?.maxAge != null && horseAge > rule.maxAge) return false;

  if (rule?.minRacesWon || rule?.minRacesRun) {
    const racesRun = horse.raceResults?.length ?? 0;
    const wins = horse.raceResults?.filter((r) => r.finishPosition === 1).length ?? 0;
    if (rule.minRacesRun && racesRun < rule.minRacesRun) return false;
    if (rule.minRacesWon && wins < rule.minRacesWon) return false;
  }

  return true;
}

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
  LIVE: { label: "LIVE", dot: "bg-red animate-pulse", text: "text-red", bg: "bg-red/20 border-red-500/40" },
  UPCOMING: { label: "UPCOMING", dot: "bg-yellow-400", text: "text-yellow-300", bg: "bg-black/50 border-white/15" },
  FINISHED: { label: "FINISHED", dot: "bg-gray-500", text: "text-text-muted", bg: "bg-black/50 border-border" },
  PREPARING: { label: "PREPARING", dot: "bg-yellow-400", text: "text-yellow-300", bg: "bg-black/50 border-white/15" },
};

const INV_STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "PENDING", color: "text-text-muted", bg: "bg-white/8 border-white/12" },
  accepted: { label: "ACCEPTED", color: "text-green", bg: "bg-green/10 border-green/40" },
  declined: { label: "DECLINED", color: "text-red", bg: "bg-red/10 border-red/40" },
  cancelled: { label: "CANCELLED", color: "text-text-muted", bg: "bg-white/8 border-white/12" },
  didNotAttend: { label: "NO-SHOW", color: "text-red", bg: "bg-red/10 border-red/40" },
};

function severityColor(s?: number) {
  if (!s) return "bg-gray-600";
  if (s <= 2) return "bg-yellow-500";
  if (s === 3) return "bg-orange-500";
  return "bg-red";
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

  // Read-only "which of my horses could fill this registration" list — shown
  // when the registration hasn't gotten a horse yet. Horse assignment itself
  // only happens through the Hire Jockey flow, not from here.
  const [ownedHorses, setOwnedHorses] = useState<OwnedHorseListItem[] | null>(null);
  const [horsesLoading, setHorsesLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await horseOwnerService.getRaceDetail(raceRoundId);
      setDetail(res?.data ?? null);
    } catch (err: any) {
      setError(err?.msg ?? "Failed to load race detail.");
    } finally {
      setLoading(false);
    }
  }, [raceRoundId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raceRoundId]);

  const raceRound = detail?.raceRound;
  const reg = detail?.registration;
  const competition = detail?.competition;
  const needsHorse = tab === "entry" && !!reg && !reg.horse;

  // Fetch the owner's stable only once it's actually needed — a registration
  // with a horse already assigned never needs this.
  useEffect(() => {
    if (!needsHorse || ownedHorses !== null) return;
    let cancelled = false;
    setHorsesLoading(true);
    horseOwnerService.getUserHorse(1, 100)
      .then((res) => { if (!cancelled) setOwnedHorses(res.data?.items ?? []); })
      .catch(() => { if (!cancelled) setOwnedHorses([]); })
      .finally(() => { if (!cancelled) setHorsesLoading(false); });
    return () => { cancelled = true; };
  }, [needsHorse, ownedHorses]);

  const eligibleHorses = ownedHorses
    ? ownedHorses.filter((h) => isHorseEligible(h, raceRound?.RaceType))
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl shadow-black/60 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-text-muted/70 mb-1">Race Detail</p>
            <h2 className="text-[17px] font-bold text-text leading-tight font-serif">
              {raceRound?.roundName ?? "Loading…"}
            </h2>
          </div>
          <button onClick={onClose} className="text-text-muted/70 hover:text-text-muted transition-colors ml-4 mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-5">
          {loading && (
            <div className="flex items-center gap-2 text-text-muted/70 text-[12px] py-8 justify-center">
              <Loader2 size={14} className="animate-spin" /> Loading…
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center gap-2 text-red text-[12px]">
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
                    <span className="text-[11px] text-text-muted">{raceRound.tournamentId.tournamentName}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <div className="flex items-center gap-1.5 text-text-muted">
                    <Calendar size={11} className="shrink-0" />
                    {raceRound?.raceDate ? formatDate(raceRound.raceDate) : "TBA"}
                  </div>
                  <div className="flex items-center gap-1.5 text-text-muted">
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
                        ? "bg-white/8 text-text border border-white/12"
                        : "text-text-muted hover:text-text-muted border border-transparent"
                    }`}
                  >
                    {label}
                    {count > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === id ? "bg-red text-text" : "bg-white/8 text-text-muted"}`}>
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
                          <Trophy size={10} className="text-amber" />
                          <span className="text-amber font-semibold">{raceRound.firstPlacePrize.toLocaleString()} ₫</span>
                        </div>
                      )}
                      {raceRound?.secondPlacePrize > 0 && (
                        <span className="text-[11px] text-text-muted">{raceRound.secondPlacePrize.toLocaleString()} ₫</span>
                      )}
                      {raceRound?.thirdPlacePrize > 0 && (
                        <span className="text-[11px] text-text-muted">{raceRound.thirdPlacePrize.toLocaleString()} ₫</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-[12px] text-text-muted/70">No prize money set for this race.</p>
                  )}

                  {/* Competitors */}
                  {competition && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/70">Competitors</p>
                        <span className="text-[11px] text-text-muted">
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
                              <Users size={12} className="text-text-muted/70 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="text-text font-semibold truncate">{c.horseName ?? "Unnamed Horse"}</span>
                                {c.ownerName && <span className="text-text-muted/70"> · {c.ownerName}</span>}
                              </div>
                              {c.jockeyName && (
                                <span className="text-text-muted text-[11px] shrink-0">{c.jockeyName}</span>
                              )}
                              {c.laneNumber != null && (
                                <span className="text-[10px] text-text-muted/70 bg-white/5 border border-border px-1.5 py-0.5 rounded-full shrink-0">
                                  Lane {c.laneNumber}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[12px] text-text-muted/70">No other confirmed entries yet.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* My Entry tab */}
              {tab === "entry" && (
                reg ? (
                  <div className="flex flex-col gap-4">
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
                          <p className="text-[14px] font-bold text-red truncate">{reg.horse.horseName}</p>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            {[reg.horse.breed, reg.horse.gender].filter(Boolean).join(" · ")}
                          </p>
                          <p className="text-[11px] text-text-muted/70 mt-0.5">
                            {reg.horse.healthStatus ?? "Unknown health"}
                            {reg.laneNumber != null ? ` · Lane ${reg.laneNumber}` : ""}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* No horse assigned yet — read-only "what could I assign" view.
                        Assignment itself happens from Hire Jockey, not here. */}
                    {!reg.horse && (
                      <div className="bg-bg rounded-xl border border-border p-3 flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-amber-400">
                          <AlertCircle size={14} className="shrink-0" />
                          <p className="text-[12.5px] font-semibold">No horse assigned yet</p>
                        </div>
                        <p className="text-[11px] text-text-muted -mt-1">
                          Invite a jockey for this registration to assign one of your horses — the first invitation sets the horse.
                        </p>

                        {horsesLoading && (
                          <div className="flex items-center gap-2 text-text-muted/70 text-[11px] py-1">
                            <Loader2 size={12} className="animate-spin" /> Checking your stable…
                          </div>
                        )}

                        {!horsesLoading && ownedHorses !== null && (
                          eligibleHorses.length > 0 ? (
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/70 mb-2">
                                Eligible Horses ({eligibleHorses.length})
                              </p>
                              <div className="flex flex-col gap-1.5">
                                {eligibleHorses.map((h) => (
                                  <div
                                    key={h._id}
                                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-border bg-white/[0.02] text-[12px]"
                                  >
                                    <Flag size={12} className="text-text-muted/70 shrink-0" />
                                    <span className="text-text font-semibold truncate flex-1">{h.horseName}</span>
                                    <span className="text-text-muted/70 text-[11px] shrink-0">{[h.breed, h.gender].filter(Boolean).join(" · ")}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-[12px] text-text-muted/70">None of your horses are currently eligible for this race.</p>
                          )
                        )}
                      </div>
                    )}

                    {/* Jockey invitations */}
                    {reg.invitations?.length > 0 ? (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/70 mb-2">Jockey Invitations</p>
                        <div className="flex flex-col gap-1.5">
                          {reg.invitations.map((inv: any) => {
                            const isSelected = reg.jockeyInRaceId && String(inv._id) === String(reg.jockeyInRaceId);
                            const invCfg = INV_STATUS_CFG[inv.invitationStatus] ?? INV_STATUS_CFG.pending;
                            return (
                              <div
                                key={inv._id}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-[12px] ${isSelected ? "border-amber/40 bg-yellow-500/5" : "border-border bg-white/[0.02]"}`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-text font-semibold truncate">
                                      {inv.jockey?.fullName ?? "Unknown Jockey"}
                                    </span>
                                    {isSelected && (
                                      <span className="text-[9px] font-black uppercase tracking-wider text-amber bg-yellow-500/15 border border-yellow-600/30 px-1.5 py-0.5 rounded-full">
                                        In Race
                                      </span>
                                    )}
                                    {inv.isBackup && (
                                      <span className="text-[9px] font-bold uppercase text-text-muted bg-white/5 border border-border px-1.5 py-0.5 rounded-full">
                                        Backup
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-text-muted/70">{inv.percentagePayout}% payout</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {inv.jockeyConfirmation && (
                                    <span className="text-green text-[10px]">✓</span>
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
                      <p className="text-[12px] text-text-muted/70">No jockey invitations sent yet.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-[13px] text-text-muted text-center py-4">You haven't registered for this race.</p>
                )
              )}

              {/* Results tab */}
              {tab === "results" && (
                reg ? (
                  <div className="flex flex-col gap-4">
                    {/* Race result */}
                    {reg.raceResult ? (
                      <div className="bg-bg rounded-xl border border-border p-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/70 mb-2">Race Result</p>
                        {reg.raceResult.resultStatus === "cancelled" ? (
                          <div className="flex items-center gap-2 text-red text-[13px] font-bold">
                            <ShieldAlert size={14} /> DISQUALIFIED
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-3">
                            {reg.raceResult.finishPosition != null && (
                              <div>
                                <p className="text-[9px] text-text-muted/70 uppercase tracking-wider mb-0.5">Finish</p>
                                <p className="text-[18px] font-black text-text">{ordinal(reg.raceResult.finishPosition)}</p>
                              </div>
                            )}
                            {reg.raceResult.finishTime && (
                              <div>
                                <p className="text-[9px] text-text-muted/70 uppercase tracking-wider mb-0.5">Time</p>
                                <p className="text-[13px] font-bold text-text font-mono">{reg.raceResult.finishTime}</p>
                              </div>
                            )}
                            {reg.raceResult.prizeMoney > 0 && (
                              <div>
                                <p className="text-[9px] text-text-muted/70 uppercase tracking-wider mb-0.5">Prize</p>
                                <p className="text-[13px] font-bold text-amber">{reg.raceResult.prizeMoney.toLocaleString()} ₫</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[13px] text-text-muted text-center py-4">This race hasn't been run yet.</p>
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
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-[12px] ${isOwnerReg ? "border-red-800/50 bg-red/5" : "border-border bg-white/[0.02]"}`}
                              >
                                <span className={`w-2 h-2 rounded-full shrink-0 ${severityColor(severity)}`} />
                                <span className={`flex-1 ${isOwnerReg ? "text-red" : "text-text-muted"}`}>{vtName}</span>
                                <span className="text-[10px] text-text-muted/70 capitalize">{v.violationStatus}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[12px] text-text-muted/70">No violations logged.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] text-text-muted text-center py-4">You haven't registered for this race.</p>
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
        <h3 className="text-[16px] font-bold text-text leading-tight font-serif">
          {race.name}
        </h3>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[12px] text-text-muted">
            <Calendar size={11} className="shrink-0" />
            {race.date}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-text-muted">
            <MapPin size={11} className="shrink-0" />
            {race.venue}
          </div>
        </div>

        <div>
          <p className="text-[9.5px] font-semibold tracking-widest text-text-muted/70 uppercase mb-0.5">Horse</p>
          <p className="text-[12.5px] font-semibold text-red">{race.horse}</p>
        </div>

        {isLive ? (
          <button
            onClick={onLive}
            className="w-full py-2.5 rounded-lg text-[11.5px] font-bold tracking-widest uppercase transition-all duration-150 mt-auto bg-red hover:bg-red/85 text-text shadow-lg shadow-red-900/40"
          >
            View Live Track
          </button>
        ) : (
          <button
            onClick={onDetail}
            className={`w-full py-2.5 rounded-lg text-[11.5px] font-bold tracking-widest uppercase transition-all duration-150 mt-auto ${isFinished
              ? "border border-border text-text-muted hover:text-text-muted hover:border-white/15"
              : "border border-white/15 text-text-muted hover:border-white/30 hover:text-text"
              }`}
          >
            {isFinished ? "View Results" : "Manage Entry"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Race Table ────────────────────────────────────────────────────────────────
function RaceTable({ races, onDetail, onLive }: { races: MyRace[]; onDetail: (race: MyRace) => void; onLive: (race: MyRace) => void }) {
  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface border-b border-border/60">
            <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase">Race Name</th>
            <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase">Status</th>
            <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase">Date</th>
            <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase">Venue</th>
            <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase">Horse</th>
            <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {races.map((race) => {
            const cfg = STATUS_CFG[race.status];
            const isLive = race.status === "LIVE";
            const isFinished = race.status === "FINISHED";
            return (
              <tr
                key={race.id}
                onClick={() => race.raceRoundId && onLive(race)}
                className="hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                <td className={`p-4 text-[13px] font-semibold ${isFinished ? "text-text-muted" : "text-text"}`}>{race.name}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10.5px] font-bold ${cfg.bg} ${cfg.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </td>
                <td className="p-4 text-[12.5px] text-text-muted">{race.date}</td>
                <td className="p-4 text-[12.5px] text-text-muted">{race.venue}</td>
                <td className="p-4 text-[12.5px] font-semibold text-red">{race.horse}</td>
                <td className="p-4 text-right">
                  {isLive ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); onLive(race); }}
                      className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold tracking-widest uppercase bg-red hover:bg-red/85 text-text transition-all duration-150"
                    >
                      View Live
                    </button>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDetail(race); }}
                      className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold tracking-widest uppercase border border-white/15 text-text-muted hover:border-white/30 hover:text-text transition-all duration-150"
                    >
                      {isFinished ? "View Results" : "Manage"}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function RaceSkeleton() {
  return (
    <div className="bg-surface rounded-2xl border border-border/60 overflow-hidden flex flex-col animate-pulse">
      <div className="h-28 bg-white/5" />
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
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-[12px] text-text-muted font-semibold disabled:opacity-30 hover:border-white/25 hover:text-text transition-all duration-150">
        <ChevronLeft size={13} /> Prev
      </button>
      <span className="text-[12px] text-text-muted font-medium">Page {page} of {totalPages}</span>
      <button onClick={onNext} disabled={page === totalPages}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-[12px] text-text-muted font-semibold disabled:opacity-30 hover:border-white/25 hover:text-text transition-all duration-150">
        Next <ChevronRight size={13} />
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RacesPage() {
  const navigate = useNavigate();
  const [races, setRaces] = useState<MyRace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRaceRoundId, setSelectedRaceRoundId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("card");
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
            <h1 className="text-[22px] font-bold text-text tracking-tight leading-tight truncate font-serif">
              My Races
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[10px] font-semibold tracking-wide text-text-muted bg-white/5 px-2 py-0.5 rounded border border-border uppercase whitespace-nowrap">
                Race Management
              </span>
              <span className="text-[12px] text-text-muted truncate">
                · {activeFilter === "ALL" ? "All Races" : activeFilter.charAt(0) + activeFilter.slice(1).toLowerCase()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ViewToggle value={viewMode} onChange={setViewMode} />
            <RefetchButton onRefetch={fetchRaces} lastUpdated={lastUpdated} />
          </div>
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
                      ? "bg-red/30 border-red-600/50 text-red-300"
                      : "bg-white/10 border-white/20 text-text"
                    : "bg-transparent border-border text-text-muted hover:border-white/15 hover:text-text-muted",
                ].join(" ")}
              >
                {isLiveTab && isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red animate-pulse" />
                )}
                {tab.label}
                {count > 0 && (
                  <span className={[
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                    isActive
                      ? isLiveTab ? "bg-red/40 text-red-300" : "bg-white/15 text-text"
                      : "bg-white/5 text-text-muted/70",
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
            <div className="flex items-center gap-2 text-text-muted/70 text-[12px] mb-2">
              <Loader2 size={13} className="animate-spin" /> Loading races…
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <RaceSkeleton key={i} />)}
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-center gap-2 text-red text-[13px] bg-error-bg border border-error-border rounded-xl px-5 py-4">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </div>
        )}

        {/* Empty filtered */}
        {!loading && !error && filteredRaces.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <p className="text-[14px] font-semibold text-text-muted">
              {activeFilter === "ALL" ? "No races found." : `No ${activeFilter.toLowerCase()} races.`}
            </p>
            {activeFilter !== "ALL" && (
              <button
                onClick={() => setActiveFilter("ALL")}
                className="text-[12px] text-text-muted/70 hover:text-text-muted transition-colors underline underline-offset-2"
              >
                Show all races
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && !error && filteredRaces.length > 0 && (
          <>
            {viewMode === "card" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {pagedRaces.map((race) => (
                  <RaceCard
                    key={race.id}
                    race={race}
                    onDetail={() => race.raceRoundId && setSelectedRaceRoundId(race.raceRoundId)}
                    onLive={() => race.raceRoundId && navigate(`/owner/race-monitor/${race.raceRoundId}`)}
                  />
                ))}
              </div>
            ) : (
              <RaceTable
                races={pagedRaces}
                onDetail={(race) => race.raceRoundId && setSelectedRaceRoundId(race.raceRoundId)}
                onLive={(race) => race.raceRoundId && navigate(`/owner/race-monitor/${race.raceRoundId}`)}
              />
            )}
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
