const mongoose = require('mongoose');

const sparringSessionRequestSchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    proPlayer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    availabilitySlot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SparringAvailability',
        required: false
    },
    message: {
        type: String,
        trim: true,
        maxlength: 500
    },
    paymentPlan: {
        type: String,
        enum: ['hourly', 'monthly'],
        default: 'hourly' // Default for sparring is technically flat fee (handled as hourly equivalent or one-time)
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    status: {
        type: String,
        enum: ['PENDING_RESPONSE', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'APPROVED_PAYMENT_PENDING', 'AUTO_REJECTED'],
        default: 'PENDING_RESPONSE'
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    },
    responseDeadline: {
        type: Date,
        required: true
    },
    respondedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Unique index: Only one active request per availability slot
sparringSessionRequestSchema.index(
    { availabilitySlot: 1 },
    {
        unique: true,
        partialFilterExpression: {
            status: 'PENDING_RESPONSE',
            availabilitySlot: { $exists: true, $ne: null }
        }
    }
);

// Index for efficient queries
sparringSessionRequestSchema.index({ requester: 1, status: 1 });
sparringSessionRequestSchema.index({ proPlayer: 1, status: 1 });
sparringSessionRequestSchema.index({ responseDeadline: 1, status: 1 });

// Virtual to check if request is expired
sparringSessionRequestSchema.virtual('isExpired').get(function () {
    return this.status === 'PENDING_RESPONSE' && new Date() > this.responseDeadline;
});

// Method to auto-reject the request
sparringSessionRequestSchema.methods.autoReject = async function () {
    if (this.status === 'PENDING_RESPONSE' && new Date() > this.responseDeadline) {
        this.status = 'AUTO_REJECTED';
        this.respondedAt = new Date();
        await this.save();

        // Reset the availability slot to OPEN if it exists
        if (this.availabilitySlot) {
            const SparringAvailability = mongoose.model('SparringAvailability');
            await SparringAvailability.findByIdAndUpdate(this.availabilitySlot, { status: 'OPEN' });
        }

        return true;
    }
    return false;
};

module.exports = mongoose.model('SparringSessionRequest', sparringSessionRequestSchema);
