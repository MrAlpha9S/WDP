import { useState } from "react";
import {
    CheckCircle2, ChevronDown, ChevronRight, ChevronUp,
    Clock, CreditCard, Flag, MapPin, Users, XCircle,
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
    const map = {
        pending: "bg-amber-50 border-amber-300 text-amber-700",
        accepted: "bg-emerald-50 border-emerald-300 text-emerald-700",
        declined: "bg-gray-100 border-gray-300 text-gray-500",
    };
    const dot = { pending: "bg-amber-500", accepted: "bg-emerald-500", declined: "bg-gray-400" };
    const label = { pending: "Pending", accepted: "Accepted", declined: "Declined" };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${map[status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dot[status]}`} />
            {label[status]}
        </span>
    );
}

function PaymentPill({ status }: { status: PaymentStatus }) {
    const map = {
        unpaid: "bg-red-50 border-red-200 text-red-700",
        processing: "bg-amber-50 border-amber-300 text-amber-700",
        paid: "bg-emerald-50 border-emerald-300 text-emerald-700",
    };
    const dot = { unpaid: "bg-red-500", processing: "bg-amber-500", paid: "bg-emerald-500" };
    const label = { unpaid: "Unpaid", processing: "Processing", paid: "Paid" };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${map[status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dot[status]}`} />
            {label[status]}
        </span>
    );
}

