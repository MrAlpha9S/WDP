import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import type { RaceEligibilityRule } from "../AdminRuleManagementPage";

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" style={{ animation: "fadeIn 0.15s ease-out" }}>
            <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
            
            <div className="w-full max-w-2xl bg-[#141414] border border-white/[0.07] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] shrink-0">
                    <h2 className="text-[18px] font-semibold text-white">
                        {rule ? "Edit Eligibility Rule" : "Create Eligibility Rule"}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Form Body */}
                <form id="rule-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    
                    {/* Core Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Race Type</label>
                            <input
                                type="text"
                                value={formData.raceType}
                                onChange={e => setFormData({ ...formData, raceType: e.target.value })}
                                placeholder="e.g., Stakes, Claiming, Maiden (Optional)"
                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-[14px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
                            />
                        </div>
                    </div>

                    <hr className="border-white/5" />

                    {/* Age Limits */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Min Age</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.minAge}
                                onChange={e => setFormData({ ...formData, minAge: e.target.value })}
                                placeholder="Any"
                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-[14px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Max Age</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.maxAge}
                                onChange={e => setFormData({ ...formData, maxAge: e.target.value })}
                                placeholder="Any"
                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-[14px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
                            />
                        </div>
                    </div>

                    <hr className="border-white/5" />

                    {/* Experience */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Min Races Run</label>
                            <input
                                type="number"
                                min="0"
                                required
                                value={formData.minRacesRun}
                                onChange={e => setFormData({ ...formData, minRacesRun: parseInt(e.target.value) || 0 })}
                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/20 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Min Races Won</label>
                            <input
                                type="number"
                                min="0"
                                required
                                value={formData.minRacesWon}
                                onChange={e => setFormData({ ...formData, minRacesWon: parseInt(e.target.value) || 0 })}
                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/20 transition-colors"
                            />
                        </div>
                    </div>

                    <hr className="border-white/5" />

                    {/* Traits */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Required Gender</label>
                            <select
                                value={formData.requiredGender}
                                onChange={e => setFormData({ ...formData, requiredGender: e.target.value })}
                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/20 transition-colors appearance-none"
                            >
                                <option value="any">Any Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Required Breed</label>
                            <input
                                type="text"
                                value={formData.requiredBreed}
                                onChange={e => setFormData({ ...formData, requiredBreed: e.target.value })}
                                placeholder="e.g., Thoroughbred (Optional)"
                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-[14px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
                            />
                        </div>
                    </div>

                    <hr className="border-white/5" />

                    {/* Requirements */}
                    <div className="bg-white/[0.02] p-4 rounded-xl border border-white/[0.05]">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.licenseRequired}
                                onChange={e => setFormData({ ...formData, licenseRequired: e.target.checked })}
                                className="w-5 h-5 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 transition-all"
                            />
                            <div className="flex flex-col">
                                <span className="text-gray-200 font-medium text-[14px]">License Required</span>
                                <span className="text-gray-500 text-[12px] mt-0.5">Horse owner must have a valid racing license to register for this race type.</span>
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
                                    <span className="text-blue-400 font-medium text-[14px]">Activate Immediately</span>
                                    <span className="text-gray-500 text-[12px] mt-0.5">Make this rule available for new races immediately.</span>
                                </div>
                            </label>
                        </div>
                    )}

                </form>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/[0.07] shrink-0 flex justify-end gap-3 bg-[#111111]">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-5 py-2 text-[13px] font-medium text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="rule-form"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 text-[13px] font-medium text-white bg-emerald-600 rounded hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                    >
                        {loading ? "Saving..." : (
                            <>
                                <Save size={14} />
                                {rule ? "Update Rule" : "Create Rule"}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
