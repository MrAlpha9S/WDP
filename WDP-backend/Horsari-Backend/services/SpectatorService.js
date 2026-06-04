const SpectatorRepository = require('../repositories/SpectatorRepository');
const UserRepository = require('../repositories/UserRepository');

class SpectatorService {
    // Create spectator profile for existing user (public)
    async createSpectator(spectatorId, data) {
        try {
            const { rewardPoints } = data || {};

            if (!spectatorId) {
                return { code: 400, msg: 'spectatorId is required' };
            }

            const user = await UserRepository.findById(spectatorId);
            if (!user) {
                return { code: 404, msg: 'User not found' };
            }

            const existing = await SpectatorRepository.findBySpectatorId(spectatorId);
            if (existing) {
                return { code: 409, msg: 'Spectator profile already exists' };
            }

            const spectatorProfile = await SpectatorRepository.create({
                _id: spectatorId,
                rewardPoints: rewardPoints || 0,
            });

            return { code: 201, data: spectatorProfile, msg: 'Spectator profile created successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }



    // Get spectator profile
    async getSpectatorProfile(spectatorId) {
        try {
            const spectator = await SpectatorRepository.findBySpectatorId(spectatorId);
            if (!spectator) {
                return {
                    code: 404,
                    msg: 'Spectator profile not found',
                };
            }
            return {
                code: 200,
                data: spectator,
                msg: 'Spectator profile retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get all spectators
    async getAllSpectators(limit = 10, skip = 0) {
        try {
            const spectators = await SpectatorRepository.findAll(limit, skip);
            const count = await SpectatorRepository.count();
            return {
                code: 200,
                data: { spectators, count },
                msg: 'Spectators retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get spectator reward points
    async getRewardPoints(spectatorId) {
        try {
            const spectator = await SpectatorRepository.findBySpectatorId(spectatorId);
            if (!spectator) {
                return {
                    code: 404,
                    msg: 'Spectator not found',
                };
            }
            return {
                code: 200,
                data: {
                    rewardPoints: spectator.rewardPoints,
                },
                msg: 'Reward points retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Add reward points
    async addRewardPoints(spectatorId, points) {
        try {
            if (!points || points <= 0) {
                return {
                    code: 400,
                    msg: 'Points must be greater than 0',
                };
            }
            const spectator = await SpectatorRepository.findBySpectatorId(spectatorId);
            if (!spectator) {
                return {
                    code: 404,
                    msg: 'Spectator not found',
                };
            }

            const updatedSpectator = await SpectatorRepository.addRewardPoints(spectator._id, points);
            return {
                code: 200,
                data: updatedSpectator,
                msg: `${points} reward points added successfully`,
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Deduct reward points
    async deductRewardPoints(spectatorId, points) {
        try {
            if (!points || points <= 0) {
                return {
                    code: 400,
                    msg: 'Points must be greater than 0',
                };
            }
            const spectator = await SpectatorRepository.findBySpectatorId(spectatorId);
            if (!spectator) {
                return {
                    code: 404,
                    msg: 'Spectator not found',
                };
            }

            if (spectator.rewardPoints < points) {
                return {
                    code: 400,
                    msg: 'Insufficient reward points',
                };
            }

            const updatedSpectator = await SpectatorRepository.addRewardPoints(spectator._id, -points);
            return {
                code: 200,
                data: updatedSpectator,
                msg: `${points} reward points deducted successfully`,
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get top spectators by reward points
    async getTopSpectators(limit = 10) {
        try {
            const spectators = await SpectatorRepository.findAll(limit, 0);
            const sorted = spectators.sort((a, b) => b.rewardPoints - a.rewardPoints);
            return {
                code: 200,
                data: { spectators: sorted.slice(0, limit), count: sorted.length },
                msg: 'Top spectators retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Update spectator profile
    async updateSpectatorProfile(spectatorId, updateData) {
        try {
            const spectator = await SpectatorRepository.findBySpectatorId(spectatorId);
            if (!spectator) {
                return {
                    code: 404,
                    msg: 'Spectator not found',
                };
            }
            const updatedSpectator = await SpectatorRepository.updateById(spectator._id, updateData);
            return {
                code: 200,
                data: updatedSpectator,
                msg: 'Spectator profile updated successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }
}

module.exports = new SpectatorService();
