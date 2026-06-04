const Referee = require('../entities/Referee');

class RefereeRepository {
    // Create
    async create(refereeData) {
        const referee = new Referee(refereeData);
        return await referee.save();
    }

    // Read
    async findById(id) {
        return await Referee.findById(id).populate('refereeid');
    }

    async findByRefereeId(refereeId) {
        return await Referee.findOne({ refereeId }).populate('refereeId');
    }

    async findAll(limit = 10, skip = 0) {
        return await Referee.find()
            .populate('refereeId')
            .limit(limit)
            .skip(skip);
    }

    async findByCertificationNumber(certificationNumber) {
        return await Referee.findOne({
            certificationNumber,
        }).populate('refereeid');
    }

    async findByLicenseNumber(licenseNumber) {
        return await Referee.findOne({ licenseNumber }).populate(
            'refereeId'
        );
    }

    // Update
    async updateById(id, updateData) {
        return await Referee.findByIdAndUpdate(id, updateData, {
            new: true,
        }).populate('refereeId');
    }

    async updateByRefereeId(refereeId, updateData) {
        return await Referee.findOneAndUpdate({ refereeId }, updateData, {
            new: true,
        }).populate('refereeId');
    }

    // Delete
    async deleteById(id) {
        return await Referee.findByIdAndDelete(id);
    }

    async deleteByRefereeId(refereeId) {
        return await Referee.findOneAndDelete({ refereeId });
    }

    // Count
    async count() {
        return await Referee.countDocuments();
    }
}

module.exports = new RefereeRepository();
