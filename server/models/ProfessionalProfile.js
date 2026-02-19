const mongoose = require('mongoose');

const professionalProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        }
    },
    matchFee: {
        type: Number,
        required: true,
        min: 0
    },
    bio: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    experienceYears: {
        type: Number,
        default: 0,
        min: 0
    },
    specializations: [{
        type: String,
        enum: ['singles', 'doubles', 'mixed_doubles', 'training', 'competitive']
    }],
    availability: [{
        day: {
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            required: true
        },
        startTime: {
            type: String, // e.g., "09:00"
            required: true
        },
        endTime: {
            type: String, // e.g., "17:00"
            required: true
        },
        court: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Court'
        },
        venue: {
            name: String,
            city: String,
            address: String
        },
        sparringType: {
            type: String,
            enum: ['singles', 'doubles', 'training', 'casual', 'competitive'],
            default: 'singles'
        },
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save hook to update timestamp
professionalProfileSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Index for efficient queries
professionalProfileSchema.index({ isActive: 1 });
professionalProfileSchema.index({ 'rating.average': -1 });

module.exports = mongoose.model('ProfessionalProfile', professionalProfileSchema);
