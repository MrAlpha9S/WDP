const HorseOwnerJockeyService = require('../../services/HorseOwnerJockeyService');

class JockeyController {
    async getJockeyProfile(req, res) {
        const { jockeyId } = req.params;
        const response = await HorseOwnerJockeyService.getJockeyProfile(jockeyId);
        return res.status(response.code).json(response);
    }
}

module.exports = new JockeyController();
