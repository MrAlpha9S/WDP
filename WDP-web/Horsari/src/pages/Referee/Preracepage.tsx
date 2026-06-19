import { useState } from "react";
import { CheckCircle2, ClipboardList, Clock, Flag, Shield, ShieldCheck } from "lucide-react";
import PreRaceInspectionModal from "./modal/PreRaceCheckup";
import { statusBadge } from "../../shared/data/RaceData";
import type { HorseEntry } from "../../shared/types/RaceTypes";
import { useRaceSocket } from "../../providers/useRaceSocket";

export default function PreRacePage() {
    const { wsConnected, wsCount, horses, raceRound } = useRaceSocket();
    const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
    const [inspectingHorse, setInspectingHorse] = useState<HorseEntry | null>(null);

    const toggle = (n: number) => setCheckedIds(prev => {
        const s = new Set(prev);
        s.has(n) ? s.delete(n) : s.add(n);
        return s;
    });

    const allClear =
        horses.every(h => h.gearStatus !== "review" && h.jockeyStatus !== "pending") &&
        checkedIds.size === horses.length;

    const postTime = raceRound?.raceDate
        ? new Date(raceRound.raceDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "-";

    const prizePool = raceRound?.firstPlacePrize
        ? `${raceRound.firstPlacePrize.toLocaleString()} ${raceRound.currencyType ?? "USD"}`
        : "-";

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
                                {checkedIds.size}/{horses.length} Checked
                            </span>
                        </div>
                        <div className="p-3 flex flex-col gap-2">
                            {horses.length === 0 && (
                                <p className="text-[12px] text-gray-600 text-center py-6">No horses registered for this race.</p>
                            )}
                            {horses.map(horse => {
                                const isChecked = checkedIds.has(horse.number);
                                const hasIssue = horse.gearStatus === "review" || horse.jockeyStatus === "review";
                                return (
                                    <div key={horse.number} className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <span className={[
                                                "w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0",
                                                hasIssue ? "bg-red-700 text-white" : isChecked ? "bg-green-700 text-white" : "bg-white/8 text-gray-400",
                                            ].join(" ")}>
                                                {horse.number}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13.5px] font-bold text-white">{horse.name}</p>
                                                <p className="text-[11.5px] text-gray-500 mt-0.5">
                                                    {horse.jockey}
                                                    {horse.trainer !== "-" && <> &nbsp;·&nbsp; {horse.trainer}</>}
                                                    {horse.weight !== "-" && <> &nbsp;·&nbsp; {horse.weight}</>}
                                                </p>
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
                                                        hasIssue
                                                            ? "bg-red-700 text-white hover:bg-red-600"
                                                            : isChecked
                                                                ? "border border-green-700/50 text-green-400 bg-green-500/10 hover:bg-green-500/20"
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
                                { label: "Surface", value: raceRound?.raceGround ?? "-" },
                                { label: "Condition", value: "-" },
                                { label: "Distance", value: raceRound?.trackLength ? `${raceRound.trackLength}m` : "-" },
                                { label: "Weather", value: "-" },
                                { label: "Wind", value: "-" },
                                { label: "Temp", value: "-" },
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
                            { label: "Grade", value: raceRound?.RaceType?.gradeLevel ?? "-" },
                            { label: "Race Type", value: raceRound?.RaceType?.raceType ?? "-" },
                            { label: "Prize Pool", value: prizePool },
                            { label: "Post Time", value: postTime },
                            { label: "Entries", value: `${horses.length} horses` },
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
                            { label: "Gear Check", ok: horses.every(h => h.gearStatus !== "review") },
                            { label: "Jockey Weigh-In", ok: horses.every(h => h.jockeyStatus !== "pending") },
                            { label: "Track Inspection", ok: true },
                            { label: "All Horses Checked", ok: horses.length > 0 && checkedIds.size === horses.length },
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
                        className={[
                            "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold uppercase tracking-widest transition-all duration-150",
                            allClear
                                ? "bg-yellow-600 text-white hover:bg-yellow-500 shadow-lg shadow-yellow-900/30"
                                : "bg-white/5 text-gray-600 border border-white/8 cursor-not-allowed",
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
