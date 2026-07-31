import { useState } from "react";
import { horseOwnerService } from "../api/horseOwnerService";

// Shared "reject this registration, permanently" confirm flow, used by every page that
// shows an owner's own registration (Invitations, Races, HorseProfile) — same shape as
// useScheduleGate in utils/raceDayUtil.ts.
export function useRejectRegistration(onSuccess: (registrationId: string) => void) {
    const [target, setTarget] = useState<{ id: string; label: string } | null>(null);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const requestReject = (id: string, label: string) => {
        setError(null);
        setTarget({ id, label });
    };

    const cancel = () => {
        if (pending) return;
        setTarget(null);
        setError(null);
    };

    const confirm = async () => {
        if (!target) return;
        setPending(true);
        setError(null);
        try {
            await horseOwnerService.rejectRegistration(target.id);
            onSuccess(target.id);
            setTarget(null);
        } catch (err: any) {
            setError(err?.msg ?? "Failed to reject registration.");
        } finally {
            setPending(false);
        }
    };

    return { target, pending, error, requestReject, cancel, confirm };
}
