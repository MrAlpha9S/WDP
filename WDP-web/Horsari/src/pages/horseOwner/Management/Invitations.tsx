import { useState, useEffect } from "react";
import {
  Calendar, MapPin, Flag, Check, X,
  Info, Ruler, Loader2, Users, Trophy, ChevronLeft, ChevronRight, Search,
} from "lucide-react";
import { type Invitation, type InviteJockeyStatus, type InviteStatus } from "../../../types/Racingtypes";
import { horseOwnerService, type JockeyInvitationEntry } from "../../../api/horseOwnerService";
import { useSocket } from "../../../providers/SocketProvider";
import { RefetchButton } from "../../../components/RefetchButton";
import { RejectRegistrationModal } from "../../../components/RejectRegistrationModal";
import { useRejectRegistration } from "../../../hooks/useRejectRegistration";

// ── Status config ─────────────────────────────────────────────────────────────
const INVITE_STATUS_CFG: Record<InviteStatus | InviteJockeyStatus, { text: string; bg: string; border: string }> = {
  pending: { text: "text-amber", bg: "bg-amber/10", border: "border-yellow-500/30" },
  accepted: { text: "text-green", bg: "bg-green/10", border: "border-green-500/30" },
  declined: { text: "text-text-muted", bg: "bg-white/5", border: "border-border" },
  rejected: { text: "text-text-muted", bg: "bg-white/5", border: "border-border" },
  verified: { text: "text-text-muted", bg: "bg-white/5", border: "border-border" },
  failed: { text: "text-text-muted", bg: "bg-white/5", border: "border-border" },
  cancelled: { text: "text-text-muted", bg: "bg-white/5", border: "border-border" },
};

function formatDate(isoString: string): string {
  return isoString.split("T")[0];
}

function normalizeInviteStatus(value: unknown): InviteStatus {
  if (
    value === "pending" ||
    value === "accepted" ||
    value === "rejected" ||
    value === "verified" ||
    value === "failed" ||
    value === "cancelled"
  ) return value;
  return "pending";
}

function normalizeJockeyInviteStatus(value: unknown): InviteJockeyStatus {
  if (
    value === "pending" ||
    value === "accepted" ||
    value === "declined" ||
    value === "cancelled"
  ) return value;
  return "pending";
}

// ── Mappers ───────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiToInvitation(raw: any): Invitation {
  return {
    id: raw.registration._id ?? "Unknown",
    name: raw.raceRound?.roundName ?? raw.name ?? "Unnamed Race",
    type: raw.tournament?.tournamentName && raw.tournament.tournamentName !== 'Non-tournament'
      ? "Tournament"
      : "Race",
    status: normalizeInviteStatus(raw.registration?.registrationStatus),
    date: raw.raceRound?.raceDate ? formatDate(raw.raceRound.raceDate) : "TBA",
    venue: raw.raceRound?.location ?? raw.location ?? "TBA",
    prize: raw.raceRound?.firstPlacePrize != null ? `${raw.raceRound?.currencyType ?? "VND"} ${raw.raceRound.firstPlacePrize.toLocaleString()}` : "TBA",
    distance: raw.raceRound?.trackLength != null ? `${raw.raceRound.trackLength}m` : "TBA",
    sentBy: raw.sentBy ?? raw.organizer ?? "Organizer",
    sentAt: raw.sentAt ?? raw.createdAt ?? "",
    image: raw.image ?? raw.coverImage ?? "/track.png",
    prize1st: raw.raceRound?.firstPlacePrize ?? null,
    prize2nd: raw.raceRound?.secondPlacePrize ?? null,
    prize3rd: raw.raceRound?.thirdPlacePrize ?? null,
    currencyType: raw.raceRound?.currencyType ?? "VND",
  };
}

