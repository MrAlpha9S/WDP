import { useState, useEffect } from "react";
import type { ViolationTypeEntity, ViolationRacePhase, ViolationCategory } from "../../../shared/types/ViolationTypes";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";

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
        <Modal
            title={item ? 'Edit Violation Type' : 'Create Violation Type'}
            size="sm"
            onClose={onClose}
            closeOnBackdrop={!saving}
            footer={<>
                <Button variant="secondary" size="sm" className="flex-1" onClick={onClose}>
                    Cancel
                </Button>
                <Button size="sm" className="flex-1" type="submit" form="violation-type-form" loading={saving}>
                    {saving ? 'Saving…' : (item ? 'Save Changes' : 'Create Type')}
                </Button>
            </>}
        >
            <form id="violation-type-form" onSubmit={handleSubmit} className="flex flex-col gap-4">

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Violation Name *</label>
                        <input
                            type="text"
                            value={form.violationName ?? ''}
                            onChange={e => set('violationName', e.target.value)}
                            placeholder="e.g. False Start"
                            className="bg-bg border border-border rounded-lg px-3 py-2 text-[13px] text-text placeholder:text-text-muted focus:outline-none focus:border-white/25 h-[38px]"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Description</label>
                        <textarea
                            value={form.violationDescription ?? ''}
                            onChange={e => set('violationDescription', e.target.value)}
                            placeholder="Describe when this violation applies…"
                            rows={3}
                            className="bg-bg border border-border rounded-lg px-3 py-2 text-[13px] text-text placeholder:text-text-muted focus:outline-none focus:border-white/25 resize-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Default Penalty</label>
                        <input
                            type="text"
                            value={form.defaultPenalty ?? ''}
                            onChange={e => set('defaultPenalty', e.target.value)}
                            placeholder="e.g. Warning + 2-position demotion"
                            className="bg-bg border border-border rounded-lg px-3 py-2 text-[13px] text-text placeholder:text-text-muted focus:outline-none focus:border-white/25 h-[38px]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Race Phase</label>
                            <select
                                value={form.type ?? 'during-race'}
                                onChange={e => set('type', e.target.value)}
                                className="bg-bg border border-border rounded-lg px-3 text-[13px] text-text focus:outline-none focus:border-white/25 h-[38px] appearance-none cursor-pointer"
                            >
                                {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Category</label>
                            <select
                                value={form.category ?? 'riding'}
                                onChange={e => set('category', e.target.value)}
                                className="bg-bg border border-border rounded-lg px-3 text-[13px] text-text focus:outline-none focus:border-white/25 h-[38px] appearance-none cursor-pointer"
                            >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                            Severity — <span className="text-gold">{form.severity}/5</span>
                        </label>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => set('severity', s)}
                                    className={`flex-1 py-2 rounded-lg border text-[12px] font-bold transition-colors cursor-pointer ${
                                        form.severity === s
                                            ? 'bg-gold/20 border-gold/40 text-gold'
                                            : 'bg-white/5 border-border text-text-muted hover:bg-white/10'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <p className="text-[12px] text-red bg-error-bg border border-error-border rounded-lg px-3 py-2">{error}</p>
                    )}
            </form>
        </Modal>
    );
}
