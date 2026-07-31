const SpectatorWalletService = require('../../services/SpectatorWalletService');

class WalletController {
    async getWalletInfo(req, res) {
        const response = await SpectatorWalletService.getWalletInfo(req.userId);
        return res.status(response.code).json(response);
    }

    async getTransactionHistory(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { transactionType, status, sortBy = 'date', order = 'desc' } = req.query;
        const response = await SpectatorWalletService.getTransactionHistory(req.userId, page, limit, transactionType, status, sortBy, order);
        return res.status(response.code).json(response);
    }

    async depositPoints(req, res) {
        const response = await SpectatorWalletService.depositPoints(req.userId, req.body);
        return res.status(response.code).json(response);
    }

    async withdrawPoints(req, res) {
        const response = await SpectatorWalletService.withdrawPoints(req.userId, req.body);
        return res.status(response.code).json(response);
    }
}

module.exports = new WalletController();
