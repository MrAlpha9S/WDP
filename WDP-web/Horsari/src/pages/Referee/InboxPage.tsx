import { useState } from "react";
import {
    CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
    Clock, CreditCard, Flag, MapPin, XCircle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type InviteStatus = "pending" | "accepted" | "declined";
type PaymentStatus = "unpaid" | "processing" | "paid";
type RaceType = "Stakes" | "Allowance" | "Claiming" | "Maiden";
type GradeLevel = "G1" | "G2" | "G3" | "Listed" | "Open";

interface RaceInvite {
    id: string;
    race: string;
    raceLabel: string;
    venue: string;
    trackLocation: string;
    date: string;
    time: string;
    role: string;
    sentAt: string;
    status: InviteStatus;
    isNew?: boolean;
    raceType: RaceType;
    gradeLevel: GradeLevel;
    distance: string;
    track: string;
    entries: number;
    assignedBy: string;
    notes: string;
    fee: number;
    paymentStatus: PaymentStatus;
    paymentMethod?: string;
    paidOn?: string;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const INVITES: RaceInvite[] = [
    {
        id: "INV-3041", race: "R-1005", raceLabel: "The Pegasus Cup",
        venue: "Churchill Downs", trackLocation: "Louisville, KY, USA",
        date: "Nov 2, 2024", time: "3:30 PM ET",
        role: "Head Referee", sentAt: "2 hours ago", status: "pending", isNew: true,
        raceType: "Stakes", gradeLevel: "G1", distance: "1 1/8 Miles", track: "Dirt, Fast",
        entries: 14, assignedBy: "James Whitfield",
        notes: "High-profile Grade I race. Full stewards panel required on site by 1:00 PM.",
        fee: 850, paymentStatus: "unpaid",
    },
    {
        id: "INV-3039", race: "R-1002", raceLabel: "Dubai World Sprint",
        venue: "Meydan Racecourse", trackLocation: "Dubai, UAE",
        date: "Nov 5, 2024", time: "7:00 PM GST",
        role: "Gate Referee", sentAt: "5 hours ago", status: "pending", isNew: true,
        raceType: "Allowance", gradeLevel: "Open", distance: "6 Furlongs", track: "Turf, Good",
        entries: 10, assignedBy: "Amir Al-Hassan",
        notes: "International event. Gate inspection required 90 minutes prior to post time.",
        fee: 620, paymentStatus: "unpaid",
    },
    {
        id: "INV-3035", race: "R-998", raceLabel: "Ascot Gold Cup",
        venue: "Ascot Racecourse", trackLocation: "Ascot, Berkshire, UK",
        date: "Nov 8, 2024", time: "2:15 PM GMT",
        role: "Track Referee", sentAt: "Yesterday", status: "pending",
        raceType: "Stakes", gradeLevel: "G1", distance: "2 Miles 4 Furlongs", track: "Turf, Soft",
        entries: 12, assignedBy: "Oliver Hartley",
        notes: "Longest flat race of the season. Track condition report expected morning of race.",
        fee: 700, paymentStatus: "unpaid",
    },
    {
        id: "INV-3028", race: "R-990", raceLabel: "Ascot Stakes",
        venue: "Ascot Racecourse", trackLocation: "Ascot, Berkshire, UK",
        date: "Oct 24, 2024", time: "4:00 PM GMT",
        role: "Head Referee", sentAt: "3 days ago", status: "accepted",
        raceType: "Claiming", gradeLevel: "G3", distance: "1 Mile", track: "Turf, Good",
        entries: 11, assignedBy: "Oliver Hartley",
        notes: "Standard Grade III. Brief pre-race debrief with stewards at 2:30 PM.",
        fee: 780, paymentStatus: "processing", paymentMethod: "Bank Transfer",
    },
    {
        id: "INV-3021", race: "R-985", raceLabel: "Kentucky Prep",
        venue: "Churchill Downs", trackLocation: "Louisville, KY, USA",
        date: "Oct 20, 2024", time: "1:00 PM ET",
        role: "Gate Referee", sentAt: "5 days ago", status: "declined",
        raceType: "Maiden", gradeLevel: "Open", distance: "7 Furlongs", track: "Dirt, Fast",
        entries: 9, assignedBy: "James Whitfield",
        notes: "Prep race for the Kentucky Derby. Standard gate protocols apply.",
        fee: 500, paymentStatus: "unpaid",
    },
];

const RACE_TYPE_DESCRIPTIONS: Record<RaceType, string> = {
    Stakes: "Top tier — highest prize money.",
    Allowance: "Mid-level — horses that have won but aren't ready for stakes.",
    Claiming: "Any owner can purchase a horse at the listed price before the race.",
    Maiden: "For horses that have never won a race.",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: InviteStatus }) {
    const cfg = {
        pending: "border-yellow-700/60 text-yellow-400 bg-yellow-500/10",
        accepted: "border-green-700/60 text-green-400 bg-green-500/10",
        declined: "border-white/10 text-gray-600 bg-transparent",
    }[status];
    const dot = {
        pending: "bg-yellow-500",
        accepted: "bg-green-500",
        declined: "bg-gray-600",
    }[status];
    const label = { pending: "Pending", accepted: "Accepted", declined: "Declined" }[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${cfg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {label}
        </span>
    );
}

function PaymentPill({ status }: { status: PaymentStatus }) {
    const cfg = {
        unpaid: "border-red-800/60 text-red-400 bg-red-500/10",
        processing: "border-yellow-700/60 text-yellow-400 bg-yellow-500/10",
        paid: "border-green-700/60 text-green-400 bg-green-500/10",
    }[status];
    const dot = { unpaid: "bg-red-500", processing: "bg-yellow-500", paid: "bg-green-500" }[status];
    const label = { unpaid: "Unpaid", processing: "Processing", paid: "Paid" }[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${cfg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {label}
        </span>
    );
}

function RaceTypeBadge({ type }: { type: RaceType }) {
    const map: Record<RaceType, string> = {
        Stakes: "border-red-800/60 text-red-400 bg-red-500/10",
        Allowance: "border-blue-800/60 text-blue-400 bg-blue-500/10",
        Claiming: "border-orange-800/60 text-orange-400 bg-orange-500/10",
        Maiden: "border-purple-800/60 text-purple-400 bg-purple-500/10",
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold ${map[type]}`}>
            {type}
        </span>
    );
}

function GradeBadge({ grade }: { grade: GradeLevel }) {
    const map: Record<GradeLevel, string> = {
        G1: "border-yellow-700/60 text-yellow-400 bg-yellow-500/10",
        G2: "border-gray-600/60 text-gray-400 bg-white/5",
        G3: "border-amber-700/60 text-amber-400 bg-amber-500/10",
        Listed: "border-sky-700/60 text-sky-400 bg-sky-500/10",
        Open: "border-white/10 text-gray-500 bg-transparent",
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-black tracking-wide ${map[grade]}`}>
            {grade}
        </span>
    );
}


// ── Mini Calendar ─────────────────────────────────────────────────────────────

const CAL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const CAL_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseDate(dateStr: string): Date | null {
    // Parses "Nov 2, 2024" → Date
    try { return new Date(dateStr); } catch { return null; }
}

function MiniCalendar({ highlightDate }: { highlightDate: string }) {
    const parsed = parseDate(highlightDate);
    const initMonth = parsed ? parsed.getMonth() : new Date().getMonth();
    const initYear = parsed ? parsed.getFullYear() : new Date().getFullYear();

    const [viewMonth, setViewMonth] = useState(initMonth);
    const [viewYear, setViewYear] = useState(initYear);

    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();

    const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
    const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

    const highlightDay = parsed && parsed.getMonth() === viewMonth && parsed.getFullYear() === viewYear
        ? parsed.getDate() : null;

    return (
        <div className="bg-white/[0.03] rounded-xl border border-white/8 overflow-hidden">
            {/* Nav */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/8">
                <button onClick={prevMonth} className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/8 transition-all">
                    <ChevronLeft size={12} />
                </button>
                <span className="text-[11px] font-bold text-gray-300" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {CAL_MONTHS[viewMonth].slice(0, 3)} {viewYear}
                </span>
                <button onClick={nextMonth} className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/8 transition-all">
                    <ChevronRight size={12} />
                </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 px-2 pt-2">
                {CAL_DAYS.map(d => (
                    <div key={d} className="text-center text-[9px] font-bold uppercase text-gray-600 pb-1">{d}</div>
                ))}
            </div>

            {/* Cells */}
            <div className="grid grid-cols-7 px-2 pb-2 gap-y-0.5">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: totalDays }).map((_, i) => {
                    const day = i + 1;
                    const isHL = day === highlightDay;
                    return (
                        <div
                            key={day}
                            className={[
                                "flex items-center justify-center rounded-lg text-[11px] font-semibold h-7 transition-all",
                                isHL ? "bg-red-700 text-white shadow-sm" : "text-gray-500",
                            ].join(" ")}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>

            {/* Race date label */}
            {highlightDay && (
                <div className="px-3 py-2 border-t border-white/6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    <span className="text-[10.5px] text-gray-500">Race: {highlightDate}</span>
                </div>
            )}
        </div>
    );
}

// ── Expanded Detail Panel ─────────────────────────────────────────────────────

function ExpandedDetail({ invite, onAccept, onDecline }: {
    invite: RaceInvite;
    onAccept: (id: string) => void;
    onDecline: (id: string) => void;
}) {
    const isPending = invite.status === "pending";

    return (
        <div className="border-t border-white/8 bg-white/[0.02]">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-0">

                {/* ── Left: detail content ── */}
                <div className="px-5 pb-5 pt-4 border-r border-white/5">

                    {/* Race Classification */}
                    <div className="mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Race Classification</p>
                        <div className="flex items-center gap-2 flex-wrap">
                            <GradeBadge grade={invite.gradeLevel} />
                            <RaceTypeBadge type={invite.raceType} />
                            <span className="text-[12px] text-gray-500">{RACE_TYPE_DESCRIPTIONS[invite.raceType]}</span>
                        </div>
                    </div>

                    {/* Detail grid */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
                        {[
                            { label: "Distance", value: invite.distance },
                            { label: "Track", value: invite.track },
                            { label: "Location", value: invite.trackLocation },
                            { label: "Entries", value: `${invite.entries} horses` },
                            { label: "Assigned", value: invite.assignedBy },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex items-center gap-1">
                                <span className="text-[11px] text-gray-600">{label}:</span>
                                <span className="text-[11px] font-medium text-gray-500">{value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Notes */}
                    <div className="bg-yellow-500/5 border border-yellow-700/30 rounded-xl px-4 py-3 mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-600 mb-1">Coordinator Notes</p>
                        <p className="text-[12.5px] text-yellow-200/80 leading-relaxed">{invite.notes}</p>
                    </div>

                    {/* Payment */}
                    <div className="bg-[#1a1a1a] border border-white/8 rounded-xl overflow-hidden mb-4">
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-white/[0.03]">
                            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                                <CreditCard size={12} className="text-red-500" />
                                Payment
                            </div>
                            <PaymentPill status={invite.paymentStatus} />
                        </div>
                        <div className="px-4 py-3 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[13px] text-gray-500">Referee Fee</span>
                                <span className="text-[17px] font-black text-white">${invite.fee.toLocaleString()}</span>
                            </div>
                            {invite.paymentMethod && (
                                <div className="flex items-center justify-between">
                                    <span className="text-[13px] text-gray-500">Method</span>
                                    <span className="text-[13px] font-semibold text-gray-300">{invite.paymentMethod}</span>
                                </div>
                            )}
                            {invite.paymentStatus === "processing" && (
                                <div className="bg-yellow-500/8 border border-yellow-700/30 rounded-xl px-3 py-2 text-[12px] text-yellow-300/80 mt-1">
                                    Payment is being processed. Funds typically arrive within 2–3 business days.
                                </div>
                            )}
                            {invite.paymentStatus === "unpaid" && invite.status === "accepted" && (
                                <button className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-700 text-white text-[12px] font-bold uppercase tracking-widest hover:bg-red-600 transition-all duration-150 mt-1">
                                    <CreditCard size={13} /> Request Payment
                                </button>
                            )}
                            {invite.paymentStatus === "unpaid" && invite.status === "pending" && (
                                <p className="text-[11.5px] text-gray-600 text-center mt-1">Payment processed after accepting.</p>
                            )}
                        </div>
                    </div>

                    {/* Accept / Decline */}
                    {isPending && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => onDecline(invite.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-white/10 text-[13px] font-semibold text-gray-500 hover:border-white/20 hover:text-gray-300 transition-all duration-150"
                            >
                                <XCircle size={14} className="text-gray-600" /> Decline
                            </button>
                            <button
                                onClick={() => onAccept(invite.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-700 text-white text-[13px] font-bold hover:bg-red-600 shadow-lg shadow-red-900/30 transition-all duration-150"
                            >
                                <CheckCircle2 size={14} /> Accept Invitation
                            </button>
                        </div>
                    )}
                </div>{/* end left col */}

                {/* ── Right: mini calendar ── */}
                <div className="px-4 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-3">Race Date</p>
                    <MiniCalendar highlightDate={invite.date} />
                </div>

            </div>{/* end grid */}
        </div>
    );
}

// ── Invite Card ───────────────────────────────────────────────────────────────

function InviteCard({ invite, onAccept, onDecline }: {
    invite: RaceInvite;
    onAccept: (id: string) => void;
    onDecline: (id: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const isPending = invite.status === "pending";

    return (
        <div className={[
            "bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden transition-all duration-200",
            isPending ? "hover:border-white/[0.12]" : "opacity-70",
        ].join(" ")}>

            {/* Card header row */}
            <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">

                {/* Left */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={[
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                        isPending ? "bg-red-900/40" : "bg-white/5",
                    ].join(" ")}>
                        <Flag size={16} className={isPending ? "text-red-500" : "text-gray-600"} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[15px] font-bold text-white">{invite.raceLabel}</span>
                            <span className="text-[11px] text-gray-600 font-mono">{invite.race}</span>
                            <GradeBadge grade={invite.gradeLevel} />
                            <RaceTypeBadge type={invite.raceType} />
                            {invite.isNew && (
                                <span className="text-[9px] font-bold uppercase tracking-widest bg-red-700 text-white px-1.5 py-0.5 rounded-full">
                                    New
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                            <span className="flex items-center gap-1 text-[12px] text-gray-500">
                                <MapPin size={11} className="text-red-600 shrink-0" />
                                <span className="font-semibold text-gray-300">{invite.venue}</span>
                                <span className="text-gray-600">· {invite.trackLocation}</span>
                            </span>
                            <span className="flex items-center gap-1 text-[12px] text-gray-500">
                                <Clock size={11} className="text-red-600 shrink-0" />
                                {invite.date} · {invite.time}
                            </span>
                            <span className="text-[11px] font-semibold text-gray-500 bg-white/6 px-2 py-0.5 rounded-lg">
                                {invite.role}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                            <p className="text-[11px] text-gray-600">Invited {invite.sentAt} · {invite.id}</p>
                            <span className="text-[12px] font-bold text-gray-300">${invite.fee.toLocaleString()}</span>
                            <PaymentPill status={invite.paymentStatus} />
                        </div>
                    </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 shrink-0 sm:flex-col sm:items-end">
                    <StatusPill status={invite.status} />
                    <div className="flex items-center gap-2 mt-1">
                        {isPending && (
                            <>
                                <button
                                    onClick={() => onDecline(invite.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-[12px] font-semibold text-gray-500 hover:border-white/20 hover:text-gray-300 transition-all duration-150"
                                >
                                    <XCircle size={13} className="text-gray-600" /> Decline
                                </button>
                                <button
                                    onClick={() => onAccept(invite.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-700 text-white text-[12px] font-bold hover:bg-red-600 shadow-lg shadow-red-900/30 transition-all duration-150"
                                >
                                    <CheckCircle2 size={13} /> Accept
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => setExpanded((p) => !p)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300 transition-all duration-150"
                            aria-label={expanded ? "Collapse" : "Expand"}
                        >
                            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Expanded panel */}
            {expanded && (
                <ExpandedDetail invite={invite} onAccept={onAccept} onDecline={onDecline} />
            )}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type TabFilter = "all" | "pending" | "accepted" | "declined";

export default function InboxPage() {
    const [invites, setInvites] = useState<RaceInvite[]>(INVITES);
    const [tab, setTab] = useState<TabFilter>("all");

    const counts = {
        all: invites.length,
        pending: invites.filter((i) => i.status === "pending").length,
        accepted: invites.filter((i) => i.status === "accepted").length,
        declined: invites.filter((i) => i.status === "declined").length,
    };

    const filtered = tab === "all" ? invites : invites.filter((i) => i.status === tab);

    const handleAccept = (id: string) => setInvites((prev) => prev.map((i) => i.id === id ? { ...i, status: "accepted" as InviteStatus, isNew: false } : i));
    const handleDecline = (id: string) => setInvites((prev) => prev.map((i) => i.id === id ? { ...i, status: "declined" as InviteStatus, isNew: false } : i));

    const TABS: { key: TabFilter; label: string }[] = [
        { key: "all", label: "All" },
        { key: "pending", label: "Pending" },
        { key: "accepted", label: "Accepted" },
        { key: "declined", label: "Declined" },
    ];

    return (
        <div className="min-h-screen bg-[#0f0f0f]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="max-w-3xl mx-auto px-5 py-8">

                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h1
                            className="text-[26px] font-bold text-white tracking-tight"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            Inbox
                        </h1>
                        <p className="text-[13px] text-gray-500 mt-0.5">Race assignments and referee invitations.</p>
                    </div>
                    {counts.pending > 0 && (
                        <div className="bg-[#1a1a1a] border border-white/8 rounded-xl px-4 py-2.5 text-right">
                            <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">Awaiting Response</p>
                            <p
                                className="text-[22px] font-black text-red-500 tracking-tight leading-tight"
                                style={{ fontFamily: "'Playfair Display', serif" }}
                            >
                                {counts.pending}
                            </p>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="bg-[#1a1a1a] border border-white/8 rounded-xl px-2 py-2 mb-5 flex gap-1">
                    {TABS.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={[
                                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[13px] font-semibold transition-all duration-150",
                                tab === key
                                    ? "bg-red-700 text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]",
                            ].join(" ")}
                        >
                            {label}
                            <span className={[
                                "text-[11px] font-bold px-1.5 py-0.5 rounded-full",
                                tab === key ? "bg-white/20 text-white" : "bg-white/8 text-gray-500",
                            ].join(" ")}>
                                {counts[key]}
                            </span>
                        </button>
                    ))}
                </div>

                {/* List */}
                {filtered.length === 0 ? (
                    <div className="bg-[#1a1a1a] rounded-xl border border-white/8 px-5 py-14 text-center">
                        <p className="text-[13px] text-gray-600">No invitations in this category.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {filtered.map((invite) => (
                            <InviteCard
                                key={invite.id}
                                invite={invite}
                                onAccept={handleAccept}
                                onDecline={handleDecline}
                            />
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-5 px-1">
                    <span className="text-[12px] text-gray-600">
                        Showing {filtered.length} of {invites.length} invitations
                    </span>
                    <button className="flex items-center gap-1 text-[13px] text-red-500 font-medium hover:text-red-400 transition-colors">
                        View all <ChevronRight size={14} />
                    </button>
                </div>

            </div>
        </div>
    );
}