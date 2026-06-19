const JockeyRepository = require("../repositories/JockeyRepository");
const UserRepository = require("../repositories/UserRepository");
const PasswordUtil = require("../utils/PasswordUtil");
const Invitation = require("../entities/Invitation");
const Registration = require("../entities/Registration");
const Horse = require("../entities/Horse");
const HorseOwner = require("../entities/HorseOwner");
const RaceRound = require("../entities/RaceRound");
const Tournament = require("../entities/Tournament");
const RaceReferee = require("../entities/RaceReferee");
const Referee = require("../entities/Referee");
const RaceEligibilityRule = require("../entities/RaceEligibilityRule");
const RaceResult = require("../entities/RaceResult");
const Violation = require("../entities/Violation");
const ViolationType = require("../entities/ViolationType");

class JockeyService {
  // Create jockey profile for existing user (public)
  async createJockey(jockeyId, data) {
    try {
      const {
        height,
        weight,
        matchesRaced,
        totalWins,
        ranking,
        status,
        licenseLink,
      } = data || {};

      if (!jockeyId) {
        return { code: 400, msg: "jockeyId is required" };
      }

      const user = await UserRepository.findById(jockeyId);
      if (!user) {
        return { code: 404, msg: "User not found" };
      }

      const existing = await JockeyRepository.findByJockeyId(jockeyId);
      if (existing) {
        return { code: 409, msg: "Jockey profile already exists" };
      }

      const jockeyProfile = await JockeyRepository.create({
        _id: jockeyId,
        height: height || 0,
        weight: weight || 0,
        matchesRaced: matchesRaced || 0,
        totalWins: totalWins || 0,
        ranking: ranking || null,
        licenseLink: licenseLink || null,
        status: status || "active",
      });

      return {
        code: 201,
        data: jockeyProfile,
        msg: "Jockey profile created successfully",
      };
    } catch (error) {
      return { code: 500, msg: error.message };
    }
  }

  // Get jockey profile
  async getJockeyProfile(jockeyId) {
    try {
      const jockey = await JockeyRepository.findByJockeyId(jockeyId);
      if (!jockey) {
        return {
          code: 404,
          msg: "Jockey profile not found",
        };
      }
      return {
        code: 200,
        data: jockey,
        msg: "Jockey profile retrieved successfully",
      };
    } catch (error) {
      return {
        code: 500,
        msg: error.message,
      };
    }
  }

  // Get top jockeys by ranking
  async getTopJockeys(limit = 10) {
    try {
      const jockeys = await JockeyRepository.findTopJockeys(limit);
      return {
        code: 200,
        data: { jockeys, count: jockeys.length },
        msg: "Top jockeys retrieved successfully",
      };
    } catch (error) {
      return {
        code: 500,
        msg: error.message,
      };
    }
  }

  // Get jockey statistics
  async getJockeyStats(jockeyId) {
    try {
      const jockey = await JockeyRepository.findByJockeyId(jockeyId);
      if (!jockey) {
        return {
          code: 404,
          msg: "Jockey not found",
        };
      }
      return {
        code: 200,
        data: {
          matchesRaced: jockey.matchesRaced,
          totalWins: jockey.totalWins,
          winRate:
            jockey.matchesRaced > 0
              ? ((jockey.totalWins / jockey.matchesRaced) * 100).toFixed(2) +
                "%"
              : "0%",
          ranking: jockey.ranking,
        },
        msg: "Jockey statistics retrieved successfully",
      };
    } catch (error) {
      return {
        code: 500,
        msg: error.message,
      };
    }
  }

  // Update jockey profile
  async updateJockeyProfile(jockeyId, updateData) {
    try {
      const jockey = await JockeyRepository.findByJockeyId(jockeyId);
      if (!jockey) {
        return {
          code: 404,
          msg: "Jockey not found",
        };
      }

      const updatedJockey = await JockeyRepository.updateById(
        jockey._id,
        updateData,
      );
      return {
        code: 200,
        data: updatedJockey,
        msg: "Jockey profile updated successfully",
      };
    } catch (error) {
      return {
        code: 500,
        msg: error.message,
      };
    }
  }

