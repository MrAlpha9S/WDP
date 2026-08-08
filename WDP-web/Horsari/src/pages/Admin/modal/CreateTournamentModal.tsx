import { useState, useEffect } from "react";
import type { Tournament } from "../../../shared/types/TournamentTypes";
import { adminService } from "../../../api/adminService";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";

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

    // End date must be strictly after start date (backend rejects startDate >= endDate),
    // so the picker's floor is startDate + 1 day, not startDate itself.
    const minEndDateStr = startDate
        ? (() => {
            const [y, m, d] = startDate.split('-').map(Number);
            const dayAfterStart = new Date(Date.UTC(y, m - 1, d + 1));
            return `${dayAfterStart.getUTCFullYear()}-${String(dayAfterStart.getUTCMonth() + 1).padStart(2, '0')}-${String(dayAfterStart.getUTCDate()).padStart(2, '0')}`;
        })()
        : minStartDateStr;

    const handleStartDateChange = (date: string) => {
        if (date && date < minStartDateStr) {
            setError("Start date must be more than 2 weeks from now.");
            setStartDate(date);
            return;
        }

        setStartDate(date);

        // Reset endDate whenever it would conflict with the new startDate,
        // since the endDate input's min is tied to startDate (end must be strictly after start).
        if (date && endDate && endDate <= date) {
            setEndDate("");
        }

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
        <Modal
            title={editingTournament ? "Edit Tournament" : "Create New Tournament"}
            onClose={onClose}
            closeOnBackdrop={!loading}
            footer={<>
                <Button variant="secondary" size="sm" disabled={loading} onClick={onClose}>
                    Cancel
                </Button>
                <Button size="sm" loading={loading} onClick={handleSubmit}>
                    {editingTournament ? "Save Changes" : "Create Tournament"}
                </Button>
            </>}
        >
            <div className="flex flex-col gap-4">
                {error && (
                    <div className="bg-error-bg border border-error-border text-red text-[13px] p-3 rounded-lg">
                        {error}
                    </div>
                )}
                <div>
                    <label className="block text-[12px] font-semibold text-text-muted uppercase tracking-widest mb-2">Tournament Name <span className="text-red">*</span></label>
                    <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder="e.g. Winter Cup" className="w-full bg-bg border border-border rounded-lg p-2.5 text-[13px] text-text focus:outline-none focus:border-red/50" />
                </div>

                <div>
                    <label className="block text-[12px] font-semibold text-text-muted uppercase tracking-widest mb-2">Description <span className="text-red">*</span></label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Brief description..." className="w-full bg-bg border border-border rounded-lg p-2.5 text-[13px] text-text focus:outline-none focus:border-red/50 resize-none"></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[12px] font-semibold text-text-muted uppercase tracking-widest mb-2">Start Date <span className="text-red">*</span></label>
                        <input
                            value={startDate}
                            onChange={e => handleStartDateChange(e.target.value)}
                            type="date"
                            min={minStartDateStr}
                            className="w-full bg-bg border border-border rounded-lg p-2.5 text-[13px] text-text focus:outline-none focus:border-red/50 [color-scheme:dark]"
                        />
                    </div>
                    <div>
                        <label className="block text-[12px] font-semibold text-text-muted uppercase tracking-widest mb-2">End Date <span className="text-red">*</span></label>
                        <input
                            value={endDate}
                            onChange={e => handleEndDateChange(e.target.value)}
                            type="date"
                            min={minEndDateStr}
                            disabled={!startDate}
                            className="w-full bg-bg border border-border rounded-lg p-2.5 text-[13px] text-text focus:outline-none focus:border-red/50 [color-scheme:dark] disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
}
