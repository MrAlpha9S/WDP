import React from "react";
import { X, Calendar, ShieldAlert, ScrollText } from "lucide-react";
import type { RaceEligibilityRule } from "../AdminRuleManagementPage";
import { STATUS_STYLES } from "../AdminRuleManagementPage";

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

export default function RuleDetailPanel({ 
    rule, 
    onClose, 
    onEdit, 
    onToggleActive 
}: { 
    rule: RaceEligibilityRule; 
    onClose: () => void;
    onEdit: (rule: RaceEligibilityRule) => void;
    onToggleActive: (rule: RaceEligibilityRule) => void;
}) {
    const statusStyle = STATUS_STYLES[rule.isActive ? "active" : "inactive"];

    return (
        <div
            className="flex flex-col bg-[#141414] border border-white/[0.07] rounded-xl overflow-hidden h-full"
            style={{ animation: "panelIn 0.18s ease-out" }}
        >
            <style>{`@keyframes panelIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }`}</style>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07] flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full bg-amber-500" />
                    <p className="text-[13px] font-semibold text-white">Rule Details</p>
                </div>
                <button onClick={onClose} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors">
                    <X size={14} />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 px-5 py-4 flex flex-col gap-4 min-h-0 overflow-y-auto custom-scrollbar">

                {/* Identity */}
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 flex-shrink-0">
                        <ScrollText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[16px] font-semibold text-white">{rule.raceType || <span className="italic text-gray-500">Any Race Type</span>}</p>
                        <p className="text-[11px] text-gray-500">ID: {rule._id}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`flex items-center gap-1 text-[11px] font-medium ${statusStyle.color}`}>
                            {statusStyle.icon}{statusStyle.text}
                        </span>
                    </div>
                </div>

                {/* Status Pills */}
                <div className="grid grid-cols-1 gap-3 mt-2">
                    <div className={`flex items-center justify-between p-3 rounded-lg border ${rule.licenseRequired ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-gray-500/10 border-white/5 text-gray-500'}`}>
                        <div className="flex items-center gap-2">
                            <ShieldAlert size={14} />
                            <span className="text-[11px] font-semibold uppercase tracking-wider">License</span>
                        </div>
                        <span className="text-[12px] font-bold">{rule.licenseRequired ? "Required" : "Not Required"}</span>
                    </div>
                </div>

                {/* Base info */}
                <div className="mt-2">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-3.5 rounded-full bg-blue-400" />
                        <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Age & Experience</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] px-3 flex flex-col">
                        <DetailRow label="Min Age" value={rule.minAge != null ? `${rule.minAge} years` : null} />
                        <DetailRow label="Max Age" value={rule.maxAge != null ? `${rule.maxAge} years` : null} />
                        <DetailRow label="Min Races Run" value={rule.minRacesRun} />
                        <DetailRow label="Min Races Won" value={rule.minRacesWon} />
                    </div>
                </div>

                {/* Requirements info */}
                <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-3.5 rounded-full bg-purple-400" />
                        <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Traits</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] px-3 flex flex-col">
                        <DetailRow label="Required Breed" value={rule.requiredBreed} />
                        <DetailRow label="Required Gender" value={rule.requiredGender ? <span className="capitalize">{rule.requiredGender}</span> : null} />
                    </div>
                </div>
                
                {/* System info */}
                <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-3.5 rounded-full bg-gray-500" />
                        <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">System</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] px-3 flex flex-col">
                        <DetailRow label="Created At" value={rule.create_at ? new Date(rule.create_at).toLocaleString() : "N/A"} />
                        <DetailRow label="Updated At" value={rule.updated_at ? new Date(rule.updated_at).toLocaleString() : "N/A"} />
                    </div>
                </div>

            </div>

            {/* Footer */}
            <div className="flex gap-2 px-5 py-3 border-t border-white/[0.07] flex-shrink-0">
                <button onClick={() => onEdit(rule)} className="flex-1 text-[12px] font-semibold bg-white/[0.05] hover:bg-white/[0.09] text-gray-300 py-2 rounded-lg transition-colors border border-white/[0.07]">
                    Edit Rule
                </button>
                {rule.isActive ? (
                    <button onClick={() => onToggleActive(rule)} className="flex-1 text-[12px] font-semibold bg-red-700/20 hover:bg-red-700/30 text-red-400 py-2 rounded-lg transition-colors border border-red-700/30">
                        Deactivate
                    </button>
                ) : (
                    <button onClick={() => onToggleActive(rule)} className="flex-1 text-[12px] font-semibold bg-emerald-700/20 hover:bg-emerald-700/30 text-emerald-400 py-2 rounded-lg transition-colors border border-emerald-700/30">
                        Activate
                    </button>
                )}
            </div>
        </div>
    );
}
