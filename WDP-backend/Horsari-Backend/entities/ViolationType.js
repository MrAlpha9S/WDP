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
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('ViolationType', violationTypeSchema);
