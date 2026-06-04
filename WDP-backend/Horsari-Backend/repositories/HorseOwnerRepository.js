const HorseOwner = require('../entities/HorseOwner');

class HorseOwnerRepository {
    // Create
    async create(horseOwnerData) {
        const horseOwner = new HorseOwner(horseOwnerData);
        return await horseOwner.save();
    }

    // Read
    async findById(id) {
        return await HorseOwner.findById(id).populate('_id');
    }

    async findByOwnerId(ownerId) {
        return await HorseOwner.findById(ownerId).populate('_id');
    }

    async findAll(limit = 10, skip = 0) {
        return await HorseOwner.find()
            .populate('_id')
            .limit(limit)
            .skip(skip);
    }

    async findByLicenseNumber(licenseNumber) {
        return await HorseOwner.findOne({ licenseNumber }).populate('_id');
    }

    // Update
    async updateById(id, updateData) {
        return await HorseOwner.findByIdAndUpdate(id, updateData, {
            new: true,
        }).populate('_id');
    }

    async updateByOwnerId(ownerId, updateData) {
        return await HorseOwner.findByIdAndUpdate(ownerId, updateData, {
            new: true,
        }).populate('_id');
    }

    // Delete
    async deleteById(id) {
        return await HorseOwner.findByIdAndDelete(id);
    }

    async deleteByOwnerId(ownerId) {
        return await HorseOwner.findByIdAndDelete(ownerId);
    }

    // Count
    async count() {
        return await HorseOwner.countDocuments();
    }

    async countByLicenseStatus(status) {
        return await HorseOwner.countDocuments({ license_status: status });
    }
}

module.exports = new HorseOwnerRepository();
