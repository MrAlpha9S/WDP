const SpectatorRepository = require('../repositories/SpectatorRepository');
const UserRepository = require('../repositories/UserRepository');
const ProfileUpdateUtil = require('../utils/ProfileUpdateUtil');

class ProfileService {
    // Self-service profile update — spectator has no role-specific editable
    // fields (only `wallet`, which is system-managed via deposit/withdraw),
    // so this only ever touches the shared User fields.
    async updateProfile(spectatorId, updateData) {
        try {
            const { userFields, error } = ProfileUpdateUtil.buildUserFieldUpdates(updateData);
            if (error) return { code: 400, msg: error };
            if (Object.keys(userFields).length) {
                await UserRepository.updateById(spectatorId, userFields);
            }
            return this.getSpectatorProfile(spectatorId);
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getSpectatorProfile(spectatorId) {
        try {
            const spectator = await SpectatorRepository.findBySpectatorId(spectatorId);
            if (!spectator) {
                return { code: 404, msg: 'Spectator profile not found' };
            }

            const user = await UserRepository.findById(spectatorId);

            const Prediction = require('../entities/Prediction');
            const [totalPredictions, totalCorrectPredictions] = await Promise.all([
                Prediction.countDocuments({ spectatorId }),
                Prediction.countDocuments({ spectatorId, predictionStatus: 'correct' }),
            ]);
            const winRate = totalPredictions > 0
                ? parseFloat(((totalCorrectPredictions / totalPredictions) * 100).toFixed(2))
                : 0;

            return {
                code: 200,
                data: {
                    spectator: { _id: spectator._id, wallet: spectator.wallet },
                    user: user ? {
                        fullName: user.fullName,
                        username: user.username,
                        email: user.email,
                        dateOfBirth: user.dateOfBirth || null,
                        phoneNumber: user.phoneNumber || null,
                        image: user.image || null,
                        address: user.address || null,
                        status: user.status,
                    } : null,
                    stats: { totalPredictions, totalCorrectPredictions, winRate },
                },
                msg: 'Spectator profile retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new ProfileService();
