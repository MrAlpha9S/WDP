const mongoose = require('mongoose');

const raceRoundSchema = new mongoose.Schema(
    {
        tournamentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tournament',
            required: [true, 'Tournament is required'],
        },
        created_by_adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
        },
        round_name: {
            type: String,
            required: [true, 'Round name is required'],
        },
        race_date: {
            type: Date,
            required: [true, 'Race date is required'],
        },
        track_length: {
            type: Number,
            required: [true, 'Track length is required'],
        },
        max_participants: {
            type: Number,
            required: [true, 'Max participants is required'],
        },
        status: {
            type: String,
            enum: ['draft', 'scheduled', 'running', 'completed', 'cancelled'],
            default: 'draft',
        },
        race_type: {
            type: String,
            required: [true, 'Race type is required'],
        },
        minimal_riding_fees: {
            type: Number,
            required: [true, 'Minimal riding fees is required'],
        },
        require_entrance_fees: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('RaceRound', raceRoundSchema);
