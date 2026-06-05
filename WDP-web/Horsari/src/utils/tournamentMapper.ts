import type { Tournament, RaceRound, TournamentStatus } from "../shared/types/TournamentTypes";

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
function getTournamentStatus(startDate: string, endDate: string): TournamentStatus {
    const now = new Date().toISOString();
    if (now < startDate) return "upcoming";
    if (now > endDate) return "completed";
    return "live";
}

function mapStatus(status: string | undefined): TournamentStatus | undefined {
    if (status === "scheduled" || status === "draft") return "upcoming";
    if (status === "running") return "live";
    if (status === "completed" || status === "cancelled") return "completed";
    return undefined;
}

// Convert backend Tournament & its RaceRounds to frontend types
export function mapBackendToTournaments(backendData: any[]): { tournaments: Tournament[], allRaces: RaceRound[] } {
    const tournaments: Tournament[] = [];
    const allRaces: RaceRound[] = [];

    const colors = ["red", "blue", "amber", "purple", "green", "sky", "orange", "gray"];

    backendData.forEach((tData, tIndex) => {
        const assignedRacesCount = tData.RaceRound?.length || 0;
        
        const t: Tournament = {
            id: tData._id,
            name: tData.tournamentName,
            series: tData.seasonYear || new Date().getFullYear().toString(),
            country: tData.country || "",
            location: tData.location || "",
            startDate: tData.startDate ? formatDate(tData.startDate) : "",
            endDate: tData.endDate ? formatDate(tData.endDate) : "",
            startISO: tData.startDate ? new Date(tData.startDate).toISOString().split('T')[0] : "",
            endISO: tData.endDate ? new Date(tData.endDate).toISOString().split('T')[0] : "",
            totalRaces: tData.totalRaces || assignedRacesCount,
            completedRaces: tData.completedRaces || 0,
            prizePool: tData.totalPrizePool ? `$${(tData.totalPrizePool / 1000000).toFixed(1)}M` : "-",
            status: mapStatus(tData.status) || getTournamentStatus(tData.startDate, tData.endDate),
            assignment: assignedRacesCount > 0 ? "assigned" : "none",
            assignedRaces: assignedRacesCount,
            grade: tData.gradeLevel || "",
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
                    venue: rData.location || t.location,
                    trackLocation: rData.address || "No address provided",
                    date: rData.raceDate ? formatDate(rData.raceDate) : "",
                    dateISO: rData.raceDate ? new Date(rData.raceDate).toISOString().split('T')[0] : "",
                    time: rData.raceDate ? formatTime(rData.raceDate) : "",
                    raceType: rData.RaceType?.raceType || rData.raceType || "Stakes",
                    gradeLevel: rData.RaceType?.gradeLevel || rData.gradeLevel || "",
                    distance: rData.trackLength ? `${rData.trackLength}m` : "Unknown",
                    track: rData.raceGround || "Unknown",
                    entries: rData.Registration?.length || 0,
                    prizePool: t.prizePool, // Defaulting to tournament pool
                    refereeFee: rData.RaceReferee?.fee || 0,
                    status: mapStatus(rData.status) || "upcoming",
                    violations: 0,
                    tournamentId: t.id
                };
                allRaces.push(r);
            });
        }
    });

    return { tournaments, allRaces };
}
