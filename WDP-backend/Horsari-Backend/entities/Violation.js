const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema(
    {
        raceRoundId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RaceRound',
            required: true,
        },
        registrationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Registration',
            required: false,
        },
        raceRefereeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RaceReferee',
            required: true,
        },
        violationTypeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ViolationType',
            required: true,
        },
        description: {
            type: String,
        },
        severity: {
            type: Number,
            min: 1,
            max: 5,
        },
        actualPenalty: {
            type: String,
        },
        stewardAction: {
            type: String,
            enum: ['no-action', 'warning', 'fine', 'suspended', 'disqualified', 'demoted', 'investigation', 'permanent-ban'],
        },
        violationStatus: {
            type: String,
            enum: ['pending', 'confirmed', 'dismissed'],
            default: 'pending',
        },
    },
    { timestamps: { createdAt: 'created_at' } }
);

module.exports = mongoose.model('Violation', violationSchema);
