const JockeyRepository = require('../repositories/JockeyRepository');
const UserRepository = require('../repositories/UserRepository');

class JockeyService {
    // Create jockey profile for existing user (public)
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



    // Get jockey profile
    async getJockeyProfile(jockeyId) {
        try {
            const jockey = await JockeyRepository.findByJockeyId(jockeyId);
            if (!jockey) {
                return {
                    code: 404,
                    msg: 'Jockey profile not found',
                };
            }
            return {
                code: 200,
                data: jockey,
                msg: 'Jockey profile retrieved successfully',
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
                msg: 'Top jockeys retrieved successfully',
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
                    msg: 'Jockey not found',
                };
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
                    msg: 'Jockey not found',
                };
            }

            const updatedJockey = await JockeyRepository.updateById(jockey._id, updateData);
            return {
                code: 200,
                data: updatedJockey,
                msg: 'Jockey profile updated successfully',
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
            const count = await JockeyRepository.count();
            return {
                code: 200,
                data: { jockeys, count },
                msg: 'Jockeys retrieved successfully',
            };
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
            if (!['active', 'inactive', 'retired'].includes(status)) {
                return {
                    code: 400,
                    msg: 'Invalid status',
                };
            }
            const jockeys = await JockeyRepository.findAll(100, 0);
            const filtered = jockeys.filter(j => j.status === status);
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
                    msg: 'Jockey not found',
                };
            }
            const updatedJockey = await JockeyRepository.updateById(jockey._id, {
                totalWins: jockey.totalWins + 1,
                matchesRaced: jockey.matchesRaced + 1,
            });
            return {
                code: 200,
                data: updatedJockey,
                msg: 'Win recorded successfully',
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
                    msg: 'Jockey not found',
                };
            }
            const updatedJockey = await JockeyRepository.updateById(jockey._id, {
                matchesRaced: jockey.matchesRaced + 1,
            });
            return {
                code: 200,
                data: updatedJockey,
                msg: 'Match recorded successfully',
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
