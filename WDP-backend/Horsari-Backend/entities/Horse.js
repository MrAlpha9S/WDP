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
        age: Number,
        gender: {
            type: String,
            enum: ['male', 'female'],
        },
        color: String,
        healthStatus: {
            type: String,
            enum: ['healthy', 'injured', 'sick'],
            default: 'healthy',
        },
        registrationDate: Date,
        role: String,
        status: {
            type: String,
            enum: ['active', 'inactive', 'retired'],
            default: 'active',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Horse', horseSchema);
