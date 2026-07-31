const SpectatorStatisticsService = require('../../services/SpectatorStatisticsService');

class StatisticsController {
    async getStatistics(req, res) {
        const response = await SpectatorStatisticsService.getStatistics(req.userId);
        return res.status(response.code).json(response);
    }

    async getRewardsEarningsSeries(req, res) {
        const { groupBy = 'day' } = req.query;
        const response = await SpectatorStatisticsService.getRewardsEarningsSeries(req.userId, groupBy);
        return res.status(response.code).json(response);
    }
}

module.exports = new StatisticsController();