  // Get all jockeys
  async getAllJockeys(limit = 10, skip = 0) {
    try {
      const jockeys = await JockeyRepository.findAll(limit, skip);
      const p = jockeys.map((i) => {
        const { _id, ...rest } = i.toObject();
        const { passwordHash, ...rest2 } = i._id.toObject();
        return Object.assign({}, rest, rest2);
      });
      return {
        code: 200,
        data: { jockeys: p },
        msg: "Jockeys retrieved successfully",
      };
    } catch (error) {
      return {
        code: 500,
        msg: error.message,
      };
    }
  }
  async getAllJockeysWithUserInfo(limit = 10, skip = 0) {
    try {
      const jockeys = await this.getAllJockeys(limit, skip);

      jockeys.forEach((j) => {});
    } catch (error) {
      return {
        code: 500,
        msg: error.message,
      };
    }
  }
  // Get jockeys by status
  async getJockeysByStatus(status) {
    try {
      if (!["active", "inactive", "retired"].includes(status)) {
        return {
          code: 400,
          msg: "Invalid status",
        };
      }
      const jockeys = await JockeyRepository.findAll(100, 0);
      const filtered = jockeys.filter((j) => j.status === status);
      return {
        code: 200,
        data: { jockeys: filtered, count: filtered.length },
        msg: `Jockeys with status ${status} retrieved successfully`,
      };
    } catch (error) {
      return {
        code: 500,
        msg: error.message,
      };
    }
  }

  // Update wins count
  async addWin(jockeyId) {
    try {
      const jockey = await JockeyRepository.findByJockeyId(jockeyId);
      if (!jockey) {
        return {
          code: 404,
          msg: "Jockey not found",
        };
      }
      const updatedJockey = await JockeyRepository.updateById(jockey._id, {
        totalWins: jockey.totalWins + 1,
        matchesRaced: jockey.matchesRaced + 1,
      });
      return {
        code: 200,
        data: updatedJockey,
        msg: "Win recorded successfully",
      };
    } catch (error) {
      return {
        code: 500,
        msg: error.message,
      };
    }
  }

  // Record match participation
  async recordMatch(jockeyId) {
    try {
      const jockey = await JockeyRepository.findByJockeyId(jockeyId);
      if (!jockey) {
        return {
          code: 404,
          msg: "Jockey not found",
        };
      }
      const updatedJockey = await JockeyRepository.updateById(jockey._id, {
        matchesRaced: jockey.matchesRaced + 1,
      });
      return {
        code: 200,
        data: updatedJockey,
        msg: "Match recorded successfully",
      };
    } catch (error) {
      return {
        code: 500,
        msg: error.message,
      };
    }
  }

  // Get jockey profile with user data
  async getJockeyProfileWithUser(jockeyId) {
    try {
      const jockey = await JockeyRepository.findByJockeyId(jockeyId);
      if (!jockey) {
        return {
          code: 404,
          msg: "Jockey profile not found",
        };
      }

      // Jockey._id is populated with User document
      const jockeyObj = jockey.toObject ? jockey.toObject() : jockey;
      const userData = jockeyObj._id || {};

      return {
        code: 200,
        data: {
          jockeyId: jockey._id,
          height: jockey.height,
          weight: jockey.weight,
          matchesRaced: jockey.matchesRaced,
          totalWins: jockey.totalWins,
          ranking: jockey.ranking,
          status: jockey.status,
          licenseLink: jockey.licenseLink,
          licenseStatus: jockey.licenseStatus,
          user: {
            fullName: userData.fullName,
            userName: userData.username,
            email: userData.email,
            dateOfBirth: userData.dateOfBirth,
            phoneNumber: userData.phoneNumber,
            image: userData.image,
          },
        },
        msg: "Jockey profile retrieved successfully",
      };
    } catch (error) {
      return {
        code: 500,
        msg: error.message,
      };
    }
  }

