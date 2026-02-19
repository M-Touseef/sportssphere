# SportsSphere - System Architecture

## Overview

SportsSphere uses a **microservices architecture** consisting of three main services that communicate via REST APIs. This architecture ensures modularity, scalability, and separation of concerns.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│                      (React + Vite)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Pages   │  │Components│  │ Services │  │   Auth   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                    http://localhost:5173                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP/REST API
                     │
         ┌───────────┴───────────────────┐
         │                               │
         ▼                               ▼
┌─────────────────┐            ┌──────────────────┐
│     SERVER      │            │   AI SERVICE     │
│  (Express.js)   │            │   (Flask API)    │
│                 │            │                  │
│ ┌─────────────┐ │            │ ┌──────────────┐ │
│ │   Routes    │ │            │ │   Chatbot    │ │
│ │ Controllers │ │            │ │   Endpoint   │ │
│ │ Middleware  │ │            │ └──────────────┘ │
│ └─────────────┘ │            │                  │
│        │        │            │  Port 5001       │
│        ▼        │            └──────────────────┘
│ ┌─────────────┐ │
│ │   Models    │ │
│ └──────┬──────┘ │
│        │        │
│  Port 5000      │
└────────┼────────┘
         │
         ▼
┌─────────────────┐
│    MongoDB      │
│   Database      │
└─────────────────┘
```

---

## Component Breakdown

### 1. Client (Frontend)

**Technology:** React.js with Vite

**Responsibilities:**
- User interface rendering
- Client-side routing (React Router)
- State management
- API calls to backend services
- Authentication token management

**Key Directories:**
- `pages/` - Route-specific page components
- `components/` - Reusable UI components
- `services/` - API integration layer (Axios)
- `auth/` - Authentication context and route guards

**Communication:**
- Sends HTTP requests to Server API (`http://localhost:5000/api`)
- Sends chatbot queries to AI Service (`http://localhost:5001/api/chat`)

---

### 2. Server (Backend API)

**Technology:** Node.js with Express.js

**Responsibilities:**
- RESTful API endpoints
- Business logic implementation
- Database operations (CRUD)
- Authentication & authorization (JWT)
- Email notifications (nodemailer)
- Mock payment processing
- Tournament bracket generation

**Key Directories:**
- `routes/` - API endpoint definitions
- `controllers/` - Request handlers and business logic
- `models/` - Mongoose schemas for MongoDB
- `middleware/` - Authentication, validation, error handling
- `utils/` - Helper functions (email, payment, bracket generation)
- `config/` - Database connection and app configuration

**API Endpoints (Planned):**
```
/api/auth          - User registration, login, token refresh
/api/users         - User profile management
/api/courts        - Court listing, booking, availability
/api/coaches       - Coach profiles, session booking
/api/tournaments   - Tournament CRUD, registration, brackets
/api/sparring      - Matchmaking requests and responses
/api/payments      - Payment initiation and verification
```

**Communication:**
- Receives HTTP requests from Client
- Queries MongoDB for data persistence
- May call AI Service for chatbot integration (optional)

---

### 3. AI Service (Microservice)

**Technology:** Python with Flask

**Responsibilities:**
- Natural language processing for chatbot
- Badminton-related question answering
- Potentially: Match prediction, player analytics (future)

**Key Files:**
- `app.py` - Flask application with chatbot endpoint

**API Endpoints:**
```
POST /api/chat     - Accept user message, return AI response
GET  /api/health   - Health check endpoint
```

**Communication:**
- Receives HTTP requests from Client (directly) or Server (optionally)
- May integrate with OpenAI API or custom trained models

---

## Data Flow Examples

### User Registration Flow
```
1. User fills registration form on Client
2. Client sends POST /api/auth/register to Server
3. Server validates data, hashes password
4. Server saves user to MongoDB
5. Server generates JWT token
6. Server returns token + user data to Client
7. Client stores token in localStorage
8. Client redirects to dashboard
```

### Tournament Creation Flow
```
1. Organizer creates tournament on Client
2. Client sends POST /api/tournaments to Server
3. Server validates organizer role (JWT middleware)
4. Server saves tournament to MongoDB
5. Server returns tournament ID to Client
6. Client displays success message
```

### Chatbot Query Flow
```
1. User types question in chatbot widget
2. Client sends POST /api/chat to AI Service
3. AI Service processes query with NLP model
4. AI Service returns response
5. Client displays response in chat interface
```

---

## Authentication Flow

SportsSphere uses **JWT (JSON Web Tokens)** for stateless authentication:

1. User logs in with credentials
2. Server verifies credentials against MongoDB
3. Server generates JWT with user ID and role
4. Client stores JWT in localStorage
5. Client includes JWT in `Authorization` header for protected routes
6. Server middleware verifies JWT on each request
7. Access granted based on user role

**Roles:**
- `player` - Book courts, join tournaments, request sparring
- `coach` - Create profile, manage sessions
- `organizer` - Create tournaments, update results
- `admin` - Full system access
- `referee` - Update match results

---

## Database Schema (MongoDB)

### Collections (Planned):

1. **users** - Player, Coach, Organizer, Admin accounts
2. **courts** - Badminton court listings
3. **bookings** - Court reservation records
4. **coaches** - Coach profiles and availability
5. **sessions** - Coaching session bookings
6. **tournaments** - Tournament metadata
7. **matches** - Individual match records
8. **brackets** - Tournament bracket structures
9. **sparring_requests** - Matchmaking requests
10. **payments** - Payment transaction records
11. **notifications** - Email notification queue

---

## Security Considerations

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Expiration**: 7-day default, refresh token support
- **CORS**: Configured to allow only trusted origins
- **Input Validation**: express-validator for all inputs
- **Environment Variables**: All secrets stored in `.env`
- **Rate Limiting**: To be implemented for API endpoints

---

## Scalability Notes

- **Horizontal Scaling**: Each service can be deployed independently
- **Database**: MongoDB can be sharded for large datasets
- **Caching**: Redis can be added for session management
- **Load Balancing**: Nginx/AWS ELB for production deployment
- **CDN**: Static assets can be served via CDN

---

## Future Enhancements

- **WebSocket Integration**: Real-time match updates, live chat
- **Mobile App**: React Native for iOS/Android
- **Analytics Dashboard**: Player statistics, tournament insights
- **Video Integration**: Match recording uploads
- **Payment Gateway**: Real JazzCash/EasyPaisa integration

---

**Last Updated:** December 5, 2025  
**Version:** 1.0
