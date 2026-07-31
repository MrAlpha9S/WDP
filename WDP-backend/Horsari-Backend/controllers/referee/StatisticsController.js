const RefereeStatisticsService = require('../../services/RefereeStatisticsService');

class StatisticsController {
    // GET /wallet — wallet statistic + payment stats
    async getWalletInfo(req, res) {
        const response = await RefereeStatisticsService.getWalletInfo(req.userId);
        return res.status(response.code).json(response);
    }

    // GET /statistics — races officiated, acceptance rate, fees earned/pending
    async getStatistics(req, res) {
        const response = await RefereeStatisticsService.getStatistics(req.userId);
        return res.status(response.code).json(response);
    }

    // GET /statistics/earnings-series — fees earned over time, gap-filled
    async getFeesEarningsSeries(req, res) {
        const { groupBy = 'day' } = req.query;
        const response = await RefereeStatisticsService.getFeesEarningsSeries(req.userId, groupBy);
        return res.status(response.code).json(response);
    }

    // GET /work-history — completed race rounds + violations logged against them
    async getWorkHistory(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { sortBy = 'raceDate', order = 'desc' } = req.query;
        const response = await RefereeStatisticsService.getWorkHistory(req.userId, page, limit, sortBy, order);
        return res.status(response.code).json(response);
    }
}

module.exports = new StatisticsController();
