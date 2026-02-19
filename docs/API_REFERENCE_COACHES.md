# SportSphere API Reference - Coach Management

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Coach Endpoints

### Get All Coaches
Get a list of all active coaches with optional filtering.

**Endpoint:** `GET /coaches`

**Access:** Public

**Query Parameters:**
- `city` (optional) - Filter by city name (case-insensitive)
- `specialization` (optional) - Filter by specialization
- `minRate` (optional) - Minimum hourly rate
- `maxRate` (optional) - Maximum hourly rate

**Example Request:**
```bash
GET /api/coaches?city=Mumbai&specialization=singles
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "coach_id",
      "user": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "city": "Mumbai"
      },
      "specialization": ["singles", "doubles"],
      "experience": 5,
      "hourlyRate": 1000,
      "bio": "Professional badminton coach...",
      "rating": {
        "average": 4.5,
        "count": 20
      },
      "certifications": [...],
      "availability": [...],
      "location": {
        "city": "Mumbai",
        "areas": ["Andheri", "Bandra"]
      }
    }
  ]
}
```

---

### Get Single Coach Profile
Get detailed information about a specific coach.

**Endpoint:** `GET /coaches/:id`

**Access:** Public

**URL Parameters:**
- `id` - Coach profile ID

**Example Request:**
```bash
GET /api/coaches/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "coach_id",
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "city": "Mumbai",
      "phone": "+91-9876543210"
    },
    "specialization": ["singles", "doubles"],
    "experience": 5,
    "hourlyRate": 1000,
    "bio": "Professional badminton coach...",
    "certifications": [
      {
        "name": "BWF Level 1",
        "issuedBy": "Badminton World Federation",
        "year": 2018
      }
    ],
    "availability": [
      {
        "day": "monday",
        "startTime": "09:00",
        "endTime": "17:00"
      }
    ],
    "rating": {
      "average": 4.5,
      "count": 20
    },
    "location": {
      "city": "Mumbai",
      "areas": ["Andheri", "Bandra"]
    }
  }
}
```

---

### Get My Coach Profile
Get the authenticated coach's own profile.

**Endpoint:** `GET /coaches/me`

**Access:** Private (Coach only)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** Same as Get Single Coach Profile

---

### Create/Update Coach Profile
Create a new coach profile or update an existing one.

**Endpoint:** `POST /coaches/profile`

**Access:** Private (Coach only)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "specialization": ["singles", "doubles", "technique"],
  "experience": 5,
  "hourlyRate": 1000,
  "bio": "Professional badminton coach with 5 years of experience...",
  "certifications": [
    {
      "name": "BWF Level 1",
      "issuedBy": "Badminton World Federation",
      "year": 2018
    }
  ],
  "availability": [
    {
      "day": "monday",
      "startTime": "09:00",
      "endTime": "17:00"
    },
    {
      "day": "wednesday",
      "startTime": "09:00",
      "endTime": "17:00"
    }
  ],
  "location": {
    "city": "Mumbai",
    "areas": ["Andheri", "Bandra", "Juhu"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Full coach profile object
  }
}
```

---

## Session Endpoints

### Book a Session
Book a coaching session with a coach.

**Endpoint:** `POST /sessions`

**Access:** Private

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "coachId": "user_id_of_coach",
  "date": "2024-12-10",
  "startTime": "10:00",
  "endTime": "11:00",
  "duration": 1,
  "location": "ABC Sports Complex, Mumbai",
  "sessionType": "individual",
  "notes": "Focus on backhand technique"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "session_id",
    "coach": {
      "_id": "coach_id",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "student": {
      "_id": "student_id",
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    "date": "2024-12-10T00:00:00.000Z",
    "startTime": "10:00",
    "endTime": "11:00",
    "duration": 1,
    "totalPrice": 1000,
    "location": "ABC Sports Complex, Mumbai",
    "sessionType": "individual",
    "status": "confirmed",
    "paymentStatus": "paid",
    "notes": "Focus on backhand technique",
    "createdAt": "2024-12-05T17:00:00.000Z"
  }
}
```

