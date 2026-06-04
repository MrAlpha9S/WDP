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
        
        license_link: {
            type: String,
        },
        license_status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('HorseOwner', horseOwnerSchema);
