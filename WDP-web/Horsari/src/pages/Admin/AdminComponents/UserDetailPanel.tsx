import { useState } from "react";
import { X, CheckCircle, Clock, ExternalLink, FileText, Image as ImageIcon, Star, Shield } from "lucide-react";
import { ROLE_STYLES, STATUS_STYLES, accentClass, Avatar } from "../AdminUsersPage";
import type { FullUser } from "../AdminUsersPage";

// ── Clickable avatar for panel header (opens lightbox if image exists) ────────

function PanelAvatar({ src, name, id }: { src: string; name: string; id: string }) {
    const [errored, setErrored] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const hasImage = src && !errored;

    return (
        <>
            <div
                className={`relative flex-shrink-0 ${hasImage ? "cursor-pointer group" : ""}`}
                onClick={() => hasImage && setExpanded(true)}
            >
                <Avatar src={src} name={name} id={id} size="lg" />
                {hasImage && (
                    <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                        <ExternalLink size={11} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {expanded && (
                <div
                    className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
                    onClick={() => setExpanded(false)}
                >
                    <div className="relative max-w-xs w-full" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setExpanded(false)}
                            className="absolute -top-3 -right-3 z-10 w-7 h-7 rounded-full bg-[#1a1a1a] border border-white/[0.1] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={13} />
                        </button>
                        <img
                            src={src}
                            alt={name}
                            onError={() => { setErrored(true); setExpanded(false); }}
                            className="w-full rounded-2xl border border-white/[0.1] shadow-2xl"
                        />
                        <p className="text-center text-[12px] text-gray-500 mt-3">{name}</p>
                    </div>
                </div>
            )}
        </>
    );
}

// ── Detail sub-components ─────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    const isNull = value === null || value === undefined || value === "";
    return (
        <div className="flex items-center justify-between gap-4 py-2.5 border-b border-white/[0.05] last:border-0">
            <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium flex-shrink-0">{label}</span>
            <span className="text-[12px] text-gray-200 text-right">
                {isNull ? <span className="italic text-gray-600">N/A</span> : value}
            </span>
        </div>
    );
}

