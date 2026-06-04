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
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('PredictionMethod', predictionMethodSchema);
