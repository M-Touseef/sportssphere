# SportsSphere - Detailed Setup Guide

This guide provides step-by-step instructions for setting up the SportsSphere development environment.

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Node.js (v18.x or higher)**
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm (comes with Node.js)**
   - Verify installation: `npm --version`

3. **Python (v3.9 or higher)**
   - Download from: https://www.python.org/downloads/
   - Verify installation: `python --version`

4. **MongoDB**
   - **Option A - Local Installation:**
     - Download from: https://www.mongodb.com/try/download/community
     - Start MongoDB service
   - **Option B - MongoDB Atlas (Cloud):**
     - Create free account at: https://www.mongodb.com/cloud/atlas
     - Create a cluster and get connection string

5. **Git**
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

---

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd SportsSphere
```

---

## Step 2: Setup Client (React Frontend)

### 2.1 Navigate to client directory
```bash
cd client
```

### 2.2 Install dependencies
```bash
npm install
```

### 2.3 Create environment file
```bash
# On Windows
copy .env.example .env

# On Mac/Linux
cp .env.example .env
```

### 2.4 Configure environment variables

Edit `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_AI_SERVICE_URL=http://localhost:5001
VITE_APP_NAME=SportsSphere
VITE_APP_VERSION=1.0.0
```

### 2.5 Start development server
```bash
npm run dev
```

The client should now be running at `http://localhost:5173`

---

## Step 3: Setup Server (Express Backend)

### 3.1 Navigate to server directory
```bash
cd ../server  # From root directory
```

### 3.2 Install dependencies
```bash
npm install
```

### 3.3 Create environment file
```bash
# On Windows
copy .env.example .env

# On Mac/Linux
cp .env.example .env
```

### 3.4 Configure environment variables

Edit `server/.env`:
```env
PORT=5000
NODE_ENV=development

# MongoDB Configuration
# Option A - Local MongoDB
MONGO_URI=mongodb://localhost:27017/sportssphere

# Option B - MongoDB Atlas
# MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/sportssphere

# JWT Secret (change this to a random string)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Email Configuration (for nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM=noreply@sportssphere.com

# Payment Gateway (Mock for development)
PAYMENT_API_KEY=test_payment_key
PAYMENT_SECRET=test_payment_secret

# Frontend URL
CLIENT_URL=http://localhost:5173
```

### 3.5 Setup Email (Gmail Example)

If using Gmail for email notifications:

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Generate an App Password:
   - Go to Security > App passwords
   - Select "Mail" and your device
   - Copy the 16-character password
4. Use this password in `EMAIL_PASSWORD`

### 3.6 Start MongoDB

**If using local MongoDB:**
```bash
# On Windows
net start MongoDB

# On Mac/Linux
sudo service mongod start
# OR
mongod
```

**If using MongoDB Atlas:**
- Ensure your IP is whitelisted in Atlas dashboard
- Use the connection string provided by Atlas

### 3.7 Start development server
```bash
npm run dev
```

The server should now be running at `http://localhost:5000`

---

## Step 4: Setup AI Service (Flask)

### 4.1 Navigate to AI service directory
```bash
cd ../ai-service  # From root directory
```

### 4.2 Create virtual environment
```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

### 4.3 Install dependencies
```bash
pip install -r requirements.txt
```

### 4.4 Create environment file
```bash
# On Windows
copy .env.example .env

# On Mac/Linux
cp .env.example .env
```

### 4.5 Configure environment variables

Edit `ai-service/.env`:
```env
PORT=5001
FLASK_ENV=development
FLASK_DEBUG=True

# Optional: OpenAI Integration
# OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 4.6 Start Flask server
```bash
python app.py
```

The AI service should now be running at `http://localhost:5001`

---

## Step 5: Verify Installation

### 5.1 Check all services are running

You should have three terminal windows/tabs:

1. **Client**: `http://localhost:5173`
2. **Server**: `http://localhost:5000`
3. **AI Service**: `http://localhost:5001`

### 5.2 Test API endpoints

**Test Server Health:**
```bash
curl http://localhost:5000/api
# Expected: {"message": "Welcome to SportsSphere API"}
```

**Test AI Service:**
```bash
curl http://localhost:5001/api/health
# Expected: {"status": "AI Service is running"}
```

### 5.3 Check MongoDB connection

Look for this message in server terminal:
```
MongoDB Connected: <your-mongo-host>
Server running on port 5000
```

---

## Common Issues & Troubleshooting

### Issue: MongoDB connection failed

**Solution:**
- Ensure MongoDB is running (`mongod` process)
- Check `MONGO_URI` in `.env`
- For Atlas: Verify IP whitelist and credentials

### Issue: Port already in use

**Solution:**
```bash
# On Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# On Mac/Linux
lsof -ti:5000 | xargs kill -9
```

### Issue: Python module not found

**Solution:**
- Ensure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`

### Issue: npm install fails

**Solution:**
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

### Issue: CORS errors in browser

**Solution:**
- Verify `CLIENT_URL` in server `.env`
- Ensure CORS middleware is configured in `server/index.js`

---

## Development Workflow

### Starting all services together

**Option 1 - Multiple terminals:**
```bash
# Terminal 1 - Client
cd client && npm run dev

# Terminal 2 - Server
cd server && npm run dev

# Terminal 3 - AI Service
cd ai-service && source venv/bin/activate && python app.py
```

**Option 2 - Use npm scripts (optional):**
```bash
# To be added: concurrently or npm-run-all
npm run dev:all
```

### Stopping services

- Press `Ctrl+C` in each terminal
- Deactivate Python venv: `deactivate`

---

## Next Steps

After successful setup:

1. ✅ Verify all services are running
2. ✅ Check browser console for errors
3. ✅ Test API endpoints with Postman
4. 📝 Start implementing features (see project tasks)
5. 📊 Setup database models
6. 🎨 Build UI components

---

## Additional Resources

- **React Documentation**: https://react.dev/
- **Express.js Guide**: https://expressjs.com/
- **MongoDB Tutorial**: https://docs.mongodb.com/
- **Flask Documentation**: https://flask.palletsprojects.com/

---

**Need Help?**  
Contact the development team or refer to `docs/architecture.md` for system design details.

---

**Last Updated:** December 5, 2025
