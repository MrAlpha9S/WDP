const RefereeProfileService = require('../../services/RefereeProfileService');

class ProfileController {
    // Self-service — GET/PUT my own profile
    async getMyProfile(req, res) {
        const response = await RefereeProfileService.getMyProfile(req.userId);
        return res.status(response.code).json(response);
    }

    async updateMyProfile(req, res) {
        const response = await RefereeProfileService.updateMyProfile(req.userId, req.body);
        return res.status(response.code).json(response);
    }

    // Self-service — re-upload license PDF (resets licenseStatus to pending)
    async updateMyLicense(req, res) {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ code: 400, msg: 'License PDF is required' });
        }
        const response = await RefereeProfileService.updateMyLicense(req.userId, req.file.buffer, req.file.originalname);
        return res.status(response.code).json(response);
    }
}

module.exports = new ProfileController();
