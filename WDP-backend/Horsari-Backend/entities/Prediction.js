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
            required: true,
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