  // Update jockey profile with user data
  async updateJockeyProfileWithUser(jockeyId, updateData) {
    try {
      const jockey = await JockeyRepository.findByJockeyId(jockeyId);
      if (!jockey) {
        return {
          code: 404,
          msg: "Jockey profile not found",
        };
      }

      const user = await UserRepository.findById(jockeyId);
      if (!user) {
        return {
          code: 404,
          msg: "User not found",
        };
      }

      // Extract jockey fields
      const jockeyUpdate = {};
      if (updateData.height !== undefined)
        jockeyUpdate.height = updateData.height;
      if (updateData.weight !== undefined)
        jockeyUpdate.weight = updateData.weight;
      if (updateData.licenseLink !== undefined)
        jockeyUpdate.licenseLink = updateData.licenseLink;

      // Extract user fields
      const userUpdate = {};
      if (updateData.fullName !== undefined)
        userUpdate.fullName = updateData.fullName;
      if (updateData.userName !== undefined)
        userUpdate.username = updateData.userName;
      if (updateData.email !== undefined) userUpdate.email = updateData.email;
      if (updateData.dateOfBirth !== undefined)
        userUpdate.dateOfBirth = updateData.dateOfBirth;
      if (updateData.phoneNumber !== undefined)
        userUpdate.phoneNumber = updateData.phoneNumber;
      if (updateData.image !== undefined) userUpdate.image = updateData.image;

      // Check if email is unique (if updating)
      if (userUpdate.email && userUpdate.email !== user.email) {
        const existingEmail = await UserRepository.findByEmail(
          userUpdate.email,
        );
        if (existingEmail) {
          return {
            code: 409,
            msg: "Email already in use",
          };
        }
      }

      // Check if username is unique (if updating)
      if (userUpdate.username && userUpdate.username !== user.username) {
        const existingUsername = await UserRepository.findByUsername(
          userUpdate.username,
        );
        if (existingUsername) {
          return {
            code: 409,
            msg: "Username already in use",
          };
        }
      }

      // Update jockey
      let updatedJockey = jockey;
      if (Object.keys(jockeyUpdate).length > 0) {
        updatedJockey = await JockeyRepository.updateById(
          jockey._id,
          jockeyUpdate,
        );
      }

      // Update user
      let updatedUser = user;
      if (Object.keys(userUpdate).length > 0) {
        updatedUser = await UserRepository.updateById(jockeyId, userUpdate);
      }

      // Return updated profile with user data
      const updatedJockeyObj = updatedJockey.toObject
        ? updatedJockey.toObject()
        : updatedJockey;
      const updatedUserData =
        updatedJockeyObj._id || updatedUser.toObject
          ? updatedUser.toObject()
          : updatedUser;

      return {
        code: 200,
        data: {
          jockeyId: updatedJockey._id,
          height: updatedJockey.height,
          weight: updatedJockey.weight,
          matchesRaced: updatedJockey.matchesRaced,
          totalWins: updatedJockey.totalWins,
          ranking: updatedJockey.ranking,
          status: updatedJockey.status,
          licenseLink: updatedJockey.licenseLink,
          licenseStatus: updatedJockey.licenseStatus,
          user: {
            fullName: updatedUser.fullName,
            userName: updatedUser.username,
            email: updatedUser.email,
            dateOfBirth: updatedUser.dateOfBirth,
            phoneNumber: updatedUser.phoneNumber,
            image: updatedUser.image,
          },
        },
        msg: "Jockey profile updated successfully",
      };
    } catch (error) {
      return {
        code: 500,
        msg: error.message,
      };
    }
  }

