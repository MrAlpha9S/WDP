const mongoose = require('mongoose');

const jockeySchema = new mongoose.Schema(
    {
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        height: Number,
        weight: Number,
        matchesRaced: {
            type: Number,
            default: 0,
        },
        totalWins: {
            type: Number,
            default: 0,
        },
        licenseLink: {
            type: String,
        },
        licenseStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'retired'],
            default: 'active',
        },
        wallet: {
            type: Number,
            default: 0,
        },
        // Default flat fee this jockey charges to be booked — distinct from
        // Invitation.bookingFees, which is the actual fee agreed for one hire.
        bookingFee: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Jockey', jockeySchema);
