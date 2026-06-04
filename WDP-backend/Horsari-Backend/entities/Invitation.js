const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema(
    {
        horseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Horse',
            required: true,
        },
        jockeyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Jockey',
        },
        owner_confirmation: {
            type: Boolean,
            default: true,
        },
        jockey_confirmation: {
            type: Boolean,
            default: false,
        },
        invitation_status: {
            type: String,
            enum: ['pending', 'accepted', 'declined', 'cancelled'],
            default: 'pending',
        },
        isBackup: {
            type: Boolean,
            default: false,
        },
        registrationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Registration',
        },
        percentage_payout: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Invitation', invitationSchema);
