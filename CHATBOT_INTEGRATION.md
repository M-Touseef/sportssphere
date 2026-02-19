# Chatbot Integration - Complete Flow

## Overview
The chatbot system is now fully integrated with a three-tier architecture:
1. **React Frontend** (ChatWindow) → User interface
2. **Node.js Backend** (Express) → API layer & conversation management
3. **Flask AI Service** (Python) → AI response generation

## Architecture Flow

```
User types message
    ↓
ChatWindow.jsx (React)
    ↓
POST /api/chat/conversations/:id/messages
    ↓
chatController.js (Node)
    ↓
aiService.js (Node) → POST http://localhost:5001/api/send_message
    ↓
app.py (Flask)
    ↓
AI Response Generated
    ↓
Saved to MongoDB (Conversation model)
    ↓
Response sent back to React
    ↓
Displayed in chat UI
```

## Components

### 1. Frontend - ChatWindow.jsx
**Location**: `client/src/components/chat/ChatWindow.jsx`

**Features**:
- Floating chat window with minimize/expand
- Real-time message display
- Typing indicators
- Authentication-aware (requires login)
- Automatic conversation creation

**Key Functions**:
```javascript
createConversation()      // Creates new chat session
handleSend()              // Sends message to backend
```

**API Calls**:
- `POST /api/chat/conversations` - Create conversation
- `POST /api/chat/conversations/:id/messages` - Send message

### 2. Node Backend - chatController.js
**Location**: `server/controllers/chatController.js`

**Endpoints**:
```javascript
POST   /api/chat/conversations              // Create conversation
GET    /api/chat/conversations               // Get all user conversations
GET    /api/chat/conversations/:id           // Get specific conversation
POST   /api/chat/conversations/:id/messages  // Send message
PUT    /api/chat/conversations/:id           // Update conversation
DELETE /api/chat/conversations/:id           // Delete conversation
POST   /api/chat/conversations/:id/clear     // Clear messages
```

**Key Features**:
- User authentication required
- Context-aware responses (skill level, city)
- Message history tracking
- Auto-title generation from first message

### 3. Node AI Service - aiService.js
**Location**: `server/services/aiService.js`

**Purpose**: Proxy layer between Node and Flask

**Features**:
- Forwards requests to Flask AI service
- Fallback responses if Flask is unavailable
- Health check monitoring
- 5-second timeout for Flask calls

**Configuration**:
```javascript
FLASK_AI_URL = process.env.FLASK_AI_URL || 'http://localhost:5001'
```

### 4. Flask AI Service - app.py
**Location**: `ai-service/app.py`

**Endpoints**:
- `POST /api/send_message` - Main chat endpoint
- `GET /api/health` - Health check

**Knowledge Base Categories**:
- **Rules**: Scoring, game structure
- **Technique**: Smash, serve, footwork
- **Equipment**: Rackets, shuttlecocks, shoes
- **Platform**: Court booking, tournaments, coaches

**Response Logic**:
```python
def generate_response(message):
    # Check keywords
    # Match to knowledge base
    # Return relevant response
```

### 5. Database Model - Conversation.js
**Location**: `server/models/Conversation.js`

