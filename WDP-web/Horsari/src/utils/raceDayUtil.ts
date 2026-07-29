// Race scheduling is always reasoned about in Vietnam time, regardless of the
// viewing device's own timezone — anchoring to a fixed IANA zone keeps this in
// agreement with the backend's equivalent check (see RaceDateUtil.js).
const RACE_TIMEZONE = 'Asia/Ho_Chi_Minh';

function calendarDayKey(date: string | Date): string {
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
