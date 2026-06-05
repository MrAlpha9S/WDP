import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { adminService } from "../../../api/adminService";

export type ApprovalRole = "Horse Owner" | "Jockey" | "Referee" | "Trainer";
export type InvitationStatus = "Pending" | "Accepted" | "Declined";

export interface Invitee {
    id: string;
    name: string;
    role: ApprovalRole;
    dateInvited: string;
    status: InvitationStatus;
    initials: string;
    color: string;
    registeredRace?: string;
    raceSlotsFilled?: number;
    raceTotalSlots?: number;
    horseSelected?: string;
    mainJockeyName?: string;
    mainJockeyStatus?: InvitationStatus;
    mainJockeyInvitationId?: string;
    backupJockeyName?: string;
    backupJockeyStatus?: InvitationStatus;
    backupJockeyInvitationId?: string;
}

const ROLE_COLORS: Record<ApprovalRole, string> = {
    "Horse Owner": "#2d3748",
    "Jockey": "#1a2a3a",
    "Referee": "#2a2a2a",
    "Trainer": "#1a3a2a",
};

export function StatusBadge({ status }: { status: InvitationStatus }) {
    const colors = {
        Pending: "text-amber-400 bg-amber-400/10 border border-amber-400/20",
        Accepted: "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20",
        Declined: "text-red-400 bg-red-400/10 border border-red-400/20"
    };
    return (
        <span className={`text-[12px] px-2.5 py-1.5 rounded font-medium ${colors[status]}`}>
            {status}
        </span>
    );
}

export function JockeyStatusText({ status }: { status?: InvitationStatus }) {
    if (!status) return <span className="text-gray-600 font-normal italic">N/A</span>;
    const colors = {
        Pending: "text-amber-400",
        Accepted: "text-emerald-400",
        Declined: "text-red-400"
    };
    return <span className={`font-medium ${colors[status]}`}>{status}</span>;
}

