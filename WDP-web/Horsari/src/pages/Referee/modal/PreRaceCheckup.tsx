import { useEffect, useRef, useState } from "react";
import {
    AlertTriangle, Camera, CheckCircle2, ChevronDown,
    ClipboardList, Dna, HeartPulse, ImagePlus, Shield,
    ShieldCheck, Trash2, UserCheck, X,
} from "lucide-react";
import { RACE, VIOLATION_REASONS } from "../data/RaceData";
import type { HorseEntry, PassFail } from "../types/RaceTypes";

// ── Shared sub-components ─────────────────────────────────────────────────────

function PassFailToggle({ value, onChange }: { value: PassFail; onChange: (v: PassFail) => void }) {
    return (
        <div className="flex items-center gap-1.5 shrink-0">
            <button
                onClick={() => onChange(value === "fail" ? null : "fail")}
                className={["px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-150",
                    value === "fail" ? "bg-red-700 text-white shadow-sm" : "bg-white/5 text-gray-600 border border-white/8 hover:border-red-800/50 hover:text-red-500",
                ].join(" ")}
            >Fail</button>
            <button
                onClick={() => onChange(value === "pass" ? null : "pass")}
                className={["px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-150",
                    value === "pass" ? "bg-green-700 text-white shadow-sm" : "bg-white/5 text-gray-600 border border-white/8 hover:border-green-800/50 hover:text-green-500",
                ].join(" ")}
            >Pass</button>
        </div>
    );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-2 mb-3">
            <span className="text-gray-500">{icon}</span>
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">{label}</span>
        </div>
    );
}

function CheckRow({ label, sub, value, onChange, failNote }: {
    label: string; sub?: string; value: PassFail;
    onChange: (v: PassFail) => void; failNote?: string;
}) {
    return (
        <div className={["rounded-xl border px-4 py-3 transition-all duration-200",
            value === "fail" ? "border-red-800/60 bg-red-500/5" :
                value === "pass" ? "border-green-800/40 bg-green-500/5" :
                    "border-white/8 bg-white/[0.02]",
        ].join(" ")}>
            <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className={["text-[13px] font-semibold",
                        value === "fail" ? "text-red-400" : value === "pass" ? "text-green-400" : "text-white",
                    ].join(" ")}>{label}</p>
                    {sub && (
                        <p className={["text-[11.5px] mt-0.5", value === "fail" ? "text-red-600" : "text-gray-500"].join(" ")}>
                            {value === "fail" && failNote
                                ? <span className="flex items-center gap-1"><AlertTriangle size={10} />{failNote}</span>
                                : sub}
                        </p>
                    )}
                </div>
                <PassFailToggle value={value} onChange={onChange} />
            </div>
        </div>
    );
}

// ── Photo capture ─────────────────────────────────────────────────────────────

interface CapturedPhoto {
    id: string;
    url: string;
    label: string;
    timestamp: string;
}

