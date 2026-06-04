const mongoose = require('mongoose');

const raceRefereeSchema = new mongoose.Schema(
    {
        raceRoundId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RaceRound',
            required: [true, 'RaceRound is required'],
        },
        refereeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Referee',
            required: [true, 'Referee is required'],
        },
        assignedByAdminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
        },
        assignedAt: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ['pending', 'assigned', 'rejected'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('RaceReferee', raceRefereeSchema);
