# Quick Start Guide - Coach Management System

## Prerequisites
- Node.js installed
- MongoDB running
- Backend server running on port 5000
- Frontend running on port 5173 (or configured port)

## Getting Started

### 1. Start the Application

#### Backend
```bash
cd server
npm install
npm run dev
```

#### Frontend
```bash
cd client
npm install
npm run dev
```

### 2. Create User Accounts

#### Register as a Student
1. Navigate to `http://localhost:5173/register`
2. Fill in the registration form:
   - Name: "John Student"
   - Email: "student@example.com"
   - Password: "password123"
   - City: "Mumbai"
   - Role: "student"
3. Click "Register"

#### Register as a Coach
1. Navigate to `http://localhost:5173/register`
2. Fill in the registration form:
   - Name: "Jane Coach"
   - Email: "coach@example.com"
   - Password: "password123"
   - City: "Mumbai"
   - Role: "coach"
3. Click "Register"

### 3. Setup Coach Profile

1. **Login as Coach:**
   - Email: coach@example.com
   - Password: password123

2. **Navigate to Coach Dashboard:**
   - Click "Coach Dashboard" in the navigation bar
   - Or go to `http://localhost:5173/coach/dashboard`

3. **Create Profile:**
   - Click on the "Profile" tab
   - Fill in the form:
     - **Experience:** 5 years
     - **Hourly Rate:** 1000 Rs.
     - **Bio:** "Professional badminton coach with 5 years of experience. Specialized in singles and doubles coaching."
     - **Specializations:** Check "Singles" and "Doubles"
     - **City:** Mumbai
     - **Service Areas:** Add "Andheri", "Bandra", "Juhu"
     - **Certifications:** 
       - Name: "BWF Level 1"
       - Issued By: "Badminton World Federation"
       - Year: 2018
     - **Availability:**
       - Monday: 09:00 - 17:00
       - Wednesday: 09:00 - 17:00
       - Friday: 09:00 - 17:00
   - Click "Save Profile"

### 4. Browse and Book a Session (as Student)

1. **Login as Student:**
   - Logout from coach account
   - Login with student@example.com / password123

2. **Find Coaches:**
   - Click "Coaches" in the navigation bar
   - Or go to `http://localhost:5173/coaches`

3. **Search for Coaches:**
   - Enter city: "Mumbai"
   - Select specialization: "Singles"
   - Click "Search"

4. **View Coach Profile:**
   - Click "View Profile" on any coach card
   - Review coach details, ratings, and availability

5. **Book a Session:**
   - Select a future date
   - Choose start time: 10:00
   - Choose end time: 11:00
   - Session type: Individual
   - Location: "ABC Sports Complex, Mumbai"
   - Add notes: "Focus on backhand technique"
   - Click "Book Session"

### 5. Manage Sessions

#### As Student

1. **View My Sessions:**
   - Click "My Sessions" in the navigation bar
   - Or go to `http://localhost:5173/my-sessions`

2. **Filter Sessions:**
   - Click "Upcoming" to see future sessions
   - Click "Past" to see completed sessions
   - Click "All" to see everything

3. **Cancel a Session:**
   - Find an upcoming session
   - Click "Cancel Session"
   - Confirm cancellation

4. **Rate a Completed Session:**
   - Find a completed session
   - Click "Rate Session"
   - Select star rating (1-5)
   - Add review text (optional)
   - Click "Submit Rating"

#### As Coach

1. **View Coach Dashboard:**
   - Login as coach
   - Navigate to `http://localhost:5173/coach/dashboard`

2. **View Statistics:**
   - See total sessions count
   - Check upcoming sessions
   - View completed sessions
   - Monitor average rating

3. **Manage Sessions:**
   - View upcoming sessions with student details
   - See past sessions with ratings
   - Check session status and payment info

4. **Update Profile:**
   - Click "Profile" tab
   - Update any profile information
   - Click "Save Profile"

## Testing Scenarios

### Scenario 1: Complete Booking Flow
1. Register as student
2. Browse coaches
3. Filter by city and specialization
4. View coach profile
5. Book a session
6. View in "My Sessions"

### Scenario 2: Coach Profile Management
1. Register as coach
2. Create coach profile
3. Add certifications
4. Set availability
5. View profile in coach list

