// Returns true if dateA and dateB fall on the same calendar day (server-local
// timezone) — mirrors the day-boundary convention RaceRoundService.js already
// uses for its own scheduling-conflict check.
function isSameCalendarDay(dateA, dateB) {
    const a = new Date(dateA);
    const b = new Date(dateB);
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return false;
    a.setHours(0, 0, 0, 0);
    b.setHours(0, 0, 0, 0);
    return a.getTime() === b.getTime();
}

module.exports = { isSameCalendarDay };
