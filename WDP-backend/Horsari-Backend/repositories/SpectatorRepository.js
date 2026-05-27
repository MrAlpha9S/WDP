const Spectator = require('../entities/Spectator');

class SpectatorRepository {
    // Create
    async create(spectatorData) {
        const spectator = new Spectator(spectatorData);
        return await spectator.save();
    }

    // Read
    async findById(id) {
        return await Spectator.findById(id).populate('spectatorid');
    }

    async findBySpectatorId(spectatorId) {
        return await Spectator.findOne({ spectatorId }).populate('spectatorId');
    }

    async findAll(limit = 10, skip = 0) {
        return await Spectator.find()
            .populate('spectatorId')
            .limit(limit)
            .skip(skip);
    }

    async findByRewardPointsRange(minPoints, maxPoints) {
        return await Spectator.find({
            rewardPoints: { $gte: minPoints, $lte: maxPoints },
        }).populate('spectatorId');
    }

    // Update
    async updateById(id, updateData) {
        return await Spectator.findByIdAndUpdate(id, updateData, {
            new: true,
        }).populate('spectatorId');
    }

    async updateBySpectatorId(spectatorId, updateData) {
        return await Spectator.findOneAndUpdate({ spectatorId }, updateData, {
            new: true,
        }).populate('spectatorId');
    }

    async addRewardPoints(spectatorId, points) {
        return await Spectator.findOneAndUpdate(
            { spectatorId },
            { $inc: { rewardPoints: points } },
            { new: true }
        ).populate('spectatorId');
    }

    // Delete
    async deleteById(id) {
        return await Spectator.findByIdAndDelete(id);
    }

    async deleteBySpectatorId(spectatorId) {
        return await Spectator.findOneAndDelete({ spectatorId });
    }

    // Count
    async count() {
        return await Spectator.countDocuments();
    }
}

module.exports = new SpectatorRepository();
