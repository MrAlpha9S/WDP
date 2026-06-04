const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema(
    {
        registrationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Registration',
            required: true,
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
        actualPenalty: {
            type: String,
        },
        violationStatus: {
            type: String,
            default: 'pending',
        },
    },
    { timestamps: { createdAt: 'created_at' } }
);

module.exports = mongoose.model('Violation', violationSchema);
