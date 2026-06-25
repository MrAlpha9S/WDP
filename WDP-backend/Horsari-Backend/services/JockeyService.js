const JockeyRepository = require("../repositories/JockeyRepository");
const UserRepository = require("../repositories/UserRepository");
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
  async getAllJockeys(page = 1, limit = 10, sortBy = 'createdAt', order = 'desc') {
    try {
      const skip = (page - 1) * limit;
      const sortObj = { [sortBy]: order === 'asc' ? 1 : -1 };
      const [jockeys, totalItems] = await Promise.all([
        JockeyRepository.findAll(limit, skip, sortObj),
        JockeyRepository.count(),
      ]);
      const items = jockeys.map((i) => {
        const { _id, ...rest } = i.toObject();
        const { passwordHash, ...rest2 } = i._id.toObject();
        return Object.assign({}, rest, rest2);
      });
      return {
        code: 200,
        data: {
          items,
          pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit },
        },
        msg: "Jockeys retrieved successfully",
      };
    } catch (error) {
      return { code: 500, msg: error.message };
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

  // Get my invitations (pending or accepted)
  async getMyInvitations(jockeyId, page = 1, limit = 10, status = null, sortBy = 'createdAt', order = 'desc') {
    try {
      const jockey = await JockeyRepository.findByJockeyId(jockeyId);
      if (!jockey) {
        return {
          code: 404,
          msg: "Jockey not found",
        };
      }

      const skip = (page - 1) * limit;
      const statusFilter = status
        ? { $in: [status] }
        : { $in: ['pending', 'accepted', 'declined', 'cancelled'] };
      const filter = { jockeyId: jockey._id, invitationStatus: statusFilter };
      const DB_SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'invitationStatus', 'percentagePayout']);
      const dbSort = DB_SORT_FIELDS.has(sortBy)
        ? { [sortBy]: order === 'asc' ? 1 : -1 }
        : { createdAt: -1 };

      const [invitations, totalItems] = await Promise.all([
        Invitation.find(filter).sort(dbSort).skip(skip).limit(limit).lean(),
        Invitation.countDocuments(filter),
      ]);

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
            isJockeyInRace: registration?.jockeyInRaceId?.toString() === inv._id.toString(),
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
                  user: horseOwnerUser
                    ? {
                        fullName: horseOwnerUser.fullName,
                        phoneNumber: horseOwnerUser.phoneNumber || null,
                      }
                    : null,
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

      if (sortBy === 'raceDate') {
        result.sort((a, b) => {
          const valA = a.raceRound?.raceDate ? new Date(a.raceRound.raceDate) : new Date(0);
          const valB = b.raceRound?.raceDate ? new Date(b.raceRound.raceDate) : new Date(0);
          return order === 'asc' ? valA - valB : valB - valA;
        });
      }

      return {
        code: 200,
        data: {
          items: result,
          pagination: {
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page,
            limit,
          },
        },
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

      // Check if invitation is still pending (covers all re-respond cases)
      if (invitation.invitationStatus !== "pending") {
        return {
          code: 400,
          msg: "Cannot respond to a non-pending invitation",
        };
      }

      // Update invitation
      // Map "rejected" (mobile term) → "declined" (DB enum value)
      if (jockeyConfirmation === "accepted") {
        invitation.jockeyConfirmation = true;
        invitation.invitationStatus = "accepted";
      } else {
        invitation.jockeyConfirmation = false;
        invitation.invitationStatus = "declined";
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
  async getMyRaceSchedule(jockeyId, page = 1, limit = 10, sortBy = 'raceDate', order = 'asc') {
    try {
      const jockey = await JockeyRepository.findByJockeyId(jockeyId);
      if (!jockey) {
        return {
          code: 404,
          msg: "Jockey not found",
        };
      }

      const skip = (page - 1) * limit;
      const filter = { jockeyId: jockey._id, invitationStatus: "accepted" };
      const DB_SORT_FIELDS = new Set(['createdAt', 'updatedAt']);
      const dbSort = DB_SORT_FIELDS.has(sortBy)
        ? { [sortBy]: order === 'asc' ? 1 : -1 }
        : { createdAt: -1 };

      const [invitations, totalItems] = await Promise.all([
        Invitation.find(filter).sort(dbSort).skip(skip).limit(limit).lean(),
        Invitation.countDocuments(filter),
      ]);

      const result = await Promise.all(
        invitations.map(async (inv) => {
          const registration = await Registration.findById(
            inv.registrationId,
          ).lean();
          const horse = inv.horseId ? await Horse.findById(inv.horseId).lean() : null;
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
            invitationId: inv._id,
            isBackup: inv.isBackup,
            percentagePayout: inv.percentagePayout,
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
                  user: horseOwnerUser
                    ? { fullName: horseOwnerUser.fullName }
                    : null,
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

      if (sortBy === 'raceDate') {
        result.sort((a, b) => {
          const valA = a.raceRound?.raceDate ? new Date(a.raceRound.raceDate) : new Date(0);
          const valB = b.raceRound?.raceDate ? new Date(b.raceRound.raceDate) : new Date(0);
          return order === 'asc' ? valA - valB : valB - valA;
        });
      }

      return {
        code: 200,
        data: {
          items: result,
          pagination: {
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page,
            limit,
          },
        },
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
  async getMyRaceHistory(jockeyId, page = 1, limit = 10, sortBy = 'raceDate', order = 'desc') {
    try {
      const jockey = await JockeyRepository.findByJockeyId(jockeyId);
      if (!jockey) {
        return {
          code: 404,
          msg: "Jockey not found",
        };
      }

      // Collect all registrationIds from accepted invitations (no pagination here — just ID lookup)
      const invitations = await Invitation.find({
        jockeyId: jockey._id,
        invitationStatus: "accepted",
      }).lean();

      const registrationIds = invitations.map((inv) => inv.registrationId);

      // Paginate at the RaceResult level
      const skip = (page - 1) * limit;
      const resultFilter = { registrationId: { $in: registrationIds } };
      const DB_SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'finishPosition', 'prizeMoney']);
      const dbSort = DB_SORT_FIELDS.has(sortBy)
        ? { [sortBy]: order === 'asc' ? 1 : -1 }
        : { createdAt: -1 };

      const [raceResults, totalItems] = await Promise.all([
        RaceResult.find(resultFilter).sort(dbSort).skip(skip).limit(limit).lean(),
        RaceResult.countDocuments(resultFilter),
      ]);

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

      if (sortBy === 'raceDate') {
        result.sort((a, b) => {
          const valA = a.raceRound?.raceDate ? new Date(a.raceRound.raceDate) : new Date(0);
          const valB = b.raceRound?.raceDate ? new Date(b.raceRound.raceDate) : new Date(0);
          return order === 'asc' ? valA - valB : valB - valA;
        });
      }

      return {
        code: 200,
        data: {
          items: result,
          pagination: {
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page,
            limit,
          },
        },
        msg: "Race history retrieved successfully",
      };
    } catch (error) {
      return {
        code: 500,
        msg: error.message,
      };
    }
  }

  // Get horse detail with full race history
  async getHorseDetail(horseId) {
    try {
      const horse = await Horse.findById(horseId).lean();
      if (!horse) {
        return { code: 404, msg: 'Horse not found' };
      }

      const horseOwner = await HorseOwner.findById(horse.ownerId).lean();
      const ownerUser = horseOwner ? await UserRepository.findById(horseOwner._id) : null;

      // Collect unique registrationIds from all invitations for this horse
      const invitations = await Invitation.find({ horseId: horse._id }).lean();
      const seenRegistrationIds = new Set();
      const uniqueRegistrationIds = [];
      for (const inv of invitations) {
        const key = String(inv.registrationId);
        if (inv.registrationId && !seenRegistrationIds.has(key)) {
          seenRegistrationIds.add(key);
          uniqueRegistrationIds.push(inv.registrationId);
        }
      }

      const raceHistory = await Promise.all(
        uniqueRegistrationIds.map(async (registrationId) => {
          const registration = await Registration.findById(registrationId).lean();
          const raceRound = registration
            ? await RaceRound.findById(registration.raceRoundId).lean()
            : null;
          const raceResult = registration
            ? await RaceResult.findOne({ registrationId: registration._id }).lean()
            : null;

          return {
            registration: registration
              ? {
                  registrationId: registration._id,
                  registrationStatus: registration.registrationStatus,
                  registeredAt: registration.registeredAt,
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
                }
              : null,
            raceResult: raceResult
              ? {
                  resultId: raceResult._id,
                  finishPosition: raceResult.finishPosition,
                  finishTime: raceResult.finishTime,
                  prizeMoney: raceResult.prizeMoney,
                  resultStatus: raceResult.resultStatus,
                }
              : null,
          };
        }),
      );

      // Sort by raceDate descending (most recent first)
      raceHistory.sort((a, b) => {
        const dateA = a.raceRound?.raceDate ? new Date(a.raceRound.raceDate) : new Date(0);
        const dateB = b.raceRound?.raceDate ? new Date(b.raceRound.raceDate) : new Date(0);
        return dateB - dateA;
      });

      return {
        code: 200,
        data: {
          horse: {
            horseId: horse._id,
            horseName: horse.horseName,
            breed: horse.breed,
            gender: horse.gender,
            healthStatus: horse.healthStatus,
            dateOfBirth: horse.dateOfBirth,
            status: horse.status,
            img: horse.img,
          },
          owner: {
            ownerId: horseOwner?._id ?? null,
            fullName: ownerUser?.fullName ?? null,
          },
          raceHistory,
        },
        msg: 'Horse detail retrieved successfully',
      };
    } catch (error) {
      return { code: 500, msg: error.message };
    }
  }

  // View race history — only races where this jockey was the confirmed official rider (jockeyInRaceId)
  async getViewRaceHistory(jockeyId, page = 1, limit = 10, sortBy = 'raceDate', order = 'desc') {
    try {
      const jockey = await JockeyRepository.findByJockeyId(jockeyId);
      if (!jockey) {
        return { code: 404, msg: 'Jockey not found' };
      }

      // All invitations belonging to this jockey (we need their _ids to match jockeyInRaceId)
      const invitations = await Invitation.find({ jockeyId: jockey._id }).lean();
      const invitationIds = invitations.map((inv) => inv._id);

      // Registrations where this jockey was the official rider
      const skip = (page - 1) * limit;
      const filter = { jockeyInRaceId: { $in: invitationIds } };
      const DB_SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'registeredAt', 'registrationStatus']);
      const dbSort = DB_SORT_FIELDS.has(sortBy)
        ? { [sortBy]: order === 'asc' ? 1 : -1 }
        : { createdAt: -1 };

      const [registrations, totalItems] = await Promise.all([
        Registration.find(filter).sort(dbSort).skip(skip).limit(limit).lean(),
        Registration.countDocuments(filter),
      ]);

      const result = await Promise.all(
        registrations.map(async (reg) => {
          // Resolve horse via the linked invitation
          const linkedInvitation = invitations.find(
            (inv) => inv._id.toString() === reg.jockeyInRaceId?.toString(),
          );
          const horse = linkedInvitation
            ? await Horse.findById(linkedInvitation.horseId).lean()
            : null;

          const raceRound = await RaceRound.findById(reg.raceRoundId).lean();
          const tournament = raceRound
            ? await Tournament.findById(raceRound.tournamentId).lean()
            : null;
          const raceResult = await RaceResult.findOne({ registrationId: reg._id }).lean();

          const violations = await Violation.find({ registrationId: reg._id }).lean();
          const violationDetails = await Promise.all(
            violations.map(async (v) => {
              const violationType = await ViolationType.findById(v.violationTypeId).lean();
              return {
                description: v.description,
                actualPenalty: v.actualPenalty,
                violationStatus: v.violationStatus,
                violationName: violationType ? violationType.violationName : 'Unknown',
              };
            }),
          );

          return {
            registration: {
              registrationId: reg._id,
              registrationStatus: reg.registrationStatus,
              registeredAt: reg.registeredAt,
            },
            horse: horse
              ? {
                  horseId: horse._id,
                  horseName: horse.horseName,
                  breed: horse.breed,
                  gender: horse.gender,
                  healthStatus: horse.healthStatus,
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
                }
              : null,
            tournament: tournament
              ? {
                  tournamentId: tournament._id,
                  tournamentName: tournament.tournamentName,
                }
              : null,
            raceResult: raceResult
              ? {
                  resultId: raceResult._id,
                  finishPosition: raceResult.finishPosition,
                  finishTime: raceResult.finishTime,
                  prizeMoney: raceResult.prizeMoney,
                  resultStatus: raceResult.resultStatus,
                }
              : null,
            violations: violationDetails,
          };
        }),
      );

      if (sortBy === 'raceDate') {
        result.sort((a, b) => {
          const valA = a.raceRound?.raceDate ? new Date(a.raceRound.raceDate) : new Date(0);
          const valB = b.raceRound?.raceDate ? new Date(b.raceRound.raceDate) : new Date(0);
          return order === 'asc' ? valA - valB : valB - valA;
        });
      }

      return {
        code: 200,
        data: {
          items: result,
          pagination: {
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page,
            limit,
          },
        },
        msg: 'Race history retrieved successfully',
      };
    } catch (error) {
      return { code: 500, msg: error.message };
    }
  }
  // Mobile: flat ScheduleItem[] with invitationId, isBackup, percentagePayout, nested horseOwner.user
  async getMyRaceScheduleFlat(jockeyId) {
    try {
      const jockey = await JockeyRepository.findByJockeyId(jockeyId);
      if (!jockey) return { code: 404, msg: 'Jockey not found' };

      const invitations = await Invitation.find({
        jockeyId: jockey._id,
        invitationStatus: 'accepted',
      }).sort({ createdAt: -1 }).lean();

      const result = await Promise.all(
        invitations.map(async inv => {
          const registration = await Registration.findById(inv.registrationId).lean();
          const horse = await Horse.findById(inv.horseId).lean();
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
            horseOwner: horseOwner ? {
              ownerId: horseOwner._id,
              user: horseOwnerUser ? { fullName: horseOwnerUser.fullName } : null,
            } : null,
            raceRound: raceRound ? {
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
            } : null,
            tournament: tournament ? {
              tournamentName: tournament.tournamentName,
              startDate: tournament.startDate,
              endDate: tournament.endDate,
            } : null,
          };
        }),
      );

      // Sort by raceDate ascending
      result.sort((a, b) => {
        const da = a.raceRound?.raceDate ? new Date(a.raceRound.raceDate) : new Date(0);
        const db = b.raceRound?.raceDate ? new Date(b.raceRound.raceDate) : new Date(0);
        return da - db;
      });

      return { code: 200, data: result, msg: 'Race schedule retrieved successfully' };
    } catch (error) {
      return { code: 500, msg: error.message };
    }
  }

  // Mobile: flat InvitationItem[] with nested horseOwner.user
  async getMyInvitationsFlat(jockeyId, status = null) {
    try {
      const jockey = await JockeyRepository.findByJockeyId(jockeyId);
      if (!jockey) return { code: 404, msg: 'Jockey not found' };

      const statusFilter = status ? { $in: [status] } : { $in: ['pending', 'accepted', 'declined', 'cancelled'] };
      const invitations = await Invitation.find({
        jockeyId: jockey._id,
        invitationStatus: statusFilter,
      }).sort({ createdAt: -1 }).lean();

      const result = await Promise.all(
        invitations.map(async inv => {
          const horse = await Horse.findById(inv.horseId).lean();
          const registration = await Registration.findById(inv.registrationId).lean();
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
            horseOwner: horseOwner ? {
              ownerId: horseOwner._id,
              user: horseOwnerUser ? {
                fullName: horseOwnerUser.fullName,
                phoneNumber: horseOwnerUser.phoneNumber || null,
              } : null,
            } : null,
            raceRound: raceRound ? {
              raceRoundId: raceRound._id,
              roundName: raceRound.roundName,
              raceDate: raceRound.raceDate || null,
              trackLength: raceRound.trackLength,
              location: raceRound.location,
              raceGround: raceRound.raceGround,
              status: raceRound.status,
              minimalRidingFees: raceRound.minimalRidingFees,
            } : null,
            tournament: tournament ? {
              tournamentId: tournament._id,
              tournamentName: tournament.tournamentName,
            } : null,
          };
        }),
      );

      return { code: 200, data: result, msg: 'Invitations retrieved successfully' };
    } catch (error) {
      return { code: 500, msg: error.message };
    }
  }

  // Mobile: respond by invitationId from URL param
  async respondToInvitationById(jockeyId, invitationId, jockeyConfirmation) {
    return this.respondToInvitation(jockeyId, { invitationId, jockeyConfirmation });
  }
}

module.exports = new JockeyService();
