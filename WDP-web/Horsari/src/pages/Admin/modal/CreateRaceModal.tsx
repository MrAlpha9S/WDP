import { useState } from "react";
import { X, Calendar, MapPin, Search } from "lucide-react";
import { TRACKS, MOCK_OWNERS, MOCK_REFEREES, checkEligibility } from "../../../shared/data/RaceData";
import type { RaceType } from "../../../shared/types/RaceTypes";

interface CreateRaceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateRaceModal({ isOpen, onClose }: CreateRaceModalProps) {
    const [createRaceType, setCreateRaceType] = useState<RaceType>("Stakes");
    const [refereeSearchQuery, setRefereeSearchQuery] = useState("");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-[600px] bg-[#161616] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]">
                    <h2 className="text-[18px] font-bold text-white tracking-tight leading-tight">Create New Race</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[60vh] custom-scrollbar">
                    {/* Form Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Race Title</label>
                            <input type="text" placeholder="e.g. Royal Ascot Gold Cup" className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50" />
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Tournament</label>
                            <select className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 appearance-none">
                                <option value="none">Non-tournament</option>
                                <option value="autumn">Autumn Series</option>
                                <option value="global">Global Championship</option>
                                <option value="summer">Summer Sprint Cup</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Race Type</label>
                            <select
                                value={createRaceType}
                                onChange={(e) => setCreateRaceType(e.target.value as RaceType)}
                                className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 appearance-none"
                            >
                                <option value="Stakes">Stakes (Top tier)</option>
                                <option value="Allowance">Allowance (Middle tier)</option>
                                <option value="Claims">Claims (Open/Purchase)</option>
                                <option value="Maiden">Maiden (0 wins)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Track Location</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                <input type="text" list="tracks-list" placeholder="Select or enter custom..." className="w-full bg-[#111] border border-white/10 rounded p-2.5 pl-9 text-[13px] text-white focus:outline-none focus:border-red-500/50" />
                                <datalist id="tracks-list">
                                    {TRACKS.map(t => <option key={t.id} value={t.name} />)}
                                </datalist>
                            </div>
                        </div>
                    </div>

                    {createRaceType === "Stakes" && (
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Stakes Grade (Subtype)</label>
                            <select className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 appearance-none">
                                <option value="G1">Grade 1 (G1)</option>
                                <option value="G2">Grade 2 (G2)</option>
                                <option value="G3">Grade 3 (G3)</option>
                                <option value="Listed">Listed (Ungraded)</option>
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Address</label>
                        <input type="text" placeholder="e.g. 123 Racing Blvd, City" className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                <input type="date" className="w-full bg-[#111] border border-white/10 rounded p-2.5 pl-9 text-[13px] text-white focus:outline-none focus:border-red-500/50 [color-scheme:dark]" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Start Time</label>
                            <input type="time" defaultValue="14:00" className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 [color-scheme:dark]" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                            Invite Horse Owners <span className="text-gray-500 normal-case ml-1 font-normal">(Auto-filtered for {createRaceType} eligibility)</span>
                        </label>
                        <div className="p-3 bg-[#111] border border-white/10 rounded flex flex-col gap-2 max-h-[140px] overflow-y-auto custom-scrollbar">
                            {MOCK_OWNERS.filter(owner => owner.horses.some(h => checkEligibility(h, createRaceType))).map((owner) => {
                                const eligibleHorses = owner.horses.filter(h => checkEligibility(h, createRaceType));
                                return (
                                    <label key={owner.id} className="flex items-start gap-3 p-2 cursor-pointer group hover:bg-white/5 rounded transition-colors">
                                        <input type="checkbox" className="w-3.5 h-3.5 mt-1 accent-red-600 rounded bg-black border-white/20" />
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-semibold text-white group-hover:text-red-400 transition-colors">{owner.ownerName}</span>
                                            <span className="text-[11px] text-gray-500">
                                                Eligible: {eligibleHorses.map(h => `${h.name} (${h.wins}w)`).join(", ")}
                                            </span>
                                        </div>
                                    </label>
                                );
                            })}
                            {MOCK_OWNERS.filter(owner => owner.horses.some(h => checkEligibility(h, createRaceType))).length === 0 && (
                                <div className="text-[12px] text-gray-500 p-2 italic text-center">No eligible horse owners found for this race type.</div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                            Assign Referee <span className="text-gray-500 normal-case ml-1 font-normal">(Optional)</span>
                        </label>
                        <div className="p-3 bg-[#111] border border-white/10 rounded flex flex-col gap-2">
                            <div className="relative mb-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                <input 
                                    type="text" 
                                    placeholder="Search referee by name..." 
                                    value={refereeSearchQuery}
                                    onChange={(e) => setRefereeSearchQuery(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded py-1.5 pl-9 pr-3 text-[12px] text-white focus:outline-none focus:border-red-500/50"
                                />
                            </div>
                            <div className="max-h-[120px] overflow-y-auto custom-scrollbar flex flex-col gap-1">
                                {MOCK_REFEREES.filter(r => r.name.toLowerCase().includes(refereeSearchQuery.toLowerCase())).map((ref) => (
                                    <label key={ref.id} className="flex items-center gap-3 p-2 cursor-pointer group hover:bg-white/5 rounded transition-colors">
                                        <input type="checkbox" className="w-3.5 h-3.5 accent-red-600 rounded bg-black border-white/20" />
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-semibold text-white group-hover:text-red-400 transition-colors">{ref.name}</span>
                                            <span className="text-[11px] text-gray-500">{ref.experience}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-white/5 bg-[#1a1a1a] flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 rounded text-[13px] font-medium text-gray-400 hover:text-white transition-colors">
                        Cancel
                    </button>
                    <button onClick={onClose} className="px-5 py-2 rounded text-[13px] font-medium text-white bg-red-700 hover:bg-red-600 transition-colors shadow-lg shadow-red-900/20">
                        Create Race
                    </button>
                </div>
            </div>
        </div>
    );
}
