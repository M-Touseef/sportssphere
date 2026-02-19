const mongoose = require('mongoose');

const sparringAvailabilitySchema = new mongoose.Schema({
    proPlayer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    court: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Court'
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    venue: {
        name: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            required: true,
            trim: true
        }
    },
    sparringType: {
        type: String,
        enum: ['singles', 'doubles', 'training', 'casual', 'competitive'],
        default: 'singles'
    },
    bookingType: {
        type: String,
        enum: ['sparring', 'coaching'],
        default: 'sparring'
    },
    status: {
        type: String,
        enum: ['OPEN', 'PENDING', 'BOOKED', 'EXPIRED'],
        default: 'OPEN'
    },
    isEnabled: {
        type: Boolean,
        default: true
    },
    matchFee: {
        type: Number,
        min: 0
    },
    notes: {
        type: String,
        trim: true
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

// Unique index to prevent duplicate slots
sparringAvailabilitySchema.index({ proPlayer: 1, date: 1, startTime: 1 }, { unique: true });

// Index for efficient queries
sparringAvailabilitySchema.index({ status: 1, date: 1 });
sparringAvailabilitySchema.index({ 'venue.city': 1, status: 1 });

// Pre-save hook to update timestamp
sparringAvailabilitySchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual to check if slot is expired
sparringAvailabilitySchema.virtual('isExpired').get(function () {
    const now = new Date();
    const slotDate = new Date(this.date);
    const [hours, minutes] = this.endTime.split(':').map(Number);
    slotDate.setHours(hours, minutes, 0, 0);
    return now > slotDate;
});

module.exports = mongoose.model('SparringAvailability', sparringAvailabilitySchema);
