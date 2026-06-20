const JockeyRepository = require('../repositories/JockeyRepository');
const UserRepository = require('../repositories/UserRepository');
const PasswordUtil = require('../utils/PasswordUtil');
const Invitation = require('../entities/Invitation');
const Horse = require('../entities/Horse');
const Registration = require('../entities/Registration');
const HorseOwner = require('../entities/HorseOwner');
const RaceRound = require('../entities/RaceRound');
const RaceReferee = require('../entities/RaceReferee');
const Referee = require('../entities/Referee');
const RaceEligibilityRule = require('../entities/RaceEligibilityRule');
const Tournament = require('../entities/Tournament');
const RaceResult = require('../entities/RaceResult');
const Violation = require('../entities/Violation');
const ViolationType = require('../entities/ViolationType');

class JockeyService {
    async createJockey(jockeyId, data) {
        try {
            const { height, weight, matchesRaced, totalWins, ranking, status, licenseLink } = data || {};

            if (!jockeyId) {
                return { code: 400, msg: 'jockeyId is required' };
            }

            const user = await UserRepository.findById(jockeyId);
            if (!user) {
                return { code: 404, msg: 'User not found' };
            }

            const existing = await JockeyRepository.findByJockeyId(jockeyId);
            if (existing) {
                return { code: 409, msg: 'Jockey profile already exists' };
            }

            const jockeyProfile = await JockeyRepository.create({
                _id: jockeyId,
                height: height || 0,
                weight: weight || 0,
                matchesRaced: matchesRaced || 0,
                totalWins: totalWins || 0,
                ranking: ranking || null,
                licenseLink: licenseLink || null,
                status: status || 'active',
            });

            return { code: 201, data: jockeyProfile, msg: 'Jockey profile created successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getJockeyProfile(jockeyId) {
        try {
            const jockey = await JockeyRepository.findByJockeyId(jockeyId);
            if (!jockey) {
                return { code: 404, msg: 'Jockey profile not found' };
            }
            const user = jockey._id;
            return {
                code: 200,
                data: {
                    jockeyId: user._id,
                    height: jockey.height,
                    weight: jockey.weight,
                    matchesRaced: jockey.matchesRaced,
                    totalWins: jockey.totalWins,
                    ranking: jockey.ranking,
                    status: jockey.status,
                    licenseLink: jockey.licenseLink,
                    licenseStatus: jockey.licenseStatus,
                    user: {
                        fullName: user.fullName,
                        userName: user.username,
                        email: user.email,
                        dateOfBirth: user.dateOfBirth,
                        phoneNumber: user.phoneNumber,
                        image: user.image,
                    },
                },
                msg: 'Jockey profile retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async updateJockeyProfile(jockeyId, updateData) {
        try {
            const jockey = await JockeyRepository.findByJockeyId(jockeyId);
            if (!jockey) {
                return { code: 404, msg: 'Jockey not found' };
            }

            const { height, weight, licenseLink, fullName, userName, email, dateOfBirth, phoneNumber, image } = updateData;

            if (licenseLink !== undefined) {
                try {
                    new URL(licenseLink);
                } catch {
                    return { code: 400, msg: 'licenseLink must be a valid URL' };
                }
            }

            const jockeyUpdate = {};
            if (height !== undefined) jockeyUpdate.height = height;
            if (weight !== undefined) jockeyUpdate.weight = weight;
            if (licenseLink !== undefined) jockeyUpdate.licenseLink = licenseLink;

            if (Object.keys(jockeyUpdate).length > 0) {
                await JockeyRepository.updateById(jockey._id, jockeyUpdate);
            }

            const userUpdate = {};
            if (fullName !== undefined) userUpdate.fullName = fullName;
            if (userName !== undefined) userUpdate.username = userName;
            if (email !== undefined) userUpdate.email = email;
            if (dateOfBirth !== undefined) userUpdate.dateOfBirth = dateOfBirth;
            if (phoneNumber !== undefined) userUpdate.phoneNumber = phoneNumber;
            if (image !== undefined) userUpdate.image = image;

            if (Object.keys(userUpdate).length > 0) {
                await UserRepository.updateById(jockeyId, userUpdate);
            }

            const refreshed = await JockeyRepository.findByJockeyId(jockeyId);
            const user = refreshed._id;
            return {
                code: 200,
                data: {
                    jockeyId: user._id,
                    height: refreshed.height,
                    weight: refreshed.weight,
                    licenseLink: refreshed.licenseLink,
                    licenseStatus: refreshed.licenseStatus,
                    user: {
                        fullName: user.fullName,
                        userName: user.username,
                        email: user.email,
                        dateOfBirth: user.dateOfBirth,
                        phoneNumber: user.phoneNumber,
                        image: user.image,
                    },
                },
                msg: 'Jockey profile updated successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }
// Note: Password changes are not currently being checked, as this is not a priority
    async changePassword(jockeyId, data) {
        try {
            const { oldPassword, newPassword, confirmPassword } = data || {};

            if (!oldPassword || !newPassword || !confirmPassword) {
                return { code: 400, msg: 'oldPassword, newPassword, and confirmPassword are required' };
            }
            if (newPassword !== confirmPassword) {
                return { code: 400, msg: 'newPassword and confirmPassword do not match' };
            }

            const user = await UserRepository.findById(jockeyId);
            if (!user) {
                return { code: 404, msg: 'User not found' };
            }

            if (!user.passwordHash) {
                return { code: 400, msg: 'Cannot change password for accounts without a password (e.g. Google accounts)' };
            }

            const isValid = await PasswordUtil.comparePassword(oldPassword, user.passwordHash);
            if (!isValid) {
                return { code: 400, msg: 'Old password is incorrect' };
            }

            if (!PasswordUtil.validatePasswordStrength(newPassword)) {
                return { code: 400, msg: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' };
            }

            const passwordHash = await PasswordUtil.hashPassword(newPassword);
            await UserRepository.updateById(jockeyId, { passwordHash });

            return { code: 200, msg: 'Password changed successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getMyInvitations(jockeyId) {
        try {
            const invitations = await Invitation.find({
                jockeyId,
                invitationStatus: { $in: ['pending', 'accepted', 'declined'] },
            }).lean();

            const result = await Promise.all(invitations.map(async inv => {
                const [horse, registration] = await Promise.all([
                    inv.horseId ? Horse.findById(inv.horseId).lean() : null,
                    inv.registrationId ? Registration.findById(inv.registrationId).lean() : null,
                ]);

                let ownerData = null;
                let raceRoundData = null;
                let tournamentData = null;

                if (registration) {
                    const [ownerUser, raceRound] = await Promise.all([
                        registration.horseOwnerId ? UserRepository.findById(registration.horseOwnerId) : null,
                        registration.raceRoundId ? RaceRound.findById(registration.raceRoundId).lean() : null,
                    ]);

                    if (ownerUser) {
                        ownerData = {
                            ownerId: registration.horseOwnerId,
                            user: {
                                fullName: ownerUser.fullName,
                                phoneNumber: ownerUser.phoneNumber,
                            },
                        };
                    }

                    if (raceRound) {
                        raceRoundData = {
                            raceRoundId: raceRound._id,
                            roundName: raceRound.roundName,
                            raceDate: raceRound.raceDate,
                            trackLength: raceRound.trackLength,
                            location: raceRound.location,
                            raceGround: raceRound.raceGround,
                            status: raceRound.status,
                            minimalRidingFees: raceRound.minimalRidingFees,
                        };

                        if (raceRound.tournamentId) {
                            const tournament = await Tournament.findById(raceRound.tournamentId).lean();
                            if (tournament) {
                                tournamentData = {
                                    tournamentId: tournament._id,
                                    tournamentName: tournament.tournamentName,
                                };
                            }
                        }
                    }
                }

                return {
                    invitationId: inv._id,
                    invitationStatus: inv.invitationStatus,
                    ownerConfirmation: inv.ownerConfirmation,
                    jockeyConfirmation: inv.jockeyConfirmation,
                    isBackup: inv.isBackup,
                    percentagePayout: inv.percentagePayout,
                    horse: horse ? {
                        horseId: horse._id,
                        horseName: horse.horseName,
                        breed: horse.breed,
                        gender: horse.gender,
                    } : null,
                    registration: registration ? {
                        registrationId: registration._id,
                        registrationStatus: registration.registrationStatus,
                        registeredAt: registration.registeredAt,
                    } : null,
                    horseOwner: ownerData,
                    raceRound: raceRoundData,
                    tournament: tournamentData,
                };
            }));

            return { code: 200, data: result, msg: 'Invitations retrieved successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async respondInvitation(jockeyId, invitationId, jockeyConfirmation) {
        try {
            if (!invitationId || !jockeyConfirmation) {
                return { code: 400, msg: 'invitationId and jockeyConfirmation are required' };
            }
            if (!['accepted', 'rejected'].includes(jockeyConfirmation)) {
                return { code: 400, msg: 'jockeyConfirmation must be accepted or rejected' };
            }

            const invitation = await Invitation.findById(invitationId);
            if (!invitation) {
                return { code: 404, msg: 'Invitation not found' };
            }
            if (String(invitation.jockeyId) !== String(jockeyId)) {
                return { code: 403, msg: 'Not authorized to respond to this invitation' };
            }
            if (invitation.invitationStatus === 'cancelled') {
                return { code: 400, msg: 'Cannot respond to a cancelled invitation' };
            }

            const isAccepted = jockeyConfirmation === 'accepted';
            invitation.jockeyConfirmation = isAccepted;

            if (isAccepted) {
                invitation.invitationStatus = invitation.ownerConfirmation ? 'accepted' : 'pending';
            } else {
                invitation.invitationStatus = 'declined';
            }

            await invitation.save();

            return {
                code: 200,
                data: {
                    invitationId: invitation._id,
                    jockeyConfirmation: invitation.jockeyConfirmation,
                    invitationStatus: invitation.invitationStatus,
                },
                msg: 'Invitation response recorded successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getMyRaceSchedule(jockeyId) {
        try {
            const invitations = await Invitation.find({
                jockeyId,
                invitationStatus: 'accepted',
            }).lean();

            const result = await Promise.all(invitations.map(async inv => {
                const [horse, registration] = await Promise.all([
                    inv.horseId ? Horse.findById(inv.horseId).lean() : null,
                    inv.registrationId ? Registration.findById(inv.registrationId).lean() : null,
                ]);

                let ownerData = null;
                let raceRoundData = null;
                let raceReferees = [];
                let eligibilityRule = null;
                let tournamentData = null;

                if (registration) {
                    if (registration.horseOwnerId) {
                        const ownerUser = await UserRepository.findById(registration.horseOwnerId);
                        ownerData = {
                            ownerId: registration.horseOwnerId,
                            user: ownerUser ? { fullName: ownerUser.fullName } : null,
                        };
                    }

                    if (registration.raceRoundId) {
                        const raceRound = await RaceRound.findById(registration.raceRoundId).lean();
                        if (raceRound) {
                            raceRoundData = {
                                raceRoundId: raceRound._id,
                                roundName: raceRound.roundName,
                                raceDate: raceRound.raceDate,
                                trackLength: raceRound.trackLength,
                                location: raceRound.location,
                                address: raceRound.address,
                                raceGround: raceRound.raceGround,
                                maxParticipants: raceRound.maxParticipants,
                                status: raceRound.status,
                                requireEntranceFees: raceRound.requireEntranceFees,
                            };

                            const rawReferees = await RaceReferee.find({ raceRoundId: raceRound._id }).lean();
                            raceReferees = await Promise.all(rawReferees.map(async rr => {
                                const referee = await Referee.findById(rr.refereeId).populate('_id').lean();
                                return {
                                    referee: referee ? {
                                        user: { fullName: referee._id?.fullName },
                                    } : null,
                                };
                            }));

                            if (raceRound.eligibilityRuleId) {
                                const rule = await RaceEligibilityRule.findById(raceRound.eligibilityRuleId).lean();
                                if (rule) {
                                    eligibilityRule = {
                                        raceType: rule.raceType,
                                        minAge: rule.minAge,
                                        maxAge: rule.maxAge,
                                    };
                                }
                            }

                            if (raceRound.tournamentId) {
                                const tournament = await Tournament.findById(raceRound.tournamentId).lean();
                                if (tournament) {
                                    tournamentData = {
                                        tournamentName: tournament.tournamentName,
                                        startDate: tournament.startDate,
                                        endDate: tournament.endDate,
                                    };
                                }
                            }
                        }
                    }
                }

                return {
                    invitationId: inv._id,
                    isBackup: inv.isBackup,
                    percentagePayout: inv.percentagePayout,
                    horse: horse ? {
                        horseId: horse._id,
                        horseName: horse.horseName,
                        breed: horse.breed,
                        healthStatus: horse.healthStatus,
                    } : null,
                    registration: registration ? { registrationId: registration._id } : null,
                    horseOwner: ownerData,
                    raceRound: raceRoundData,
                    raceReferees,
                    raceEligibilityRule: eligibilityRule,
                    tournament: tournamentData,
                };
            }));

            return { code: 200, data: result, msg: 'Race schedule retrieved successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getMyRaceHistory(jockeyId) {
        try {
            const invitations = await Invitation.find({
                jockeyId,
                invitationStatus: 'accepted',
            }).lean();

            if (invitations.length === 0) {
                return { code: 200, data: [], msg: 'No race history found' };
            }

            const registrationIds = invitations.map(inv => inv.registrationId).filter(Boolean);
            const horseByRegistration = {};
            invitations.forEach(inv => {
                if (inv.registrationId) {
                    horseByRegistration[String(inv.registrationId)] = inv.horseId;
                }
            });

            const raceResults = await RaceResult.find({
                registrationId: { $in: registrationIds },
            }).lean();

            const result = await Promise.all(raceResults.map(async rr => {
                const [violations, raceRound] = await Promise.all([
                    Violation.find({ registrationId: rr.registrationId }).lean(),
                    rr.raceRoundId ? RaceRound.findById(rr.raceRoundId).lean() : null,
                ]);

                const violationsWithType = await Promise.all(violations.map(async v => {
                    const vType = v.violationTypeId ? await ViolationType.findById(v.violationTypeId).lean() : null;
                    return {
                        description: v.description,
                        actualPenalty: v.actualPenalty,
                        violationStatus: v.violationStatus,
                        violationType: vType ? { violationName: vType.violationName } : null,
                    };
                }));

                const horseId = horseByRegistration[String(rr.registrationId)];
                const horse = horseId ? await Horse.findById(horseId).lean() : null;

                let tournamentData = null;
                if (raceRound && raceRound.tournamentId) {
                    const tournament = await Tournament.findById(raceRound.tournamentId).lean();
                    if (tournament) {
                        tournamentData = { tournamentName: tournament.tournamentName };
                    }
                }

                return {
                    resultId: rr._id,
                    finishPosition: rr.finishPosition,
                    finishTime: rr.finishTime,
                    prizeMoney: rr.prizeMoney,
                    resultStatus: rr.resultStatus,
                    registration: { registrationId: rr.registrationId },
                    violations: violationsWithType,
                    horse: horse ? { horseName: horse.horseName } : null,
                    raceRound: raceRound ? {
                        roundName: raceRound.roundName,
                        raceDate: raceRound.raceDate,
                        trackLength: raceRound.trackLength,
                        location: raceRound.location,
                        raceGround: raceRound.raceGround,
                    } : null,
                    tournament: tournamentData,
                };
            }));

            return { code: 200, data: result, msg: 'Race history retrieved successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getTopJockeys(limit = 10) {
        try {
            const jockeys = await JockeyRepository.findTopJockeys(limit);
            return {
                code: 200,
                data: { jockeys, count: jockeys.length },
                msg: 'Top jockeys retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getJockeyStats(jockeyId) {
        try {
            const jockey = await JockeyRepository.findByJockeyId(jockeyId);
            if (!jockey) {
                return { code: 404, msg: 'Jockey not found' };
            }
            return {
                code: 200,
                data: {
                    matchesRaced: jockey.matchesRaced,
                    totalWins: jockey.totalWins,
                    winRate: jockey.matchesRaced > 0 ? ((jockey.totalWins / jockey.matchesRaced) * 100).toFixed(2) + '%' : '0%',
                    ranking: jockey.ranking,
                },
                msg: 'Jockey statistics retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getAllJockeys(limit = 10, skip = 0) {
        try {
            const jockeys = await JockeyRepository.findAll(limit, skip);
            const p = jockeys.map(i => {
                const { _id, ...rest } = i.toObject();
                const { passwordHash, ...rest2 } = i._id.toObject();
                return Object.assign({}, rest, rest2);
            });
            return {
                code: 200,
                data: { jockeys: p },
                msg: 'Jockeys retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getJockeysByStatus(status) {
        try {
            if (!['active', 'inactive', 'retired'].includes(status)) {
                return { code: 400, msg: 'Invalid status' };
            }
            const jockeys = await JockeyRepository.findAll(100, 0);
            const filtered = jockeys.filter(j => j.status === status);
            return {
                code: 200,
                data: { jockeys: filtered, count: filtered.length },
                msg: `Jockeys with status ${status} retrieved successfully`,
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async addWin(jockeyId) {
        try {
            const jockey = await JockeyRepository.findByJockeyId(jockeyId);
            if (!jockey) {
                return { code: 404, msg: 'Jockey not found' };
            }
            const updatedJockey = await JockeyRepository.updateById(jockey._id, {
                totalWins: jockey.totalWins + 1,
                matchesRaced: jockey.matchesRaced + 1,
            });
            return { code: 200, data: updatedJockey, msg: 'Win recorded successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async recordMatch(jockeyId) {
        try {
            const jockey = await JockeyRepository.findByJockeyId(jockeyId);
            if (!jockey) {
                return { code: 404, msg: 'Jockey not found' };
            }
            const updatedJockey = await JockeyRepository.updateById(jockey._id, {
                matchesRaced: jockey.matchesRaced + 1,
            });
            return { code: 200, data: updatedJockey, msg: 'Match recorded successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new JockeyService();
