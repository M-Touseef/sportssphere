# SportSphere - Integration Testing Guide

## Quick Test Checklist

### ✅ Phase 6: AI Chatbot Testing

#### Backend Tests
1. **Start Backend Server**
   ```bash
   cd server
   npm run dev
   ```
   Expected: Server running on port 5000

2. **Test Chat Endpoints** (using Postman/Thunder Client)
   - POST `/api/auth/login` - Get JWT token
   - POST `/api/chat/conversations` - Create conversation
   - POST `/api/chat/conversations/:id/messages` - Send message
   - GET `/api/chat/conversations` - List conversations
   - GET `/api/chat/conversations/:id` - Get conversation
   - DELETE `/api/chat/conversations/:id` - Delete conversation

#### Frontend Tests
1. **Start Frontend Server**
   ```bash
   cd client
   npm run dev
   ```
   Expected: App running on port 5173

2. **Test Chat UI**
   - Navigate to http://localhost:5173
   - Login with test account
   - Click "🤖 AI Chat" in navbar
   - Should see chatbot interface

3. **Test Conversation Flow**
   - Click "Start Chatting" or "New Conversation"
   - Type: "Hello"
   - Expected: AI greeting response
   - Type: "What are the badminton rules?"
   - Expected: Rules explanation
   - Type: "How to improve my smash?"
   - Expected: Technique advice

4. **Test Conversation Management**
   - Create multiple conversations
   - Switch between conversations
   - Delete a conversation
   - Check message history

#### Integration Tests
- ✅ API connectivity
- ✅ Authentication working
- ✅ Message sending
- ✅ AI responses
- ✅ Conversation persistence
- ✅ Context awareness
- ✅ UI updates

### Test Scenarios

#### Scenario 1: New User Chat
1. Register new account
2. Navigate to chatbot
3. Start conversation
4. Ask about rules
5. Ask about equipment
6. Verify responses are relevant

#### Scenario 2: Multiple Conversations
1. Create conversation about rules
2. Create conversation about training
3. Switch between them
4. Verify message history persists
5. Delete one conversation

#### Scenario 3: Context Awareness
1. Mention "I'm a beginner"
2. Ask about training
3. Verify response includes beginner advice
4. Mention "I'm advanced"
5. Ask about strategy
6. Verify response adapts

### Expected Results

#### AI Responses Should:
- ✅ Be relevant to question
- ✅ Include badminton knowledge
- ✅ Adapt to skill level
- ✅ Provide helpful information
- ✅ Guide platform usage

#### UI Should:
- ✅ Display messages correctly
- ✅ Show timestamps
- ✅ Update in real-time
- ✅ Handle loading states
- ✅ Show errors gracefully
- ✅ Be responsive

### Common Test Queries

**Rules:**
- "What are the badminton rules?"
- "How do you score in badminton?"
- "What are the serving rules?"

**Techniques:**
- "How to improve my smash?"
- "What is a drop shot?"
- "How to do a backhand clear?"

**Equipment:**
- "What racket should I buy?"
- "What's the difference between feather and nylon shuttles?"
- "What shoes are best for badminton?"

**Training:**
- "How to improve my game?"
- "What drills should I practice?"
- "How to build stamina?"

**Strategy:**
- "What's a good singles strategy?"
- "How to play doubles?"
- "How to win matches?"

**Platform:**
- "How do I book a court?"
- "How do I find a coach?"
- "How do I register for tournaments?"

### Bug Checklist

- [ ] Messages not sending
- [ ] AI not responding
- [ ] Conversations not loading
- [ ] Sidebar not working
- [ ] Delete not working
- [ ] Context not updating
- [ ] UI not responsive
- [ ] Errors not handled

### Performance Checks

- [ ] Messages load quickly
- [ ] AI responds in < 1 second
- [ ] Conversations list loads fast
- [ ] No memory leaks
- [ ] Smooth scrolling
- [ ] No lag in typing

---

## All Phases Integration Test

### Phase 1-2: Courts
- [ ] Browse courts
- [ ] Book a court
- [ ] View bookings
- [ ] Cancel booking

### Phase 3: Coaches
- [ ] Browse coaches
- [ ] Book session
- [ ] Rate session
- [ ] View coach dashboard

### Phase 4: Tournaments
- [ ] Create tournament
- [ ] Register for tournament
- [ ] View brackets
- [ ] Submit results
- [ ] View leaderboard

### Phase 5: Sparring
- [ ] Create sparring request
- [ ] Find matches
- [ ] Send match request
- [ ] Accept match
- [ ] View matches

### Phase 6: Chatbot
- [ ] Start conversation
- [ ] Send messages
- [ ] Get AI responses
- [ ] Manage conversations

---

## Final Verification

### Backend
- [ ] All 69 endpoints working
- [ ] Database connected
- [ ] Authentication working
- [ ] Authorization enforced
- [ ] Error handling active

### Frontend
- [ ] All 19 pages accessible
- [ ] Navigation working
- [ ] Forms functional
- [ ] API calls successful
- [ ] UI responsive

### Integration
- [ ] End-to-end flows working
- [ ] Data persisting
- [ ] Real-time updates
- [ ] Cross-feature integration

---

**Status:** Ready for testing  
**Last Updated:** December 6, 2024
