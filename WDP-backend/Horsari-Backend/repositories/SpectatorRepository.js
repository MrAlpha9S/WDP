const Spectator = require('../entities/Spectator');

class SpectatorRepository {
    // Create
    async create(spectatorData) {
        const spectator = new Spectator(spectatorData);
        return await spectator.save();
    }

    // Read
    async findById(id) {
        return await Spectator.findById(id).populate('_id');
    }

    async findBySpectatorId(spectatorId) {
        return await Spectator.findById(spectatorId).populate('_id');
    }

    async findAll(limit = 10, skip = 0) {
        return await Spectator.find()
            .populate('_id')
            .limit(limit)
            .skip(skip);
    }

    // Update
    async updateById(id, updateData) {
        return await Spectator.findByIdAndUpdate(id, updateData, {
            new: true,
        }).populate('_id');
    }

    async updateBySpectatorId(spectatorId, updateData) {
        return await Spectator.findByIdAndUpdate(spectatorId, updateData, {
            new: true,
        }).populate('_id');
    }

    // Delete
    async deleteById(id) {
        return await Spectator.findByIdAndDelete(id);
    }

    async deleteBySpectatorId(spectatorId) {
        return await Spectator.findByIdAndDelete(spectatorId);
    }

    // Count
    async count() {
        return await Spectator.countDocuments();
    }
}

module.exports = new SpectatorRepository();
