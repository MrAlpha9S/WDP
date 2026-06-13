import { useState, useEffect } from "react";
import {
  Calendar, MapPin, Flag, Check, X,
  Info, Ruler, Loader2, Users,
} from "lucide-react";
import { type Invitation, type InviteStatus } from "../../../types/Racingtypes";
import { horseOwnerService } from "../../../api/horseOwnerService";

// ── Status config ─────────────────────────────────────────────────────────────
const INVITE_STATUS_CFG: Record<InviteStatus, { text: string; bg: string; border: string }> = {
  pending:   { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  approved:  { text: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/30"  },
  rejected:  { text: "text-gray-500",   bg: "bg-white/5",       border: "border-white/10"      },
  verified:  { text: "text-gray-500",   bg: "bg-white/5",       border: "border-white/10"      },
  failed:    { text: "text-gray-500",   bg: "bg-white/5",       border: "border-white/10"      },
  cancelled: { text: "text-gray-500",   bg: "bg-white/5",       border: "border-white/10"      },
};

function formatDate(isoString: string): string {
  return isoString.split("T")[0];
}

function normalizeInviteStatus(value: unknown): InviteStatus {
  if (
    value === "pending"   ||
    value === "approved"  ||
    value === "rejected"  ||
    value === "verified"  ||
    value === "failed"    ||
    value === "cancelled"
  ) return value;
  return "pending";
}

// ── Mappers ───────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiToInvitation(raw: any): Invitation {
  return {
    id:       raw.registration._id          ?? "Unknown",
    name:     raw.raceRound?.roundName      ?? raw.name      ?? "Unnamed Race",
    type:     raw.raceRound?.raceDate       ?? raw.type      ?? "Race",
    status:   normalizeInviteStatus(raw.registration?.registrationStatus),
    date:     raw.raceRound?.raceDate ? formatDate(raw.raceRound.raceDate) : "TBA",
    venue:    raw.raceRound?.location       ?? raw.location  ?? "TBA",
    prize:    raw.prizePool                 ?? raw.prize     ?? "TBA",
    grade:    raw.grade                                      ?? "TBA",
    distance: raw.raceRound?.trackLength    ?? "TBA",
    horse:    raw.horseName                 ?? raw.horse?.horseName ?? "TBA",
    jockey:   raw.jockeyName                ?? raw.jockey    ?? "TBA",
    sentBy:   raw.sentBy                    ?? raw.organizer ?? "Organizer",
    sentAt:   raw.sentAt                    ?? raw.createdAt ?? "",
    image:    raw.image                     ?? raw.coverImage ?? "/placeholder-race.jpg",
  };
}

interface JockeyInvitation {
  id: string;
  jockeyName: string;
  jockeyImage: string | null;
  raceName: string;
  raceDate: string;
  venue: string;
  horse: string;
  status: InviteStatus;
  sentAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiToJockeyInvitation(raw: any, i: number): JockeyInvitation {
  return {
    id:          raw._id                                     ?? String(i),
    jockeyName:  raw.jockeyName  ?? raw.jockey?.fullName     ?? "Unknown Jockey",
    jockeyImage: raw.jockeyImage ?? raw.jockey?.image        ?? null,
    raceName:    raw.raceName    ?? raw.raceRound?.roundName  ?? "Unnamed Race",
    raceDate:    raw.raceDate    ? formatDate(raw.raceDate)
                                 : raw.raceRound?.raceDate
                                   ? formatDate(raw.raceRound.raceDate)
                                   : "TBA",
    venue:       raw.venue       ?? raw.raceRound?.location  ?? "TBA",
    horse:       raw.horseName   ?? raw.horse?.horseName     ?? "TBA",
    status:      normalizeInviteStatus(raw.status            ?? raw.registrationStatus),
    sentAt:      raw.sentAt      ?? raw.createdAt            ?? "",
  };
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function InvitationDetailModal({
  inv, onClose, onAccept, onDeny,
}: {
  inv:      Invitation;
  onClose:  () => void;
  onAccept: (id: string) => void;
  onDeny:   (id: number | string) => void;
}) {
  const stCfg     = INVITE_STATUS_CFG[inv.status] ?? INVITE_STATUS_CFG.pending;
  const isPending = inv.status === "pending";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[90vh]">

        <div className="relative h-52 shrink-0 overflow-hidden bg-[#111]">
          <img src={inv.image} alt={inv.name} className={`w-full h-full object-cover ${!isPending ? "brightness-60" : "brightness-75"}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/20 to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 border border-white/15 flex items-center justify-center text-gray-400 hover:text-white hover:bg-black/80 transition-colors duration-150">
            <X size={14} />
          </button>
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="text-[10px] font-semibold tracking-widest text-gray-300 uppercase px-2.5 py-1 rounded-full bg-black/60 border border-white/15 backdrop-blur-sm">{inv.type}</span>
            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border backdrop-blur-sm ${stCfg.text} ${stCfg.bg} ${stCfg.border}`}>{inv.status}</span>
          </div>
          <div className="absolute bottom-4 left-5 right-5">
            <h2 className="text-[24px] font-bold text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>{inv.name}</h2>
            <p className="text-[11.5px] text-gray-400 mt-0.5">Invited by {inv.sentBy} · {inv.sentAt}</p>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Calendar size={13} className="text-red-400"    />, label: "Date & Time", value: inv.date     },
              { icon: <MapPin   size={13} className="text-blue-400"   />, label: "Venue",        value: inv.venue    },
              { icon: <Flag     size={13} className="text-purple-400" />, label: "Grade",        value: inv.grade    },
              { icon: <Ruler    size={13} className="text-green-400"  />, label: "Distance",     value: inv.distance },
            ].map((item) => (
              <div key={item.label} className="bg-[#141414] rounded-xl px-4 py-3 border border-white/6 flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{item.icon}</div>
                <div>
                  <p className="text-[10px] font-semibold tracking-widest text-gray-600 uppercase mb-0.5">{item.label}</p>
                  <p className="text-[13px] font-semibold text-white leading-snug">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/8 bg-[#1a1a1a] shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-white/12 text-gray-400 text-[13px] font-semibold hover:border-white/25 hover:text-white transition-all duration-150">
            Close
          </button>
          {isPending && (
            <>
              <button onClick={() => { onDeny(inv.id); onClose(); }} className="flex-1 py-2.5 rounded-lg border border-red-700/50 text-red-400 text-[13px] font-semibold hover:bg-red-700/10 transition-all duration-150 flex items-center justify-center gap-2">
                <X size={14} /> Deny
              </button>
              <button onClick={() => { onAccept(inv.id.toString()); onClose(); }} className="flex-1 py-2.5 rounded-lg bg-green-700 hover:bg-green-600 text-white text-[13px] font-bold transition-colors duration-150 shadow-lg shadow-green-900/30 flex items-center justify-center gap-2">
                <Check size={14} /> Accept
              </button>
            </>
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
  inv:      Invitation;
  onAccept: (id: string) => void;
  onDeny:   (id: number | string) => void;
  onDetail: () => void;
}) {
  const stCfg     = INVITE_STATUS_CFG[inv.status] ?? INVITE_STATUS_CFG.pending;
  const isPending = inv.status === "pending";

  return (
    <div className={`bg-[#1a1a1a] rounded-2xl border overflow-hidden transition-all duration-200 ${isPending ? "border-white/8 hover:border-white/15" : "border-white/5 opacity-75"}`}>
      <div className="flex">
        <div className="relative w-36 shrink-0 overflow-hidden">
          <img src={inv.image} alt={inv.name} className={`w-full h-full object-cover ${!isPending ? "grayscale brightness-40" : "brightness-75"}`} />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1a1a1a]" />
        </div>
        <div className="flex-1 px-5 py-4 flex flex-col gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-semibold tracking-widest text-gray-600 uppercase px-2 py-0.5 rounded bg-white/5 border border-white/8">{inv.type}</span>
              <span className={`text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded border ${stCfg.text} ${stCfg.bg} ${stCfg.border}`}>{inv.status}</span>
            </div>
            <h3 className="text-[16px] font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{inv.name}</h3>
            <p className="text-[11px] text-gray-600 mt-0.5">Sent by {inv.sentBy} · {inv.sentAt}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Calendar size={11} />, label: "Date",  value: inv.date  },
              { icon: <MapPin   size={11} />, label: "Venue", value: inv.venue },
              { icon: <Flag     size={11} />, label: "Grade", value: inv.grade },
            ].map((item) => (
              <div key={item.label} className="bg-[#141414] rounded-lg px-3 py-2 border border-white/6">
                <div className="flex items-center gap-1 text-gray-600 mb-1">
                  {item.icon}
                  <span className="text-[9.5px] font-semibold tracking-widest uppercase">{item.label}</span>
                </div>
                <p className="text-[12px] font-semibold text-white leading-snug truncate">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {[
                { label: "Horse",    value: inv.horse,    accent: true  },
                { label: "Jockey",   value: inv.jockey,   accent: true  },
                { label: "Distance", value: inv.distance, accent: false },
              ].map((f) => (
                <div key={f.label}>
                  <p className="text-[9.5px] font-semibold tracking-widest text-gray-600 uppercase mb-0.5">{f.label}</p>
                  <p className={`text-[12.5px] font-semibold ${f.accent ? "text-red-400" : "text-white"}`}>{f.value}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onDetail} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-white/12 text-gray-400 text-[12px] font-semibold hover:border-white/28 hover:text-white transition-all duration-150">
                <Info size={13} /> Detail
              </button>
              {isPending ? (
                <>
                  <button onClick={() => onDeny(inv.id)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-white/12 text-gray-400 text-[12px] font-semibold hover:border-red-700/50 hover:text-red-400 transition-all duration-150">
                    <X size={13} /> Deny
                  </button>
                  <button onClick={() => onAccept(inv.id.toString())} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white text-[12px] font-semibold transition-colors duration-150 shadow-lg shadow-green-900/30">
                    <Check size={13} /> Accept
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-600">
                  {inv.status === "approved" ? <Check size={13} className="text-green-500" /> : <X size={13} className="text-red-600" />}
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
  inv, onAccept, onDeny,
}: {
  inv:      JockeyInvitation;
  onAccept: (id: string) => void;
  onDeny:   (id: string) => void;
}) {
  const stCfg     = INVITE_STATUS_CFG[inv.status] ?? INVITE_STATUS_CFG.pending;
  const isPending = inv.status === "pending";

  return (
    <div className={`bg-[#1a1a1a] rounded-2xl border overflow-hidden transition-all duration-200 ${isPending ? "border-white/8 hover:border-white/15" : "border-white/5 opacity-75"}`}>
      <div className="flex">
        <div className="relative w-36 shrink-0 overflow-hidden bg-[#111] flex items-center justify-center">
          {inv.jockeyImage ? (
            <img src={inv.jockeyImage} alt={inv.jockeyName} className={`w-full h-full object-cover object-top ${!isPending ? "grayscale brightness-40" : "brightness-75"}`} />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#2a2a2a] border border-white/10 flex items-center justify-center">
              <Users size={22} className="text-gray-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1a1a1a]" />
        </div>

        <div className="flex-1 px-5 py-4 flex flex-col gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-semibold tracking-widest text-gray-600 uppercase px-2 py-0.5 rounded bg-white/5 border border-white/8">Jockey</span>
              <span className={`text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded border ${stCfg.text} ${stCfg.bg} ${stCfg.border}`}>{inv.status}</span>
            </div>
            <h3 className="text-[16px] font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{inv.jockeyName}</h3>
            <p className="text-[11px] text-gray-600 mt-0.5">{inv.sentAt ? formatDate(inv.sentAt) : ""}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Flag     size={11} />, label: "Race",  value: inv.raceName },
              { icon: <Calendar size={11} />, label: "Date",  value: inv.raceDate },
              { icon: <MapPin   size={11} />, label: "Venue", value: inv.venue    },
            ].map((item) => (
              <div key={item.label} className="bg-[#141414] rounded-lg px-3 py-2 border border-white/6">
                <div className="flex items-center gap-1 text-gray-600 mb-1">
                  {item.icon}
                  <span className="text-[9.5px] font-semibold tracking-widest uppercase">{item.label}</span>
                </div>
                <p className="text-[12px] font-semibold text-white leading-snug truncate">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9.5px] font-semibold tracking-widest text-gray-600 uppercase mb-0.5">Horse</p>
              <p className="text-[12.5px] font-semibold text-red-400">{inv.horse}</p>
            </div>
            <div className="flex items-center gap-2">
              {isPending ? (
                <>
                  <button onClick={() => onDeny(inv.id)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-white/12 text-gray-400 text-[12px] font-semibold hover:border-red-700/50 hover:text-red-400 transition-all duration-150">
                    <X size={13} /> Deny
                  </button>
                  <button onClick={() => onAccept(inv.id)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white text-[12px] font-semibold transition-colors duration-150 shadow-lg shadow-green-900/30">
                    <Check size={13} /> Accept
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-600">
                  {inv.status === "approved" ? <Check size={13} className="text-green-500" /> : <X size={13} className="text-red-600" />}
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

// ── Skeleton ──────────────────────────────────────────────────────────────────
function InvitationSkeleton() {
  return (
    <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden animate-pulse">
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
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[12.5px] font-semibold transition-all duration-150 ${
        active
          ? "bg-white/8 text-white border border-white/12"
          : "text-gray-500 hover:text-gray-300 border border-transparent"
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-red-700 text-white" : "bg-white/8 text-gray-500"}`}>
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

export default function InvitationsPage({ onPendingChange }: InvitationsPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("race");

  // Race invitations
  const [invitations,   setInvitations]   = useState<Invitation[]>([]);
  const [loadingRace,   setLoadingRace]   = useState(true);
  const [errorRace,     setErrorRace]     = useState<string | null>(null);
  const [selected,      setSelected]      = useState<Invitation | null>(null);

  // Jockey invitations
  const [jockeyInvs,    setJockeyInvs]    = useState<JockeyInvitation[]>([]);
  const [loadingJockey, setLoadingJockey] = useState(true);
  const [errorJockey,   setErrorJockey]   = useState<string | null>(null);

  // Fetch race invitations
  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        setLoadingRace(true);
        setErrorRace(null);
        const data = await horseOwnerService.getHorseOwnerInvitations();
        if (cancelled) return;
        const raw: unknown[] = Array.isArray(data) ? data : (data?.data ?? []);
        const mapped = raw.map((item) => mapApiToInvitation(item));
        setInvitations(mapped);
        onPendingChange?.(mapped.filter((i) => i.status === "pending").length);
      } catch (err: unknown) {
        if (!cancelled) setErrorRace(err instanceof Error ? err.message : "Failed to load invitations.");
      } finally {
        if (!cancelled) setLoadingRace(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, [onPendingChange]);

  // Fetch jockey invitations
  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        setLoadingJockey(true);
        setErrorJockey(null);
        const data = await horseOwnerService.allJockeyInvitations();
        if (cancelled) return;
        const raw: unknown[] = data?.data?.invitations ?? data?.data ?? (Array.isArray(data) ? data : []);
        setJockeyInvs(raw.map((item, i) => mapApiToJockeyInvitation(item, i)));
      } catch (err: unknown) {
        if (!cancelled) setErrorJockey(err instanceof Error ? err.message : "Failed to load jockey invitations.");
      } finally {
        if (!cancelled) setLoadingJockey(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, []);

  // Race handlers
  async function handleAccept(id: string) {
    await horseOwnerService.approveRegistration(id);
    setInvitations((prev) => {
      const next = prev.map((i) => i.id.toString() === id ? { ...i, status: "approved" as const } : i);
      onPendingChange?.(next.filter((i) => i.status === "pending").length);
      return next;
    });
  }

  function handleDeny(id: number | string) {
    setInvitations((prev) => {
      const next = prev.map((i) => i.id === id ? { ...i, status: "rejected" as const } : i);
      onPendingChange?.(next.filter((i) => i.status === "pending").length);
      return next;
    });
  }

  // Jockey handlers (optimistic — wire to API when endpoint is available)
  function handleJockeyAccept(id: string) {
    setJockeyInvs((prev) => prev.map((i) => i.id === id ? { ...i, status: "approved" as const } : i));
  }
  function handleJockeyDeny(id: string) {
    setJockeyInvs((prev) => prev.map((i) => i.id === id ? { ...i, status: "rejected" as const } : i));
  }

  const racePendingCount   = invitations.filter((i) => i.status === "pending").length;
  const jockeyPendingCount = jockeyInvs.filter((i)  => i.status === "pending").length;
  const selectedLive       = selected ? invitations.find((i) => i.id === selected.id) ?? null : null;

  return (
    <div className="flex-1 px-8 py-8 min-h-screen bg-[#111111]" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {selectedLive && (
        <InvitationDetailModal
          inv={selectedLive}
          onClose={() => setSelected(null)}
          onAccept={handleAccept}
          onDeny={handleDeny}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <p className="text-[11px] font-bold tracking-[0.2em] text-gray-600 uppercase mb-1">Race Management</p>
        <h1 className="text-[32px] font-bold text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
          Invitations
        </h1>
        <p className="text-[13px] text-gray-500 mt-1">View and respond to exclusive race and tournament invitations.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 p-1 bg-[#1a1a1a] border border-white/8 rounded-xl w-fit">
        <TabButton active={activeTab === "race"}   label="Race Invitations"   count={racePendingCount}   onClick={() => setActiveTab("race")}   />
        <TabButton active={activeTab === "jockey"} label="Jockey Invitations" count={jockeyPendingCount} onClick={() => setActiveTab("jockey")} />
      </div>

      {/* Race tab */}
      {activeTab === "race" && (
        <>
          {loadingRace && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-600 text-[12px] mb-2"><Loader2 size={13} className="animate-spin" /> Loading invitations…</div>
              {Array.from({ length: 3 }).map((_, i) => <InvitationSkeleton key={i} />)}
            </div>
          )}
          {!loadingRace && errorRace && (
            <div className="rounded-xl border border-red-700/30 bg-red-900/10 px-5 py-4 text-[13px] text-red-400">{errorRace}</div>
          )}
          {!loadingRace && !errorRace && invitations.length === 0 && (
            <div className="rounded-xl border border-white/8 bg-white/3 px-5 py-8 text-center text-[13px] text-gray-600">No race invitations found.</div>
          )}
          {!loadingRace && !errorRace && invitations.length > 0 && (
            <>
              {racePendingCount > 0 && (
                <p className="text-[12px] text-yellow-500/80 font-medium mb-5">
                  {racePendingCount} pending {racePendingCount === 1 ? "invitation" : "invitations"} awaiting your response.
                </p>
              )}
              <div className="space-y-4">
                {invitations.slice().sort((a) => (a.status === "pending" ? -1 : 1)).map((inv) => (
                  <InvitationCard key={inv.id} inv={inv} onAccept={handleAccept} onDeny={handleDeny} onDetail={() => setSelected(inv)} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Jockey tab */}
      {activeTab === "jockey" && (
        <>
          {loadingJockey && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-600 text-[12px] mb-2"><Loader2 size={13} className="animate-spin" /> Loading jockey invitations…</div>
              {Array.from({ length: 3 }).map((_, i) => <InvitationSkeleton key={i} />)}
            </div>
          )}
          {!loadingJockey && errorJockey && (
            <div className="rounded-xl border border-red-700/30 bg-red-900/10 px-5 py-4 text-[13px] text-red-400">{errorJockey}</div>
          )}
          {!loadingJockey && !errorJockey && jockeyInvs.length === 0 && (
            <div className="rounded-xl border border-white/8 bg-white/3 px-5 py-8 text-center text-[13px] text-gray-600">No jockey invitations found.</div>
          )}
          {!loadingJockey && !errorJockey && jockeyInvs.length > 0 && (
            <>
              {jockeyPendingCount > 0 && (
                <p className="text-[12px] text-yellow-500/80 font-medium mb-5">
                  {jockeyPendingCount} pending {jockeyPendingCount === 1 ? "invitation" : "invitations"} awaiting your response.
                </p>
              )}
              <div className="space-y-4">
                {jockeyInvs.slice().sort((a) => (a.status === "pending" ? -1 : 1)).map((inv) => (
                  <JockeyInvitationCard key={inv.id} inv={inv} onAccept={handleJockeyAccept} onDeny={handleJockeyDeny} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}