const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['player', 'coach', 'organizer', 'admin', null],
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'waiting_for_approval', 'approved', 'rejected'],
        default: 'pending'
    },
    phone: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        trim: true
    },
    skillLevel: {
        type: String,
        enum: ['professional', 'non-professional', null],
        default: null
    },
    // Legacy field - kept for backward compatibility with existing users
    verified: {
        type: Boolean,
        default: false
    },
    isProfileComplete: {
        type: Boolean,
        default: false
    },
    rank: {
        type: String,
        trim: true
    },
    achievements: {
        type: [String],
        default: [],
        set: function (val) {
            if (typeof val === 'string') {
                return val.split(',').map(s => s.trim());
            }
            return val;
        }
    },
    coachLevel: {
        type: String,
        trim: true
    },
    verificationDocument: {
        type: String,
        trim: true
    },
    profilePicture: {
        type: String,
        trim: true
    },
    rejectionReason: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
