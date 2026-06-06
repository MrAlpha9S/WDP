import { useState, useEffect } from "react";
import {
  X, Trophy, Flag, ChevronDown, Check,
  Loader2, AlertCircle, Shield, Repeat2,
} from "lucide-react";
import { horseOwnerService } from "../../../api/horseOwnerService";
import { type Jockey } from "../../../components/ownerComponents/JockeyModal/Jockeydetailmodal";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Race {
  id: string;
  name: string;
  date: string;
  venue: string;
  grade: string;
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
    id:    raw._id                             ?? String(i),
    name:  raw.raceName  ?? raw.name           ?? "Unnamed Race",
    date:  raw.raceDate  ? formatDate(raw.raceDate) : raw.date ?? "TBA",
    venue: raw.venue     ?? raw.location       ?? "TBA",
    grade: raw.grade                           ?? "TBA",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapHorse(raw: any, i: number): Horse {
  return {
    id:           raw._id                           ?? String(i),
    name:         raw.horseName  ?? raw.name        ?? "Unnamed Horse",
    breed:        raw.breed                         ?? "Unknown",
    gender:       raw.gender                        ?? "N/A",
    healthStatus: raw.healthStatus                  ?? "N/A",
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
      className={`w-full text-left rounded-xl border px-4 py-3 transition-all duration-150 ${
        selected
          ? "border-red-600/60 bg-red-900/10"
          : "border-white/8 bg-[#141414] hover:border-white/18 hover:bg-[#1c1c1c]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">{children}</div>
        <div
          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all duration-150 ${
            selected ? "border-red-500 bg-red-600" : "border-white/20"
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
  const done   = current > step;
  const active = current === step;
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all duration-200 ${
          done    ? "bg-red-700 border-red-600 text-white"
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
  onConfirm?: (payload: { jockeyId: string | number; raceId: string; horseId: string; position: Position }) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Data
  const [races,        setRaces]        = useState<Race[]>([]);
  const [horses,       setHorses]       = useState<Horse[]>([]);
  const [loadingRaces, setLoadingRaces] = useState(true);
  const [loadingHorses,setLoadingHorses]= useState(true);
  const [errorRaces,   setErrorRaces]   = useState<string | null>(null);
  const [errorHorses,  setErrorHorses]  = useState<string | null>(null);

  // Selections
  const [selectedRace,  setSelectedRace]  = useState<Race | null>(null);
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);
  const [position,      setPosition]      = useState<Position>("main");

  // Fetch races (approved registrations only)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoadingRaces(true);
        const data = await horseOwnerService.getHorseOwnerInvitations();
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

  function handleConfirm() {
    if (!selectedRace || !selectedHorse) return;
    onConfirm?.({
      jockeyId: jockey.id,
      raceId:   selectedRace.id,
      horseId:  selectedHorse.id,
      position,
    });
    onClose();
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
                selected={position === "main"}
                onSelect={() => setPosition("main")}
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
                selected={position === "substitution"}
                onSelect={() => setPosition("substitution")}
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
              {horses.map((horse) => (
                <SelectCard
                  key={horse.id}
                  item={horse}
                  selected={selectedHorse?.id === horse.id}
                  onSelect={() => setSelectedHorse(horse)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Flag size={11} className="text-red-400 shrink-0" />
                    <span className="text-[13px] font-bold text-white truncate">{horse.name}</span>
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
              ))}
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
                    {position === "main"
                      ? <Shield size={10} className="text-red-400" />
                      : <Repeat2 size={10} className="text-blue-400" />
                    }
                    <span className="text-gray-400 font-medium capitalize">{position === "main" ? "Main Racer" : "Substitution"}</span>
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
              className={`flex-1 py-2.5 rounded-lg text-[13px] font-bold transition-all duration-150 flex items-center justify-center gap-2 ${
                canNext
                  ? "bg-red-700 hover:bg-red-600 text-white shadow-lg shadow-red-900/30"
                  : "bg-[#1a1a1a] border border-white/8 text-gray-600 cursor-not-allowed"
              }`}
            >
              Next <ChevronDown size={13} className="-rotate-90" />
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={!selectedHorse}
              className={`flex-1 py-2.5 rounded-lg text-[13px] font-bold transition-all duration-150 flex items-center justify-center gap-2 ${
                selectedHorse
                  ? "bg-green-700 hover:bg-green-600 text-white shadow-lg shadow-green-900/30"
                  : "bg-[#1a1a1a] border border-white/8 text-gray-600 cursor-not-allowed"
              }`}
            >
              <Check size={14} /> Confirm Hire
            </button>
          )}
        </div>
      </div>
    </div>
  );
}