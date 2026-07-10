const Invitation = require('../entities/Invitation');
const Registration = require('../entities/Registration');
const RaceRound = require('../entities/RaceRound');

// Matches RaceRoundService.js's NINETY_MINUTES_MS — the existing "too close
// together" window used to stop admins from double-booking a location.
const CONFLICT_WINDOW_MS = 90 * 60 * 1000;

// Returns { conflictingInvitation, conflictingRaceRound, sameRound } for the
// first ACCEPTED invitation this jockey holds that conflicts with
// targetRaceRoundId (same race round, or within CONFLICT_WINDOW_MS of it),
// or null if there's no conflict.
async function findJockeyScheduleConflict(jockeyId, targetRaceRoundId, { excludeInvitationId } = {}) {
    const targetRaceRound = await RaceRound.findById(targetRaceRoundId).lean();
    if (!targetRaceRound) return null;

    const filter = { jockeyId, invitationStatus: 'accepted' };
    if (excludeInvitationId) filter._id = { $ne: excludeInvitationId };

    const acceptedInvitations = await Invitation.find(filter).lean();
    if (!acceptedInvitations.length) return null;

    const regIds = acceptedInvitations.map(inv => inv.registrationId).filter(Boolean);
    const registrations = await Registration.find({ _id: { $in: regIds } }).lean();
    const raceRoundIds = [...new Set(registrations.map(r => String(r.raceRoundId)).filter(Boolean))];
    const raceRounds = await RaceRound.find({ _id: { $in: raceRoundIds } }).lean();
    const raceRoundMap = new Map(raceRounds.map(rr => [String(rr._id), rr]));
    const regMap = new Map(registrations.map(r => [String(r._id), r]));

    for (const inv of acceptedInvitations) {
        const reg = regMap.get(String(inv.registrationId));
        const otherRaceRound = reg?.raceRoundId ? raceRoundMap.get(String(reg.raceRoundId)) : null;
        if (!otherRaceRound) continue;

        const sameRound = String(otherRaceRound._id) === String(targetRaceRound._id);
        const diffMs = Math.abs(new Date(targetRaceRound.raceDate).getTime() - new Date(otherRaceRound.raceDate).getTime());

        if (sameRound || diffMs < CONFLICT_WINDOW_MS) {
            return { conflictingInvitation: inv, conflictingRaceRound: otherRaceRound, sameRound };
        }
    }
    return null;
}

module.exports = { findJockeyScheduleConflict, CONFLICT_WINDOW_MS };
