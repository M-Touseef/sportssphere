const mongoose = require('mongoose');
const { validateBadmintonMatchScore } = require('../utils/badmintonScoring');

const matchSchema = new mongoose.Schema({
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
    round: {
        type: String,
        required: true,
        enum: ['round_of_64', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'final', 'third_place', 'group_stage', 'round_1', 'round_2', 'round_3']
    },
    matchNumber: {
        type: Number,
        required: true
    },
    // Participant 1 (can be single player or team)
    participant1: {
        registration: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TournamentRegistration'
        },
        score: [{
            type: Number // Array of set scores
        }],
        isWinner: {
            type: Boolean,
            default: false
        }
    },
    // Participant 2 (can be single player or team)
    participant2: {
        registration: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TournamentRegistration'
        },
        score: [{
            type: Number // Array of set scores
        }],
        isWinner: {
            type: Boolean,
            default: false
        }
    },
    scheduledTime: {
        type: Date
    },
    court: {
        type: String
    },
    status: {
        type: String,
        enum: ['scheduled', 'in_progress', 'completed', 'walkover', 'cancelled'],
        default: 'scheduled'
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TournamentRegistration'
    },
    // For bracket progression
    nextMatchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match'
    },
    nextMatchPosition: {
        type: String,
        enum: ['participant1', 'participant2']
    },
    // Match details
    duration: {
        type: Number // in minutes
    },
    referee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    }
});

// Index for efficient querying
matchSchema.index({ tournament: 1, category: 1, round: 1 });
matchSchema.index({ tournament: 1, status: 1 });

// Method to determine winner based on scores
matchSchema.methods.calculateWinner = function () {
    const result = validateBadmintonMatchScore(this.participant1.score, this.participant2.score);
    if (result.error) return null;
    return result.matchWinner === 'participant1'
        ? this.participant1.registration
        : this.participant2.registration;
};

module.exports = mongoose.model('Match', matchSchema);
