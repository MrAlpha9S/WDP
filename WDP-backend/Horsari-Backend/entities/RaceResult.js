const mongoose = require('mongoose');

const raceResultSchema = new mongoose.Schema(
    {
        raceRoundId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RaceRound',
            required: true,
        },
        registrationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Registration',
            required: true,
        },
        publishedByAdminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
        },
        finishPosition: {
            type: Number,
        },
        finishTime: {
            type: String,
        },
        prizeMoney: {
            type: Number,
            default: 0,
        },
        distance: {
            type: Number,
        },
        resultStatus: {
            type: String,
            enum: ['pending_confirmation', 'official', 'cancelled'],
            default: 'pending_confirmation',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('RaceResult', raceResultSchema);
