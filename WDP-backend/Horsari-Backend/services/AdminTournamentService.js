const TournamentRepository = require('../repositories/TournamentRepository');
const RaceRoundRepository = require('../repositories/RaceRoundRepository');
const PayoutService = require('./PayoutService');

class TournamentService {
    // Get tournaments enriched with race rounds and total prediction reward pool
    async getTournamentsWithDetails(page = 1, limit = 5, startDate, endDate, search) {
        try {
            const Tournament = require('../entities/Tournament');
            const RaceRound = require('../entities/RaceRound');
            const Registration = require('../entities/Registration');
            const Prediction = require('../entities/Prediction');

            // Two mutually exclusive fetch modes: a plain page/limit fetch
            // (table view), or a date-range fetch (calendar view) that
            // returns every matching tournament unpaginated — a month can't
            // be split across pages without breaking the calendar grid.
            // Date filtering only ever engages when BOTH bounds are given —
            // a lone startDate/endDate is ignored rather than partially
            // filtering (the controller already rejects that combo as a 400).
            const isDateRangeQuery = Boolean(startDate && endDate);

            // Overlap filter: include tournaments whose date span overlaps the
            // requested range, so a tournament spanning across a month
            // boundary still shows up on that month's calendar.
            const filter = { tournamentName: { $ne: 'Non-tournament' } };
            if (isDateRangeQuery) {
                filter.endDate = { $gte: new Date(startDate) };
                filter.startDate = { $lte: new Date(endDate) };
            }
            if (search) filter.tournamentName = { $regex: search, $options: 'i' };

            let tournamentQuery = Tournament.find(filter).sort({ createdAt: -1 });
            if (!isDateRangeQuery) {
                const skip = (page - 1) * limit;
                tournamentQuery = tournamentQuery.skip(skip).limit(limit);
            }

            const tournaments = await tournamentQuery.lean();

            const totalItems = await Tournament.countDocuments(filter);
            const totalPages = isDateRangeQuery ? 1 : Math.ceil(totalItems / limit);
            const currentPage = isDateRangeQuery ? 1 : page;
            const responseLimit = isDateRangeQuery ? totalItems : limit;

            const items = await Promise.all(
                tournaments.map(async (tournament) => {
                    // Fetch RaceRounds
                    const raceRounds = await RaceRound.find({ tournamentId: tournament._id }).lean();
                    const raceRoundIds = raceRounds.map(rr => rr._id);

                    // Fetch Registrations for these RaceRounds
                    const registrations = await Registration.find({ raceRoundId: { $in: raceRoundIds } }).lean();
                    const registrationIds = registrations.map(reg => reg._id);

                    // Fetch Predictions to calculate the total reward pool
                    const predictions = await Prediction.find({ registrationId: { $in: registrationIds } }).lean();

                    // Sum rewardPoints
                    const priceTotalPool = predictions.reduce((sum, pred) => sum + (pred.rewardPoints || 0), 0);

                    return {
                        tournament: tournament,
                        priceTotalPool: priceTotalPool,
                        raceRound: raceRounds
                    };
                })
            );

            return {
                code: 200,
                data: {
                    items,
                    pagination: {
                        totalItems,
                        totalPages,
                        currentPage,
                        limit: responseLimit,
                    },
                },
                msg: 'Tournaments retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Get tournament counts by status (live/upcoming/completed) — true totals
    // across every tournament, unaffected by the pagination/search above.
    async getTournamentStats() {
        try {
            const Tournament = require('../entities/Tournament');
            const baseFilter = { tournamentName: { $ne: 'Non-tournament' } };

            const [live, upcoming, completed] = await Promise.all([
                Tournament.countDocuments({ ...baseFilter, status: 'ongoing' }),
                Tournament.countDocuments({ ...baseFilter, status: 'scheduled' }),
                Tournament.countDocuments({ ...baseFilter, status: 'completed' }),
            ]);

            return {
                code: 200,
                data: { live, upcoming, completed },
                msg: 'Tournament stats retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Lightweight { _id, tournamentName } list for EVERY tournament — deliberately does NOT
    // exclude the "Non-tournament" placeholder the way getTournamentsWithDetails/
    // getTournamentStats do (that exclusion is right for the tournament CRUD list/stats, but
    // wrong for resolving a race round's tournament name, where a standalone race's
    // tournamentId legitimately points at "Non-tournament" and should be labeled as such
    // instead of falling back to "Unknown Tournament").
    async getTournamentNames() {
        try {
            const Tournament = require('../entities/Tournament');
            const tournaments = await Tournament.find({}, 'tournamentName').lean();
            return {
                code: 200,
                data: tournaments.map(t => ({ _id: t._id, tournamentName: t.tournamentName })),
                msg: 'Tournament names retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async updateTournamentStats(tournament_id, status, io) {
        try {
            const tournament = await TournamentRepository.getTournamentById(tournament_id);
            if (!tournament) return { code: 404, msg: 'Tournament not found' };
            const raceRounds = await RaceRoundRepository.findByTournamentId(tournament_id);

            switch (status) {
                case 'completed': {
                    // A cancelled round is closed out, not "still ongoing" — only
                    // block completion on rounds that are neither completed nor cancelled.
                    const stillActive = raceRounds.some(rr => rr.status !== 'completed' && rr.status !== 'cancelled');
                    if (stillActive) {
                        return { code: 400, msg: 'All race rounds must be completed or cancelled before the tournament can be marked completed.' };
                    }
                    tournament.status = 'completed';
                    await tournament.save();
                    break;
                }
                case 'cancelled': {
                    // Cascade-cancel every round that isn't already finished, reusing
                    // the single-round cancel flow (referees/registrations/invitations
                    // cancelled, pending predictions refunded, notifications sent).
                    // Rounds that are 'running' or 'awaitingConfirmation' are left as-is —
                    // cancelRaceRound refuses those by design, and that's intentional here too.
                    const RaceRoundService = require('./RaceRoundService');
                    for (const rr of raceRounds) {
                        if (rr.status === 'completed' || rr.status === 'cancelled') continue;
                        const result = await RaceRoundService.cancelRaceRound(rr._id, io);
                        if (result.code !== 200) {
                            console.error(`[updateTournamentStats] could not cancel race round ${rr._id} (${rr.status}): ${result.message}`);
                        }
                    }
                    tournament.status = 'cancelled';
                    await tournament.save();
                    break;
                }
                case 'ongoing':
                    tournament.status = 'ongoing';
                    await tournament.save();
                    break;
                case 'scheduled':
                    if (tournament.status !== 'draft') {
                        return { code: 400, msg: `Tournament has already been ${tournament.status}` };
                    }
                    tournament.status = 'scheduled';
                    await tournament.save();
                    break;
                default:
                    return { code: 400, msg: 'Invalid status' };
            }

            if (io) {
                io.emit('tournament:status_changed', { tournamentId: String(tournament_id), status: tournament.status });
            }
            return { code: 200, msg: `Tournament ${status} successfully` };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Settle tournament_champion predictions after admin sets the champion horse.
    async settleTournamentPredictions(tournamentId, championHorseId) {
        try {
            const Tournament = require('../entities/Tournament');
            const Prediction = require('../entities/Prediction');
            const Spectator = require('../entities/Spectator');
            const Horse = require('../entities/Horse');

            const tournament = await Tournament.findById(tournamentId).lean();
            if (!tournament) return { code: 404, msg: 'Tournament not found' };

            const horse = await Horse.findById(championHorseId).lean();
            if (!horse) return { code: 404, msg: 'Champion horse not found' };

            await Tournament.findByIdAndUpdate(tournamentId, { championHorseId });

            const result = await PayoutService.distributeTournamentPayouts(tournamentId, championHorseId);

            return {
                code: 200,
                data: result.data,
                msg: `Tournament champion set and predictions settled`,
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Get single tournament with its race rounds and auto-complete if end date passed.
    async getTournamentDetail(tournamentId) {
        try {
            const Tournament = require('../entities/Tournament');
            const RaceRound = require('../entities/RaceRound');
            const Registration = require('../entities/Registration');
            const Horse = require('../entities/Horse');

            let tournament = await Tournament.findById(tournamentId).lean();
            if (!tournament) return { code: 404, msg: 'Tournament not found' };

            // Auto-complete: if endDate has passed and tournament is still 'ongoing'
            const now = new Date();
            if (tournament.endDate && new Date(tournament.endDate) <= now && tournament.status === 'ongoing') {
                const rankResult = await this.getTournamentRanking(tournamentId);
                if (rankResult.code === 200 && rankResult.data.length > 0) {
                    const topHorseId = rankResult.data[0].horseId;
                    await Tournament.findByIdAndUpdate(tournamentId, { status: 'completed' });
                    await this.settleTournamentPredictions(tournamentId, topHorseId);
                    tournament = await Tournament.findById(tournamentId).lean();
                }
            }

            const raceRounds = await RaceRound.find({ tournamentId }).sort({ raceDate: 1 }).lean();

            const raceRoundsWithCount = await Promise.all(
                raceRounds.map(async (rr) => {
                    const participantCount = await Registration.countDocuments({
                        raceRoundId: rr._id,
                        registrationStatus: { $in: ['accepted', 'verified'] },
                    });
                    return { ...rr, participantCount };
                })
            );

            let championHorseName = null;
            if (tournament.championHorseId) {
                const champ = await Horse.findById(tournament.championHorseId, 'horseName').lean();
                championHorseName = champ?.horseName ?? null;
            }

            return {
                code: 200,
                data: {
                    tournament: { ...tournament, championHorseName },
                    raceRounds: raceRoundsWithCount,
                },
                msg: 'Tournament detail retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Aggregate official race results across all rounds of a tournament and rank horses by score.
    // roundBreakdown covers every tournament round — type:'result'|'no_result'|'not_registered'.
    async getTournamentRanking(tournamentId) {
        try {
            const RaceRound = require('../entities/RaceRound');
            const Registration = require('../entities/Registration');
            const RaceResult = require('../entities/RaceResult');
            const Horse = require('../entities/Horse');
            const User = require('../entities/User');

            const SCORE_MAP = { 1: 60, 2: 40, 3: 30, 4: 20 };
            const calcScore = (pos) => SCORE_MAP[pos] ?? 10;

            // Sort by date so roundBreakdown columns are in chronological order
            const raceRounds = await RaceRound.find({ tournamentId }).sort({ raceDate: 1 }).lean();
            if (!raceRounds.length) return { code: 200, data: [], msg: 'No race rounds in this tournament' };

            const roundIds = raceRounds.map(r => r._id);

            // All registrations across all rounds
            const registrations = await Registration.find({ raceRoundId: { $in: roundIds } }).lean();
            const regById = Object.fromEntries(registrations.map(r => [r._id.toString(), r]));
            const regIds = registrations.map(r => r._id);

            // horseRoundReg[horseId][roundId] = registration
            const horseRoundReg = {};
            for (const reg of registrations) {
                if (!reg.horseId) continue;
                const hk = reg.horseId.toString();
                const rk = reg.raceRoundId.toString();
                if (!horseRoundReg[hk]) horseRoundReg[hk] = {};
                horseRoundReg[hk][rk] = reg;
            }

            // Official results only
            const results = await RaceResult.find({
                registrationId: { $in: regIds },
                resultStatus: 'official',
            }).lean();
            const resultByRegId = Object.fromEntries(results.map(r => [r.registrationId.toString(), r]));

            // Accumulate score/wins/podiums from official results
            const horseStats = {};
            for (const result of results) {
                const reg = regById[result.registrationId.toString()];
                if (!reg?.horseId) continue;
                const key = reg.horseId.toString();
                if (!horseStats[key]) {
                    horseStats[key] = {
                        horseId: reg.horseId, ownerId: reg.horseOwnerId,
                        score: 0, totalRaces: 0, wins: 0, podiums: 0, totalPrizeMoney: 0,
                    };
                }
                const s = horseStats[key];
                const pos = result.finishPosition;
                s.score += calcScore(pos);
                s.totalRaces += 1;
                if (pos === 1) s.wins += 1;
                if (pos <= 3) s.podiums += 1;
                s.totalPrizeMoney += result.prizeMoney || 0;
            }

            // Also surface horses that only have registrations (score stays 0)
            for (const reg of registrations) {
                if (!reg.horseId) continue;
                const key = reg.horseId.toString();
                if (!horseStats[key]) {
                    horseStats[key] = {
                        horseId: reg.horseId, ownerId: reg.horseOwnerId,
                        score: 0, totalRaces: 0, wins: 0, podiums: 0, totalPrizeMoney: 0,
                    };
                }
            }

            const entries = Object.values(horseStats);
            if (!entries.length) return { code: 200, data: [], msg: 'No registered horses yet' };

            // Batch-fetch names (HorseOwner._id === User._id, so query User directly)
            const horseIds = [...new Set(entries.map(e => e.horseId.toString()))];
            const ownerIds = [...new Set(entries.map(e => e.ownerId?.toString()).filter(Boolean))];
            const [horses, owners] = await Promise.all([
                Horse.find({ _id: { $in: horseIds } }, 'horseName img').lean(),
                User.find({ _id: { $in: ownerIds } }, 'fullName').lean(),
            ]);
            const horseNameMap = Object.fromEntries(horses.map(h => [h._id.toString(), h]));
            const ownerNameMap = Object.fromEntries(owners.map(u => [u._id.toString(), u.fullName]));

            // Sort: score desc, wins desc, totalPrizeMoney desc
            entries.sort((a, b) =>
                b.score - a.score ||
                b.wins - a.wins ||
                b.totalPrizeMoney - a.totalPrizeMoney
            );

            // Assign ranks (equal score = equal rank)
            let rank = 1;
            const ranked = entries.map((e, i) => {
                if (i > 0 && e.score < entries[i - 1].score) rank = i + 1;
                const horseKey = e.horseId.toString();
                const h = horseNameMap[horseKey] ?? {};

                // One breakdown entry per tournament round, in chronological order
                const roundBreakdown = raceRounds.map(rr => {
                    const roundKey = rr._id.toString();
                    const reg = horseRoundReg[horseKey]?.[roundKey];
                    if (!reg) {
                        return { roundId: rr._id, roundName: rr.roundName, raceDate: rr.raceDate, roundStatus: rr.status, type: 'not_registered' };
                    }
                    const result = resultByRegId[reg._id.toString()];
                    if (result) {
                        return { roundId: rr._id, roundName: rr.roundName, raceDate: rr.raceDate, roundStatus: rr.status, type: 'result', finishPosition: result.finishPosition, prizeMoney: result.prizeMoney || 0 };
                    }
                    return { roundId: rr._id, roundName: rr.roundName, raceDate: rr.raceDate, roundStatus: rr.status, type: 'no_result', registrationStatus: reg.registrationStatus };
                });

                return {
                    rank,
                    horseId: e.horseId,
                    horseName: h.horseName ?? 'Unknown',
                    horseImg: h.img ?? null,
                    ownerId: e.ownerId,
                    ownerName: ownerNameMap[e.ownerId?.toString()] ?? 'Unknown',
                    score: e.score,
                    totalRaces: e.totalRaces,
                    wins: e.wins,
                    podiums: e.podiums,
                    totalPrizeMoney: e.totalPrizeMoney,
                    roundBreakdown,
                };
            });

            return { code: 200, data: ranked, msg: 'Ranking retrieved successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new TournamentService();
