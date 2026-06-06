import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import type { Tournament } from "../../../shared/types/TournamentTypes";
import { adminService } from "../../../api/adminService";

interface CreateTournamentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editingTournament: Tournament | null;
}

export function CreateTournamentModal({ isOpen, onClose, onSuccess, editingTournament }: CreateTournamentModalProps) {
    const [name, setName] = useState(editingTournament?.name || "");
    const [description, setDescription] = useState(editingTournament?.description || "");
    const [startDate, setStartDate] = useState(editingTournament?.startISO || "");
    const [endDate, setEndDate] = useState(editingTournament?.endISO || "");
    // Use raw backend statuses: draft, scheduled, ongoing, completed, cancelled
    const [status, setStatus] = useState(
        editingTournament?.status === "upcoming" ? "scheduled" :
        editingTournament?.status === "live" ? "ongoing" :
        editingTournament?.status || "draft"
    );

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editingTournament) {
            setName(editingTournament.name || "");
            setDescription(editingTournament.description || "");
            setStartDate(editingTournament.startISO || "");
            setEndDate(editingTournament.endISO || "");
            setStatus(
                editingTournament.status === 'upcoming' ? 'scheduled' : 
                editingTournament.status === 'live' ? 'ongoing' : 
                editingTournament.status || 'draft'
            );
        } else {
            setName("");
            setDescription("");
            setStartDate("");
            setEndDate("");
            setStatus("draft");
        }
        setError("");
    }, [editingTournament, isOpen]);

    if (!isOpen) return null;

    const validateOngoing = (sDate: string, eDate: string) => {
        if (!sDate || !eDate) return false;
        const today = new Date();
        const todayStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getDate()).padStart(2, '0');
        return sDate <= todayStr && todayStr <= eDate;
    };

    const handleStatusChange = (newStatus: string) => {
        if (newStatus === "ongoing") {
            if (!validateOngoing(startDate, endDate)) {
                setError("Cannot set status to ongoing: Today's date must fall between the start and end dates.");
                return;
            }
        }
        setError("");
        setStatus(newStatus);
    };

    const handleStartDateChange = (date: string) => {
        const today = new Date();

        if (editingTournament && editingTournament.startISO) {
            const currentStartObj = new Date(editingTournament.startISO);
            const timeDiff = currentStartObj.getTime() - today.getTime();
            const daysAway = Math.ceil(timeDiff / (1000 * 3600 * 24));

            if (daysAway <= 14) {
                setError("Cannot change the start date because the tournament is 14 days or less away.");
                return;
            }
        }

        setStartDate(date);
        
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);
        const oneWeekAgoStr = oneWeekAgo.getFullYear() + "-" + String(oneWeekAgo.getMonth() + 1).padStart(2, '0') + "-" + String(oneWeekAgo.getDate()).padStart(2, '0');

        if (date && date < oneWeekAgoStr) {
            setError("Start date must not be older than a week ago.");
        } else if (status === "ongoing" && !validateOngoing(date, endDate)) {
            setError("Status reverted to scheduled because today is not within the start and end dates.");
            setStatus("scheduled");
        } else {
            setError("");
        }
    };

    const handleEndDateChange = (date: string) => {
        setEndDate(date);
        if (status === "ongoing" && !validateOngoing(startDate, date)) {
            setError("Status reverted to scheduled because today is not within the start and end dates.");
            setStatus("scheduled");
        }
    };

    const handleSubmit = async () => {
        setError("");

        if (!name || !description || !startDate || !endDate) {
            setError("Please fill in all required fields.");
            return;
        }

        const today = new Date();
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);
        const oneWeekAgoStr = oneWeekAgo.getFullYear() + "-" + String(oneWeekAgo.getMonth() + 1).padStart(2, '0') + "-" + String(oneWeekAgo.getDate()).padStart(2, '0');

        if (startDate < oneWeekAgoStr) {
            setError("Start date must not be older than a week ago.");
            return;
        }

        if (startDate >= endDate) {
            setError("Start date must be before end date.");
            return;
        }

        setLoading(true);
        try {
            const data = {
                tournamentName: name,
                description,
                startDate,
                endDate,
                status
            };

            if (!editingTournament) {
                await adminService.createTournament(data);
            } else {
                await adminService.updateTournament(editingTournament.id, data);
            }

            if (onSuccess) onSuccess();
            onClose();
            // Reset state
            setName("");
            setDescription("");
            setStartDate("");
            setEndDate("");
            setStatus("draft");
        } catch (err: any) {
            setError(err.msg || "Failed to save tournament");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-[500px] bg-[#161616] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]">
                    <h2 className="text-[18px] font-bold text-white tracking-tight leading-tight">
                        {editingTournament ? "Edit Tournament" : "Create New Tournament"}
                    </h2>
                    <button onClick={onClose} disabled={loading} className="text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] p-3 rounded">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Tournament Name</label>
                        <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder="e.g. Winter Cup" className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50" />
                    </div>

                    <div>
                        <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Brief description..." className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 resize-none"></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Start Date</label>
                            <input value={startDate} onChange={e => handleStartDateChange(e.target.value)} type="date" className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 [color-scheme:dark]" />
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">End Date</label>
                            <input value={endDate} onChange={e => handleEndDateChange(e.target.value)} type="date" className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 [color-scheme:dark]" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Status</label>
                        <select value={status} onChange={e => handleStatusChange(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 appearance-none">
                            <option value="draft">Draft</option>
                            <option value="scheduled">Scheduled</option>
                            {editingTournament && (
                                <>
                                    <option value="ongoing">Ongoing</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </>
                            )}
                        </select>
                    </div>
                </div>

                <div className="p-5 border-t border-white/5 bg-[#1a1a1a] flex justify-end gap-3">
                    <button onClick={onClose} disabled={loading} className="px-5 py-2 rounded text-[13px] font-medium text-gray-400 hover:text-white transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-5 py-2 rounded text-[13px] font-medium text-white bg-red-700 hover:bg-red-600 transition-colors shadow-lg shadow-red-900/20 disabled:opacity-50">
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        {editingTournament ? "Save Changes" : "Create Tournament"}
                    </button>
                </div>
            </div>
        </div>
    );
}
