const mongoose = require('mongoose');

const courtSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        address: { type: String, required: true },
        area: { type: String, required: true },
        city: { type: String, required: true },
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    description: {
        type: String,
        required: true
    },
    pricePerHour: {
        type: Number,
        required: true
    },
    surfaceType: {
        type: String,
        enum: ['synthetic', 'wooden', 'cement', 'acrylic'],
        required: true
    },
    amenities: [{
        type: String
    }],
    images: [{
        type: String
    }],
    openingTime: {
        type: String, // e.g., "06:00"
        required: true
    },
    closingTime: {
        type: String, // e.g., "22:00"
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent duplicate courts with same name in same Lahore area
courtSchema.index({ name: 1, 'location.area': 1 }, { unique: true });

module.exports = mongoose.model('Court', courtSchema);
