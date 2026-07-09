const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        transactionType: {
            type: String,
            enum: ['reward', 'deposit', 'withdrawal', 'refund'],
        },
        date: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending',
        },
        amount: {
            type: Number,
            required: true,
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
            enum: ['prediction', 'payment'],
            default: null,
        },

        // ── Payment verification (statistical wallet tracking only — actual
        //    payment happens outside the system) ──────────────────────────────
        // Used for the three off-system payment obligations: admin→horseOwner
        // (race_prize), admin→referee (referee_fee), horseOwner→jockey
        // (jockey_payout). These fields are left null on ordinary Spectator
        // transactionType rows (deposit/withdrawal/reward/refund).
        paymentType: {
            type: String,
            enum: ['race_prize', 'referee_fee', 'jockey_payout'],
            default: null,
        },
        payerRole: {
            type: String,
            enum: ['admin', 'horseowner'],
            default: null,
        },
        payerId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        payeeRole: {
            type: String,
            enum: ['horseowner', 'referee', 'jockey'],
            default: null,
        },
        payeeId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        sourceType: {
            type: String,
            enum: ['RaceResult', 'RaceReferee', 'Invitation'],
            default: null,
        },
        sourceId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        raceRoundId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RaceRound',
            default: null,
        },
        payerConfirmed: {
            type: Boolean,
            default: false,
        },
        payerConfirmedAt: {
            type: Date,
            default: null,
        },
        payeeConfirmed: {
            type: Boolean,
            default: false,
        },
        payeeConfirmedAt: {
            type: Date,
            default: null,
        },
        paymentStatus: {
            type: String,
            enum: ['unpaid', 'processing', 'paid'],
            default: null,
        },
        // Raw amount + currency the race round was denominated in, before
        // conversion — `amount` above always holds the converted VND value
        // (what wallets are actually credited with). These exist purely for
        // transparency/audit.
        originalAmount: {
            type: Number,
            default: null,
        },
        originalCurrency: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

transactionSchema.index({ payerId: 1, createdAt: -1 });
transactionSchema.index({ payeeId: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
