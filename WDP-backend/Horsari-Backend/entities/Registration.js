const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
    {
        raceRoundId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RaceRound',
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
        registeredAt: {
            type: Date,
            default: Date.now,
        },
        horseOwnerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'HorseOwner',
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Registration', registrationSchema);
