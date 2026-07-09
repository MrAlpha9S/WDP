const mongoose = require('mongoose');

const horseOwnerSchema = new mongoose.Schema(
    {
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        address: {
            type: String,
        },
        
        licenseLink: {
            type: String,
        },
        licenseStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        wallet: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('HorseOwner', horseOwnerSchema);
