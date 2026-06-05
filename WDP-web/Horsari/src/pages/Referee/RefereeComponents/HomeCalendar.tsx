import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock, Flag, MapPin } from "lucide-react";
import type { UpcomingRace, RaceType } from "../../../shared/types/HomepageTypes";
import {
    TODAY, MONTHS, DAYS,
    daysInMonth, firstDayOfMonth, isSameDay,
} from "../../../shared/data/HomepageData";

const COLOR_PALETTE = [
    { text: "text-red-400", border: "border-red-800/60", bg: "bg-red-500/10", dot: "bg-red-500" },
    { text: "text-blue-400", border: "border-blue-800/60", bg: "bg-blue-500/10", dot: "bg-blue-500" },
    { text: "text-orange-400", border: "border-orange-800/60", bg: "bg-orange-500/10", dot: "bg-orange-500" },
    { text: "text-purple-400", border: "border-purple-800/60", bg: "bg-purple-500/10", dot: "bg-purple-500" },
    { text: "text-emerald-400", border: "border-emerald-800/60", bg: "bg-emerald-500/10", dot: "bg-emerald-500" },
    { text: "text-pink-400", border: "border-pink-800/60", bg: "bg-pink-500/10", dot: "bg-pink-500" },
];

export function getPalette(str: string) {
    if (!str) return COLOR_PALETTE[0];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
}

// ── Race Type Badge ────────────────────────────────────────────────────────────

function RaceTypeBadge({ type }: { type: string }) {
    const palette = getPalette(type);
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold ${palette.text} ${palette.border} ${palette.bg}`}>
            {type}
        </span>
    );
}

import type { RaceRoundData } from "../../../api/adminService";

// ── Calendar ──────────────────────────────────────────────────────────────────

interface HomeCalendarProps {
    races: RaceRoundData[];
    activeRules?: any[];
}

export default function HomeCalendar({ races: rawRaces, activeRules = [] }: HomeCalendarProps) {
    const [viewMonth, setViewMonth] = useState(TODAY.getMonth());
    const [viewYear, setViewYear] = useState(TODAY.getFullYear());
    const [selected, setSelected] = useState<Date>(TODAY);

    const races: UpcomingRace[] = rawRaces.map(r => {
        const dateObj = new Date(r.raceDate);
        return {
            id: r._id,
            label: r.roundName || "Unknown Race",
            venue: r.location || "Unknown Venue",
            trackLocation: r.address || "",
            date: dateObj,
            time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            role: "Referee",
            raceType: (r.RaceType || "Open") as RaceType,
            gradeLevel: (r.RaceType || "Open") as any, // default or mapped later
            status: "confirmed"
        };
    });

    useEffect(() => {
        if (races.length > 0) {
            const todayStart = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate()).getTime();
            
            const upcomingRaces = [...races].sort((a, b) => a.date.getTime() - b.date.getTime());
            
            const nextRace = upcomingRaces.find(r => {
                const raceDate = new Date(r.date.getFullYear(), r.date.getMonth(), r.date.getDate()).getTime();
                return raceDate >= todayStart;
            });
            
            if (nextRace) {
                setSelected(nextRace.date);
                setViewMonth(nextRace.date.getMonth());
                setViewYear(nextRace.date.getFullYear());
            } else if (upcomingRaces.length > 0) {
                // if all races are in the past, maybe select the most recent one
                const lastRace = upcomingRaces[upcomingRaces.length - 1];
                setSelected(lastRace.date);
                setViewMonth(lastRace.date.getMonth());
                setViewYear(lastRace.date.getFullYear());
            }
        }
    }, [rawRaces]);

    const totalDays = daysInMonth(viewYear, viewMonth);
    const firstDay = firstDayOfMonth(viewYear, viewMonth);

    const raceDays = races.reduce<Record<string, UpcomingRace[]>>((acc, r) => {
        const key = `${r.date.getFullYear()}-${r.date.getMonth()}-${r.date.getDate()}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(r);
        return acc;
    }, {});

    const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
    const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

    const selectedRaces = races.filter(r => isSameDay(r.date, selected));

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
                        const day = i + 1;
                        const date = new Date(viewYear, viewMonth, day);
                        const key = `${viewYear}-${viewMonth}-${day}`;
                        const dayRaces = raceDays[key] ?? [];
                        const isToday = isSameDay(date, TODAY);
                        const isSel = isSameDay(date, selected);
                        const isPast = date < TODAY && !isToday;

                        return (
                            <button
                                key={day}
                                onClick={() => setSelected(date)}
                                className={[
                                    "relative flex flex-col items-center justify-start pt-1.5 pb-1 rounded-xl transition-all duration-150 min-h-[46px]",
                                    isSel ? "bg-red-900" : "",
                                    !isSel && isToday ? "bg-white/6" : "",
                                    !isSel && !isToday ? "hover:bg-white/4" : "",
                                    isPast ? "opacity-35" : "",
                                ].join(" ")}
                            >
                                <span className={["text-[12px] font-semibold leading-none", isSel ? "text-white" : isToday ? "text-red-500" : "text-gray-400"].join(" ")}>
                                    {day}
                                </span>
                                {dayRaces.length > 0 && (
                                    <div className="flex items-center gap-0.5 mt-1">
                                        {dayRaces.slice(0, 3).map((r, ri) => (
                                            <span key={ri} className={`w-1.5 h-1.5 rounded-full ${isSel ? "bg-white/60" : getPalette(r.raceType).dot}`} />
                                        ))}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 px-5 py-3 border-t border-white/6 flex-wrap">
                    {activeRules.map((rule) => {
                        const palette = getPalette(rule.raceType);
                        return (
                            <span key={rule._id} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                                <span className={`w-2 h-2 rounded-full ${palette.dot}`} /> {rule.raceType}
                            </span>
                        );
                    })}
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
                                        <RaceTypeBadge type={race.raceType} />
                                        {race.status === "tentative" && (
                                            <span className="text-[10px] text-gray-600 border border-white/10 px-1.5 py-0.5 rounded">Tentative</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        <MapPin size={11} className="text-red-600 shrink-0" />
                                        <span className="text-[12px] text-gray-300 font-semibold">{race.venue}</span>
                                        {race.trackLocation && (
                                            <span className="text-[12px] text-gray-600">· {race.trackLocation}</span>
                                        )}
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
        </div>
    );
}