function PhotoCapture({ photos, onAdd, onRemove }: {
    photos: CapturedPhoto[];
    onAdd: (photo: CapturedPhoto) => void;
    onRemove: (id: string) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const [labelDraft, setLabelDraft] = useState("");
    const [pendingUrl, setPendingUrl] = useState<string | null>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPendingUrl(url);
        setLabelDraft("");
        e.target.value = "";
    };

    const confirmPhoto = () => {
        if (!pendingUrl) return;
        onAdd({
            id: `ph-${Date.now()}`,
            url: pendingUrl,
            label: labelDraft.trim() || "Inspection Photo",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
        setPendingUrl(null);
        setLabelDraft("");
    };

    const cancelPhoto = () => {
        if (pendingUrl) URL.revokeObjectURL(pendingUrl);
        setPendingUrl(null);
        setLabelDraft("");
    };

    return (
        <div className="flex flex-col gap-3">
            {/* Pending preview — label + confirm */}
            {pendingUrl && (
                <div className="rounded-xl border border-yellow-700/50 bg-yellow-500/5 overflow-hidden">
                    <div className="relative">
                        <img src={pendingUrl} alt="Preview" className="w-full max-h-52 object-cover" />
                        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur px-2 py-0.5 rounded-lg">
                            <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">Preview</span>
                        </div>
                    </div>
                    <div className="px-4 py-3 flex flex-col gap-2.5">
                        <input
                            type="text"
                            placeholder="Add a label (e.g. Left shoulder marking)"
                            value={labelDraft}
                            onChange={e => setLabelDraft(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && confirmPhoto()}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[12.5px] text-white placeholder-gray-600 outline-none focus:border-yellow-700/60 transition-colors"
                        />
                        <div className="flex gap-2">
                            <button onClick={cancelPhoto} className="flex-1 py-2 rounded-lg border border-white/10 text-gray-400 text-[12px] font-semibold hover:border-white/20 hover:text-gray-200 transition-all">
                                Cancel
                            </button>
                            <button onClick={confirmPhoto} className="flex-1 py-2 rounded-lg bg-yellow-600 text-white text-[12px] font-bold hover:bg-yellow-500 transition-all">
                                Attach Photo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Captured photos grid */}
            {photos.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                    {photos.map(photo => (
                        <div key={photo.id} className="relative rounded-xl overflow-hidden border border-white/8 group">
                            <img src={photo.url} alt={photo.label} className="w-full h-28 object-cover" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2.5 py-2">
                                <p className="text-[11px] font-semibold text-white truncate">{photo.label}</p>
                                <p className="text-[10px] text-gray-400">{photo.timestamp}</p>
                            </div>
                            <button
                                onClick={() => onRemove(photo.id)}
                                className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-black/70 backdrop-blur flex items-center justify-center text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Trash2 size={11} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload / Camera buttons */}
            {!pendingUrl && (
                <div className="flex gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-gray-400 text-[12.5px] font-semibold hover:border-white/20 hover:text-gray-200 transition-all"
                    >
                        <ImagePlus size={13} /> Upload Photo
                    </button>
                    <button
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-gray-400 text-[12.5px] font-semibold hover:border-white/20 hover:text-gray-200 transition-all"
                    >
                        <Camera size={13} /> Take Photo
                    </button>
                </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
        </div>
    );
}

// ── Signature pad ─────────────────────────────────────────────────────────────

function SignaturePad({ onSign }: { onSign: (signed: boolean) => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [drawing, setDrawing] = useState(false);
    const [hasSig, setHasSig] = useState(false);
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        if ("touches" in e) return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    };

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current; if (!canvas) return;
        setDrawing(true); lastPos.current = getPos(e, canvas);
    };
    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!drawing) return;
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext("2d"); if (!ctx || !lastPos.current) return;
        e.preventDefault();
        const pos = getPos(e, canvas);
        ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
        lastPos.current = pos;
        if (!hasSig) { setHasSig(true); onSign(true); }
    };
    const stopDraw = () => { setDrawing(false); lastPos.current = null; };
    const clear = () => {
        canvasRef.current?.getContext("2d")?.clearRect(0, 0, 600, 100);
        setHasSig(false); onSign(false);
    };

    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <div className="relative">
                <canvas ref={canvasRef} width={600} height={100}
                    className="w-full h-[100px] cursor-crosshair touch-none"
                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                    onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
                />
                {!hasSig && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-[12px] text-gray-600 font-medium">Draw Signature</span>
                    </div>
                )}
            </div>
            <div className="flex justify-end px-3 pb-2">
                <button onClick={clear} className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors">Clear</button>
            </div>
        </div>
    );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface PreRaceInspectionModalProps {
    horse: HorseEntry;
    onClose: () => void;
    onSubmit?: (passed: boolean) => void;
}

export default function PreRaceInspectionModal({ horse, onClose, onSubmit }: PreRaceInspectionModalProps) {
    const [microchip, setMicrochip] = useState<PassFail>(null);
    const [markings, setMarkings] = useState<PassFail>(null);
    const [coggins, setCoggins] = useState<PassFail>(null);
    const [soundness, setSoundness] = useState<PassFail>(null);
    const [gear, setGear] = useState<PassFail>(null);
    const [violationReason, setViolationReason] = useState("");
    const [showViolationDrop, setShowViolationDrop] = useState(false);
    const [confirmedJockeyId, setConfirmedJockeyId] = useState<string | null>(null);
    const [signed, setSigned] = useState(false);
    const [photos, setPhotos] = useState<CapturedPhoto[]>([]);

    const jockeys = [horse.mainJockey, horse.backupJockey];
    const confirmedJockey = jockeys.find(j => j.id === confirmedJockeyId) ?? null;
    const failCount = [microchip, markings, coggins, soundness, gear].filter(v => v === "fail").length;
    const allChecked = [microchip, markings, coggins, soundness, gear].every(v => v !== null);
    const canSubmit = allChecked && confirmedJockeyId !== null && signed;
    const hasFails = failCount > 0;

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: "rgba(0,0,0,0.75)" }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-full sm:max-w-2xl bg-[#141414] rounded-t-2xl sm:rounded-2xl border border-white/10 flex flex-col overflow-hidden"
                style={{ maxHeight: "94vh" }}
                onClick={e => e.stopPropagation()}
            >
                <div className="h-0.5 w-full bg-yellow-600" />

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <ClipboardList size={15} className="text-yellow-500" />
                        <p className="text-[11px] font-black uppercase tracking-widest text-yellow-500">Pre-Race Inspection</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                            Race ID <span className="text-gray-400">{RACE.id}</span>
                        </span>
                        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-xl border border-white/10 text-gray-500 hover:text-gray-200 hover:border-white/20 transition-all">
                            <X size={13} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5 min-h-0">

                    {/* Horse profile */}
                    <div className="bg-white/[0.03] rounded-xl border border-white/8 overflow-hidden">
                        <div className="flex items-center gap-4 px-4 py-4">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 shrink-0">
                                <img src={horse.photo} alt={horse.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-[18px] font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{horse.name}</h2>
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-yellow-700/60 text-yellow-400 bg-yellow-500/10">In Progress</span>
                                </div>
                                <p className="text-[12px] text-gray-500 mt-0.5">Gate {horse.number} &nbsp;·&nbsp; Jockey: {horse.mainJockey.name}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 border-t border-white/6">
                            <div className="px-4 py-2.5 border-r border-white/6">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Microchip ID</p>
                                <p className="text-[12px] font-mono font-semibold text-gray-300 mt-0.5">{horse.microchipId}</p>
                            </div>
                            <div className="px-4 py-2.5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Trainer</p>
                                <p className="text-[12px] font-semibold text-gray-300 mt-0.5">{horse.trainer}</p>
                            </div>
                        </div>
                    </div>

                    {/* Identity Verification */}
                    <div>
                        <SectionHeader icon={<Dna size={13} />} label="Identity Verification" />
                        <div className="flex flex-col gap-2">
                            <CheckRow label="Microchip Scan Matches Records" sub={`Scanned: ${horse.microchipId}`}
                                value={microchip} onChange={setMicrochip} failNote="Microchip ID mismatch — check records" />
                            <CheckRow label="Physical Markings / Lip Tattoo Verification" sub="White star on forehead and left hind sock."
                                value={markings} onChange={setMarkings} failNote="Markings do not match registration card" />
                        </div>
                    </div>

                    {/* Photo Documentation */}
                    <div>
                        <SectionHeader icon={<Camera size={13} />} label={`Photo Documentation ${photos.length > 0 ? `(${photos.length})` : ""}`} />
                        <PhotoCapture
                            photos={photos}
                            onAdd={p => setPhotos(prev => [...prev, p])}
                            onRemove={id => setPhotos(prev => prev.filter(p => p.id !== id))}
                        />
                    </div>

                    {/* Jockey Verification */}
                    <div>
                        <SectionHeader icon={<UserCheck size={13} />} label="Jockey Verification" />
                        <div className="bg-white/[0.02] rounded-xl border border-white/8 overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/6">
                                <p className="text-[12px] text-gray-400">Confirm which jockey will <span className="text-white font-semibold">actually ride</span> in this race.</p>
                            </div>
                            <div className="p-3 flex flex-col gap-2">
                                {jockeys.map(jockey => {
                                    const isConfirmed = confirmedJockeyId === jockey.id;
                                    return (
                                        <button key={jockey.id} onClick={() => setConfirmedJockeyId(isConfirmed ? null : jockey.id)}
                                            className={["w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200",
                                                isConfirmed ? "border-green-700/60 bg-green-500/8" : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/12",
                                            ].join(" ")}
                                        >
                                            <div className={["w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all", isConfirmed ? "bg-green-700" : "bg-white/8"].join(" ")}>
                                                {isConfirmed
                                                    ? <CheckCircle2 size={14} className="text-white" />
                                                    : <span className="text-[11px] font-bold text-gray-500">{jockey.role === "main" ? "M" : "B"}</span>
                                                }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className={["text-[13.5px] font-bold", isConfirmed ? "text-green-400" : "text-white"].join(" ")}>{jockey.name}</p>
                                                    <span className={["text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded",
                                                        jockey.role === "main" ? "text-blue-400 bg-blue-500/10 border border-blue-700/40" : "text-gray-500 bg-white/5 border border-white/10",
                                                    ].join(" ")}>{jockey.role}</span>
                                                </div>
                                                <p className="text-[11.5px] text-gray-500 mt-0.5">License: {jockey.license} &nbsp;·&nbsp; {jockey.weight}</p>
                                            </div>
                                            {isConfirmed && <span className="text-[11px] font-bold text-green-400 shrink-0">Riding ✓</span>}
                                        </button>
                                    );
                                })}
                            </div>
                            {confirmedJockey?.role === "backup" && (
                                <div className="mx-3 mb-3 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-yellow-500/8 border border-yellow-700/40">
                                    <AlertTriangle size={12} className="text-yellow-500 shrink-0 mt-0.5" />
                                    <p className="text-[11.5px] text-yellow-400">Backup jockey confirmed — ensure substitution is logged with race stewards.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Health & Veterinary */}
                    <div>
                        <SectionHeader icon={<HeartPulse size={13} />} label="Health & Veterinary" />
                        <div className="flex flex-col gap-2">
                            <CheckRow label="Valid Coggins Test Certificate" sub="Expires: 2024-11-15"
                                value={coggins} onChange={setCoggins} failNote="Certificate expired or invalid" />
                            <div className={["rounded-xl border px-4 py-3 transition-all duration-200",
                                soundness === "fail" ? "border-red-800/60 bg-red-500/5" :
                                    soundness === "pass" ? "border-green-800/40 bg-green-500/5" : "border-white/8 bg-white/[0.02]",
                            ].join(" ")}>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className={["text-[13px] font-semibold", soundness === "fail" ? "text-red-400" : soundness === "pass" ? "text-green-400" : "text-white"].join(" ")}>
                                            Pre-Race Soundness & Vitals Check
                                        </p>
                                        {soundness === "fail" && (
                                            <p className="text-[11.5px] text-red-600 mt-0.5 flex items-center gap-1">
                                                <AlertTriangle size={10} /> Flagged by supervising veterinarian
                                            </p>
                                        )}
                                    </div>
                                    <PassFailToggle value={soundness} onChange={v => { setSoundness(v); if (v !== "fail") setViolationReason(""); }} />
                                </div>
                                {soundness === "fail" && (
                                    <div className="mt-3 relative">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">Violation Reason (Required)</p>
                                        <button onClick={() => setShowViolationDrop(p => !p)}
                                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#0f0f0f] border border-white/10 text-left text-[12.5px] hover:border-white/20 transition-all"
                                        >
                                            <span className={violationReason ? "text-white" : "text-gray-600"}>{violationReason || "Select reason…"}</span>
                                            <ChevronDown size={13} className={`text-gray-500 transition-transform ${showViolationDrop ? "rotate-180" : ""}`} />
                                        </button>
                                        {showViolationDrop && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/12 rounded-xl overflow-hidden z-10 shadow-2xl">
                                                {VIOLATION_REASONS.map(r => (
                                                    <button key={r} onClick={() => { setViolationReason(r); setShowViolationDrop(false); }}
                                                        className="w-full text-left px-4 py-2.5 text-[12.5px] text-gray-300 hover:bg-white/[0.05] hover:text-white transition-colors border-b border-white/5 last:border-0"
                                                    >{r}</button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Gear Compliance */}
                    <div>
                        <SectionHeader icon={<Shield size={13} />} label="Gear Compliance" />
                        <CheckRow label="Approved Bit, Blinkers, and Shoes" sub="Declared: Standard Aluminum, No Blinkers"
                            value={gear} onChange={setGear} failNote="Undeclared or non-approved equipment detected" />
                    </div>

                    {/* Sign-off */}
                    <div>
                        <SectionHeader icon={<ShieldCheck size={13} />} label="Official Sign-off" />
                        <div className="bg-white/[0.02] rounded-xl border border-white/8 p-4">
                            <p className="text-[12px] text-gray-400 mb-3 leading-relaxed">
                                By signing below, I certify that I have conducted this inspection in accordance with track regulations.
                            </p>
                            <SignaturePad onSign={setSigned} />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={["shrink-0 px-5 py-3.5 border-t flex items-center justify-between gap-3",
                    hasFails ? "border-red-900/60 bg-red-500/5" : "border-white/8 bg-transparent",
                ].join(" ")}>
                    <div className="flex items-center gap-2">
                        {failCount > 0 ? (
                            <span className="flex items-center gap-1.5 text-[12px] font-bold text-red-400">
                                <AlertTriangle size={13} />{failCount} Violation{failCount > 1 ? "s" : ""} Detected
                            </span>
                        ) : allChecked && confirmedJockeyId ? (
                            <span className="flex items-center gap-1.5 text-[12px] font-bold text-green-400">
                                <CheckCircle2 size={13} />All Checks Passed
                            </span>
                        ) : (
                            <span className="text-[12px] text-gray-600 font-medium">Complete all sections to submit</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 text-[13px] font-semibold hover:border-white/20 hover:text-gray-200 transition-all">
                            Save Draft
                        </button>
                        <button
                            onClick={() => canSubmit && onSubmit?.(failCount === 0)}
                            disabled={!canSubmit}
                            className={["flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold uppercase tracking-wider transition-all duration-150",
                                !canSubmit ? "bg-white/5 text-gray-600 border border-white/8 cursor-not-allowed"
                                    : hasFails ? "bg-red-700 text-white hover:bg-red-600 shadow-lg shadow-red-900/40"
                                        : "bg-green-700 text-white hover:bg-green-600 shadow-lg shadow-green-900/30",
                            ].join(" ")}
                        >
                            {hasFails ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                            {hasFails ? "Submit Failed Inspection" : "Submit Inspection"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}