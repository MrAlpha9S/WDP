const RaceRoundRepository = require('../repositories/RaceRoundRepository');
const RaceRefereeRepository = require('../repositories/RaceRefereeRepository');
const TournamentRepository = require('../repositories/TournamentRepository');
const HorseOwnerRepository = require('../repositories/HorseOwnerRepository');
const RegistrationRepository = require('../repositories/RegistrationRepository');
const InvitationRepository = require('../repositories/InvitationRepository');

class RaceRoundService {
    async createRaceRound(payload, adminID) {
        const { TournamentId, RaceRound: raceRoundData, HorseOwnerInvitation = [], RefereeInvitation = [] } = payload;

        // Safely extract a plain string/ObjectId from a value that might be a populated object
        const toId = (v) => (v && typeof v === 'object') ? (v._id ?? v) : v;



        raceRoundData.tournamentId = TournamentId;
        raceRoundData.createdByAdminId = adminID;

        // create race round
        const raceRound = await RaceRoundRepository.create(raceRoundData);

        // create race-referee link
        const raceReferees = [];
        for (const refereeId of RefereeInvitation) {
            try {
                const raceReferee = await RaceRefereeRepository.create({
                    raceRoundId: raceRound._id,
                    refereeId: toId(refereeId),
                    assignedAt: new Date(),
                    assignedByAdminId: adminID,
                    status: 'pending',
                });
                raceReferees.push(raceReferee);
            } catch (e) {
                console.error('[createRaceRound] Referee assignment failed for', refereeId, ':', e.message);
            }
        }

        // gather horse owner profiles and create registrations
        const registrations = [];
        for (const ownerId of HorseOwnerInvitation) {
            try {
                const resolvedId = toId(ownerId);
                const reg = await RegistrationRepository.createRegistration({
                    raceRoundId: raceRound._id,
                    horseOwnerId: resolvedId,
                    approvedByAdminId: adminID,
                    registrationStatus: 'pending',
                });
                registrations.push(reg);
            } catch (e) {
                console.error('[createRaceRound] Registration failed for owner', ownerId, ':', e.message);
            }
        }

        // fetch tournament entity
        let tournament = null;
        try {
            tournament = await TournamentRepository.getTournamentById(TournamentId);
        } catch (e) {
            tournament = null;
        }

        return {
            code: 201,
            message: 'Race round created successfully',
            data: {
                tournament,
                raceRound,
                registrations,
                raceReferees,
            },
        };
    }
    async getRaceRoundsByTournamentId(tournamentId) {
        const tournament = await TournamentRepository.findById(tournamentId);
        if (!tournament) {
            return { code: 404, message: 'Tournament not found' };
        }
        const raceRounds = await RaceRoundRepository.findByTournamentId(tournamentId);
        return { code: 200, message: 'Race rounds retrieved successfully', data: raceRounds };
    }
    async getRaceRoundById(id) {
        const raceRound = await RaceRoundRepository.findById(id);
        if (!raceRound) {
            return { code: 404, message: 'Race round not found' };
        }
        return { code: 200, message: 'Race round retrieved successfully', data: raceRound };
    }
    async getAllRaceRounds(page, limit) {
        const raceRounds = await RaceRoundRepository.findAll(page, limit);
        return { code: 200, message: 'Race rounds retrieved successfully', data: raceRounds };
    }
    async updateRaceRound(id, updateData) {
        const updatedRaceRound = await RaceRoundRepository.update(id, updateData);
        if (!updatedRaceRound) {
            return { code: 404, message: 'Race round not found' };
        }
        return { code: 200, message: 'Race round updated successfully', data: updatedRaceRound };
    }
    async deleteRaceRound(id) {
        const deletedRaceRound = await RaceRoundRepository.delete(id);
        if (!deletedRaceRound) {
            return { code: 404, message: 'Race round not found' };
        }
        return { code: 200, message: 'Race round deleted successfully', data: deletedRaceRound };
    }
    async getRaceRoundsByStatus(status) {
        const raceRounds = await RaceRoundRepository.findByStatus(status);
        return { code: 200, message: 'Race rounds retrieved successfully', data: raceRounds };
    }

    async cancelRaceRound(id) {
        const raceRound = await RaceRoundRepository.findById(id);
        if (!raceRound) {
            return { code: 404, message: 'Race round not found' };
        }
        
        if (raceRound.status === 'completed' || raceRound.status === 'running') {
            return { code: 400, message: `Cannot cancel a race round that is already ${raceRound.status}` };
        }

        if (raceRound.status === 'cancelled') {
            return { code: 400, message: 'Race round is already cancelled' };
        }
        
        // Update race round
        const updatedRaceRound = await RaceRoundRepository.update(id, { status: 'cancelled' });
        
        // Update referees
        await RaceRefereeRepository.updateManyByRaceRoundId(id, { status: 'cancelled' });
        
        // Find registrations to get their IDs
        const registrations = await RegistrationRepository.findByRaceRoundId(id);
        const registrationIds = registrations.map(reg => reg._id);
        
        // Update registrations
        if (registrationIds.length > 0) {
            await RegistrationRepository.updateManyByRaceRoundId(id, { registrationStatus: 'cancelled' });
            
            // Update invitations linked to these registrations
            await InvitationRepository.updateManyByRegistrationIds(registrationIds, { invitationStatus: 'cancelled' });
        }
        
        return { code: 200, message: 'Race round cancelled successfully', data: updatedRaceRound };
    }

}
module.exports = new RaceRoundService();