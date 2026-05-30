import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Tournament } from "./types/TournamentTypes";
import { TOURNAMENTS } from "./data/TournamentData";
import TournamentCalendar from "./components/TournamentCalendar";
import { TournamentModal } from "./modal/TournamentModal";

// ── Re-export types used by TournamentModal ────────────────────────────────────
// (kept here so existing consumers that import from this file still work)
export type { TournamentStatus, AssignmentStatus, RaceStatus, RaceType, GradeLevel, ModalTab } from "./types/TournamentTypes";
export type { Tournament, RaceRound, LeaderEntry } from "./types/TournamentTypes";
export { T_COLOR, TOURNAMENTS, ALL_RACES, RACES_BY_TOURNAMENT, LEADERBOARD, MONTH_NAMES, DAY_NAMES } from "./data/TournamentData";
export { StatusBadge, GradeBadge, RaceTypeBadge, AssignmentTag } from "./components/TournamentBadges";

// ── Page Props ─────────────────────────────────────────────────────────────────

interface TournamentListPageProps {
    onSelect?: (id: string) => void;
    onOpenRaceMonitor?: (raceId: string) => void;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TournamentListPage({ onSelect, onOpenRaceMonitor }: TournamentListPageProps) {
    const navigate = useNavigate();
    const [selected, setSelected] = useState<Tournament | null>(null);

    const handleSelect = (t: Tournament) => {
        setSelected(t);
        onSelect?.(t.id);
    };

    const handleOpenRaceMonitor = (raceId: string) => {
        setSelected(null);
        if (onOpenRaceMonitor) {
            onOpenRaceMonitor(raceId);
        } else {
            navigate(`/referee/race-monitor/`);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f0f]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="max-w-5xl mx-auto px-5 py-8">
                <div className="flex items-start justify-between mb-7">
                    <div>
                        <h1 className="text-[26px] font-bold text-white tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                            Tournaments
                        </h1>
                        <p className="text-[13px] text-gray-500 mt-0.5">Race series and championship events.</p>
                    </div>
                    {/* <div className="bg-[#1a1a1a] border border-white/8 rounded-xl px-4 py-2.5 text-right">
                        <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">Assigned</p>
                        <p className="text-[22px] font-black text-red-500 tracking-tight leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                            {TOURNAMENTS.filter(t => t.assignment !== "none").length}
                        </p>
                    </div> */}
                </div>

                <TournamentCalendar
                    onSelectTournament={handleSelect}
                    onOpenRaceMonitor={handleOpenRaceMonitor}
                />
            </div>

            {selected && (
                <TournamentModal
                    tournament={selected}
                    onClose={() => setSelected(null)}
                    onOpenRaceMonitor={handleOpenRaceMonitor}
                />
            )}
        </div>
    );
}