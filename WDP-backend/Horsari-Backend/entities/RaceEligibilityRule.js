const mongoose = require('mongoose');

const raceEligibilityRuleSchema = new mongoose.Schema(
    {
        minAge: {
            type: Number,
            default: null,
        },
        maxAge: {
            type: Number,
            default: null,
        },
        minRacesRun: {
            type: Number,
            default: 0,
        },
        minRacesWon: {
            type: Number,
            default: 0,
        },
        requiredGender: {
            type: String,
            default: null,
        },
        requiredBreed: {
            type: String,
            default: null,
        },
        licenseRequired: {
            type: Boolean,
            default: false,
        },
        requireNomination: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        raceType: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: { createdAt: 'create_at', updatedAt: 'updated_at' }
    }
);

module.exports = mongoose.model('RaceEligibilityRule', raceEligibilityRuleSchema);
