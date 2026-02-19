const express = require('express');
const router = express.Router();
const {
    getConversations,
    getConversation,
    createConversation,
    sendMessage,
    deleteConversation,
    updateConversation,
    clearConversation
} = require('../controllers/chatController');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Conversation routes
router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.get('/conversations/:id', getConversation);
router.put('/conversations/:id', updateConversation);
router.delete('/conversations/:id', deleteConversation);

// Message routes
router.post('/conversations/:id/messages', sendMessage);
router.post('/conversations/:id/clear', clearConversation);

module.exports = router;
