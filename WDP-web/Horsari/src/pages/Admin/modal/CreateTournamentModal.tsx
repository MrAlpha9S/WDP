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
    const [status, setStatus] = useState<"draft" | "scheduled" | "ongoing" | "completed" | "cancelled">(
        editingTournament?.status === "upcoming" ? "scheduled" :
            editingTournament?.status === "live" ? "ongoing" :
                (editingTournament?.status as "draft" | "scheduled" | "ongoing" | "completed" | "cancelled") || "scheduled"
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
                        editingTournament.status || 'scheduled'
            );
        } else {
            setName("");
            setDescription("");
            setStartDate("");
            setEndDate("");
            setStatus("scheduled");
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

    // Minimum selectable start date: must be more than 2 weeks from today, mirroring
    // TournamentService's createTournament/updateTournament rule exactly (same +14-day
    // boundary) so the picker never lets you choose something the backend would reject.
    // Applies whether creating or editing — changing startDate always re-applies this rule,
    // it does NOT freeze based on the tournament's current date (extending a near-term start
    // out past this minimum is allowed; only landing on/staying inside the window is blocked).
    const today = new Date();
    const currentDateUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const twoWeekFromNow = new Date(currentDateUTC.getTime() + 14 * 24 * 60 * 60 * 1000);
    const minStartDateStr = `${twoWeekFromNow.getUTCFullYear()}-${String(twoWeekFromNow.getUTCMonth() + 1).padStart(2, '0')}-${String(twoWeekFromNow.getUTCDate()).padStart(2, '0')}`;

    const handleStartDateChange = (date: string) => {
        if (date && date < minStartDateStr) {
            setError("Start date must be more than 2 weeks from now.");
            setStartDate(date);
            return;
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

        // Only re-check the 2-week minimum if startDate is actually being changed — an
        // untouched startDate on an existing (now-imminent) tournament must stay submittable.
        const startDateChanged = !editingTournament || startDate !== editingTournament.startISO;
        if (startDateChanged && startDate < minStartDateStr) {
            setError("Start date must be more than 2 weeks from now.");
            return;
        }

        if (startDate >= endDate) {
            setError("Start date must be before end date.");
            return;
        }

        setLoading(true);
        try {
            if (!editingTournament) {
                await adminService.createTournament({ tournamentName: name, description, startDate, endDate, status });
            } else {
                // Status is edited from the tournament detail panel, not here.
                await adminService.updateTournament(editingTournament.id, { tournamentName: name, description, startDate, endDate });
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
            <div className="w-[500px] bg-surface border border-border rounded-xl overflow-hidden shadow-2xl flex flex-col">
                <div className="p-6 border-b border-border/60 flex justify-between items-center bg-surface-raised">
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
                        <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder="e.g. Winter Cup" className="w-full bg-bg border border-border rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50" />
                    </div>

                    <div>
                        <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Brief description..." className="w-full bg-bg border border-border rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 resize-none"></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Start Date</label>
                            <input
                                value={startDate}
                                onChange={e => handleStartDateChange(e.target.value)}
                                type="date"
                                min={minStartDateStr}
                                className="w-full bg-bg border border-border rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 [color-scheme:dark]"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-2">End Date</label>
                            <input value={endDate} onChange={e => handleEndDateChange(e.target.value)} type="date" className="w-full bg-bg border border-border rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 [color-scheme:dark]" />
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-border/60 bg-surface-raised flex justify-end gap-3">
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
