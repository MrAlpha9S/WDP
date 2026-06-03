import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Flag, MapPin } from "lucide-react";
import type { UpcomingRace, RaceType, GradeLevel } from "../../../shared/types/HomepageTypes";
import {
    TODAY, MONTHS, DAYS,
    daysInMonth, firstDayOfMonth, isSameDay,
    RACE_TYPE_DOT, GRADE_STYLE, TYPE_STYLE,
} from "../../../shared/data/HomepageData";

// ── Grade Badge ────────────────────────────────────────────────────────────────

function GradeBadge({ grade }: { grade: GradeLevel }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-black tracking-wide ${GRADE_STYLE[grade]}`}>
            {grade}
        </span>
    );
}

// ── Race Type Badge ────────────────────────────────────────────────────────────

function RaceTypeBadge({ type }: { type: RaceType }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold ${TYPE_STYLE[type]}`}>
            {type}
        </span>
    );
}

// ── Calendar ──────────────────────────────────────────────────────────────────

interface HomeCalendarProps {
    races: UpcomingRace[];
}

export default function HomeCalendar({ races }: HomeCalendarProps) {
    const [viewMonth, setViewMonth] = useState(TODAY.getMonth());
    const [viewYear, setViewYear]   = useState(TODAY.getFullYear());
    const [selected, setSelected]   = useState<Date>(TODAY);

    const totalDays = daysInMonth(viewYear, viewMonth);
    const firstDay  = firstDayOfMonth(viewYear, viewMonth);

    const raceDays = races.reduce<Record<string, UpcomingRace[]>>((acc, r) => {
        const key = `${r.date.getFullYear()}-${r.date.getMonth()}-${r.date.getDate()}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(r);
        return acc;
    }, {});

    const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
    const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

    const selectedRaces = races.filter(r => isSameDay(r.date, selected));
    const nearest = races.filter(r => r.date >= TODAY).sort((a, b) => a.date.getTime() - b.date.getTime())[0];

    return (
        <div className="flex flex-col gap-4">

            {/* Calendar Grid */}
            <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">

                {/* Nav */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
                    <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/12 text-gray-500 hover:border-white/25 hover:text-gray-300 transition-all">
                        <ChevronLeft size={13} />
                    </button>
                    <span className="text-[14px] font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {MONTHS[viewMonth]} {viewYear}
                    </span>
                    <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/12 text-gray-500 hover:border-white/25 hover:text-gray-300 transition-all">
                        <ChevronRight size={13} />
                    </button>
                </div>

                {/* Day names */}
                <div className="grid grid-cols-7 px-3 pt-3 pb-1">
                    {DAYS.map(d => (
                        <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-gray-600 pb-1">{d}</div>
                    ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 px-3 pb-3 gap-y-1">
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                    {Array.from({ length: totalDays }).map((_, i) => {
                        const day      = i + 1;
                        const date     = new Date(viewYear, viewMonth, day);
                        const key      = `${viewYear}-${viewMonth}-${day}`;
                        const dayRaces = raceDays[key] ?? [];
                        const isToday  = isSameDay(date, TODAY);
                        const isSel    = isSameDay(date, selected);
                        const isNearest = nearest && isSameDay(date, nearest.date);
                        const isPast   = date < TODAY && !isToday;

                        return (
                            <button
                                key={day}
                                onClick={() => setSelected(date)}
                                className={[
                                    "relative flex flex-col items-center justify-start pt-1.5 pb-1 rounded-xl transition-all duration-150 min-h-[46px]",
                                    isSel ? "bg-red-900" : "",
                                    !isSel && isNearest ? "ring-2 ring-red-600 ring-inset" : "",
                                    !isSel && isToday && !isNearest ? "bg-white/6" : "",
                                    !isSel && !isNearest && !isToday ? "hover:bg-white/4" : "",
                                    isPast ? "opacity-35" : "",
                                ].join(" ")}
                            >
                                <span className={["text-[12px] font-semibold leading-none", isSel ? "text-white" : isToday ? "text-red-500" : "text-gray-400"].join(" ")}>
                                    {day}
                                </span>
                                {dayRaces.length > 0 && (
                                    <div className="flex items-center gap-0.5 mt-1">
                                        {dayRaces.slice(0, 3).map((r, ri) => (
                                            <span key={ri} className={`w-1.5 h-1.5 rounded-full ${isSel ? "bg-white/60" : RACE_TYPE_DOT[r.raceType]}`} />
                                        ))}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 px-5 py-3 border-t border-white/6 flex-wrap">
                    {(Object.entries(RACE_TYPE_DOT) as [RaceType, string][]).map(([type, dot]) => (
                        <span key={type} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                            <span className={`w-2 h-2 rounded-full ${dot}`} /> {type}
                        </span>
                    ))}
                </div>
            </div>

            {/* Selected Day Detail */}
            <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
                <div className="px-5 py-3 border-b border-white/8">
                    <p className="text-[10.5px] font-bold uppercase tracking-widest text-gray-600">
                        {`${DAYS[selected.getDay()]}, ${MONTHS[selected.getMonth()]} ${selected.getDate()}`}
                    </p>
                </div>
                {selectedRaces.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                        <p className="text-[13px] text-gray-600">No races scheduled.</p>
                    </div>
                ) : (
                    <div>
                        {selectedRaces.map((race, i) => (
                            <div
                                key={race.id}
                                className={`flex items-start gap-3 px-5 py-4 ${i !== selectedRaces.length - 1 ? "border-b border-white/5" : ""}`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${race.status === "confirmed" ? "bg-red-900/40" : "bg-white/5"}`}>
                                    <Flag size={14} className={race.status === "confirmed" ? "text-red-500" : "text-gray-600"} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[14px] font-bold text-white">{race.label}</span>
                                        <GradeBadge grade={race.gradeLevel} />
                                        <RaceTypeBadge type={race.raceType} />
                                        {race.status === "tentative" && (
                                            <span className="text-[10px] text-gray-600 border border-white/10 px-1.5 py-0.5 rounded">Tentative</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        <MapPin size={11} className="text-red-600 shrink-0" />
                                        <span className="text-[12px] text-gray-300 font-semibold">{race.venue}</span>
                                        <span className="text-[12px] text-gray-600">· {race.trackLocation}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                        <span className="flex items-center gap-1 text-[12px] text-gray-500">
                                            <Clock size={10} className="text-red-600" /> {race.time}
                                        </span>
                                        <span className="text-[11px] font-semibold text-gray-500 bg-white/6 px-2 py-0.5 rounded">
                                            {race.role}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Next Race Callout */}
            {nearest && (
                <div className="bg-red-900 rounded-xl px-5 py-4 border border-red-800/40">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-300 mb-1">Next Race</p>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-[16px] font-bold text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                            {nearest.label}
                        </p>
                        <span className="text-[10px] font-black tracking-wide border border-white/20 text-white/80 bg-white/10 px-2 py-0.5 rounded">
                            {nearest.gradeLevel}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <MapPin size={11} className="text-red-300 shrink-0" />
                        <span className="text-[12px] text-red-200 font-medium">{nearest.venue}</span>
                        <span className="text-[12px] text-red-400">· {nearest.trackLocation}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-3">
                        <Clock size={11} className="text-red-300" />
                        <span className="text-[12px] text-red-200">
                            {isSameDay(nearest.date, TODAY) ? "Today" : `${MONTHS[nearest.date.getMonth()]} ${nearest.date.getDate()}`}
                            {" · "}{nearest.time}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-white bg-white/15 px-2.5 py-1 rounded-lg">{nearest.role}</span>
                        <RaceTypeBadge type={nearest.raceType} />
                    </div>
                </div>
            )}
        </div>
    );
}
