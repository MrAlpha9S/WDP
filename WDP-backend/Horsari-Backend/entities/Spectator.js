const mongoose = require('mongoose');

const spectatorSchema = new mongoose.Schema(
    {
        spectatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        rewardPoints: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Spectator', spectatorSchema);
