const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
    {
        raceRoundId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RaceRound',
        },
        horseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Horse',
            required: true,
        },
        approvedByAdminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
        },
        registrationStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'verified', 'failed', 'cancelled'],
            default: 'pending',
        },
        verificationFailReason: {
            type: String,
            default: null,
        },
        registeredAt: {
            type: Date,
            default: Date.now,
        },
        horseOwnerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'HorseOwner',
            required: true,
        },
        jockeyInRaceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Invitation',
            default: null,
        },
        laneNumber: {
            type: Number,
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Registration', registrationSchema);
