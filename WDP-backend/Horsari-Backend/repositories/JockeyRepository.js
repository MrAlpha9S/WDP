const Jockey = require('../entities/Jockey');

class JockeyRepository {
    // Create
    async create(jockeyData) {
        const jockey = new Jockey(jockeyData);
        return await jockey.save();
    }

    // Read
    async findById(id) {
        return await Jockey.findById(id).populate('jockeyid');
    }

    async findByJockeyId(jockeyId) {
        return await Jockey.findOne({ jockeyId }).populate('jockeyId');
    }

    async findAll(limit = 10, skip = 0) {
        return await Jockey.find()
            .populate('jockeyId')
            .limit(limit)
            .skip(skip);
    }

    async findByStatus(status) {
        return await Jockey.find({ status }).populate('jockeyId');
    }

    async findByRanking(minRanking, maxRanking) {
        return await Jockey.find({
            ranking: { $gte: minRanking, $lte: maxRanking },
        }).populate('jockeyId');
    }

    async findTopJockeys(limit = 10) {
        return await Jockey.find()
            .populate('jockeyId')
            .sort({ ranking: 1 })
            .limit(limit);
    }

    // Update
    async updateById(id, updateData) {
        return await Jockey.findByIdAndUpdate(id, updateData, {
            new: true,
        }).populate('jockeyId');
    }

    async updateByJockeyId(jockeyId, updateData) {
        return await Jockey.findOneAndUpdate({ jockeyId }, updateData, {
            new: true,
        }).populate('jockeyId');
    }

    // Delete
    async deleteById(id) {
        return await Jockey.findByIdAndDelete(id);
    }

    async deleteByJockeyId(jockeyId) {
        return await Jockey.findOneAndDelete({ jockeyId });
    }

    // Count
    async count() {
        return await Jockey.countDocuments();
    }

    async countByLicenseStatus(status) {
        return await Jockey.countDocuments({ license_status: status });
    }

    // Stats
    async getStats() {
        return await Jockey.aggregate([
            {
                $group: {
                    _id: null,
                    totalJockeys: { $sum: 1 },
                    totalWins: { $sum: '$totalWins' },
                    avgMatches: { $avg: '$matchesRaced' },
                },
            },
        ]);
    }
}

module.exports = new JockeyRepository();
