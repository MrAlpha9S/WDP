const mongoose = require('mongoose');

const raceRoundSchema = new mongoose.Schema(
    {
        tournamentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tournament',
            required: [true, 'Tournament is required'],
        },
        createdByAdminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
        },
        roundName: {
            type: String,
            required: [true, 'Round name is required'],
        },
        raceDate: {
            type: Date,
            required: [true, 'Race date is required'],
        },
        trackLength: {
            type: Number,
            required: [true, 'Track length is required'],
        },
        maxParticipants: {
            type: Number,
            required: [true, 'Max participants is required'],
        },
        status: {
            type: String,
            enum: ['draft', 'scheduled', 'running', 'completed', 'cancelled', 'awaitingConfirmation', 'prepared'],
            default: 'draft',
        },
        minimalRidingFees: {
            type: Number,
            required: [true, 'Minimal riding fees is required'],
        },
        raceGround: {
            type: String,
            required: [true, 'Race ground is required'],
        },
        requireEntranceFees: {
            type: Boolean,
            default: false,
        },
        firstPlacePrize: {
            type: Number,
            default: 0,
        },
        secondPlacePrize: {
            type: Number,
            default: 0,
        },
        thirdPlacePrize: {
            type: Number,
            default: 0,
        },
        currencyType: {
            type: String,
            default: 'USD',
        },
        location: {
            type: String,
        },
        address: {
            type: String,
        },
        eligibilityRuleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RaceEligibilityRule',
        },
        // Mux live-streaming fields (populated when admin starts the race)
        muxLiveStreamId: { type: String, default: null },
        muxStreamKey: { type: String, default: null },
        muxPlaybackId: { type: String, default: null },
        muxVodPlaybackId: { type: String, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('RaceRound', raceRoundSchema);
