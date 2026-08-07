import { useState } from "react";
import { X, AlertTriangle, Calendar, Shield, Flag, Hash, Loader2 } from "lucide-react";
import type { ViolationEntity, ViolationStatus, StewardAction } from "../../../shared/types/ViolationTypes";
import { adminService } from "../../../api/adminService";
import StatusBadge, { type BadgeTone } from "../../../components/ui/StatusBadge";

interface ViolationDetailPanelProps {
    violation: ViolationEntity;
    onClose: () => void;
    onDismissed: (id: string) => void;
}

const STATUS_TONE: Record<ViolationStatus, BadgeTone> = {
    pending: 'amber',
    confirmed: 'green',
    dismissed: 'neutral',
};

const STEWARD_STYLES: Record<StewardAction, string> = {
    'no-action':       'text-gray-400',
    'warning':         'text-yellow-400',
    'fine':            'text-orange-400',
    'suspended':       'text-red-400',
    'disqualified':    'text-red-500',
    'demoted':         'text-orange-500',
    'investigation':   'text-blue-400',
    'permanent-ban':   'text-red-600',
};

const SEVERITY_COLORS = ['', 'text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-400', 'text-red-600'];

function fmtDate(raw: string | null | undefined) {
    if (!raw) return '—';
    return new Date(raw).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">{label}</span>
            <div className="text-[13px] text-gray-200">{children}</div>
        </div>
    );
}

export default function ViolationDetailPanel({ violation, onClose, onDismissed }: ViolationDetailPanelProps) {
    const [dismissing, setDismissing] = useState(false);

    const vt = violation.violationTypeId;
    const round = typeof violation.raceRoundId === 'object' ? violation.raceRoundId : null;
    const status = violation.violationStatus;

    const handleDismiss = async () => {
        setDismissing(true);
        try {
            await adminService.dismissViolation(violation._id);
            onDismissed(violation._id);
        } catch {
            // ignore — parent will still reflect stale data until next fetch
        } finally {
            setDismissing(false);
        }
    };

    return (
        <div className="h-full bg-surface border border-border/60 rounded-xl flex flex-col overflow-hidden shadow-lg shadow-black/20"
            style={{ animation: 'panelIn 0.18s ease-out' }}>
            <style>{`@keyframes panelIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }`}</style>

            {/* Header */}
            <div className="px-5 py-4 shrink-0 border-b border-border/60 bg-surface flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={15} className="text-gold shrink-0" />
                        <h2 className="text-[16px] font-bold text-text truncate">
                            {vt?.violationName ?? 'Violation'}
                        </h2>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <StatusBadge label={status} tone={STATUS_TONE[status]} dot={false} />
                        {vt?.type && (
                            <StatusBadge label={vt.type} tone="violet" dot={false} />
                        )}
                        {vt?.category && (
                            <StatusBadge label={vt.category} tone="blue" dot={false} />
                        )}
                    </div>
                </div>
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="p-1.5 bg-white/5 hover:bg-white/10 text-text-muted hover:text-text rounded border border-border transition-colors shrink-0 cursor-pointer"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-5">

                {/* Race Round */}
                {round && (
                    <div className="bg-surface rounded-xl border border-border/60 p-4 flex flex-col gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Race Round</span>
                        <div className="flex items-center gap-2 text-[13px] text-white font-semibold">
                            <Flag size={13} className="text-gray-500 shrink-0" />
                            {round.roundName}
                        </div>
                        <div className="flex items-center gap-2 text-[12px] text-gray-400">
                            <Calendar size={12} className="text-gray-500 shrink-0" />
                            {fmtDate(round.raceDate)}
                        </div>
                    </div>
                )}

                {/* Severity + Steward Action */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface rounded-xl border border-border/60 p-4 flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Severity</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i} className={`w-2.5 h-2.5 rounded-full ${i < violation.severity ? SEVERITY_COLORS[violation.severity].replace('text-', 'bg-') : 'bg-white/10'}`} />
                            ))}
                            <span className={`ml-1 text-[13px] font-bold ${SEVERITY_COLORS[violation.severity] ?? 'text-gray-300'}`}>
                                {violation.severity}/5
                            </span>
                        </div>
                    </div>
                    <div className="bg-surface rounded-xl border border-border/60 p-4 flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Steward Action</span>
                        <span className={`text-[13px] font-semibold mt-0.5 capitalize ${STEWARD_STYLES[violation.stewardAction] ?? 'text-gray-300'}`}>
                            {violation.stewardAction ? violation.stewardAction.replace(/-/g, ' ') : '—'}
                        </span>
                    </div>
                </div>

                {/* Details */}
                <div className="bg-surface rounded-xl border border-border/60 p-4 flex flex-col gap-4">
                    {violation.description && (
                        <Field label="Description">
                            <p className="text-[12px] text-gray-400 leading-relaxed">{violation.description}</p>
                        </Field>
                    )}
                    {violation.actualPenalty && (
                        <Field label="Actual Penalty">
                            <span className="text-orange-300">{violation.actualPenalty}</span>
                        </Field>
                    )}
                    {vt?.defaultPenalty && (
                        <Field label="Default Penalty">
                            <span className="text-gray-400">{vt.defaultPenalty}</span>
                        </Field>
                    )}
                </div>

                {/* Meta */}
                <div className="bg-surface rounded-xl border border-border/60 p-4 flex flex-col gap-3">
                    <Field label="Logged At">
                        <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
                            <Calendar size={12} className="text-gray-500" />
                            {fmtDate(violation.created_at)}
                        </div>
                    </Field>
                    <Field label="Violation ID">
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-600 font-mono">
                            <Hash size={11} className="text-gray-700" />
                            {violation._id}
                        </div>
                    </Field>
                </div>

                {/* Dismiss action */}
                {status === 'pending' && (
                    <button
                        onClick={handleDismiss}
                        disabled={dismissing}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-gray-600/40 bg-gray-600/10 text-gray-300 hover:bg-gray-600/20 text-[12px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {dismissing ? <><Loader2 size={13} className="animate-spin" /> Dismissing…</> : <><Shield size={13} /> Dismiss Violation</>}
                    </button>
                )}
            </div>
        </div>
    );
}
