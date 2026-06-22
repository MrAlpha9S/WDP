const HorseOwnerService = require('../services/HorseOwnerService');
const JockeyService = require('../services/JockeyService');

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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { search, sortBy = 'createdAt', order = 'desc' } = req.query;
        const response = await HorseOwnerService.getOwnedHorses(req.userId, page, limit, search, sortBy, order);
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

    // For horse owners: get all jockeys (with stats if any)
    async getAllJockeys(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { sortBy = 'createdAt', order = 'desc' } = req.query;
        const response = await JockeyService.getAllJockeys(page, limit, sortBy, order);
        return res.status(response.code).json(response);
    }

    // Get horse owner by license
    async getHorseOwnerByLicense(req, res) {
        const { licenseNumber } = req.params;
        const response = await HorseOwnerService.getHorseOwnerByLicense(licenseNumber);
        return res.status(response.code).json(response);
    }

    // Request race start after all registrations reviewed
    async confirmRaceStart(req, res) {
        const { raceRoundId } = req.params;
        const io = req.app.get('io');
        const response = await HorseOwnerService.confirmRaceStart(req.userId, raceRoundId, io);
        return res.status(response.code).json(response);
    }
}

module.exports = new HorseOwnerController();
