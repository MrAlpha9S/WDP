const NotificationService = require('../services/NotificationService');

class NotificationController {
    async listMine(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const unreadOnly = req.query.unreadOnly === 'true';
        const response = await NotificationService.listMine(req.userId, page, limit, unreadOnly);
        return res.status(response.code).json(response);
    }

    async getUnreadCount(req, res) {
        const response = await NotificationService.getUnreadCount(req.userId);
        return res.status(response.code).json(response);
    }

    async markRead(req, res) {
        const response = await NotificationService.markRead(req.params.id, req.userId);
        return res.status(response.code).json(response);
    }

    async markAllRead(req, res) {
        const response = await NotificationService.markAllRead(req.userId);
        return res.status(response.code).json(response);
    }
}

module.exports = new NotificationController();
