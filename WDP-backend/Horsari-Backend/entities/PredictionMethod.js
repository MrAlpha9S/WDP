const mongoose = require('mongoose');

const predictionMethodSchema = new mongoose.Schema(
    {
        methodName: {
            type: String,
            required: true,
        },
        methodDescription: {
            type: String,
        },
        methodType: {
            type: String,
            enum: ['tournament_champion', 'race_rank', 'race_winner'],
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('PredictionMethod', predictionMethodSchema);
