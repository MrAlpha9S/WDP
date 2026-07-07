const tournamentRepository = require('../repositories/TournamentRepository');
const { broadcastAdminEvent } = require('./AdminEventBroadcaster');

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
    async updateTournament(id, updateData, io) {
        try {
            const tournament = await tournamentRepository.getTournamentById(id);
            if (!tournament) {
                return { code: 404, msg: 'Tournament not found' };
            }
            const updated = await tournamentRepository.updateTournament(id, updateData);

            // Emit real-time event if status changed
            if (io && updateData.status && updateData.status !== tournament.status) {
                io.emit('tournament:status_changed', {
                    tournamentId: String(id),
                    status: updateData.status,
                });
                if (updateData.status === 'ongoing') {
                    await broadcastAdminEvent(
                        io,
                        'system_alert',
                        'Tournament Started',
                        `"${tournament.tournamentName}" has been moved to Ongoing.`
                    );
                }
            }

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