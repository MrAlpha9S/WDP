const RaceRoundRepository = require('../repositories/RaceRoundRepository');
const RaceRefereeRepository = require('../repositories/RaceRefereeRepository');
const TournamentRepository = require('../repositories/TournamentRepository');
const HorseOwnerRepository = require('../repositories/HorseOwnerRepository');
const RegistrationRepository = require('../repositories/RegistrationRepository');

class RaceRoundService {
    async createRaceRound(raceRoundData, refereeID, listOwnerIDs = [],adminID) {
        // create race round
        const raceRound = await RaceRoundRepository.create(raceRoundData);

        // create race-referee link if refereeID provided
        let raceReferee = null;
        if (refereeID) {
            raceReferee = await RaceRefereeRepository.create({
                raceRoundId: raceRound._id,
                refereeId: refereeID,
                assigned_at: new Date(),
                status: 'assigned',
            });
        }

        // gather horse owner profiles and create registrations
        const horseOwners = [];
        const registrations = [];
        for (const ownerId of Array.isArray(listOwnerIDs) ? listOwnerIDs : [listOwnerIDs]) {
            try {
                const ho = await HorseOwnerRepository.findByOwnerId(ownerId);
                if (ho) {
                    horseOwners.push({
                        id: ho._id,
                        name: ho._id?.fullName || ho._id?.username || null,
                        profile: ho,
                    });

                    // create registration for this horse owner for the new raceRound
                    const reg = await RegistrationRepository.createRegistration({
                        raceRoundId: raceRound._id,
                        horseOwnerId: ho._id,
                        approved_by_adminId: adminID,
                        registration_status: 'pending',
                    });
                    registrations.push(reg);
                }
            } catch (e) {
                // ignore individual failures
            }
        }

        // fetch tournament entity
        let tournament = null;
        try {
            tournament = await TournamentRepository.getTournamentById(raceRound.tournamentId);
        } catch (e) {
            tournament = null;
        }

        return {
            code: 201,
            message: 'Race round created successfully',
            data: {
                tournament,
                raceRound,
                horseOwners,
                registrations,
                raceReferee,
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