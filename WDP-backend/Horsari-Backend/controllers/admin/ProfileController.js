const AdminProfileService = require('../../services/AdminProfileService');

class ProfileController {
    // Self-service — GET/PUT my own profile (distinct from /users/:userId, which is admin managing others)
    async getMyProfile(req, res) {
        const response = await AdminProfileService.getMyProfile(req.userId);
        return res.status(response.code).json(response);
    }

    async updateMyProfile(req, res) {
        const response = await AdminProfileService.updateMyProfile(req.userId, req.body);
        return res.status(response.code).json(response);
    }
}

module.exports = new ProfileController();
