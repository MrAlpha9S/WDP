const RaceReferee = require('../entities/RaceReferee');
const RaceRound = require('../entities/RaceRound');
const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
const Registration = require('../entities/Registration');
const User = require('../entities/User');
const Invitation = require('../entities/Invitation');
const RaceResult = require('../entities/RaceResult');
const Tournament = require('../entities/Tournament');

class TournamentService {
    // Get Tournaments assigned to the referee (paginated)
    async getRefereeTournaments(refereeId, page = 1, limit = 10, status = null, search = null, sortBy = 'startDate', order = 'desc') {
        try {
            // ── 1. All race round IDs for this referee ────────────────────────
            const assignments = await RaceReferee.find({ refereeId }).lean();
            if (!assignments.length) {
                return {
                    code: 200,
                    data: { items: [], pagination: { totalItems: 0, totalPages: 0, currentPage: page, limit } },
                    msg: 'No tournaments found.',
                };
            }

            const raceRoundIds = assignments.map(a => a.raceRoundId);
            const assignmentMap = new Map(assignments.map(a => [a.raceRoundId.toString(), a]));

            // ── 2. Collect distinct tournament IDs from the assigned rounds ────
            const roundsForTournaments = await RaceRound.find({ _id: { $in: raceRoundIds } }, 'tournamentId').lean();
            const allTournamentIds = [...new Set(
                roundsForTournaments.map(r => r.tournamentId?.toString()).filter(Boolean)
            )];

            // ── 3. Paginate tournaments with filter ───────────────────────────
            const skip = (page - 1) * limit;
            const tFilter = { _id: { $in: allTournamentIds } };
            if (status) tFilter.status = status;
            if (search) tFilter.tournamentName = { $regex: search, $options: 'i' };
            const sortObj = { [sortBy]: order === 'asc' ? 1 : -1 };

            const [tournaments, totalItems] = await Promise.all([
                Tournament.find(tFilter).sort(sortObj).skip(skip).limit(limit).lean(),
                Tournament.countDocuments(tFilter),
            ]);

            if (!tournaments.length) {
                return {
                    code: 200,
                    data: { items: [], pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit } },
                    msg: 'Referee tournaments retrieved successfully',
                };
            }

            // ── 4. Bulk fetch data only for this page's tournaments ───────────
            const pageTournamentIds = tournaments.map(t => t._id.toString());
            const pageRaceRounds = await RaceRound.find({
                _id: { $in: raceRoundIds },
                tournamentId: { $in: pageTournamentIds },
            }).lean();

            const pageRaceRoundIds = pageRaceRounds.map(r => r._id);
            const eligibilityIds = [...new Set(
                pageRaceRounds.filter(r => r.eligibilityRuleId).map(r => r.eligibilityRuleId.toString())
            )];
            const registrationsAll = await Registration.find({ raceRoundId: { $in: pageRaceRoundIds } }).lean();
            const regIds = registrationsAll.map(r => r._id);
            const ownerIds = [...new Set(
                registrationsAll.filter(r => r.horseOwnerId).map(r => r.horseOwnerId.toString())
            )];

            const [eligibilityRules, owners, invitations, raceResults] = await Promise.all([
                eligibilityIds.length
                    ? RaceEligibilityRule.find({ _id: { $in: eligibilityIds } }).lean()
                    : Promise.resolve([]),
                ownerIds.length
                    ? User.find({ _id: { $in: ownerIds } }, 'fullName').lean()
                    : Promise.resolve([]),
                regIds.length
                    ? Invitation.find({ registrationId: { $in: regIds } })
                        .populate('horseId')
                        .populate({ path: 'jockeyId', populate: { path: '_id', model: 'User', select: 'fullName' } })
                        .lean()
                    : Promise.resolve([]),
                regIds.length
                    ? RaceResult.find({ registrationId: { $in: regIds } }).lean()
                    : Promise.resolve([]),
            ]);

            // ── 5. Build lookup maps ──────────────────────────────────────────
            const eligibilityMap = new Map(eligibilityRules.map(e => [e._id.toString(), e]));
            const ownerMap = new Map(owners.map(u => [u._id.toString(), u]));
            const invitationsByReg = new Map();
            for (const inv of invitations) {
                const key = inv.registrationId.toString();
                if (!invitationsByReg.has(key)) invitationsByReg.set(key, []);
                invitationsByReg.get(key).push(inv);
            }
            const raceResultMap = new Map(raceResults.map(r => [r.registrationId.toString(), r]));
            const regsByRound = new Map();
            for (const reg of registrationsAll) {
                const key = reg.raceRoundId.toString();
                if (!regsByRound.has(key)) regsByRound.set(key, []);
                regsByRound.get(key).push(reg);
            }
            const roundsByTournament = new Map();
            for (const r of pageRaceRounds) {
                const key = r.tournamentId?.toString();
                if (!key) continue;
                if (!roundsByTournament.has(key)) roundsByTournament.set(key, []);
                roundsByTournament.get(key).push(r);
            }

            // ── 6. Assemble items ─────────────────────────────────────────────
            const items = tournaments.map(t => {
                const tRounds = (roundsByTournament.get(t._id.toString()) || []).map(r => {
                    const raceType = eligibilityMap.get(r.eligibilityRuleId?.toString()) || null;
                    const registrations = (regsByRound.get(r._id.toString()) || []).map(reg => {
                        const regInvitations = invitationsByReg.get(reg._id.toString()) || [];
                        return {
                            ...reg,
                            Horse: regInvitations[0]?.horseId || null,
                            Invitations: regInvitations,
                            Owner: ownerMap.get(reg.horseOwnerId?.toString()) || null,
                            RaceResult: raceResultMap.get(reg._id.toString()) || null,
                        };
                    });
                    return {
                        ...r,
                        RaceType: raceType,
                        RaceReferee: assignmentMap.get(r._id.toString()) || null,
                        Registration: registrations,
                    };
                });
                return { ...t, RaceRound: tRounds };
            });

            return {
                code: 200,
                data: { items, pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit } },
                msg: 'Referee tournaments retrieved successfully',
            };
        } catch (error) {
            console.error('Error fetching referee tournaments:', error);
            return { code: 500, msg: error.message };
        }
    }

    // Lightweight { _id, tournamentName } list for this referee's own tournaments — same
    // distinct-tournamentIds-from-assignments lookup as getRefereeTournaments (lines
    // 900-916 above), but skipping its nested race-round/registration/eligibility-rule
    // population, which callers that only need id+name (e.g. Homepage's filter dropdown
    // and name lookup) don't use. Mirrors AdminService.getTournamentNames.
    async getTournamentNames(refereeId) {
        try {
            const assignments = await RaceReferee.find({ refereeId }).lean();
            if (!assignments.length) {
                return { code: 200, data: [], msg: 'No tournaments found.' };
            }

            const raceRoundIds = assignments.map(a => a.raceRoundId);
            const roundsForTournaments = await RaceRound.find({ _id: { $in: raceRoundIds } }, 'tournamentId').lean();
            const allTournamentIds = [...new Set(
                roundsForTournaments.map(r => r.tournamentId?.toString()).filter(Boolean)
            )];

            const tournaments = await Tournament.find({ _id: { $in: allTournamentIds } }, 'tournamentName').lean();

            return {
                code: 200,
                data: tournaments.map(t => ({ _id: t._id, tournamentName: t.tournamentName })),
                msg: 'Tournament names retrieved successfully',
            };
        } catch (error) {
            console.error('Error fetching referee tournament names:', error);
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new TournamentService();
