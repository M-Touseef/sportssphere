const mongoose = require('mongoose');
const { LAHORE_AREAS } = require('../constants/lahoreAreas');

const tournamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    court: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Court',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    registrationDeadline: {
        type: Date,
        required: true
    },
    venue: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    area: {
        type: String,
        enum: LAHORE_AREAS,
        trim: true
    },
    categories: [{
        name: {
            type: String,
            required: true,
            enum: ['mens_singles', 'womens_singles', 'mens_doubles', 'womens_doubles', 'mixed_doubles', 'junior_boys', 'junior_girls']
        },
        maxParticipants: {
            type: Number,
            required: true
        },
        entryFee: {
            type: Number,
            required: true,
            default: 0
        },
        prizePool: {
            first: Number,
            second: Number,
            third: Number
        },
        skillLevel: {
            type: String,
            enum: ['division', 'national', 'international'],
            default: 'division'
        }
    }],
    status: {
        type: String,
        enum: ['draft', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'cancelled'],
        default: 'draft'
    },
    format: {
        type: String,
        enum: ['single_elimination'],
        default: 'single_elimination'
    },
    rules: {
        type: String
    },
    contactEmail: {
        type: String,
        required: true
    },
    contactPhone: {
        type: String,
        validate: {
            validator(v) {
                if (!v) return true;
                return /^[0-9]{11}$/.test(String(v).replace(/\D/g, ''));
            },
            message: 'Contact phone must be exactly 11 digits'
        }
    },
    banner: {
        type: String // URL to banner image
    },
    isPublished: {
        type: Boolean,
        default: false
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

// Update the updatedAt timestamp before saving
tournamentSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual for checking if registration is open
tournamentSchema.virtual('isRegistrationOpen').get(function () {
    const now = new Date();
    return this.status === 'registration_open' &&
        now <= this.registrationDeadline;
});

// Virtual for checking if tournament has started
tournamentSchema.virtual('hasStarted').get(function () {
    return new Date() >= this.startDate;
});

// Prevent duplicate tournaments with same name in same city
tournamentSchema.index({ name: 1, city: 1 }, { unique: true });

module.exports = mongoose.model('Tournament', tournamentSchema);
