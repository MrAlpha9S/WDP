import { useState, useEffect, useCallback } from "react";
import { ChevronDown, SlidersHorizontal, User, Loader2, Trophy, MapPin, Calendar, Flag, UserX, AlertCircle, ClipboardList, X, UserSearch } from "lucide-react";
import JockeyDetailModal, { type Jockey, STATUS_CFG } from "../../../components/ownerComponents/JockeyModal/Jockeydetailmodal";
import HireJockeyModal from "../../../components/ownerComponents/JockeyModal/Hirejockey";
import { horseOwnerService, type RaceInvitationEntry } from "../../../api/horseOwnerService";
import { RefetchButton } from "../../../components/RefetchButton";
import ViewToggle, { type ViewMode } from "../../../components/ui/ViewToggle";

const WEIGHTS = ["Weight: All", "Under 54kg", "54–56kg", "Over 56kg"];

// ── Accepted registrations panel ────────────────────────────────────────────
// Separate from the jockey marketplace grid/table below: this surfaces the
// owner's own accepted (in-progress) race registrations and, per registration,
// whether a jockey has been invited yet — sourced from the same
// getHorseOwnerInvitations endpoint HireJockeyModal uses to list hireable
// races, filtered the same way (accepted/verified, round not completed/cancelled).
interface AcceptedRegistration {
  id: string;
  raceName: string;
  tournament: string | null;
  status: string;
  date: string;
  venue: string;
  horseName: string | null;
  jockeyName: string | null;
  // Every invitation ever sent for this registration, newest first —
  // distinct from jockeyName above, which only reflects a confirmed/
  // effective pick. Drives the expandable invitation-history table.
  invitations: { jockeyName: string | null; status: string; isBackup: boolean }[];
}

const REG_STATUS_CFG: Record<string, string> = {
  accepted: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  verified: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

const INVITATION_TONE_CFG: Record<string, string> = {
  pending: "text-amber",
  accepted: "text-emerald-400",
  declined: "text-red-400",
  cancelled: "text-text-muted",
  didNotAttend: "text-red-400",
};

const INVITATION_LABEL_CFG: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  cancelled: "Cancelled",
  didNotAttend: "No-Show",
};

