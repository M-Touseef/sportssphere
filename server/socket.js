const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

module.exports = {
    // Initialize Socket.io
    init: (httpServer) => {
        io = socketIo(httpServer, {
            cors: {
                origin: '*', // Allow all origins for development, restrict in production
                methods: ['GET', 'POST']
            }
        });

        io.use((socket, next) => {
            // Authentication Middleware
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

                if (!token) {
                    return next(new Error('Authentication error'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.userId = decoded.id;
                next();
            } catch (err) {
                next(new Error('Authentication error'));
            }
        });

        io.on('connection', (socket) => {
            console.log('Client connected:', socket.userId);

            // Join user to their own room for private messages
            socket.join(socket.userId);

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.userId);
            });
        });

        return io;
    },

    // Get io instance
    getIO: () => {
        if (!io) {
            throw new Error('Socket.io not initialized!');
        }
        return io;
    }
};
