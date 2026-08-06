const Registration = require('../entities/Registration');
const RaceRound = require('../entities/RaceRound');
const Invitation = require('../entities/Invitation');
const { isSameCalendarDay } = require('../utils/RaceDateUtil');

// Business rule: a horse may be committed (Registration.horseId set) to at
// most MAX_RACES_PER_DAY race round(s) per Vietnam (GMT+7) calendar day —
// global across every tournament, since a horse can only physically run so
// many races the same day. Registrations that are rejected/cancelled/failed
// never held a real slot, so they don't count as a commitment.
//
// Bump this constant to raise/lower the daily cap; no other file needs to
// change since callers only check the truthiness of the returned value.
const MAX_RACES_PER_DAY = 1;
const NON_COMMITTED_STATUSES = ['rejected', 'cancelled', 'failed'];

// Returns a conflict descriptor if `horseId`, once committed to
// `targetRaceRoundId`, would be committed to more than MAX_RACES_PER_DAY
// race round(s) on that round's Vietnam calendar day; otherwise null.
//
// The descriptor is { raceRounds, count, limit } where `raceRounds` is every
// OTHER same-day round the horse is already committed to (oldest call sites
// that just do `if (conflict)` keep working unchanged; callers that want
// detail — e.g. to list all clashing rounds — can read the extra fields).
async function findHorseScheduleConflict(horseId, targetRaceRoundId) {
    if (!horseId || !targetRaceRoundId) return null;

    const targetRaceRound = await RaceRound.findById(targetRaceRoundId).lean();
    if (!targetRaceRound) return null;

    const committedRegs = await Registration.find({
        horseId,
        raceRoundId: { $ne: targetRaceRoundId },
        registrationStatus: { $nin: NON_COMMITTED_STATUSES },
    }).lean();
    if (!committedRegs.length) return null;

    const raceRoundIds = [...new Set(committedRegs.map(r => String(r.raceRoundId)))];
    const otherRaceRounds = await RaceRound.find({ _id: { $in: raceRoundIds } }).lean();

    const sameDayRaceRounds = otherRaceRounds.filter(otherRaceRound =>
        isSameCalendarDay(otherRaceRound.raceDate, targetRaceRound.raceDate)
    );

    // +1 to count the round being assigned now alongside the existing ones.
    if (sameDayRaceRounds.length + 1 <= MAX_RACES_PER_DAY) return null;

    return {
        raceRounds: sameDayRaceRounds,
        count: sameDayRaceRounds.length + 1,
        limit: MAX_RACES_PER_DAY,
        // Kept for backward compatibility with call sites that only read
        // this field (they treat the whole object as truthy either way).
        raceRound: sameDayRaceRounds[0],
    };
}

// Releases Registration.horseId back to null once no invitation for that
// registration is still "live" (pending/accepted). Call this after any
// change that can retire an invitation — owner cancel, jockey decline —
// so a dead commitment stops blocking findHorseScheduleConflict / the
// "all invitations for a registration must use the same horse" rule.
async function releaseHorseIfNoActiveInvitation(registrationId) {
    if (!registrationId) return;
    const stillActive = await Invitation.exists({
        registrationId,
        invitationStatus: { $nin: ['declined', 'cancelled'] },
    });
    if (!stillActive) {
        await Registration.findByIdAndUpdate(registrationId, { horseId: null });
    }
}

module.exports = { findHorseScheduleConflict, releaseHorseIfNoActiveInvitation, MAX_RACES_PER_DAY };
