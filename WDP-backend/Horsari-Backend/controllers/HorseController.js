const HorseService = require('../services/HorseService');

class HorseController {
    // Create horse
    async createHorse(req, res) {
        const response = await HorseService.createHorse(req.body);
        return res.status(response.code).json(response);
    }

    // Get horse by ID
    async getHorseById(req, res) {
        const response = await HorseService.getHorseById(req.params.id);
        return res.status(response.code).json(response);
    }

    // Get all horses
    async getAllHorses(req, res) {
        const limit = parseInt(req.query.limit) || 10;
        const skip = parseInt(req.query.skip) || 0;
        const response = await HorseService.getAllHorses(limit, skip);
        return res.status(response.code).json(response);
    }

    // Get horses by owner ID
    async getHorsesByOwnerId(req, res) {
        const response = await HorseService.getHorsesByOwnerId(req.params.ownerId);
        return res.status(response.code).json(response);
    }

    // Search horses by owner ID with keywords
    async searchHorsesByOwnerWithKeywords(req, res) {
        const { keywords } = req.body;
        const response = await HorseService.searchHorsesByOwnerWithKeywords(
            req.params.ownerId,
            keywords
        );
        return res.status(response.code).json(response);
    }

    // Update horse
    async updateHorse(req, res) {
        const response = await HorseService.updateHorse(req.params.id, req.body);
        return res.status(response.code).json(response);
    }

    // Delete horse
    async deleteHorse(req, res) {
        const response = await HorseService.deleteHorse(req.params.id);
        return res.status(response.code).json(response);
    }

    // Get horse stats
    async getHorseStats(req, res) {
        const response = await HorseService.getHorseStats();
        return res.status(response.code).json(response);
    }
}

module.exports = new HorseController();
