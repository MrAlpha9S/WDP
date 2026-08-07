import { useState } from "react";
import { AlertTriangle, Ban, CheckCircle2, ClipboardList, Clock, UserCheck } from "lucide-react";
import PreRaceInspectionModal from "./modal/PreRaceCheckup";
import type { RegistrationDetail } from "../../providers/useRaceSocket";
import { useRaceSocket } from "../../providers/useRaceSocket";
import { refereeService } from "../../api/refereeService";
import { RefetchButton } from "../../components/RefetchButton";
import { ErrorState } from "../../components/ErrorState";
import { useScheduleGate } from "../../utils/raceDayUtil";
import { ScheduleConfirmModal } from "../../components/ScheduleConfirmModal";

// ── Status helpers ────────────────────────────────────────────────────────────

function regStatusBadge(status?: string) {
    switch (status) {
        case "verified": return <span className="text-[10px] font-bold text-green bg-green/10 border border-green/40 px-1.5 py-0.5 rounded-md">Verified</span>;
        case "failed": return <span className="text-[10px] font-bold text-red bg-red/10 border border-red/40 px-1.5 py-0.5 rounded-md">Failed</span>;
        case "accepted": return <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-700/40 px-1.5 py-0.5 rounded-md">Accepted</span>;
        case "cancelled": return <span className="text-[10px] font-bold text-text-muted bg-white/5 border border-border px-1.5 py-0.5 rounded-md">Cancelled</span>;
        case "rejected": return <span className="text-[10px] font-bold text-text-muted bg-white/5 border border-border px-1.5 py-0.5 rounded-md">Rejected</span>;
        default: return <span className="text-[10px] font-bold text-text-muted bg-white/5 border border-border px-1.5 py-0.5 rounded-md">Pending</span>;
    }
}

