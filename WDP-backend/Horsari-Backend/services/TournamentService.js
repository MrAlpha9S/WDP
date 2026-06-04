const tournamentRepository = require('../repositories/TournamentRepository');

class TournamentService {
    async createTournament(tournamentData) {
        try {
            const { createdByAdminId, tournamentName, description, startDate, endDate } = tournamentData;
            if (!createdByAdminId || !tournamentName || !description) {
                return { code: 400, msg: 'createdByAdminId, tournamentName, and description are required' };
            }
            if (!startDate || !endDate) {
                return { code: 400, msg: 'startDate and endDate are required' };
            }
            if (new Date(startDate) >= new Date(endDate)) {
                return { code: 400, msg: 'startDate must be before endDate' };
            }

            const tournament = await tournamentRepository.createTournament(tournamentData);
            return { code: 201, data: tournament, msg: 'Tournament created successfully' };
        }
        catch (error) {
            console.error('Error creating tournament:', error);
            return { code: 500, msg: 'Internal server error' };
        }
    }
    async getTournaments(keywords, page = 1, limit = 10) {
        try {
            const tournaments = await tournamentRepository.getTournaments(keywords, page, limit);
            return { code: 200, data: tournaments, msg: 'Tournaments retrieved successfully' };
        } catch (error) {
            console.error('Error retrieving tournaments:', error);
            return { code: 500, msg: 'Internal server error' };
        }

    }
    async getTournamentById(id) {
        try {
            const tournament = await tournamentRepository.getTournamentById(id);
            if (!tournament) {
                return { code: 404, msg: 'Tournament not found' };
            }
            return { code: 200, data: tournament, msg: 'Tournament retrieved successfully' };
        } catch (error) {
            console.error('Error retrieving tournament:', error);
            return { code: 500, msg: 'Internal server error' };
        }
    }
    async updateTournament(id, updateData) {
        try {

            const tournament = await tournamentRepository.getTournamentById(id);
            if (!tournament) {
                return { code: 404, msg: 'Tournament not found' };
            }
            return { code: 200, data: await tournamentRepository.updateTournament(id, updateData), msg: 'Tournament updated successfully' };
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