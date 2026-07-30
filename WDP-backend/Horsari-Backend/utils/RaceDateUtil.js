// Race scheduling is always reasoned about in Vietnam time, regardless of the
// timezone the server process itself happens to run in (dev machine vs. a
// hosting provider's UTC container) — anchoring to a fixed IANA zone keeps
// "today"/"has this started yet" consistent across environments.
const RACE_TIMEZONE = 'Asia/Ho_Chi_Minh';

// Directly-comparable YYYY-MM-DD key for `date`, anchored to RACE_TIMEZONE.
function calendarDayKey(date) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: RACE_TIMEZONE }).format(date);
}

// Returns true if dateA and dateB fall on the same calendar day in Vietnam time.
function isSameCalendarDay(dateA, dateB) {
    const a = new Date(dateA);
    const b = new Date(dateB);
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return false;
    return calendarDayKey(a) === calendarDayKey(b);
}

// The UTC instant range covering a Vietnam calendar day (`dayKey`, "YYYY-MM-DD") — for
// bounding a "give me everything on this day" query. Asia/Ho_Chi_Minh has no DST, so a
// fixed +07:00 offset is always correct, unlike RACE_TIMEZONE-formatted display strings.
function getVietnamDayRange(dayKey) {
    return {
        start: new Date(`${dayKey}T00:00:00+07:00`),
        end: new Date(`${dayKey}T23:59:59.999+07:00`),
    };
}

// Plain instant comparison — no timezone anchoring needed here, comparing two
// absolute timestamps is timezone-agnostic by nature.
function hasReachedStartTime(raceDate, now = new Date()) {
    const d = new Date(raceDate);
    if (isNaN(d.getTime())) return true; // malformed/unknown -> don't block
    return now.getTime() >= d.getTime();
}

// Shared "is now the right time to start/finalize this race round?" gate, used by both
// the Admin start-race transition and the Referee prepare/finalize transition. Returns a
// { code, msg, data } error object if the gate fails, or null if it passes (an `override`
// always passes). Centralized so both services stay in sync instead of hand-rolling the
// same same-day/start-time checks and error shape independently.
function getScheduleGateError(raceDate, { requireStartTime = false, override = false } = {}) {
    if (override) return null;
    if (!isSameCalendarDay(raceDate, new Date())) {
        return { code: 422, msg: 'This race round is not scheduled for today.', data: { dateMismatch: true, raceDate } };
    }
    if (requireStartTime && !hasReachedStartTime(raceDate)) {
        return { code: 422, msg: 'This race round has not reached its scheduled start time yet.', data: { dateMismatch: true, raceDate } };
    }
    return null;
}

module.exports = { calendarDayKey, isSameCalendarDay, hasReachedStartTime, getScheduleGateError, getVietnamDayRange };
