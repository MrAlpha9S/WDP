const InvitationRepository = require('../repositories/InvitationRepository');
const RaceRoundRepository = require('../repositories/RaceRoundRepository');
const TournamentRepository = require('../repositories/TournamentRepository');
const Registration = require('../entities/Registration');
const Invitation = require('../entities/Invitation');
/**
 * return {
 * code: 200,
 * message: "Success",
 * data: {}
 * }
 */
class InvitationService {
    async createInvitation(data) {
        const invitation = await InvitationRepository.create(data);
        return {
            code: 201,
            message: "Invitation created successfully",
            data: invitation
        };
    }
    async getInvitationById(id) {
        const invitation = await InvitationRepository.findById(id);
        if (!invitation) {
            return {
                code: 404,
                message: "Invitation not found",
            };
        }
        return {
            code: 200,
            message: "Success",
            data: invitation
        };
    }
    async getInvitationsByJockeyId(jockeyId) {
        const invitations = await InvitationRepository.findByJockeyId(jockeyId);
        return {
            code: 200,
            message: "Success",
            data: invitations
        };
    }
    //jockey confirmation is a boolean field on the invitation that indicates whether the jockey has accepted the invitation or not. This method toggles that status.
    async toggleInvitationStatus(id, newStatus) {
        const invitation = await InvitationRepository.findById(id);
        if (!invitation) {
            return {
                code: 404,
                message: "Invitation not found",
            };
        }
        const updatedInvitation = await InvitationRepository.updateById(id, { jockey_confirmation: newStatus });
        return {
            code: 200,
            message: "Invitation status updated successfully",
            data: updatedInvitation
        };
    }
    async updateInvitation(id, updateData) {
        const invitation = await InvitationRepository.findById(id);
        if (!invitation) {
            return {
                code: 404,
                message: "Invitation not found",
            };
        }
        const updatedInvitation = await InvitationRepository.updateById(id, updateData);
        return {
            code: 200,
            message: "Invitation updated successfully",
            data: updatedInvitation
        };
    }

    async getTournamentsWithRoundsAndInvitations(invitationIds) {
        // accept single id or array
        const ids = Array.isArray(invitationIds) ? invitationIds : [invitationIds];

        // collect tournaments for each invitation
        const tournamentsMap = new Map();

        for (const invId of ids) {
            // find the invitation -> registration -> raceRound -> tournament
            const invitation = await InvitationRepository.findById(invId) || await Invitation.findById(invId);
            if (!invitation) continue;

            // registration may be stored on invitation.registrationId
            const registration = invitation.registrationId ? await Registration.findById(invitation.registrationId) : null;
            const raceRound = registration && registration.raceRoundId ? await RaceRoundRepository.findById(registration.raceRoundId) : null;
            const tournament = raceRound && raceRound.tournamentId ? await TournamentRepository.getTournamentById(raceRound.tournamentId) : null;
            if (!tournament) continue;

            const tId = String(tournament._id);
            if (tournamentsMap.has(tId)) continue; // already processed

            const raceRounds = await RaceRoundRepository.findByTournamentId(tournament._id);

            const roundsWithInvitations = await Promise.all(raceRounds.map(async (rr) => {
                const registrations = await Registration.find({ raceRoundId: rr._id }).lean();
                const registrationIds = registrations.map(r => r._id);
                const invitations = await Invitation.find({ registrationId: { $in: registrationIds } }).lean();
                return {
                    ...rr.toObject ? rr.toObject() : rr,
                    invitations,
                };
            }));

            tournamentsMap.set(tId, {
                ...tournament.toObject ? tournament.toObject() : tournament,
                race_rounds: roundsWithInvitations,
            });
        }

        const tournaments = Array.from(tournamentsMap.values());
        if (tournaments.length === 0) {
            return { code: 404, message: 'No tournaments found for provided invitations', data: null };
        }

        return { code: 200, message: 'Success', data: { tournaments } };
    }

    // New helper: get tournaments that involve a specific jockey's invitations, with only that jockey's invitations per round
    async getTournamentsWithRoundsAndInvitationsForJockey(jockeyId) {
        // fetch all invitations for this jockey
        const jockeyInvitations = await InvitationRepository.findByJockeyId(jockeyId);
        if (!jockeyInvitations || jockeyInvitations.length === 0) {
            return { code: 404, message: 'No invitations found for this jockey' };
        }
        const invitationIds = jockeyInvitations.map(i => i._id);
        // reuse existing logic to fetch tournaments and all invitations per round
        const result = await this.getTournamentsWithRoundsAndInvitations(invitationIds);
        if (result.code !== 200 || !result.data || !result.data.tournaments) {
            return result;
        }
        // prune the invitations per round to only include the current jockey's invitations
        const filteredTournaments = result.data.tournaments.map((t) => {
            const race_rounds = t.race_rounds.map((rr) => {
                const filteredInvs = (rr.invitations || []).filter((inv) => inv.jockeyId === jockeyId);
                return { ...rr, invitations: filteredInvs };
            });
            return { ...t, race_rounds };
        });
        return { code: 200, message: 'Success', data: { tournaments: filteredTournaments } };
    }
}
module.exports = new InvitationService();
