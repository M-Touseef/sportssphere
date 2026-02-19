const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    court: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Court',
        required: false
    },
    venue: {
        name: String,
        city: String,
        address: String
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    proPlayer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    sparringRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SparringSessionRequest'
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String, // e.g., "10:00"
        required: true
    },
    endTime: {
        type: String, // e.g., "11:00"
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending_pro', 'pending_payment', 'confirmed', 'cancelled', 'completed'],
        default: 'confirmed'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent double booking (allow overlapping cancelled bookings)
bookingSchema.index({ court: 1, date: 1, startTime: 1 }, {
    unique: true,
    partialFilterExpression: { status: { $ne: 'cancelled' } }
});

module.exports = mongoose.model('Booking', bookingSchema);
