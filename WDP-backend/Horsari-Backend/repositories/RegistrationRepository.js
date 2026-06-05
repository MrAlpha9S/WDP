const Registration = require('../entities/Registration');

class RegistrationRepository {
    async createRegistration(data) {
        const registration = new Registration(data);
        return await registration.save();
    }
    async findById(id) {
        return await Registration.findById(id);
    }
    async findByOwnerId(ownerId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        return await Registration.find({ horseOwnerId: ownerId }).skip(skip).limit(limit);
    }
    async findByRaceRoundId(raceRoundId) {
        return await Registration.find({ raceRoundId });
    }
    async updateRegistration(id, updateData) {
        return await Registration.findByIdAndUpdate(id, updateData, { new: true });
    }
    async updateManyByRaceRoundId(raceRoundId, updateData) {
        return await Registration.updateMany({ raceRoundId }, updateData);
    }
    async deleteRegistration(id) {
        return await Registration.findByIdAndDelete(id);
    }

    // Fetch all registrations with nested raceRound + horseOwner→User for admin view
    async findAllWithDetails(page = 1, limit = 5) {
        const skip = (page - 1) * limit;
        return await Registration.find()
            .populate('raceRoundId')
            .populate({
                path: 'horseOwnerId',
                populate: {
                    path: '_id',
                    model: 'User',
                    select: 'fullName email',
                },
            })
            .skip(skip)
            .limit(limit)
            .lean();
    }

    // Get total count of registrations
    async countAll() {
        return await Registration.countDocuments();
    }
}

module.exports = new RegistrationRepository();