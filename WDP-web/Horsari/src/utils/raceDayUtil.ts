import { useState } from "react";

// Race scheduling is always reasoned about in Vietnam time, regardless of the
// viewing device's own timezone — anchoring to a fixed IANA zone keeps this in
// agreement with the backend's equivalent check (see RaceDateUtil.js).
const RACE_TIMEZONE = 'Asia/Ho_Chi_Minh';

// Directly-comparable YYYY-MM-DD key for `date`, anchored to RACE_TIMEZONE — exported so
// callers that group/compare race dates client-side (e.g. the schedule Timeline view) use
// the same Vietnam-anchored day boundary as the rest of this file and the backend's
// RaceDateUtil.calendarDayKey, instead of the viewer's own device-local timezone.
export function calendarDayKey(date: string | Date): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: RACE_TIMEZONE }).format(new Date(date));
}

// True if `raceDate` falls on the same calendar day as "now", both anchored to Vietnam time.
export function isRaceDayToday(raceDate: string | Date | null | undefined): boolean {
    if (!raceDate) return false;
    return calendarDayKey(raceDate) === calendarDayKey(new Date());
}

// Plain instant comparison — mirrors the backend's RaceDateUtil.hasReachedStartTime.
export function hasReachedStartTime(raceDate: string | Date | null | undefined): boolean {
    if (!raceDate) return true; // unknown -> don't block
    return Date.now() >= new Date(raceDate).getTime();
}

// Shared "is now the right time to start/finalize this race round?" gate, used by both the
// Admin start-race action and the Referee prepare/finalize action — mirrors the backend's
// RaceDateUtil.getScheduleGateError. Owns the derived mismatch booleans, the warning
// message, and the confirm-modal open state so both call sites don't hand-roll their own.
export function useScheduleGate(
    raceDate: string | Date | null | undefined,
    { requireStartTime = false }: { requireStartTime?: boolean } = {}
) {
    const [isOpen, setIsOpen] = useState(false);

    const isRaceDayMismatch = !!raceDate && !isRaceDayToday(raceDate);
    const raceNotStartedYet = requireStartTime && !!raceDate && isRaceDayToday(raceDate) && !hasReachedStartTime(raceDate);
    const needsConfirm = isRaceDayMismatch || raceNotStartedYet;

    const warningMessage = isRaceDayMismatch
        ? `This race is scheduled for ${new Date(raceDate!).toLocaleDateString()}, not today.`
        : raceNotStartedYet
            ? `This race hasn't reached its scheduled start time yet (${new Date(raceDate!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).`
            : '';

    return {
        needsConfirm,
        warningMessage,
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
    };
}
