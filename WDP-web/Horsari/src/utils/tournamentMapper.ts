import type { Tournament, RaceRound, TournamentStatus, RaceStatus } from "../shared/types/TournamentTypes";
import type { TournamentWithRounds } from "../api/refereeService";

// Helper to format date as "MMM d, yyyy"
function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// Helper to format time as "h:mm a"
function formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h}:${m} ${ampm}`;
}

// Helper to determine status from start and end dates
function getTournamentStatus(startDate?: string, endDate?: string): TournamentStatus {
    if (!startDate || !endDate) return "upcoming";
    const now = new Date().toISOString();
    if (now < startDate) return "upcoming";
    if (now > endDate) return "completed";
    return "live";
}

function mapTournamentStatus(status: string | undefined): TournamentStatus | undefined {
    if (status === "scheduled" || status === "draft") return "upcoming";
    if (status === "running") return "live";
    if (status === "completed" || status === "cancelled") return "completed";
    return undefined;
}

function mapRaceStatus(status: string | undefined): RaceStatus {
    if (status === "running") return "live";
    if (status === "completed" || status === "cancelled") return "completed";
    if (status === "prepared") return "prepared";
    return "upcoming";
}

// Convert backend Tournament & its RaceRounds to frontend types
export function mapBackendToTournaments(backendData: TournamentWithRounds[]): { tournaments: Tournament[], allRaces: RaceRound[] } {
    const tournaments: Tournament[] = [];
    const allRaces: RaceRound[] = [];

    const colors = ["red", "blue", "amber", "purple", "green", "sky", "orange", "gray"];

    backendData.forEach((tData, tIndex) => {
        const rounds = tData.RaceRound ?? [];
        const assignedRacesCount = rounds.length;
        const completedRacesCount = rounds.filter(r => r.status === 'completed').length;
        const totalPrizePool = rounds.reduce(
            (sum, r) => sum + (r.firstPlacePrize ?? 0) + (r.secondPlacePrize ?? 0) + (r.thirdPlacePrize ?? 0),
            0,
        );

        const t: Tournament = {
            id: tData._id,
            name: tData.tournamentName ?? "Untitled Tournament",
            startDate: tData.startDate ? formatDate(tData.startDate) : "",
            endDate: tData.endDate ? formatDate(tData.endDate) : "",
            startISO: tData.startDate ? new Date(tData.startDate).toISOString().split('T')[0] : "",
            endISO: tData.endDate ? new Date(tData.endDate).toISOString().split('T')[0] : "",
            totalRaces: assignedRacesCount,
            completedRaces: completedRacesCount,
            prizePool: totalPrizePool > 0 ? `$${(totalPrizePool / 1000000).toFixed(1)}M` : "-",
            status: mapTournamentStatus(tData.status) || getTournamentStatus(tData.startDate, tData.endDate),
            assignment: assignedRacesCount > 0 ? "assigned" : "none",
            assignedRaces: assignedRacesCount,
            description: tData.description || "",
            color: colors[tIndex % colors.length], // Assign colors round-robin
        };

        tournaments.push(t);

        // Map race rounds
        if (tData.RaceRound) {
            tData.RaceRound.forEach((rData: any, rIndex: number) => {
                const r: RaceRound = {
                    id: rData._id,
                    round: rIndex + 1,
                    label: rData.roundName,
                    venue: rData.location || "Unknown Venue",
                    trackLocation: rData.address || "No address provided",
                    date: rData.raceDate ? formatDate(rData.raceDate) : "",
                    dateISO: rData.raceDate ? new Date(rData.raceDate).toISOString().split('T')[0] : "",
                    time: rData.raceDate ? formatTime(rData.raceDate) : "",
                    raceType: rData.RaceType?.raceType || rData.raceType || "Stakes",
                    distance: rData.trackLength ? `${rData.trackLength}m` : "Unknown",
                    track: rData.raceGround || "Unknown",
                    entries: rData.Registration?.length || 0,
                    prizePool: t.prizePool, // Defaulting to tournament pool
                    refereeFee: rData.RaceReferee?.fee || 0,
                    status: mapRaceStatus(rData.status),
                    violations: 0,
                    tournamentId: t.id
                };
                allRaces.push(r);
            });
        }
    });

    return { tournaments, allRaces };
}
