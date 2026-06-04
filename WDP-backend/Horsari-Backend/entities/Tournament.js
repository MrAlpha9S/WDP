const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema(
    {
        created_by_adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
        },
        tournament_name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        start_date: {
            required: true,
            type: Date,
        },
        end_date: {
            required: true,
            type: Date,
        },
        location: {
            type: String,
            required: true,
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
