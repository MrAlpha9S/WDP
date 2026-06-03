import type { AdminTournament } from "../types/TournamentManagementTypes";

export const INITIAL_TOURNAMENTS: AdminTournament[] = [
    {
        id: "t1",
        name: "Autumn Series",
        description: "The premier autumn racing circuit.",
        startDate: "2024-11-01",
        endDate: "2024-11-30",
        prizePool: "$500,000",
        status: "Upcoming"
    },
    {
        id: "t2",
        name: "Global Championship",
        description: "The biggest event of the year.",
        startDate: "2024-12-10",
        endDate: "2024-12-25",
        prizePool: "$2,000,000",
        status: "Upcoming"
    },
    {
        id: "t3",
        name: "Summer Sprint Cup",
        description: "Fast-paced summer races.",
        startDate: "2024-06-01",
        endDate: "2024-06-15",
        prizePool: "$250,000",
        status: "Completed"
    }
];
