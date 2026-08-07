import { useEffect, useRef, useState } from "react";
import {
    AlertTriangle, CheckCircle2,
    ClipboardList, Dna, HeartPulse, RotateCcw, Scale, Shield,
    UserCheck, UserX, X,
} from "lucide-react";
import type { FailFlag } from "../../../shared/types/RaceTypes";
import type { RegistrationDetail } from "../../../providers/useRaceSocket";
import { refereeService } from "../../../api/refereeService";
import type { ViolationTypeRecord } from "../../../api/refereeService";

// ── Category metadata ─────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode }> = {
    'horse-safety':   { label: 'Horse Safety & Welfare',   icon: <HeartPulse size={13} /> },
    'medication':     { label: 'Medication & Anti-Doping', icon: <Dna size={13} /> },
    'administrative': { label: 'Administrative',           icon: <ClipboardList size={13} /> },
    'riding':         { label: 'Riding Violations',        icon: <Shield size={13} /> },
    'betting':        { label: 'Betting Integrity',        icon: <Scale size={13} /> },
};
const CATEGORY_ORDER = ['horse-safety', 'medication', 'administrative', 'riding', 'betting'];

// ── Shared sub-components ─────────────────────────────────────────────────────

function FailToggle({ value, onChange }: { value: FailFlag; onChange: (v: FailFlag) => void }) {
    return (
        <div className="flex items-center gap-1.5 shrink-0">
            <button
                onClick={() => onChange(value === "fail" ? null : "fail")}
                className={["px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-150",
                    value === "fail"
                        ? "bg-red text-text shadow-sm"
                        : "bg-white/5 text-text-muted/70 border border-border hover:border-red-800/50 hover:text-red",
                ].join(" ")}
            >Fail</button>
        </div>
    );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-2 mb-2">
            <span className="text-text-muted">{icon}</span>
            <span className="text-[10.5px] font-bold uppercase tracking-widest text-text-muted/70">{label}</span>
        </div>
    );
}

