# SportsSphere 🏸

**A Full-Stack Badminton Management Platform for Pakistan**

SportsSphere is a comprehensive web application designed to centralize badminton activities across Pakistan. This platform connects players, coaches, organizers, and administrators while providing features for court booking, tournament management, coach sessions, sparring matchmaking, and AI-powered assistance.

> **Project Type:** Final Year Project  
> **Tech Stack:** MERN Stack + Python Flask + AI Integration

---

## 📋 Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Available Scripts](#available-scripts)
- [Architecture](#architecture)
- [Team Roles](#team-roles)

---

## ✨ Features

### Core Functionality
- **User Management**: Role-based authentication for Players, Coaches, Organizers, and Admins
- **Court Booking**: Search and book badminton courts by location and availability ✅
- **Coach Management**: Complete coach profile system with search, booking, and ratings ✅
- **Session Booking**: Book coaching sessions with automatic pricing and conflict prevention ✅
- **Rating System**: Rate and review completed coaching sessions ✅
- **Tournament Management**: Full tournament system with registration, brackets, and leaderboards ✅
- **Sparring Matchmaking**: Intelligent matching algorithm based on skill, location, and availability ✅
- **AI Chatbot**: Context-aware badminton assistant with knowledge base ✅

### Coach Management System (Phase 3) ✅
- **Coach Profiles**: Comprehensive profiles with specializations, certifications, and availability
- **Search & Filter**: Find coaches by city, specialization, and price range
- **Session Booking**: Book individual or group coaching sessions
- **Coach Dashboard**: Manage sessions, view statistics, and update profile
- **Rating & Reviews**: Interactive star rating system with written reviews
- **Student Dashboard**: View and manage all booked sessions

### Tournament Management System (Phase 4) ✅
- **Tournament Creation**: Organizers create tournaments with multiple categories
- **Player Registration**: Register for singles or doubles with validation
- **Auto-Generated Brackets**: Single elimination brackets with automatic bye handling
- **Match Result Submission**: Submit scores with automatic winner calculation
- **Bracket Progression**: Winners automatically advance to next round
- **Leaderboards**: Real-time rankings with comprehensive statistics
- **Category Management**: Multiple categories per tournament with prize pools
- **Tournament Formats**: Single elimination, double elimination, round robin, Swiss

### Sparring Matchmaking System (Phase 5) ✅
- **Sparring Requests**: Create detailed requests with availability and preferences
- **Intelligent Matching**: 5-factor algorithm with compatibility scoring (0-100%)
- **Match Requests**: Send and receive match requests with scores
- **Availability Management**: Weekly schedule with multiple time slots
- **Match Responses**: Accept or reject incoming match requests
- **Contact Exchange**: Share contact info for accepted matches
- **Filtering**: Search by city, skill level, and game type

### AI Chatbot System (Phase 6) ✅
- **Conversation Management**: Create, view, and manage multiple conversations
- **Badminton Knowledge Base**: 6 categories (rules, techniques, equipment, training, strategy, fitness)
- **Context Awareness**: Adapts responses based on user skill level and preferences
- **Message History**: Full conversation history with timestamps
- **Modern UI**: Beautiful chat interface with sidebar and message bubbles
- **Platform Guidance**: Help with court booking, coaches, tournaments, and sparring

### Additional Features
- **Mock Payment System**: Simulated JazzCash/Stripe integration
- **Email Notifications**: Automated confirmations and reminders (structure ready)
- **Responsive Design**: Mobile-first UI with React and TailwindCSS
- **Navigation Bar**: Responsive navigation with role-based menu items

---

## 📁 Project Structure

```
SportsSphere/
├── client/              # React Frontend (Vite)
│   ├── src/
│   │   ├── pages/       # Route-based page components
│   │   ├── components/  # Reusable UI components
│   │   ├── services/    # API service layer (Axios)
│   │   ├── auth/        # Authentication context & guards
│   │   └── assets/      # Images, icons, styles
│   └── .env.example     # Client environment variables
│
├── server/              # Express.js Backend
│   ├── routes/          # API route definitions
│   ├── controllers/     # Business logic handlers
│   ├── models/          # MongoDB Mongoose schemas
│   ├── middleware/      # Auth, validation, error handling
│   ├── utils/           # Helper functions
│   ├── config/          # Database & app configuration
│   └── .env.example     # Server environment variables
│
├── ai-service/          # Python Flask AI Microservice
│   ├── app.py           # Flask app entry point
│   ├── requirements.txt # Python dependencies
│   └── .env.example     # AI service environment variables
│
├── shared/              # Shared constants & utilities
│   └── constants.js     # User roles, statuses, enums
│
└── docs/                # Documentation & diagrams
    ├── architecture.md  # System architecture overview
    ├── setup.md         # Detailed setup instructions
    ├── PHASE3_COACH_MANAGEMENT.md  # Phase 3 implementation guide
    ├── PHASE3_SUMMARY.md           # Phase 3 completion summary
    ├── API_REFERENCE_COACHES.md    # Coach API documentation
    └── QUICK_START_GUIDE.md        # Quick start testing guide
```

---

## 🛠 Technologies Used

### Frontend
- **React.js** - UI Library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **TailwindCSS/Bootstrap** - Styling framework

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Token-based authentication
- **bcryptjs** - Password hashing
- **nodemailer** - Email notifications

### AI Service
- **Python 3.x** - Programming language
- **Flask** - Lightweight web framework
- **Flask-CORS** - Cross-origin resource sharing
- **OpenAI API** *(optional)* - AI chatbot integration

### DevOps & Tools
- **Git** - Version control
- **dotenv** - Environment variable management
- **Postman** - API testing

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.x or higher)
- **npm** or **yarn**
- **Python** (v3.9 or higher)
- **MongoDB** (local or Atlas)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SportsSphere
   ```

2. **Setup Client (React)**
   ```bash
   cd client
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Setup Server (Express)**
   ```bash
   cd ../server
   npm install
   cp .env.example .env
   # Edit .env with MongoDB URI and secrets
   ```

4. **Setup AI Service (Flask)**
   ```bash
   cd ../ai-service
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with AI API keys if needed
   ```

---

## ⚙️ Environment Setup

### Client `.env`
```env
VITE_API_URL=http://localhost:5000/api
VITE_AI_SERVICE_URL=http://localhost:5001
```

### Server `.env`
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/sportssphere
JWT_SECRET=your_secret_key
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_TIMEOUT_MS=10000
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_password
```

### AI Service `.env`
```env
PORT=5001
FLASK_ENV=development
OPENAI_API_KEY=your_openai_key  # Optional
```

---

## 📜 Available Scripts

### Client
```bash
npm run dev      # Start development server (http://localhost:5173)
npm run build    # Build for production
npm run preview  # Preview production build
```

### Server
```bash
npm run dev      # Start server with nodemon (auto-reload)
npm start        # Start server in production mode
```

### AI Service
```bash
python app.py    # Start Flask development server (http://localhost:5001)
```

---

## 🏗 Architecture

This is a **microservices-based architecture** with three main components:

1. **Client (SPA)**: Single Page Application built with React
2. **Server (REST API)**: RESTful API handling business logic and data
3. **AI Service**: Standalone Flask microservice for chatbot functionality

For detailed architecture diagrams and flow charts, see [`docs/architecture.md`](./docs/architecture.md).

---

## 👥 Team Roles

| Role | Responsibility |
|------|---------------|
| **Frontend Developer** | React components, UI/UX, client-side routing |
| **Backend Developer** | Express APIs, database models, authentication |
| **AI Developer** | Chatbot integration, Flask service |
| **Full-Stack Developer** | Integration, deployment, testing |

---

## 📝 Notes

- **Phase 3 (Coach Management)** is now **COMPLETE** ✅
- **Phase 4 (Tournament Management)** is now **COMPLETE** ✅
- **Phase 5 (Sparring Matchmaking)** is now **COMPLETE** ✅
- **Phase 6 (AI Chatbot)** is now **COMPLETE** ✅
- **ALL 6 PHASES COMPLETE!** 🎉
- All features are fully functional and tested
- MongoDB must be running before starting the server
- See `docs/QUICK_START_GUIDE.md` for testing instructions
- See `docs/PHASE3_SUMMARY.md` for coach management details
- See `docs/PHASE4_TOURNAMENT_MANAGEMENT.md` for tournament details
- See `docs/PHASE5_SPARRING_MATCHMAKING.md` for sparring details
- See `docs/PHASE6_AI_CHATBOT.md` for chatbot details
- See `docs/COMPLETE_WALKTHROUGH.md` for full project overview

---

## 📧 Contact

For questions or contributions, please contact the SportsSphere development team.

---

**Version:** 1.0.0  
**Last Updated:** December 5, 2025
