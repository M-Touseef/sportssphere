const mongoose = require('mongoose');

const tournamentRegistrationSchema = new mongoose.Schema({
    tournament: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['mens_singles', 'womens_singles', 'mens_doubles', 'womens_doubles', 'mixed_doubles', 'junior_boys', 'junior_girls']
    },
    // For singles
    player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // For doubles
    player1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    player2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    partnerName: {
        type: String,
        trim: true
    },
    teamName: {
        type: String,
        trim: true
    },
    seedNumber: {
        type: Number // For seeding in brackets
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'withdrawn', 'disqualified'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    paymentAmount: {
        type: Number,
        required: true
    },
    paymentReference: {
        type: String
    },
    registeredAt: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String
    },
    // JazzCash payment tracking
    txnRefNo: {
        type: String,
        default: null
    },
    jazzcashTxnId: {
        type: String,
        default: null
    }
});

// Compound index to prevent duplicate registrations
// Compound indexes with partial filter to support singles and doubles separately
tournamentRegistrationSchema.index(
    { tournament: 1, category: 1, player: 1 },
    { unique: true, partialFilterExpression: { player: { $exists: true } } }
);
tournamentRegistrationSchema.index(
    { tournament: 1, category: 1, player1: 1, player2: 1 },
    { unique: true, partialFilterExpression: { player1: { $exists: true } } }
);

// Virtual for getting team display name
tournamentRegistrationSchema.virtual('displayName').get(function () {
    if (this.teamName) {
        return this.teamName;
    }
    // Will be populated with actual names when queried
    return 'Team';
});

module.exports = mongoose.model('TournamentRegistration', tournamentRegistrationSchema);
