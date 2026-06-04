const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema(
    {
        createdByAdminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
        },
        tournamentName: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        startDate: {
            type: Date,
            default: null,
        },
        endDate: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            enum: ['draft', 'scheduled', 'ongoing', 'completed', 'cancelled'],
            default: 'draft',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Tournament', tournamentSchema);
