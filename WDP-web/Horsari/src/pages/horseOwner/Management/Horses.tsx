import { useEffect, useState, useRef } from "react";
import { Search, ChevronDown, Plus, MoreVertical, ChevronLeft, ChevronRight, X, Loader2, ImagePlus } from "lucide-react";
import { horseOwnerService, type Horse } from "../../../api/horseOwnerService";
import HorseProfile from "./HorseProfile";
import { RefetchButton } from "../../../components/RefetchButton";
import { ErrorState } from "../../../components/ErrorState";
import ViewToggle, { type ViewMode } from "../../../components/ui/ViewToggle";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";

// ── Types ─────────────────────────────────────────────────────────────────────
// Mirrors the backend enums: Horse.status ('active'|'inactive'|'retired') and
// Horse.healthStatus ('healthy'|'injured'|'sick'). A non-healthy healthStatus
// takes priority over the lifecycle status for display purposes.
type HorseStatus = "active" | "inactive" | "retired" | "injured" | "sick";

interface HorseCard {
  id: string;
  name: string;
  age: number;
  color: string;
  sex: string;
  grade: string;
  status: HorseStatus;
  image: string;
  racingStatus: "active" | "inactive" | "retired";
  healthStatus: "healthy" | "injured" | "sick";
}

// ── Status metadata ───────────────────────────────────────────────────────────
const STATUS_META: Record<HorseStatus, { label: string; dot: string; text: string }> = {
  active: { label: "Active", dot: "bg-green", text: "text-green" },
  inactive: { label: "Inactive", dot: "bg-gray-400", text: "text-text-muted" },
  retired: { label: "Retired", dot: "bg-blue", text: "text-blue" },
  injured: { label: "Injured", dot: "bg-red", text: "text-red" },
  sick: { label: "Sick", dot: "bg-amber", text: "text-amber" },
};