function fmtRegDate(iso: string | undefined | null): string {
  if (!iso) return "TBA";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "TBA";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAcceptedRegistration(raw: any, i: number): AcceptedRegistration {
  return {
    id: raw.registration?._id ?? String(i),
    raceName: raw.raceRound?.roundName ?? "Unnamed Race",
    tournament: raw.tournament?.name ?? null,
    status: raw.registration?.registrationStatus ?? "accepted",
    date: fmtRegDate(raw.raceRound?.raceDate),
    venue: raw.raceRound?.location ?? "TBA",
    horseName: raw.horse?.horseName ?? null,
    jockeyName: raw.jockey?.fullName ?? null,
    invitations: raw.invitations ?? [],
  };
}

function RegistrationRowSkeleton() {
  return (
    <div className="rounded-xl bg-white/4 border border-border/60 p-4 space-y-2.5 animate-pulse">
      <div className="h-4 w-4/5 rounded bg-white/5" />
      <div className="h-3 w-3/5 rounded bg-white/5" />
      <div className="h-3 w-2/5 rounded bg-white/5" />
    </div>
  );
}

// Docked side panel, styled after Admin's RaceDetailsPanel: a bordered aside
// that sits in-flow next to the main content (not an overlay), toggled on
// from a header button, with the main column shrinking to make room for it.
function AcceptedRegistrationsPanel({ onClose, registrations, loading, error }: {
  onClose: () => void;
  registrations: AcceptedRegistration[];
  loading: boolean;
  error: string | null;
}) {
  const needsJockeyCount = registrations.filter((r) => !r.jockeyName).length;
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <aside
      className="h-full bg-surface border border-border/60 rounded-xl flex flex-col overflow-hidden shadow-lg shadow-black/20"
      style={{ animation: "panelIn 0.18s ease-out" }}
    >
      <style>{`@keyframes panelIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }`}</style>

      <div className="flex flex-col flex-1 min-h-0">
        {/* ── Header ── */}
        <div className="px-5 py-5 shrink-0 border-b border-border/60 bg-surface">
          <div className="flex justify-between items-start w-full gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-[18px] font-bold tracking-tight leading-tight text-text">
                Accepted Registrations
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border inline-block ${needsJockeyCount > 0
                  ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  }`}>
                  {needsJockeyCount > 0 ? `${needsJockeyCount} Need${needsJockeyCount === 1 ? "s" : ""} Jockey` : "All Set"}
                </span>
                <span className="text-[12px] text-text-muted">
                  {registrations.length} race{registrations.length !== 1 ? "s" : ""} entered
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 bg-white/5 hover:bg-white/10 text-text-muted hover:text-text rounded border border-border transition-colors shrink-0"
              title="Close Panel"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-3">
          {loading && Array.from({ length: 4 }).map((_, i) => <RegistrationRowSkeleton key={i} />)}

          {!loading && error && (
            <div className="flex items-center gap-2 text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
              <AlertCircle size={13} className="shrink-0" /> {error}
            </div>
          )}

          {!loading && !error && registrations.length === 0 && (
            <div className="text-[13px] text-text-muted italic p-8 text-center bg-bg rounded-xl border border-border/60">
              No accepted registrations yet — join a race from your dashboard.
            </div>
          )}

          {!loading && !error && registrations.map((reg) => (
            <div key={reg.id} className="p-4 rounded-xl bg-bg border border-border/60 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Trophy size={16} className="text-text-muted shrink-0" />
                  <span className="text-[14px] font-bold text-text truncate">{reg.raceName}</span>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${REG_STATUS_CFG[reg.status] ?? REG_STATUS_CFG.accepted}`}>
                  {reg.status}
                </span>
              </div>

              {reg.tournament && (
                <p className="text-[11px] text-text-muted -mt-2">{reg.tournament}</p>
              )}

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[12px]">
                <div className="flex flex-col gap-1">
                  <span className="text-text-muted font-medium flex items-center gap-1"><Calendar size={12} /> Date</span>
                  <span className="text-text-muted font-semibold">{reg.date}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-text-muted font-medium flex items-center gap-1"><MapPin size={12} /> Venue</span>
                  <span className="text-text-muted font-semibold truncate">{reg.venue}</span>
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <span className="text-text-muted font-medium flex items-center gap-1"><Flag size={12} /> Horse</span>
                  <span className="text-text-muted font-semibold">
                    {reg.horseName ?? <span className="text-text-muted/70 italic font-normal">N/A</span>}
                  </span>
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-text-muted font-medium">Jockey</span>
                    {reg.invitations.length > 0 && (
                      <button
                        onClick={() => toggleExpanded(reg.id)}
                        className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text transition-colors"
                      >
                        {reg.invitations.length} invite{reg.invitations.length > 1 ? "s" : ""}
                        <ChevronDown size={10} className={`transition-transform duration-150 ${expandedIds.has(reg.id) ? "rotate-180" : ""}`} />
                      </button>
                    )}
                  </div>

                  {reg.invitations.length === 0 && (
                    <span className="font-semibold flex items-center gap-1 text-amber-400">
                      <UserX size={12} className="shrink-0" /> No invitation sent yet
                    </span>
                  )}

                  {expandedIds.has(reg.id) && reg.invitations.length > 0 && (
                    <div className="mt-2 rounded-lg border border-border/60 overflow-hidden">
                      <table className="w-full text-[11px] border-collapse">
                        <thead>
                          <tr className="bg-white/[0.03]">
                            <th className="text-left font-semibold text-text-muted px-2 py-1.5">Jockey</th>
                            <th className="text-left font-semibold text-text-muted px-2 py-1.5">Role</th>
                            <th className="text-left font-semibold text-text-muted px-2 py-1.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {reg.invitations.map((inv, i) => (
                            <tr key={i}>
                              <td className="px-2 py-1.5 text-text-muted truncate max-w-[120px]">{inv.jockeyName ?? "Unknown"}</td>
                              <td className="px-2 py-1.5 text-text-muted">{inv.isBackup ? "Backup" : "Main"}</td>
                              <td className={`px-2 py-1.5 font-semibold ${INVITATION_TONE_CFG[inv.status] ?? "text-text-muted"}`}>
                                {INVITATION_LABEL_CFG[inv.status] ?? inv.status}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

// ── API mapper ────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiToJockey(raw: any, index: number): Jockey {
  // Derive age from dateOfBirth
  const age = raw.dateOfBirth
    ? new Date().getFullYear() - new Date(raw.dateOfBirth).getFullYear()
    : 0;

  const VALID_STATUSES = ["Available", "In Talks", "Unavailable"] as const;

  // Jockey must have an approved license before they can be available
  const licenseStatus = (raw.licenseStatus ?? "").toLowerCase();
  const isCertified = licenseStatus === "approved";

  let status: Jockey["status"];
  if (!isCertified) {
    status = "Unavailable";
  } else {
    const statusMap: Record<string, string> = {
      active: "Available",
      approved: "Available",
      pending: "In Talks",
      inactive: "Unavailable",
      retired: "Unavailable",
      available: "Available",
      "in talks": "In Talks",
      unavailable: "Unavailable",
    };
    const rawStatus = (raw.status ?? "").toLowerCase();
    const mappedStatus = statusMap[rawStatus] ?? "Unavailable";
    status = VALID_STATUSES.includes(mappedStatus as typeof VALID_STATUSES[number])
      ? (mappedStatus as Jockey["status"])
      : "Unavailable";
  }

  return {
    id: raw._id ?? index,
    name: raw.fullName ?? raw.username ?? "Unknown",
    // Rank is a live server-computed leaderboard position — the list endpoint
    // doesn't compute it for every row; openDetail() upgrades this once the
    // full profile (which does compute it) loads.
    rank: null,
    totalJockeys: 0,
    status: status,
    winRate: raw.totalWins && raw.matchesRaced
      ? parseFloat(((raw.totalWins / raw.matchesRaced) * 100).toFixed(1))
      : 0,
    starts: raw.matchesRaced ?? 0,
    wins: raw.totalWins ?? 0,
    places: raw.places ?? 0,
    weight: raw.weight ? `${raw.weight} kg` : "N/A",
    age,
    specialties: raw.specialties ?? [],
    recentRaces: raw.recentRaces ?? [],
    image: raw.image || null,
    violations: [],
    bookingFee: raw.bookingFee ?? 0,
  };
}

// ── Filter dropdown ───────────────────────────────────────────────────────────
function FilterSelect({ options, value, onChange }: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-surface border border-border rounded-lg pl-4 pr-8 py-2 text-[12.5px] text-text-muted focus:outline-none focus:border-white/25 cursor-pointer transition-colors duration-150"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function JockeySkeleton() {
  return (
    <div className="bg-surface rounded-2xl border border-border/60 overflow-hidden animate-pulse">
      <div className="h-28 bg-white/5" />
      <div className="px-4 pt-3 pb-4 flex flex-col gap-3">
        <div className="h-5 w-2/3 bg-white/8 rounded" />
        <div className="h-3 w-1/2 bg-white/5 rounded" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-12 bg-white/5 rounded-lg" />
          <div className="h-12 bg-white/5 rounded-lg" />
        </div>
        <div className="h-10 bg-white/5 rounded-lg" />
        <div className="flex gap-2 mt-auto">
          <div className="flex-1 h-9 bg-white/5 rounded-lg" />
          <div className="flex-1 h-9 bg-white/5 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ── Jockey Card ───────────────────────────────────────────────────────────────
function JockeyCard({ jockey, onDetail, onHire }: { jockey: Jockey; onDetail: () => void; onHire: () => void }) {
  const cfg = STATUS_CFG[jockey.status] ?? STATUS_CFG["Unavailable"];
  const isUnavailable = jockey.status === "Unavailable";

  return (
    <div
      className={`bg-surface rounded-2xl border border-border overflow-hidden flex flex-col transition-all duration-200 ${!isUnavailable
        ? "hover:border-white/15 hover:shadow-xl hover:shadow-black/40"
        : "opacity-80"
        }`}
    >
      <div className="relative h-28 bg-bg overflow-hidden">
        {jockey.image ? (
          <img
            src={jockey.image}
            alt={jockey.name}
            className={`w-full h-full object-cover object-top ${isUnavailable ? "grayscale brightness-50" : ""}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface">
            <User size={32} className="text-text-muted/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/10 to-transparent" />
        <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${cfg.bg} ${cfg.border} ${cfg.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {jockey.status}
        </div>
      </div>

      <div className="px-4 pt-3 pb-4 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="text-[16px] font-bold text-text leading-tight font-serif">
            {jockey.name}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface rounded-lg px-3 py-2.5 border border-border/60">
            <p className="text-[10px] font-semibold tracking-widest text-text-muted/70 uppercase mb-1">Win Rate</p>
            <p className={`text-[15px] font-bold ${isUnavailable ? "text-text-muted" : "text-green"}`}>
              {jockey.winRate}%
            </p>
          </div>
          <div className="bg-surface rounded-lg px-3 py-2.5 border border-border/60">
            <p className="text-[10px] font-semibold tracking-widest text-text-muted/70 uppercase mb-1">Starts</p>
            <p className="text-[15px] font-bold text-text">{jockey.starts.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-surface rounded-lg px-3 py-2.5 border border-border/60 flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-widest text-text-muted/70 uppercase">Booking Fee</p>
          <p className="text-[15px] font-bold text-text whitespace-nowrap">{jockey.bookingFee.toLocaleString()} ₫</p>
        </div>

        <div className="flex gap-2 mt-auto">
          <button
            onClick={onDetail}
            className="flex-1 py-2.5 rounded-lg border border-white/12 text-text-muted text-[12px] font-semibold hover:border-white/28 hover:text-text transition-all duration-150"
          >
            Details
          </button>
          <button
            disabled={isUnavailable}
            onClick={isUnavailable ? undefined : onHire}
            className={`flex-1 py-2.5 rounded-lg text-[12px] font-bold transition-all duration-150 flex items-center justify-center gap-1.5 ${isUnavailable
              ? "bg-[#242424] border border-border text-text-muted/70 cursor-not-allowed"
              : "bg-red hover:bg-red/85 text-text shadow-lg shadow-red-900/30"
              }`}
          >
            {isUnavailable ? "Unavailable" : <><span>Hire</span> <UserSearch size={12} className="text-text stroke-2" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Jockey Table ──────────────────────────────────────────────────────────────
function JockeyTable({ jockeys, onDetail, onHire }: { jockeys: Jockey[]; onDetail: (j: Jockey) => void; onHire: (j: Jockey) => void }) {
  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface border-b border-border/60">
            <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase">Name</th>
            <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase">Status</th>
            <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase">Win Rate</th>
            <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase">Starts</th>
            <th className="p-4 text-[11px] font-bold tracking-widest text-text-muted uppercase"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {jockeys.map((jockey) => {
            const cfg = STATUS_CFG[jockey.status] ?? STATUS_CFG["Unavailable"];
            const isUnavailable = jockey.status === "Unavailable";
            return (
              <tr key={jockey.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 text-[13px] font-semibold text-text">{jockey.name}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10.5px] font-semibold ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {jockey.status}
                  </span>
                </td>
                <td className={`p-4 text-[13px] font-bold ${isUnavailable ? "text-text-muted" : "text-green"}`}>{jockey.winRate}%</td>
                <td className="p-4 text-[12.5px] text-text-muted">{jockey.starts.toLocaleString()}</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onDetail(jockey)}
                      className="px-3.5 py-1.5 rounded-lg border border-white/12 text-text-muted text-[11px] font-semibold hover:border-white/28 hover:text-text transition-all duration-150"
                    >
                      Details
                    </button>
                    <button
                      disabled={isUnavailable}
                      onClick={isUnavailable ? undefined : () => onHire(jockey)}
                      className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-150 ${isUnavailable
                        ? "bg-[#242424] border border-border text-text-muted/70 cursor-not-allowed"
                        : "bg-red hover:bg-red/85 text-text"
                        }`}
                    >
                      {isUnavailable ? "Unavailable" : "Hire"}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function JockeysPage() {
  const [jockeys, setJockeys] = useState<Jockey[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [weightFilter, setWeightFilter] = useState("Weight: All");
  const [visibleCount, setVisibleCount] = useState(8);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [selected, setSelected] = useState<Jockey | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [hiring, setHiring] = useState<Jockey | null>(null);

  const [registrations, setRegistrations] = useState<AcceptedRegistration[]>([]);
  const [regsLoading, setRegsLoading] = useState(true);
  const [regsError, setRegsError] = useState<string | null>(null);
  const [showRegistrations, setShowRegistrations] = useState(false);

  const fetchRegistrations = useCallback(async () => {
    try {
      setRegsLoading(true);
      setRegsError(null);
      const res = await horseOwnerService.getHorseOwnerInvitations(1, 50);
      const items: RaceInvitationEntry[] = res?.data?.items ?? [];
      const accepted = items.filter((r) => {
        const registrationStatus = (r.registration as { registrationStatus?: string })?.registrationStatus ?? "";
        const roundStatus = String((r.raceRound as { status?: string })?.status ?? "").toLowerCase();
        return ["accepted", "verified"].includes(registrationStatus) && !["completed", "cancelled"].includes(roundStatus);
      });
      setRegistrations(accepted.map((r, i) => mapAcceptedRegistration(r, i)));
    } catch {
      setRegsError("Failed to load your accepted registrations.");
    } finally {
      setRegsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const needsJockeyCount = registrations.filter((r) => !r.jockeyName).length;

  async function openDetail(jockey: Jockey) {
    setSelected(jockey); // open modal immediately with base data
    setProfileLoading(true);
    try {
      const res = await horseOwnerService.getJockeyProfile(String(jockey.id));
      const { recentRaces, stats, violations, jockey: jockeyDoc } = res.data;
      setSelected(prev => prev ? {
        ...prev,
        recentRaces,
        violations,
        winRate: stats.winRate,
        wins: stats.wins,
        starts: stats.totalRaces,
        totalPrize: stats.totalPrize,
        bookingFee: jockeyDoc.bookingFee ?? prev.bookingFee,
        rank: jockeyDoc.rank ?? null,
        totalJockeys: jockeyDoc.totalJockeys ?? 0,
      } : prev);
    } catch {
      // silently fall back to the base (list-level) data already in jockey object
    } finally {
      setProfileLoading(false);
    }
  }

  const fetchJockeys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await horseOwnerService.getAllJockey();
      const raw: unknown[] = data?.data?.items ?? [];
      setJockeys(raw.map((item, i) => mapApiToJockey(item, i)));
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Failed to load jockeys.";
      setError(message);
    } finally {
      setLoading(false);
      setLastUpdated(Date.now());
    }
  }, []);

  useEffect(() => {
    fetchJockeys();
  }, [fetchJockeys]);

  const filtered = jockeys;
  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="h-full flex flex-col overflow-hidden font-sans">

      {selected && (
        <JockeyDetailModal jockey={selected} onClose={() => setSelected(null)} loading={profileLoading} />
      )}
      {hiring && (
        <HireJockeyModal
          jockey={hiring}
          onClose={() => setHiring(null)}
          onConfirm={async (payload) => {
            console.log("Hire payload:", payload);
            await horseOwnerService.HireJockey(payload)
            await Promise.all([fetchJockeys(), fetchRegistrations()]);
            setHiring(null);
          }}
        />
      )}

      <div className="flex-1 flex gap-6 px-8 py-8 min-h-0">
        <main className={`flex flex-col min-w-0 h-full overflow-y-auto custom-scrollbar transition-all duration-200 ${showRegistrations ? "flex-[0_0_65%]" : "flex-1"}`}>
          {/* Header */}
          <div className="flex items-start justify-between mb-6 shrink-0">
            <div>
              <h1 className="text-[36px] font-bold text-text leading-tight font-serif">
                Jockey Marketplace
              </h1>
              <p className="text-[13px] text-text-muted mt-1">
                Browse, evaluate, and hire elite riders for your stable.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setShowRegistrations((v) => !v)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg border text-[13px] font-medium transition-colors duration-150 ${showRegistrations
                  ? "border-white/30 bg-white/10 text-text"
                  : "border-white/15 text-text-muted hover:border-white/30 hover:text-text"
                  }`}
              >
                <ClipboardList size={14} /> My Registrations
                {needsJockeyCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red text-text text-[9px] font-bold flex items-center justify-center">
                    {needsJockeyCount}
                  </span>
                )}
              </button>
              <ViewToggle value={viewMode} onChange={setViewMode} />
              <RefetchButton onRefetch={async () => { await Promise.all([fetchJockeys(), fetchRegistrations()]); }} lastUpdated={lastUpdated} />
              <SlidersHorizontal size={14} className="text-text-muted" />
              <FilterSelect options={WEIGHTS} value={weightFilter} onChange={setWeightFilter} />
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-text-muted/70 text-[12px] mb-2">
                <Loader2 size={13} className="animate-spin" /> Loading jockeys…
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <JockeySkeleton key={i} />)}
              </div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-xl border border-red-700/30 bg-red-900/10 px-5 py-4 text-[13px] text-red-400">
              {error}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && jockeys.length === 0 && (
            <div className="rounded-xl border border-border bg-white/3 px-5 py-8 text-center text-[13px] text-text-muted/70">
              No jockeys found.
            </div>
          )}

          {/* Grid */}
          {!loading && !error && jockeys.length > 0 && (
            <>
              {viewMode === "card" ? (
                <div className={`grid gap-4 ${showRegistrations ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
                  {visible.map((jockey) => (
                    <JockeyCard key={jockey.id} jockey={jockey} onDetail={() => openDetail(jockey)} onHire={() => setHiring(jockey)} />
                  ))}
                </div>
              ) : (
                <JockeyTable jockeys={visible} onDetail={openDetail} onHire={setHiring} />
              )}

              {visibleCount < filtered.length && (
                <div className="flex justify-center mt-10">
                  <button
                    onClick={() => setVisibleCount((c) => c + 4)}
                    className="flex items-center gap-2 text-[13px] text-text-muted font-medium hover:text-text transition-colors duration-150"
                  >
                    Load More <ChevronDown size={15} />
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        {showRegistrations && (
          <div className="flex-1 min-w-[360px] h-full">
            <AcceptedRegistrationsPanel
              onClose={() => setShowRegistrations(false)}
              registrations={registrations}
              loading={regsLoading}
              error={regsError}
            />
          </div>
        )}
      </div>
    </div>
  );
}