const RaceRoundRepository = require('../repositories/RaceRoundRepository');
const RaceRefereeRepository = require('../repositories/RaceRefereeRepository');
const TournamentRepository = require('../repositories/TournamentRepository');
const HorseOwnerRepository = require('../repositories/HorseOwnerRepository');
const RegistrationRepository = require('../repositories/RegistrationRepository');

class RaceRoundService {
    async createRaceRound(payload, adminID) {
        const { TournamentId, RaceRound: raceRoundData, HorseOwnerInvitation = [], RefereeInvitation = [] } = payload;
        
        raceRoundData.tournamentId = TournamentId;
        raceRoundData.createdByAdminId = adminID;

        // create race round
        const raceRound = await RaceRoundRepository.create(raceRoundData);

        // create race-referee link
        const raceReferees = [];
        for (const refereeId of RefereeInvitation) {
            const raceReferee = await RaceRefereeRepository.create({
                raceRoundId: raceRound._id,
                refereeId: refereeId,
                assignedAt: new Date(),
                assignedByAdminId: adminID,
                status: 'pending',
            });
            raceReferees.push(raceReferee);
        }

        // gather horse owner profiles and create registrations
        const registrations = [];
        for (const ownerId of HorseOwnerInvitation) {
            try {
                // create registration for this horse owner for the new raceRound
                const reg = await RegistrationRepository.createRegistration({
                    raceRoundId: raceRound._id,
                    horseOwnerId: ownerId,
                    approvedByAdminId: adminID,
                    registrationStatus: 'pending',
                });
                registrations.push(reg);
            } catch (e) {
                // ignore individual failures
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



}
module.exports = new RaceRoundService();