import { useState } from "react";
import {
    CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
    Clock, CreditCard, Flag, MapPin, XCircle,
} from "lucide-react";
import type { RaceInvite } from "../../../shared/types/InboxTypes";
import { RACE_TYPE_DESCRIPTIONS } from "../../../shared/data/InboxData";
import { StatusPill, PaymentPill, RaceTypeBadge, GradeBadge } from "./InboxBadges";

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
                            className={["flex items-center justify-center rounded-lg text-[11px] font-semibold h-7 transition-all", isHL ? "bg-red-700 text-white shadow-sm" : "text-gray-500"].join(" ")}
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

interface ExpandedDetailProps {
    invite: RaceInvite;
    onAccept: (id: string) => void;
    onDecline: (id: string) => void;
}

function ExpandedDetail({ invite, onAccept, onDecline }: ExpandedDetailProps) {
    const isPending = invite.status === "pending";

    return (
        <div className="border-t border-white/8 bg-white/[0.02]">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-0">

                {/* Left: detail content */}
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
                                <CreditCard size={12} className="text-red-500" /> Payment
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
                </div>

                {/* Right: mini calendar */}
                <div className="px-4 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-3">Race Date</p>
                    <MiniCalendar highlightDate={invite.date} />
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
}

export function InviteCard({ invite, onAccept, onDecline }: InviteCardProps) {
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
                    <div className={["w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5", isPending ? "bg-red-900/40" : "bg-white/5"].join(" ")}>
                        <Flag size={16} className={isPending ? "text-red-500" : "text-gray-600"} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[15px] font-bold text-white">{invite.raceLabel}</span>
                            <span className="text-[11px] text-gray-600 font-mono">{invite.race}</span>
                            <GradeBadge grade={invite.gradeLevel} />
                            <RaceTypeBadge type={invite.raceType} />
                            {invite.isNew && (
                                <span className="text-[9px] font-bold uppercase tracking-widest bg-red-700 text-white px-1.5 py-0.5 rounded-full">New</span>
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
                            <span className="text-[11px] font-semibold text-gray-500 bg-white/6 px-2 py-0.5 rounded-lg">{invite.role}</span>
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
                        {/* {isPending && (
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
                        )} */}
                        <button
                            onClick={() => setExpanded(p => !p)}
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
