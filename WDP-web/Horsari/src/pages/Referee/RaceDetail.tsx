import { useRef, useState } from "react";
import {
    AlertTriangle, Camera, CheckCircle2, ChevronRight,
    ClipboardList, Flag, RefreshCw, Shield, ShieldAlert,
    Trophy, X, Zap,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type VerificationStatus = "cleared" | "review" | "pending";
type CheckResult = "pass" | "fail" | null;

interface HorseEntry {
    number: number;
    name: string;
    jockey: string;
    gate: number;
    trainer: string;
    microchip: string;
    img?: string;
    status: VerificationStatus;
}

interface IncidentType {
    id: string;
    label: string;
    icon: React.ReactNode;
}

interface InspectionCheck {
    id: string;
    section: string;
    label: string;
    detail: string;
    warning?: string;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const RACE = {
    id: "R-1005",
    number: 7,
    title: "The Pegasus Cup",
    track: "Dirt",
    condition: "Fast",
    distance: "1 1/8 Miles",
    pace: "23.4s",
    position: "4F",
    leader: "#4 Thunderstrike",
    officialTime: "01:48.23",
};

const HORSES: HorseEntry[] = [
    { number: 1, name: "Midnight Eclipse", jockey: "J. Rosario", gate: 1, trainer: "Sarah Jenkins-Stubbs", microchip: "983100819087741", status: "cleared" },
    { number: 2, name: "Stormbringer", jockey: "L. Ortiz Jr.", gate: 2, trainer: "Marcus Vance", microchip: "985112100324892", status: "cleared" },
    { number: 3, name: "Golden Horizon", jockey: "F. Prat", gate: 3, trainer: "Oliver Hartley", microchip: "900118000654231", status: "cleared" },
    { number: 4, name: "Thunderstrike", jockey: "I. Ortiz Jr.", gate: 4, trainer: "James Whitfield", microchip: "956000007890123", status: "review" },
];

const INCIDENTS: IncidentType[] = [
    { id: "lane", label: "Lane Cutting", icon: <RefreshCw size={18} /> },
    { id: "whip", label: "Whip Misuse", icon: <Zap size={18} /> },
    { id: "interfere", label: "Interference", icon: <ShieldAlert size={18} /> },
    { id: "custom", label: "Custom Flag", icon: <Flag size={18} /> },
];

const INSPECTION_CHECKS: InspectionCheck[] = [
    // Identity
    { id: "chip", section: "Identity Verification", label: "Microchip Scan Matches Records", detail: "Scanned · {microchip}" },
    { id: "marks", section: "Identity Verification", label: "Physical Markings / Lip Tattoo Verification", detail: "Verify white star on forehead and left hind sock" },
    // Health
    { id: "coggins", section: "Health & Veterinary", label: "Valid Coggins Test Certificate", detail: "Expires · 2024-11-15" },
    { id: "vitals", section: "Health & Veterinary", label: "Pre-Race Soundness & Vitals Check", detail: "Heart rate, gait, respiratory assessment", warning: "Flagged by examining veterinarian" },
    // Gear
    { id: "gear", section: "Gear Compliance", label: "Approved Bit, Blinkers, and Shoes", detail: "Displayed: Standard Aluminum, No Blinkers" },
];

const VIOLATION_REASONS = [
    "Elevated Heart Rate / Respiratory",
    "Lameness Detected",
    "Prohibited Medication Flag",
    "Equipment Non-Compliance",
    "Weight Discrepancy",
    "Identity Mismatch",
    "Other",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function HorseRow({ horse, onInspect }: { horse: HorseEntry; onInspect: (h: HorseEntry) => void }) {
    const isReview = horse.status === "review";
    return (
        <div className={[
            "rounded-xl border transition-all duration-200 cursor-pointer",
            isReview
                ? "border-red-800/60 bg-red-500/5 hover:bg-red-500/8"
                : "border-white/8 bg-white/[0.03] hover:bg-white/[0.06]",
        ].join(" ")} onClick={() => onInspect(horse)}>
            <div className="px-4 py-3 flex items-center gap-3">
                <span className={[
                    "w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0",
                    isReview ? "bg-red-700 text-white" : "bg-white/8 text-gray-400",
                ].join(" ")}>
                    {horse.number}
                </span>
                <div className="flex-1 min-w-0">
                    <p className={["text-[13.5px] font-semibold leading-snug", isReview ? "text-red-400" : "text-white"].join(" ")}>
                        {horse.name}
                    </p>
                    <p className={["text-[11.5px] mt-0.5", isReview ? "text-red-600" : "text-gray-500"].join(" ")}>
                        J: {horse.jockey}
                    </p>
                </div>
                {isReview ? (
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border border-red-800/60 text-red-400 bg-red-500/10">
                        Review
                    </span>
                ) : (
                    <CheckCircle2 size={17} className="text-green-500 shrink-0" />
                )}
            </div>
        </div>
    );
}

function IncidentButton({ incident }: { incident: IncidentType }) {
    const [active, setActive] = useState(false);
    return (
        <button
            type="button"
            onClick={() => setActive(p => !p)}
            className={[
                "group flex flex-col items-center justify-center gap-2 py-4 rounded-xl border text-center transition-all duration-200 cursor-pointer select-none",
                active
                    ? "border-red-700 bg-red-500/10 text-red-400"
                    : "border-white/8 bg-white/[0.03] text-gray-500 hover:border-white/15 hover:bg-white/[0.06] hover:text-gray-300",
            ].join(" ")}
        >
            <span className={active ? "text-red-400" : "text-gray-600 group-hover:text-gray-400"}>
                {incident.icon}
            </span>
            <span className="text-[12px] font-semibold leading-tight">{incident.label}</span>
        </button>
    );
}

// ── Pre-Race Inspection Modal ─────────────────────────────────────────────────

function CheckRow({ check, result, onSet, horse }: {
    check: InspectionCheck;
    result: CheckResult;
    onSet: (id: string, v: CheckResult) => void;
    horse: HorseEntry;
}) {
    const detail = check.detail.replace("{microchip}", horse.microchip);
    const isFail = result === "fail";
    return (
        <div className={[
            "rounded-xl border px-4 py-3 transition-all",
            isFail ? "border-red-800/60 bg-red-500/5" : "border-white/8 bg-white/[0.02]",
        ].join(" ")}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white">{check.label}</p>
                    {result === "pass" && (
                        <p className="text-[11.5px] text-green-500 mt-0.5 flex items-center gap-1">
                            <CheckCircle2 size={11} /> {detail}
                        </p>
                    )}
                    {result !== "pass" && check.warning && (
                        <p className="text-[11.5px] text-red-400 mt-0.5 flex items-center gap-1">
                            <AlertTriangle size={11} /> {check.warning}
                        </p>
                    )}
                    {result !== "pass" && !check.warning && (
                        <p className="text-[11.5px] text-gray-600 mt-0.5">{detail}</p>
                    )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={() => onSet(check.id, result === "fail" ? null : "fail")}
                        className={[
                            "px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border transition-all",
                            result === "fail"
                                ? "bg-red-700 border-red-600 text-white"
                                : "border-white/10 text-gray-600 hover:border-red-700/60 hover:text-red-400",
                        ].join(" ")}
                    >Fail</button>
                    <button
                        onClick={() => onSet(check.id, result === "pass" ? null : "pass")}
                        className={[
                            "px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border transition-all",
                            result === "pass"
                                ? "bg-green-700 border-green-600 text-white"
                                : "border-white/10 text-gray-600 hover:border-green-700/60 hover:text-green-400",
                        ].join(" ")}
                    >Pass</button>
                </div>
            </div>
        </div>
    );
}

function PreRaceInspectionModal({ horse, onClose }: {
    horse: HorseEntry;
    onClose: () => void;
}) {
    const [results, setResults] = useState<Record<string, CheckResult>>({});
    const [violationReason, setViolationReason] = useState(VIOLATION_REASONS[0]);
    const [signature, setSignature] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);

    const setResult = (id: string, val: CheckResult) =>
        setResults(p => ({ ...p, [id]: val }));

    const fails = Object.values(results).filter(v => v === "fail").length;
    const allDone = INSPECTION_CHECKS.every(c => results[c.id] != null);
    const hasFail = fails > 0;

    // Signature canvas
    const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        drawing.current = true;
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;
        ctx.beginPath();
        const r = canvasRef.current!.getBoundingClientRect();
        ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
    };
    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!drawing.current) return;
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;
        const r = canvasRef.current!.getBoundingClientRect();
        ctx.lineTo(e.clientX - r.left, e.clientY - r.top);
        ctx.strokeStyle = "#ffffff80";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        setSignature(true);
    };
    const endDraw = () => { drawing.current = false; };
    const clearSig = () => {
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, 400, 80);
        setSignature(false);
    };

    // Group checks by section
    const sections = INSPECTION_CHECKS.reduce<Record<string, InspectionCheck[]>>((acc, c) => {
        if (!acc[c.section]) acc[c.section] = [];
        acc[c.section].push(c);
        return acc;
    }, {});

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: "rgba(0,0,0,0.75)" }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-full sm:max-w-xl bg-[#1a1a1a] rounded-t-2xl sm:rounded-2xl border border-white/10 flex flex-col overflow-hidden"
                style={{ maxHeight: "92vh" }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8 shrink-0">
                    <div className="flex items-center gap-2">
                        <ClipboardList size={14} className="text-red-500" />
                        <span className="text-[11px] font-bold uppercase tracking-widest text-red-500">Pre-Race Inspection</span>
                        <span className="text-[11px] text-gray-600 font-mono ml-1">{RACE.id}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/10 text-gray-500 hover:text-gray-200 hover:border-white/20 transition-all"
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Horse info strip */}
                <div className="flex items-center gap-4 px-5 py-3.5 border-b border-white/8 bg-white/[0.02] shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-white/8 flex items-center justify-center shrink-0 overflow-hidden">
                        {horse.img
                            ? <img src={horse.img} className="w-full h-full object-cover" alt={horse.name} />
                            : <span className="text-[18px] font-bold text-gray-500">{horse.number}</span>
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[15px] font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                                {horse.name}
                            </span>
                            <span className="text-[11px] font-semibold text-yellow-400 bg-yellow-500/10 border border-yellow-700/40 px-2 py-0.5 rounded-md">
                                IN PROGRESS
                            </span>
                        </div>
                        <p className="text-[11.5px] text-gray-500 mt-0.5">
                            Gate {horse.gate} · Jockey: {horse.jockey}
                        </p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-[9.5px] font-bold uppercase tracking-widest text-gray-600">Microchip ID</p>
                        <p className="text-[11px] font-mono text-gray-400">{horse.microchip}</p>
                        <p className="text-[9.5px] font-bold uppercase tracking-widest text-gray-600 mt-1">Trainer</p>
                        <p className="text-[11px] text-gray-400">{horse.trainer}</p>
                    </div>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0 flex flex-col gap-5">
                    {Object.entries(sections).map(([section, checks]) => (
                        <div key={section}>
                            <div className="flex items-center gap-2 mb-2.5">
                                <Shield size={12} className="text-gray-600" />
                                <p className="text-[10.5px] font-bold uppercase tracking-widest text-gray-500">{section}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                {checks.map(c => (
                                    <CheckRow
                                        key={c.id}
                                        check={c}
                                        result={results[c.id] ?? null}
                                        onSet={setResult}
                                        horse={horse}
                                    />
                                ))}
                            </div>

                            {/* Violation reason dropdown — only under Health if a fail exists */}
                            {section === "Health & Veterinary" && results["vitals"] === "fail" && (
                                <div className="mt-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">
                                        Violation Reason (Required)
                                    </p>
                                    <select
                                        value={violationReason}
                                        onChange={e => setViolationReason(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[13px] text-gray-300 outline-none focus:border-white/25 appearance-none"
                                    >
                                        {VIOLATION_REASONS.map(r => (
                                            <option key={r} className="bg-[#1a1a1a]">{r}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Official Sign-off */}
                    <div>
                        <div className="flex items-center gap-2 mb-2.5">
                            <Shield size={12} className="text-gray-600" />
                            <p className="text-[10.5px] font-bold uppercase tracking-widest text-gray-500">Official Sign-off</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/8 rounded-xl px-4 py-3">
                            <p className="text-[11.5px] text-gray-500 mb-3 leading-relaxed">
                                By signing below, I certify that I have conducted this inspection in accordance with track regulations.
                            </p>
                            <div className="relative border border-white/10 rounded-xl overflow-hidden bg-black/20">
                                <canvas
                                    ref={canvasRef}
                                    width={480}
                                    height={80}
                                    className="w-full h-20 cursor-crosshair"
                                    onMouseDown={startDraw}
                                    onMouseMove={draw}
                                    onMouseUp={endDraw}
                                    onMouseLeave={endDraw}
                                />
                                {!signature && (
                                    <p className="absolute inset-0 flex items-center justify-center text-[12px] text-gray-600 pointer-events-none">
                                        Draw Signature
                                    </p>
                                )}
                                {signature && (
                                    <button
                                        onClick={clearSig}
                                        className="absolute bottom-2 right-2 text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-white/8 shrink-0">
                    {hasFail && (
                        <div className="flex items-center gap-2 mb-3 px-1">
                            <AlertTriangle size={13} className="text-red-400 shrink-0" />
                            <span className="text-[12px] font-semibold text-red-400">
                                {fails} Violation{fails > 1 ? "s" : ""} Detected
                            </span>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-white/10 text-[13px] font-semibold text-gray-500 hover:border-white/20 hover:text-gray-300 transition-all"
                        >
                            Save Draft
                        </button>
                        <button
                            onClick={onClose}
                            disabled={!allDone || !signature}
                            className={[
                                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold uppercase tracking-widest transition-all",
                                hasFail
                                    ? "bg-red-700 hover:bg-red-600 text-white shadow-lg shadow-red-900/40"
                                    : allDone && signature
                                        ? "bg-green-700 hover:bg-green-600 text-white shadow-lg shadow-green-900/30"
                                        : "bg-white/5 text-gray-600 cursor-not-allowed",
                            ].join(" ")}
                        >
                            {hasFail
                                ? <><AlertTriangle size={13} /> Submit Failed Inspection</>
                                : <><CheckCircle2 size={13} /> Submit Inspection</>
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface RaceMonitorPageProps {
    onBack?: () => void;
}

export default function RaceMonitorPage({ onBack }: RaceMonitorPageProps) {
    const cleared = HORSES.filter(h => h.status === "cleared").length;
    const total = HORSES.length;
    const [inspecting, setInspecting] = useState<HorseEntry | null>(null);

    return (
        <div className="min-h-screen bg-[#0f0f0f]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="max-w-5xl mx-auto px-5 py-8">

                {/* ── Live badge + title ── */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[11px] font-bold uppercase tracking-widest text-red-500">Live Monitoring</span>
                    </div>
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h1 className="text-[28px] font-bold text-white leading-tight tracking-tight"
                                style={{ fontFamily: "'Playfair Display', serif" }}>
                                Race {RACE.number}: {RACE.title}
                            </h1>
                            <p className="text-[13px] text-gray-500 mt-0.5">
                                Track: {RACE.track}, {RACE.condition} &nbsp;·&nbsp; Distance: {RACE.distance}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-gray-400 text-[13px] font-medium hover:border-white/20 hover:text-gray-200 transition-all">
                                <RefreshCw size={13} className="text-red-500" />
                                Previous Race
                            </button>
                            <div className="bg-[#1a1a1a] border border-white/8 rounded-xl px-5 py-2 text-right">
                                <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">Official Time</p>
                                <p className="text-[22px] font-black text-red-500 tracking-tight leading-tight"
                                    style={{ fontFamily: "'Playfair Display', serif" }}>
                                    {RACE.officialTime}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Main layout ── */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">

                    {/* LEFT */}
                    <div className="flex flex-col gap-5">

                        {/* Camera feed */}
                        <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
                                <div className="flex items-center gap-2 text-gray-500 text-[12px] font-semibold uppercase tracking-wider">
                                    <Camera size={13} className="text-red-500" />
                                    Camera 1: Panning Main
                                </div>
                                <button className="flex items-center gap-1 text-[13px] text-red-500 font-medium hover:text-red-400 transition-colors">
                                    Fullscreen <ChevronRight size={14} />
                                </button>
                            </div>
                            <div className="relative mx-4 my-4 rounded-xl overflow-hidden aspect-video bg-black">
                                <img
                                    src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"
                                    alt="Race feed"
                                    className="w-full h-full object-cover opacity-90"
                                />
                                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-700/90 backdrop-blur px-2.5 py-1 rounded-lg">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">Live</span>
                                </div>
                                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur px-4 py-2 rounded-xl border border-white/10 flex items-center gap-4">
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Pace</p>
                                        <p className="text-[13px] font-bold text-white">{RACE.pace} / {RACE.position}</p>
                                    </div>
                                    <div className="w-px h-7 bg-white/10" />
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Leader</p>
                                        <p className="text-[13px] font-bold text-red-400">{RACE.leader}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Rapid Incident Log */}
                        <div className="bg-[#1a1a1a] rounded-xl border border-white/8 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-[18px] font-bold text-white tracking-tight"
                                    style={{ fontFamily: "'Playfair Display', serif" }}>
                                    Rapid Incident Log
                                </h2>
                                <button className="flex items-center gap-1 text-[13px] text-red-500 font-medium hover:text-red-400 transition-colors">
                                    View all <ChevronRight size={14} />
                                </button>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                                {INCIDENTS.map(inc => <IncidentButton key={inc.id} incident={inc} />)}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className="flex flex-col gap-5">

                        {/* Verification List */}
                        <div className="bg-[#1a1a1a] rounded-xl border border-white/8 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                                <h2 className="text-[12px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                    <Shield size={13} className="text-red-500" />
                                    Verification List
                                </h2>
                                <span className="text-[11px] font-bold text-green-400 bg-green-500/10 border border-green-700/60 px-2.5 py-0.5 rounded-full">
                                    {cleared}/{total} Cleared
                                </span>
                            </div>
                            <div className="p-3 flex flex-col gap-2">
                                {HORSES.map(horse => (
                                    <HorseRow key={horse.number} horse={horse} onInspect={setInspecting} />
                                ))}
                            </div>
                            {/* Pre-race inspection shortcut */}
                            <div className="px-3 pb-3">
                                <button
                                    onClick={() => setInspecting(HORSES[0])}
                                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-white/10 text-[12px] font-semibold text-gray-400 hover:border-red-700/50 hover:text-red-400 hover:bg-red-500/5 transition-all duration-150"
                                >
                                    <ClipboardList size={13} />
                                    Pre-Race Inspection
                                </button>
                            </div>
                        </div>

                        {/* Post-Race Actions */}
                        <div className="bg-[#1a1a1a] rounded-xl border border-white/8 p-4">
                            <h2 className="text-[10.5px] font-bold uppercase tracking-widest text-gray-600 mb-3">
                                Post-Race Actions
                            </h2>
                            <div className="flex flex-col gap-2.5">
                                <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-gray-400 text-[13px] font-semibold hover:border-white/20 hover:text-gray-200 transition-all duration-150">
                                    <Camera size={14} />
                                    Review Finish Photo
                                </button>
                                <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-700 text-white text-[13px] font-bold uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-900/40 transition-all duration-150">
                                    <Trophy size={14} />
                                    Publish Official Results
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-white/8 py-4 mt-8">
                <div className="max-w-5xl mx-auto px-5 flex items-center justify-between text-[12px] text-gray-600">
                    <span>© 2024 Equine Elite Management System</span>
                    <div className="flex items-center gap-4">
                        <a href="#" className="hover:text-gray-400 transition-colors">Help/Support</a>
                        <a href="#" className="hover:text-gray-400 transition-colors">Settings</a>
                        <a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
                    </div>
                    <span className="font-black uppercase tracking-widest text-gray-500 text-[11px]"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        Equine Elite
                    </span>
                </div>
            </footer>

            {/* Pre-Race Inspection Modal */}
            {inspecting && (
                <PreRaceInspectionModal
                    horse={inspecting}
                    onClose={() => setInspecting(null)}
                />
            )}
        </div>
    );
}