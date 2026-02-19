# Personalized Chatbot Queries - Implementation Guide

## Overview
The chatbot now supports **personalized queries** - it can answer questions about the logged-in user's specific data including:
- Tournament registrations and results
- Upcoming matches
- Court bookings
- Sparring partners
- Coaching sessions

## How It Works

### Architecture
```
User asks: "When is my next match?"
    ↓
ChatWindow (React) → POST /api/chat/conversations/:id/messages
    ↓
chatController.js → Adds userId to context
    ↓
aiService.js → Detects intent ("matches")
    ↓
chatDataService.js → Queries database
    ↓
Formats and returns user's upcoming matches
    ↓
Response displayed in chat
```

### Intent Detection

The system recognizes these intent patterns:

#### 1. **Matches** (`matches` / `next_match`)
**Trigger Phrases**:
- "my match"
- "next match"
- "when is my match"
- "upcoming match"
- "match schedule"
- "when do i play"

**Response**: Lists upcoming matches with:
- Tournament name
- Opponent
- Date
- Round

**Example**:
> **User**: "When is my next match?"  
> **Bot**: "You have 2 upcoming matches:
> 
> 1. Summer Championship  
>    vs John Doe  
>    12/10/2025  
>    Round: Quarter Final
> 
> 2. City Tournament  
>    vs Jane Smith  
>    12/15/2025  
>    Round: Semi Final"

---

#### 2. **Tournaments** (`tournaments` / `my_tournaments`)
**Trigger Phrases**:
- "my tournament"
- "registered tournament"
- "tournament registration"
- "which tournament"
- "tournament status"

**Response**: Lists tournament registrations with:
- Tournament name
- Status
- Start date
- Category

**Example**:
> **User**: "What tournaments am I in?"  
> **Bot**: "You're registered for 2 tournaments:
> 
> 1. National Badminton Cup  
>    Status: registration open  
>    Date: 12/20/2025  
>    Category: Men's Singles
> 
> 2. Inter-City Championship  
>    Status: in progress  
>    Date: 12/08/2025  
>    Category: Mixed Doubles"

---

#### 3. **Bookings** (`bookings` / `reservations`)
**Trigger Phrases**:
- "my booking"
- "court booking"
- "reservation"
- "booked court"
- "when is my court"

**Response**: Lists upcoming court bookings with:
- Court name
- Date and time
- Location
- Status

**Example**:
> **User**: "Show my court bookings"  
> **Bot**: "You have 1 upcoming booking:
> 
> 1. Smash Arena Court 1  
>    12/08/2025 at 18:00 - 19:00  
>    Location: Karachi  
>    Status: confirmed"

---

#### 4. **Results** (`results` / `match_results`)
**Trigger Phrases**:
- "my result"
- "match result"
- "how did i do"
- "win"
- "lose"
- "score"
- "past match"

**Response**: Lists recent match results with:
- Tournament name
- Opponent
- Win/Loss
- Scores

**Example**:
> **User**: "How did I do in my last match?"  
> **Bot**: "Your recent match results:
> 
> 1. City Championship  
>    vs Ali Ahmed: Won  
>    Score: 21, 19, 21 - 15, 21, 18
> 
> 2. Weekend Tournament  
>    vs Sara Khan: Lost  
>    Score: 18, 21, 19 - 21, 17, 21"

---

## Implementation Details

### 1. chatDataService.js
**Location**: `server/services/chatDataService.js`

**Key Functions**:
```javascript
getUserMatches(userId)           // Fetch upcoming matches
getUserTournaments(userId)       // Fetch tournament registrations
getUserBookings(userId)          // Fetch court bookings
getUserMatchResults(userId)      // Fetch past match results
handleUserQuery(userId, intent)  // Main router function
```

**Database Queries**:
- Queries Match, Tournament, Registration, Booking models
- Populates related data (courts, players, tournaments)
- Sorts by date (upcoming first)
- Limits to 5 results

### 2. aiService.js Updates
**Location**: `server/services/aiService.js`

**New Methods**:
```javascript
detectUserIntent(message)        // Pattern matching for intents
```

**Flow**:
1. Detect intent from message
2. If intent matches + userId in context → Query database
3. If no intent → Forward to Flask AI
4. If Flask fails → Use fallback

### 3. chatController.js Updates
**Location**: `server/controllers/chatController.js`

**Change**:
```javascript
// Before
const aiResponse = await aiService.generateResponse(
    message,
    conversation.context
);

// After ---
const aiContext = {
    ...conversation.context,
    userId: req.user.id  // Added userId
};

const aiResponse = await aiService.generateResponse(
    message,
    aiContext
);
```