### Scenario 3: Rating System
1. Book a session as student
2. Manually update session status to "completed" in database (for testing)
3. Rate the session
4. Check rating appears on coach profile
5. Verify average rating updated

### Scenario 4: Search and Filter
1. Create multiple coach profiles with different:
   - Cities
   - Specializations
   - Hourly rates
2. Test various filter combinations
3. Verify results update correctly

## Common Issues and Solutions

### Issue: "Coach not found" when booking
**Solution:** Make sure the coach has created a profile first

### Issue: "Time slot already booked"
**Solution:** Choose a different time or date

### Issue: Can't rate a session
**Solution:** Session must be marked as "completed" to rate

### Issue: Profile not showing in coach list
**Solution:** Check that `isActive` is set to `true` in the coach profile

### Issue: Navigation bar not showing
**Solution:** Make sure you're logged in and the Navbar component is imported in App.jsx

## API Testing with Postman/cURL

### Get All Coaches
```bash
curl http://localhost:5000/api/coaches
```

### Get Coach by ID
```bash
curl http://localhost:5000/api/coaches/COACH_ID
```

### Book a Session (requires auth token)
```bash
curl -X POST http://localhost:5000/api/sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "coachId": "COACH_USER_ID",
    "date": "2024-12-10",
    "startTime": "10:00",
    "endTime": "11:00",
    "duration": 1,
    "location": "ABC Sports Complex",
    "sessionType": "individual"
  }'
```

### Rate a Session (requires auth token)
```bash
curl -X PUT http://localhost:5000/api/sessions/SESSION_ID/rate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "score": 5,
    "review": "Great session!"
  }'
```

## Database Queries for Testing

### Mark Session as Completed (MongoDB Shell)
```javascript
db.sessions.updateOne(
  { _id: ObjectId("SESSION_ID") },
  { $set: { status: "completed" } }
)
```

### View All Coach Profiles
```javascript
db.coachprofiles.find().pretty()
```

### View All Sessions
```javascript
db.sessions.find().pretty()
```

### Check Coach Rating
```javascript
db.coachprofiles.findOne(
  { _id: ObjectId("COACH_PROFILE_ID") },
  { rating: 1 }
)
```

## Feature Checklist

- [ ] Register as student
- [ ] Register as coach
- [ ] Create coach profile
- [ ] Add certifications to profile
- [ ] Set availability schedule
- [ ] Browse coach list
- [ ] Filter coaches by city
- [ ] Filter coaches by specialization
- [ ] View coach profile details
- [ ] Book a coaching session
- [ ] View my sessions as student
- [ ] Cancel a session
- [ ] Rate a completed session
- [ ] View coach dashboard
- [ ] View upcoming sessions as coach
- [ ] View past sessions with ratings
- [ ] Update coach profile
- [ ] Navigation between pages
- [ ] Logout functionality

## Next Steps

After testing the basic functionality:

1. **Add More Coaches:**
   - Create multiple coach accounts
   - Vary their specializations, rates, and locations
   - Test search and filtering

2. **Test Edge Cases:**
   - Try booking overlapping sessions
   - Attempt to rate non-completed sessions
   - Test with invalid data

3. **Performance Testing:**
   - Create many sessions
   - Test pagination (if implemented)
   - Check loading states

4. **UI/UX Testing:**
   - Test on different screen sizes
   - Check mobile responsiveness
   - Verify all buttons and links work

5. **Integration Testing:**
   - Test complete user journeys
   - Verify data consistency
   - Check error handling

## Support

For issues or questions:
- Check the API documentation: `docs/API_REFERENCE_COACHES.md`
- Review the implementation guide: `docs/PHASE3_COACH_MANAGEMENT.md`
- Check console logs for errors
- Verify MongoDB is running
- Ensure all dependencies are installed

## Tips for Demo

1. **Prepare Sample Data:**
   - Create 3-5 coach profiles with varied information
   - Book several sessions in different states
   - Add some ratings and reviews

2. **Demo Flow:**
   - Start with coach registration and profile creation
   - Switch to student view and browse coaches
   - Book a session
   - Show coach dashboard with bookings
   - Demonstrate rating system

3. **Highlight Features:**
   - Search and filter functionality
   - Real-time price calculation
   - Interactive star rating
   - Role-based dashboards
   - Responsive design

Happy Testing! 🏸
