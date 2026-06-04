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
        published_by_adminId: {
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
        resultStatus: {
            type: String,
            default: 'official',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('RaceResult', raceResultSchema);