function gateCircleClass(status?: string, isChecked?: boolean) {
    if (status === "failed") return "bg-red text-text";
    if (status === "verified") return "bg-green-700 text-text";
    if (status === "accepted") return "bg-amber-700 text-text";
    if (isChecked) return "bg-green-700 text-text";
    return "bg-white/8 text-text-muted";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PreRacePage() {
    const { raceRound } = useRaceSocket();
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
    const [inspecting, setInspecting] = useState<{ registration: RegistrationDetail; index: number } | null>(null);
    const [localRegistrations, setLocalRegistrations] = useState<RegistrationDetail[] | null>(null);
    const [localStatus, setLocalStatus] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<number | null>(null);
    const [registrationsError, setRegistrationsError] = useState<string | null>(null);

    const toggle = (registrationId: string) => setCheckedIds(prev => {
        const s = new Set(prev);
        s.has(registrationId) ? s.delete(registrationId) : s.add(registrationId);
        return s;
    });

    const refetchRegistrations = async () => {
        if (!raceRound?._id) return;
        try {
            setRegistrationsError(null);
            const res = await refereeService.getRaceRoundById(raceRound._id);
            if (res.code === 200 && res.data) {
                if (res.data.Registration) {
                    setLocalRegistrations(res.data.Registration);
                }
                if (res.data.status) {
                    setLocalStatus(res.data.status);
                }
            }
        } catch (err: any) {
            setRegistrationsError(err?.msg ?? "Failed to load registrations.");
        } finally {
            setLastUpdated(Date.now());
        }
    };

    const registrations = localRegistrations ?? raceRound?.Registration ?? [];

    // Registrations the owner never responded to — nothing to inspect, so a referee
    // can clear the whole batch as no-shows in one action instead of cancelling each
    // one individually via the inspection modal.
    const pendingRegistrations = registrations.filter(r => (r.registrationStatus ?? "pending") === "pending");
    const [showBulkCancelConfirm, setShowBulkCancelConfirm] = useState(false);
    const [bulkCancelling, setBulkCancelling] = useState(false);
    const [bulkCancelError, setBulkCancelError] = useState<string | null>(null);

    const handleBulkCancelPending = async () => {
        if (!raceRound?._id || pendingRegistrations.length === 0 || bulkCancelling) return;
        setBulkCancelling(true);
        setBulkCancelError(null);
        try {
            const results = await Promise.allSettled(
                pendingRegistrations.map(reg => refereeService.cancelRegistration(raceRound._id, reg._id))
            );
            const failedCount = results.filter(r => r.status === "rejected").length;
            if (failedCount > 0) {
                setBulkCancelError(`${failedCount} of ${pendingRegistrations.length} registration(s) could not be cancelled.`);
            }
            await refetchRegistrations();
        } finally {
            setBulkCancelling(false);
            setShowBulkCancelConfirm(false);
        }
    };

    const TERMINAL = ["verified", "failed", "cancelled", "rejected"];
    const allResolved = registrations.length > 0 && registrations.every(r => TERMINAL.includes(r.registrationStatus ?? ""));
    const hasVerified = registrations.some(r => r.registrationStatus === "verified");

    const [finalizing, setFinalizing] = useState(false);
    const [finalizeError, setFinalizeError] = useState<string | null>(null);

    // The finalize action only sets status to 'prepared' when hasVerified is true —
    // otherwise it resolves to 'cancelled', which the backend never date-gates, so
    // the mismatch warning is only relevant on the "prepare" path.
    const prepareGate = useScheduleGate(raceRound?.raceDate);

    const doFinalize = async (override: boolean) => {
        if (!raceRound?._id || !allResolved || finalizing) return;
        setFinalizing(true);
        setFinalizeError(null);
        try {
            await refereeService.finalizeRaceRound(raceRound._id, override);
            await refetchRegistrations();
        } catch (err: any) {
            setFinalizeError(err?.msg || 'Failed to finalize race. Please try again.');
        } finally {
            setFinalizing(false);
            prepareGate.close();
        }
    };

    const handleFinalize = () => {
        if (!raceRound?._id || !allResolved || finalizing) return;
        if (hasVerified && prepareGate.needsConfirm) {
            prepareGate.open();
            return;
        }
        doFinalize(false);
    };

    const postTime = raceRound?.raceDate
        ? new Date(raceRound.raceDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "-";
    const prizePool = raceRound?.firstPlacePrize
        ? `${raceRound.firstPlacePrize.toLocaleString()} ${raceRound.currencyType ?? "VND"}`
        : "-";

    const openInspection = (index: number) => {
        const registration = registrations[index];
        if (!registration) return;
        setInspecting({ registration, index });
    };

    // Cancelled/rejected registrations never race — nothing left to inspect, so they're
    // split into their own section below (with the Inspect button hidden) instead of
    // cluttering the active checklist. Original indices are preserved so openInspection
    // (and the "Gate N" number) still line up with the full registrations array.
    const indexedRegistrations = registrations.map((reg, index) => ({ reg, index }));
    const activeRegistrations = indexedRegistrations.filter(
        ({ reg }) => reg.registrationStatus !== "cancelled" && reg.registrationStatus !== "rejected"
    );
    const cancelledRegistrations = indexedRegistrations.filter(
        ({ reg }) => reg.registrationStatus === "cancelled" || reg.registrationStatus === "rejected"
    );

    const renderRegistrationRow = (reg: RegistrationDetail, index: number, showInspect: boolean = true) => {
        const registrationId = reg._id;
        const isChecked = checkedIds.has(registrationId);
        const regStatus = reg.registrationStatus;
        const horseName = reg.Horse?.horseName;
        const confirmedInv = reg.jockeyInRaceId
            ? reg.Invitations?.find(inv => inv._id === reg.jockeyInRaceId)
            : reg.Invitations?.find(inv => inv.jockeyConfirmation);
        const jockeyName = (confirmedInv?.jockeyId?._id as any)?.fullName as string | undefined;
        const ownerName = reg.Owner?.fullName;
        const jockeyConfirmed = confirmedInv?.jockeyConfirmation ?? false;
        const hasHorse = !!reg.Horse;
        const hasJockey = !!confirmedInv && !!jockeyName;
        const failReason = reg.verificationFailReason;

        return (
            <div
                key={registrationId}
                className={[
                    "rounded-xl border px-4 py-3 transition-all duration-150",
                    regStatus === "failed" ? "border-red-800/40 bg-red/5" :
                        regStatus === "verified" ? "border-green-800/40 bg-green-500/5" :
                            regStatus === "accepted" ? "border-amber-800/30 bg-amber-500/5" :
                                "border-border bg-white/[0.02]",
                ].join(" ")}
            >
                <div className="flex items-center gap-3">
                    {/* Gate number */}
                    <span className={[
                        "w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0",
                        gateCircleClass(regStatus, isChecked),
                    ].join(" ")}>
                        {index + 1}
                    </span>

                    {/* Horse / jockey info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[13.5px] font-bold text-text">
                                {horseName ?? <span className="text-text-muted font-medium italic">No horse assigned</span>}
                            </p>
                            {regStatusBadge(regStatus)}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {hasJockey ? (
                                <span className="flex items-center gap-1 text-[11.5px] text-text-muted">
                                    <UserCheck size={10} className={jockeyConfirmed ? "text-green-500" : "text-amber-500"} />
                                    {jockeyName}
                                    {!jockeyConfirmed && (
                                        <span className="text-amber-600 text-[10px]">· unconfirmed</span>
                                    )}
                                </span>
                            ) : hasHorse ? (
                                <span className="text-[11.5px] text-amber-600 flex items-center gap-1">
                                    <AlertTriangle size={10} /> No jockey assigned
                                </span>
                            ) : ownerName ? (
                                <span className="text-[11.5px] text-text-muted/70">Owner: {ownerName}</span>
                            ) : null}
                            {!hasHorse && (
                                <span className="text-[11.5px] text-red-600 flex items-center gap-1">
                                    <AlertTriangle size={10} /> No horse placed
                                </span>
                            )}
                        </div>
                        {failReason && (
                            <p className="text-[11px] text-red mt-0.5 flex items-center gap-1">
                                <AlertTriangle size={9} /> {failReason}
                            </p>
                        )}
                    </div>

                    {/* Inspect button */}
                    {showInspect && (
                        <button
                            onClick={() => openInspection(index)}
                            className={[
                                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-150 shrink-0",
                                regStatus === "failed"
                                    ? "border border-red-700/50 text-red bg-red/10 hover:bg-red/20"
                                    : regStatus === "verified"
                                        ? "border border-green-700/50 text-green bg-green/10 hover:bg-green-500/20"
                                        : "border border-yellow-700/50 text-amber bg-amber/10 hover:bg-yellow-500/20",
                            ].join(" ")}
                        >
                            <ClipboardList size={11} />
                            {regStatus === "failed" ? "Re-inspect" : regStatus === "verified" ? "Reviewed" : "Inspect"}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
                <div className="flex flex-col gap-4">

                    {/* Horse checklist */}
                    <div className="bg-surface rounded-xl border border-border overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                            <h2 className="text-[13px] font-bold text-text flex items-center gap-2 font-serif">
                                <ClipboardList size={14} className="text-amber" /> Horse Inspection Checklist
                            </h2>
                            <div className="flex items-center gap-2">
                                {pendingRegistrations.length > 0 && (
                                    <button
                                        onClick={() => setShowBulkCancelConfirm(true)}
                                        className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-red-800/50 text-red hover:bg-red/10 transition-colors"
                                    >
                                        <Ban size={12} /> Cancel All Pending ({pendingRegistrations.length})
                                    </button>
                                )}
                                <RefetchButton onRefetch={refetchRegistrations} lastUpdated={lastUpdated} />
                            </div>
                        </div>
                        {showBulkCancelConfirm && (
                            <div className="px-5 py-3 border-b border-red-900/40 bg-red/5 flex items-center justify-between gap-3 flex-wrap">
                                <p className="text-[12px] text-red">
                                    Cancel {pendingRegistrations.length} pending registration{pendingRegistrations.length > 1 ? "s" : ""} as no-show? Owners will be notified.
                                </p>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => setShowBulkCancelConfirm(false)}
                                        disabled={bulkCancelling}
                                        className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Keep
                                    </button>
                                    <button
                                        onClick={handleBulkCancelPending}
                                        disabled={bulkCancelling}
                                        className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-red text-text hover:bg-red/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {bulkCancelling ? <span className="animate-pulse">Cancelling…</span> : "Confirm Cancel All"}
                                    </button>
                                </div>
                            </div>
                        )}
                        {bulkCancelError && (
                            <p className="px-5 py-2 text-[11.5px] text-red flex items-center gap-1.5 border-b border-border">
                                <AlertTriangle size={11} /> {bulkCancelError}
                            </p>
                        )}
                        <div className="p-3 flex flex-col gap-2">
                            {registrationsError && (
                                <ErrorState message={registrationsError} onRetry={refetchRegistrations} />
                            )}
                            {!registrationsError && registrations.length === 0 && (
                                <p className="text-[12px] text-text-muted/70 text-center py-6">No horses registered for this race.</p>
                            )}
                            {!registrationsError && activeRegistrations.length === 0 && registrations.length > 0 && (
                                <p className="text-[12px] text-text-muted/70 text-center py-6">All registrations for this race have been cancelled.</p>
                            )}
                            {!registrationsError && activeRegistrations.map(({ reg, index }) => renderRegistrationRow(reg, index))}
                        </div>
                    </div>

                    {/* Cancelled / rejected registrations — nothing to inspect, kept separate
                        from the active checklist above so they don't clutter it. */}
                    {cancelledRegistrations.length > 0 && (
                        <div className="bg-surface rounded-xl border border-border overflow-hidden opacity-75">
                            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                                <h2 className="text-[13px] font-bold text-text-muted flex items-center gap-2 font-serif">
                                    <AlertTriangle size={14} className="text-text-muted" /> Cancelled Entries
                                </h2>
                            </div>
                            <div className="p-3 flex flex-col gap-2">
                                {cancelledRegistrations.map(({ reg, index }) => renderRegistrationRow(reg, index, false))}
                            </div>
                        </div>
                    )}

                    {/* Venue & Track */}
                    <div className="bg-surface rounded-xl border border-border p-5">
                        <h2 className="text-[13px] font-bold text-text mb-4 font-serif">Venue & Track</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Surface", value: raceRound?.raceGround ?? "-" },
                                { label: "Distance", value: raceRound?.trackLength ? `${raceRound.trackLength}m` : "-" },
                                { label: "Location", value: raceRound?.location ?? "-" },
                                { label: "Address", value: raceRound?.address ?? "-" },
                            ].map(item => (
                                <div key={item.label} className="bg-white/[0.03] rounded-lg border border-border/60 px-3 py-2.5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted/70 mb-0.5">{item.label}</p>
                                    <p className="text-[13px] font-semibold text-text truncate">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT */}
                <div className="flex flex-col gap-4">
                    <div className="bg-surface rounded-xl border border-border p-4">
                        <h2 className="text-[10.5px] font-bold uppercase tracking-widest text-text-muted/70 mb-3">Race Details</h2>
                        {[
                            { label: "Race Type", value: raceRound?.RaceType?.raceType ?? "-" },
                            { label: "Prize Pool", value: prizePool },
                            { label: "Post Time", value: postTime },
                            { label: "Entries", value: `${registrations.length} horses` },
                        ].map(item => (
                            <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
                                <span className="text-[12px] text-text-muted">{item.label}</span>
                                <span className="text-[12px] font-semibold text-text">{item.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-surface rounded-xl border border-border p-4">
                        <h2 className="text-[10.5px] font-bold uppercase tracking-widest text-text-muted/70 mb-3">Inspection Progress</h2>
                        {(() => {
                            const verifiedCount = registrations.filter(r => r.registrationStatus === "verified").length;
                            const failedCount = registrations.filter(r => r.registrationStatus === "failed").length;
                            const cancelledCount = registrations.filter(r => r.registrationStatus === "cancelled" || r.registrationStatus === "rejected").length;
                            const pendingCount = registrations.filter(r => r.registrationStatus !== "verified" && r.registrationStatus !== "failed" && r.registrationStatus !== "cancelled" && r.registrationStatus !== "rejected").length;
                            return [
                                {
                                    label: "Verified",
                                    ok: verifiedCount > 1,
                                    value: `${verifiedCount}`,
                                },
                                {
                                    label: "Failed",
                                    ok: failedCount === 0,
                                    value: `${failedCount}`,
                                },
                                {
                                    label: "Pending",
                                    ok: pendingCount === 0,
                                    value: `${pendingCount}`,
                                },
                                {
                                    label: "Cancelled",
                                    ok: true,
                                    value: `${cancelledCount}`,
                                },
                                { label: "Track Inspection", ok: true, value: "Cleared" },
                            ].map(item => (
                                <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
                                    <span className="text-[12px] text-text-muted">{item.label}</span>
                                    {item.ok
                                        ? <span className="flex items-center gap-1 text-[11px] font-bold text-green"><CheckCircle2 size={11} />{item.value}</span>
                                        : <span className="flex items-center gap-1 text-[11px] font-bold text-amber"><Clock size={11} />{item.value}</span>
                                    }
                                </div>
                            ));
                        })()}
                    </div>

                    {/* Finalize button / status */}
                    {(() => {
                        const currentStatus = localStatus ?? raceRound?.status;

                        if (currentStatus === "prepared") {
                            return (
                                <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green/10 border border-green-700/50 text-green text-[13px] font-bold uppercase tracking-widest">
                                    <CheckCircle2 size={14} /> Race Has Been Prepared
                                </div>
                            );
                        }

                        if (currentStatus === "cancelled") {
                            return (
                                <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red/10 border border-red-700/50 text-red text-[13px] font-bold uppercase tracking-widest">
                                    <Ban size={14} /> Race Cancelled
                                </div>
                            );
                        }

                        if (!allResolved) {
                            return (
                                <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 text-text-muted border border-border text-[13px] font-bold uppercase tracking-widest">
                                    <Clock size={14} /> Awaiting Clearance
                                </div>
                            );
                        }

                        return (
                            <div className="flex flex-col gap-2">
                                {finalizeError && (
                                    <p className="text-[11.5px] text-red flex items-center gap-1.5 px-1">
                                        <AlertTriangle size={11} /> {finalizeError}
                                    </p>
                                )}
                                <button
                                    onClick={handleFinalize}
                                    disabled={finalizing}
                                    className={[
                                        "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold uppercase tracking-widest transition-all duration-150",
                                        finalizing
                                            ? "bg-white/5 text-text-muted/70 border border-border cursor-not-allowed"
                                            : hasVerified
                                                ? "bg-green-700 text-text hover:bg-green-600 shadow-lg shadow-green-900/30"
                                                : "bg-red text-text hover:bg-red/85 shadow-lg shadow-red-900/30",
                                    ].join(" ")}
                                >
                                    {finalizing
                                        ? <><Clock size={14} className="animate-spin" /> Finalizing…</>
                                        : hasVerified
                                            ? <><CheckCircle2 size={14} /> Prepare Race</>
                                            : <><Ban size={14} /> Cancel Race — No Eligible Entries</>
                                    }
                                </button>
                            </div>
                        );
                    })()}
                </div>
            </div>

            <ScheduleConfirmModal
                open={prepareGate.isOpen}
                title="Race Date Mismatch"
                message={prepareGate.warningMessage}
                actionVerb="Prepare"
                pendingLabel="Preparing..."
                pending={finalizing}
                error={finalizeError}
                onConfirm={() => doFinalize(true)}
                onCancel={prepareGate.close}
            />

            {inspecting && raceRound?._id && (
                <PreRaceInspectionModal
                    registration={inspecting.registration}
                    raceRoundId={raceRound._id}
                    gateNumber={inspecting.index + 1}
                    onClose={() => setInspecting(null)}
                    onVerified={(registrationId, status) => {
                        if (status === "verified") toggle(registrationId);
                        setInspecting(null);
                        refetchRegistrations();
                    }}
                />
            )}
        </>
    );
}
