const mongoose = require('mongoose');

const refereeSchema = new mongoose.Schema(
    {
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        licenseLink: {
            type: String,
        },
        licenseStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Referee', refereeSchema);
