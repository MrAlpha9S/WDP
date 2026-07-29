const mongoose = require('mongoose');

const spectatorSchema = new mongoose.Schema(
    {
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        wallet: {
            type: Number,
            default: 100000,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Spectator', spectatorSchema);
