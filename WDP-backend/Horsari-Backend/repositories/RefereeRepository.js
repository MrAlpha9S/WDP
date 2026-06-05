const Referee = require('../entities/Referee');

class RefereeRepository {
    // Create
    async create(refereeData) {
        const referee = new Referee(refereeData);
        return await referee.save();
    }

    // Read
    async findById(id) {
        return await Referee.findById(id).populate('_id');
    }

    async findByRefereeId(refereeId) {
        return await Referee.findById(refereeId).populate('_id');
    }

    async findAll(limit = 10, skip = 0) {
        return await Referee.find()
            .populate('_id')
            .limit(limit)
            .skip(skip);
    }

    async findByCertificationNumber(certificationNumber) {
        return await Referee.findOne({
            certificationNumber,
        }).populate('_id');
    }

    async findByLicenseNumber(licenseNumber) {
        return await Referee.findOne({ licenseNumber }).populate(
            '_id'
        );
    }

    // Update
    async updateById(id, updateData) {
        return await Referee.findByIdAndUpdate(id, updateData, {
            new: true,
        }).populate('_id');
    }

    async updateByRefereeId(refereeId, updateData) {
        return await Referee.findByIdAndUpdate(refereeId, updateData, {
            new: true,
        }).populate('_id');
    }

    // Delete
    async deleteById(id) {
        return await Referee.findByIdAndDelete(id);
    }

    async deleteByRefereeId(refereeId) {
        return await Referee.findByIdAndDelete(refereeId);
    }

    // Count
    async count() {
        return await Referee.countDocuments();
    }
}

module.exports = new RefereeRepository();
