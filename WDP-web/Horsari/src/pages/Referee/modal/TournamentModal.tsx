import { useState } from "react";
import {
    AlertCircle, CheckCircle2, ChevronDown, ChevronRight,
    Clock, Flag, Globe, MapPin, Trophy, Users, X,
} from "lucide-react";
import type { Tournament, RaceRound, ModalTab } from "../types/TournamentTypes";
import {
    T_COLOR, RACES_BY_TOURNAMENT, LEADERBOARD, TOURNAMENTS, ALL_RACES,
    MONTH_NAMES, DAY_NAMES,
} from "../data/TournamentData";
import { StatusBadge, GradeBadge, RaceTypeBadge, AssignmentTag } from "../components/TournamentBadges";

// ── Day Popup ─────────────────────────────────────────────────────────────────

function tournamentsOnDay(iso: string): Tournament[] {
    return TOURNAMENTS.filter(t => iso >= t.startISO && iso <= t.endISO);
}

function racesOnDay(iso: string): RaceRound[] {
    return ALL_RACES.filter(r => r.dateISO === iso);
}

export function DayPopup({ iso, onSelectTournament, onOpenRaceMonitor }: {
    iso: string;
    onSelectTournament: (t: Tournament) => void;
    onOpenRaceMonitor: (raceId: string) => void;
}) {
    const tournaments = tournamentsOnDay(iso);
    const races = racesOnDay(iso);
    const [y, m, d] = iso.split("-").map(Number);
    const label = `${DAY_NAMES[new Date(y, m - 1, d).getDay()]}, ${MONTH_NAMES[m - 1]} ${d}`;

    if (tournaments.length === 0 && races.length === 0) return null;

    return (
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/8">
                <p className="text-[10.5px] font-bold uppercase tracking-widest text-gray-600">{label}</p>
            </div>

            {tournaments.length > 0 && (
                <div className="px-4 py-3 flex flex-col gap-2 border-b border-white/6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">Tournaments Active</p>
                    {tournaments.map(t => {
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

            {races.length > 0 && (
                <div className="px-4 py-3 flex flex-col gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">Races</p>
                    {races.map(r => {
                        const t = TOURNAMENTS.find(t => t.id === r.tournamentId)!;
                        const c = T_COLOR[t.color];
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
                                    <GradeBadge grade={r.gradeLevel} />
                                    {r.role && <span className="text-[10px] font-semibold text-gray-500 bg-white/5 px-2 py-0.5 rounded-md">{r.role}</span>}
                                    {isLive && <ChevronRight size={12} className="text-red-600" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── Race Detail Panel ─────────────────────────────────────────────────────────

function RaceDetailPanel({ race, onClose }: { race: RaceRound; onClose: () => void }) {
    return (
        <div className="bg-[#141414] rounded-xl border border-white/10 overflow-hidden mt-1">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{race.label}</span>
                    <GradeBadge grade={race.gradeLevel} />
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
                    { label: "Location", value: race.trackLocation },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-white/[0.03] rounded-lg border border-white/6 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-0.5">{label}</p>
                        <p className="text-[12px] font-semibold text-gray-200">{value}</p>
                    </div>
                ))}
            </div>
            {race.role && (
                <div className="px-4 pb-3 flex items-center justify-between">
                    <span className="text-[11.5px] font-semibold text-gray-500 bg-white/5 px-3 py-1.5 rounded-lg">{race.role}</span>
                    {race.status === "completed" && race.violations > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-red-400 font-semibold"><AlertCircle size={11} />{race.violations} violation{race.violations > 1 ? "s" : ""}</span>
                    )}
                    {race.status === "completed" && race.violations === 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-green-500 font-semibold"><CheckCircle2 size={11} />Clean</span>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ t }: { t: Tournament }) {
    const races = RACES_BY_TOURNAMENT[t.id] ?? [];
    const completed = races.filter(r => r.status === "completed").length;
    const violations = races.reduce((a, r) => a + r.violations, 0);
    const liveRace = races.find(r => r.status === "live");
    const c = T_COLOR[t.color];
    const [leaderboardOpen, setLeaderboardOpen] = useState(false);

    return (
        <div className="flex flex-col gap-5">
            <div className="bg-white/[0.03] rounded-xl border border-white/8 px-5 py-4">
                <p className="text-[12.5px] text-gray-400 leading-relaxed mb-4">{t.description}</p>
                <div className="flex items-center gap-x-5 gap-y-1.5 flex-wrap text-[12px] text-gray-500">
                    <span className="flex items-center gap-1.5"><MapPin size={11} className="text-gray-600" />{t.location}</span>
                    <span className="flex items-center gap-1.5"><Globe size={11} className="text-gray-600" />{t.country}</span>
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
                        <span className="text-[10px] text-gray-600">Round {t.totalRaces}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {[
                    { label: "Assigned Races", value: `${t.assignedRaces}/${t.totalRaces}`, sub: "of total", subColor: c.label },
                    { label: "Completed", value: `${completed}`, sub: "races done", subColor: "text-gray-500" },
                    { label: "Violations Filed", value: `${violations}`, sub: "this series", subColor: violations > 0 ? "text-yellow-400" : "text-gray-500" },
                    { label: "Total Earnings", value: "$4,310", sub: "series total", subColor: "text-green-400" },
                ].map(card => (
                    <div key={card.label} className="bg-white/[0.03] rounded-xl border border-white/8 px-4 py-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">{card.label}</p>
                        <p className="text-[26px] font-bold text-white leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>{card.value}</p>
                        <p className={`text-[11px] mt-1.5 font-medium ${card.subColor}`}>{card.sub}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white/[0.03] rounded-xl border border-white/8 overflow-hidden">
                <button
                    onClick={() => setLeaderboardOpen(o => !o)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                >
                    <h3 className="text-[13.5px] font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Leaderboard</h3>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">By Owner</span>
                        <ChevronDown
                            size={14}
                            className={`text-gray-600 transition-transform duration-200 ${leaderboardOpen ? "rotate-180" : ""}`}
                        />
                    </div>
                </button>
                {leaderboardOpen && (
                    <div className="border-t border-white/8">
                        {LEADERBOARD.map(e => {
                            const rankColor = e.rank === 1 ? c.label : e.rank === 2 ? "text-gray-400" : "text-gray-600";
                            return (
                                <div key={e.rank} className="flex items-start gap-3 px-5 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                                    {/* Rank */}
                                    <span className={`text-[16px] font-bold w-5 text-center shrink-0 mt-0.5 ${rankColor}`} style={{ fontFamily: "'Playfair Display', serif" }}>{e.rank}</span>
                                    {/* Horse + owner + placements */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2 flex-wrap">
                                            <p className="text-[13px] font-bold text-white">{e.horse}</p>
                                            <p className="text-[11px] text-gray-500">Owner: {e.owner}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                            {e.placements.map((pos, i) => {
                                                const isPending = pos === null;
                                                const isLiveRound = races[i]?.status === "live";
                                                const posStyle = isPending
                                                    ? "border-white/8 text-gray-600 bg-transparent"
                                                    : pos === 1
                                                        ? "border-yellow-700/50 text-yellow-400 bg-yellow-500/10"
                                                        : pos === 2
                                                            ? "border-gray-500/50 text-gray-300 bg-white/5"
                                                            : pos === 3
                                                                ? "border-amber-700/50 text-amber-500 bg-amber-500/8"
                                                                : "border-white/8 text-gray-500 bg-white/[0.03]";
                                                return (
                                                    <span
                                                        key={i}
                                                        title={`R${i + 1}: ${isPending ? "Pending" : `${pos}${pos === 1 ? "st" : pos === 2 ? "nd" : pos === 3 ? "rd" : "th"}`}`}
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold ${posStyle}`}
                                                    >
                                                        <span className="text-[9px] text-gray-600 font-medium">R{i + 1}</span>
                                                        {isPending
                                                            ? <span className="text-gray-600">—</span>
                                                            : <span>{pos}{pos === 1 ? "st" : pos === 2 ? "nd" : pos === 3 ? "rd" : "th"}</span>
                                                        }
                                                        {isLiveRound && !isPending && (
                                                            <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                                                        )}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    {/* Points */}
                                    <div className="text-right shrink-0">
                                        <p className="text-[13px] font-bold text-white">{e.points}</p>
                                        <p className="text-[10px] text-gray-600 mt-0.5">{e.wins}W</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Races Tab ─────────────────────────────────────────────────────────────────

function RacesTab({ t, onOpenRaceMonitor }: { t: Tournament; onOpenRaceMonitor: (raceId: string) => void }) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const races = RACES_BY_TOURNAMENT[t.id] ?? [];
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
                                    <GradeBadge grade={race.gradeLevel} />
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
                                {race.role && <span className="text-[10.5px] font-semibold text-gray-500 bg-white/5 px-2 py-1 rounded-lg hidden sm:block">{race.role}</span>}
                                {isLive
                                    ? <ChevronRight size={13} className="text-red-600" />
                                    : <ChevronRight size={13} className={`text-gray-600 transition-transform duration-150 ${isExpanded ? "rotate-90" : ""}`} />
                                }
                            </div>
                        </div>
                        {isExpanded && <RaceDetailPanel race={race} onClose={() => setExpandedId(null)} />}
                    </div>
                );
            })}
        </div>
    );
}

// ── Tournament Modal ──────────────────────────────────────────────────────────

export function TournamentModal({ tournament: t, onClose, onOpenRaceMonitor }: {
    tournament: Tournament;
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
                                    <GradeBadge grade={t.grade} />
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
                                {key === "overview" ? "Overview" : `Races (${(RACES_BY_TOURNAMENT[t.id] ?? []).length})`}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
                    {tab === "overview"
                        ? <OverviewTab t={t} />
                        : <RacesTab t={t} onOpenRaceMonitor={onOpenRaceMonitor} />
                    }
                </div>
            </div>
        </div>
    );
}