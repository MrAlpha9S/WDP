import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { RecentInvite } from "../../shared/types/HomepageTypes";
import HomeCalendar from "./RefereeComponents/HomeCalendar";
import InviteSidebar from "./RefereeComponents/InviteSidebar";
import { refereeService } from "../../api/refereeService";
import type { RaceRoundData } from "../../api/adminService";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
    const [upcomingRaces, setUpcomingRaces] = useState<RaceRoundData[]>([]);
    const [activeRules, setActiveRules] = useState<any[]>([]);
    const [invites, setInvites] = useState<RecentInvite[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [res, rulesRes, invitesRes] = await Promise.all([
                    refereeService.getRefereeRaceRounds(),
                    refereeService.getActiveRules(),
                    refereeService.getRefereeInvitations(5, 1)
                ]);

                if (res.code === 200 && res.data) {
                    const activeRaces = res.data.filter((r: RaceRoundData) => r.status !== 'cancelled');
                    setUpcomingRaces(activeRaces);
                }

                if (rulesRes.code === 200 && rulesRes.data) {
                    setActiveRules(rulesRes.data);
                }

                if (invitesRes.code === 200 && invitesRes.data) {
                    const mappedInvites = invitesRes.data.map((inv: any) => {
                        const round = inv.raceRoundId || {};
                        const dateObj = new Date(round.raceDate || new Date());
                        let mappedStatus = inv.status;
                        if (inv.status === 'assigned') mappedStatus = 'accepted';
                        if (inv.status === 'rejected') mappedStatus = 'declined';

                        return {
                            id: inv._id,
                            raceLabel: round.roundName || "Unknown Race",
                            tournamentName: round.tournamentId?.tournamentName || "Non-tournament",
                            date: dateObj.toLocaleDateString(),
                            venue: round.location || "Unknown Venue",
                            trackLocation: round.address || "",
                            status: mappedStatus as 'pending' | 'accepted' | 'declined',
                            fee: round.minimalRidingFees || 0,
                            sentAt: new Date(inv.assignedAt).toLocaleDateString(),
                            isNew: false,
                            role: "Referee",
                            raceType: (round.eligibilityRuleId?.raceType || "Flat") as any,
                            gradeLevel: "G3" as any
                        };
                    });
                    setInvites(mappedInvites);
                }
            } catch (error) {
                console.error("Failed to fetch referee dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-[#0f0f0f]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="max-w-5xl mx-auto px-6 py-8">

                {/* Header */}
                <div className="mb-7">
                    <h1
                        className="text-[26px] font-bold text-white tracking-tight"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        Dashboard
                    </h1>
                    <p className="text-[13px] text-gray-500 mt-0.5">
                        Your upcoming race schedule and recent invitations.
                    </p>
                </div>

                {/* Main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#1a1a1a] rounded-xl border border-white/8">
                            <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-4" />
                            <span className="text-[13px] font-medium text-gray-400">Loading schedule...</span>
                        </div>
                    ) : (
                        <HomeCalendar races={upcomingRaces} activeRules={activeRules} />
                    )}
                    <InviteSidebar invites={invites} />
                </div>
            </div>
        </div>
    );
}