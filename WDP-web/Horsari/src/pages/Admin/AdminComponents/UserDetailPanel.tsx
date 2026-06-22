import { useState, useEffect } from "react";
import { X, CheckCircle, XCircle, Clock, ExternalLink, FileText, Image as ImageIcon, Star, Shield, Loader2, AlertTriangle, Timer } from "lucide-react";
import { ROLE_STYLES, STATUS_STYLES, accentClass, Avatar } from "../AdminUsersPage";
import type { FullUser, ViolationData } from "../AdminUsersPage";

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
    const [confirming, setConfirming] = useState(false);
    if (!href) return <DetailRow label={label} value={null} />;

    return (
        <>
            <button
                onClick={() => setConfirming(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.08] hover:border-white/[0.14] transition-all group text-left"
            >
                <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${type === "pdf" ? "bg-red-500/15 text-red-400" : "bg-blue-500/15 text-blue-400"}`}>
                    {type === "pdf" ? <FileText size={13} /> : <ImageIcon size={13} />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-gray-200 font-medium truncate">{label}</p>
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-0.5">{type === "pdf" ? "PDF Document" : "Image File"}</p>
                </div>
                <ExternalLink size={12} className="text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0" />
            </button>

            {confirming && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirming(false)}>
                    <div className="bg-[#1a1a1a] border border-white/[0.1] rounded-xl shadow-2xl w-[320px] p-5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${type === "pdf" ? "bg-red-500/15 text-red-400" : "bg-blue-500/15 text-blue-400"}`}>
                                {type === "pdf" ? <FileText size={16} /> : <ImageIcon size={16} />}
                            </div>
                            <div>
                                <p className="text-[13px] font-semibold text-white">Open file?</p>
                                <p className="text-[11px] text-gray-500">{label}</p>
                            </div>
                        </div>
                        <p className="text-[12px] text-gray-400 mb-4">
                            This will open the document in a new tab. Are you sure you want to continue?
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setConfirming(false)}
                                className="flex-1 py-2 rounded-lg text-[12px] font-semibold bg-white/[0.05] hover:bg-white/[0.09] text-gray-300 border border-white/[0.07] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { window.open(href, '_blank', 'noopener,noreferrer'); setConfirming(false); }}
                                className="flex-1 py-2 rounded-lg text-[12px] font-semibold bg-[#ab3030] hover:bg-[#8f2828] text-white transition-colors"
                            >
                                Open
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function ViolationList({ violations }: { violations: ViolationData[] }) {
    if (!violations || violations.length === 0) return null;

    const statusStyle = (s: string) => {
        if (s === 'confirmed') return 'bg-red-500/15 text-red-400';
        if (s === 'dismissed') return 'bg-white/[0.05] text-gray-500';
        return 'bg-amber-500/15 text-amber-400';
    };
    const severityColor = (n: number | null) => {
        if (!n) return 'text-gray-500';
        if (n >= 4) return 'text-red-400';
        if (n === 3) return 'text-amber-400';
        return 'text-emerald-400';
    };

    return (
        <div className="mt-2 rounded-md border border-red-500/[0.15] bg-red-500/[0.03] overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-red-500/[0.12]">
                <AlertTriangle size={11} className="text-red-400/70" />
                <span className="text-[10px] font-bold text-red-400/70 uppercase tracking-wider">
                    {violations.length} Violation{violations.length !== 1 ? 's' : ''}
                </span>
            </div>
            <div className="divide-y divide-white/[0.04]">
                {violations.map((v) => (
                    <div key={v.violationId} className="px-3 py-2 flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <p className="text-[12px] text-gray-300 font-medium truncate">{v.typeName || 'Unknown Type'}</p>
                            {v.description && <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{v.description}</p>}
                            {v.stewardAction && v.stewardAction !== 'no-action' && (
                                <p className="text-[10px] text-gray-500 mt-0.5 capitalize">{v.stewardAction.replace('-', ' ')}</p>
                            )}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusStyle(v.violationStatus)}`}>
                                {v.violationStatus}
                            </span>
                            {v.severity && (
                                <span className={`text-[10px] font-semibold ${severityColor(v.severity)}`}>
                                    Sev {v.severity}/5
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
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
                    <DetailRow label="License Status" value={
                        user.data?.licenseStatus ? <span className={user.data.licenseStatus === "approved" ? "text-emerald-400" : user.data.licenseStatus === "rejected" ? "text-red-400" : "text-amber-400"}>{user.data.licenseStatus}</span> : null
                    } />
                    <DetailRow label="Total Assignments" value={
                        <span className="text-white font-semibold">{user.data?.totalAssignments ?? 0}</span>
                    } />
                    <div className="py-2"><FileLink label="Referee License" href={user.data?.licenseLink} type="pdf" /></div>
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

export default function UserDetailPanel({ user, onClose, detailLoading = false, onVerify }: {
    user: FullUser;
    onClose: () => void;
    detailLoading?: boolean;
    onVerify?: (action: 'approve' | 'reject') => Promise<void>;
}) {
    const [activeTab, setActiveTab] = useState<"Overview" | "Role Info" | "History">("Overview");
    const [verifyLoading, setVerifyLoading] = useState<'approve' | 'reject' | null>(null);
    const style = ROLE_STYLES[user.role];
    const statusStyle = STATUS_STYLES[user.status];

    const handleVerify = async (action: 'approve' | 'reject') => {
        if (!onVerify) return;
        setVerifyLoading(action);
        try { await onVerify(action); } finally { setVerifyLoading(null); }
    };

    useEffect(() => {
        setActiveTab("Overview");
    }, [user.userId]);

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
                    {["Jockey", "HorseOwner", "Referee"].includes(user.role) && (
                        <button
                            className={`flex-1 pb-2 text-[12px] font-semibold transition-colors ${activeTab === "History" ? "text-white border-b-2 border-white" : "text-gray-500 hover:text-gray-300"}`}
                            onClick={() => setActiveTab("History")}
                        >
                            {user.role === "HorseOwner" ? "Stables" : user.role === "Referee" ? "Assignments" : "History"}
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
                        detailLoading
                            ? <div className="flex items-center justify-center py-8 gap-2 text-gray-500"><Loader2 size={16} className="animate-spin" /><span className="text-[12px]">Loading…</span></div>
                            : <>
                                <RoleDetails user={user} />
                                {onVerify && ['HorseOwner', 'Jockey', 'Referee'].includes(user.role) && (user.data as any)?.licenseStatus === 'pending' && (
                                    <div className="mt-3 flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                                            <span className="text-[11px] text-amber-400/90 font-medium">License pending review</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <button
                                                onClick={() => handleVerify('approve')}
                                                disabled={verifyLoading !== null}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                {verifyLoading === 'approve' ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle size={10} />}
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleVerify('reject')}
                                                disabled={verifyLoading !== null}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                {verifyLoading === 'reject' ? <Loader2 size={10} className="animate-spin" /> : <XCircle size={10} />}
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                    )}

                    {activeTab === "History" && user.role === "Jockey" && user.data && 'raceHistory' in user.data && (
                        <div className="flex flex-col gap-2">
                            {user.data.raceHistory?.length ? user.data.raceHistory.map((race: any) => {
                                const posLabel = race.position === 1 ? '1st' : race.position === 2 ? '2nd' : race.position === 3 ? '3rd' : race.position ? `${race.position}th` : null;
                                const posColor = race.position === 1 ? 'text-amber-400' : race.position === 2 ? 'text-gray-300' : race.position === 3 ? 'text-orange-400' : 'text-gray-500';
                                const hasResult = race.position != null || race.prize != null || race.finishTime != null;
                                return (
                                    <div key={race.id} className="rounded-lg bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                                        {/* Race name + date */}
                                        <div className="px-3 pt-3 pb-2 flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-semibold text-white truncate">{race.raceName}</p>
                                                <p className="text-[11px] text-gray-500 mt-0.5">{race.date}</p>
                                            </div>
                                            {race.resultStatus && (
                                                <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${race.resultStatus === 'official' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                    {race.resultStatus}
                                                </span>
                                            )}
                                        </div>

                                        {/* Horse ridden */}
                                        {race.horseName && (
                                            <div className="mx-3 mb-2 flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.06]">
                                                {race.horseImg
                                                    ? <img src={race.horseImg} alt={race.horseName} className="w-5 h-5 rounded-full object-cover flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                    : <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0"><span className="text-[8px] font-bold text-amber-400">{race.horseName[0]}</span></div>
                                                }
                                                <div className="min-w-0">
                                                    <span className="text-[12px] font-medium text-amber-300/90">{race.horseName}</span>
                                                    {race.horseBreed && <span className="text-[10px] text-gray-600 ml-1.5">{race.horseBreed}</span>}
                                                </div>
                                            </div>
                                        )}

                                        {/* Result row */}
                                        {hasResult && (
                                            <div className="grid grid-cols-3 gap-2 mx-3 mb-3 px-3 py-2 rounded-md bg-white/[0.02] border border-white/[0.05]">
                                                <div className="text-center">
                                                    <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">Position</p>
                                                    <p className={`text-[13px] font-bold ${posLabel ? posColor : 'text-gray-600'}`}>{posLabel ?? '—'}</p>
                                                </div>
                                                <div className="text-center border-x border-white/[0.05]">
                                                    <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">Time</p>
                                                    <p className="text-[12px] text-gray-300 font-medium flex items-center justify-center gap-1">
                                                        <Timer size={9} className="text-gray-600" />{race.finishTime ?? '—'}
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">Prize</p>
                                                    <p className={`text-[12px] font-medium ${race.prize ? 'text-emerald-400' : 'text-gray-600'}`}>
                                                        {race.prize ? `$${race.prize.toLocaleString()}` : '—'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <ViolationList violations={race.violations ?? []} />
                                    </div>
                                );
                            }) : <p className="text-[12px] text-gray-500 text-center py-4">No race history available.</p>}
                        </div>
                    )}

                    {activeTab === "History" && user.role === "HorseOwner" && user.data && 'horses' in user.data && (
                        <div className="flex flex-col gap-2">
                            {user.data.horses?.length ? user.data.horses.map((horse: any) => (
                                <div key={horse.id} className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-[13px] font-semibold text-white">{horse.name}</p>
                                        <p className="text-[11px] text-gray-500">{horse.breed} • {horse.age} yrs</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${horse.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                        {horse.status}
                                    </span>
                                </div>
                            )) : <p className="text-[12px] text-gray-500 text-center py-4">No horses registered.</p>}
                        </div>
                    )}

                    {activeTab === "History" && user.role === "Referee" && user.data && 'assignments' in user.data && (
                        <div className="flex flex-col gap-2">
                            {user.data.assignments?.length ? user.data.assignments.map((a: any) => (
                                <div key={a.assignmentId} className="rounded-lg bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                                    <div className="p-3">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <p className="text-[13px] font-semibold text-white">{a.roundName || 'Unknown Race'}</p>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${a.assignmentStatus === 'assigned' ? 'bg-emerald-500/15 text-emerald-400' : a.assignmentStatus === 'rejected' || a.assignmentStatus === 'cancelled' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
                                                {a.assignmentStatus}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[11px] text-gray-500">
                                            <span>{a.raceDate || 'TBD'}</span>
                                            <span className={`${a.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-gray-500'}`}>
                                                {a.fee > 0 ? `${a.fee.toLocaleString()} pts · ${a.paymentStatus}` : 'No fee'}
                                            </span>
                                        </div>
                                    </div>
                                    <ViolationList violations={a.violations ?? []} />
                                </div>
                            )) : <p className="text-[12px] text-gray-500 text-center py-4">No assignments found.</p>}
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
