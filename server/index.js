const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

const path = require('path');

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes placeholder
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to SportsSphere API' });
});

app.get('/api/ping', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Pong' });
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const courtRoutes = require('./routes/courtRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const coachRoutes = require('./routes/coachRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');
const matchRoutes = require('./routes/matchRoutes');
const sparringRoutes = require('./routes/sparringAvailabilityRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');
const professionalRoutes = require('./routes/professionalRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const imageRoutes = require('./routes/images');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courts', courtRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/sparring', sparringRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/professional', professionalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/images', imageRoutes);

// Error handling middleware
// Error handling middleware
const errorMiddleware = require('./middleware/errorMiddleware');
app.use(errorMiddleware);

const http = require('http');
const socketIo = require('./socket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
socketIo.init(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
