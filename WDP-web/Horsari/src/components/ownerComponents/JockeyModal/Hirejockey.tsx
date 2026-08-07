import { useState, useEffect } from "react";
import {
  X, Trophy, Flag, ChevronDown, Check,
  Loader2, AlertCircle, Shield, Repeat2,
  CheckCircle2, XCircle
} from "lucide-react";
import { horseOwnerService, type hireJockey } from "../../../api/horseOwnerService";
import { type Jockey } from "../../../components/ownerComponents/JockeyModal/Jockeydetailmodal";

// ── Types ─────────────────────────────────────────────────────────────────────
// Thêm vào Types section
type ToastState = {
  type: "success" | "error";
  message: string;
  detail?: string;
} | null;

interface Race {
  id: string;
  raceRoundId: string | null;
  name: string;
  date: string;
  venue: string;
  ruleId: string;
  raceType: string;
  eligibleHorseIds: string[];
  existingHorseId: string | null;
}

interface Horse {
  id: string;
  name: string;
  breed: string;
  gender: string;
  healthStatus: string;
  status: string;
  raceResults?: { finishPosition: number }[];
  dateOfBirth?: string;
}

interface EligibilityRule {
  raceType: string | null;
  minWins?: number | null;
  maxWins?: number | null;
  minAge?: number | null;
  maxAge?: number | null;
  requiredGender?: string | null;
  requiredBreed?: string | null;
}

