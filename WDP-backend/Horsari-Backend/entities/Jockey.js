const mongoose = require('mongoose');

const jockeySchema = new mongoose.Schema(
    {
        jockeyId: {
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
        ranking: Number,
        license_link: {
            type: String,
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'retired'],
            default: 'active',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Jockey', jockeySchema);
