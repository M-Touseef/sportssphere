const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    coach: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    maxStudents: {
        type: Number,
        default: 1
    },
    court: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Court',
        required: true
    },
    courtBooking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    },
    responseDeadline: {
        type: Date
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
    duration: {
        type: Number, // in hours
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    planType: {
        type: String,
        enum: ['hourly', 'monthly'],
        default: 'hourly'
    },
    sessionType: {
        type: String,
        enum: ['individual', 'group'],
        default: 'individual'
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['pending', 'pending_payment', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    courtFee: {
        type: Number,
        default: 0
    },
    courtPaymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent double booking for coach (allow overlapping cancelled sessions)
sessionSchema.index({ coach: 1, date: 1, startTime: 1 }, {
    unique: true,
    partialFilterExpression: { status: { $ne: 'cancelled' } }
});

sessionSchema.index({ responseDeadline: 1, status: 1 });

module.exports = mongoose.model('Session', sessionSchema);
