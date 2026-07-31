const JockeyStatisticsService = require("../../services/JockeyStatisticsService");

class StatisticsController {
  // GET /wallet — wallet statistic + payment stats
  async getWalletInfo(req, res) {
    const response = await JockeyStatisticsService.getWalletInfo(req.userId);
    return res.status(response.code).json(response);
  }

  // GET /statistics — win rate, rank, payouts earned/pending, main-vs-backup breakdown
  async getStatistics(req, res) {
    const response = await JockeyStatisticsService.getStatistics(req.userId);
    return res.status(response.code).json(response);
  }

  // GET /statistics/earnings-series — payouts earned over time, gap-filled
  async getEarningsSeries(req, res) {
    const { groupBy = 'day' } = req.query;
    const response = await JockeyStatisticsService.getEarningsSeries(req.userId, groupBy);
    return res.status(response.code).json(response);
  }
}

module.exports = new StatisticsController();