  // Change password
  async changePassword(jockeyId, passwordData) {
    try {
      const { oldPassword, newPassword, confirmPassword } = passwordData;

      if (!oldPassword || !newPassword || !confirmPassword) {
        return {
          code: 400,
          msg: "Old password, new password, and confirm password are required",
        };
      }

      if (newPassword !== confirmPassword) {
        return {
          code: 400,
          msg: "New password and confirm password do not match",
        };
      }

      if (!PasswordUtil.validatePasswordStrength(newPassword)) {
        return {
          code: 400,
          msg: "Password must be at least 8 characters with uppercase, lowercase, number, and special character",
        };
      }

      const user = await UserRepository.findById(jockeyId);
      if (!user) {
        return {
          code: 404,
          msg: "User not found",
        };
      }

      if (!user.passwordHash) {
        return {
          code: 400,
          msg: "This account uses Google authentication and does not have a password",
        };
      }

      // Verify old password
      const isPasswordValid = await PasswordUtil.comparePassword(
        oldPassword,
        user.passwordHash,
      );
      if (!isPasswordValid) {
        return {
          code: 401,
          msg: "Old password is incorrect",
        };
      }

      // Hash new password
      const newPasswordHash = await PasswordUtil.hashPassword(newPassword);

      // Update password
      await UserRepository.updateById(jockeyId, {
        passwordHash: newPasswordHash,
      });

      return {
        code: 200,
        msg: "Password changed successfully",
      };
    } catch (error) {
      return {
        code: 500,
        msg: error.message,
      };
    }
  }

  // Get my invitations (pending or accepted)
  async getMyInvitations(jockeyId) {
    try {
      const jockey = await JockeyRepository.findByJockeyId(jockeyId);
      if (!jockey) {
        return {
          code: 404,
          msg: "Jockey not found",
        };
      }

      // Find invitations for this jockey that are pending or accepted
      const invitations = await Invitation.find({
        jockeyId: jockey._id,
        invitationStatus: { $in: ["pending", "accepted"] },
      }).lean();

      // Populate related data
      const result = await Promise.all(
        invitations.map(async (inv) => {
          const horse = await Horse.findById(inv.horseId).lean();
          const registration = await Registration.findById(
            inv.registrationId,
          ).lean();
          let horseOwner = null;
          let horseOwnerUser = null;
          if (registration) {
            horseOwner = await HorseOwner.findById(
              registration.horseOwnerId,
            ).lean();
          }
          if (horseOwner) {
            horseOwnerUser = await UserRepository.findById(horseOwner._id);
          }
          const raceRound = registration
            ? await RaceRound.findById(registration.raceRoundId).lean()
            : null;
          const tournament = raceRound
            ? await Tournament.findById(raceRound.tournamentId).lean()
            : null;

          return {
            invitationId: inv._id,
            invitationStatus: inv.invitationStatus,
            ownerConfirmation: inv.ownerConfirmation,
            jockeyConfirmation: inv.jockeyConfirmation,
            isBackup: inv.isBackup,
            percentagePayout: inv.percentagePayout,
            horse: horse
              ? {
                  horseId: horse._id,
                  horseName: horse.horseName,
                  breed: horse.breed,
                  gender: horse.gender,
                }
              : null,
            registration: registration
              ? {
                  registrationId: registration._id,
                  registrationStatus: registration.registrationStatus,
                  registeredAt: registration.registeredAt,
                }
              : null,
            horseOwner: horseOwner
              ? {
                  ownerId: horseOwner._id,
                }
              : null,
            ownerUser: horseOwnerUser
              ? {
                  fullName: horseOwnerUser.fullName,
                  phoneNumber: horseOwnerUser.phoneNumber,
                }
              : null,
            raceRound: raceRound
              ? {
                  raceRoundId: raceRound._id,
                  roundName: raceRound.roundName,
                  raceDate: raceRound.raceDate,
                  trackLength: raceRound.trackLength,
                  location: raceRound.location,
                  raceGround: raceRound.raceGround,
                  status: raceRound.status,
                  minimalRidingFees: raceRound.minimalRidingFees,
                }
              : null,
            tournament: tournament
              ? {
                  tournamentId: tournament._id,
                  tournamentName: tournament.tournamentName,
                }
              : null,
          };
        }),
      );

      return {
        code: 200,
        data: result,
        msg: "Invitations retrieved successfully",
      };
    } catch (error) {
      return {
        code: 500,
        msg: error.message,
      };
    }
  }

