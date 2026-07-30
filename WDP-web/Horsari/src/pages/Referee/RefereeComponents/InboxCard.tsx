import { useState } from "react";
import {
    CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
    Clock, Flag, Loader2, MapPin, XCircle,
} from "lucide-react";
import type { RaceInvite } from "../../../shared/types/InboxTypes";
import { RACE_TYPE_DESCRIPTIONS } from "../../../shared/data/InboxData";
import { StatusPill, PaymentPill, RaceTypeBadge } from "./InboxBadges";

// ── Mini Calendar ─────────────────────────────────────────────────────────────

const CAL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const CAL_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseDate(dateStr: string): Date | null {
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
        <div className="bg-white/[0.03] rounded-xl border border-border overflow-hidden h-full flex flex-col">
            {/* Nav */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/8 transition-all">
                    <ChevronLeft size={14} />
                </button>
                <span className="text-[13px] font-bold text-gray-300 font-serif">
                    {CAL_MONTHS[viewMonth]} {viewYear}
                </span>
                <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/8 transition-all">
                    <ChevronRight size={14} />
                </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 px-3 pt-3 shrink-0">
                {CAL_DAYS.map(d => (
                    <div key={d} className="text-center text-[10px] font-bold uppercase text-gray-600 pb-1.5">{d}</div>
                ))}
            </div>

            {/* Cells — flex-1 + auto-rows-fr so the grid grows to fill whatever height
                the left column's (now much shorter) content leaves available. */}
            <div className="grid grid-cols-7 auto-rows-fr px-3 pb-3 gap-1 flex-1 min-h-0">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: totalDays }).map((_, i) => {
                    const day = i + 1;
                    const isHL = day === highlightDay;
                    return (
                        <div
                            key={day}
                            className={["flex items-center justify-center rounded-lg text-[13px] font-semibold transition-all", isHL ? "bg-red-700 text-white shadow-sm" : "text-gray-500"].join(" ")}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>

            {/* Race date label */}
            {highlightDay && (
                <div className="px-4 py-3 border-t border-border/60 flex items-center gap-2 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    <span className="text-[11.5px] text-gray-500">Race: {highlightDate}</span>
                </div>
            )}
        </div>
    );
}

// ── Expanded Detail Panel ─────────────────────────────────────────────────────

interface ExpandedDetailProps {
    invite: RaceInvite;
    onAccept: (id: string) => void;
    onDecline: (id: string) => void;
    onConfirmPayment: (invitationId: string, paymentId: string) => void | Promise<void>;
}

function ExpandedDetail({ invite, onAccept, onDecline, onConfirmPayment }: ExpandedDetailProps) {
    const isPending = invite.status === "pending";
    const [confirming, setConfirming] = useState(false);

    const handleConfirmClick = async () => {
        if (!invite.paymentId) return;
        setConfirming(true);
        try {
            await onConfirmPayment(invite.id, invite.paymentId);
        } finally {
            setConfirming(false);
        }
    };

    return (
        <div className="border-t border-border bg-white/[0.02]">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_260px] gap-0 items-stretch">

                {/* Left: detail content */}
                <div className="px-5 pb-5 pt-4 border-r border-border/60 flex flex-col">

                    {/* Race Classification */}
                    <div className="mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Race Classification</p>
                        <div className="flex items-center gap-2 flex-wrap">
                            <RaceTypeBadge type={invite.raceType} />
                            {RACE_TYPE_DESCRIPTIONS[invite.raceType] && (
                                <span className="text-[14px] text-gray-400">{RACE_TYPE_DESCRIPTIONS[invite.raceType]}</span>
                            )}
                        </div>
                    </div>

                    {/* Detail grid */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
                        {[
                            { label: "Distance", value: invite.distance },
                            { label: "Track", value: invite.track },
                            { label: "Location", value: invite.trackLocation },
                            { label: "Entries", value: `${invite.entries} horses` },
                            { label: "Assigned", value: invite.assignedBy ?? "—" },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex items-center gap-1">
                                <span className="text-[11px] text-gray-600">{label}:</span>
                                <span className="text-[11px] font-medium text-gray-500">{value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Payment — fee amount and status pill already shown in the card's
                        header row above, so only the status-dependent note/action lives here. */}
                    <div className="mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Payment</p>

                        {invite.paymentStatus === "processing" && (
                            <p className="text-[12px] text-yellow-400/80">
                                Payment is being processed. Funds typically arrive within 2–3 business days.
                            </p>
                        )}
                        {invite.paymentId && !invite.payeeConfirmed && (
                            <button
                                onClick={handleConfirmClick}
                                disabled={confirming}
                                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-700 text-white text-[12px] font-bold uppercase tracking-widest hover:bg-red-600 disabled:opacity-50 transition-all duration-150"
                            >
                                {confirming ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                                Confirm Received
                            </button>
                        )}
                        {invite.paymentId && invite.payeeConfirmed && invite.paymentStatus !== "paid" && (
                            <p className="text-[11.5px] text-emerald-500 mt-2 flex items-center gap-1.5">
                                <CheckCircle2 size={12} /> You've confirmed receipt — waiting on admin.
                            </p>
                        )}
                        {!invite.paymentId && (
                            <p className="text-[11.5px] text-gray-600 mt-1.5">Payment is created once race results are confirmed.</p>
                        )}
                    </div>

                    {/* Accept / Decline — pinned to the bottom of the column instead of
                        sitting right under Payment with dead space below it. */}
                    {isPending && (
                        <div className="flex items-center gap-3 mt-auto pt-4">
                            <button
                                onClick={() => onDecline(invite.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border text-[13px] font-semibold text-gray-500 hover:border-white/20 hover:text-gray-300 transition-all duration-150"
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
                </div>

                {/* Right: mini calendar — stretches to fill the row's full height (set by the
                    left column's content), instead of sitting small with dead space below it. */}
                <div className="px-4 py-4 flex flex-col">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-3 shrink-0">Race Date</p>
                    <div className="flex-1 min-h-[220px]">
                        <MiniCalendar highlightDate={invite.date} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Invite Card ───────────────────────────────────────────────────────────────

interface InviteCardProps {
    invite: RaceInvite;
    onAccept: (id: string) => void;
    onDecline: (id: string) => void;
    onConfirmPayment: (invitationId: string, paymentId: string) => void | Promise<void>;
}

export function InviteCard({ invite, onAccept, onDecline, onConfirmPayment }: InviteCardProps) {
    const [expanded, setExpanded] = useState(false);
    const isPending = invite.status === "pending";

    return (
        <div className={[
            "bg-surface rounded-xl border border-border overflow-hidden transition-all duration-200",
            isPending ? "hover:border-white/[0.12]" : "opacity-70",
        ].join(" ")}>

            {/* Card header row */}
            <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">

                {/* Left */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={["w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5", isPending ? "bg-red-900/40" : "bg-white/5"].join(" ")}>
                        <Flag size={16} className={isPending ? "text-red-500" : "text-gray-600"} />
                    </div>

                    <div className="flex-1 min-w-0">
                        {invite.tournamentName && invite.tournamentName !== "Non-tournament" && (
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{invite.tournamentName}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[15px] font-bold text-white">{invite.raceLabel}</span>
                            <RaceTypeBadge type={invite.raceType} />
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
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                            <p className="text-[11px] text-gray-600">Invited {invite.sentAt} · {invite.id}</p>
                            <span className="text-[12px] font-bold text-gray-300">{invite.fee.toLocaleString()} ₫</span>
                            <PaymentPill status={invite.paymentStatus} />
                        </div>
                    </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 shrink-0 sm:flex-col sm:items-end">
                    <StatusPill status={invite.status} />
                    <div className="flex items-center gap-2 mt-1">
                        {/* {isPending && (
                            <>
                                <button
                                    onClick={() => onDecline(invite.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[12px] font-semibold text-gray-500 hover:border-white/20 hover:text-gray-300 transition-all duration-150"
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
                        )} */}
                        <button
                            onClick={() => setExpanded(p => !p)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-gray-500 hover:border-white/20 hover:text-gray-300 transition-all duration-150"
                            aria-label={expanded ? "Collapse" : "Expand"}
                        >
                            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Expanded panel */}
            {expanded && (
                <ExpandedDetail invite={invite} onAccept={onAccept} onDecline={onDecline} onConfirmPayment={onConfirmPayment} />
            )}
        </div>
    );
}
