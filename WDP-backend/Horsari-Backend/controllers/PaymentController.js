const PaymentService = require('../services/PaymentService');

class PaymentController {
    async confirmPaid(req, res) {
        const io = req.app.get('io');
        const response = await PaymentService.confirmAsPayer(req.userId, req.user.role, req.params.paymentId, io);
        return res.status(response.code).json(response);
    }

    async confirmReceived(req, res) {
        const io = req.app.get('io');
        const response = await PaymentService.confirmAsPayee(req.userId, req.user.role, req.params.paymentId, io);
        return res.status(response.code).json(response);
    }

    async listMyPayments(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { status, direction = 'all' } = req.query;
        const response = await PaymentService.listMyPayments(req.userId, req.user.role, direction, status, page, limit);
        return res.status(response.code).json(response);
    }
}

module.exports = new PaymentController();
