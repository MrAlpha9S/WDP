const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
    {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Admin', adminSchema);