function FileLink({ label, href, type }: { label: string; href: string; type: "pdf" | "image" }) {
    if (!href) return <DetailRow label={label} value={null} />;

    return (
        <a
            href={href} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.08] hover:border-white/[0.14] transition-all group"
        >
            <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${type === "pdf" ? "bg-red-500/15 text-red-400" : "bg-blue-500/15 text-blue-400"}`}>
                {type === "pdf" ? <FileText size={13} /> : <ImageIcon size={13} />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[12px] text-gray-200 font-medium truncate">{label}</p>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-0.5">{type === "pdf" ? "PDF Document" : "Image File"}</p>
            </div>
            <ExternalLink size={12} className="text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0" />
        </a>
    );
}

function RoleDetails({ user }: { user: FullUser }) {
    const style = ROLE_STYLES[user.role];
    return (
        <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
                <div className={`w-1 h-3.5 rounded-full ${accentClass(user.role)}`} />
                <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">{style.label} Details</p>
            </div>
            <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] px-3 flex flex-col">
                {user.role === "HorseOwner" && (<>
                    <DetailRow label="Address" value={user.data?.address} />
                    <DetailRow label="License Status" value={
                        user.data?.licenseStatus ? <span className={user.data.licenseStatus === "Valid" ? "text-emerald-400" : "text-amber-400"}>{user.data.licenseStatus}</span> : null
                    } />
                    <div className="py-2"><FileLink label="Owner License" href={user.data?.licenseLink} type="pdf" /></div>
                </>)}
                {user.role === "Jockey" && (<>
                    <DetailRow label="Height" value={user.data?.height ? `${user.data.height} cm` : null} />
                    <DetailRow label="Weight" value={user.data?.weight ? `${user.data.weight} kg` : null} />
                    <DetailRow label="Matches Raced" value={user.data?.matchesRaced} />
                    <DetailRow label="Total Wins" value={user.data?.totalWins != null ? <span className="text-emerald-400 font-semibold">{user.data.totalWins}</span> : null} />
                    <DetailRow label="Ranking" value={user.data?.ranking ? <span className="flex items-center gap-1"><Star size={11} className="text-amber-400" />#{user.data.ranking}</span> : null} />
                    <DetailRow label="Level" value={user.data?.status} />
                    <DetailRow label="License Status" value={
                        user.data?.licenseStatus ? <span className={user.data.licenseStatus === "Valid" ? "text-emerald-400" : "text-red-400"}>{user.data.licenseStatus}</span> : null
                    } />
                    <div className="py-2"><FileLink label="Jockey License" href={user.data?.licenseLink} type="pdf" /></div>
                </>)}
                {user.role === "Referee" && (<>
                    <DetailRow label="Certification No." value={user.data?.certificationNumber} />
                    <DetailRow label="License No." value={user.data?.licenseNumber} />
                </>)}
                {user.role === "Spectator" && (
                    <DetailRow label="Reward Points" value={
                        user.data?.rewardPoints != null ? <span className="text-amber-400 font-semibold">{user.data.rewardPoints.toLocaleString()} pts</span> : null
                    } />
                )}
                {user.role === "Admin" && (
                    <DetailRow label="Admin Level" value={
                        user.data?.adminLevel != null ? <span className="flex items-center gap-1.5 text-red-400 font-semibold"><Shield size={12} />Level {user.data.adminLevel}</span> : null
                    } />
                )}
            </div>
        </div>
    );
}

// ── Inline Detail Panel ───────────────────────────────────────────────────────

export default function UserDetailPanel({ user, onClose }: { user: FullUser; onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<"Overview" | "Role Info" | "History">("Overview");
    const style = ROLE_STYLES[user.role];
    const statusStyle = STATUS_STYLES[user.status];

    // Reset tab when user changes
    useState(() => {
        setActiveTab("Overview");
    });

    return (
        <div
            className="flex flex-col bg-[#141414] border border-white/[0.07] rounded-xl overflow-hidden"
            style={{ animation: "panelIn 0.18s ease-out" }}
        >
            <style>{`@keyframes panelIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }`}</style>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07] flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className={`w-1 h-4 rounded-full ${accentClass(user.role)}`} />
                    <p className="text-[13px] font-semibold text-white">User Detail</p>
                </div>
                <button onClick={onClose} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors">
                    <X size={14} />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 px-5 py-4 flex flex-col gap-4 min-h-0">

                {/* Avatar + identity */}
                <div className="flex items-center gap-3">
                    {/* PanelAvatar: shows photo if available, initials otherwise, lightbox on click */}
                    <PanelAvatar src={user.image} name={user.fullName || "N/A"} id={user.userId} />
                    <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-white">{user.fullName || <span className="italic text-gray-500">N/A</span>}</p>
                        <p className="text-[11px] text-gray-500">@{user.userName || "N/A"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                            {style.label}
                        </span>
                        <span className={`flex items-center gap-1 text-[11px] font-medium ${statusStyle.color}`}>
                            {statusStyle.icon}{statusStyle.text}
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/[0.07] mt-2 mb-2">
                    <button 
                        className={`flex-1 pb-2 text-[12px] font-semibold transition-colors ${activeTab === "Overview" ? "text-white border-b-2 border-white" : "text-gray-500 hover:text-gray-300"}`}
                        onClick={() => setActiveTab("Overview")}
                    >
                        Overview
                    </button>
                    <button 
                        className={`flex-1 pb-2 text-[12px] font-semibold transition-colors ${activeTab === "Role Info" ? "text-white border-b-2 border-white" : "text-gray-500 hover:text-gray-300"}`}
                        onClick={() => setActiveTab("Role Info")}
                    >
                        Role Info
                    </button>
                    {["Jockey", "HorseOwner"].includes(user.role) && (
                        <button 
                            className={`flex-1 pb-2 text-[12px] font-semibold transition-colors ${activeTab === "History" ? "text-white border-b-2 border-white" : "text-gray-500 hover:text-gray-300"}`}
                            onClick={() => setActiveTab("History")}
                        >
                            {user.role === "HorseOwner" ? "Stables" : "History"}
                        </button>
                    )}
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                    {/* Tab Content */}
                    {activeTab === "Overview" && (
                        <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] px-3 flex flex-col">
                            <DetailRow label="Email" value={user.email} />
                            <DetailRow label="Phone" value={user.phoneNumber} />
                            <DetailRow label="Date of Birth" value={user.dateOfBirth} />
                            <DetailRow label="Confirmed" value={
                                user.confirm === true ? <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={12} /> Yes</span>
                                    : user.confirm === false ? <span className="text-amber-400 flex items-center gap-1"><Clock size={12} /> Pending</span>
                                        : null
                            } />
                            <DetailRow label="Last Updated" value={user.updatedAt} />
                        </div>
                    )}

                    {activeTab === "Role Info" && (
                        <RoleDetails user={user} />
                    )}

                    {activeTab === "History" && user.role === "Jockey" && user.data && 'raceHistory' in user.data && (
                        <div className="flex flex-col gap-2">
                            {user.data.raceHistory?.map((race: any) => (
                                <div key={race.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                                    <div>
                                        <p className="text-[13px] font-semibold text-white">{race.raceName}</p>
                                        <p className="text-[11px] text-gray-500">{race.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[13px] font-bold text-amber-400">{race.position === 1 ? '1st Place' : race.position === 2 ? '2nd Place' : race.position === 3 ? '3rd Place' : `${race.position}th Place`}</p>
                                        <p className="text-[11px] text-emerald-400 font-medium">${race.prize.toLocaleString()}</p>
                                    </div>
                                </div>
                            )) || <p className="text-[12px] text-gray-500 text-center py-4">No race history available.</p>}
                        </div>
                    )}

                    {activeTab === "History" && user.role === "HorseOwner" && user.data && 'horses' in user.data && (
                        <div className="flex flex-col gap-2">
                            {user.data.horses?.map((horse: any) => (
                                <div key={horse.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                                    <div>
                                        <p className="text-[13px] font-semibold text-white">{horse.name}</p>
                                        <p className="text-[11px] text-gray-500">{horse.breed} • {horse.age} yrs</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${horse.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {horse.status}
                                        </span>
                                    </div>
                                </div>
                            )) || <p className="text-[12px] text-gray-500 text-center py-4">No horses registered.</p>}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-5 py-3 border-t border-white/[0.07] flex-shrink-0">
                <button className="flex-1 text-[12px] font-semibold bg-white/[0.05] hover:bg-white/[0.09] text-gray-300 py-2 rounded-lg transition-colors border border-white/[0.07]">
                    Edit User
                </button>
                {user.status === "active" ? (
                    <button className="flex-1 text-[12px] font-semibold bg-red-700/20 hover:bg-red-700/30 text-red-400 py-2 rounded-lg transition-colors border border-red-700/30">
                        Suspend
                    </button>
                ) : (
                    <button className="flex-1 text-[12px] font-semibold bg-emerald-700/20 hover:bg-emerald-700/30 text-emerald-400 py-2 rounded-lg transition-colors border border-emerald-700/30">
                        Activate
                    </button>
                )}
            </div>
        </div>
    );
}
