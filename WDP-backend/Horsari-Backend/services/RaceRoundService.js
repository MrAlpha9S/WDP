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

        // Prevent scheduling race rounds too close to each other on the same day/location
        const newRaceDate = new Date(raceRoundData.raceDate);
        if (raceRoundData.location && !isNaN(newRaceDate.getTime())) {
            const startOfDay = new Date(newRaceDate);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(newRaceDate);
            endOfDay.setHours(23, 59, 59, 999);

            const existingRaces = await RaceRoundRepository.findActiveRoundsByLocationAndDateRange(
                raceRoundData.location,
                startOfDay,
                endOfDay
            );

            const NINETY_MINUTES_MS = 90 * 60 * 1000;
            for (const existingRace of existingRaces) {
                const diffMs = Math.abs(newRaceDate.getTime() - new Date(existingRace.raceDate).getTime());
                if (diffMs < NINETY_MINUTES_MS) {
                    return {
                        code: 400,
                        message: "A race at this location is already scheduled within 1.5 hours of the requested time."
                    };
                }
            }
        }

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
    async updateRaceRound(id, payload, adminID) {
        const { TournamentId, RaceRound: updateData, HorseOwnerInvitation, RefereeInvitation } = payload;
        const toId = (v) => (v && typeof v === 'object') ? (v._id ?? v).toString() : (v ? v.toString() : v);

        const existingRaceRound = await RaceRoundRepository.findById(id);
        if (!existingRaceRound) {
            return { code: 404, message: 'Race round not found' };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
        const twoWeeksFromToday = new Date(today.getTime() + TWO_WEEKS_MS);

        // Rule 2: Cannot reschedule to < 14 days from today
        if (updateData && updateData.raceDate) {
            const newDate = new Date(updateData.raceDate);
            if (!isNaN(newDate.getTime()) && newDate < twoWeeksFromToday && 
                newDate.getTime() !== new Date(existingRaceRound.raceDate).getTime()) {
                return { code: 400, message: 'Date cannot be rescheduled to be less than 2 weeks from today.' };
            }
        }

        // Determine effective date for Rule 4
        const effectiveDate = (updateData && updateData.raceDate) ? new Date(updateData.raceDate) : new Date(existingRaceRound.raceDate);

        // Rule 1: Time collision validation
        if (updateData && (updateData.raceDate || updateData.location)) {
            const checkLocation = updateData.location || existingRaceRound.location;
            if (checkLocation && !isNaN(effectiveDate.getTime())) {
                const startOfDay = new Date(effectiveDate);
                startOfDay.setHours(0, 0, 0, 0);

                const endOfDay = new Date(effectiveDate);
                endOfDay.setHours(23, 59, 59, 999);

                const existingRaces = await RaceRoundRepository.findActiveRoundsByLocationAndDateRange(
                    checkLocation,
                    startOfDay,
                    endOfDay
                );

                const NINETY_MINUTES_MS = 90 * 60 * 1000;
                for (const existingRace of existingRaces) {
                    if (existingRace._id.toString() !== id.toString()) {
                        const diffMs = Math.abs(effectiveDate.getTime() - new Date(existingRace.raceDate).getTime());
                        if (diffMs < NINETY_MINUTES_MS) {
                            return {
                                code: 400,
                                message: "A race at this location is already scheduled within 1.5 hours of the requested time."
                            };
                        }
                    }
                }
            }
        }

        // Fetch existing lists
        const existingRegistrations = await RegistrationRepository.findByRaceRoundId(id);
        const existingReferees = await RaceRefereeRepository.findByRaceRoundId(id);

        // Filter out cancelled to know the current active state
        const activeRegistrations = existingRegistrations.filter(r => r.registrationStatus !== 'cancelled');

        // Rule 4: Cannot unselect or select more horseOwners if race < 2 weeks away
        if (HorseOwnerInvitation) {
            if (!isNaN(effectiveDate.getTime()) && effectiveDate < twoWeeksFromToday) {
                const existingActiveOwnerIds = activeRegistrations.map(r => r.horseOwnerId.toString()).sort();
                const newOwnerIds = HorseOwnerInvitation.map(toId).sort();
                
                if (existingActiveOwnerIds.length !== newOwnerIds.length || 
                    !existingActiveOwnerIds.every((val, index) => val === newOwnerIds[index])) {
                    return { 
                        code: 400, 
                        message: 'Cannot unselect or select more horse owners when the race is less than 2 weeks away.' 
                    };
                }
            }
        }

        let raceReferees = existingReferees;
        let registrations = existingRegistrations;

        if (updateData) {
            if (TournamentId) updateData.tournamentId = TournamentId;
            await RaceRoundRepository.update(id, updateData);
        }

        // Rule 3: Process HorseOwnerInvitation
        if (HorseOwnerInvitation) {
            const newOwnerIds = new Set(HorseOwnerInvitation.map(toId));
            
            // Cancel removed ones
            for (const reg of existingRegistrations) {
                const regOwnerIdStr = reg.horseOwnerId.toString();
                if (!newOwnerIds.has(regOwnerIdStr) && reg.registrationStatus !== 'cancelled') {
                    await RegistrationRepository.updateRegistration(reg._id, { registrationStatus: 'cancelled' });
                    await InvitationRepository.updateManyByRegistrationIds([reg._id], { invitationStatus: 'cancelled' });
                }
            }

            // Create or Reactivate
            const existingRegMap = new Map();
            for (const reg of existingRegistrations) {
                existingRegMap.set(reg.horseOwnerId.toString(), reg);
            }

            registrations = [];
            for (const ownerId of HorseOwnerInvitation) {
                try {
                    const resolvedId = toId(ownerId);
                    const existingReg = existingRegMap.get(resolvedId);

                    if (existingReg) {
                        if (existingReg.registrationStatus === 'cancelled') {
                            const updatedReg = await RegistrationRepository.updateRegistration(existingReg._id, { registrationStatus: 'pending' });
                            registrations.push(updatedReg);
                        } else {
                            registrations.push(existingReg);
                        }
                    } else {
                        const newReg = await RegistrationRepository.createRegistration({
                            raceRoundId: id,
                            horseOwnerId: resolvedId,
                            approvedByAdminId: adminID,
                            registrationStatus: 'pending',
                        });
                        registrations.push(newReg);
                    }
                } catch (e) {
                    console.error('[updateRaceRound] Registration update failed for owner', ownerId, ':', e.message);
                }
            }
        }

        // Process RefereeInvitation
        if (RefereeInvitation) {
            const newRefereeIds = new Set(RefereeInvitation.map(toId));
            
            for (const ref of existingReferees) {
                const refIdStr = ref.refereeId.toString();
                if (!newRefereeIds.has(refIdStr) && ref.status !== 'cancelled') {
                    await RaceRefereeRepository.update(ref._id, { status: 'cancelled' });
                }
            }

            const existingRefMap = new Map();
            for (const ref of existingReferees) {
                existingRefMap.set(ref.refereeId.toString(), ref);
            }

            raceReferees = [];
            for (const refereeId of RefereeInvitation) {
                try {
                    const resolvedId = toId(refereeId);
                    const existingRef = existingRefMap.get(resolvedId);

                    if (existingRef) {
                        if (existingRef.status === 'cancelled') {
                            const updatedRef = await RaceRefereeRepository.update(existingRef._id, { status: 'pending' });
                            raceReferees.push(updatedRef);
                        } else {
                            raceReferees.push(existingRef);
                        }
                    } else {
                        const newRef = await RaceRefereeRepository.create({
                            raceRoundId: id,
                            refereeId: resolvedId,
                            assignedAt: new Date(),
                            assignedByAdminId: adminID,
                            status: 'pending',
                        });
                        raceReferees.push(newRef);
                    }
                } catch (e) {
                    console.error('[updateRaceRound] Referee update failed for', refereeId, ':', e.message);
                }
            }
        }

        const raceRound = await RaceRoundRepository.findById(id);
        
        let tournament = null;
        try {
            tournament = await TournamentRepository.getTournamentById(raceRound.tournamentId || TournamentId);
        } catch (e) {
            tournament = null;
        }

        return {
            code: 200,
            message: 'Race round updated successfully',
            data: {
                tournament,
                raceRound,
                registrations,
                raceReferees,
            },
        };
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