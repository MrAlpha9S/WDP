const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema(
    {
        spectatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Spectator',
            required: true,
        },
        registrationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Registration',
            default: null,
        },
        tournamentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tournament',
            default: null,
        },
        predictedHorseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Horse',
            default: null,
        },
        predictionMethodId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PredictionMethod',
            required: true,
        },
        predictedRank: {
            type: Number,
        },
        predictionStatus: {
            type: String,
            enum: ['pending', 'correct', 'incorrect', 'cancelled', 'refunded'],
            default: 'pending',
        },
        rewardPoints: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: { createdAt: 'created_at' } }
);

module.exports = mongoose.model('Prediction', predictionSchema);
