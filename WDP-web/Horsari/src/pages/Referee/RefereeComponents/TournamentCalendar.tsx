import { useState } from "react";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import type { Tournament } from "../types/TournamentTypes";
import {
    TOURNAMENTS, ALL_RACES, T_COLOR,
    MONTH_NAMES, DAY_NAMES, TODAY_ISO,
    daysInMonth, firstDayOfMonth, toISO,
    tournamentsOnDay, racesOnDay,
} from "../data/TournamentData";
import { DayPopup } from "../modal/TournamentModal";

// ── Tournament Calendar ────────────────────────────────────────────────────────

interface TournamentCalendarProps {
    onSelectTournament: (t: Tournament) => void;
    onOpenRaceMonitor: (raceId: string) => void;
}

export default function TournamentCalendar({ onSelectTournament, onOpenRaceMonitor }: TournamentCalendarProps) {
    const TODAY = new Date(2024, 10, 2);
    const [viewMonth, setViewMonth] = useState(TODAY.getMonth());
    const [viewYear, setViewYear] = useState(TODAY.getFullYear());
    const [selectedISO, setSelectedISO] = useState<string | null>(TODAY_ISO);

    const totalDays = daysInMonth(viewYear, viewMonth);
    const firstDay  = firstDayOfMonth(viewYear, viewMonth);

    const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
    const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

    return (
        <div className={["grid gap-4 items-start", selectedISO ? "grid-cols-1 lg:grid-cols-[1fr_300px]" : "grid-cols-1"].join(" ")}>
            <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">

                {/* Nav */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
                    <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/12 text-gray-500 hover:border-white/25 hover:text-gray-300 transition-all">
                        <ChevronLeft size={13} />
                    </button>
                    <span className="text-[14px] font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {MONTH_NAMES[viewMonth]} {viewYear}
                    </span>
                    <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/12 text-gray-500 hover:border-white/25 hover:text-gray-300 transition-all">
                        <ChevronRight size={13} />
                    </button>
                </div>

                {/* Day names */}
                <div className="grid grid-cols-7 px-3 pt-3 pb-1">
                    {DAY_NAMES.map(d => (
                        <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-gray-600 pb-1">{d}</div>
                    ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 pb-3">
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                    {Array.from({ length: totalDays }).map((_, i) => {
                        const day    = i + 1;
                        const iso    = toISO(viewYear, viewMonth, day);
                        const tourn  = tournamentsOnDay(iso);
                        const races  = racesOnDay(iso);
                        const isToday = iso === TODAY_ISO;
                        const isSel   = iso === selectedISO;
                        const isPast  = iso < TODAY_ISO;
                        const hasRace = races.length > 0;
                        const sorted  = [...tourn.filter(t => t.assignment !== "none"), ...tourn.filter(t => t.assignment === "none")];
                        const bands   = sorted.slice(0, 2);

                        return (
                            <div
                                key={day}
                                onClick={() => setSelectedISO(iso)}
                                className={[
                                    "relative flex flex-col items-center justify-start pt-1.5 pb-1.5 cursor-pointer transition-all duration-150 min-h-[52px] mx-0.5 my-0.5 rounded-xl",
                                    isSel ? "bg-red-900 shadow-sm" : isToday ? "bg-white/[0.05]" : "hover:bg-white/[0.04]",
                                    isPast ? "opacity-40" : "",
                                ].join(" ")}
                            >
                                {!isSel && bands.length > 0 && (
                                    <div className="absolute bottom-1.5 left-1 right-1 flex flex-col gap-0.5">
                                        {bands.map((t, bi) => {
                                            const c = T_COLOR[t.color];
                                            const isStart = iso === t.startISO;
                                            const isEnd   = iso === t.endISO;
                                            return (
                                                <div
                                                    key={t.id}
                                                    className={["h-1 opacity-80", c.dot, isStart && isEnd ? "rounded-full" : isStart ? "rounded-l-full" : isEnd ? "rounded-r-full" : ""].join(" ")}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                                <span className={["text-[12px] font-semibold leading-none z-10", isSel ? "text-white" : isToday ? "text-red-400 font-bold" : bands.length > 0 ? "text-gray-200" : "text-gray-500"].join(" ")}>
                                    {day}
                                </span>
                                {hasRace && (
                                    <div className="flex items-center gap-0.5 mt-1 z-10">
                                        {races.slice(0, 3).map((r, ri) => {
                                            const tc = T_COLOR[TOURNAMENTS.find(t => t.id === r.tournamentId)!.color];
                                            return (
                                                <span key={ri} className={`w-1.5 h-1.5 rounded-full ${isSel ? "bg-white/70" : tc.dot} ${r.status === "live" ? "ring-1 ring-white/40" : ""}`} />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="px-4 py-3 border-t border-white/6 flex flex-wrap gap-x-4 gap-y-1.5">
                    {TOURNAMENTS.filter(t => {
                        const mStart = toISO(viewYear, viewMonth, 1);
                        const mEnd   = toISO(viewYear, viewMonth, daysInMonth(viewYear, viewMonth));
                        return t.startISO <= mEnd && t.endISO >= mStart;
                    }).map(t => {
                        const c = T_COLOR[t.color];
                        return (
                            <button key={t.id} onClick={() => onSelectTournament(t)} className="flex items-center gap-1.5 text-[11px] hover:opacity-80 transition-opacity">
                                <span className={`w-2.5 h-2.5 rounded-sm ${c.band.replace("/15", "/60")} border ${c.border}`} />
                                <span className={c.label}>{t.name}</span>
                                {t.assignment !== "none" && <Flag size={9} className="text-gray-600" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Day popup */}
            {selectedISO && (
                <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
                    <DayPopup iso={selectedISO} onSelectTournament={onSelectTournament} onOpenRaceMonitor={onOpenRaceMonitor} />
                </div>
            )}
        </div>
    );
}
