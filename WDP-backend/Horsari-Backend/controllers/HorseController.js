const HorseService = require('../services/HorseService');
const CloudinaryUtil = require('../utils/CloudinaryUtil');

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
        const response = await HorseService.getHorsesByOwnerId(req.userId);
        return res.status(response.code).json(response);
    }

    // Search horses by owner ID with keywords
    async searchHorsesByOwnerWithKeywords(req, res) {
        const { keywords } = req.body;
        const response = await HorseService.searchHorsesByOwnerWithKeywords(
            req.userId,
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
    // Upload horse image (uploads to Cloudinary)
    async uploadHorseImage(req, res) {
        try {
            const { horseId } = req.params;
            if (!horseId) return res.status(400).json({ code: 400, msg: 'horseId is required' });
            if (!req.file || !req.file.buffer) return res.status(400).json({ code: 400, msg: 'Image file is required' });

            // Verify ownership: horse must belong to req.userId (horse owner)
            const horseRes = await HorseService.getHorseById(horseId);
            if (horseRes.code !== 200) return res.status(horseRes.code).json(horseRes);
            const horse = horseRes.data;
            if (!horse) return res.status(404).json({ code: 404, msg: 'Horse not found' });

            // If authenticated user is not owner, forbid
            // Assume req.userId is set by authMiddleware
            console.log('Authenticated user ID:' + req.userId + 'Horse owner ID:' + horse.ownerId._id);
            if (String(horse.ownerId._id) !== String(req.userId)) {
                return res.status(403).json({ code: 403, msg: 'You are not the owner of this horse' });
            }

            // Upload buffer to Cloudinary under folder 'horses'
            const secureUrl = await CloudinaryUtil.CloudinaryUtil.uploadFile(req.file.buffer, req.file.originalname, 'horses');

            // Save URL to horse record
            const response = await HorseService.updateHorse(horseId, { img: secureUrl });
            return res.status(response.code).json(response);
        } catch (error) {
            return res.status(500).json({ code: 500, msg: error.message });
        }
    }
}



module.exports = new HorseController();
