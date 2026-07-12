const HorseService = require('../services/HorseService');
const { CloudinaryUtil } = require('../utils/CloudinaryUtil');
const NotificationService = require('../services/NotificationService');

class HorseController {
    // Create horse
    async createHorse(req, res) {
        const response = await HorseService.createHorse({ ...req.body, ownerId: req.userId });
        if (response.code === 200 || response.code === 201) {
            const io = req.app.get('io');
            NotificationService.notify({
                role: 'admin',
                type: 'new_horse',
                title: 'New Horse Added',
                message: `${req.body.horseName ?? 'A horse'} has been registered.`,
                relatedEntityType: 'Horse',
                relatedEntityId: response.data?._id,
            }, io).catch(err => console.error('[createHorse] notify admin error:', err.message));
        }
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
            const secureUrl = await CloudinaryUtil.uploadFile(req.file.buffer, req.file.originalname, 'horses', 'image');

            // Save URL to horse record
            const response = await HorseService.updateHorse(horseId, { img: secureUrl });
            return res.status(response.code).json(response);
        } catch (error) {
            return res.status(500).json({ code: 500, msg: error.message });
        }
    }
}



module.exports = new HorseController();