  // Respond to invitation
  async respondToInvitation(jockeyId, invitationData) {
    try {
      const { invitationId, jockeyConfirmation } = invitationData;

      if (!invitationId) {
        return {
          code: 400,
          msg: "invitationId is required",
        };
      }

      if (!["accepted", "rejected"].includes(jockeyConfirmation)) {
        return {
          code: 400,
          msg: 'jockeyConfirmation must be "accepted" or "rejected"',
        };
      }

      const invitation = await Invitation.findById(invitationId);
      if (!invitation) {
        return {
          code: 404,
          msg: "Invitation not found",
        };
      }

      // Check if invitation belongs to this jockey
      if (String(invitation.jockeyId) !== String(jockeyId)) {
        return {
          code: 403,
          msg: "This invitation does not belong to you",
        };
      }

      // Check if invitation is still pending
      if (invitation.invitationStatus !== "pending") {
        return {
          code: 400,
          msg: "Cannot respond to a non-pending invitation",
        };
      }

      // Check if already responded
      if (invitation.jockeyConfirmation !== false) {
        return {
          code: 400,
          msg: "You have already responded to this invitation",
        };
      }

      // Update invitation
      if (jockeyConfirmation === "accepted") {
        invitation.jockeyConfirmation = true;
        invitation.invitationStatus = "accepted";
      } else {
        invitation.jockeyConfirmation = false;
        invitation.invitationStatus = "rejected";
      }

      await invitation.save();

      return {
        code: 200,
        data: invitation,
        msg: `Invitation ${jockeyConfirmation} successfully`,
      };
    } catch (error) {
      return {
        code: 500,
        msg: error.message,
      };
    }
  }

  // Get my race schedule (accepted invitations)
  async getMyRaceSchedule(jockeyId) {
    try {
      const jockey = await JockeyRepository.findByJockeyId(jockeyId);
      if (!jockey) {
        return {
          code: 404,
          msg: "Jockey not found",
        };
      }

      // Find accepted invitations
      const invitations = await Invitation.find({
        jockeyId: jockey._id,
        invitationStatus: "accepted",
      }).lean();

      const result = await Promise.all(
        invitations.map(async (inv) => {
          const registration = await Registration.findById(
            inv.registrationId,
          ).lean();
          const horse = registration
            ? await Horse.findById(inv.horseId).lean()
            : null;
          const horseOwner = registration
            ? await HorseOwner.findById(registration.horseOwnerId).lean()
            : null;
          const horseOwnerUser = horseOwner
            ? await UserRepository.findById(horseOwner._id)
            : null;
          const raceRound = registration
            ? await RaceRound.findById(registration.raceRoundId).lean()
            : null;
          const tournament = raceRound
            ? await Tournament.findById(raceRound.tournamentId).lean()
            : null;

          // Get race referees
          let refereeNames = [];
          if (raceRound) {
            const raceReferees = await RaceReferee.find({
              raceRoundId: raceRound._id,
            }).lean();
            refereeNames = await Promise.all(
              raceReferees.map(async (rr) => {
                const referee = await UserRepository.findById(rr.refereeId);
                return referee ? referee.fullName : "Unknown";
              }),
            );
          }

          // Get eligibility rule
          let eligibilityRule = null;
          if (raceRound && raceRound.eligibilityRuleId) {
            eligibilityRule = await RaceEligibilityRule.findById(
              raceRound.eligibilityRuleId,
            ).lean();
          }

          return {
            horse: horse
              ? {
                  horseId: horse._id,
                  horseName: horse.horseName,
                  breed: horse.breed,
                  healthStatus: horse.healthStatus,
                }
              : null,
            registration: registration
              ? {
                  registrationId: registration._id,
                }
              : null,
            horseOwner: horseOwner
              ? {
                  ownerId: horseOwner._id,
                }
              : null,
            ownerUser: horseOwnerUser
              ? {
                  fullName: horseOwnerUser.fullName,
                }
              : null,
            raceRound: raceRound
              ? {
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
                }
              : null,
            raceReferees: refereeNames,
            eligibilityRule: eligibilityRule
              ? {
                  raceType: eligibilityRule.raceType,
                  minAge: eligibilityRule.minAge,
                  maxAge: eligibilityRule.maxAge,
                }
              : null,
            tournament: tournament
              ? {
                  tournamentName: tournament.tournamentName,
                  startDate: tournament.startDate,
                  endDate: tournament.endDate,
                }
              : null,
          };
        }),
      );

      // Sort by raceDate ascending
      result.sort((a, b) => {
        const dateA = a.raceRound?.raceDate
          ? new Date(a.raceRound.raceDate)
          : new Date(0);
        const dateB = b.raceRound?.raceDate
          ? new Date(b.raceRound.raceDate)
          : new Date(0);
        return dateA - dateB;
      });

      return {
        code: 200,
        data: result,
        msg: "Race schedule retrieved successfully",
      };
    } catch (error) {
      return {
        code: 500,
        msg: error.message,
      };
    }
  }

