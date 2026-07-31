const tournamentRepository = require('../repositories/TournamentRepository');

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