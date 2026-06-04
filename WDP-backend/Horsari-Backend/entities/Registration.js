const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
    {
        raceRoundId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RaceRound',
        },
        approved_by_adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
        },
        registration_status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        registered_at: {
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
