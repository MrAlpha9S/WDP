import { useState } from "react";
import {
    AlertCircle, CheckCircle2, ChevronRight,
    Clock, Globe, MapPin, Trophy, Users, X,
} from "lucide-react";
import type { Tournament, RaceRound, ModalTab } from "../../../shared/types/TournamentTypes";
import {
    T_COLOR,
    MONTH_NAMES, DAY_NAMES,
} from "../../../shared/data/TournamentData";
import { StatusBadge, RaceTypeBadge, AssignmentTag } from "../RefereeComponents/TournamentBadges";

// ── Day Popup ─────────────────────────────────────────────────────────────────

export function DayPopup({ iso, tournaments, allRaces, onSelectTournament, onOpenRaceMonitor }: {
    iso: string;
    tournaments: Tournament[];
    allRaces: RaceRound[];
    onSelectTournament: (t: Tournament) => void;
    onOpenRaceMonitor: (raceId: string) => void;
}) {
    const tournamentsOnDay = tournaments.filter(t => iso >= t.startISO && iso <= t.endISO);
    const racesOnDay = allRaces.filter(r => r.dateISO === iso);
    const [y, m, d] = iso.split("-").map(Number);
    const label = `${DAY_NAMES[new Date(y, m - 1, d).getDay()]}, ${MONTH_NAMES[m - 1]} ${d}`;



    return (
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/8">
                <p className="text-[10.5px] font-bold uppercase tracking-widest text-gray-600">{label}</p>
            </div>

            {tournamentsOnDay.length > 0 && (
                <div className="px-4 py-3 flex flex-col gap-2 border-b border-white/6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">Tournaments Active</p>
                    {tournamentsOnDay.map(t => {
                        const c = T_COLOR[t.color];
                        return (
                            <button
                                key={t.id}
                                onClick={() => onSelectTournament(t)}
                                className="flex items-center gap-3 text-left hover:bg-white/[0.03] rounded-lg px-2 py-2 transition-colors"
                            >
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.dot}`} />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-[12.5px] font-bold truncate ${c.label}`}>{t.name}</p>
                                    <p className="text-[10.5px] text-gray-600">{t.series}</p>
                                </div>
                                <StatusBadge status={t.status} />
                            </button>
                        );
                    })}
                </div>
            )}

            {racesOnDay.length > 0 && (
                <div className="px-4 py-3 flex flex-col gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">Races</p>
                    {racesOnDay.map(r => {
                        const t = tournaments.find(t => t.id === r.tournamentId);
                        if (!t) return null;
                        const isLive = r.status === "live";
                        return (
                            <button
                                key={r.id}
                                onClick={() => isLive ? onOpenRaceMonitor(r.id) : onSelectTournament(t)}
                                className="flex items-center gap-3 text-left hover:bg-white/[0.03] rounded-lg px-2 py-2 transition-colors"
                            >
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${isLive ? "bg-red-700 text-white" : "bg-white/8 text-gray-500"}`}>
                                    {r.round}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <p className="text-[12.5px] font-bold text-white truncate">{r.label}</p>
                                        {isLive && (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-red-700/60 text-red-400 bg-red-500/10 text-[9px] font-bold">
                                                <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />Live
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-gray-600">{r.venue} · {r.time}</p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {isLive && <ChevronRight size={12} className="text-red-600" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {tournamentsOnDay.length === 0 && racesOnDay.length === 0 && (
                <div className="px-4 py-6 flex items-center justify-center">
                    <p className="text-[11px] text-gray-500 font-medium tracking-wide">No events scheduled for this day</p>
                </div>
            )}
        </div>
    );
}

// ── Race Detail Panel ─────────────────────────────────────────────────────────

function RaceDetailPanel({ race, onClose, onOpenRaceMonitor }: { race: RaceRound; onClose: () => void; onOpenRaceMonitor?: (id: string) => void }) {
    return (
        <div className="bg-[#141414] rounded-xl border border-white/10 overflow-hidden mt-1">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{race.label}</span>
                    <RaceTypeBadge type={race.raceType} />
                </div>
                <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/8 transition-all">
                    <X size={13} />
                </button>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 gap-2">
                {[
                    { label: "Distance", value: race.distance },
                    { label: "Track Surface", value: race.track },
                    { label: "Entries", value: `${race.entries} horses` },
                    { label: "Prize Pool", value: race.prizePool },
                    { label: "Venue", value: race.venue },
                    { label: "Address", value: race.trackLocation },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-white/[0.03] rounded-lg border border-white/6 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-0.5">{label}</p>
                        <p className="text-[12px] font-semibold text-gray-200">{value}</p>
                    </div>
                ))}
            </div>
            {race.status === "completed" && (
                <div className="px-4 pb-3 flex items-center justify-end">
                    {race.violations > 0 ? (
                        <span className="flex items-center gap-1 text-[11px] text-red-400 font-semibold"><AlertCircle size={11} />{race.violations} violation{race.violations > 1 ? "s" : ""}</span>
                    ) : (
                        <span className="flex items-center gap-1 text-[11px] text-green-500 font-semibold"><CheckCircle2 size={11} />Clean</span>
                    )}
                </div>
            )}
            {onOpenRaceMonitor && (
                <div className="px-4 pb-4">
                    <button 
                        onClick={() => onOpenRaceMonitor(race.id)}
                        className="w-full flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] text-white text-[12px] font-bold py-2.5 rounded-lg border border-white/10 transition-all"
                    >
                        View in Race Monitor <ChevronRight size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ t, allRaces }: { t: Tournament; allRaces: RaceRound[] }) {
    const races = allRaces.filter(r => r.tournamentId === t.id);
    const completed = races.filter(r => r.status === "completed").length;
    const violations = races.reduce((a, r) => a + r.violations, 0);
    const totalEarnings = races.reduce((a, r) => a + (r.refereeFee || 0), 0);
    const liveRace = races.find(r => r.status === "live");
    const c = T_COLOR[t.color];

    return (
        <div className="flex flex-col gap-5">
            <div className="bg-white/[0.03] rounded-xl border border-white/8 px-5 py-4">
                <p className="text-[12.5px] text-gray-400 leading-relaxed mb-4">{t.description}</p>
                <div className="flex items-center gap-x-5 gap-y-1.5 flex-wrap text-[12px] text-gray-500">
                    {t.location && <span className="flex items-center gap-1.5"><MapPin size={11} className="text-gray-600" />{t.location}</span>}
                    {t.country && <span className="flex items-center gap-1.5"><Globe size={11} className="text-gray-600" />{t.country}</span>}
                    <span>{t.startDate} – {t.endDate}</span>
                </div>
                <div className="mt-4">
                    <div className="flex gap-1">
                        {races.map(r => (
                            <div key={r.id} className={`flex-1 h-1.5 rounded-full ${r.status === "completed" ? "bg-gray-600" : r.status === "live" ? c.dot : "bg-white/8"}`} />
                        ))}
                    </div>
                    <div className="flex justify-between mt-1.5">
                        <span className="text-[10px] text-gray-600">Round 1</span>
                        {liveRace && <span className={`text-[10px] font-semibold ${c.label}`}>Round {liveRace.round} · Live</span>}
                        {t.totalRaces > 1 && <span className="text-[10px] text-gray-600">Round {t.totalRaces}</span>}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {[
                    { label: "Assigned Races", value: `${t.assignedRaces}/${t.totalRaces}`, sub: "of total", subColor: c.label },
                    { label: "Completed", value: `${completed}`, sub: "races done", subColor: "text-gray-500" },
                    { label: "Violations Filed", value: `${violations}`, sub: "this series", subColor: violations > 0 ? "text-yellow-400" : "text-gray-500" },
                    { label: "Total Earnings", value: `$${totalEarnings.toLocaleString()}`, sub: "series total", subColor: "text-green-400" },
                ].map(card => (
                    <div key={card.label} className="bg-white/[0.03] rounded-xl border border-white/8 px-4 py-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">{card.label}</p>
                        <p className="text-[26px] font-bold text-white leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>{card.value}</p>
                        <p className={`text-[11px] mt-1.5 font-medium ${card.subColor}`}>{card.sub}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white/[0.03] rounded-xl border border-white/8 overflow-hidden">
                {/* Leaderboard omitted as it is mocked */}
                <button
                    onClick={() => {}}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                >
                    <h3 className="text-[13.5px] font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Leaderboard</h3>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Coming Soon</span>
                    </div>
                </button>
            </div>
        </div>
    );
}

// ── Races Tab ─────────────────────────────────────────────────────────────────

function RacesTab({ t, allRaces, onOpenRaceMonitor }: { t: Tournament; allRaces: RaceRound[]; onOpenRaceMonitor: (raceId: string) => void }) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const races = allRaces.filter(r => r.tournamentId === t.id);
    const liveRace = races.find(r => r.status === "live");
    const c = T_COLOR[t.color];

    return (
        <div className="flex flex-col gap-1.5">
            {liveRace && (
                <div className="flex items-center gap-2 mb-2 px-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />
                    <span className={`text-[11px] font-semibold ${c.label}`}>Round {liveRace.round} is currently in progress</span>
                </div>
            )}
            {races.map(race => {
                const isLive = race.status === "live";
                const isCompleted = race.status === "completed";
                const isExpanded = expandedId === race.id;

                return (
                    <div key={race.id}>
                        <div
                            onClick={() => isLive ? onOpenRaceMonitor(race.id) : setExpandedId(prev => prev === race.id ? null : race.id)}
                            className={[
                                "relative flex items-center gap-3 px-4 py-3.5 rounded-xl border cursor-pointer transition-all duration-150",
                                isLive
                                    ? "bg-red-500/5 border-red-800/40 hover:bg-red-500/10 hover:border-red-700/60"
                                    : isExpanded
                                        ? "bg-white/[0.04] border-white/12"
                                        : "bg-white/[0.02] border-white/6 hover:bg-white/[0.04] hover:border-white/10",
                            ].join(" ")}
                        >
                            {isLive && <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${c.dot} rounded-l-xl`} />}
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${isLive ? "bg-red-700 text-white" : isCompleted ? "bg-white/8 text-gray-500" : "bg-white/5 text-gray-600"}`}>
                                {race.round}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[13.5px] font-bold ${isCompleted ? "text-gray-400" : "text-white"}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                                        {race.label}
                                    </span>
                                    <RaceTypeBadge type={race.raceType} />
                                    {isLive && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-red-700/60 text-red-400 bg-red-500/10 text-[10px] font-bold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live Now
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-x-3 mt-1 flex-wrap">
                                    <span className="text-[11.5px] text-gray-600 flex items-center gap-1"><MapPin size={10} className={isLive ? "text-red-600" : "text-gray-600"} />{race.venue}</span>
                                    <span className="text-[11.5px] text-gray-600 flex items-center gap-1"><Clock size={10} />{race.date} · {race.time}</span>
                                    <span className="text-[11.5px] text-gray-600 flex items-center gap-1"><Users size={10} />{race.entries}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {isLive
                                    ? <ChevronRight size={13} className="text-red-600" />
                                    : <ChevronRight size={13} className={`text-gray-600 transition-transform duration-150 ${isExpanded ? "rotate-90" : ""}`} />
                                }
                            </div>
                        </div>
                        {isExpanded && <RaceDetailPanel race={race} onClose={() => setExpandedId(null)} onOpenRaceMonitor={onOpenRaceMonitor} />}
                    </div>
                );
            })}
        </div>
    );
}

// ── Tournament Modal ──────────────────────────────────────────────────────────

export function TournamentModal({ tournament: t, allRaces, onClose, onOpenRaceMonitor }: {
    tournament: Tournament;
    allRaces: RaceRound[];
    onClose: () => void;
    onOpenRaceMonitor: (raceId: string) => void;
}) {
    const [tab, setTab] = useState<ModalTab>("overview");
    const c = T_COLOR[t.color];

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-full sm:max-w-2xl bg-[#1a1a1a] rounded-t-2xl sm:rounded-2xl border border-white/10 flex flex-col overflow-hidden"
                style={{ maxHeight: "90vh" }}
                onClick={e => e.stopPropagation()}
            >
                <div className={`h-0.5 w-full ${c.dot}`} />

                <div className="px-5 pt-4 pb-0 shrink-0">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.band}`}>
                                <Trophy size={17} className={c.label} />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                    <StatusBadge status={t.status} />
                                    <AssignmentTag assignment={t.assignment} assignedRaces={t.assignedRaces} totalRaces={t.totalRaces} />
                                </div>
                                <h2 className="text-[20px] font-bold text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                                    {t.name}
                                </h2>
                                <p className="text-[11.5px] text-gray-600 mt-0.5">{t.series}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl border border-white/10 text-gray-500 hover:text-gray-200 hover:border-white/20 transition-all shrink-0">
                            <X size={15} />
                        </button>
                    </div>

                    <div className="flex gap-1 mt-4 bg-white/[0.04] rounded-xl p-1">
                        {(["overview", "races"] as ModalTab[]).map(key => (
                            <button
                                key={key}
                                onClick={() => setTab(key)}
                                className={[
                                    "flex-1 py-2 rounded-lg text-[13px] font-semibold capitalize transition-all duration-150",
                                    tab === key ? "bg-red-700 text-white shadow-sm" : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]",
                                ].join(" ")}
                            >
                                {key === "overview" ? "Overview" : `Races (${allRaces.filter(r => r.tournamentId === t.id).length})`}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
                    {tab === "overview"
                        ? <OverviewTab t={t} allRaces={allRaces} />
                        : <RacesTab t={t} allRaces={allRaces} onOpenRaceMonitor={onOpenRaceMonitor} />
                    }
                </div>
            </div>
        </div>
    );
}