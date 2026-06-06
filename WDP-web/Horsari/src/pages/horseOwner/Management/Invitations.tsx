import { useState, useEffect } from "react";
import {
  Calendar, MapPin, Trophy, Flag, Check, X,
  Info, Users, Ruler, DollarSign, Clock, Loader2,
} from "lucide-react";
import { type Invitation, type InviteStatus } from "../../../types/Racingtypes";
import { horseOwnerService } from "../../../api/horseOwnerService";

// ── Status config ─────────────────────────────────────────────────────────────
const INVITE_STATUS_CFG: Record<InviteStatus, { text: string; bg: string; border: string }> = {
  pending:  { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  approved: { text: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/30"  },
  rejected:   { text: "text-gray-500",   bg: "bg-white/5",       border: "border-white/10"       },
  verified:   { text: "text-gray-500",   bg: "bg-white/5",       border: "border-white/10"       },
  failed:   { text: "text-gray-500",   bg: "bg-white/5",       border: "border-white/10"       },
  cancelled:   { text: "text-gray-500",   bg: "bg-white/5",       border: "border-white/10"       },
};

function formatDate(isoString: string): string {
  return isoString.split("T")[0];
}

// ── API response → Invitation mapper ─────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiToInvitation(raw: any): Invitation {
  console.log('RES: ', raw)
  return {
    id:       raw.registration._id ?? 'Unknow',
    name:     raw.raceRound.roundName     ?? raw.name      ?? "Unnamed Race",
    type:     raw.raceRound.raceDate     ?? raw.type      ?? "Race",
    status:   (raw.registration.registrationStatus as InviteStatus)      ?? "pending",
    date:     formatDate(raw.raceRound.raceDate )    ?? raw.date      ?? "TBA",
    venue:    raw.raceRound.location        ?? raw.location  ?? "TBA",
    prize:    raw.prizePool    ?? raw.prize     ?? "TBA",
    grade:    raw.grade                         ?? "TBA",
    distance: raw.raceRound.trackLength          ?? "TBA",
    horse:    raw.horseName    ?? raw.horse?.horseName ?? "TBA",
    jockey:   raw.jockeyName   ?? raw.jockey    ?? "TBA",
    sentBy:   raw.sentBy       ?? raw.organizer ?? "Organizer",
    sentAt:   raw.sentAt       ?? raw.createdAt ?? "",
    image:    raw.image        ?? raw.coverImage ?? "/placeholder-race.jpg",
  };
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function InvitationDetailModal({
  inv,
  onClose,
  onAccept,
  onDeny,
}: {
  inv:      Invitation;
  onClose:  () => void;
  onAccept: (id: string) => void;
  onDeny:   (id: number | string) => void;
}) {
  const stCfg     = INVITE_STATUS_CFG[inv.status];
  const isPending = inv.status === "pending";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Hero image */}
        <div className="relative h-52 shrink-0 overflow-hidden bg-[#111]">
          <img
            src={inv.image}
            alt={inv.name}
            className={`w-full h-full object-cover ${!isPending ? "brightness-60" : "brightness-75"}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/20 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 border border-white/15 flex items-center justify-center text-gray-400 hover:text-white hover:bg-black/80 transition-colors duration-150"
          >
            <X size={14} />
          </button>

          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="text-[10px] font-semibold tracking-widest text-gray-300 uppercase px-2.5 py-1 rounded-full bg-black/60 border border-white/15 backdrop-blur-sm">
              {inv.type}
            </span>
            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border backdrop-blur-sm ${stCfg.text} ${stCfg.bg} ${stCfg.border}`}>
              {inv.status}
            </span>
          </div>

          <div className="absolute bottom-4 left-5 right-5">
            <h2 className="text-[24px] font-bold text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              {inv.name}
            </h2>
            <p className="text-[11.5px] text-gray-400 mt-0.5">
              Invited by {inv.sentBy} · {inv.sentAt}
            </p>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Calendar  size={13} className="text-red-400"    />, label: "Date & Time",   value: inv.date     },
              { icon: <MapPin    size={13} className="text-blue-400"   />, label: "Venue",          value: inv.venue    },
              // { icon: <Trophy    size={13} className="text-yellow-400" />, label: "Prize Pool",     value: inv.prize    },
              { icon: <Flag      size={13} className="text-purple-400" />, label: "Grade",          value: inv.grade    },
              { icon: <Ruler     size={13} className="text-green-400"  />, label: "Distance",       value: inv.distance },
              // { icon: <Clock     size={13} className="text-orange-400" />, label: "Entry Deadline", value: "7 days left" },
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

          {/* <div>
            <p className="text-[10.5px] font-semibold tracking-widest text-gray-600 uppercase mb-2.5">Your Entry</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#141414] rounded-xl px-4 py-3 border border-white/6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-900/40 flex items-center justify-center shrink-0">
                  <Flag size={14} className="text-red-400" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold tracking-widest text-gray-600 uppercase mb-0.5">Horse</p>
                  <p className="text-[13px] font-bold text-red-400">{inv.horse}</p>
                </div>
              </div>
              <div className="bg-[#141414] rounded-xl px-4 py-3 border border-white/6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-900/40 flex items-center justify-center shrink-0">
                  <Users size={14} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold tracking-widest text-gray-600 uppercase mb-0.5">Jockey</p>
                  <p className="text-[13px] font-bold text-red-400">{inv.jockey}</p>
                </div>
              </div>
            </div>
          </div> */}

          {/* <div className="bg-[#141414] rounded-xl px-4 py-3 border border-white/6 flex items-center gap-3">
            <DollarSign size={14} className="text-green-400 shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] font-semibold tracking-widest text-gray-600 uppercase mb-0.5">Entry Fee</p>
              <p className="text-[13px] font-semibold text-white">Covered by organizer · No cost to enter</p>
            </div>
          </div> */}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/8 bg-[#1a1a1a] shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-white/12 text-gray-400 text-[13px] font-semibold hover:border-white/25 hover:text-white transition-all duration-150"
          >
            Close
          </button>
          {isPending && (
            <>
              <button
                onClick={() => { onDeny(inv.id); onClose(); }}
                className="flex-1 py-2.5 rounded-lg border border-red-700/50 text-red-400 text-[13px] font-semibold hover:bg-red-700/10 transition-all duration-150 flex items-center justify-center gap-2"
              >
                <X size={14} /> Deny
              </button>
              <button
                onClick={() => { onAccept(inv.id.toString()); onClose(); }}
                className="flex-1 py-2.5 rounded-lg bg-green-700 hover:bg-green-600 text-white text-[13px] font-bold transition-colors duration-150 shadow-lg shadow-green-900/30 flex items-center justify-center gap-2"
              >
                <Check size={14} /> Accept
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Invitation Card ───────────────────────────────────────────────────────────
function InvitationCard({
  inv,
  onAccept,
  onDeny,
  onDetail,
}: {
  inv:      Invitation;
  onAccept: (id: string) => void;
  onDeny:   (id: number | string) => void;
  onDetail: () => void;
}) {
  const stCfg     = INVITE_STATUS_CFG[inv.status];
  const isPending = inv.status === "pending";

  console.log('INV: ', inv)

  return (
    <div
      className={`bg-[#1a1a1a] rounded-2xl border overflow-hidden transition-all duration-200 ${
        isPending ? "border-white/8 hover:border-white/15" : "border-white/5 opacity-75"
      }`}
    >
      <div className="flex">
        <div className="relative w-36 shrink-0 overflow-hidden">
          <img
            src={inv.image}
            alt={inv.name}
            className={`w-full h-full object-cover ${!isPending ? "grayscale brightness-40" : "brightness-75"}`}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1a1a1a]" />
        </div>

        <div className="flex-1 px-5 py-4 flex flex-col gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-semibold tracking-widest text-gray-600 uppercase px-2 py-0.5 rounded bg-white/5 border border-white/8">
                {inv.type}
              </span>
              <span className={`text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded border ${stCfg.text} ${stCfg.bg} ${stCfg.border}`}>
                {inv.status}
              </span>
            </div>
            <h3 className="text-[16px] font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              {inv.name}
            </h3>
            <p className="text-[11px] text-gray-600 mt-0.5">
              Sent by {inv.sentBy} · {inv.sentAt}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: <Calendar size={11} />, label: "Date",       value: inv.date  },
              { icon: <MapPin   size={11} />, label: "Venue",      value: inv.venue },
              // { icon: <Trophy   size={11} />, label: "Prize Pool", value: inv.prize },
              { icon: <Flag     size={11} />, label: "Grade",      value: inv.grade },
            ].map((item) => (
              <div key={item.label} className="bg-[#141414] rounded-lg px-3 py-2 border border-white/6">
                <div className="flex items-center gap-1 text-gray-600 mb-1">
                  {item.icon}
                  <span className="text-[9.5px] font-semibold tracking-widest uppercase">{item.label}</span>
                </div>
                <p className="text-[12px] font-semibold text-white leading-snug">{item.value}</p>
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
              <button
                onClick={onDetail}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-white/12 text-gray-400 text-[12px] font-semibold hover:border-white/28 hover:text-white transition-all duration-150"
              >
                <Info size={13} /> Detail
              </button>

              {isPending ? (
                <>
                  <button
                    onClick={() => onDeny(inv.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-white/12 text-gray-400 text-[12px] font-semibold hover:border-red-700/50 hover:text-red-400 transition-all duration-150"
                  >
                    <X size={13} /> Deny
                  </button>
                  <button
                    onClick={() => onAccept(inv.id.toString())}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white text-[12px] font-semibold transition-colors duration-150 shadow-lg shadow-green-900/30"
                  >
                    <Check size={13} /> Accept
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-600">
                  {inv.status === "approved"
                    ? <Check size={13} className="text-green-500" />
                    : <X     size={13} className="text-red-600"   />
                  }
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

// ── Loading skeleton ──────────────────────────────────────────────────────────
function InvitationSkeleton() {
  return (
    <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden animate-pulse">
      <div className="flex">
        <div className="w-36 h-32 shrink-0 bg-white/5" />
        <div className="flex-1 px-5 py-4 flex flex-col gap-3">
          <div className="h-4 w-1/3 bg-white/5 rounded" />
          <div className="h-5 w-1/2 bg-white/8 rounded" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-white/5 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
interface InvitationsPageProps {
  onPendingChange?: (count: number) => void;
}

export default function InvitationsPage({ onPendingChange }: InvitationsPageProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [selected,    setSelected]    = useState<Invitation | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  // ── Fetch on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchInvitations() {
      try {
        setLoading(true);
        setError(null);
        const data = await horseOwnerService.getHorseOwnerInvitations();


        if (cancelled) return;

        // API may return { data: [...] } or a bare array
        const raw: unknown[] = Array.isArray(data) ? data : (data?.data ?? []);
        const mapped = raw.map((item) => mapApiToInvitation(item));
        console.log('mapped: ', mapped)

        setInvitations(mapped);
        onPendingChange?.(mapped.filter((i) => i.status === "pending").length);
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : typeof err === "object" && err !== null && "message" in err
                ? String((err as { message: unknown }).message)
                : "Failed to load invitations.";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchInvitations();
    return () => { cancelled = true; };
  }, [onPendingChange]);

  // ── Local status mutations (optimistic) ────────────────────────────────────
  async function handleAccept(id: string) {
    await horseOwnerService.approveRegistration(id)
    setInvitations((prev) => {
      const next = prev.map((i) => i.id.toString() === id ? { ...i, status: "Accepted" as InviteStatus } : i);
      onPendingChange?.(next.filter((i) => i.status === "pending").length);
      return next;
    });
  }

  function handleDeny(id: number | string) {
    setInvitations((prev) => {
      const next = prev.map((i) => i.id === id ? { ...i, status: "Denied" as InviteStatus } : i);
      onPendingChange?.(next.filter((i) => i.status === "pending").length);
      return next;
    });
  }

  const pendingCount  = invitations.filter((i) => i.status === "pending").length;
  const selectedLive  = selected
    ? invitations.find((i) => i.id === selected.id) ?? null
    : null;

  return (
    <div
      className="flex-1 px-8 py-8 min-h-screen bg-[#111111]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
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
        <p className="text-[11px] font-bold tracking-[0.2em] text-gray-600 uppercase mb-1">
          Race Management
        </p>
        <h1 className="text-[32px] font-bold text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
          Invitations
        </h1>
        <p className="text-[13px] text-gray-500 mt-1">
          View and respond to exclusive race and tournament invitations.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-600 text-[12px] mb-2">
            <Loader2 size={13} className="animate-spin" />
            Loading invitations…
          </div>
          {Array.from({ length: 3 }).map((_, i) => <InvitationSkeleton key={i} />)}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border border-red-700/30 bg-red-900/10 px-5 py-4 text-[13px] text-red-400">
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && invitations.length === 0 && (
        <div className="rounded-xl border border-white/8 bg-white/3 px-5 py-8 text-center text-[13px] text-gray-600">
          No invitations found.
        </div>
      )}

      {/* List */}
      {!loading && !error && invitations.length > 0 && (
        <>
          {pendingCount > 0 && (
            <p className="text-[12px] text-yellow-500/80 font-medium mb-5">
              {pendingCount} pending {pendingCount === 1 ? "invitation" : "invitations"} awaiting your response.
            </p>
          )}
          <div className="space-y-4">
            {invitations
              .slice()
              .sort((a, b) => (a.status === "pending" ? -1 : 1))
              .map((inv) => (
                <InvitationCard
                  key={inv.id}
                  inv={inv}
                  onAccept={handleAccept}
                  onDeny={handleDeny}
                  onDetail={() => setSelected(inv)}
                />
              ))}
          </div>
        </>
      )}
    </div>
  );
}