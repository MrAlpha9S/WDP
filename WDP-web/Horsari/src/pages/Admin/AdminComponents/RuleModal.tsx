import React, { useState, useEffect } from "react";
import { Save } from "lucide-react";
import type { RaceEligibilityRule } from "../AdminRuleManagementPage";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";

interface RuleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    rule?: RaceEligibilityRule | null;
}

export default function RuleModal({ isOpen, onClose, onSave, rule }: RuleModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        raceType: "",
        minAge: "",
        maxAge: "",
        minRacesRun: 0,
        minRacesWon: 0,
        requiredGender: "any",
        requiredBreed: "",
        licenseRequired: false,
        isActive: true,
    });

    useEffect(() => {
        if (rule) {
            setFormData({
                raceType: rule.raceType || "",
                minAge: rule.minAge?.toString() || "",
                maxAge: rule.maxAge?.toString() || "",
                minRacesRun: rule.minRacesRun || 0,
                minRacesWon: rule.minRacesWon || 0,
                requiredGender: rule.requiredGender || "any",
                requiredBreed: rule.requiredBreed || "",
                licenseRequired: rule.licenseRequired || false,
                isActive: rule.isActive ?? true,
            });
        } else {
            setFormData({
                raceType: "",
                minAge: "",
                maxAge: "",
                minRacesRun: 0,
                minRacesWon: 0,
                requiredGender: "any",
                requiredBreed: "",
                licenseRequired: false,
                isActive: true,
            });
        }
    }, [rule, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const submitData = {
            ...formData,
            minAge: formData.minAge === "" ? null : parseInt(formData.minAge),
            maxAge: formData.maxAge === "" ? null : parseInt(formData.maxAge),
            minRacesRun: parseInt(formData.minRacesRun.toString()),
            minRacesWon: parseInt(formData.minRacesWon.toString()),
            requiredGender: formData.requiredGender === "any" ? null : formData.requiredGender,
            requiredBreed: formData.requiredBreed.trim() === "" ? null : formData.requiredBreed.trim(),
            raceType: formData.raceType.trim() === "" ? null : formData.raceType.trim(),
        };

        try {
            await onSave(submitData);
            onClose();
        } catch (error) {
            console.error("Failed to save rule:", error);
            // could add a toast here
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={rule ? "Edit Eligibility Rule" : "Create Eligibility Rule"}
            size="lg"
            onClose={onClose}
            closeOnBackdrop={!loading}
            footer={<>
                <Button variant="secondary" size="sm" disabled={loading} onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    size="sm"
                    variant="secondary"
                    type="submit"
                    form="rule-form"
                    loading={loading}
                    leftIcon={<Save size={14} />}
                >
                    {loading ? "Saving..." : rule ? "Update Rule" : "Create Rule"}
                </Button>
            </>}
        >
            <form id="rule-form" onSubmit={handleSubmit} className="space-y-6">

                    {/* Core Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Race Type</label>
                            <input
                                type="text"
                                value={formData.raceType}
                                onChange={e => setFormData({ ...formData, raceType: e.target.value })}
                                placeholder="e.g., Stakes, Claiming, Maiden (Optional)"
                                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-[14px] text-text placeholder:text-text-muted focus:outline-none focus:border-white/20 transition-colors"
                            />
                        </div>
                    </div>

                    <hr className="border-border/60" />

                    {/* Age Limits */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Min Age</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.minAge}
                                onChange={e => setFormData({ ...formData, minAge: e.target.value })}
                                placeholder="Any"
                                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-[14px] text-text placeholder:text-text-muted focus:outline-none focus:border-white/20 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Max Age</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.maxAge}
                                onChange={e => setFormData({ ...formData, maxAge: e.target.value })}
                                placeholder="Any"
                                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-[14px] text-text placeholder:text-text-muted focus:outline-none focus:border-white/20 transition-colors"
                            />
                        </div>
                    </div>

                    <hr className="border-border/60" />

                    {/* Experience */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Min Races Run</label>
                            <input
                                type="number"
                                min="0"
                                required
                                value={formData.minRacesRun}
                                onChange={e => setFormData({ ...formData, minRacesRun: parseInt(e.target.value) || 0 })}
                                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-[14px] text-text focus:outline-none focus:border-white/20 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Min Races Won</label>
                            <input
                                type="number"
                                min="0"
                                required
                                value={formData.minRacesWon}
                                onChange={e => setFormData({ ...formData, minRacesWon: parseInt(e.target.value) || 0 })}
                                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-[14px] text-text focus:outline-none focus:border-white/20 transition-colors"
                            />
                        </div>
                    </div>

                    <hr className="border-border/60" />

                    {/* Traits */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Required Gender</label>
                            <select
                                value={formData.requiredGender}
                                onChange={e => setFormData({ ...formData, requiredGender: e.target.value })}
                                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-[14px] text-text focus:outline-none focus:border-white/20 transition-colors appearance-none"
                            >
                                <option value="any">Any Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Required Breed</label>
                            <input
                                type="text"
                                value={formData.requiredBreed}
                                onChange={e => setFormData({ ...formData, requiredBreed: e.target.value })}
                                placeholder="e.g., Thoroughbred (Optional)"
                                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-[14px] text-text placeholder:text-text-muted focus:outline-none focus:border-white/20 transition-colors"
                            />
                        </div>
                    </div>

                    <hr className="border-border/60" />

                    {/* Requirements */}
                    <div className="bg-white/2 p-4 rounded-xl border border-border/60">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.licenseRequired}
                                onChange={e => setFormData({ ...formData, licenseRequired: e.target.checked })}
                                className="w-5 h-5 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 transition-all"
                            />
                            <div className="flex flex-col">
                                <span className="text-text font-medium text-[14px]">License Required</span>
                                <span className="text-text-muted text-[12px] mt-0.5">Horse owner must have a valid racing license to register for this race type.</span>
                            </div>
                        </label>
                    </div>

                    {/* Status */}
                    {!rule && (
                        <div className="pt-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/20 focus:ring-offset-0 transition-all"
                                />
                                <div className="flex flex-col">
                                    <span className="text-blue font-medium text-[14px]">Activate Immediately</span>
                                    <span className="text-text-muted text-[12px] mt-0.5">Make this rule available for new races immediately.</span>
                                </div>
                            </label>
                        </div>
                    )}

                </form>
        </Modal>
    );
}
