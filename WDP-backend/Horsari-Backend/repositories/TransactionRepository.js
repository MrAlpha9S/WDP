const mongoose = require('mongoose');
const Transaction = require('../entities/Transaction');

class TransactionRepository {
    async create(data) {
        return Transaction.create(data);
    }

    async findByUserId(userId, filter = {}, limit = 10, skip = 0, sortObj = {}) {
        return Transaction.find({ userId, ...filter }).sort(sortObj).skip(skip).limit(limit).lean();
    }

    async countByUserId(userId, filter = {}) {
        return Transaction.countDocuments({ userId, ...filter });
    }

    // Paginated wallet-ledger view (deposits/withdrawals/rewards/refunds) for a
    // single user — distinct from findByParty, which is for the payer/payee
    // payment-verification rows (race_prize/referee_fee/jockey_payout).
    async findByUserIdPaginated(userId, { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = {}) {
        const skip = (page - 1) * limit;
        const filter = { userId };

        const allowedSortFields = ['createdAt', 'amount'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const sortObj = { [sortField]: order === 'asc' ? 1 : -1 };

        const [items, totalItems] = await Promise.all([
            Transaction.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
            Transaction.countDocuments(filter),
        ]);

        return { items, totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit };
    }

    // Admin-only, system-wide wallet-ledger view — every deposit/withdrawal/
    // reward/refund row regardless of whose wallet it belongs to (spectator
    // prediction payouts, house-take deposits, etc.), unlike
    // findByUserIdPaginated which is scoped to one user.
    async findAllLedgerEntries({ page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = {}) {
        const skip = (page - 1) * limit;
        const filter = { transactionType: { $ne: null } };

        const allowedSortFields = ['createdAt', 'amount'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const sortObj = { [sortField]: order === 'asc' ? 1 : -1 };

        const [items, totalItems] = await Promise.all([
            Transaction.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
            Transaction.countDocuments(filter),
        ]);

        return { items, totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit };
    }

    async sumAmountByUserId(userId, filter = {}) {
        const result = await Transaction.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(String(userId)), ...filter } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        return result[0]?.total || 0;
    }

    // ── Payment verification (statistical wallet tracking rows) ────────────────

    async findOne(filter) {
        return Transaction.findOne(filter);
    }

    async findById(id) {
        return Transaction.findById(id);
    }

    async findByParty(userId, role, { direction = 'all', status, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = {}) {
        const skip = (page - 1) * limit;
        const filter = {};

        if (direction === 'payer') {
            filter.payerId = userId;
            filter.payerRole = role;
        } else if (direction === 'payee') {
            filter.payeeId = userId;
            filter.payeeRole = role;
        } else {
            filter.$or = [
                { payerId: userId, payerRole: role },
                { payeeId: userId, payeeRole: role },
            ];
        }

        if (status) filter.paymentStatus = status;

        const allowedSortFields = ['createdAt', 'amount', 'paymentStatus'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const sortObj = { [sortField]: order === 'asc' ? 1 : -1 };

        const [items, totalItems] = await Promise.all([
            Transaction.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
            Transaction.countDocuments(filter),
        ]);

        return { items, totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit };
    }

    // Admin-only, system-wide payment-verification list — no payer/payee scoping,
    // unlike findByParty. Mirrors AdminService.getRaceRounds's "no userId filter" shape.
    async findAllPayments({ paymentType, status, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = {}) {
        const skip = (page - 1) * limit;
        const filter = { paymentType: { $ne: null } };

        if (paymentType) filter.paymentType = paymentType;
        if (status) filter.paymentStatus = status;

        const allowedSortFields = ['createdAt', 'amount', 'paymentStatus'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const sortObj = { [sortField]: order === 'asc' ? 1 : -1 };

        const [items, totalItems] = await Promise.all([
            Transaction.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
            Transaction.countDocuments(filter),
        ]);

        return { items, totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit };
    }

    async updateById(id, updateData) {
        return Transaction.findByIdAndUpdate(id, updateData, { new: true });
    }

    // Sum `amount` for payment-verification rows where the given user is the
    // payer or payee, optionally filtered further (e.g. { paymentStatus: 'paid' }).
    async sumAmountByParty(userId, role, direction, filter = {}) {
        const match = { ...filter };
        if (direction === 'payer') {
            match.payerId = new mongoose.Types.ObjectId(String(userId));
            match.payerRole = role;
        } else {
            match.payeeId = new mongoose.Types.ObjectId(String(userId));
            match.payeeRole = role;
        }
        const result = await Transaction.aggregate([
            { $match: match },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        return result[0]?.total || 0;
    }
}

module.exports = new TransactionRepository();
