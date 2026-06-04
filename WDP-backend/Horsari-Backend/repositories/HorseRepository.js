const Horse = require('../entities/Horse');

class HorseRepository {
    // Create
    async create(horseData) {
        const horse = new Horse(horseData);
        return await horse.save();
    }

    // Read
    async findById(id) {
        return await Horse.findById(id).populate('ownerid');
    }

    async findByOwnerId(ownerId) {
        return await Horse.find({ ownerId }).populate('ownerId');
    }

    async findAll(limit = 10, skip = 0) {
        return await Horse.find()
            .populate('ownerId')
            .limit(limit)
            .skip(skip);
    }

    async findByHorseName(horseName) {
        return await Horse.findOne({ horseName }).populate('ownerId');
    }

    async findByStatus(status) {
        return await Horse.find({ status }).populate('ownerId');
    }

    async findByHealthStatus(healthStatus) {
        return await Horse.find({ healthStatus }).populate(
            'ownerId'
        );
    }

    async findByBreed(breed) {
        return await Horse.find({ breed }).populate('ownerid');
    }

    // Update
    async updateById(id, updateData) {
        return await Horse.findByIdAndUpdate(id, updateData, {
            new: true,
        }).populate('ownerId');
    }

    async updateByHorseName(horseName, updateData) {
        return await Horse.findOneAndUpdate({ horseName }, updateData, {
            new: true,
        }).populate('ownerId');
    }

    // Delete
    async deleteById(id) {
        return await Horse.findByIdAndDelete(id);
    }

    async deleteByOwnerId(ownerId) {
        return await Horse.deleteMany({ ownerId });
    }

    // Count
    async count() {
        return await Horse.countDocuments();
    }

    async countByOwnerId(ownerId) {
        return await Horse.countDocuments({ ownerId });
    }

    // Stats
    async getStats() {
        return await Horse.aggregate([
            {
                $group: {
                    _id: null,
                    totalHorses: { $sum: 1 },
                    activeHorses: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
                    },
                    healthyHorses: {
                        $sum: { $cond: [{ $eq: ['$healthStatus', 'healthy'] }, 1, 0] },
                    },
                },
            },
        ]);
    }

    async getStatsByBreed() {
        return await Horse.aggregate([
            {
                $group: {
                    _id: '$breed',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
        ]);
    }
}

module.exports = new HorseRepository();
