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

    async sumAmountByUserId(userId, filter = {}) {
        const result = await Transaction.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(String(userId)), ...filter } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        return result[0]?.total || 0;
    }
}

module.exports = new TransactionRepository();