// ── Mapper ────────────────────────────────────────────────────────────────────
function mapHorseToCard(h: Horse): HorseCard {
  const age = Math.floor(
    (Date.now() - new Date(h.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)
  );

  const mapStatus = (): HorseStatus => {
    if (h.healthStatus === "injured") return "injured";
    if (h.healthStatus === "sick") return "sick";
    if (h.status === "inactive") return "inactive";
    if (h.status === "retired") return "retired";
    return "active";
  };

  const status = mapStatus();

  return {
    id: h._id,
    name: h.horseName,
    age,
    color: h.breed,
    sex: h.gender === "male" ? "Colt" : "Filly",
    grade: "Listed",
    status,
    image: (h as Horse & { img?: string }).img ?? "/jumping-horse-silhouette-facing-left-side-view.png",
    racingStatus: (h.status as "active" | "inactive" | "retired") || "active",
    healthStatus: (h.healthStatus as "healthy" | "injured" | "sick") || "healthy",
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUSES: ("All Statuses" | HorseStatus)[] = [
  "All Statuses",
  "active",
  "inactive",
  "retired",
  "injured",
  "sick",
];


// ── Helpers ───────────────────────────────────────────────────────────────────
function statusDot(status: HorseStatus) {
  return STATUS_META[status].dot;
}

function statusLabel(status: HorseStatus) {
  return STATUS_META[status].text;
}

// ── Info grid cell ────────────────────────────────────────────────────────────
function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#1e1e1e] rounded-lg px-3 py-2.5 border border-border/60">
      <p className="text-[10px] font-semibold tracking-widest text-text-muted/70 uppercase mb-1">
        {label}
      </p>
      <p className="text-[13px] font-semibold text-text leading-snug">{value}</p>
    </div>
  );
}

// ── Horse card ────────────────────────────────────────────────────────────────
function HorseCardItem({
  horse,
  onViewProfile,
  onOpenUpdate,
}: {
  horse: HorseCard;
  onViewProfile: () => void;
  onOpenUpdate: () => void;
}) {
  const [isPlaceholder, setIsPlaceholder] = useState(
    horse.image === "/jumping-horse-silhouette-facing-left-side-view.png"
  );

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden flex flex-col group hover:border-white/15 transition-colors duration-200">
      <div className="relative h-28 overflow-hidden bg-bg flex items-center justify-center">
        <img
          src={horse.image}
          alt={horse.name}
          onError={(e) => {
            e.currentTarget.src = "/jumping-horse-silhouette-facing-left-side-view.png";
            setIsPlaceholder(true);
          }}
          className={
            isPlaceholder
              ? "h-16 w-16 object-contain opacity-20 group-hover:opacity-30 transition-opacity duration-500"
              : "absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-65 transition-opacity duration-500"
          }
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/30 to-transparent" />
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-border">
          <span className={`w-1.5 h-1.5 rounded-full ${statusDot(horse.status)}`} />
          <span className={`text-[11px] font-semibold tracking-wide ${statusLabel(horse.status)}`}>
            {STATUS_META[horse.status].label.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="px-4 pt-3 pb-4 flex flex-col gap-3 flex-1">
        <div>
          <h3
            className="text-[16px] font-bold text-text leading-tight font-serif"
          >
            {horse.name}
          </h3>
          <p className="text-[11px] font-semibold tracking-widest text-text-muted/70 uppercase mt-0.5">
            {horse.age}YO {horse.color} {horse.sex} · {horse.grade}
          </p>
        </div>

        {horse.status !== "active" && (
          <div className="grid grid-cols-2 gap-2">
            <InfoCell label="Racing" value={capitalize(horse.racingStatus)} />
            <InfoCell label="Health" value={capitalize(horse.healthStatus)} />
          </div>
        )}

        <div className="flex items-center gap-2 mt-auto">
          <button
            onClick={onViewProfile}
            className="flex-1 py-2.5 rounded-lg border border-red/50 text-red text-[12.5px] font-semibold hover:bg-red/10 hover:border-red/80 transition-all duration-150 tracking-wide"
          >
            VIEW PROFILE
          </button>
          <button
            onClick={onOpenUpdate}
            className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-text-muted hover:border-white/25 transition-all duration-150 shrink-0"
          >
            <MoreVertical size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Horse Table ───────────────────────────────────────────────────────────────
function HorseTable({ horses, onViewProfile, onOpenUpdate }: {
  horses: HorseCard[];
  onViewProfile: (id: string) => void;
  onOpenUpdate: (id: string) => void;
}) {
  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface border-b border-border/60">
            <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase">Name</th>
            <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase">Age / Breed / Sex</th>
            <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase">Grade</th>
            <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase">Status</th>
            <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {horses.map((horse) => (
            <tr key={horse.id} className="hover:bg-white/[0.02] transition-colors">
              <td className="p-4 text-[13px] font-semibold text-text">{horse.name}</td>
              <td className="p-4 text-[12.5px] text-text-muted">{horse.age}YO {horse.color} {horse.sex}</td>
              <td className="p-4 text-[12.5px] text-text-muted">{horse.grade}</td>
              <td className="p-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-black/40 text-[10.5px] font-semibold tracking-wide">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot(horse.status)}`} />
                  <span className={statusLabel(horse.status)}>{horse.status.toUpperCase()}</span>
                </span>
              </td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onViewProfile(horse.id)}
                    className="px-3.5 py-1.5 rounded-lg border border-red/50 text-red text-[11px] font-semibold hover:bg-red/10 hover:border-red/80 transition-all duration-150"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => onOpenUpdate(horse.id)}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-text-muted hover:border-white/25 transition-all duration-150"
                  >
                    <MoreVertical size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Edit horse modal ──────────────────────────────────────────────────────────
interface EditHorseForm {
  horseName: string;
  breed: string;
  gender: "male" | "female" | "";
  dateOfBirth: string;
  status: 'active' | 'inactive' | 'retired';
  healthStatus: 'healthy' | 'injured' | 'sick';
}

function EditHorseModal({
  horse,
  onClose,
  onSaved,
}: {
  horse: Horse;
  onClose: () => void;
  onSaved: () => void;
}) {
  const currentImg = (horse as Horse & { img?: string }).img ?? null;

  const [form, setForm] = useState<EditHorseForm>({
    horseName: horse.horseName,
    breed: horse.breed,
    gender: (horse.gender as "male" | "female") || "",
    dateOfBirth: horse.dateOfBirth ? horse.dateOfBirth.split('T')[0] : "",
    status: (horse.status as 'active' | 'inactive' | 'retired') || 'active',
    healthStatus: (horse.healthStatus as 'healthy' | 'injured' | 'sick') || 'healthy',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleField<K extends keyof EditHorseForm>(key: K, val: EditHorseForm[K]) {
    setForm(f => ({ ...f, [key]: val }));
    setError(null);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.horseName.trim()) { setError("Horse name is required."); return; }
    if (!form.breed.trim()) { setError("Breed is required."); return; }
    if (!form.gender) { setError("Please select a gender."); return; }

    setSubmitting(true);
    setError(null);
    try {
      const updates: Promise<unknown>[] = [
        horseOwnerService.updateHorse(horse._id, {
          horseName: form.horseName.trim(),
          breed: form.breed.trim(),
          gender: form.gender as "male" | "female",
          ...(form.dateOfBirth && { dateOfBirth: form.dateOfBirth }),
        }),
      ];
      if (form.status !== horse.status)
        updates.push(horseOwnerService.updateHorseStatus(horse._id, form.status));
      if (form.healthStatus !== horse.healthStatus)
        updates.push(horseOwnerService.updateHorseHealthStatus(horse._id, form.healthStatus));
      if (imageFile)
        updates.push(horseOwnerService.uploadHorseImage(horse._id, imageFile));
      await Promise.all(updates);
      onSaved();
    } catch (err: unknown) {
      const msg = (err as { msg?: string })?.msg ?? (err instanceof Error ? err.message : "Failed to update horse.");
      setError(msg);
      setSubmitting(false);
    }
  }

  const inputCls = "w-full bg-[#1e1e1e] border border-border rounded-lg px-4 py-2.5 text-[13px] text-text placeholder-text-muted focus:outline-none focus:border-white/30 transition-colors duration-150";
  const labelCls = "block text-[10.5px] font-bold tracking-widest text-text-muted uppercase mb-1.5";
  const idle = "text-text-muted/70 border-border bg-transparent hover:border-white/20 hover:text-text-muted";

  const statusOptions: { label: string; value: 'active' | 'inactive' | 'retired'; active: string }[] = [
    { label: "Active", value: "active", active: "text-green border-green/50 bg-green/10" },
    { label: "Inactive", value: "inactive", active: "text-text-muted border-gray-500/50 bg-gray-500/10" },
    { label: "Retired", value: "retired", active: "text-blue border-blue/50 bg-blue/10" },
  ];

  const healthOptions: { label: string; value: 'healthy' | 'injured' | 'sick'; active: string }[] = [
    { label: "Healthy", value: "healthy", active: "text-green border-green/50 bg-green/10" },
    { label: "Injured", value: "injured", active: "text-red border-red/50 bg-red/10" },
    { label: "Sick", value: "sick", active: "text-amber border-amber/50 bg-amber/10" },
  ];

  const displayImg = imagePreview ?? currentImg;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-bg rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <p className="text-[11px] font-bold tracking-[0.2em] text-text-muted/70 uppercase">Edit Horse</p>
            <h2 className="text-[17px] font-bold text-text mt-0.5 font-serif">
              {horse.horseName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text hover:border-white/25 transition-all duration-150"
          >
            <X size={14} />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5 overflow-y-auto">

          {/* Photo */}
          <div>
            <p className={labelCls}>Photo</p>
            <div
              onClick={() => fileRef.current?.click()}
              className="w-full h-28 rounded-xl border-2 border-dashed border-white/12 bg-surface flex items-center justify-center gap-3 cursor-pointer hover:border-white/25 transition-colors duration-150 group overflow-hidden relative"
            >
              {displayImg && (
                <img
                  src={displayImg}
                  alt="preview"
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-opacity"
                />
              )}
              <div className={`relative z-10 flex items-center gap-2 ${displayImg ? "bg-black/50 px-3 py-1.5 rounded-full" : ""}`}>
                <ImagePlus size={16} className={displayImg ? "text-text-muted" : "text-text-muted/70 group-hover:text-text-muted transition-colors"} />
                <p className={`text-[12px] ${displayImg ? "text-text" : "text-text-muted/70 group-hover:text-text-muted transition-colors"}`}>
                  {displayImg ? "Change photo" : "Upload photo (optional)"}
                </p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>
          </div>

          {/* Basic info */}
          <div>
            <label className={labelCls}>Horse Name *</label>
            <input
              type="text"
              value={form.horseName}
              onChange={e => handleField("horseName", e.target.value)}
              placeholder="e.g. Thunder Bolt"
              maxLength={60}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Breed *</label>
            <div className="relative">
              <select
                value={form.breed}
                onChange={e => handleField("breed", e.target.value)}
                className={`${inputCls} appearance-none pr-8 cursor-pointer`}
              >
                <option value="">Select breed…</option>
                {BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Gender *</label>
              <div className="relative">
                <select
                  value={form.gender}
                  onChange={e => handleField("gender", e.target.value as "male" | "female" | "")}
                  className={`${inputCls} appearance-none pr-8 cursor-pointer`}
                >
                  <option value="">Select…</option>
                  <option value="male">Male (Colt)</option>
                  <option value="female">Female (Filly)</option>
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Date of Birth</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={e => handleField("dateOfBirth", e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className={`${inputCls} cursor-pointer [color-scheme:dark]`}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <p className={labelCls}>Racing Status</p>
            <div className="grid grid-cols-3 gap-2">
              {statusOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleField("status", opt.value)}
                  className={`py-2.5 rounded-lg border text-[12px] font-semibold transition-all duration-150 ${form.status === opt.value ? opt.active : idle}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className={labelCls}>Health Status</p>
            <div className="grid grid-cols-3 gap-2">
              {healthOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleField("healthStatus", opt.value)}
                  className={`py-2.5 rounded-lg border text-[12px] font-semibold transition-all duration-150 ${form.healthStatus === opt.value ? opt.active : idle}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-[12px] text-red bg-error-bg border border-error-border rounded-lg px-3 py-2.5">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-[12.5px] font-semibold text-text-muted hover:text-text hover:border-white/25 transition-all duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg bg-red hover:bg-red/85 disabled:bg-red/30 disabled:text-red/60 text-text text-[12.5px] font-bold tracking-wide transition-all duration-150 flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Register horse modal ──────────────────────────────────────────────────────
const BREEDS = ["Thoroughbred", "Arabian", "Quarter Horse", "Standardbred", "Warmblood", "Other"];

interface RegisterForm {
  horseName: string;
  breed: string;
  gender: "male" | "female" | "";
  dateOfBirth: string;
}

function RegisterHorseModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<RegisterForm>({ horseName: "", breed: "", gender: "", dateOfBirth: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleField(key: keyof RegisterForm, val: string) {
    setForm(f => ({ ...f, [key]: val }));
    setError(null);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) setImagePreview(URL.createObjectURL(file));
    else setImagePreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.horseName.trim()) { setError("Horse name is required."); return; }
    if (!form.breed.trim()) { setError("Breed is required."); return; }
    if (!form.gender) { setError("Please select a gender."); return; }
    if (!form.dateOfBirth) { setError("Date of birth is required."); return; }

    setSubmitting(true);
    setError(null);
    try {
      const res = await horseOwnerService.createHorse({
        horseName: form.horseName.trim(),
        breed: form.breed.trim(),
        gender: form.gender as "male" | "female",
        dateOfBirth: form.dateOfBirth,
        healthStatus: "healthy",
        status: "active",
        registrationDate: new Date().toISOString(),
      } as Omit<Horse, "_id" | "ownerId" | "createdAt" | "updatedAt" | "__v">);

      const newId: string = res.data._id;
      if (newId && imageFile) {
        await horseOwnerService.uploadHorseImage(newId, imageFile);
      }
      onCreated();
    } catch (err: unknown) {
      const msg = (err as { msg?: string })?.msg ?? (err instanceof Error ? err.message : "Failed to register horse.");
      setError(msg);
      setSubmitting(false);
    }
  }

  const inputCls = "w-full bg-[#1e1e1e] border border-border rounded-lg px-4 py-2.5 text-[13px] text-text placeholder-text-muted focus:outline-none focus:border-white/30 transition-colors duration-150";
  const labelCls = "block text-[10.5px] font-bold tracking-widest text-text-muted uppercase mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-bg rounded-2xl border border-border shadow-2xl overflow-hidden font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <p className="text-[11px] font-bold tracking-[0.2em] text-text-muted/70 uppercase">New Registration</p>
            <h2 className="text-[17px] font-bold text-text mt-0.5 font-serif">
              Register a Horse
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text hover:border-white/25 transition-all duration-150"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Image upload */}
          <div
            onClick={() => fileRef.current?.click()}
            className="w-full h-28 rounded-xl border-2 border-dashed border-white/12 bg-surface flex items-center justify-center gap-3 cursor-pointer hover:border-white/25 transition-colors duration-150 group"
          >
            {imagePreview ? (
              <img src={imagePreview} className="h-20 object-contain rounded-lg" alt="preview" />
            ) : (
              <>
                <ImagePlus size={20} className="text-text-muted/70 group-hover:text-text-muted transition-colors" />
                <p className="text-[12px] text-text-muted/70 group-hover:text-text-muted transition-colors">
                  Upload photo <span className="text-text-muted/50">(optional)</span>
                </p>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          {/* Horse name */}
          <div>
            <label className={labelCls}>Horse Name *</label>
            <input
              type="text"
              placeholder="e.g. Thunder Bolt"
              value={form.horseName}
              onChange={e => handleField("horseName", e.target.value)}
              className={inputCls}
              maxLength={60}
            />
          </div>

          {/* Breed */}
          <div>
            <label className={labelCls}>Breed *</label>
            <div className="relative">
              <select
                value={form.breed}
                onChange={e => handleField("breed", e.target.value)}
                className={`${inputCls} appearance-none pr-8 cursor-pointer`}
              >
                <option value="">Select breed…</option>
                {BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
          </div>

          {/* Gender + DOB row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Gender *</label>
              <div className="relative">
                <select
                  value={form.gender}
                  onChange={e => handleField("gender", e.target.value)}
                  className={`${inputCls} appearance-none pr-8 cursor-pointer`}
                >
                  <option value="">Select…</option>
                  <option value="male">Male (Colt)</option>
                  <option value="female">Female (Filly)</option>
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Date of Birth *</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={e => handleField("dateOfBirth", e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className={`${inputCls} cursor-pointer [color-scheme:dark]`}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-[12px] text-red bg-error-bg border border-error-border rounded-lg px-3 py-2.5">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-[12.5px] font-semibold text-text-muted hover:text-text hover:border-white/25 transition-all duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg bg-red hover:bg-red/85 disabled:bg-red/30 disabled:text-red/60 text-text text-[12.5px] font-bold tracking-wide transition-all duration-150 flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 size={13} className="animate-spin" /> Registering…</> : "Register Horse"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const PAGE_LIMIT = 9;

// ── Pagination bar ────────────────────────────────────────────────────────────
function PaginationBar({ page, totalPages, onPrev, onNext }: {
  page: number; totalPages: number; onPrev: () => void; onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <button
        onClick={onPrev}
        disabled={page === 1}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-[12px] text-text-muted font-semibold disabled:opacity-30 hover:border-white/25 hover:text-text transition-all duration-150"
      >
        <ChevronLeft size={13} /> Prev
      </button>
      <span className="text-[12px] text-text-muted font-medium">Page {page} of {totalPages}</span>
      <button
        onClick={onNext}
        disabled={page === totalPages}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-[12px] text-text-muted font-semibold disabled:opacity-30 hover:border-white/25 hover:text-text transition-all duration-150"
      >
        Next <ChevronRight size={13} />
      </button>
    </div>
  );
}

// ── Horses page ───────────────────────────────────────────────────────────────
export default function HorsesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All Statuses" | HorseStatus>("All Statuses");
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [userHorse, setUserHorse] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [profileHorseId, setProfileHorseId] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [editTarget, setEditTarget] = useState<Horse | null>(null);
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search → reset to page 1
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    async function fetchHorses() {
      try {
        setLoading(true);
        setError(null);
        const data = await horseOwnerService.getUserHorse(page, PAGE_LIMIT, debouncedSearch || undefined);
        if (cancelled) return;
        setUserHorse(data.data?.items ?? []);
        setTotalPages(data.data?.pagination?.totalPages ?? 1);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = (err as { msg?: string })?.msg ?? (err instanceof Error ? err.message : "Failed to load horses.");
        setError(msg);
      } finally {
        if (!cancelled) { setLoading(false); setLastUpdated(Date.now()); }
      }
    }
    fetchHorses();
    return () => { cancelled = true; };
  }, [page, debouncedSearch, refreshSeed]);

  function handleOpenEdit(horseId: string) {
    const raw = userHorse.find(h => h._id === horseId);
    if (raw) setEditTarget(raw);
  }

  const horses: HorseCard[] = userHorse.map(mapHorseToCard);

  // Status + class filters are client-side (enum fields, small dataset per page)
  const filtered = horses.filter((h) => {
    const matchStatus = statusFilter === "All Statuses" || h.status === statusFilter;
    return matchStatus
  });

  return (
    <>
    <HorseProfile horseId={profileHorseId} onClose={() => setProfileHorseId(null)} />
    {showRegister && (
      <RegisterHorseModal
        onClose={() => setShowRegister(false)}
        onCreated={() => { setShowRegister(false); setPage(1); setRefreshSeed(s => s + 1); }}
      />
    )}
    {editTarget && (
      <EditHorseModal
        horse={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={() => { setEditTarget(null); setRefreshSeed(s => s + 1); }}
      />
    )}
    <div className="flex-1 px-8 py-8 min-h-screen bg-bg flex flex-col font-sans">
      <header className="pb-5 flex flex-col gap-3 border-b border-border/60 shrink-0">
        <PageHeader
          title="Active Roster"
          eyebrow="Horse Management"
          subtext={`${filtered.length} horse${filtered.length !== 1 ? "s" : ""}`}
          actions={<>
            <ViewToggle value={viewMode} onChange={setViewMode} />
            <RefetchButton onRefetch={() => setRefreshSeed((s) => s + 1)} lastUpdated={lastUpdated} />
            <Button size="sm" leftIcon={<Plus size={13} />} onClick={() => setShowRegister(true)}>
              Register New Horse
            </Button>
          </>}
        />
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted/70" />
            <input
              type="text"
              placeholder="Search horses..."
              aria-label="Search horses"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface border border-border rounded-md pl-9 pr-4 text-[11px] text-text-muted placeholder-text-muted focus:outline-none focus:border-white/20 h-[32px] transition-colors duration-150"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}
              aria-label="Filter by status"
              className="appearance-none bg-surface border border-border rounded-md pl-3 pr-8 text-[11px] text-text-muted focus:outline-none focus:border-white/20 cursor-pointer h-[32px]"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
        </div>
      </header>
      <div className="flex-1 pt-5">

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-text-muted/70">
          <p className="text-[15px] font-medium">Loading horses...</p>
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => setRefreshSeed((s) => s + 1)} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-text-muted/70">
          <p className="text-[15px] font-medium">No horses match your filters.</p>
        </div>
      ) : (
        <>
          {viewMode === "card" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((horse) => (
                <HorseCardItem
                  key={horse.id}
                  horse={horse}
                  onViewProfile={() => setProfileHorseId(horse.id)}
                  onOpenUpdate={() => handleOpenEdit(horse.id)}
                />
              ))}
            </div>
          ) : (
            <HorseTable
              horses={filtered}
              onViewProfile={setProfileHorseId}
              onOpenUpdate={handleOpenEdit}
            />
          )}
          <PaginationBar
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage(p => p - 1)}
            onNext={() => setPage(p => p + 1)}
          />
        </>
      )}
      </div>
    </div>
    </>
  );
}