const HorseOwnerFinancialService = require('../../services/HorseOwnerFinancialService');

class FinancialController {
    async getFinancialSummary(req, res) {
        const response = await HorseOwnerFinancialService.getFinancialSummary(req.userId);
        return res.status(response.code).json(response);
    }

    async getFinancialRaceResults(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { search } = req.query;
        const response = await HorseOwnerFinancialService.getFinancialRaceResults(req.userId, page, limit, search || null);
        return res.status(response.code).json(response);
    }

    async getFinancialEarningsSeries(req, res) {
        const { groupBy = 'day' } = req.query;
        const response = await HorseOwnerFinancialService.getFinancialEarningsSeries(req.userId, groupBy);
        return res.status(response.code).json(response);
    }
}

module.exports = new FinancialController();
