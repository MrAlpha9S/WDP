const RegistrationRepository = require('../repositories/RegistrationRepository');
const HorseOwnerService = require('./HorseOwnerService');
/** 
 * returns{
 * data:fsd,
 * code:200,
 * message:"success"
 * }
 */
class RegistrationService {
    async createRegistration(data) {
        return await RegistrationRepository.createRegistration(data);
    }
    async getRegistrationById(id) {
        if (!id) {
            return {
                code: 400,
                message: "Registration ID is required",
            };
        }
        const registration = await RegistrationRepository.findById(id);
        if (!registration) {
            return {
                code: 404,
                message: "Registration not found",
            };
        }
        return {
            code: 200,
            message: "Success",
            data: registration
        };
    }
    async getRegistrationsByOwnerId(ownerId, page = 1, limit = 10) {
        const horseOwnerProfile = await HorseOwnerService.getHorseOwnerProfile(ownerId);
        if (!horseOwnerProfile) {
            return {
                code: 404,
                message: "Horse owner not found",
            };
        }
        return await RegistrationRepository.findByOwnerId(ownerId, page, limit);
    }
    async updateRegistration(id, updateData) {
        const registration = await RegistrationRepository.findById(id);
        if (!registration) {
            return {
                code: 404,
                message: "Registration not found",
            };
        }
        const updatedRegistration = await RegistrationRepository.updateRegistration(id, updateData);
        return {
            code: 200,
            message: "Registration updated successfully",
            data: updatedRegistration
        };
    }
}

module.exports = new RegistrationService();