**Schema**:
```javascript
{
  user: ObjectId,              // User reference
  title: String,               // Auto-generated from first message
  messages: [{
    role: 'user' | 'assistant',
    content: String,
    timestamp: Date
  }],
  context: {
    userSkillLevel: String,
    userCity: String,
    lastTopic: String
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Methods**:
- `addMessage(role, content)` - Add new message
- `updateContext(data)` - Update conversation context
- `getHistory(limit)` - Get last N messages

## Complete Message Flow

### Step-by-Step:

1. **User Opens Chat**
   ```
   User clicks chat bubble → ChatWindow opens
   ```

2. **Conversation Creation** (if authenticated)
   ```javascript
   POST /api/chat/conversations
   Body: { title: 'SportSphere Chat' }
   Response: { data: { _id: '...' } }
   ```

3. **User Sends Message**
   ```
   User types "What are the badminton rules?"
   → Clicks send
   ```

4. **Frontend Processing**
   ```javascript
   // Add user message to UI
   setMessages([...messages, userMsg])
   setIsTyping(true)
   
   // Send to backend
   POST /api/chat/conversations/:id/messages
   Body: { message: "What are the badminton rules?" }
   ```

5. **Backend Processing**
   ```javascript
   // chatController.sendMessage()
   - Validate user & conversation
   - Add user message: conversation.addMessage('user', message)
   - Update context based on keywords
   - Call aiService.generateResponse(message, context)
   ```

6. **AI Service Call**
   ```javascript
   // aiService.js
   - Forward to Flask: POST http://localhost:5001/api/send_message
   - Body: { message, context }
   - Wait for response (5s timeout)
   - If Flask fails, use fallback response
   ```

7. **Flask AI Processing**
   ```python
   # app.py
   - Receive message
   - Check keywords: 'rules' found
   - Select response from KNOWLEDGE_BASE['rules']
   - Return: {
       'success': True,
       'response': 'Badminton games are played to 21 points...',
       'timestamp': '2025-12-07T...'
     }
   ```

8. **Response Saved to MongoDB**
   ```javascript
   // Back in chatController
   conversation.addMessage('assistant', aiResponse)
   await conversation.save()
   ```

9. **Response Sent to Frontend**
   ```javascript
   res.json({
     success: true,
     data: {
       userMessage: {...},
       aiMessage: {
         role: 'assistant',
         content: 'Badminton games are played to 21 points...',
         timestamp: Date
       }
     }
   })
   ```

10. **UI Updates**
    ```javascript
    // ChatWindow receives response
    - setIsTyping(false)
    - Add bot message to UI
    - Scroll to bottom
    ```

## Message Logging

All messages are automatically logged in MongoDB via the `Conversation` model:

```javascript
{
  _id: "conv_123",
  user: "user_456",
  title: "What are the badminton rules?",
  messages: [
    {
      role: "user",
      content: "What are the badminton rules?",
      timestamp: ISODate("2025-12-07T10:00:00Z")
    },
    {
      role: "assistant",
      content: "Badminton games are played to 21 points...",
      timestamp: ISODate("2025-12-07T10:00:01Z")
    }
  ],
  context: {
    userSkillLevel: "intermediate",
    userCity: "Karachi"
  },
  isActive: true,
  createdAt: ISODate("2025-12-07T10:00:00Z"),
  updatedAt: ISODate("2025-12-07T10:00:01Z")
}
```

## Features

### ✅ Real-Time Chat
- Instant message sending
- Typing indicators
- Auto-scroll to latest message

### ✅ Conversation Persistence
- Messages saved to MongoDB
- Retrieve conversation history
- Continue conversations across sessions

### ✅ Context Awareness
- User skill level tracking
- Location context (city)
- Topic tracking (last discussed topic)

### ✅ Fallback System
- If Flask is down, Node provides fallback responses
- Graceful degradation
- Health monitoring

### ✅ Authentication
- Requires login to use chat
- User-specific conversations
- Authorization checks

## Running the Stack

### 1. Start MongoDB
```bash
# Ensure MongoDB is running
mongod
```

### 2. Start Flask AI Service
```bash
cd ai-service
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5001
```

### 3. Start Node Backend
```bash
cd server
npm install
npm start
# Runs on http://localhost:5000
```

### 4. Start React Frontend
```bash
cd client
npm install
npm start
# Runs on http://localhost:3000
```

## Testing the Flow

### Test 1: Basic Chat
1. Register/login as a user
2. Click chat bubble (bottom right)
3. Type: "Hello"
4. Expected response: "Hello! I'm your SportSphere assistant..."

### Test 2: Knowledge Query
1. Type: "What are badminton rules?"
2. Expected: Response about 21 points, rally scoring
3. Check MongoDB: Message should be saved

### Test 3: Platform Features
1. Type: "How do I book a court?"
2. Expected: Response about court booking features
3. Context should update with 'platform' topic

### Test 4: Fallback (Flask Down)
1. Stop Flask server
2. Send message
3. Expected: Fallback response from Node
4. Console log: "Flask AI Service error"

## Environment Variables

### Node (.env)
```bash
FLASK_AI_URL=http://localhost:5001
```

### Flask (.env)
```bash
PORT=5001
```

## Troubleshooting

### Issue: "Failed to create conversation"
**Cause**: Not authenticated  
**Solution**: Log in before opening chat

### Issue: "AI service temporarily unavailable"
**Cause**: Flask not running & fallback disabled  
**Solution**: Start Flask or enable fallback

### Issue: Messages not saving
**Cause**: MongoDB not connected  
**Solution**: Check MongoDB connection in server

### Issue: Timeout errors
**Cause**: Flask taking too long  
**Solution**: Increase timeout in aiService.js

## Future Enhancements

1. **OpenAI Integration**
   - Replace knowledge base with GPT-4
   - More intelligent responses
   - Better context understanding

2. **Voice Input**
   - Speech-to-text
   - Voice responses

3. **Rich Media**
   - Image sharing
   - GIF responses
   - Embedded links

4. **Multi-Language**
   - Urdu support
   - Auto language detection

5. **Advanced Features**
   - Conversation export
   - Message search
   - Quick replies/suggestions
   - Sentiment analysis

6. **Integration**
   - Direct court booking from chat
   - Coach recommendations
   - Tournament registration assistance

## API Reference

### Create Conversation
```http
POST /api/chat/conversations
Authorization: Bearer <token>

{
  "title": "Optional title",
  "initialMessage": "Optional first message"
}

Response:
{
  "success": true,
  "data": {
    "_id": "conv_id",
    "title": "...",
    "messages": [...]
  }
}
```

### Send Message
```http
POST /api/chat/conversations/:id/messages
Authorization: Bearer <token>

{
  "message": "Your message here"
}

Response:
{
  "success": true,
  "data": {
    "userMessage": {...},
    "aiMessage": {
      "role": "assistant",
      "content": "Response text",
      "timestamp": "..."
    }
  }
}
```

### Flask Send Message
```http
POST http://localhost:5001/api/send_message

{
  "message": "Your message",
  "context": {
    "userSkillLevel": "intermediate",
    "userCity": "Karachi"
  }
}

Response:
{
  "success": true,
  "response": "AI response text",
  "timestamp": "2025-12-07T..."
}
```

---

**Chatbot is now fully integrated and ready to use!** 🤖💬
