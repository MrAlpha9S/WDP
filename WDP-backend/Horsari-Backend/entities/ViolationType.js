const mongoose = require('mongoose');

const violationTypeSchema = new mongoose.Schema(
    {
        violationName: {
            type: String,
            required: true,
        },
        violationDescription: {
            type: String,
        },
        defaultPenalty: {
            type: String,
        },
        type: {
            type: String,
            enum: ['pre-race', 'during-race', 'after-race'],
            required: true,
        },
        category: {
            type: String,
            enum: ['riding', 'horse-safety', 'medication', 'betting', 'administrative'],
        },
        severity: {
            type: Number,
            min: 1,
            max: 5,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('ViolationType', violationTypeSchema);
