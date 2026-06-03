import { useState } from "react";
import { CheckCircle2, ClipboardList, Clock, Flag, Shield, ShieldCheck } from "lucide-react";
import PreRaceInspectionModal from "./modal/PreRaceCheckup";
import { RACE, HORSES, statusBadge } from "../../shared/data/RaceData";
import type { HorseEntry } from "../../shared/types/RaceTypes";

export default function PreRacePage() {
    const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
    const [inspectingHorse, setInspectingHorse] = useState<HorseEntry | null>(null);
    const toggle = (n: number) => setCheckedIds(prev => { const s = new Set(prev); s.has(n) ? s.delete(n) : s.add(n); return s; });
    const allClear = HORSES.every(h => h.gearStatus !== "review" && h.jockeyStatus !== "pending") && checkedIds.size === HORSES.length;

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
                <div className="flex flex-col gap-4">

                    {/* Horse checklist */}
                    <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
                            <h2 className="text-[13px] font-bold text-white flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                                <ClipboardList size={14} className="text-yellow-500" /> Horse Inspection Checklist
                            </h2>
                            <span className="text-[11px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-700/50 px-2.5 py-0.5 rounded-full">
                                {checkedIds.size}/{HORSES.length} Checked
                            </span>
                        </div>
                        <div className="p-3 flex flex-col gap-2">
                            {HORSES.map(horse => {
                                const isChecked = checkedIds.has(horse.number);
                                const hasIssue = horse.gearStatus === "review" || horse.jockeyStatus === "review";
                                return (
                                    <div
                                        key={horse.number}
                                        className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={["w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0",
                                                hasIssue ? "bg-red-700 text-white" : isChecked ? "bg-green-700 text-white" : "bg-white/8 text-gray-400"].join(" ")}>
                                                {horse.number}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13.5px] font-bold text-white">{horse.name}</p>
                                                <p className="text-[11.5px] text-gray-500 mt-0.5">{horse.jockey} &nbsp;·&nbsp; {horse.trainer} &nbsp;·&nbsp; {horse.weight}</p>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="flex items-center gap-1.5 text-[10.5px] text-gray-500">
                                                        <Shield size={10} /> Gear &nbsp;{statusBadge(horse.gearStatus)}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10.5px] text-gray-500">
                                                        <ShieldCheck size={10} /> Jockey &nbsp;{statusBadge(horse.jockeyStatus)}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setInspectingHorse(horse)}
                                                    className={[
                                                        "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-150 shrink-0",
                                                        hasIssue ? "bg-red-700 text-white hover:bg-red-600"
                                                            : isChecked ? "border border-green-700/50 text-green-400 bg-green-500/10 hover:bg-green-500/20"
                                                                : "border border-yellow-700/50 text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20",
                                                    ].join(" ")}
                                                >
                                                    <ClipboardList size={11} />
                                                    {isChecked ? "Review" : "Inspect"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Track conditions */}
                    <div className="bg-[#1a1a1a] rounded-xl border border-white/8 p-5">
                        <h2 className="text-[13px] font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Track & Conditions</h2>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: "Surface", value: RACE.track },
                                { label: "Condition", value: RACE.condition },
                                { label: "Distance", value: RACE.distance },
                                { label: "Weather", value: "Clear" },
                                { label: "Wind", value: "5 mph NW" },
                                { label: "Temp", value: "62°F" },
                            ].map(item => (
                                <div key={item.label} className="bg-white/[0.03] rounded-lg border border-white/6 px-3 py-2.5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-0.5">{item.label}</p>
                                    <p className="text-[13px] font-semibold text-white">{item.value}</p>
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
                            { label: "Grade", value: RACE.grade },
                            { label: "Prize Pool", value: RACE.prizePool },
                            { label: "Post Time", value: RACE.scheduledTime },
                            { label: "Entries", value: `${HORSES.length} horses` },
                        ].map(item => (
                            <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <span className="text-[12px] text-gray-500">{item.label}</span>
                                <span className="text-[12px] font-semibold text-white">{item.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-[#1a1a1a] rounded-xl border border-white/8 p-4">
                        <h2 className="text-[10.5px] font-bold uppercase tracking-widest text-gray-600 mb-3">Clearance Status</h2>
                        {[
                            { label: "Gear Check", ok: HORSES.every(h => h.gearStatus !== "review") },
                            { label: "Jockey Weigh-In", ok: HORSES.every(h => h.jockeyStatus !== "pending") },
                            { label: "Track Inspection", ok: true },
                            { label: "All Horses Checked", ok: checkedIds.size === HORSES.length },
                        ].map(item => (
                            <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <span className="text-[12px] text-gray-500">{item.label}</span>
                                {item.ok
                                    ? <span className="flex items-center gap-1 text-[11px] font-bold text-green-400"><CheckCircle2 size={11} />Cleared</span>
                                    : <span className="flex items-center gap-1 text-[11px] font-bold text-yellow-400"><Clock size={11} />Pending</span>
                                }
                            </div>
                        ))}
                    </div>

                    <button
                        className={["w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold uppercase tracking-widest transition-all duration-150",
                            allClear ? "bg-yellow-600 text-white hover:bg-yellow-500 shadow-lg shadow-yellow-900/30" : "bg-white/5 text-gray-600 border border-white/8 cursor-not-allowed",
                        ].join(" ")}
                        disabled={!allClear}
                    >
                        <Flag size={14} />
                        {allClear ? "Authorize Race Start" : "Awaiting Clearance"}
                    </button>
                </div>
            </div>

            {inspectingHorse && (
                <PreRaceInspectionModal
                    horse={inspectingHorse}
                    onClose={() => setInspectingHorse(null)}
                    onSubmit={(passed) => {
                        if (passed) toggle(inspectingHorse.number);
                        setInspectingHorse(null);
                    }}
                />
            )}
        </>
    );
}