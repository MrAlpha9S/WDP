const HorseOwnerService = require('../services/HorseOwnerService');

class HorseOwnerController {
    // (admin register removed)

    // Create horse owner profile for existing user (public)
    async createHorseOwner(req, res) {
        const { uid } = req.params;
        const response = await HorseOwnerService.createHorseOwner(uid, req.body);
        return res.status(response.code).json(response);
    }

    // Get horse owner profile
    async getHorseOwnerProfile(req, res) {
        const response = await HorseOwnerService.getHorseOwnerProfile(req.userId);
        return res.status(response.code).json(response);
    }

    // Update horse owner profile
    async updateHorseOwnerProfile(req, res) {
        const response = await HorseOwnerService.updateHorseOwnerProfile(req.userId, req.body);
        return res.status(response.code).json(response);
    }

    // Get my horses
    async getMyHorses(req, res) {
        const limit = parseInt(req.query.limit) || 10;
        const skip = parseInt(req.query.skip) || 0;
        const response = await HorseOwnerService.getOwnedHorses(req.userId, limit, skip);
        return res.status(response.code).json(response);
    }

    // Get my horses statistics
    async getMyHorsesStats(req, res) {
        const response = await HorseOwnerService.getOwnedHorsesStats(req.userId);
        return res.status(response.code).json(response);
    }

    // Get horses by health status
    async getHorsesByHealthStatus(req, res) {
        const { healthStatus } = req.params;
        const response = await HorseOwnerService.getHorsesByHealthStatus(req.userId, healthStatus);
        return res.status(response.code).json(response);
    }

    // Get all horse owners
    async getAllHorseOwners(req, res) {
        const limit = parseInt(req.query.limit) || 10;
        const skip = parseInt(req.query.skip) || 0;
        const response = await HorseOwnerService.getAllHorseOwners(limit, skip);
        return res.status(response.code).json(response);
    }

    // Get horse owner by license
    async getHorseOwnerByLicense(req, res) {
        const { licenseNumber } = req.params;
        const response = await HorseOwnerService.getHorseOwnerByLicense(licenseNumber);
        return res.status(response.code).json(response);
    }
}

module.exports = new HorseOwnerController();
