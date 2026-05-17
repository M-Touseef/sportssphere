const mongoose = require('mongoose');

const coachProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    specialization: [{
        type: String,
        enum: ['singles', 'doubles', 'mixed_doubles', 'junior_coaching', 'fitness', 'technique', 'strategy', 'performance_analysis', 'tactics', 'high_performance']
    }],
    experience: {
        type: Number, // Years of experience
        required: true
    },
    certifications: [{
        name: String,
        issuedBy: String,
        year: Number
    }],
    hourlyRate: {
        type: Number,
        required: true
    },
    monthlyFee: {
        type: Number
    },
    bio: {
        type: String,
        required: true
    },
    availability: [{
        day: {
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        startTime: String, // e.g., "09:00"
        endTime: String,    // e.g., "17:00"
        court: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Court',
            required: true
        },
        courtBooking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking'
        },
        maxStudents: {
            type: Number,
            default: 1
        }
    }],
    location: {
        city: String,
        areas: [String] // Areas where coach provides services
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('CoachProfile', coachProfileSchema);
