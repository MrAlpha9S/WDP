import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import type { ViolationTypeEntity, ViolationRacePhase, ViolationCategory } from "../../../shared/types/ViolationTypes";

interface ViolationTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<ViolationTypeEntity>) => Promise<void>;
    item: ViolationTypeEntity | null;
}

const PHASES: ViolationRacePhase[] = ['pre-race', 'during-race', 'after-race'];
const CATEGORIES: ViolationCategory[] = ['riding', 'horse-safety', 'medication', 'betting', 'administrative'];

const empty = (): Partial<ViolationTypeEntity> => ({
    violationName: '',
    violationDescription: '',
    defaultPenalty: '',
    type: 'during-race',
    category: 'riding',
    severity: 3,
});

export default function ViolationTypeModal({ isOpen, onClose, onSave, item }: ViolationTypeModalProps) {
    const [form, setForm] = useState<Partial<ViolationTypeEntity>>(empty());
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setForm(item ? { ...item } : empty());
        setError(null);
    }, [isOpen, item]);

    if (!isOpen) return null;

    const set = (key: keyof ViolationTypeEntity, value: any) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.violationName?.trim()) { setError('Violation name is required'); return; }
        setSaving(true);
        setError(null);
        try {
            await onSave(form);
            onClose();
        } catch (err: any) {
            setError(err?.msg || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-[520px] bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <h2 className="text-[16px] font-bold text-white font-serif">
                        {item ? 'Edit Violation Type' : 'Create Violation Type'}
                    </h2>
                    <button onClick={onClose} className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded border border-white/10 transition-colors">
                        <X size={14} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto custom-scrollbar">

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Violation Name *</label>
                        <input
                            type="text"
                            value={form.violationName ?? ''}
                            onChange={e => set('violationName', e.target.value)}
                            placeholder="e.g. False Start"
                            className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/25 h-[38px]"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Description</label>
                        <textarea
                            value={form.violationDescription ?? ''}
                            onChange={e => set('violationDescription', e.target.value)}
                            placeholder="Describe when this violation applies…"
                            rows={3}
                            className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/25 resize-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Default Penalty</label>
                        <input
                            type="text"
                            value={form.defaultPenalty ?? ''}
                            onChange={e => set('defaultPenalty', e.target.value)}
                            placeholder="e.g. Warning + 2-position demotion"
                            className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/25 h-[38px]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Race Phase</label>
                            <select
                                value={form.type ?? 'during-race'}
                                onChange={e => set('type', e.target.value)}
                                className="bg-[#111] border border-white/10 rounded-lg px-3 text-[13px] text-white focus:outline-none focus:border-white/25 h-[38px] appearance-none cursor-pointer"
                            >
                                {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Category</label>
                            <select
                                value={form.category ?? 'riding'}
                                onChange={e => set('category', e.target.value)}
                                className="bg-[#111] border border-white/10 rounded-lg px-3 text-[13px] text-white focus:outline-none focus:border-white/25 h-[38px] appearance-none cursor-pointer"
                            >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                            Severity — <span className="text-[#f3b2a5]">{form.severity}/5</span>
                        </label>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => set('severity', s)}
                                    className={`flex-1 py-2 rounded-lg border text-[12px] font-bold transition-colors ${
                                        form.severity === s
                                            ? 'bg-[#f3b2a5]/20 border-[#f3b2a5]/40 text-[#f3b2a5]'
                                            : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <p className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-white/10 bg-white/5 text-[12px] font-semibold text-gray-300 hover:bg-white/10 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-[#ab3030] hover:bg-[#8f2828] text-[12px] font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : (item ? 'Save Changes' : 'Create Type')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
