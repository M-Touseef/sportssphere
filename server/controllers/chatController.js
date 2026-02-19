const Conversation = require('../models/Conversation');
const aiService = require('../services/aiService');

// @desc    Get all conversations for a user
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            user: req.user.id,
            isActive: true
        })
            .sort({ updatedAt: -1 })
            .select('title messages createdAt updatedAt');

        // Add message count and last message to each conversation
        const conversationsWithDetails = conversations.map(conv => ({
            _id: conv._id,
            title: conv.title,
            messageCount: conv.messages.length,
            lastMessage: conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null,
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt
        }));

        res.status(200).json({
            success: true,
            count: conversationsWithDetails.length,
            data: conversationsWithDetails
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Get single conversation
// @route   GET /api/chat/conversations/:id
// @access  Private
exports.getConversation = async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Check authorization
        if (conversation.user.toString() !== req.user.id) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        res.status(200).json({
            success: true,
            data: conversation
        });
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Create new conversation
// @route   POST /api/chat/conversations
// @access  Private
exports.createConversation = async (req, res) => {
    try {
        const { title, initialMessage } = req.body;

        const conversation = await Conversation.create({
            user: req.user.id,
            title: title || 'New Conversation',
            context: {
                userSkillLevel: req.user.skillLevel,
                userCity: req.user.city
            }
        });

        // If there's an initial message, add it and get AI response
        if (initialMessage) {
            conversation.addMessage('user', initialMessage);

            // Generate AI response
            const aiResponse = await aiService.generateResponse(
                initialMessage,
                conversation.context
            );

            conversation.addMessage('assistant', aiResponse);
            await conversation.save();
        }

        res.status(201).json({
            success: true,
            data: conversation
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Send message to conversation
// @route   POST /api/chat/conversations/:id/messages
// @access  Private
exports.sendMessage = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Message is required' });
        }

        const conversation = await Conversation.findById(req.params.id);

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Check authorization
        if (conversation.user.toString() !== req.user.id) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        // Add user message to DB
        conversation.addMessage('user', message);
        await conversation.save();

        const userMessageObj = conversation.messages[conversation.messages.length - 1];
        const userId = req.user.id;

        // Get socket instance
        const io = require('../socket').getIO();

        // Emit user message to client (for other tabs/sync)
        io.to(userId).emit('receive_message', {
            conversationId: conversation._id,
            message: userMessageObj
        });

        // Emit typing indicator
        io.to(userId).emit('typing_start', { conversationId: conversation._id });

        // --- Synchronous AI Processing ---
        try {
            // Update context based on message content
            const lowerMessage = message.toLowerCase();
            if (lowerMessage.includes('beginner') || lowerMessage.includes('new to')) {
                conversation.context.userSkillLevel = 'beginner';
            } else if (lowerMessage.includes('advanced') || lowerMessage.includes('experienced')) {
                conversation.context.userSkillLevel = 'advanced';
            }

            // Extract topic for context
            const topics = ['rules', 'technique', 'equipment', 'training', 'strategy', 'fitness'];
            for (const topic of topics) {
                if (lowerMessage.includes(topic)) {
                    conversation.context.lastTopic = topic;
                    break;
                }
            }

            // Prepare context for AI
            const aiContext = {
                ...conversation.context,
                userId: userId
            };

            // Generate AI response
            const aiResponseText = await aiService.generateResponse(
                message,
                aiContext
            );

            // Add AI response to DB
            // Re-fetch conversation to avoid version errors if multiple requests happened
            const updatedConversation = await Conversation.findById(conversation._id);
            updatedConversation.addMessage('assistant', aiResponseText);
            await updatedConversation.save();

            const aiMessageObj = updatedConversation.messages[updatedConversation.messages.length - 1];

            // Emit typing end and AI message
            io.to(userId).emit('typing_end', { conversationId: conversation._id });
            io.to(userId).emit('receive_message', {
                conversationId: conversation._id,
                message: aiMessageObj
            });

            // Send HTTP response with BOTH user message and AI message
            res.status(200).json({
                success: true,
                data: {
                    userMessage: userMessageObj,
                    aiMessage: aiMessageObj
                }
            });

        } catch (aiError) {
            console.error('[AI Error]:', aiError);
            io.to(userId).emit('typing_end', { conversationId: conversation._id });

            // If AI fails, still return success for the user message, but without AI message
            res.status(200).json({
                success: true,
                data: {
                    userMessage: userMessageObj,
                    aiMessage: {
                        role: 'assistant',
                        content: "I'm having trouble processing that right now."
                    }
                }
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Delete conversation
// @route   DELETE /api/chat/conversations/:id
// @access  Private
exports.deleteConversation = async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Check authorization
        if (conversation.user.toString() !== req.user.id) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        // Soft delete - mark as inactive
        conversation.isActive = false;
        await conversation.save();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Update conversation title
// @route   PUT /api/chat/conversations/:id
// @access  Private
exports.updateConversation = async (req, res) => {
    try {
        const { title } = req.body;

        const conversation = await Conversation.findById(req.params.id);

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Check authorization
        if (conversation.user.toString() !== req.user.id) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        if (title) {
            conversation.title = title;
            await conversation.save();
        }

        res.status(200).json({
            success: true,
            data: conversation
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Clear conversation messages
// @route   POST /api/chat/conversations/:id/clear
// @access  Private
exports.clearConversation = async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Check authorization
        if (conversation.user.toString() !== req.user.id) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        conversation.messages = [];
        conversation.title = 'New Conversation';
        await conversation.save();

        res.status(200).json({
            success: true,
            data: conversation
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
