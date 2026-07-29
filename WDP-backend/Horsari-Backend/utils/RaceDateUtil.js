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

// Plain instant comparison — no timezone anchoring needed here, comparing two
// absolute timestamps is timezone-agnostic by nature.
function hasReachedStartTime(raceDate, now = new Date()) {
    const d = new Date(raceDate);
    if (isNaN(d.getTime())) return true; // malformed/unknown -> don't block
    return now.getTime() >= d.getTime();
}

module.exports = { isSameCalendarDay, hasReachedStartTime };
