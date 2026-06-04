const mongoose = require('mongoose');

const raceEligibilityRuleSchema = new mongoose.Schema(
    {
        min_age: {
            type: Number,
            default: null,
        },
        max_age: {
            type: Number,
            default: null,
        },
        min_races_run: {
            type: Number,
            default: 0,
        },
        min_races_won: {
            type: Number,
            default: 0,
        },
        required_gender: {
            type: String,
            default: null,
        },
        required_breed: {
            type: String,
            default: null,
        },
        license_required: {
            type: Boolean,
            default: false,
        },
        require_nomination: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        race_type: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: { createdAt: 'create_at', updatedAt: 'updated_at' }
    }
);

module.exports = mongoose.model('RaceEligibilityRule', raceEligibilityRuleSchema);
