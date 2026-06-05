const RefereeRepository = require('../repositories/RefereeRepository');
const UserRepository = require('../repositories/UserRepository');

const RaceReferee = require('../entities/RaceReferee');
const RaceRound = require('../entities/RaceRound');
const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
const Registration = require('../entities/Registration');
const User = require('../entities/User');
const Invitation = require('../entities/Invitation');
const RaceResult = require('../entities/RaceResult');
const Tournament = require('../entities/Tournament');

class RefereeService {
    // Create referee profile for existing user (public)
    async createReferee(refereeId, data) {
        try {
            const { licenseLink } = data || {};

            if (!refereeId) {
                return { code: 400, msg: 'refereeId is required' };
            }

            const user = await UserRepository.findById(refereeId);
            if (!user) {
                return { code: 404, msg: 'User not found' };
            }

            const existing = await RefereeRepository.findByRefereeId(refereeId);
            if (existing) {
                return { code: 409, msg: 'Referee profile already exists' };
            }

            const refereeProfile = await RefereeRepository.create({
                _id: refereeId,
                licenseLink: licenseLink || null,
            });

            return { code: 201, data: refereeProfile, msg: 'Referee profile created successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }



    // Get referee profile
    async getRefereeProfile(refereeId) {
        try {
            const referee = await RefereeRepository.findByRefereeId(refereeId);
            if (!referee) {
                return {
                    code: 404,
                    msg: 'Referee profile not found',
                };
            }
            return {
                code: 200,
                data: referee,
                msg: 'Referee profile retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get referee invitations (assigned race rounds)
    async getRefereeInvitations(userId, limit = 10, page = 1) {
        try {
            const skip = (page - 1) * limit;
            
            const [invitations, total] = await Promise.all([
                require('../repositories/RaceRefereeRepository').findInvitationsByRefereeId(userId, limit, skip),
                require('../repositories/RaceRefereeRepository').countInvitationsByRefereeId(userId)
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                code: 200,
                data: invitations,
                pagination: {
                    total,
                    totalPages,
                    currentPage: page,
                    limit,
                },
                msg: 'Referee invitations retrieved successfully',
            };
        } catch (error) {
            console.error("Error fetching referee invitations:", error);
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Accept invitation
    async acceptInvitation(userId, invitationId) {
        try {
            const updated = await require('../repositories/RaceRefereeRepository').updateStatusByIdAndRefereeId(invitationId, userId, 'assigned');
            if (!updated) {
                return {
                    code: 404,
                    msg: 'Invitation not found or you are not authorized to accept it.',
                };
            }
            return {
                code: 200,
                data: updated,
                msg: 'Invitation accepted successfully',
            };
        } catch (error) {
            console.error("Error accepting invitation:", error);
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Reject invitation
    async rejectInvitation(userId, invitationId) {
        try {
            const updated = await require('../repositories/RaceRefereeRepository').updateStatusByIdAndRefereeId(invitationId, userId, 'rejected');
            if (!updated) {
                return {
                    code: 404,
                    msg: 'Invitation not found or you are not authorized to reject it.',
                };
            }
            return {
                code: 200,
                data: updated,
                msg: 'Invitation rejected successfully',
            };
        } catch (error) {
            console.error("Error rejecting invitation:", error);
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get all referees
    async getAllReferees(limit = 10, skip = 0) {
        try {
            const referees = await RefereeRepository.findAll(limit, skip);
            const count = await RefereeRepository.count();
            return {
                code: 200,
                data: { referees, count },
                msg: 'Referees retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Update referee profile
    async updateRefereeProfile(refereeId, updateData) {
        try {
            const referee = await RefereeRepository.findByRefereeId(refereeId);
            if (!referee) {
                return {
                    code: 404,
                    msg: 'Referee not found',
                };
            }
            const updatedReferee = await RefereeRepository.updateById(referee._id, updateData);
            return {
                code: 200,
                data: updatedReferee,
                msg: 'Referee profile updated successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get referee by certification number - DEPRECATED
    async getRefereeByCredentials(certificationNumber) {
        try {
            return {
                code: 400,
                msg: 'This endpoint is deprecated. Certification information is now stored as licenseLink.',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Verify referee credentials - DEPRECATED
    async verifyRefereeCredentials(refereeId, certificationNumber) {
        try {
            return {
                code: 400,
                msg: 'This endpoint is deprecated. Certification information is now stored as licenseLink.',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Renew certification - DEPRECATED
    async renewCertification(refereeId, newCertificationNumber) {
        try {
            return {
                code: 400,
                msg: 'This endpoint is deprecated. Use update profile to change licenseLink.',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get referee by license number - DEPRECATED
    async getRefereeByLicense(licenseNumber) {
        try {
            return {
                code: 400,
                msg: 'This endpoint is deprecated. License information is now stored as licenseLink.',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get Race Rounds assigned to the referee
    async getRefereeRaceRounds(refereeId) {
        try {
            // 1. Fetch assignments for this referee
            const assignments = await RaceReferee.find({ refereeId }).lean();
            if (!assignments.length) {
                return { code: 200, data: [], msg: 'No race rounds assigned to this referee.' };
            }

            const raceRoundIds = assignments.map(a => a.raceRoundId);

            // 2. Fetch the corresponding RaceRounds
            const raceRounds = await RaceRound.find({ _id: { $in: raceRoundIds } }).lean();

            const results = [];

            for (const raceRound of raceRounds) {
                // Fetch RaceType
                let raceType = raceRound.raceType || null;
                if (!raceType && raceRound.eligibilityRuleId) {
                    const rule = await RaceEligibilityRule.findById(raceRound.eligibilityRuleId).lean();
                    if (rule && rule.raceType) raceType = rule.raceType;
                }

                const rrObj = {
                    ...raceRound,
                    RaceType: raceType,
                    Registration: []
                };

                // Fetch Registrations
                const registrations = await Registration.find({ raceRoundId: raceRound._id }).lean();

                for (const reg of registrations) {
                    // Fetch Owner User directly
                    const ownerUser = reg.horseOwnerId
                        ? await User.findById(reg.horseOwnerId, 'fullName').lean()
                        : null;

                    // Fetch Invitation (for Horse and Jockey)
                    const invitation = await Invitation.findOne({
                        registrationId: reg._id,
                        isBackup: false
                    })
                        .populate('horseId')
                        .populate({
                            path: 'jockeyId',
                            populate: { path: '_id', model: 'User', select: 'fullName' }
                        })
                        .lean();

                    // Fetch RaceResult
                    const raceResult = await RaceResult.findOne({ registrationId: reg._id }).lean();

                    rrObj.Registration.push({
                        ...reg,
                        Horse: invitation ? invitation.horseId : null,
                        Jockey: invitation ? invitation.jockeyId : null,
                        Owner: ownerUser,
                        RaceResult: raceResult || null
                    });
                }

                results.push(rrObj);
            }

            return { code: 200, data: results, msg: 'Referee race rounds retrieved successfully' };
        } catch (error) {
            console.error('Error fetching referee race rounds:', error);
            return { code: 500, msg: error.message };
        }
    }

    // Get Tournaments assigned to the referee
    async getRefereeTournaments(refereeId) {
        try {
            // 1. Fetch assignments for this referee
            const assignments = await RaceReferee.find({ refereeId }).lean();
            if (!assignments.length) {
                return { code: 200, data: [], msg: 'No tournaments found.' };
            }

            const raceRoundIds = assignments.map(a => a.raceRoundId);

            // 2. Fetch the corresponding RaceRounds
            const raceRounds = await RaceRound.find({ _id: { $in: raceRoundIds } })
                .lean();

            const tournamentIds = [...new Set(raceRounds.map(r => r.tournamentId.toString()))];

            // 3. Fetch Tournaments
            const tournaments = await Tournament.find({ _id: { $in: tournamentIds } }).lean();

            // 4. Assemble the response
            const results = [];

            for (const t of tournaments) {
                const tRounds = raceRounds.filter(r => r.tournamentId.toString() === t._id.toString());
                const mappedRounds = [];

                for (const r of tRounds) {
                    const assignment = assignments.find(a => a.raceRoundId.toString() === r._id.toString());
                    
                    // Fetch RaceType directly as the populated rule
                    let raceType = null;
                    if (r.eligibilityRuleId) {
                        raceType = await RaceEligibilityRule.findById(r.eligibilityRuleId).lean();
                    }

                    const rrObj = {
                        ...r,
                        RaceType: raceType,
                        RaceReferee: assignment || null,
                        Registration: []
                    };

                    // Fetch Registrations
                    const registrations = await Registration.find({ raceRoundId: r._id }).lean();

                    for (const reg of registrations) {
                        // Fetch Owner User directly
                        const ownerUser = reg.horseOwnerId
                            ? await User.findById(reg.horseOwnerId, 'fullName').lean()
                            : null;

                        // Fetch Invitation (for Horse and Jockey)
                        const invitation = await Invitation.findOne({
                            registrationId: reg._id,
                            isBackup: false
                        })
                            .populate('horseId')
                            .populate({
                                path: 'jockeyId',
                                populate: { path: '_id', model: 'User', select: 'fullName' }
                            })
                            .lean();

                        // Fetch RaceResult
                        const raceResult = await RaceResult.findOne({ registrationId: reg._id }).lean();

                        rrObj.Registration.push({
                            ...reg,
                            Horse: invitation ? invitation.horseId : null,
                            Jockey: invitation ? invitation.jockeyId : null,
                            Owner: ownerUser,
                            RaceResult: raceResult || null
                        });
                    }
                    mappedRounds.push(rrObj);
                }

                results.push({
                    ...t,
                    RaceRound: mappedRounds
                });
            }

            return { code: 200, data: results, msg: 'Referee tournaments retrieved successfully' };
        } catch (error) {
            console.error('Error fetching referee tournaments:', error);
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new RefereeService();
