const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        transactionType: {
            type: String,
            required: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            default: 'completed',
        },
        amount: {
            type: Number,
            required: true,
        },
        description: {
            type: String,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
