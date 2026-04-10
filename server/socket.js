const socketIo = require('socket.io');
let io = null;

/**
 * Initialize Socket.io with proper configuration
 * @param {Object} server - HTTP server instance
 */
const init = (server) => {
    io = require('socket.io')(server, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        },
        transports: ['websocket', 'polling'],
        upgrade: false
    });

    // Connection handling
    io.on('connection', (socket) => {
        console.log('Socket connected:', socket.id);
        
        // Join conversation room
        socket.on('joinConversation', (conversationId) => {
            socket.join(conversationId);
            console.log(`User ${socket.id} joined conversation ${conversationId}`);
        });

        // Handle new messages
        socket.on('sendMessage', async (data) => {
            try {
                // This will be processed by chatController
                console.log('Message received:', data);
            } catch (error) {
                console.error('Socket message error:', error);
                socket.emit('error', { message: error.message });
            }
        });

        // Typing indicators
        socket.on('typing', (conversationId) => {
            socket.to(conversationId).emit('typing');
        });

        socket.on('stopTyping', (conversationId) => {
            socket.to(conversationId).emit('stopTyping');
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('Socket disconnected:', socket.id);
        });
    });

    console.log('Socket.io initialized');
    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized. Call init() first.');
    }
    return io;
};

module.exports = { init, getIO };
