const RegistrationService = require('../services/RegistrationService');

class RegistrationController {
    async createRegistration(req, res, next) {
        try {
            const data = req.body;
            const result = await RegistrationService.createRegistration(data);
            return res.status(result.code).json(result);
        } catch (err) {
            next(err);
        }
    }

    async getRegistrationById(req, res, next) {
        try {
            const { id } = req.params;
            const result = await RegistrationService.getRegistrationById(id);
            return res.status(result.code).json(result);
        } catch (err) {
            next(err);
        }
    }

    async getRegistrationsByOwnerId(req, res, next) {
        try {
            const { ownerId } = req.params;
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 10;
            const result = await RegistrationService.getRegistrationsByOwnerId(ownerId, page, limit);
            return res.status(result.code).json(result);
        } catch (err) {
            next(err);
        }
    }
    async updateRegistration(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const result = await RegistrationService.updateRegistration(id, updateData);
            return res.status(result.code).json(result);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new RegistrationController();
