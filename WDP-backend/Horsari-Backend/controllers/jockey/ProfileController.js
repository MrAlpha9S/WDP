const JockeyProfileService = require("../../services/JockeyProfileService");

class ProfileController {
  // Get all jockeys
  async getAllJockeys(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { sortBy = 'createdAt', order = 'desc' } = req.query;
    const response = await JockeyProfileService.getAllJockeys(page, limit, sortBy, order);
    return res.status(response.code).json(response);
  }

  // Mobile: GET /my-profile — rank, stats, recent races (self-service)
  async getMyProfile(req, res) {
    const response = await JockeyProfileService.getMyProfile(req.userId);
    return res.status(response.code).json(response);
  }

  // Mobile: PUT /my-profile — self-service profile edit
  async updateMyProfile(req, res) {
    const response = await JockeyProfileService.updateMyProfile(req.userId, req.body);
    return res.status(response.code).json(response);
  }

  // Mobile: PUT /my-profile/license — re-upload license PDF (resets licenseStatus to pending)
  async updateMyLicense(req, res) {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ code: 400, msg: 'License PDF is required' });
    }
    const response = await JockeyProfileService.updateMyLicense(req.userId, req.file.buffer, req.file.originalname);
    return res.status(response.code).json(response);
  }
}

module.exports = new ProfileController();
