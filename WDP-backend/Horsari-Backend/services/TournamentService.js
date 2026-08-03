const tournamentRepository = require('../repositories/TournamentRepository');
const raceRoundRepository = require('../repositories/RaceRoundRepository');

class TournamentService {
    async createTournament(tournamentData) {
        try {
            const { createdByAdminId, tournamentName, description, startDate, endDate } = tournamentData;
            if (!createdByAdminId || !tournamentName || !description) {
                return { code: 400, msg: 'createdByAdminId, tournamentName, and description are required' };
            }

            // Normalize to UTC midnight of today so it lines up with how a date-only
            // string like "2026-07-30" parses (also UTC midnight) — otherwise today's
            // own date always registers as "before currentDate".
            const now = new Date();
            const currentDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            // +14 days, not +13 — with the strict "<" check below, a +13 offset would let a
            // startDate exactly 13 days out (one day short of 2 weeks) slip through.
            const twoWeekFromNow = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000);

            if (!startDate || !endDate) {
                return { code: 400, msg: 'startDate and endDate are required' };
            }
            if (new Date(startDate) >= new Date(endDate)) {
                return { code: 400, msg: 'startDate must be before endDate' };
            }

            if (new Date(startDate) < currentDate) {
                return { code: 400, msg: 'startDate must not be before currentDate' };
            }

            if (new Date(startDate) < twoWeekFromNow) {
                return { code: 400, msg: 'startDate must be more than 2 weeks from now' };
            }

            const tournament = await tournamentRepository.createTournament(tournamentData);
            return { code: 201, data: tournament, msg: 'Tournament created successfully' };
        }
        catch (error) {
            console.error('Error creating tournament:', error);
            return { code: 500, msg: 'Internal server error' };
        }
    }
    async updateTournament(id, updateData, io) {
        try {
            const tournament = await tournamentRepository.getTournamentById(id);
            if (!tournament) {
                return { code: 404, msg: 'Tournament not found' };
            }
            // Status transitions must go through AdminService.updateTournamentStats, which
            // enforces race-round safety guards (blocks completion while rounds are still
            // active, cascades cancellation) — this endpoint never touches status.
            const { status, ...safeUpdateData } = updateData;

            // Changing startDate must still land at least 2 weeks out — same rule createTournament
            // enforces at creation, just not previously re-checked on update. This allows pushing
            // a near-term startDate further out (e.g. extending it to clear the 2-week bar) even
            // while the tournament is currently inside the window; it only blocks landing on — or
            // staying on — a date that's still too soon. endDate has no such rule; it stays free.
            if (safeUpdateData.startDate) {
                const now = new Date();
                const currentDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
                const twoWeekFromNow = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000);
                const existingStart = new Date(tournament.startDate);
                const newStart = new Date(safeUpdateData.startDate);

                if (!isNaN(existingStart.getTime()) && !isNaN(newStart.getTime())
                    && newStart.getTime() !== existingStart.getTime() && newStart < twoWeekFromNow) {
                    return { code: 400, msg: 'Start date must be more than 2 weeks from now.' };
                }
            }

            // Narrowing startDate/endDate can strand existing race rounds outside the new
            // window — block that instead of silently letting a round's raceDate fall outside
            // [startDate, endDate]. Cancelled rounds don't count; they're no longer "in" the
            // tournament. endDate is compared end-of-day since raceDate carries a race start time.
            if (safeUpdateData.startDate || safeUpdateData.endDate) {
                const newStart = safeUpdateData.startDate ? new Date(safeUpdateData.startDate) : new Date(tournament.startDate);
                const newEnd = safeUpdateData.endDate ? new Date(safeUpdateData.endDate) : new Date(tournament.endDate);

                if (!isNaN(newStart.getTime()) && !isNaN(newEnd.getTime())) {
                    const newEndOfDay = new Date(newEnd);
                    newEndOfDay.setHours(23, 59, 59, 999);

                    const raceRounds = await raceRoundRepository.findByTournamentId(id);
                    const conflicting = raceRounds.filter(r => {
                        if (r.status === 'cancelled') return false;
                        const raceDate = new Date(r.raceDate);
                        return raceDate < newStart || raceDate > newEndOfDay;
                    });

                    if (conflicting.length > 0) {
                        const earliest = conflicting.reduce((a, b) => new Date(a.raceDate) < new Date(b.raceDate) ? a : b);
                        return {
                            code: 400,
                            msg: `Cannot update tournament dates: ${conflicting.length} race round(s) would fall outside the new date range (e.g. "${earliest.roundName}" on ${new Date(earliest.raceDate).toLocaleDateString()}). Reschedule or cancel those race rounds first.`
                        };
                    }
                }
            }

            const updated = await tournamentRepository.updateTournament(id, safeUpdateData);

            return { code: 200, data: updated, msg: 'Tournament updated successfully' };
        } catch (error) {
            console.error('Error updating tournament:', error);
            return { code: 500, msg: 'Internal server error' };
        }
    }
    async deleteTournament(id) {
        try {
            const tournament = await tournamentRepository.getTournamentById(id);
            if (!tournament) {
                return { code: 404, msg: 'Tournament not found' };
            }
            return { code: 200, data: await tournamentRepository.deleteTournament(id), msg: 'Tournament deleted successfully' };
        } catch (error) {
            console.error('Error deleting tournament:', error);
            return { code: 500, msg: 'Internal server error' };
        }
    }
}
module.exports = new TournamentService();