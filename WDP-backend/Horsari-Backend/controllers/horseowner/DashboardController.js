const HorseOwnerDashboardService = require('../../services/HorseOwnerDashboardService');

class DashboardController {
    async getDashboardSummary(req, res) {
        const response = await HorseOwnerDashboardService.getDashboardSummary(req.userId);
        return res.status(response.code).json(response);
    }

    async getTopPerformers(req, res) {
        const limit = parseInt(req.query.limit) || 5;
        const response = await HorseOwnerDashboardService.getTopPerformers(req.userId, limit);
        return res.status(response.code).json(response);
    }
}

module.exports = new DashboardController();
