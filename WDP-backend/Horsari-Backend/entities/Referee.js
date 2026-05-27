const mongoose = require('mongoose');

const refereeSchema = new mongoose.Schema(
    {
        refereeId: {
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

module.exports = mongoose.model('Referee', refereeSchema);
