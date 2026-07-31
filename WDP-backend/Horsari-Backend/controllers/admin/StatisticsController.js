const AdminStatisticsService = require('../../services/AdminStatisticsService');

class StatisticsController {
    // Get statistics
    async getStatistics(req, res) {
        const response = await AdminStatisticsService.getStatistics();
        return res.status(response.code).json(response);
    }

    // Get comprehensive system-wide statistics (all entities, snapshot breakdowns)
    async getSystemStatistics(req, res) {
        const response = await AdminStatisticsService.getSystemStatistics();
        return res.status(response.code).json(response);
    }

    // ── Dashboard panel endpoints (independent, fetched in parallel by the frontend) ──

    async getDashboardKpi(req, res) {
        const r = await AdminStatisticsService.getDashboardKpi();
        return res.status(r.code).json(r);
    }

    async getDashboardHouseEarnings(req, res) {
        const { groupBy = 'day' } = req.query; // 'day' | 'month'
        const r = await AdminStatisticsService.getDashboardHouseEarnings(groupBy);
        return res.status(r.code).json(r);
    }

    async getDashboardTopPerformers(req, res) {
        const r = await AdminStatisticsService.getDashboardTopPerformers();
        return res.status(r.code).json(r);
    }

    async getDashboardPredictions(req, res) {
        const r = await AdminStatisticsService.getDashboardPredictions();
        return res.status(r.code).json(r);
    }

    async getDashboardSpectatorLeaderboard(req, res) {
        const r = await AdminStatisticsService.getDashboardSpectatorLeaderboard();
        return res.status(r.code).json(r);
    }

    async getImportantEvents(req, res) {
        const response = await AdminStatisticsService.getImportantEvents();
        return res.status(response.code).json(response);
    }
}

module.exports = new StatisticsController();
