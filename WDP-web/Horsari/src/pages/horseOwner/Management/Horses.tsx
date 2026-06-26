import { useEffect, useState, useRef } from "react";
import { Search, ChevronDown, Plus, MoreVertical, ChevronLeft, ChevronRight, X, Loader2, ImagePlus } from "lucide-react";
import { horseOwnerService, type Horse } from "../../../api/horseOwnerService";
import HorseProfile from "./HorseProfile";

// ── Types ─────────────────────────────────────────────────────────────────────
type HorseStatus = "Racing" | "Training" | "Resting" | "Injured";

interface HorseCard {
  id: string;
  name: string;
  age: number;
  color: string;
  sex: string;
  grade: string;
  status: HorseStatus;
  image: string;
  returnEst?: string;
  statusNote?: string;
}

// ── Mapper ────────────────────────────────────────────────────────────────────
function mapHorseToCard(h: Horse): HorseCard {
  const age = Math.floor(
    (Date.now() - new Date(h.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)
  );

  const mapStatus = (): HorseStatus => {
    if (h.healthStatus !== "healthy") return "Injured";
    if (h.status === "active") return "Racing";
    return "Resting";
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
    // Populate contextual fields based on mapped status
    ...((status === "Resting" || status === "Injured") && {
      returnEst: "TBD",
      statusNote: status === "Injured" ? "Medical Review" : "Post-Race Rest",
    }),
  };
}

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUSES: ("All Statuses" | HorseStatus)[] = [
  "All Statuses",
  "Racing",
  "Training",
  "Resting",
  "Injured",
];

const CLASSES = ["All Classes", "Grade 1", "Grade 2", "Grade 3", "Listed"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusDot(status: HorseStatus) {
  const colors: Record<HorseStatus, string> = {
    Racing: "bg-green-400",
    Training: "bg-yellow-400",
    Resting: "bg-gray-400",
    Injured: "bg-red-400",
  };
  return colors[status];
}

function statusLabel(status: HorseStatus) {
  const styles: Record<HorseStatus, string> = {
    Racing: "text-green-400",
    Training: "text-yellow-400",
    Resting: "text-gray-400",
    Injured: "text-red-400",
  };
  return styles[status];
}

// ── Info grid cell ────────────────────────────────────────────────────────────
function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#1e1e1e] rounded-lg px-3 py-2.5 border border-white/6">
      <p className="text-[10px] font-semibold tracking-widest text-gray-600 uppercase mb-1">
        {label}
      </p>
      <p className="text-[13px] font-semibold text-white leading-snug">{value}</p>
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
    <div className="bg-[#1a1a1a] rounded-2xl border border-white/8 overflow-hidden flex flex-col group hover:border-white/15 transition-colors duration-200">
      <div className="relative h-40 overflow-hidden bg-[#111] flex items-center justify-center">
        <img
          src={horse.image}
          alt={horse.name}
          onError={(e) => {
            e.currentTarget.src = "/jumping-horse-silhouette-facing-left-side-view.png";
            setIsPlaceholder(true);
          }}
          className={
            isPlaceholder
              ? "h-20 w-20 object-contain opacity-20 group-hover:opacity-30 transition-opacity duration-500"
              : "absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-65 transition-opacity duration-500"
          }
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/30 to-transparent" />
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
          <span className={`w-1.5 h-1.5 rounded-full ${statusDot(horse.status)}`} />
          <span className={`text-[11px] font-semibold tracking-wide ${statusLabel(horse.status)}`}>
            {horse.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="px-5 pt-4 pb-5 flex flex-col gap-4 flex-1">
        <div>
          <h3
            className="text-[18px] font-bold text-white leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {horse.name}
          </h3>
          <p className="text-[11px] font-semibold tracking-widest text-gray-600 uppercase mt-0.5">
            {horse.age}YO {horse.color} {horse.sex} · {horse.grade}
          </p>
        </div>

        {(horse.status === "Resting" || horse.status === "Injured") &&
          horse.returnEst && horse.statusNote && (
            <div className="grid grid-cols-2 gap-2">
              <InfoCell label="Return Est." value={horse.returnEst} />
              <InfoCell label="Status" value={horse.statusNote} />
            </div>
          )}

        <div className="flex items-center gap-2 mt-auto">
          <button
            onClick={onViewProfile}
            className="flex-1 py-2.5 rounded-lg border border-red-700/60 text-red-400 text-[12.5px] font-semibold hover:bg-red-700/10 hover:border-red-600 transition-all duration-150 tracking-wide"
          >
            VIEW PROFILE
          </button>
          <button
            onClick={onOpenUpdate}
            className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:border-white/25 transition-all duration-150 shrink-0"
          >
            <MoreVertical size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Update status modal ───────────────────────────────────────────────────────
interface UpdateTarget {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'retired';
  healthStatus: 'healthy' | 'injured' | 'sick';
}

function UpdateStatusModal({
  target,
  onClose,
  onConfirm,
}: {
  target: UpdateTarget;
  onClose: () => void;
  onConfirm: (id: string, status: 'active' | 'inactive' | 'retired', healthStatus: 'healthy' | 'injured' | 'sick') => Promise<void>;
}) {
  const [status, setStatus] = useState(target.status);
  const [health, setHealth] = useState(target.healthStatus);
  const [submitting, setSubmitting] = useState(false);

  const statusOptions: { label: string; value: 'active' | 'inactive' | 'retired'; active: string }[] = [
    { label: "Active", value: "active", active: "text-green-400 border-green-500/50 bg-green-500/10" },
    { label: "Inactive", value: "inactive", active: "text-gray-300 border-gray-500/50 bg-gray-500/10" },
    { label: "Retired", value: "retired", active: "text-blue-400 border-blue-500/50 bg-blue-500/10" },
  ];

  const healthOptions: { label: string; value: 'healthy' | 'injured' | 'sick'; active: string }[] = [
    { label: "Healthy", value: "healthy", active: "text-green-400 border-green-500/50 bg-green-500/10" },
    { label: "Injured", value: "injured", active: "text-red-400 border-red-500/50 bg-red-500/10" },
    { label: "Sick", value: "sick", active: "text-yellow-400 border-yellow-500/50 bg-yellow-500/10" },
  ];

  const idle = "text-gray-600 border-white/8 bg-transparent hover:border-white/20 hover:text-gray-400";

  async function handleConfirm() {
    setSubmitting(true);
    await onConfirm(target.id, status, health);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-[#111111] rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <p className="text-[11px] font-bold tracking-[0.2em] text-gray-600 uppercase">Update Horse</p>
            <h2 className="text-[17px] font-bold text-white mt-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
              {target.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-gray-500 hover:text-white hover:border-white/25 transition-all duration-150"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2.5">Racing Status</p>
            <div className="grid grid-cols-3 gap-2">
              {statusOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`py-2.5 rounded-lg border text-[12px] font-semibold transition-all duration-150 ${status === opt.value ? opt.active : idle}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2.5">Health Status</p>
            <div className="grid grid-cols-3 gap-2">
              {healthOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setHealth(opt.value)}
                  className={`py-2.5 rounded-lg border text-[12px] font-semibold transition-all duration-150 ${health === opt.value ? opt.active : idle}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-[12.5px] font-semibold text-gray-400 hover:text-white hover:border-white/25 transition-all duration-150"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg bg-red-700 hover:bg-red-600 disabled:bg-red-900/50 disabled:text-red-700 text-white text-[12.5px] font-bold tracking-wide transition-all duration-150 flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : "Apply Changes"}
            </button>
          </div>
        </div>
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
    if (!form.breed.trim())     { setError("Breed is required."); return; }
    if (!form.gender)           { setError("Please select a gender."); return; }
    if (!form.dateOfBirth)      { setError("Date of birth is required."); return; }

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

      const newId: string = res.data?._id ?? res.data?.id;
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

  const inputCls = "w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-4 py-2.5 text-[13px] text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/30 transition-colors duration-150";
  const labelCls = "block text-[10.5px] font-bold tracking-widest text-gray-500 uppercase mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[#111111] rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <p className="text-[11px] font-bold tracking-[0.2em] text-gray-600 uppercase">New Registration</p>
            <h2 className="text-[17px] font-bold text-white mt-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
              Register a Horse
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-gray-500 hover:text-white hover:border-white/25 transition-all duration-150"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Image upload */}
          <div
            onClick={() => fileRef.current?.click()}
            className="w-full h-28 rounded-xl border-2 border-dashed border-white/12 bg-[#1a1a1a] flex items-center justify-center gap-3 cursor-pointer hover:border-white/25 transition-colors duration-150 group"
          >
            {imagePreview ? (
              <img src={imagePreview} className="h-20 object-contain rounded-lg" alt="preview" />
            ) : (
              <>
                <ImagePlus size={20} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                <p className="text-[12px] text-gray-600 group-hover:text-gray-400 transition-colors">
                  Upload photo <span className="text-gray-700">(optional)</span>
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
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
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
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Date of Birth *</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={e => handleField("dateOfBirth", e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className={`${inputCls} cursor-pointer`}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-[12px] text-red-400 bg-red-900/15 border border-red-700/30 rounded-lg px-3 py-2.5">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-[12.5px] font-semibold text-gray-400 hover:text-white hover:border-white/25 transition-all duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg bg-red-700 hover:bg-red-600 disabled:bg-red-900/50 disabled:text-red-700 text-white text-[12.5px] font-bold tracking-wide transition-all duration-150 flex items-center justify-center gap-2"
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
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-white/10 text-[12px] text-gray-400 font-semibold disabled:opacity-30 hover:border-white/25 hover:text-white transition-all duration-150"
      >
        <ChevronLeft size={13} /> Prev
      </button>
      <span className="text-[12px] text-gray-500 font-medium">Page {page} of {totalPages}</span>
      <button
        onClick={onNext}
        disabled={page === totalPages}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-white/10 text-[12px] text-gray-400 font-semibold disabled:opacity-30 hover:border-white/25 hover:text-white transition-all duration-150"
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
  const [classFilter, setClassFilter] = useState("All Classes");
  const [userHorse, setUserHorse] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [profileHorseId, setProfileHorseId] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<UpdateTarget | null>(null);
  const [refreshSeed, setRefreshSeed] = useState(0);
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
        const data = await horseOwnerService.getUserHorse(page, PAGE_LIMIT, debouncedSearch || undefined);
        if (cancelled) return;
        setUserHorse(data.data?.items ?? []);
        setTotalPages(data.data?.pagination?.totalPages ?? 1);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchHorses();
    return () => { cancelled = true; };
  }, [page, debouncedSearch, refreshSeed]);

  function handleOpenUpdate(horseId: string) {
    const raw = userHorse.find(h => h._id === horseId);
    if (!raw) return;
    setUpdateTarget({
      id: raw._id,
      name: raw.horseName,
      status: raw.status as 'active' | 'inactive' | 'retired',
      healthStatus: raw.healthStatus as 'healthy' | 'injured' | 'sick',
    });
  }

  async function handleUpdateConfirm(
    id: string,
    status: 'active' | 'inactive' | 'retired',
    healthStatus: 'healthy' | 'injured' | 'sick',
  ) {
    const raw = userHorse.find(h => h._id === id);
    if (raw) {
      if (raw.status !== status) await horseOwnerService.updateHorseStatus(id, status);
      if (raw.healthStatus !== healthStatus) await horseOwnerService.updateHorseHealthStatus(id, healthStatus);
    }
    setUpdateTarget(null);
    setRefreshSeed(s => s + 1);
  }

  const horses: HorseCard[] = userHorse.map(mapHorseToCard);

  // Status + class filters are client-side (enum fields, small dataset per page)
  const filtered = horses.filter((h) => {
    const matchStatus = statusFilter === "All Statuses" || h.status === statusFilter;
    const matchClass = classFilter === "All Classes" || h.grade === classFilter;
    return matchStatus && matchClass;
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
    {updateTarget && (
      <UpdateStatusModal
        target={updateTarget}
        onClose={() => setUpdateTarget(null)}
        onConfirm={handleUpdateConfirm}
      />
    )}
    <div className="flex-1 px-8 py-8 min-h-screen bg-[#111111] flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <header className="pb-5 flex flex-col gap-3 border-b border-white/5 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[22px] font-bold text-white tracking-tight leading-tight truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
              Active Roster
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[10px] font-semibold tracking-wide text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase whitespace-nowrap">
                Horse Management
              </span>
              <span className="text-[12px] text-gray-500 truncate">· {filtered.length} horse{filtered.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
          <button
            onClick={() => setShowRegister(true)}
            className="shrink-0 flex items-center gap-2 px-4 text-[12px] font-medium text-white bg-[#ab3030] rounded hover:bg-[#8f2828] transition-colors shadow-lg shadow-red-900/20 h-[32px]"
          >
            <Plus size={13} /> Register New Horse
          </button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              type="text"
              placeholder="Search horses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-md pl-9 pr-4 text-[11px] text-gray-300 placeholder-gray-600 focus:outline-none focus:border-white/20 h-[32px] transition-colors duration-150"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}
              className="appearance-none bg-[#1a1a1a] border border-white/10 rounded-md pl-3 pr-8 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 cursor-pointer h-[32px]"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="appearance-none bg-[#1a1a1a] border border-white/10 rounded-md pl-3 pr-8 text-[11px] text-gray-300 focus:outline-none focus:border-white/20 cursor-pointer h-[32px]"
            >
              {CLASSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </header>
      <div className="flex-1 pt-5">

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-600">
          <p className="text-[15px] font-medium">Loading horses...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-600">
          <p className="text-[15px] font-medium">No horses match your filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((horse) => (
              <HorseCardItem
                key={horse.id}
                horse={horse}
                onViewProfile={() => setProfileHorseId(horse.id)}
                onOpenUpdate={() => handleOpenUpdate(horse.id)}
              />
            ))}
          </div>
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