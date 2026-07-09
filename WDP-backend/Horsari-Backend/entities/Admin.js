const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
    {
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        wallet: {
            type: Number,
            default: 0,
        },
        isMainAdmin: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Admin', adminSchema);
