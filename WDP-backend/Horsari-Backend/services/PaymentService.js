const TransactionRepository = require('../repositories/TransactionRepository');
const HorseOwnerRepository = require('../repositories/HorseOwnerRepository');
const JockeyRepository = require('../repositories/JockeyRepository');
const RefereeRepository = require('../repositories/RefereeRepository');
const NotificationService = require('./NotificationService');

const WALLET_REPO_BY_ROLE = {
    horseowner: HorseOwnerRepository,
    jockey: JockeyRepository,
    referee: RefereeRepository,
};

class PaymentService {
    // Idempotent creation — skips if a matching payment row already exists.
    // Persisted as a Transaction document (paymentType/payer/payee fields set,
    // transactionType left null) rather than a separate collection.
    async createIfNotExists({ paymentType, payerRole, payerId, payeeRole, payeeId, amount, sourceType, sourceId, raceRoundId, originalAmount = null, originalCurrency = null }) {
        const existing = await TransactionRepository.findOne({ paymentType, sourceType, sourceId, payeeId });
        if (existing) return existing;

        return await TransactionRepository.create({
            paymentType, payerRole, payerId, payeeRole, payeeId, amount, sourceType, sourceId, raceRoundId,
            originalAmount, originalCurrency,
            paymentStatus: 'unpaid',
        });
    }

    _recomputeStatus(payment) {
        if (payment.payerConfirmed && payment.payeeConfirmed) return 'paid';
        if (payment.payerConfirmed || payment.payeeConfirmed) return 'processing';
        return 'unpaid';
    }

    async confirmAsPayer(userId, userRole, paymentId, io) {
        try {
            const payment = await TransactionRepository.findById(paymentId);
            if (!payment) return { code: 404, msg: 'Payment not found.' };
            if (String(payment.payerId) !== String(userId) || payment.payerRole !== userRole) {
                return { code: 403, msg: 'You are not the payer on this payment.' };
            }
            if (payment.payerConfirmed) {
                return { code: 422, msg: 'You have already confirmed this payment as paid.' };
            }

            payment.payerConfirmed = true;
            payment.payerConfirmedAt = new Date();
            payment.paymentStatus = this._recomputeStatus(payment);
            await payment.save();

            await NotificationService.notify({
                recipientIds: [payment.payeeId],
                type: 'payment_confirmed_by_payer',
                title: 'Payment Marked as Sent',
                message: `A payment of ${payment.amount} has been marked as paid. Please confirm once received.`,
                relatedEntityType: 'Transaction',
                relatedEntityId: payment._id,
            }, io);

            if (payment.paymentStatus === 'paid') {
                await this._settle(payment, io);
            }

            return { code: 200, data: payment, msg: 'Payment confirmed as paid.' };
        } catch (error) {
            console.error('Error confirming payment as payer:', error);
            return { code: 500, msg: error.message };
        }
    }

    async confirmAsPayee(userId, userRole, paymentId, io) {
        try {
            const payment = await TransactionRepository.findById(paymentId);
            if (!payment) return { code: 404, msg: 'Payment not found.' };
            if (String(payment.payeeId) !== String(userId) || payment.payeeRole !== userRole) {
                return { code: 403, msg: 'You are not the payee on this payment.' };
            }
            if (payment.payeeConfirmed) {
                return { code: 422, msg: 'You have already confirmed this payment as received.' };
            }

            payment.payeeConfirmed = true;
            payment.payeeConfirmedAt = new Date();
            payment.paymentStatus = this._recomputeStatus(payment);
            await payment.save();

            await NotificationService.notify({
                recipientIds: [payment.payerId],
                type: 'payment_confirmed_by_payee',
                title: 'Payment Marked as Received',
                message: `Your payment of ${payment.amount} has been confirmed as received.`,
                relatedEntityType: 'Transaction',
                relatedEntityId: payment._id,
            }, io);

            if (payment.paymentStatus === 'paid') {
                await this._settle(payment, io);
            }

            return { code: 200, data: payment, msg: 'Payment confirmed as received.' };
        } catch (error) {
            console.error('Error confirming payment as payee:', error);
            return { code: 500, msg: error.message };
        }
    }

    async _settle(payment, io) {
        const walletRepo = WALLET_REPO_BY_ROLE[payment.payeeRole];
        if (walletRepo) {
            await walletRepo.incrementWallet(payment.payeeId, payment.amount);
        }

        await NotificationService.notify({
            recipientIds: [payment.payerId, payment.payeeId],
            type: 'payment_settled',
            title: 'Payment Fully Settled',
            message: `A payment of ${payment.amount} has been confirmed by both parties and settled.`,
            relatedEntityType: 'Transaction',
            relatedEntityId: payment._id,
        }, io);
    }

    async listMyPayments(userId, role, direction = 'all', status = null, page = 1, limit = 10) {
        try {
            const { items, totalItems, totalPages, currentPage, limit: lim } =
                await TransactionRepository.findByParty(userId, role, { direction, status, page, limit });
            return {
                code: 200,
                data: { items, pagination: { totalItems, totalPages, currentPage, limit: lim } },
                msg: 'Payments retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new PaymentService();