function RaceTypeBadge({ type }: { type: RaceType }) {
    const map: Record<RaceType, string> = {
        Stakes: "bg-red-50 border-red-200 text-red-800",
        Allowance: "bg-blue-50 border-blue-200 text-blue-700",
        Claiming: "bg-orange-50 border-orange-200 text-orange-700",
        Maiden: "bg-purple-50 border-purple-200 text-purple-700",
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border text-[11px] font-bold ${map[type]}`}>
            {type}
        </span>
    );
}

function GradeBadge({ grade }: { grade: GradeLevel }) {
    const map: Record<GradeLevel, string> = {
        G1: "bg-yellow-50 border-yellow-400 text-yellow-700",
        G2: "bg-gray-100 border-gray-400 text-gray-600",
        G3: "bg-amber-50 border-amber-300 text-amber-700",
        Listed: "bg-sky-50 border-sky-300 text-sky-700",
        Open: "bg-gray-50 border-gray-200 text-gray-500",
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border text-[11px] font-black tracking-wide ${map[grade]}`}>
            {grade}
        </span>
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
        <div className="border-t border-gray-100 px-5 pb-5 pt-4 bg-gray-50/50">

            {/* Race Classification */}
            <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Race Classification</p>
                <div className="flex items-center gap-2 flex-wrap">
                    <GradeBadge grade={invite.gradeLevel} />
                    <RaceTypeBadge type={invite.raceType} />
                    <span className="text-[12.5px] text-gray-500">{RACE_TYPE_DESCRIPTIONS[invite.raceType]}</span>
                </div>
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                {[
                    { label: "Distance", value: invite.distance },
                    { label: "Track Surface", value: invite.track },
                    { label: "Track Location", value: invite.trackLocation },
                    { label: "Entries", value: `${invite.entries} horses` },
                    { label: "Assigned by", value: invite.assignedBy },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-white rounded-xl border border-gray-100 px-3.5 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
                        <p className="text-[13px] font-semibold text-gray-800">{value}</p>
                    </div>
                ))}
            </div>

            {/* Notes */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Coordinator Notes</p>
                <p className="text-[12.5px] text-amber-900 leading-relaxed">{invite.notes}</p>
            </div>

            {/* Payment */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-4">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                        <CreditCard size={12} className="text-red-700" />
                        Payment
                    </div>
                    <PaymentPill status={invite.paymentStatus} />
                </div>
                <div className="px-4 py-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[13px] text-gray-600">Referee Fee</span>
                        <span className="text-[17px] font-black text-gray-900">${invite.fee.toLocaleString()}</span>
                    </div>
                    {invite.paymentMethod && (
                        <div className="flex items-center justify-between">
                            <span className="text-[13px] text-gray-600">Method</span>
                            <span className="text-[13px] font-semibold text-gray-700">{invite.paymentMethod}</span>
                        </div>
                    )}
                    {invite.paymentStatus === "processing" && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-[12px] text-amber-700 mt-1">
                            Payment is being processed. Funds typically arrive within 2–3 business days.
                        </div>
                    )}
                    {invite.paymentStatus === "unpaid" && invite.status === "accepted" && (
                        <button className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-800 text-white text-[12px] font-bold uppercase tracking-widest hover:bg-red-900 shadow-sm transition-all duration-150 mt-1">
                            <CreditCard size={13} /> Request Payment
                        </button>
                    )}
                    {invite.paymentStatus === "unpaid" && invite.status === "pending" && (
                        <p className="text-[11.5px] text-gray-400 text-center mt-1">Payment processed after accepting.</p>
                    )}
                </div>
            </div>

            {/* Accept / Decline */}
            {isPending && (
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onDecline(invite.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 bg-white text-[13px] font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all duration-150"
                    >
                        <XCircle size={14} className="text-gray-400" /> Decline
                    </button>
                    <button
                        onClick={() => onAccept(invite.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-800 text-white text-[13px] font-bold hover:bg-red-900 shadow-sm hover:shadow-md hover:shadow-red-900/25 transition-all duration-150"
                    >
                        <CheckCircle2 size={14} /> Accept Invitation
                    </button>
                </div>
            )}
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
            "bg-white rounded-2xl border shadow-sm transition-shadow duration-200 overflow-hidden",
            isPending ? "border-gray-100 hover:shadow-md" : "border-gray-100 opacity-80",
        ].join(" ")}>
            {/* Card header row */}
            <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">

                {/* Left */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={[
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                        isPending ? "bg-red-50" : "bg-gray-100",
                    ].join(" ")}>
                        <Flag size={16} className={isPending ? "text-red-800" : "text-gray-400"} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[15px] font-bold text-gray-900">{invite.raceLabel}</span>
                            <span className="text-[11px] text-gray-400 font-mono">{invite.race}</span>
                            <GradeBadge grade={invite.gradeLevel} />
                            <RaceTypeBadge type={invite.raceType} />
                            {invite.isNew && (
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-red-800 text-white px-2 py-0.5 rounded-full">New</span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                            <span className="flex items-center gap-1 text-[12px] text-gray-500">
                                <MapPin size={11} className="text-red-700 shrink-0" />
                                <span className="font-semibold text-gray-700">{invite.venue}</span>
                                <span className="text-gray-400">· {invite.trackLocation}</span>
                            </span>
                            <span className="flex items-center gap-1 text-[12px] text-gray-500">
                                <Clock size={11} className="text-red-700 shrink-0" />{invite.date} · {invite.time}
                            </span>
                            <span className="text-[12px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-lg">
                                {invite.role}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                            <p className="text-[11.5px] text-gray-400">Invited {invite.sentAt} · {invite.id}</p>
                            <span className="text-[12px] font-bold text-gray-700">${invite.fee.toLocaleString()}</span>
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
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-[12px] font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all duration-150"
                                >
                                    <XCircle size={13} className="text-gray-400" /> Decline
                                </button>
                                <button
                                    onClick={() => onAccept(invite.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-800 text-white text-[12px] font-bold hover:bg-red-900 shadow-sm hover:shadow-md hover:shadow-red-900/25 transition-all duration-150"
                                >
                                    <CheckCircle2 size={13} /> Accept
                                </button>
                            </>
                        )}
                        {/* Expand toggle */}
                        <button
                            onClick={() => setExpanded((p) => !p)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 transition-all duration-150"
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
        <div className="min-h-screen bg-[#fdf5f5]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div
                className="min-h-screen"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(220,38,38,0.06) 38px, rgba(220,38,38,0.06) 40px)",
                }}
            >
                <div className="max-w-3xl mx-auto px-5 py-8">

                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h1 className="text-[26px] font-semibold text-gray-900 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                                Inbox
                            </h1>
                            <p className="text-[13px] text-gray-500 mt-0.5">Race assignments and referee invitations.</p>
                        </div>
                        {counts.pending > 0 && (
                            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl px-4 py-2.5 text-right">
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Awaiting Response</p>
                                <p className="text-[22px] font-black text-red-800 tracking-tight leading-tight">{counts.pending}</p>
                            </div>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-2 py-2 mb-5 flex gap-1">
                        {TABS.map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setTab(key)}
                                className={[
                                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150",
                                    tab === key ? "bg-red-800 text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
                                ].join(" ")}
                            >
                                {label}
                                <span className={[
                                    "text-[11px] font-bold px-1.5 py-0.5 rounded-full",
                                    tab === key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500",
                                ].join(" ")}>
                                    {counts[key]}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* List */}
                    {filtered.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-14 text-center">
                            <p className="text-[13px] text-gray-400">No invitations in this category.</p>
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
                        <span className="text-[12px] text-gray-400">
                            Showing {filtered.length} of {invites.length} invitations
                        </span>
                        <button className="flex items-center gap-1 text-[13px] text-red-800 font-medium hover:underline">
                            View all <ChevronRight size={14} />
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}