export function InvitationTable({
    title,
    invites,
    loading,
    page,
    totalPages,
    setPage,
    handleRevoke
}: {
    title: string;
    invites: Invitee[];
    loading: boolean;
    page: number;
    totalPages: number;
    setPage: (p: number) => void;
    handleRevoke: (id: string) => void;
}) {
    return (
        <div className="rounded-xl border border-white/[0.07] bg-[#141414] p-6 mt-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-[17px] font-semibold text-white">
                    {title}
                </h2>
                <button className="text-[13px] text-gray-400 hover:text-white border border-white/[0.1] px-4 py-1.5 rounded-lg transition-colors">
                    View All
                </button>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[1.3fr_110px_100px_3.5fr_100px] gap-4 pb-3 border-b border-white/[0.07] mb-2">
                {["Invitee", "Role", "Status", "Details", "Action"].map((h) => (
                    <p key={h} className="text-[12px] font-semibold tracking-widest text-gray-500 uppercase">
                        {h}
                    </p>
                ))}
            </div>

            {/* Rows */}
            <div className="flex flex-col divide-y divide-white/[0.05]">
                {invites.map((a) => (
                    <div
                        key={a.id}
                        className="grid grid-cols-[1.3fr_110px_100px_3.5fr_100px] gap-4 items-center py-4"
                    >
                        {/* Invitee */}
                        <div className="flex items-center gap-3.5">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white/80 flex-shrink-0"
                                style={{ background: a.color }}
                            >
                                {a.initials}
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[15px] text-white font-medium">
                                    {a.name}
                                </span>
                                <span className="text-[12px] text-gray-500">
                                    {a.dateInvited}
                                </span>
                            </div>
                        </div>

                        {/* Role badge */}
                        <div>
                            <span
                                className="text-[12px] text-gray-200 px-3 py-1.5 rounded"
                                style={{ background: ROLE_COLORS[a.role] }}
                            >
                                {a.role}
                            </span>
                        </div>

                        {/* Status */}
                        <div>
                            <StatusBadge status={a.status} />
                        </div>

                        {/* Details */}
                        <div>
                            <div className="flex flex-col gap-2.5 text-[13px] text-gray-400 leading-snug">
                                {/* Registered Race Info (Shown for everyone if available) */}
                                {a.registeredRace && (
                                    <div className="flex flex-col gap-1 border-b border-white/5 pb-2.5">
                                        <p className="flex items-center gap-2">
                                            <span className="text-gray-500 font-medium">Race:</span>
                                            <span className="text-white font-medium">{a.registeredRace}</span>
                                        </p>
                                        {a.raceTotalSlots && (
                                            <p className="text-[11.5px] flex items-center gap-2 mt-0.5">
                                                <span className="text-gray-500">Horse Slots:</span>
                                                <span className={`${a.raceSlotsFilled && a.raceSlotsFilled >= a.raceTotalSlots ? "text-red-400" : "text-emerald-400"} font-medium`}>
                                                    {a.raceSlotsFilled}/{a.raceTotalSlots} Filled
                                                </span>
                                                {a.raceSlotsFilled && a.raceSlotsFilled >= a.raceTotalSlots && (
                                                    <span className="text-red-500/80 italic ml-1">(Overflow - Prioritizing early acceptances)</span>
                                                )}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Additional Role Specific Details */}
                                {a.role === "Horse Owner" || a.role === "Jockey" ? (
                                    <>
                                        <p className="flex items-center gap-2">
                                            <span className="text-gray-500 font-medium">Selected Horse:</span>
                                            <span className="text-white font-medium bg-white/5 px-2 py-0.5 rounded border border-white/10">{a.horseSelected || "None"}</span>
                                        </p>
                                        <div className="flex flex-col gap-1.5 mt-1 border-l-2 border-white/5 pl-3">
                                            <div className="flex items-center gap-3">
                                                <span className="w-[100px] text-gray-500">Main Jockey:</span>
                                                <span className="text-gray-200 w-[120px]">{a.mainJockeyName || "-"}</span>
                                                <JockeyStatusText status={a.mainJockeyStatus} />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="w-[100px] text-gray-500">Backup Jockey:</span>
                                                <span className="text-gray-200 w-[120px]">{a.backupJockeyName || "-"}</span>
                                                <JockeyStatusText status={a.backupJockeyStatus} />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    !a.registeredRace && <span className="text-[13px] text-gray-600 italic">No additional details</span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div>
                            <button
                                onClick={() => handleRevoke(a.id)}
                                className="text-[13px] font-medium text-gray-400 hover:text-white border border-white/[0.1] hover:border-red-500/50 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors"
                            >
                                Revoke
                            </button>
                        </div>
                    </div>
                ))}

                {invites.length === 0 && !loading && (
                    <p className="text-[14px] text-gray-500 py-8 text-center font-medium">
                        No pending invitations.
                    </p>
                )}
                {loading && (
                    <p className="text-[14px] text-gray-500 py-8 text-center font-medium animate-pulse">
                        Loading...
                    </p>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-white/[0.07] pt-4 mt-2">
                    <span className="text-[13px] text-gray-500">
                        Page {page} of {totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(page - 1)}
                            disabled={page <= 1}
                            className="p-1.5 rounded bg-[#1a1a1a] border border-white/10 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setPage(page + 1)}
                            disabled={page >= totalPages}
                            className="p-1.5 rounded bg-[#1a1a1a] border border-white/10 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function InvitationsSection() {
    const [activeTab, setActiveTab] = useState<"Horse Owner" | "Referee" | "Jockey">("Horse Owner");
    const [invites, setInvites] = useState<Invitee[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 5;

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                let invitesRes: any = null;
                let mappedInvites: Invitee[] = [];

                if (activeTab === "Horse Owner") {
                    invitesRes = await adminService.getHorseOwnerInvitations(page, limit);
                    setTotalPages(invitesRes.data?.pagination?.totalPages || 1);

                    const itemsToMap = invitesRes.data?.items || [];
                    mappedInvites = itemsToMap.map((item: any) => {
                        const mainJockey = item.invitations.find((i: any) => !i.isBackup);
                        const backupJockey = item.invitations.find((i: any) => i.isBackup);

                        const name = item.horseOwner?.fullName || "Unknown Owner";
                        const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();

                        let status: InvitationStatus = "Pending";
                        if (item.registrationStatus === "approved") status = "Accepted";
                        else if (item.registrationStatus === "rejected") status = "Declined";

                        return {
                            id: item.registrationId,
                            name: name,
                            role: "Horse Owner",
                            dateInvited: new Date(item.registrationAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }),
                            status: status,
                            initials: initials,
                            color: "#2d3748",
                            registeredRace: item.raceRound?.roundName,
                            raceSlotsFilled: item.raceRound?.currentParticipants,
                            raceTotalSlots: item.raceRound?.maxParticipants,
                            horseSelected: item.horse?.horseName,
                            mainJockeyName: mainJockey ? mainJockey.jockeyName : "N/A",
                            mainJockeyStatus: mainJockey ? "Accepted" : undefined,
                            mainJockeyInvitationId: mainJockey ? mainJockey.invitationsId : undefined,
                            backupJockeyName: backupJockey ? backupJockey.jockeyName : "N/A",
                            backupJockeyStatus: backupJockey ? "Accepted" : undefined,
                            backupJockeyInvitationId: backupJockey ? backupJockey.invitationsId : undefined,
                        } as Invitee;
                    });
                } else if (activeTab === "Referee") {
                    invitesRes = await adminService.getRefereeInvitations(page, limit);
                    setTotalPages(invitesRes.data?.pagination?.totalPages || 1);

                    const itemsToMap = invitesRes.data?.items || [];
                    mappedInvites = itemsToMap.map((item: any) => {
                        const name = item.referee?.user?.fullName || "Unknown Referee";
                        const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();

                        let status: InvitationStatus = "Pending";
                        if (item.raceReferee?.status === "assigned") status = "Accepted";
                        else if (item.raceReferee?.status === "rejected") status = "Declined";

                        return {
                            id: item.referee?.refereeId || Math.random().toString(), // fallback
                            name: name,
                            role: "Referee",
                            dateInvited: "N/A", // API currently doesn't return created_at for RaceReferee, or maybe we can skip it
                            status: status,
                            initials: initials,
                            color: "#2a2a2a",
                            registeredRace: item.raceRound?.roundName,
                        } as Invitee;
                    });
                } else if (activeTab === "Jockey") {
                    invitesRes = await adminService.getJockeyInvitations(page, limit);
                    setTotalPages(invitesRes.data?.pagination?.totalPages || 1);

                    const itemsToMap = invitesRes.data?.items || [];
                    mappedInvites = itemsToMap.map((item: any) => {
                        const name = item.jockey?.user?.fullName || "Unknown Jockey";
                        const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();

                        let status: InvitationStatus = "Pending";
                        if (item.status === "accepted") status = "Accepted";
                        else if (item.status === "declined") status = "Declined";

                        const mainJockey = item.invitations?.find((i: any) => !i.isBackup);
                        const backupJockey = item.invitations?.find((i: any) => i.isBackup);

                        return {
                            id: item.invitationId || Math.random().toString(),
                            name: name,
                            role: "Jockey",
                            dateInvited: item.registration?.registrationAt ? new Date(item.registration.registrationAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : "N/A",
                            status: status,
                            initials: initials,
                            color: "#1a2a3a",
                            registeredRace: item.raceRound?.roundName,
                            horseSelected: item.horse?.horseName,
                            mainJockeyName: mainJockey ? mainJockey.jockeyName : "N/A",
                            mainJockeyStatus: mainJockey ? (mainJockey.invitationStatus === 'accepted' ? 'Accepted' : mainJockey.invitationStatus === 'declined' ? 'Declined' : 'Pending') : undefined,
                            mainJockeyInvitationId: mainJockey ? mainJockey.invitationId : undefined,
                            backupJockeyName: backupJockey ? backupJockey.jockeyName : "N/A",
                            backupJockeyStatus: backupJockey ? (backupJockey.invitationStatus === 'accepted' ? 'Accepted' : backupJockey.invitationStatus === 'declined' ? 'Declined' : 'Pending') : undefined,
                            backupJockeyInvitationId: backupJockey ? backupJockey.invitationId : undefined,
                        } as Invitee;
                    });
                }

                setInvites(mappedInvites);
            } catch (error) {
                console.error("Failed to load invitations data", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [page, activeTab]);

    const handleRevoke = (id: string) =>
        setInvites((prev) => prev.filter((a) => a.id !== id));

    return (
        <div className="rounded-xl border border-white/[0.07] bg-[#141414] p-6 flex flex-col h-full">
            <div className="flex gap-4 mb-2 border-b border-white/[0.07]">
                <button
                    onClick={() => { setActiveTab("Horse Owner"); setPage(1); }}
                    className={`pb-2 px-1 text-[14px] font-medium transition-colors ${activeTab === "Horse Owner" ? "text-white border-b-2 border-white" : "text-gray-500 hover:text-gray-300"}`}
                >
                    Horse Owners
                </button>
                <button
                    onClick={() => { setActiveTab("Referee"); setPage(1); }}
                    className={`pb-2 px-1 text-[14px] font-medium transition-colors ${activeTab === "Referee" ? "text-white border-b-2 border-white" : "text-gray-500 hover:text-gray-300"}`}
                >
                    Referees
                </button>
                <button
                    onClick={() => { setActiveTab("Jockey"); setPage(1); }}
                    className={`pb-2 px-1 text-[14px] font-medium transition-colors ${activeTab === "Jockey" ? "text-white border-b-2 border-white" : "text-gray-500 hover:text-gray-300"}`}
                >
                    Jockeys
                </button>
            </div>

            <InvitationTable
                title={`${activeTab} Invitations`}
                invites={invites}
                loading={loading}
                page={page}
                totalPages={totalPages}
                setPage={setPage}
                handleRevoke={handleRevoke}
            />
        </div>
    );
}
