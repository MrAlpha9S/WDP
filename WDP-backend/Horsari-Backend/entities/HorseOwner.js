const mongoose = require('mongoose');

const horseOwnerSchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        
        license_link: {
            type: String,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('HorseOwner', horseOwnerSchema);