---

### Get My Sessions (Student)
Get all sessions booked by the authenticated student.

**Endpoint:** `GET /sessions/my`

**Access:** Private

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "session_id",
      "coach": {
        "_id": "coach_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "date": "2024-12-10T00:00:00.000Z",
      "startTime": "10:00",
      "endTime": "11:00",
      "duration": 1,
      "totalPrice": 1000,
      "location": "ABC Sports Complex",
      "sessionType": "individual",
      "status": "confirmed",
      "rating": null
    }
  ]
}
```

---

### Get Coach Sessions
Get all sessions for the authenticated coach.

**Endpoint:** `GET /sessions/coach`

**Access:** Private (Coach only)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "session_id",
      "student": {
        "_id": "student_id",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "phone": "+91-9876543210"
      },
      "date": "2024-12-10T00:00:00.000Z",
      "startTime": "10:00",
      "endTime": "11:00",
      "duration": 1,
      "totalPrice": 1000,
      "location": "ABC Sports Complex",
      "sessionType": "individual",
      "status": "confirmed",
      "notes": "Focus on backhand technique"
    }
  ]
}
```

---

### Cancel Session
Cancel a booked session.

**Endpoint:** `PUT /sessions/:id/cancel`

**Access:** Private (Student or Coach who owns the session)

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` - Session ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "session_id",
    "status": "cancelled",
    // ... other session fields
  }
}
```

---

### Rate Session
Submit a rating and review for a completed session.

**Endpoint:** `PUT /sessions/:id/rate`

**Access:** Private (Student only)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**
- `id` - Session ID

**Request Body:**
```json
{
  "score": 5,
  "review": "Excellent coaching session! Very helpful and professional."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "session_id",
    "rating": {
      "score": 5,
      "review": "Excellent coaching session! Very helpful and professional.",
      "createdAt": "2024-12-05T17:00:00.000Z"
    },
    // ... other session fields
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Not authorized"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Server Error
```json
{
  "error": "Server error"
}
```

---

## Data Models

### Specialization Options
- `singles`
- `doubles`
- `mixed_doubles`
- `junior_coaching`
- `fitness`
- `technique`

### Session Status
- `pending` - Awaiting confirmation
- `confirmed` - Confirmed and scheduled
- `completed` - Session has been completed
- `cancelled` - Session was cancelled

### Session Type
- `individual` - One-on-one coaching
- `group` - Group coaching session

### Payment Status
- `pending` - Payment not received
- `paid` - Payment completed
- `refunded` - Payment refunded

### Days of Week
- `monday`
- `tuesday`
- `wednesday`
- `thursday`
- `friday`
- `saturday`
- `sunday`

---

## Usage Examples

### JavaScript/Axios

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Get all coaches
const getCoaches = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await axios.get(`${API_BASE_URL}/coaches?${params}`);
  return response.data;
};

// Book a session
const bookSession = async (sessionData, token) => {
  const response = await axios.post(
    `${API_BASE_URL}/sessions`,
    sessionData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

// Rate a session
const rateSession = async (sessionId, rating, token) => {
  const response = await axios.put(
    `${API_BASE_URL}/sessions/${sessionId}/rate`,
    rating,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};
```

### cURL

```bash
# Get coaches in Mumbai
curl -X GET "http://localhost:5000/api/coaches?city=Mumbai"

# Book a session
curl -X POST "http://localhost:5000/api/sessions" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "coachId": "coach_user_id",
    "date": "2024-12-10",
    "startTime": "10:00",
    "endTime": "11:00",
    "duration": 1,
    "location": "ABC Sports Complex",
    "sessionType": "individual"
  }'

# Rate a session
curl -X PUT "http://localhost:5000/api/sessions/SESSION_ID/rate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "score": 5,
    "review": "Great session!"
  }'
```

---

## Rate Limiting
Currently no rate limiting is implemented. Consider implementing rate limiting for production use.

## CORS
CORS is configured to allow requests from the frontend application. Update CORS settings in production as needed.
