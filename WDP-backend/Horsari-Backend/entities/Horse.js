const mongoose = require('mongoose');

const horseSchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'HorseOwner',
            required: true,
        },
        horseName: {
            type: String,
            required: true,
        },
        breed: String,
        gender: {
            type: String,
            enum: ['male', 'female'],
        },
        healthStatus: {
            type: String,
            enum: ['healthy', 'injured', 'sick'],
            default: 'healthy',
        },
        registrationDate: Date,
        status: {
            type: String,
            enum: ['active', 'inactive', 'retired'],
            default: 'active',
        },
        img: String,
        dateOfBirth: Date,
    },
    { timestamps: true }
);

module.exports = mongoose.model('Horse', horseSchema);
