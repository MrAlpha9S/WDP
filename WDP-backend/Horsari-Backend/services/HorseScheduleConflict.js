const Registration = require('../entities/Registration');
const RaceRound = require('../entities/RaceRound');
const { isSameCalendarDay } = require('../utils/RaceDateUtil');

// Returns { conflictingRegistration, conflictingRaceRound } for the first OTHER
// accepted/verified registration this horse is already locked into
// (Registration.horseId) whose race round falls on the same Vietnam calendar
// day as targetRaceRoundId, or null if there's no conflict.
async function findHorseScheduleConflict(horseId, targetRaceRoundId, { excludeRegistrationId } = {}) {
    const targetRaceRound = await RaceRound.findById(targetRaceRoundId).lean();
    if (!targetRaceRound) return null;

    const filter = { horseId, registrationStatus: { $in: ['accepted', 'verified'] } };
    if (excludeRegistrationId) filter._id = { $ne: excludeRegistrationId };

    const committedRegistrations = await Registration.find(filter).lean();
    if (!committedRegistrations.length) return null;

    const raceRoundIds = [...new Set(committedRegistrations.map(r => String(r.raceRoundId)).filter(Boolean))];
    const raceRounds = await RaceRound.find({ _id: { $in: raceRoundIds } }).lean();
    const raceRoundMap = new Map(raceRounds.map(rr => [String(rr._id), rr]));

    for (const reg of committedRegistrations) {
        const otherRaceRound = reg.raceRoundId ? raceRoundMap.get(String(reg.raceRoundId)) : null;
        if (!otherRaceRound) continue;
        if (isSameCalendarDay(otherRaceRound.raceDate, targetRaceRound.raceDate)) {
            return { conflictingRegistration: reg, conflictingRaceRound: otherRaceRound };
        }
    }
    return null;
}

module.exports = { findHorseScheduleConflict };
