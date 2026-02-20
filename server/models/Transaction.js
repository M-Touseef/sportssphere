const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        orderType: {
            type: String,
            required: true,
            enum: ['Booking', 'TournamentRegistration', 'Session', 'SessionCourt']
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        txnRefNo: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        jazzcashTxnId: {
            type: String,
            default: null
        },
        // Amount in PKR (whole number, NOT paisa)
        amount: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'failed'],
            default: 'pending'
        },
        // Raw IPN payload stored for audit / debugging
        ipnPayload: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        }
    },
    {
        timestamps: true // adds createdAt + updatedAt automatically
    }
);

module.exports = mongoose.model('Transaction', transactionSchema);