  // Get my race history (races with results)
  async getMyRaceHistory(jockeyId) {
    try {
      const jockey = await JockeyRepository.findByJockeyId(jockeyId);
      if (!jockey) {
        return {
          code: 404,
          msg: "Jockey not found",
        };
      }

      // Find all race results for this jockey's registrations
      // First, find registrations where this jockey is assigned
      const invitations = await Invitation.find({
        jockeyId: jockey._id,
        invitationStatus: "accepted",
      }).lean();

      const registrationIds = invitations.map((inv) => inv.registrationId);

      // Find race results for these registrations
      const raceResults = await RaceResult.find({
        registrationId: { $in: registrationIds },
      }).lean();

      const result = await Promise.all(
        raceResults.map(async (rr) => {
          const registration = await Registration.findById(
            rr.registrationId,
          ).lean();
          const horse = registration
            ? await Horse.findById(
                invitations.find(
                  (i) => String(i.registrationId) === String(registration._id),
                )?.horseId,
              ).lean()
            : null;
          const raceRound = registration
            ? await RaceRound.findById(registration.raceRoundId).lean()
            : null;
          const tournament = raceRound
            ? await Tournament.findById(raceRound.tournamentId).lean()
            : null;

          // Get violations for this registration
          const violations = await Violation.find({
            registrationId: registration._id,
          }).lean();
          const violationDetails = await Promise.all(
            violations.map(async (v) => {
              const violationType = await ViolationType.findById(
                v.violationTypeId,
              ).lean();
              return {
                description: v.description,
                actualPenalty: v.actualPenalty,
                violationStatus: v.violationStatus,
                violationName: violationType
                  ? violationType.violationName
                  : "Unknown",
              };
            }),
          );

          return {
            raceResult: {
              resultId: rr._id,
              finishPosition: rr.finishPosition,
              finishTime: rr.finishTime,
              prizeMoney: rr.prizeMoney,
              resultStatus: rr.resultStatus,
            },
            registration: registration
              ? {
                  registrationId: registration._id,
                }
              : null,
            violations: violationDetails,
            horse: horse
              ? {
                  horseName: horse.horseName,
                }
              : null,
            raceRound: raceRound
              ? {
                  roundName: raceRound.roundName,
                  raceDate: raceRound.raceDate,
                  trackLength: raceRound.trackLength,
                  location: raceRound.location,
                  raceGround: raceRound.raceGround,
                }
              : null,
            tournament: tournament
              ? {
                  tournamentName: tournament.tournamentName,
                }
              : null,
          };
        }),
      );

      // Sort by raceDate descending
      result.sort((a, b) => {
        const dateA = a.raceRound?.raceDate
          ? new Date(a.raceRound.raceDate)
          : new Date(0);
        const dateB = b.raceRound?.raceDate
          ? new Date(b.raceRound.raceDate)
          : new Date(0);
        return dateB - dateA;
      });

      return {
        code: 200,
        data: result,
        msg: "Race history retrieved successfully",
      };
    } catch (error) {
      return {
        code: 500,
        msg: error.message,
      };
    }
  }
}

module.exports = new JockeyService();
