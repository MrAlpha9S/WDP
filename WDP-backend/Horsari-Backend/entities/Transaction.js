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
            enum: ['reward', 'deposit', 'withdrawal', 'refund', 'house_cut', 'prize', 'referee_fee', 'jockey_payment', 'jockey_payout'],
            required: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending',
            // default: 'completed',
        },
        amount: {
            type: Number,
            required: true,
        },
        description: {
            type: String,
        },
         description: {
            type: String,
            default: null,
        },
        referenceId: {
            type: String,
            default: null,
        },
        referenceType: {
            type: String,
            enum: ['prediction', 'payment', 'race_result'],
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
