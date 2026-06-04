const Registration= require('../entities/Registration');

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
    async updateRegistration(id, updateData) {
        return await Registration.findByIdAndUpdate(id, updateData, { new: true });
    }
    async deleteRegistration(id) {
        return await Registration.findByIdAndDelete(id);
    }

}

module.exports = new RegistrationRepository();