## Testing the Features

### Test Script:

1. **Login as a user with data**:
   ```
   Register for a tournament
   Book a court
   Have some matches scheduled
   ```

2. **Open chat and test each intent**:

   **Test Matches**:
   ```
   User: "When is my next match?"
   Expected: List of upcoming matches
   ```

   **Test Tournaments**:
   ```
   User: "What tournaments am I in?"
   Expected: List of registrations
   ```

   **Test Bookings**:
   ```
   User: "Show my bookings"
   Expected: List of court reservations
   ```

   **Test Results**:
   ```
   User: "How did I do?"
   Expected: Recent match results
   ```

3. **Test fallback to general AI**:
   ```
   User: "What are badminton rules?"
   Expected: General badminton info (from Flask)
   ```

## Data Sources

### Matches
```javascript
Match.find({
  // User is participant
  status: 'scheduled' | 'in_progress'
})
.populate('tournament participant1.registration participant2.registration')
.sort({ scheduledTime: 1 })
```

### Tournaments
```javascript
Registration.find({
  player: userId,
  status: 'confirmed' | 'checked_in'
})
.populate('tournament')
.sort({ createdAt: -1 })
```

### Bookings
```javascript
Booking.find({
  user: userId,
  date: { $gte: now },
  status: 'pending' | 'confirmed'
})
.populate('court')
.sort({ date: 1, startTime: 1 })
```

### Results
```javascript
Match.find({
  // User participated
  status: 'completed'
})
.populate('tournament participant1.registration participant2.registration')
.sort({ completedAt: -1 })
```

## Response Formatting

All responses follow this structure:
```
[Intro line with count]

1. [Item name]
   [Detail 1]
   [Detail 2]
   [Detail 3]

2. [Item name]
   ...
```

### No Data Responses:
- **No matches**: "You don't have any upcoming matches scheduled."
- **No tournaments**: "You haven't registered for any tournaments yet. Browse available tournaments to join!"
- **No bookings**: "You don't have any upcoming court bookings."
- **No results**: "You don't have any completed matches yet."

## Edge Cases Handled

1. **User not authenticated**: Returns login prompt
2. **No data found**: Returns friendly "no data" message
3. **Invalid data**: Skips and shows valid data only
4. **Database error**: Logs error, returns empty array
5. **Intent unclear**: Falls back to Flask AI

## Performance Considerations

- **Query Limits**: Max 5 results per query
- **Population**: Only essential fields populated
- **Indexes**: Ensure indexes on user, status, date fields
- **Caching**: Future enhancement - cache user data

## Future Enhancements

### 1. **More Intents**
- "sparring partners"
- "coaching sessions"
- "my stats"
- "court availability"

### 2. **Natural Language**
```
"Did I win my last match?"
"Who am I playing against on Friday?"
"Cancel my booking tomorrow"
```

### 3. **Actions**
```
User: "Book a court for tomorrow"
Bot: "Sure! What time would you like?"
```

### 4. **Follow-up Questions**
```
User: "When is my next match?"
Bot: [Lists matches]
User: "Tell me more about the first one"
Bot: [Detailed match info]
```

### 5. **Smart Suggestions**
```
Bot: "You have a match tomorrow at 3pm. Would you like to:
- Book a practice court before?
- Find the venue location?
- See your opponent's stats?"
```

## Example Conversations

### Conversation 1: Tournament Info
```
User: Hi
Bot: Hello! I'm your SportSphere assistant...

User: What tournaments am I registered for?
Bot: You're registered for 2 tournaments:
     1. Summer Championship
        Status: registration open
        ...

User: When is the first match?
Bot: You have 1 upcoming match:
     1. Summer Championship
        vs John Doe
        12/10/2025
        ...
```

### Conversation 2: Mixed Query
```
User: Show my schedule
Bot: I can help! Do you mean:
     - Court bookings
     - Tournament matches
     - Coaching sessions

User: My matches
Bot: You have 3 upcoming matches:
     [Lists matches...]

User: How do I improve my smash?
Bot: [Flask AI response about technique...]
```

---

## Summary

✅ **Personalized Intent Detection**: Recognizes 4 intent types  
✅ **Database Integration**: Queries user-specific data  
✅ **Formatted Responses**: Clean, readable format  
✅ **Fallback System**: Works even if intent unclear  
✅ **Error Handling**: Graceful degradation  

**The chatbot can now answer questions about the user's personal data!** 🎯
