const HorseOwnerProfileService = require('../../services/HorseOwnerProfileService');

class ProfileController {
    // Self-service — GET/PUT my own profile (distinct from getJockeyProfile,
    // which is this owner viewing a jockey's profile)
    async getMyProfile(req, res) {
        const response = await HorseOwnerProfileService.getMyProfile(req.userId);
        return res.status(response.code).json(response);
    }

    async updateMyProfile(req, res) {
        const response = await HorseOwnerProfileService.updateMyProfile(req.userId, req.body);
        return res.status(response.code).json(response);
    }

    // Self-service — re-upload license PDF (resets licenseStatus to pending)
    async updateMyLicense(req, res) {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ code: 400, msg: 'License PDF is required' });
        }
        const response = await HorseOwnerProfileService.updateMyLicense(req.userId, req.file.buffer, req.file.originalname);
        return res.status(response.code).json(response);
    }
}

module.exports = new ProfileController();
