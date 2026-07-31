const SpectatorProfileService = require('../../services/SpectatorProfileService');

class ProfileController {
    async getSpectatorProfile(req, res) {
        const response = await SpectatorProfileService.getSpectatorProfile(req.userId);
        return res.status(response.code).json(response);
    }

    async updateProfile(req, res) {
        const response = await SpectatorProfileService.updateProfile(req.userId, req.body);
        return res.status(response.code).json(response);
    }
}

module.exports = new ProfileController();