function CheckRow({ label, sub, value, onChange, failNote }: {
    label: string; sub?: string; value: FailFlag;
    onChange: (v: FailFlag) => void; failNote?: string;
}) {
    return (
        <div className={["rounded-xl border px-3.5 py-2.5 transition-all duration-200",
            value === "fail" ? "border-red-800/60 bg-red/5" : "border-border bg-white/[0.02]",
        ].join(" ")}>
            <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className={["text-[13px] font-semibold",
                        value === "fail" ? "text-red" : "text-text",
                    ].join(" ")}>{label}</p>
                    {sub && (
                        <p className={["text-[11.5px] mt-0.5", value === "fail" ? "text-red-600" : "text-text-muted"].join(" ")}>
                            {value === "fail" && failNote
                                ? <span className="flex items-center gap-1"><AlertTriangle size={10} />{failNote}</span>
                                : sub}
                        </p>
                    )}
                </div>
                <FailToggle value={value} onChange={onChange} />
            </div>
        </div>
    );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface PreRaceInspectionModalProps {
    registration: RegistrationDetail;
    raceRoundId: string;
    gateNumber: number;
    onClose: () => void;
    onVerified: (registrationId: string, status: 'verified' | 'failed') => void;
}

export default function PreRaceInspectionModal({ registration, raceRoundId, gateNumber, onClose, onVerified }: PreRaceInspectionModalProps) {
    const [freshRegistration, setFreshRegistration] = useState<RegistrationDetail | null>(null);
    const [loadingFresh, setLoadingFresh] = useState(true);
    const [violationTypes, setViolationTypes] = useState<ViolationTypeRecord[]>([]);

    // checks: violationTypeId → FailFlag  (absent = not yet reviewed)
    const [checks, setChecks] = useState<Map<string, FailFlag>>(new Map());

    const isPending = registration.registrationStatus === 'pending';

    const activeReg = freshRegistration ?? registration;
    const horse = activeReg.Horse;
    const invitations = activeReg.Invitations ?? [];

    const hasHorse = !!horse;
    const hasConfirmedInvitation = invitations.some(inv => inv.jockeyConfirmation);
    const prerequisitesMet = hasHorse && hasConfirmedInvitation;

    const seedInvId = registration.jockeyInRaceId
        ?? (registration.Invitations ?? []).find(i => i.jockeyConfirmation)?._id
        ?? null;
    const [selectedInvitationId, setSelectedInvitationId] = useState<string | null>(seedInvId);
    // Tracks whether the referee has manually picked a jockey/no-jockey option,
    // so the "fresh data arrived" sync effect below never clobbers their choice.
    const userPickedJockeyRef = useRef(false);
    const [noJockeyFail, setNoJockeyFail] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [noShowSubmittingId, setNoShowSubmittingId] = useState<string | null>(null);
    const [isHorsePhotoPlaceholder, setIsHorsePhotoPlaceholder] = useState(!horse?.photo);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    useEffect(() => {
        Promise.all([
            refereeService.getRaceRoundById(raceRoundId),
            refereeService.getViolationTypes('pre-race'),
        ]).then(([roundRes, vtRes]) => {
            const fresh = (roundRes.data?.Registration ?? []).find((r: any) => r._id === registration._id) as RegistrationDetail | undefined;
            if (fresh) setFreshRegistration(fresh);
            if (vtRes.data?.items) setViolationTypes(vtRes.data.items);
        }).catch(() => {}).finally(() => setLoadingFresh(false));
    }, []);

    // Sync jockey selection once fresh data arrives — but never once the referee
    // has made their own choice, otherwise a fetch resolving after a click would
    // silently discard it.
    useEffect(() => {
        if (!freshRegistration || userPickedJockeyRef.current) return;
        const invId = freshRegistration.jockeyInRaceId
            ?? freshRegistration.Invitations?.find(i => i.jockeyConfirmation)?._id;
        if (invId) setSelectedInvitationId(invId);
    }, [freshRegistration]);

    useEffect(() => {
        setIsHorsePhotoPlaceholder(!horse?.photo);
    }, [horse?.photo]);

    // Group violation types by category for section rendering
    const grouped = violationTypes.reduce<Record<string, ViolationTypeRecord[]>>((acc, vt) => {
        const cat = vt.category ?? 'administrative';
        (acc[cat] ??= []).push(vt);
        return acc;
    }, {});

    const failedVtIds = violationTypes.filter(vt => checks.get(vt._id) === 'fail').map(vt => vt._id);
    const hasFails = failedVtIds.length > 0 || noJockeyFail;
    const failCount = failedVtIds.length + (noJockeyFail ? 1 : 0);

    const builtViolationReason = [
        ...violationTypes.filter(vt => checks.get(vt._id) === 'fail').map(vt => vt.violationName),
        noJockeyFail ? 'No eligible jockey present' : null,
    ].filter(Boolean).join('; ');

    // canSubmit: jockey situation resolved + violation types loaded
    const canSubmit = (hasFails || !!selectedInvitationId) && violationTypes.length > 0 && !submitting;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        setSubmitError(null);
        const status = hasFails ? 'failed' : 'verified';
        try {
            const failedChecks = failedVtIds;

            await refereeService.verifyRegistration(raceRoundId, registration._id, {
                status,
                verificationFailReason: hasFails ? builtViolationReason : undefined,
                selectedInvitationId: !hasFails ? (selectedInvitationId ?? undefined) : undefined,
                failedChecks: hasFails ? failedChecks : undefined,
            });
            onVerified(registration._id, status);
            onClose();
        } catch (err: any) {
            setSubmitError(err?.msg || 'Failed to submit inspection. Please try again.');
            setSubmitting(false);
        }
    };

    // Marks a single jockey invitation as a no-show — independent of the overall
    // verify/fail submission below. confirmRaceResult already skips the payout
    // percentage for invitationStatus:'didNotAttend', and the backend notifies
    // both the jockey and the horse owner, so nothing else needs wiring here.
    const handleMarkNoShow = async (invitationId: string) => {
        setNoShowSubmittingId(invitationId);
        setSubmitError(null);
        try {
            await refereeService.markJockeyNoShow(invitationId);
            setFreshRegistration(prev => {
                const base = prev ?? registration;
                return {
                    ...base,
                    Invitations: (base.Invitations ?? []).map(inv =>
                        inv._id === invitationId ? { ...inv, invitationStatus: 'didNotAttend' } : inv
                    ),
                };
            });
            userPickedJockeyRef.current = true;
            if (selectedInvitationId === invitationId) setSelectedInvitationId(null);

            // If that was the only confirmed, available rider, there's nobody left to
            // race — auto-fail the entry instead of leaving the referee stuck with no
            // valid selection and a disabled submit button.
            const hasOtherAvailableJockey = invitations.some(inv =>
                inv._id !== invitationId && inv.jockeyConfirmation && inv.invitationStatus !== 'didNotAttend'
            );
            if (!hasOtherAvailableJockey) setNoJockeyFail(true);
        } catch (err: any) {
            setSubmitError(err?.msg || 'Failed to mark jockey as no-show. Please try again.');
        } finally {
            setNoShowSubmittingId(null);
        }
    };

    // Reverts a no-show mark back to "accepted" — lets the referee undo a mis-click
    // instead of the jockey being stuck disqualified for the rest of the inspection.
    const handleUnmarkNoShow = async (invitationId: string) => {
        setNoShowSubmittingId(invitationId);
        setSubmitError(null);
        try {
            await refereeService.cancelJockeyNoShow(invitationId);
            setFreshRegistration(prev => {
                const base = prev ?? registration;
                return {
                    ...base,
                    Invitations: (base.Invitations ?? []).map(inv =>
                        inv._id === invitationId ? { ...inv, invitationStatus: 'accepted' } : inv
                    ),
                };
            });
            userPickedJockeyRef.current = true;
            // The jockey is selectable again — if marking them no-show had triggered the
            // "no eligible rider" auto-fail (they were the last one available), undo that too.
            setNoJockeyFail(false);
        } catch (err: any) {
            setSubmitError(err?.msg || 'Failed to undo no-show. Please try again.');
        } finally {
            setNoShowSubmittingId(null);
        }
    };

    const handleCancelNoShow = async () => {
        setSubmitting(true);
        setSubmitError(null);
        try {
            await refereeService.cancelRegistration(raceRoundId, registration._id);
            onVerified(registration._id, 'failed');
            onClose();
        } catch (err: any) {
            setSubmitError(err?.msg || 'Failed to cancel registration. Please try again.');
            setSubmitting(false);
        }
    };

    const toggleCheck = (id: string, v: FailFlag) =>
        setChecks(prev => { const m = new Map(prev); if (v === null) m.delete(id); else m.set(id, v); return m; });

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: "rgba(0,0,0,0.75)" }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-full sm:max-w-4xl bg-surface rounded-t-2xl sm:rounded-2xl border border-border flex flex-col overflow-hidden"
                style={{ maxHeight: "92vh" }}
                onClick={e => e.stopPropagation()}
            >
                <div className="h-0.5 w-full bg-yellow-600" />

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
                    <div className="flex items-center gap-2.5">
                        <ClipboardList size={15} className="text-amber" />
                        <p className="text-[11px] font-black uppercase tracking-widest text-amber">Pre-Race Inspection</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-text-muted/70 uppercase tracking-widest">
                            Gate <span className="text-text-muted">#{gateNumber}</span>
                        </span>
                        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-xl border border-border text-text-muted hover:text-text hover:border-white/20 transition-all">
                            <X size={13} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 min-h-0">

                    {isPending ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2 rounded-xl border border-amber-700/50 bg-amber-500/8 px-4 py-4">
                                <p className="text-[12px] font-bold text-amber-400 flex items-center gap-1.5">
                                    <AlertTriangle size={13} /> Owner Has Not Responded
                                </p>
                                <p className="text-[11.5px] text-amber-600">
                                    This registration is still pending — the owner has not assigned a horse or jockey.
                                    You can cancel it as a no-show to clear it from the inspection queue.
                                </p>
                            </div>
                            <div className="rounded-xl border border-border px-4 py-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted/70">Owner</p>
                                <p className="text-[13px] font-semibold text-text-muted mt-0.5">
                                    {registration.Owner?.fullName ?? <span className="text-text-muted/70">—</span>}
                                </p>
                            </div>
                        </div>
                    ) : (
                    <>

                    {loadingFresh && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-white/[0.02]">
                            <div className="w-3 h-3 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin shrink-0" />
                            <span className="text-[11px] text-text-muted">Refreshing registration data…</span>
                        </div>
                    )}

                    {!prerequisitesMet && (
                        <div className="flex flex-col gap-2 rounded-xl border border-amber-700/50 bg-amber-500/8 px-4 py-3">
                            <p className="text-[12px] font-bold text-amber-400 flex items-center gap-1.5">
                                <AlertTriangle size={13} /> Entry Prerequisites Not Met
                            </p>
                            {!hasHorse && <p className="text-[11.5px] text-amber-600">No horse assigned — owner has not placed a horse into this registration.</p>}
                            {hasHorse && invitations.length === 0 && <p className="text-[11.5px] text-amber-600">No jockey assigned — owner has not sent a jockey invitation yet.</p>}
                            {hasHorse && invitations.length > 0 && !hasConfirmedInvitation && <p className="text-[11.5px] text-amber-600">No jockey has confirmed participation yet.</p>}
                            <p className="text-[11px] text-amber-700 mt-1">Inspection cannot be submitted until the horse owner resolves these issues.</p>
                        </div>
                    )}

                    {/* Horse profile */}
                    <div className="rounded-xl border border-border overflow-hidden">
                        <div className="relative h-28 w-full overflow-hidden flex items-center justify-center">
                            <img
                                src={horse?.photo || "/jumping-horse-silhouette-facing-left-side-view.png"}
                                alt={horse?.horseName ?? "Horse"}
                                onError={(e) => {
                                    e.currentTarget.src = "/jumping-horse-silhouette-facing-left-side-view.png";
                                    setIsHorsePhotoPlaceholder(true);
                                }}
                                className={
                                    isHorsePhotoPlaceholder
                                        ? "h-20 w-20 object-contain opacity-25"
                                        : "w-full h-full object-cover"
                                }
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                            <span className="absolute top-2.5 left-3 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/60 border border-white/15 text-text-muted">
                                Gate #{gateNumber}
                            </span>
                            {(() => {
                                const s = registration.registrationStatus;
                                const cls = s === "verified"
                                    ? "border-green-700/70 text-green-300 bg-green-500/20"
                                    : s === "failed"
                                        ? "border-red-700/70 text-red-300 bg-red/20"
                                        : "border-yellow-700/70 text-yellow-300 bg-yellow-500/20";
                                const label = s === "verified" ? "Verified" : s === "failed" ? "Failed" : "Accepted";
                                return (
                                    <span className={`absolute top-2.5 right-3 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border backdrop-blur-sm ${cls}`}>
                                        {label}
                                    </span>
                                );
                            })()}
                            <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
                                <h2 className="text-[20px] font-bold text-text leading-tight drop-shadow-lg font-serif">
                                    {horse?.horseName ?? <span className="italic text-text-muted text-[16px]">No Horse Assigned</span>}
                                </h2>
                                {horse?.breed || horse?.color ? (
                                    <p className="text-[11.5px] text-text-muted/80 mt-0.5 drop-shadow">
                                        {[horse.breed, horse.color].filter(Boolean).join(" · ")}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 bg-white/[0.03] border-t border-border">
                            <div className="px-4 py-2.5 border-r border-border/60">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted/70">Microchip ID</p>
                                <p className="text-[12px] font-mono font-semibold text-text-muted mt-0.5">
                                    {horse?.microchipId ?? <span className="text-text-muted/70">—</span>}
                                </p>
                            </div>
                            <div className="px-4 py-2.5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted/70">Owner</p>
                                <p className="text-[12px] font-semibold text-text-muted mt-0.5">
                                    {registration.Owner?.fullName ?? <span className="text-text-muted/70">—</span>}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Jockey Verification */}
                    <div>
                        <SectionHeader icon={<UserCheck size={13} />} label="Jockey Verification — Select Rider" />
                        <div className="flex flex-col gap-1.5">
                            {invitations.length === 0 ? (
                                <div className="bg-white/[0.02] rounded-xl border border-border">
                                    <p className="px-4 py-3 text-[12px] text-text-muted/70">No jockey assigned to this registration.</p>
                                </div>
                            ) : invitations.map(inv => {
                                const jockeyName = (inv.jockeyId?._id as any)?.fullName ?? "Unknown Jockey";
                                const confirmed = inv.jockeyConfirmation ?? false;
                                const isNoShow = inv.invitationStatus === 'didNotAttend';
                                const isSelected = !noJockeyFail && !isNoShow && selectedInvitationId === inv._id;
                                const canSelect = confirmed && !isNoShow;
                                const markingNoShow = noShowSubmittingId === inv._id;
                                return (
                                    <div
                                        key={inv._id}
                                        role="button"
                                        tabIndex={canSelect ? 0 : -1}
                                        onClick={() => { if (canSelect) { userPickedJockeyRef.current = true; setSelectedInvitationId(inv._id); setNoJockeyFail(false); } }}
                                        className={["w-full text-left rounded-xl border overflow-hidden transition-all duration-150",
                                            isSelected ? "border-green-700/60 bg-green-500/8" :
                                            isNoShow ? "border-red-900/50 bg-red/[0.03] opacity-75" :
                                            confirmed ? "border-border bg-white/[0.02] hover:border-white/15 cursor-pointer" :
                                            "border-border bg-white/[0.02] cursor-not-allowed opacity-60",
                                        ].join(" ")}
                                    >
                                        <div className="flex items-center gap-3 px-4 py-2.5">
                                            <div className={["w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                                                isSelected ? "bg-green-700" : isNoShow ? "bg-red-800" : confirmed ? "bg-green-700" : "bg-amber-700",
                                            ].join(" ")}>
                                                {isNoShow
                                                    ? <UserX size={13} className="text-text" />
                                                    : confirmed
                                                        ? <CheckCircle2 size={14} className="text-text" />
                                                        : <AlertTriangle size={13} className="text-text" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className={["text-[13.5px] font-bold",
                                                        isSelected ? "text-green" : isNoShow ? "text-red" : confirmed ? "text-text" : "text-amber-400",
                                                    ].join(" ")}>{jockeyName}</p>
                                                    {inv.isBackup && (
                                                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border border-blue-700/50 text-blue bg-blue/10">
                                                            Backup
                                                        </span>
                                                    )}
                                                    {isNoShow && (
                                                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border border-red-800/50 text-red bg-red/10">
                                                            No-Show
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11.5px] text-text-muted mt-0.5">
                                                    {isNoShow ? "Did not attend — no payment will be made" : confirmed ? "Confirmed" : "Pending Confirmation"}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {isSelected && <span className="text-[11px] font-bold text-green">Selected ✓</span>}
                                                {!isSelected && canSelect && <span className="text-[11px] text-text-muted">Tap to select</span>}
                                                {confirmed && !isNoShow && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleMarkNoShow(inv._id); }}
                                                        disabled={markingNoShow}
                                                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-red-800/50 text-red hover:bg-red/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        {markingNoShow ? <span className="animate-pulse">Marking…</span> : <><UserX size={11} />No-Show</>}
                                                    </button>
                                                )}
                                                {isNoShow && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleUnmarkNoShow(inv._id); }}
                                                        disabled={markingNoShow}
                                                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-border text-text-muted hover:bg-white/5 hover:text-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        {markingNoShow ? <span className="animate-pulse">Undoing…</span> : <><RotateCcw size={11} />Undo No-Show</>}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* No-jockey fail option */}
                            <button
                                onClick={() => { userPickedJockeyRef.current = true; setNoJockeyFail(p => !p); setSelectedInvitationId(null); }}
                                className={["w-full text-left rounded-xl border overflow-hidden transition-all duration-150",
                                    noJockeyFail ? "border-red-700/60 bg-red/8" : "border-border bg-white/[0.02] hover:border-red-800/40",
                                ].join(" ")}
                            >
                                <div className="flex items-center gap-3 px-4 py-2.5">
                                    <div className={["w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                                        noJockeyFail ? "bg-red" : "bg-white/8",
                                    ].join(" ")}>
                                        <AlertTriangle size={13} className={noJockeyFail ? "text-text" : "text-text-muted"} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={["text-[13.5px] font-bold", noJockeyFail ? "text-red" : "text-text-muted"].join(" ")}>
                                            No Jockey — Disqualify Entry
                                        </p>
                                        <p className={["text-[11.5px] mt-0.5", noJockeyFail ? "text-red-700" : "text-text-muted/70"].join(" ")}>
                                            Mark as failed — no eligible rider present
                                        </p>
                                    </div>
                                    {noJockeyFail && <span className="text-[11px] font-bold text-red shrink-0">Selected ✗</span>}
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Dynamic violation checks — grouped by category from API */}
                    {loadingFresh
                        ? null
                        : violationTypes.length === 0
                            ? <p className="text-[12px] text-text-muted/70 text-center py-4">No violation types configured.</p>
                            : CATEGORY_ORDER.filter(cat => grouped[cat]?.length > 0).map(cat => (
                                <div key={cat}>
                                    <SectionHeader
                                        icon={CATEGORY_META[cat]?.icon}
                                        label={CATEGORY_META[cat]?.label ?? cat}
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {grouped[cat].map(vt => (
                                            <CheckRow
                                                key={vt._id}
                                                label={vt.violationName}
                                                sub={vt.violationDescription ?? ''}
                                                value={checks.get(vt._id) ?? null}
                                                onChange={v => toggleCheck(vt._id, v)}
                                                failNote={vt.defaultPenalty ? `Default penalty: ${vt.defaultPenalty}` : undefined}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))
                    }

                    {submitError && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-700/50 bg-red/8">
                            <AlertTriangle size={13} className="text-red shrink-0" />
                            <p className="text-[12px] text-red">{submitError}</p>
                        </div>
                    )}
                    </>
                    )}
                </div>

                {/* Footer */}
                {isPending ? (
                    <div className="shrink-0 px-5 py-3.5 border-t border-amber-900/60 bg-amber-500/5 flex items-center justify-between gap-3">
                        <span className="text-[12px] text-amber-600 font-medium">Owner did not respond — no horse or jockey assigned</span>
                        <button
                            onClick={handleCancelNoShow}
                            disabled={submitting}
                            className={["flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold uppercase tracking-widest transition-all duration-150",
                                submitting
                                    ? "bg-white/5 text-text-muted/70 border border-border cursor-not-allowed"
                                    : "bg-amber-700 text-text hover:bg-amber-600 shadow-lg shadow-amber-900/40",
                            ].join(" ")}
                        >
                            {submitting
                                ? <span className="animate-pulse">Cancelling…</span>
                                : <><AlertTriangle size={13} />Cancel — No Show</>}
                        </button>
                    </div>
                ) : (
                <div className={["shrink-0 px-5 py-3.5 border-t flex items-center justify-between gap-3",
                    hasFails ? "border-red-900/60 bg-red/5" : "border-border bg-transparent",
                ].join(" ")}>
                    <div className="flex items-center gap-2">
                        {failCount > 0
                            ? <span className="flex items-center gap-1.5 text-[12px] font-bold text-red">
                                <AlertTriangle size={13} />{failCount} Violation{failCount > 1 ? "s" : ""} Detected
                              </span>
                            : <span className="text-[12px] text-text-muted/70 font-medium">Flag any violations found during inspection</span>
                        }
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className={["flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold uppercase tracking-widest transition-all duration-150",
                            !canSubmit
                                ? "bg-white/5 text-text-muted/70 border border-border cursor-not-allowed"
                                : hasFails
                                    ? "bg-red text-text hover:bg-red/85 shadow-lg shadow-red-900/40"
                                    : "bg-green-700 text-text hover:bg-green-600 shadow-lg shadow-green-900/30",
                        ].join(" ")}
                    >
                        {submitting
                            ? <span className="animate-pulse">Submitting…</span>
                            : hasFails
                                ? <><AlertTriangle size={13} />Submit Failed Inspection</>
                                : <><CheckCircle2 size={13} />Submit Inspection</>}
                    </button>
                </div>
                )}
            </div>
        </div>
    );
}
