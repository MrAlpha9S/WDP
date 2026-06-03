export type AdminViewMode = "table" | "calendar";

export interface AdminTournament {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    prizePool: string;
    status: "Upcoming" | "Active" | "Completed";
}
