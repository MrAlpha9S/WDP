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
  name: string;
  date: string;
  venue: string;
  grade: string;
  eligibleHorseIds: string[];  // ← add this
}

interface Horse {
  id: string;
  name: string;
  breed: string;
  gender: string;
  healthStatus: string;
}

type Position = "main" | "substitution";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  return iso.split("T")[0];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRace(raw: any, i: number): Race {
  return {
    id: raw.registration._id ?? String(i),
    name: raw.raceRound.roundName ?? raw.name ?? "Unnamed Race",
    date: raw.raceRound.raceDate ? formatDate(raw.raceRound.raceDate) : raw.date ?? "TBA",
    venue: raw.raceRound.location ?? raw.location ?? "TBA",
    grade: raw.grade ?? "TBA",
    eligibleHorseIds: Array.isArray(raw.eligibleHorseIds) ? raw.eligibleHorseIds : [],  // ← add this
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
  };
}

// ── Select option ─────────────────────────────────────────────────────────────
function SelectCard<T extends { id: string }>({
  item,
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
        ? "border-red-600/60 bg-red-900/10"
        : "border-white/8 bg-[#141414] hover:border-white/18 hover:bg-[#1c1c1c]"
        }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">{children}</div>
        <div
          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all duration-150 ${selected ? "border-red-500 bg-red-600" : "border-white/20"
            }`}
        >
          {selected && <Check size={9} className="text-white" strokeWidth={3} />}
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
        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all duration-200 ${done ? "bg-red-700 border-red-600 text-white"
          : active ? "bg-[#1a1a1a] border-red-500 text-red-400"
            : "bg-[#141414] border-white/10 text-gray-600"
          }`}
      >
        {done ? <Check size={11} strokeWidth={3} /> : step}
      </div>
      <span className={`text-[9.5px] font-semibold tracking-widest uppercase ${active ? "text-red-400" : "text-gray-600"}`}>
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

  const [toast, setToast] = useState<ToastState>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch races (approved registrations only)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoadingRaces(true);
        const data = await horseOwnerService.getHorseOwnerInvitations();
        console.log('data: ', data)
        if (cancelled) return;

        const list: unknown[] = data?.data?.invitations ?? data?.data ?? (Array.isArray(data) ? data : []);
        const approved = list.filter((r: any) =>
          r?.registration?.registrationStatus === "approved"
        );
        setRaces(approved.map((r: any, i) => mapRace(r, i)));
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

        const list: unknown[] = data?.data?.horses ?? data?.data ?? (Array.isArray(data) ? data : []);
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

  async function handleConfirm() {
    if (!selectedRace || !selectedHorse) return;
    setSubmitting(true);
    try {
      await onConfirm?.({
        jockeyId: String(jockey.id),
        registrationId: String(selectedRace.id),
        percentagePayout: 0.1,
        horseId: String(selectedHorse.id),
        isBackup: position,
      });
      setToast({ type: "success", message: "Hire Successful" });
      setTimeout(() => {
        setToast(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      const detail =
        err?.response?.data?.message ??
        err?.message ??
        "Something went wrong. Please try again.";
      setToast({ type: "error", message: "Failed to Hire", detail });
    } finally {
      setSubmitting(false);
    }
  }

  const canNext =
    (step === 1 && !!selectedRace) ||
    (step === 2 && true) || // position always has a default
    (step === 3 && !!selectedHorse);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-2xl shadow-2xl shadow-black/90 flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-white/8 shrink-0">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#1a1a1a] border border-white/10 shrink-0">
                {jockey.image
                  ? <img src={jockey.image} alt={jockey.name} className="w-full h-full object-cover object-top" />
                  : <div className="w-full h-full bg-[#222]" />
                }
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-gray-600 uppercase">Hiring</p>
                <h2 className="text-[18px] font-bold text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {jockey.name}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all duration-150"
            >
              <X size={13} />
            </button>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-0">
            <StepDot step={1} current={step} label="Race" />
            <div className={`flex-1 h-px mx-2 transition-colors duration-300 ${step > 1 ? "bg-red-700/50" : "bg-white/8"}`} />
            <StepDot step={2} current={step} label="Position" />
            <div className={`flex-1 h-px mx-2 transition-colors duration-300 ${step > 2 ? "bg-red-700/50" : "bg-white/8"}`} />
            <StepDot step={3} current={step} label="Horse" />
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* ── Step 1: Race ── */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-[11px] font-bold tracking-[0.18em] text-gray-600 uppercase mb-4">
                Select Race
              </p>
              {loadingRaces && (
                <div className="flex items-center gap-2 text-gray-600 text-[12px] py-4 justify-center">
                  <Loader2 size={13} className="animate-spin" /> Loading races…
                </div>
              )}
              {errorRaces && (
                <div className="flex items-center gap-2 text-red-400 text-[12px] bg-red-900/10 border border-red-700/30 rounded-xl px-4 py-3">
                  <AlertCircle size={13} /> {errorRaces}
                </div>
              )}
              {!loadingRaces && !errorRaces && races.length === 0 && (
                <div className="text-center py-8 text-gray-600 text-[12px]">
                  No approved races available.
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
                    <Trophy size={11} className="text-yellow-500 shrink-0" />
                    <span className="text-[13px] font-bold text-white truncate">{race.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/8 text-gray-500 font-semibold shrink-0">
                      {race.grade}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-600">
                    <span>{race.date}</span>
                    <span>·</span>
                    <span className="truncate">{race.venue}</span>
                  </div>
                </SelectCard>
              ))}
            </div>
          )}

          {/* ── Step 2: Position ── */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-[11px] font-bold tracking-[0.18em] text-gray-600 uppercase mb-4">
                Select Position
              </p>

              <SelectCard
                item={{ id: "main" }}
                selected={position === false}
                onSelect={() => setPosition(false)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-900/30 border border-red-700/30 flex items-center justify-center shrink-0">
                    <Shield size={14} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-white">Main Racer</p>
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      Primary rider — starts the race from the gate.
                    </p>
                  </div>
                </div>
              </SelectCard>

              <SelectCard
                item={{ id: "substitution" }}
                selected={position === true}
                onSelect={() => setPosition(true)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-900/30 border border-blue-700/30 flex items-center justify-center shrink-0">
                    <Repeat2 size={14} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-white">Substitution</p>
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      Reserve rider — steps in if the main racer is unavailable.
                    </p>
                  </div>
                </div>
              </SelectCard>
            </div>
          )}

          {/* ── Step 3: Horse ── */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-[11px] font-bold tracking-[0.18em] text-gray-600 uppercase mb-4">
                Select Horse
              </p>
              {loadingHorses && (
                <div className="flex items-center gap-2 text-gray-600 text-[12px] py-4 justify-center">
                  <Loader2 size={13} className="animate-spin" /> Loading horses…
                </div>
              )}
              {errorHorses && (
                <div className="flex items-center gap-2 text-red-400 text-[12px] bg-red-900/10 border border-red-700/30 rounded-xl px-4 py-3">
                  <AlertCircle size={13} /> {errorHorses}
                </div>
              )}
              {!loadingHorses && !errorHorses && horses.length === 0 && (
                <div className="text-center py-8 text-gray-600 text-[12px]">
                  No horses found in your stable.
                </div>
              )}
              {horses.map((horse) => {
                const isEligible =
                  !selectedRace ||
                  selectedRace.eligibleHorseIds.length === 0 ||
                  selectedRace.eligibleHorseIds.includes(horse.id);

                return (
                  <div key={horse.id} className="relative">
                    <SelectCard
                      item={horse}
                      selected={selectedHorse?.id === horse.id}
                      onSelect={() => { if (isEligible) setSelectedHorse(horse); }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Flag size={11} className={isEligible ? "text-red-400 shrink-0" : "text-gray-600 shrink-0"} />
                        <span className={`text-[13px] font-bold truncate ${isEligible ? "text-white" : "text-gray-600"}`}>
                          {horse.name}
                        </span>
                        {!isEligible && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-900/20 border border-yellow-700/30 text-yellow-500 font-bold shrink-0 tracking-wide uppercase">
                            Not Eligible
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-600">
                        <span>{horse.breed}</span>
                        <span>·</span>
                        <span className="capitalize">{horse.gender}</span>
                        <span>·</span>
                        <span className={horse.healthStatus === "healthy" ? "text-green-500" : "text-yellow-500"}>
                          {horse.healthStatus}
                        </span>
                      </div>
                    </SelectCard>

                    {/* Ineligible overlay — blocks click visually */}
                    {!isEligible && (
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
          <div className="px-6 py-3 border-t border-white/6 bg-[#0e0e0e] shrink-0">
            <div className="flex items-center gap-4 text-[11px] text-gray-600">
              <div className="flex items-center gap-1.5">
                <Trophy size={10} className="text-yellow-500" />
                <span className="text-gray-400 font-medium truncate max-w-[140px]">{selectedRace.name}</span>
              </div>
              {step > 2 && (
                <>
                  <span>·</span>
                  <div className="flex items-center gap-1.5">
                    {position === false
                      ? <Shield size={10} className="text-red-400" />
                      : <Repeat2 size={10} className="text-blue-400" />
                    }
                    <span className="text-gray-400 font-medium capitalize">{position === false ? "Main Racer" : "Substitution"}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/8 bg-[#111] shrink-0 flex gap-3">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="flex-1 py-2.5 rounded-lg border border-white/12 text-gray-400 text-[13px] font-semibold hover:border-white/25 hover:text-white transition-all duration-150"
            >
              Back
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-white/12 text-gray-400 text-[13px] font-semibold hover:border-white/25 hover:text-white transition-all duration-150"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              disabled={!canNext}
              className={`flex-1 py-2.5 rounded-lg text-[13px] font-bold transition-all duration-150 flex items-center justify-center gap-2 ${canNext
                ? "bg-red-700 hover:bg-red-600 text-white shadow-lg shadow-red-900/30"
                : "bg-[#1a1a1a] border border-white/8 text-gray-600 cursor-not-allowed"
                }`}
            >
              Next <ChevronDown size={13} className="-rotate-90" />
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={!selectedHorse || submitting}
              className={`... ${selectedHorse && !submitting
                ? "bg-green-700 hover:bg-green-600 text-white shadow-lg shadow-green-900/30"
                : "bg-[#1a1a1a] border border-white/8 text-gray-600 cursor-not-allowed"
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
                ? "bg-[#0d1f0d] border-green-700/40"
                : "bg-[#1f0d0d] border-red-700/40"}`}
            >
              {toast.type === "success"
                ? <CheckCircle2 size={36} className="text-green-400" />
                : <XCircle size={36} className="text-red-400" />
              }
              <p className={`text-[16px] font-bold ${toast.type === "success" ? "text-green-300" : "text-red-300"}`}>
                {toast.message}
              </p>
              {toast.detail && (
                <p className="text-[12px] text-gray-500 text-center max-w-[220px] leading-relaxed">
                  {toast.detail}
                </p>
              )}
              {toast.type === "error" && (
                <button
                  onClick={() => setToast(null)}
                  className="mt-1 text-[11px] text-gray-500 hover:text-white underline underline-offset-2 transition-colors"
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