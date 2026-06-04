const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        passwordHash: {
            type: String,
        },
        address: String,
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        fullName: {
            type: String,
            trim: true,
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },
        dateOfBirth: Date,
        phoneNumber: String,
        image: String,
        role: {
            type: String,
            enum: ['horseowner', 'jockey', 'referee', 'spectator', 'admin', 'google_unchosen'],
            default: 'spectator',
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'suspended'],
            default: 'active',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
