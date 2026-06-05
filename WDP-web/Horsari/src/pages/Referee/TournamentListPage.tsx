import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Tournament, RaceRound } from "../../shared/types/TournamentTypes";
import TournamentCalendar from "./RefereeComponents/TournamentCalendar";
import { TournamentModal } from "./modal/TournamentModal";

// ── Re-export types used by TournamentModal ────────────────────────────────────
// (kept here so existing consumers that import from this file still work)
export type { TournamentStatus, AssignmentStatus, RaceStatus, RaceType, GradeLevel, ModalTab } from "../../shared/types/TournamentTypes";
export type { Tournament, RaceRound, LeaderEntry } from "../../shared/types/TournamentTypes";
export { T_COLOR, MONTH_NAMES, DAY_NAMES } from "../../shared/data/TournamentData";
export { StatusBadge, RaceTypeBadge, AssignmentTag } from "./RefereeComponents/TournamentBadges";

// ── Page Props ─────────────────────────────────────────────────────────────────

interface TournamentListPageProps {
    onSelect?: (id: string) => void;
    onOpenRaceMonitor?: (raceId: string) => void;
}

import { useEffect } from "react";
import { refereeService } from "../../api/refereeService";
import { mapBackendToTournaments } from "../../utils/tournamentMapper";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TournamentListPage({ onSelect, onOpenRaceMonitor }: TournamentListPageProps) {
    const navigate = useNavigate();
    const [selected, setSelected] = useState<Tournament | null>(null);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [allRaces, setAllRaces] = useState<RaceRound[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const response = await refereeService.getRefereeTournaments();
                const { tournaments: t, allRaces: r } = mapBackendToTournaments(response.data);
                setTournaments(t);
                setAllRaces(r);
            } catch (error) {
                console.error("Failed to fetch referee tournaments", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTournaments();
    }, []);

    const handleSelect = (t: Tournament) => {
        if (t.name === "Non-tournament") {
            const firstRace = allRaces.find(r => r.tournamentId === t.id);
            handleOpenRaceMonitor(firstRace?.id || "");
            return;
        }
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

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white/40 animate-spin mb-4" />
                        <p className="text-[12px] uppercase tracking-widest font-bold">Loading Events</p>
                    </div>
                ) : (
                    <TournamentCalendar
                        tournaments={tournaments}
                        allRaces={allRaces}
                        onSelectTournament={handleSelect}
                        onOpenRaceMonitor={handleOpenRaceMonitor}
                    />
                )}
            </div>

            {selected && (
                <TournamentModal
                    tournament={selected}
                    allRaces={allRaces}
                    onClose={() => setSelected(null)}
                    onOpenRaceMonitor={handleOpenRaceMonitor}
                />
            )}
        </div>
    );
}