interface RaceMetadata {
  eligibilityRules: EligibilityRule[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  return iso.split("T")[0];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRace(raw: any, i: number): Race {
  return {
    id: raw.registration._id ?? String(i),
    raceRoundId: raw.raceRound?._id ?? null,
    name: raw.raceRound?.roundName ?? raw.name ?? "Unnamed Race",
    date: raw.raceRound?.raceDate ? formatDate(raw.raceRound.raceDate) : raw.date ?? "TBA",
    venue: raw.raceRound?.location ?? raw.location ?? "TBA",
    ruleId: raw.raceRound?.eligibilityRuleId?._id ?? raw.eligibilityRuleId?._id ?? raw.raceRound?.eligibilityRuleId ?? raw.eligibilityRuleId ?? "",
    raceType: raw.raceRound?.eligibilityRuleId?.raceType ?? raw.eligibilityRuleId?.raceType ?? "",
    eligibleHorseIds: Array.isArray(raw.eligibleHorseIds) ? raw.eligibleHorseIds : [],
    existingHorseId: raw.existingHorseId ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapHorse(raw: any, i: number): Horse {
  return {
    id: raw._id ?? String(i),
    name: raw.horseName ?? raw.name ?? "Unnamed Horse",
    breed: raw.breed ?? "Unknown",
    gender: raw.gender ?? "N/A",
    healthStatus: raw.healthStatus ?? "N/A",
    status: raw.status ?? "inactive",
    raceResults: Array.isArray(raw.raceResults) ? raw.raceResults : [],
    dateOfBirth: raw.dateOfBirth ?? undefined,
  };
}

// ── Select option ─────────────────────────────────────────────────────────────
function SelectCard<T extends { id: string }>({
  selected,
  onSelect,
  children,
}: {
  item: T;
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border px-4 py-3 transition-all duration-150 ${selected
        ? "border-red-600/60 bg-error-bg"
        : "border-border bg-surface hover:border-white/18 hover:bg-surface-raised"
        }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">{children}</div>
        <div
          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all duration-150 ${selected ? "border-red-500 bg-red" : "border-white/20"
            }`}
        >
          {selected && <Check size={9} className="text-text" strokeWidth={3} />}
        </div>
      </div>
    </button>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepDot({ step, current, label }: { step: number; current: number; label: string }) {
  const done = current > step;
  const active = current === step;
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all duration-200 ${done ? "bg-red border-red-600 text-text"
          : active ? "bg-surface border-red-500 text-red"
            : "bg-surface border-border text-text-muted/70"
          }`}
      >
        {done ? <Check size={11} strokeWidth={3} /> : step}
      </div>
      <span className={`text-[9.5px] font-semibold tracking-widest uppercase ${active ? "text-red" : "text-text-muted/70"}`}>
        {label}
      </span>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function HireJockeyModal({
  jockey,
  onClose,
  onConfirm,
}: {
  jockey: Jockey;
  onClose: () => void;
  onConfirm?: (payload: hireJockey) => Promise<void> | void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Data
  const [races, setRaces] = useState<Race[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loadingRaces, setLoadingRaces] = useState(true);
  const [loadingHorses, setLoadingHorses] = useState(true);
  const [errorRaces, setErrorRaces] = useState<string | null>(null);
  const [errorHorses, setErrorHorses] = useState<string | null>(null);

  // Selections
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);
  const [position, setPosition] = useState(false);
  const [percentagePayout, setPercentagePayout] = useState<number>(10);
  const [bookingFees, setBookingFees] = useState<number>(jockey.bookingFee);

  const [toast, setToast] = useState<ToastState>(null);
  const [submitting, setSubmitting] = useState(false);

  // Eligibility metadata — wire up horseOwnerService.getRaceEligibilityMetadata() when ready
  const [metadata, setMetadata] = useState<RaceMetadata | null>(null);

  // Attendance history — surfaces a no-show warning; reuses the same profile
  // endpoint JockeyDetailModal uses, no dedicated stats endpoint needed.
  const [hasNoShowHistory, setHasNoShowHistory] = useState(false);

  // Whether the selected registration already has an active (pending/accepted)
  // main-jockey invitation — only one main jockey is allowed per registration,
  // so Step 2's "Main Racer" option gets grayed out when this is true.
  const [mainJockeyTaken, setMainJockeyTaken] = useState(false);
  const [checkingMainJockey, setCheckingMainJockey] = useState(false);

  // Whether THIS jockey already has any invitation (any status) on the
  // selected registration — the backend rejects re-inviting the same jockey
  // to the same registration outright, so block it here too instead of
  // letting the owner hit a 409 after filling out the whole form.
  const [alreadyInvited, setAlreadyInvited] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      try {
        const res = await horseOwnerService.getJockeyProfile(String(jockey.id));
        if (!cancelled && res?.data?.recentRaces) {
          setHasNoShowHistory(res.data.recentRaces.some((r) => r.attendance === "no_show"));
        }
      } catch {
        // Non-critical: no warning shown if history can't be loaded
      }
    }
    loadHistory();
    return () => { cancelled = true; };
  }, [jockey.id]);

  // Fetch the eligibility rule for the selected race
  useEffect(() => {
    setMetadata(null);
    const ruleId = selectedRace?.ruleId;
    if (!ruleId) return;

    let cancelled = false;
    async function loadMetadata() {
      try {
        const res = await horseOwnerService.getRaceEligibilityMetadata(ruleId!);
        if (!cancelled && res?.data) setMetadata(res.data as RaceMetadata);
      } catch {
        // Non-critical: eligibility rules simply won't be applied if unavailable
      }
    }
    loadMetadata();
    return () => { cancelled = true; };
  }, [selectedRace?.ruleId]);

  // Check whether this registration already has an active main-jockey invitation,
  // and whether this specific jockey already has any invitation on it at all.
  useEffect(() => {
    setMainJockeyTaken(false);
    setAlreadyInvited(false);
    const raceRoundId = selectedRace?.raceRoundId;
    const registrationId = selectedRace?.id;
    if (!raceRoundId || !registrationId) return;

    let cancelled = false;
    async function checkExistingInvitations() {
      try {
        setCheckingMainJockey(true);
        const res = await horseOwnerService.getRaceDetail(raceRoundId!);
        if (cancelled) return;
        const invitations = res?.data?.registration?.invitations ?? [];

        const taken = invitations.some(
          (inv) => !inv.isBackup && ["pending", "accepted"].includes(inv.invitationStatus)
        );
        setMainJockeyTaken(taken);
        // If the position previously chosen is now unavailable, fall back to Substitution.
        if (taken) setPosition(true);

        // Same jockey already invited (any status) — backend rejects this outright.
        setAlreadyInvited(invitations.some((inv) => inv.jockey?._id === String(jockey.id)));
      } catch {
        // Non-critical: if this fails, the backend's own invite-time validation
        // still catches these cases — this is a UX pre-check only.
      } finally {
        if (!cancelled) setCheckingMainJockey(false);
      }
    }
    checkExistingInvitations();
    return () => { cancelled = true; };
  }, [selectedRace?.raceRoundId, selectedRace?.id, jockey.id]);

  // Fetch races (accepted registrations only)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoadingRaces(true);
        const data = await horseOwnerService.getHorseOwnerInvitations();
        console.log('data: ', data)
        if (cancelled) return;

        const list: unknown[] = data?.data?.items ?? [];
        const accepted = list.filter((r: any) => {
          const registrationStatus = r?.registration?.registrationStatus ?? "";
          const roundStatus = (r?.raceRound?.status ?? "").toLowerCase();
          return ["accepted", "verified"].includes(registrationStatus)
            && !["completed", "cancelled"].includes(roundStatus);
        });
        setRaces(accepted.map((r: any, i) => mapRace(r, i)));
      } catch {
        if (!cancelled) setErrorRaces("Failed to load races.");
      } finally {
        if (!cancelled) setLoadingRaces(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Fetch horses
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoadingHorses(true);
        const data = await horseOwnerService.getUserHorse();
        if (cancelled) return;

        const list: unknown[] = data?.data?.items ?? [];
        setHorses(list.map((h: any, i) => mapHorse(h, i)));
      } catch {
        if (!cancelled) setErrorHorses("Failed to load horses.");
      } finally {
        if (!cancelled) setLoadingHorses(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  // ── Eligibility rules check ───────────────────────────────────────────────
  // Requires horseOwnerService.getRaceEligibilityMetadata() to populate `metadata`.
  // While metadata is null the check is skipped and eligibleHorseIds alone governs access.
  const checkEligibility = (horse: Horse, selectedRaceType: string): boolean => {
    const tag = `[eligibility] ${horse.name} / ${selectedRaceType}`;

    if (!metadata || !metadata.eligibilityRules) {
      console.warn(tag, "❌ no metadata or eligibilityRules");
      return false;
    }

    const rule = metadata.eligibilityRules.find((r) => r.raceType === selectedRaceType);
    if (!rule) {
      console.warn(tag, "❌ no rule found for raceType", selectedRaceType, "available:", metadata.eligibilityRules.map((r) => r.raceType));
      return false;
    }

    if (horse.status !== "active" || horse.healthStatus !== "healthy") {
      console.warn(tag, `❌ status=${horse.status} healthStatus=${horse.healthStatus}`);
      return false;
    }

    const wins = horse.raceResults
      ? horse.raceResults.filter((r) => r.finishPosition === 1).length
      : 0;

    if (rule.minWins !== undefined && rule.minWins !== null && wins < rule.minWins) {
      console.warn(tag, `❌ wins too low: has ${wins}, needs ≥ ${rule.minWins}`);
      return false;
    }
    if (rule.maxWins !== undefined && rule.maxWins !== null && wins > rule.maxWins) {
      console.warn(tag, `❌ wins too high: has ${wins}, needs ≤ ${rule.maxWins}`);
      return false;
    }

    const currentYear = new Date().getFullYear();
    const horseAge = horse.dateOfBirth
      ? currentYear - new Date(horse.dateOfBirth).getFullYear()
      : 0;

    if (rule.minAge !== undefined && rule.minAge !== null && horseAge < rule.minAge) {
      console.warn(tag, `❌ too young: age=${horseAge}, needs ≥ ${rule.minAge}`);
      return false;
    }
    if (rule.maxAge !== undefined && rule.maxAge !== null && horseAge > rule.maxAge) {
      console.warn(tag, `❌ too old: age=${horseAge}, needs ≤ ${rule.maxAge}`);
      return false;
    }

    if (rule.requiredGender && rule.requiredGender !== "both" && rule.requiredGender !== horse.gender) {
      console.warn(tag, `❌ gender mismatch: horse=${horse.gender}, required=${rule.requiredGender}`);
      return false;
    }

    console.log(tag, `✅ eligible (wins=${wins}, age=${horseAge})`);
    return true;
  };

  async function handleConfirm() {
    if (!selectedRace || !selectedHorse || alreadyInvited) return;
    setSubmitting(true);
    try {
      await onConfirm?.({
        jockeyId: String(jockey.id),
        registrationId: String(selectedRace.id),
        percentagePayout,
        horseId: String(selectedHorse.id),
        isBackup: position,
        bookingFees,
      });
      setToast({ type: "success", message: "Hire Successful" });
      setTimeout(() => {
        setToast(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      const detail =
        err?.code === 409 && (err?.message ?? "").includes("same horse")
          ? "This race already has a horse assigned. Please select the same horse."
          : err?.code === 409 && (err?.message ?? "").includes("already been invited")
            ? "This jockey has already been invited to this race."
            : err?.code === 422
              ? "This registration is no longer accepting jockey assignments."
              : err?.code === 403
                ? "You are not authorized to modify this registration."
                : err?.message ?? "Something went wrong. Please try again.";
      setToast({ type: "error", message: "Failed to Hire", detail });
    } finally {
      setSubmitting(false);
    }
  }

  const canNext =
    (step === 1 && !!selectedRace && !checkingMainJockey && !alreadyInvited) ||
    (step === 2 && true) || // position always has a default
    (step === 3 && !!selectedHorse);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 font-sans"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-bg border border-border rounded-2xl shadow-2xl shadow-black/90 flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-border shrink-0">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-surface border border-border shrink-0">
                {jockey.image
                  ? <img src={jockey.image} alt={jockey.name} className="w-full h-full object-cover object-top" />
                  : <div className="w-full h-full bg-[#222]" />
                }
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-text-muted/70 uppercase">Hiring</p>
                <h2 className="text-[18px] font-bold text-text leading-tight font-serif">
                  {jockey.name}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/5 border border-border flex items-center justify-center text-text-muted hover:text-text hover:bg-white/10 transition-all duration-150"
            >
              <X size={13} />
            </button>
          </div>

          {hasNoShowHistory && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg border border-red/40 bg-red/10">
              <AlertCircle size={13} className="text-red shrink-0" />
              <span className="text-[11.5px] text-red font-medium">Has a no-show on record</span>
            </div>
          )}

          {/* Step indicators */}
          <div className="flex items-center gap-0">
            <StepDot step={1} current={step} label="Race" />
            <div className={`flex-1 h-px mx-2 transition-colors duration-300 ${step > 1 ? "bg-red/50" : "bg-white/8"}`} />
            <StepDot step={2} current={step} label="Position" />
            <div className={`flex-1 h-px mx-2 transition-colors duration-300 ${step > 2 ? "bg-red/50" : "bg-white/8"}`} />
            <StepDot step={3} current={step} label="Horse" />
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* ── Step 1: Race ── */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-[11px] font-bold tracking-[0.18em] text-text-muted/70 uppercase mb-4">
                Select Race
              </p>
              {loadingRaces && (
                <div className="flex items-center gap-2 text-text-muted/70 text-[12px] py-4 justify-center">
                  <Loader2 size={13} className="animate-spin" /> Loading races…
                </div>
              )}
              {errorRaces && (
                <div className="flex items-center gap-2 text-red text-[12px] bg-error-bg border border-error-border rounded-xl px-4 py-3">
                  <AlertCircle size={13} /> {errorRaces}
                </div>
              )}
              {!loadingRaces && !errorRaces && races.length === 0 && (
                <div className="text-center py-8 text-text-muted/70 text-[12px]">
                  No accepted races available.
                </div>
              )}
              {races.map((race) => (
                <SelectCard
                  key={race.id}
                  item={race}
                  selected={selectedRace?.id === race.id}
                  onSelect={() => setSelectedRace(race)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy size={11} className="text-amber shrink-0" />
                    <span className="text-[13px] font-bold text-text truncate">{race.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-text-muted/70">
                    <span>{race.date}</span>
                    <span>·</span>
                    <span className="truncate">{race.venue}</span>
                  </div>
                </SelectCard>
              ))}

              {selectedRace && checkingMainJockey && (
                <div className="flex items-center gap-2 text-text-muted/70 text-[11px] px-1">
                  <Loader2 size={11} className="animate-spin" /> Checking existing invitations…
                </div>
              )}
              {selectedRace && !checkingMainJockey && alreadyInvited && (
                <div className="flex items-center gap-2 text-amber text-[12px] bg-amber/10 border border-yellow-700/30 rounded-xl px-4 py-3">
                  <AlertCircle size={13} className="shrink-0" />
                  {jockey.name} has already been invited to this race. Pick a different race or a different jockey.
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Position ── */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-[11px] font-bold tracking-[0.18em] text-text-muted/70 uppercase mb-4">
                Select Position
              </p>

              {checkingMainJockey && (
                <div className="flex items-center gap-2 text-text-muted/70 text-[11px] mb-1">
                  <Loader2 size={11} className="animate-spin" /> Checking existing invitations…
                </div>
              )}

              <div className="relative">
                <SelectCard
                  item={{ id: "main" }}
                  selected={position === false}
                  onSelect={() => { if (!mainJockeyTaken) setPosition(false); }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${mainJockeyTaken ? "bg-white/5 border border-white/10" : "bg-red-900/30 border border-error-border"}`}>
                      <Shield size={14} className={mainJockeyTaken ? "text-text-muted/70" : "text-red"} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`text-[13px] font-bold ${mainJockeyTaken ? "text-text-muted/70" : "text-text"}`}>Main Racer</p>
                        {mainJockeyTaken && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-900/20 border border-yellow-700/30 text-amber font-bold shrink-0 tracking-wide uppercase">
                            Already Invited
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] mt-0.5 ${mainJockeyTaken ? "text-text-muted/50" : "text-text-muted/70"}`}>
                        {mainJockeyTaken
                          ? "This race already has a main jockey invitation pending or accepted."
                          : "Primary rider — starts the race from the gate."}
                      </p>
                    </div>
                  </div>
                </SelectCard>
                {mainJockeyTaken && (
                  <div className="absolute inset-0 rounded-xl bg-black/40 cursor-not-allowed" />
                )}
              </div>

              <SelectCard
                item={{ id: "substitution" }}
                selected={position === true}
                onSelect={() => setPosition(true)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-900/30 border border-blue-700/30 flex items-center justify-center shrink-0">
                    <Repeat2 size={14} className="text-blue" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-text">Substitution</p>
                    <p className="text-[11px] text-text-muted/70 mt-0.5">
                      Reserve rider — steps in if the main racer is unavailable.
                    </p>
                  </div>
                </div>
              </SelectCard>

              <div className="mt-4">
                <p className="text-[11px] font-bold tracking-[0.18em] text-text-muted/70 uppercase mb-3">
                  Payout Percentage
                </p>
                <div className="flex items-center gap-3 bg-surface rounded-xl border border-border px-4 py-3">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={percentagePayout}
                    onChange={(e) => setPercentagePayout(Math.min(100, Math.max(1, Number(e.target.value))))}
                    className="flex-1 bg-transparent text-text text-[15px] font-bold focus:outline-none"
                  />
                  <span className="text-[13px] font-semibold text-text-muted">%</span>
                </div>
                <p className="text-[10.5px] text-text-muted/70 mt-1.5">
                  Share of prize money paid to the jockey.
                </p>
              </div>

              <div className="mt-4">
                <p className="text-[11px] font-bold tracking-[0.18em] text-text-muted/70 uppercase mb-3">
                  Booking Fee
                </p>
                <div className="flex items-center gap-3 bg-surface rounded-xl border border-border px-4 py-3">
                  <span className="text-[13px] font-semibold text-text-muted">₫</span>
                  <input
                    type="number"
                    min={jockey.bookingFee}
                    value={bookingFees}
                    onChange={(e) => setBookingFees(Math.max(jockey.bookingFee, Number(e.target.value)))}
                    className="flex-1 bg-transparent text-text text-[15px] font-bold focus:outline-none"
                  />
                </div>
                <p className="text-[10.5px] text-text-muted/70 mt-1.5">
                  Flat fee paid regardless of race outcome (unless a no-show). Default is {jockey.bookingFee.toLocaleString()} ₫ — you may offer more.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 3: Horse ── */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-[11px] font-bold tracking-[0.18em] text-text-muted/70 uppercase mb-4">
                Select Horse
              </p>
              {loadingHorses && (
                <div className="flex items-center gap-2 text-text-muted/70 text-[12px] py-4 justify-center">
                  <Loader2 size={13} className="animate-spin" /> Loading horses…
                </div>
              )}
              {errorHorses && (
                <div className="flex items-center gap-2 text-red text-[12px] bg-error-bg border border-error-border rounded-xl px-4 py-3">
                  <AlertCircle size={13} /> {errorHorses}
                </div>
              )}
              {!loadingHorses && !errorHorses && horses.length === 0 && (
                <div className="text-center py-8 text-text-muted/70 text-[12px]">
                  No horses found in your stable.
                </div>
              )}
              {horses.map((horse) => {
                const inEligibleList =
                  !selectedRace ||
                  selectedRace.eligibleHorseIds.length === 0 ||
                  selectedRace.eligibleHorseIds.includes(horse.id);
                // Apply eligibility rules when metadata is loaded; skip gracefully when null
                const meetsEligibilityRules =
                  !selectedRace ||
                  !selectedRace.raceType ||
                  !metadata ||
                  checkEligibility(horse, selectedRace.raceType);
                const isEligible = inEligibleList && meetsEligibilityRules;
                const isLockedOut = !!selectedRace?.existingHorseId && selectedRace.existingHorseId !== horse.id;
                const isLockedIn = !!selectedRace?.existingHorseId && selectedRace.existingHorseId === horse.id;
                const isSelectable = isEligible && !isLockedOut;

                return (
                  <div key={horse.id} className="relative">
                    <SelectCard
                      item={horse}
                      selected={selectedHorse?.id === horse.id}
                      onSelect={() => { if (isSelectable) setSelectedHorse(horse); }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Flag size={11} className={isSelectable ? "text-red shrink-0" : "text-text-muted/70 shrink-0"} />
                        <span className={`text-[13px] font-bold truncate ${isSelectable ? "text-text" : "text-text-muted/70"}`}>
                          {horse.name}
                        </span>
                        {isLockedIn && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-900/20 border border-green-700/30 text-green font-bold shrink-0 tracking-wide uppercase">
                            Assigned
                          </span>
                        )}
                        {isLockedOut && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-900/20 border border-error-border text-red font-bold shrink-0 tracking-wide uppercase">
                            Horse Locked
                          </span>
                        )}
                        {!isLockedOut && !isEligible && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-900/20 border border-yellow-700/30 text-amber font-bold shrink-0 tracking-wide uppercase">
                            Not Eligible
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-text-muted/70">
                        <span>{horse.breed}</span>
                        <span>·</span>
                        <span className="capitalize">{horse.gender}</span>
                        <span>·</span>
                        <span className={horse.healthStatus === "healthy" ? "text-green-500" : "text-amber"}>
                          {horse.healthStatus}
                        </span>
                      </div>
                    </SelectCard>

                    {/* Blocked overlay */}
                    {!isSelectable && (
                      <div className="absolute inset-0 rounded-xl bg-black/40 cursor-not-allowed" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary bar (steps 2+) */}
        {step > 1 && selectedRace && (
          <div className="px-6 py-3 border-t border-border/60 bg-[#0e0e0e] shrink-0">
            <div className="flex items-center gap-4 text-[11px] text-text-muted/70">
              <div className="flex items-center gap-1.5">
                <Trophy size={10} className="text-amber" />
                <span className="text-text-muted font-medium truncate max-w-[140px]">{selectedRace.name}</span>
              </div>
              {step > 2 && (
                <>
                  <span>·</span>
                  <div className="flex items-center gap-1.5">
                    {position === false
                      ? <Shield size={10} className="text-red" />
                      : <Repeat2 size={10} className="text-blue" />
                    }
                    <span className="text-text-muted font-medium capitalize">{position === false ? "Main Racer" : "Substitution"}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-bg shrink-0 flex gap-3">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="flex-1 py-2.5 rounded-lg border border-white/12 text-text-muted text-[13px] font-semibold hover:border-white/25 hover:text-text transition-all duration-150"
            >
              Back
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-white/12 text-text-muted text-[13px] font-semibold hover:border-white/25 hover:text-text transition-all duration-150"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              disabled={!canNext}
              className={`flex-1 py-2.5 rounded-lg text-[13px] font-bold transition-all duration-150 flex items-center justify-center gap-2 ${canNext
                ? "bg-red hover:bg-red/85 text-text shadow-lg shadow-red-900/30"
                : "bg-surface border border-border text-text-muted/70 cursor-not-allowed"
                }`}
            >
              Next <ChevronDown size={13} className="-rotate-90" />
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={!selectedHorse || submitting || alreadyInvited}
              className={`flex-1 py-2.5 rounded-lg text-[13px] font-bold transition-all duration-150 flex items-center justify-center gap-2 ${selectedHorse && !submitting && !alreadyInvited
                ? "bg-green-700 hover:bg-green-600 text-text shadow-lg shadow-green-900/30"
                : "bg-surface border border-border text-text-muted/70 cursor-not-allowed"
                }`}
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {submitting ? "Hiring…" : "Confirm Hire"}
            </button>
          )}
        </div>
        {/* Toast */}
        {toast && (
          <div className="absolute inset-0 flex items-center justify-center z-10 rounded-2xl bg-black/60 backdrop-blur-[2px]">
            <div className={`flex flex-col items-center gap-3 px-8 py-6 rounded-2xl border shadow-2xl
      ${toast.type === "success"
                ? "bg-[#0d1f0d] border-green/40"
                : "bg-[#1f0d0d] border-red/40"}`}
            >
              {toast.type === "success"
                ? <CheckCircle2 size={36} className="text-green" />
                : <XCircle size={36} className="text-red" />
              }
              <p className={`text-[16px] font-bold ${toast.type === "success" ? "text-green-300" : "text-red-300"}`}>
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