interface JockeyInvitation {
  id: string;
  jockeyId: string | null;
  jockeyName: string;
  jockeyImage: string | null;
  raceName: string;
  raceDate: string;
  venue: string;
  horse: string;
  status: InviteJockeyStatus;
  sentAt: string;
  bookingFees: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiToJockeyInvitation(raw: any, i: number): JockeyInvitation {
  return {
    id: raw._id ?? String(i),
    jockeyId: raw.jockey?._id ?? raw.jockeyId ?? null,
    jockeyName: raw.jockeyName ?? raw.jockey?.fullName ?? "Unknown Jockey",
    jockeyImage: raw.jockeyImage ?? raw.jockey?.image ?? null,
    raceName: raw.raceName ?? raw.raceRound?.roundName ?? "Unnamed Race",
    raceDate: raw.raceDate ? formatDate(raw.raceDate)
      : raw.raceRound?.raceDate
        ? formatDate(raw.raceRound.raceDate)
        : "TBA",
    venue: raw.venue ?? raw.raceRound?.location ?? "TBA",
    horse: raw.horseName ?? raw.horse?.horseName ?? "TBA",
    status: normalizeJockeyInviteStatus(raw.status ?? raw.registrationStatus),
    sentAt: raw.sentAt ?? raw.createdAt ?? "",
    bookingFees: raw.bookingFees ?? 0,
  };
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function InvitationDetailModal({
  inv, onClose, onAccept, onDeny,
}: {
  inv: Invitation;
  onClose: () => void;
  onAccept: (id: string) => void;
  onDeny: (id: number | string) => void;
}) {
  const stCfg = INVITE_STATUS_CFG[inv.status] ?? INVITE_STATUS_CFG.pending;
  const isPending = inv.status === "pending";
  const canReject = inv.status === "pending" || inv.status === "accepted";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 font-sans">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[90vh]">

        <div className="relative h-52 shrink-0 overflow-hidden bg-bg flex items-center justify-center">
          <img src={inv.image} alt={inv.name} className={`h-28 w-28 object-contain ${!isPending ? "opacity-15" : "opacity-25"}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/20 to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 border border-white/15 flex items-center justify-center text-text-muted hover:text-text hover:bg-black/80 transition-colors duration-150">
            <X size={14} />
          </button>
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="text-[10px] font-semibold tracking-widest text-text-muted uppercase px-2.5 py-1 rounded-full bg-black/60 border border-white/15 backdrop-blur-sm">{inv.type}</span>
            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border backdrop-blur-sm ${stCfg.text} ${stCfg.bg} ${stCfg.border}`}>{inv.status}</span>
          </div>
          <div className="absolute bottom-4 left-5 right-5">
            <h2 className="text-[24px] font-bold text-text leading-tight font-serif">{inv.name}</h2>
            <p className="text-[11.5px] text-text-muted mt-0.5">Invited by {inv.sentBy} · {inv.sentAt}</p>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <div className="grid grid-cols-3 gap-5">
            {[
              { icon: <Calendar size={13} className="text-red" />, label: "Date & Time", value: inv.date },
              { icon: <MapPin size={13} className="text-blue" />, label: "Venue", value: inv.venue },
              { icon: <Ruler size={13} className="text-green" />, label: "Distance", value: inv.distance },
            ].map((item) => (
              <div key={item.label} className="bg-surface rounded-xl px-4 py-3 border border-border/60 flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{item.icon}</div>
                <div>
                  <p className="text-[10px] font-semibold tracking-widest text-text-muted/70 uppercase mb-0.5">{item.label}</p>
                  <p className="text-[13px] font-semibold text-text leading-snug">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Prize breakdown */}
          {(inv.prize1st != null || inv.prize2nd != null || inv.prize3rd != null) && (
            <div className="bg-surface rounded-xl border border-border/60 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60">
                <Trophy size={13} className="text-amber" />
                <p className="text-[10px] font-semibold tracking-widest text-text-muted uppercase">Prize Pool</p>
              </div>
              <div className="divide-y divide-white/5">
                {[
                  { label: "1st Place", value: inv.prize1st, color: "text-amber" },
                  { label: "2nd Place", value: inv.prize2nd, color: "text-text-muted" },
                  { label: "3rd Place", value: inv.prize3rd, color: "text-amber-700" },
                ].map(({ label, value, color }) => value != null && (
                  <div key={label} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-[12px] text-text-muted">{label}</span>
                    <span className={`text-[13px] font-bold ${color}`}>
                      {inv.currencyType} {value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border bg-surface shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-white/12 text-text-muted text-[13px] font-semibold hover:border-white/25 hover:text-text transition-all duration-150">
            Close
          </button>
          {canReject && (
            <button onClick={() => { onDeny(inv.id); onClose(); }} className="flex-1 py-2.5 rounded-lg border border-red-700/50 text-red text-[13px] font-semibold hover:bg-red/10 transition-all duration-150 flex items-center justify-center gap-2">
              <X size={14} /> Decline
            </button>
          )}
          {isPending && (
            <button onClick={() => { onAccept(inv.id.toString()); onClose(); }} className="flex-1 py-2.5 rounded-lg bg-green-700 hover:bg-green-600 text-text text-[13px] font-bold transition-colors duration-150 shadow-lg shadow-green-900/30 flex items-center justify-center gap-2">
              <Check size={14} /> Accept
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Race Invitation Card ──────────────────────────────────────────────────────
function InvitationCard({
  inv, onAccept, onDeny, onDetail,
}: {
  inv: Invitation;
  onAccept: (id: string) => void;
  onDeny: (id: number | string) => void;
  onDetail: () => void;
}) {
  const stCfg = INVITE_STATUS_CFG[inv.status] ?? INVITE_STATUS_CFG.pending;
  const isPending = inv.status === "pending";
  const canReject = inv.status === "pending" || inv.status === "accepted";

  return (
    <div className={`bg-surface rounded-2xl border overflow-hidden transition-all duration-200 ${isPending ? "border-border hover:border-white/15" : "border-border/60 opacity-75"}`}>
      <div className="flex">
        <div className="relative w-28 shrink-0 overflow-hidden bg-bg flex items-center justify-center">
          <img src={inv.image} alt={inv.name} className={`w-16 h-16 object-contain ${!isPending ? "opacity-15" : "opacity-25"}`} />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1a1a1a]" />
        </div>
        <div className="flex-1 px-5 py-4 flex flex-col gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-semibold tracking-widest text-text-muted/70 uppercase px-2 py-0.5 rounded bg-white/5 border border-border">{inv.type}</span>
              <span className={`text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded border ${stCfg.text} ${stCfg.bg} ${stCfg.border}`}>{inv.status}</span>
            </div>
            <h3 className="text-[16px] font-bold text-text font-serif">{inv.name}</h3>
            <p className="text-[11px] text-text-muted/70 mt-0.5">Sent by {inv.sentBy} · {inv.sentAt}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Calendar size={11} />, label: "Date", value: inv.date },
              { icon: <MapPin size={11} />, label: "Venue", value: inv.venue },
            ].map((item) => (
              <div key={item.label} className="bg-surface rounded-lg px-3 py-2 border border-border/60">
                <div className="flex items-center gap-1 text-text-muted/70 mb-1">
                  {item.icon}
                  <span className="text-[9.5px] font-semibold tracking-widest uppercase">{item.label}</span>
                </div>
                <p className="text-[12px] font-semibold text-text leading-snug truncate">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {[
                { label: "Distance", value: inv.distance, accent: false },
              ].map((f) => (
                <div key={f.label}>
                  <p className="text-[9.5px] font-semibold tracking-widest text-text-muted/70 uppercase mb-0.5">{f.label}</p>
                  <p className={`text-[12.5px] font-semibold ${f.accent ? "text-red" : "text-text"}`}>{f.value}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onDetail} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-white/12 text-text-muted text-[12px] font-semibold hover:border-white/28 hover:text-text transition-all duration-150">
                <Info size={13} /> Detail
              </button>
              {canReject && (
                <button onClick={() => onDeny(inv.id)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-white/12 text-text-muted text-[12px] font-semibold hover:border-red-700/50 hover:text-red transition-all duration-150">
                  <X size={13} /> Decline
                </button>
              )}
              {isPending ? (
                <button onClick={() => onAccept(inv.id.toString())} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-text text-[12px] font-semibold transition-colors duration-150 shadow-lg shadow-green-900/30">
                  <Check size={13} /> Accept
                </button>
              ) : !canReject && (
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-text-muted/70">
                  {inv.status === "accepted" ? <Check size={13} className="text-green-500" /> : <X size={13} className="text-red-600" />}
                  {inv.status}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Jockey Invitation Card ────────────────────────────────────────────────────
function JockeyInvitationCard({
  inv,
  hasNoShowHistory,
  onCancel,
  isCancelling,
}: {
  inv: JockeyInvitation;
  hasNoShowHistory?: boolean;
  onCancel?: (id: string) => void;
  isCancelling?: boolean;
}) {
  const stCfg = INVITE_STATUS_CFG[inv.status] ?? INVITE_STATUS_CFG.pending;
  const isPending = inv.status === "pending";

  return (
    <div className={`bg-surface rounded-2xl border overflow-hidden transition-all duration-200 ${isPending ? "border-border hover:border-white/15" : "border-border/60 opacity-75"}`}>
      <div className="flex">
        <div className="relative w-36 shrink-0 overflow-hidden bg-bg flex items-center justify-center">
          {inv.jockeyImage ? (
            <img src={inv.jockeyImage} alt={inv.jockeyName} className={`w-full h-full object-cover object-top ${!isPending ? "grayscale brightness-40" : "brightness-75"}`} />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#2a2a2a] border border-border flex items-center justify-center">
              <Users size={22} className="text-text-muted/70" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1a1a1a]" />
        </div>

        <div className="flex-1 px-5 py-4 flex flex-col gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-semibold tracking-widest text-text-muted/70 uppercase px-2 py-0.5 rounded bg-white/5 border border-border">Jockey</span>
              <span className={`text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded border ${stCfg.text} ${stCfg.bg} ${stCfg.border}`}>{inv.status}</span>
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-bold text-text font-serif">{inv.jockeyName}</h3>
              {hasNoShowHistory && (
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-red/10 text-red border border-red/40">
                  No-Show
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-muted/70 mt-0.5">{inv.sentAt ? formatDate(inv.sentAt) : ""}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Flag size={11} />, label: "Race", value: inv.raceName },
              { icon: <Calendar size={11} />, label: "Date", value: inv.raceDate },
              { icon: <MapPin size={11} />, label: "Venue", value: inv.venue },
            ].map((item) => (
              <div key={item.label} className="bg-surface rounded-lg px-3 py-2 border border-border/60">
                <div className="flex items-center gap-1 text-text-muted/70 mb-1">
                  {item.icon}
                  <span className="text-[9.5px] font-semibold tracking-widest uppercase">{item.label}</span>
                </div>
                <p className="text-[12px] font-semibold text-text leading-snug truncate">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[9.5px] font-semibold tracking-widest text-text-muted/70 uppercase mb-0.5">Horse</p>
                <p className="text-[12.5px] font-semibold text-red">{inv.horse}</p>
              </div>
              {inv.bookingFees > 0 && (
                <div>
                  <p className="text-[9.5px] font-semibold tracking-widest text-text-muted/70 uppercase mb-0.5">Booking Fee</p>
                  <p className="text-[12.5px] font-semibold text-text">{inv.bookingFees.toLocaleString()} ₫</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isPending && onCancel && (
                <button
                  type="button"
                  onClick={() => onCancel(inv.id)}
                  disabled={isCancelling}
                  className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1.5 rounded-lg border border-red/40 text-red bg-red/5 hover:bg-red/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCancelling ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                  Cancel
                </button>
              )}
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-text-muted/70">
                {inv.status === "accepted" && <Check size={13} className="text-green-500" />}
                {inv.status !== "accepted" && inv.status !== "pending" && <X size={13} className="text-red-600" />}
                <span className="capitalize">{inv.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function InvitationSkeleton() {
  return (
    <div className="bg-surface rounded-2xl border border-border/60 overflow-hidden animate-pulse">
      <div className="flex">
        <div className="w-36 h-32 shrink-0 bg-white/5" />
        <div className="flex-1 px-5 py-4 flex flex-col gap-3">
          <div className="h-4 w-1/3 bg-white/5 rounded" />
          <div className="h-5 w-1/2 bg-white/8 rounded" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-white/5 rounded-lg" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Pagination bar ────────────────────────────────────────────────────────────
const INV_PAGE_SIZE = 5;

function PaginationBar({ page, totalPages, onPrev, onNext }: {
  page: number; totalPages: number; onPrev: () => void; onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-4 mt-6">
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

// ── Tab button ────────────────────────────────────────────────────────────────
function TabButton({ active, label, count, onClick }: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[12.5px] font-semibold transition-all duration-150 ${active
        ? "bg-white/8 text-text border border-white/12"
        : "text-text-muted hover:text-text-muted border border-transparent"
        }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-red text-text" : "bg-white/8 text-text-muted"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
interface InvitationsPageProps {
  onPendingChange?: (count: number) => void;
}

type Tab = "race" | "jockey";

const DEBOUNCE_MS = 350;

export default function InvitationsPage({ onPendingChange }: InvitationsPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("race");
  const [refreshTick, setRefreshTick] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // Live refetch when a jockey accepts/declines an invitation.
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;
    const LIVE_REFRESH_TYPES = new Set([
      "invitation_accepted",
      "invitation_declined",
      "new_invitation",
      "jockey_invited",
      "invitation_cancelled",
    ]);
    const handler = (payload: { type?: string }) => {
      if (payload?.type && LIVE_REFRESH_TYPES.has(payload.type)) {
        setRefreshTick((t) => t + 1);
      }
    };
    socket.on("notification_created", handler);
    return () => { socket.off("notification_created", handler); };
  }, [socket]);

  // Race invitations
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [raceTotalPages, setRaceTotalPages] = useState(1);
  const [loadingRace, setLoadingRace] = useState(true);
  const [errorRace, setErrorRace] = useState<string | null>(null);
  const [selected, setSelected] = useState<Invitation | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [racePage, setRacePage] = useState(1);
  const [raceSearch, setRaceSearch] = useState("");
  const [raceSearchInput, setRaceSearchInput] = useState("");

  // Jockey invitations
  const [jockeyInvs, setJockeyInvs] = useState<JockeyInvitation[]>([]);
  const [jockeyTotalPages, setJockeyTotalPages] = useState(1);
  const [loadingJockey, setLoadingJockey] = useState(true);
  const [errorJockey, setErrorJockey] = useState<string | null>(null);
  const [jockeyPage, setJockeyPage] = useState(1);
  const [jockeySearch, setJockeySearch] = useState("");
  const [jockeySearchInput, setJockeySearchInput] = useState("");
  // Jockey ids (from the current page) known to have a no-show on record —
  // reuses the same profile endpoint JockeyDetailModal uses, no new stats endpoint.
  const [noShowJockeyIds, setNoShowJockeyIds] = useState<Set<string>>(new Set());
  const [cancellingInvId, setCancellingInvId] = useState<string | null>(null);
  const [cancelInvError, setCancelInvError] = useState<string | null>(null);

  // Pending counts across ALL pages, not just the current page — the visible
  // lists are paginated (INV_PAGE_SIZE) and can be search-filtered, so counting
  // `invitations`/`jockeyInvs` directly undercounts whenever pending items sit
  // on other pages. Fetched independently via status=pending + limit=1, using
  // only the pagination total from the response.
  const [racePendingTotal, setRacePendingTotal] = useState(0);
  const [jockeyPendingTotal, setJockeyPendingTotal] = useState(0);

  // Debounce: flush input → committed search and reset page
  useEffect(() => {
    const t = setTimeout(() => { setRaceSearch(raceSearchInput); setRacePage(1); }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [raceSearchInput]);

  useEffect(() => {
    const t = setTimeout(() => { setJockeySearch(jockeySearchInput); setJockeyPage(1); }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [jockeySearchInput]);

  // Fetch race invitations (re-runs on page or search change)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoadingRace(true);
        setErrorRace(null);
        const data = await horseOwnerService.getHorseOwnerInvitations(
          racePage, INV_PAGE_SIZE, undefined, raceSearch || undefined, 'createdAt', 'desc',
        );
        if (cancelled) return;
        const raw: unknown[] = data?.data?.items ?? [];
        const mapped = raw.map((item) => mapApiToInvitation(item));
        setInvitations(mapped);
        setRaceTotalPages(data?.data?.pagination?.totalPages ?? 1);
      } catch (err: unknown) {
        if (!cancelled) setErrorRace(err instanceof Error ? err.message : "Failed to load invitations.");
      } finally {
        if (!cancelled) { setLoadingRace(false); setLastUpdated(Date.now()); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [racePage, raceSearch, refreshTick]);

  // Fetch jockey invitations (re-runs on page or search change)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoadingJockey(true);
        setErrorJockey(null);
        const data = await horseOwnerService.allJockeyInvitations(
          jockeyPage, INV_PAGE_SIZE, jockeySearch || undefined,
        );
        if (cancelled) return;
        const raw: JockeyInvitationEntry[] = data?.data?.invitations ?? [];
        setJockeyInvs(raw.map((item, i) => mapApiToJockeyInvitation(item, i)));
        setJockeyTotalPages(data?.data?.pagination?.totalPages ?? 1);
      } catch (err: unknown) {
        if (!cancelled) setErrorJockey(err instanceof Error ? err.message : "Failed to load jockey invitations.");
      } finally {
        if (!cancelled) { setLoadingJockey(false); setLastUpdated(Date.now()); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [jockeyPage, jockeySearch, refreshTick]);

  // Fetch total pending counts across all pages (unrelated to which page/search
  // the user currently has open) — drives the tab badges, the sidebar badge,
  // and the "N pending" banners.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [raceData, jockeyData] = await Promise.all([
          horseOwnerService.getHorseOwnerInvitations(1, 1, 'pending'),
          horseOwnerService.allJockeyInvitations(1, 1, undefined, 'pending'),
        ]);
        if (cancelled) return;
        setRacePendingTotal(raceData?.data?.pagination?.totalItems ?? 0);
        setJockeyPendingTotal(jockeyData?.data?.pagination?.total ?? 0);
      } catch {
        // Non-critical — badges just stay at their last known value.
      }
    }
    load();
    return () => { cancelled = true; };
  }, [refreshTick]);

  // For each distinct jockey on this page, check their history for a no-show —
  // bounded to page size, so this is a handful of parallel calls at most.
  useEffect(() => {
    let cancelled = false;
    const ids = [...new Set(jockeyInvs.map((i) => i.jockeyId).filter((id): id is string => !!id))];
    if (!ids.length) { setNoShowJockeyIds(new Set()); return; }

    Promise.all(ids.map((id) =>
      horseOwnerService.getJockeyProfile(id)
        .then((res) => ({ id, hasNoShow: !!res?.data?.recentRaces?.some((r) => r.attendance === "no_show") }))
        .catch(() => ({ id, hasNoShow: false })),
    )).then((results) => {
      if (cancelled) return;
      setNoShowJockeyIds(new Set(results.filter((r) => r.hasNoShow).map((r) => r.id)));
    });

    return () => { cancelled = true; };
  }, [jockeyInvs]);

  // Race handlers
  async function handleAccept(id: string) {
    setAcceptError(null);
    try {
      await horseOwnerService.acceptRegistration(id);
      setInvitations((prev) =>
        prev.map((i) => i.id.toString() === id ? { ...i, status: "accepted" as const } : i),
      );
      setRacePendingTotal((n) => Math.max(0, n - 1));
    } catch (err: any) {
      setAcceptError(err?.msg ?? "Failed to accept invitation.");
    }
  }

  const reject = useRejectRegistration((id) => {
    setInvitations((prev) => {
      const wasPending = prev.find((i) => i.id.toString() === id)?.status === "pending";
      if (wasPending) setRacePendingTotal((n) => Math.max(0, n - 1));
      return prev.map((i) => i.id.toString() === id ? { ...i, status: "cancelled" as const } : i);
    });
  });

  function handleDenyRequest(id: number | string) {
    const inv = invitations.find((i) => i.id === id);
    reject.requestReject(String(id), inv?.name ?? "this race");
  }

  async function handleCancelJockeyInvitation(id: string) {
    setCancelInvError(null);
    setCancellingInvId(id);
    try {
      await horseOwnerService.cancelJockeyInvitation(id);
      setJockeyInvs((prev) => {
        const next = prev.map((i) => i.id === id ? { ...i, status: "cancelled" as const } : i);
        return next;
      });
      setJockeyPendingTotal((n) => Math.max(0, n - 1));
    } catch (err: any) {
      setCancelInvError(err?.msg ?? "Failed to cancel invitation.");
    } finally {
      setCancellingInvId(null);
    }
  }

  const selectedLive = selected ? invitations.find((i) => i.id === selected.id) ?? null : null;

  // Report race pending count (across ALL pages) to the sidebar badge —
  // jockey invitations aren't counted here, only in their own tab.
  useEffect(() => {
    onPendingChange?.(racePendingTotal);
  }, [racePendingTotal, onPendingChange]);

  const pagedInvitations = invitations;
  const pagedJockeyInvs = jockeyInvs;

  return (
    <div className="flex-1 px-8 py-8 min-h-screen bg-bg flex flex-col font-sans">

      {selectedLive && (
        <InvitationDetailModal
          inv={selectedLive}
          onClose={() => setSelected(null)}
          onAccept={handleAccept}
          onDeny={handleDenyRequest}
        />
      )}

      <RejectRegistrationModal
        target={reject.target}
        pending={reject.pending}
        error={reject.error}
        onConfirm={reject.confirm}
        onCancel={reject.cancel}
      />

      <header className="pb-5 flex flex-col gap-3 border-b border-border/60 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[22px] font-bold text-text tracking-tight leading-tight truncate font-serif">
              Invitations
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[10px] font-semibold tracking-wide text-text-muted bg-white/5 px-2 py-0.5 rounded border border-border uppercase whitespace-nowrap">
                Race Management
              </span>
              <span className="text-[12px] text-text-muted truncate">
                {racePendingTotal > 0
                  ? `· ${racePendingTotal} pending`
                  : "· No pending"}
              </span>
            </div>
          </div>
          <RefetchButton onRefetch={() => setRefreshTick((t) => t + 1)} lastUpdated={lastUpdated} />
        </div>
        <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-xl w-fit">
          <TabButton active={activeTab === "race"} label="Race Invitations" count={racePendingTotal} onClick={() => { setActiveTab("race"); setRacePage(1); setRaceSearch(""); setRaceSearchInput(""); }} />
          <TabButton active={activeTab === "jockey"} label="Jockey Invitations" count={jockeyPendingTotal} onClick={() => { setActiveTab("jockey"); setJockeyPage(1); setJockeySearch(""); setJockeySearchInput(""); }} />
        </div>
      </header>
      <div className="flex-1 pt-5">

        {/* Race tab */}
        {activeTab === "race" && (
          <>
            {/* Search */}
            <div className="relative mb-5">
              <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                value={raceSearchInput}
                onChange={(e) => setRaceSearchInput(e.target.value)}
                placeholder="Search by race name…"
                className="w-full max-w-sm bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-[13px] text-text placeholder-text-muted focus:outline-none focus:border-white/25 transition-colors duration-150"
              />
            </div>

            {loadingRace && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-text-muted/70 text-[12px] mb-2"><Loader2 size={13} className="animate-spin" /> Loading invitations…</div>
                {Array.from({ length: 3 }).map((_, i) => <InvitationSkeleton key={i} />)}
              </div>
            )}
            {!loadingRace && errorRace && (
              <div className="rounded-xl border border-error-border bg-error-bg px-5 py-4 text-[13px] text-red">{errorRace}</div>
            )}
            {!loadingRace && !errorRace && invitations.length === 0 && (
              <div className="rounded-xl border border-border bg-white/3 px-5 py-8 text-center text-[13px] text-text-muted/70">
                {raceSearch ? `No results for "${raceSearch}".` : "No race invitations found."}
              </div>
            )}
            {acceptError && (
              <div className="rounded-xl border border-error-border bg-error-bg px-5 py-4 text-[13px] text-red mb-5 flex items-center justify-between gap-3">
                <span>{acceptError}</span>
                <button onClick={() => setAcceptError(null)} className="text-red/70 hover:text-red-300 shrink-0">
                  <X size={14} />
                </button>
              </div>
            )}
            {!loadingRace && !errorRace && invitations.length > 0 && (
              <>
                {racePendingTotal > 0 && !raceSearch && (
                  <p className="text-[12px] text-amber/80 font-medium mb-5">
                    {racePendingTotal} pending {racePendingTotal === 1 ? "invitation" : "invitations"} awaiting your response.
                  </p>
                )}
                <div className="space-y-4">
                  {pagedInvitations.map((inv) => (
                    <InvitationCard key={inv.id} inv={inv} onAccept={handleAccept} onDeny={handleDenyRequest} onDetail={() => setSelected(inv)} />
                  ))}
                </div>
                <PaginationBar page={racePage} totalPages={raceTotalPages} onPrev={() => setRacePage(p => p - 1)} onNext={() => setRacePage(p => p + 1)} />
              </>
            )}
          </>
        )}

        {/* Jockey tab */}
        {activeTab === "jockey" && (
          <>
            {/* Search */}
            <div className="relative mb-5">
              <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                value={jockeySearchInput}
                onChange={(e) => setJockeySearchInput(e.target.value)}
                placeholder="Search by jockey or horse name…"
                className="w-full max-w-sm bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-[13px] text-text placeholder-text-muted focus:outline-none focus:border-white/25 transition-colors duration-150"
              />
            </div>

            {loadingJockey && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-text-muted/70 text-[12px] mb-2"><Loader2 size={13} className="animate-spin" /> Loading jockey invitations…</div>
                {Array.from({ length: 3 }).map((_, i) => <InvitationSkeleton key={i} />)}
              </div>
            )}
            {!loadingJockey && errorJockey && (
              <div className="rounded-xl border border-error-border bg-error-bg px-5 py-4 text-[13px] text-red">{errorJockey}</div>
            )}
            {!loadingJockey && !errorJockey && jockeyInvs.length === 0 && (
              <div className="rounded-xl border border-border bg-white/3 px-5 py-8 text-center text-[13px] text-text-muted/70">
                {jockeySearch ? `No results for "${jockeySearch}".` : "No jockey invitations found."}
              </div>
            )}
            {!loadingJockey && !errorJockey && jockeyInvs.length > 0 && (
              <>
                {jockeyPendingTotal > 0 && !jockeySearch && (
                  <p className="text-[12px] text-amber/80 font-medium mb-5">
                    {jockeyPendingTotal} pending {jockeyPendingTotal === 1 ? "invitation" : "invitations"} awaiting jockey response.
                  </p>
                )}
                {cancelInvError && (
                  <div className="rounded-xl border border-error-border bg-error-bg px-5 py-3 mb-4 text-[13px] text-red">{cancelInvError}</div>
                )}
                <div className="space-y-4">
                  {pagedJockeyInvs.map((inv) => (
                    <JockeyInvitationCard
                      key={inv.id}
                      inv={inv}
                      hasNoShowHistory={!!inv.jockeyId && noShowJockeyIds.has(inv.jockeyId)}
                      onCancel={handleCancelJockeyInvitation}
                      isCancelling={cancellingInvId === inv.id}
                    />
                  ))}
                </div>
                <PaginationBar page={jockeyPage} totalPages={jockeyTotalPages} onPrev={() => setJockeyPage(p => p - 1)} onNext={() => setJockeyPage(p => p + 1)} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}