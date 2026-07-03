import { useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, Clock, Flag, UserCheck } from "lucide-react";
import PreRaceInspectionModal from "./modal/PreRaceCheckup";
import type { RegistrationDetail } from "../../providers/useRaceSocket";
import { useRaceSocket } from "../../providers/useRaceSocket";
import { refereeService } from "../../api/refereeService";

// ── Status helpers ────────────────────────────────────────────────────────────

function regStatusBadge(status?: string) {
    switch (status) {
        case "verified": return <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-700/40 px-1.5 py-0.5 rounded-md">Verified</span>;
        case "failed": return <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-700/40 px-1.5 py-0.5 rounded-md">Failed</span>;
        case "approved": return <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-700/40 px-1.5 py-0.5 rounded-md">Approved</span>;
        case "cancelled": return <span className="text-[10px] font-bold text-gray-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-md">Cancelled</span>;
        default: return <span className="text-[10px] font-bold text-gray-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-md">Pending</span>;
    }
}

function gateCircleClass(status?: string, isChecked?: boolean) {
    if (status === "failed") return "bg-red-700 text-white";
    if (status === "verified") return "bg-green-700 text-white";
    if (status === "approved") return "bg-amber-700 text-white";
    if (isChecked) return "bg-green-700 text-white";
    return "bg-white/8 text-gray-400";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PreRacePage() {
    const { wsConnected, wsCount, raceRound } = useRaceSocket();
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
    const [inspecting, setInspecting] = useState<{ registration: RegistrationDetail; index: number } | null>(null);
    const [localRegistrations, setLocalRegistrations] = useState<RegistrationDetail[] | null>(null);
    const [localStatus, setLocalStatus] = useState<string | null>(null);

    const toggle = (registrationId: string) => setCheckedIds(prev => {
        const s = new Set(prev);
        s.has(registrationId) ? s.delete(registrationId) : s.add(registrationId);
        return s;
    });

    const refetchRegistrations = async () => {
        if (!raceRound?._id) return;
        try {
            const res = await refereeService.getRaceRoundById(raceRound._id);
            if (res.code === 200 && res.data) {
                if (res.data.Registration) {
                    setLocalRegistrations(res.data.Registration);
                }
                if (res.data.status) {
                    setLocalStatus(res.data.status);
                }
            }
        } catch { }
    };

    const registrations = localRegistrations ?? raceRound?.Registration ?? [];

    const TERMINAL = ["verified", "failed", "cancelled", "rejected"];
    const allResolved = registrations.length > 0 && registrations.every(r => TERMINAL.includes(r.registrationStatus ?? ""));
    const hasVerified = registrations.some(r => r.registrationStatus === "verified");

    const [finalizing, setFinalizing] = useState(false);
    const [finalizeError, setFinalizeError] = useState<string | null>(null);

    const handleFinalize = async () => {
        if (!raceRound?._id || !allResolved || finalizing) return;
        setFinalizing(true);
        setFinalizeError(null);
        try {
            await refereeService.finalizeRaceRound(raceRound._id);
            await refetchRegistrations();
        } catch (err: any) {
            setFinalizeError(err?.msg || 'Failed to finalize race. Please try again.');
        } finally {
            setFinalizing(false);
        }
    };

    const postTime = raceRound?.raceDate
        ? new Date(raceRound.raceDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "-";
    const prizePool = raceRound?.firstPlacePrize
        ? `${raceRound.firstPlacePrize.toLocaleString()} ${raceRound.currencyType ?? "USD"}`
        : "-";

    const openInspection = (index: number) => {
        const registration = registrations[index];
        if (!registration) return;
        setInspecting({ registration, index });
    };

    return (
        <>
            {/* WS status badge */}
            <div className={[
                "flex items-center gap-2.5 self-start px-3 py-1.5 rounded-xl border text-[11px] font-bold font-mono mb-2 transition-all duration-300",
                wsConnected
                    ? "border-emerald-700/60 bg-emerald-500/10 text-emerald-400"
                    : "border-red-800/50 bg-red-500/10 text-red-500 animate-pulse",
            ].join(" ")}>
                <span className={["w-2 h-2 rounded-full", wsConnected ? "bg-emerald-400 animate-pulse" : "bg-red-500"].join(" ")} />
                {wsConnected ? <>WS Connected &nbsp;·&nbsp; ping #{wsCount ?? "…"}</> : <>WS Disconnected</>}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
                <div className="flex flex-col gap-4">

                    {/* Horse checklist */}
                    <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
                            <h2 className="text-[13px] font-bold text-white flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                                <ClipboardList size={14} className="text-yellow-500" /> Horse Inspection Checklist
                            </h2>
                            <span className="text-[11px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-700/50 px-2.5 py-0.5 rounded-full">
                                {checkedIds.size}/{registrations.length} Checked
                            </span>
                        </div>
                        <div className="p-3 flex flex-col gap-2">
                            {registrations.length === 0 && (
                                <p className="text-[12px] text-gray-600 text-center py-6">No horses registered for this race.</p>
                            )}
                            {registrations.map((reg, index) => {
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
                                            regStatus === "failed" ? "border-red-800/40 bg-red-500/5" :
                                                regStatus === "verified" ? "border-green-800/40 bg-green-500/5" :
                                                    regStatus === "approved" ? "border-amber-800/30 bg-amber-500/5" :
                                                        "border-white/8 bg-white/[0.02]",
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
                                                    <p className="text-[13.5px] font-bold text-white">
                                                        {horseName ?? <span className="text-gray-500 font-medium italic">No horse assigned</span>}
                                                    </p>
                                                    {regStatusBadge(regStatus)}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                    {hasJockey ? (
                                                        <span className="flex items-center gap-1 text-[11.5px] text-gray-500">
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
                                                        <span className="text-[11.5px] text-gray-600">Owner: {ownerName}</span>
                                                    ) : null}
                                                    {!hasHorse && (
                                                        <span className="text-[11.5px] text-red-600 flex items-center gap-1">
                                                            <AlertTriangle size={10} /> No horse placed
                                                        </span>
                                                    )}
                                                </div>
                                                {failReason && (
                                                    <p className="text-[11px] text-red-500 mt-0.5 flex items-center gap-1">
                                                        <AlertTriangle size={9} /> {failReason}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Inspect button */}
                                            <button
                                                onClick={() => openInspection(index)}
                                                className={[
                                                    "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-150 shrink-0",
                                                    regStatus === "failed"
                                                        ? "border border-red-700/50 text-red-400 bg-red-500/10 hover:bg-red-500/20"
                                                        : regStatus === "verified"
                                                            ? "border border-green-700/50 text-green-400 bg-green-500/10 hover:bg-green-500/20"
                                                            : "border border-yellow-700/50 text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20",
                                                ].join(" ")}
                                            >
                                                <ClipboardList size={11} />
                                                {regStatus === "failed" ? "Re-inspect" : regStatus === "verified" ? "Reviewed" : "Inspect"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Venue & Track */}
                    <div className="bg-[#1a1a1a] rounded-xl border border-white/8 p-5">
                        <h2 className="text-[13px] font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Venue & Track</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Surface", value: raceRound?.raceGround ?? "-" },
                                { label: "Distance", value: raceRound?.trackLength ? `${raceRound.trackLength}m` : "-" },
                                { label: "Location", value: raceRound?.location ?? "-" },
                                { label: "Address", value: raceRound?.address ?? "-" },
                            ].map(item => (
                                <div key={item.label} className="bg-white/[0.03] rounded-lg border border-white/6 px-3 py-2.5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-0.5">{item.label}</p>
                                    <p className="text-[13px] font-semibold text-white truncate">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT */}
                <div className="flex flex-col gap-4">
                    <div className="bg-[#1a1a1a] rounded-xl border border-white/8 p-4">
                        <h2 className="text-[10.5px] font-bold uppercase tracking-widest text-gray-600 mb-3">Race Details</h2>
                        {[
                            { label: "Grade", value: raceRound?.RaceType?.gradeLevel ?? "-" },
                            { label: "Race Type", value: raceRound?.RaceType?.raceType ?? "-" },
                            { label: "Prize Pool", value: prizePool },
                            { label: "Post Time", value: postTime },
                            { label: "Entries", value: `${registrations.length} horses` },
                        ].map(item => (
                            <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <span className="text-[12px] text-gray-500">{item.label}</span>
                                <span className="text-[12px] font-semibold text-white">{item.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-[#1a1a1a] rounded-xl border border-white/8 p-4">
                        <h2 className="text-[10.5px] font-bold uppercase tracking-widest text-gray-600 mb-3">Inspection Progress</h2>
                        {(() => {
                            const verifiedCount = registrations.filter(r => r.registrationStatus === "verified").length;
                            const failedCount = registrations.filter(r => r.registrationStatus === "failed").length;
                            const cancelledCount = registrations.filter(r => r.registrationStatus === "cancelled" || r.registrationStatus === "rejected").length;
                            const pendingCount = registrations.filter(r => r.registrationStatus !== "verified" && r.registrationStatus !== "failed" && r.registrationStatus !== "cancelled" && r.registrationStatus !== "rejected").length;
                            return [
                                {
                                    label: "Verified",
                                    ok: verifiedCount === registrations.length,
                                    value: `${verifiedCount} / ${registrations.length}`,
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
                                <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                    <span className="text-[12px] text-gray-500">{item.label}</span>
                                    {item.ok
                                        ? <span className="flex items-center gap-1 text-[11px] font-bold text-green-400"><CheckCircle2 size={11} />{item.value}</span>
                                        : <span className="flex items-center gap-1 text-[11px] font-bold text-yellow-400"><Clock size={11} />{item.value}</span>
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
                                <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/10 border border-green-700/50 text-green-400 text-[13px] font-bold uppercase tracking-widest">
                                    <CheckCircle2 size={14} /> Race Has Been Prepared
                                </div>
                            );
                        }

                        if (currentStatus === "cancelled") {
                            return (
                                <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 border border-red-700/50 text-red-400 text-[13px] font-bold uppercase tracking-widest">
                                    <Flag size={14} /> Race Cancelled
                                </div>
                            );
                        }

                        if (!allResolved) {
                            return (
                                <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 text-gray-500 border border-white/8 text-[13px] font-bold uppercase tracking-widest">
                                    <Clock size={14} /> Awaiting Clearance
                                </div>
                            );
                        }

                        return (
                            <div className="flex flex-col gap-2">
                                {finalizeError && (
                                    <p className="text-[11.5px] text-red-400 flex items-center gap-1.5 px-1">
                                        <AlertTriangle size={11} /> {finalizeError}
                                    </p>
                                )}
                                <button
                                    onClick={handleFinalize}
                                    disabled={finalizing}
                                    className={[
                                        "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold uppercase tracking-widest transition-all duration-150",
                                        finalizing
                                            ? "bg-white/5 text-gray-600 border border-white/8 cursor-not-allowed"
                                            : hasVerified
                                                ? "bg-green-700 text-white hover:bg-green-600 shadow-lg shadow-green-900/30"
                                                : "bg-red-700 text-white hover:bg-red-600 shadow-lg shadow-red-900/30",
                                    ].join(" ")}
                                >
                                    {finalizing
                                        ? <><Clock size={14} className="animate-spin" /> Finalizing…</>
                                        : hasVerified
                                            ? <><CheckCircle2 size={14} /> Prepare Race</>
                                            : <><Flag size={14} /> Cancel Race — No Eligible Entries</>
                                    }
                                </button>
                            </div>
                        );
                    })()}
                </div>
            </div>

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
