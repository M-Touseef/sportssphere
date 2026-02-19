const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const conversationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        default: 'New Conversation'
    },
    messages: [messageSchema],
    context: {
        userSkillLevel: String,
        userCity: String,
        lastTopic: String,
        preferences: {
            type: Map,
            of: String
        }
    },
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

// Index for efficient querying
conversationSchema.index({ user: 1, isActive: 1 });
conversationSchema.index({ createdAt: -1 });

// Update the updatedAt timestamp before saving
conversationSchema.pre('save', function (next) {
    this.updatedAt = Date.now();

    // Auto-generate title from first user message if still default
    if (this.title === 'New Conversation' && this.messages.length > 0) {
        const firstUserMessage = this.messages.find(m => m.role === 'user');
        if (firstUserMessage) {
            // Take first 50 characters of first message as title
            this.title = firstUserMessage.content.substring(0, 50) +
                (firstUserMessage.content.length > 50 ? '...' : '');
        }
    }

    next();
});

// Virtual to get message count
conversationSchema.virtual('messageCount').get(function () {
    return this.messages.length;
});

// Virtual to get last message
conversationSchema.virtual('lastMessage').get(function () {
    return this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;
});

// Method to add a message
conversationSchema.methods.addMessage = function (role, content) {
    this.messages.push({
        role,
        content,
        timestamp: new Date()
    });
    this.updatedAt = new Date();
};

// Method to update context
conversationSchema.methods.updateContext = function (contextData) {
    this.context = {
        ...this.context,
        ...contextData
    };
};

// Method to get conversation history for AI
conversationSchema.methods.getHistory = function (limit = 10) {
    // Return last N messages for context
    return this.messages.slice(-limit).map(msg => ({
        role: msg.role,
        content: msg.content
    }));
};

module.exports = mongoose.model('Conversation', conversationSchema);
