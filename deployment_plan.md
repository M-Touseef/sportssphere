# SportSphere Deployment Plan

This plan outlines the strategy for moving the SportSphere platform from local development to production.

## 1. Production Architecture (Integrated RAG)

The platform uses a hybrid architecture where the retrieval logic is managed by the backend:
- **Frontend**: React (Vite) - Hosted as static assets.
- **Backend API (Node.js)**: 
    - **Core Logic**: Handles business logic and Cloudinary streams.
    - **Integrated Chatbot**: Located in `/server/chatbot`.
    - **RAG Engine**: Performs retrieval from the local `/server/chatbot/knowledge_base`.
- **AI Service (Python/Flask)**: Acts as the **LLM Generator**. It receives augmented prompts from the Node.js server and returns generated responses.
- **Database**: MongoDB Atlas - Managed persistent data storage.
- **Storage**: Cloudinary - Global CDN for images and documents.

---

## 2. Repository Strategy (Recommended: 1 Repo)

You do **not** need to create 3 separate repositories. You can keep everything in your current **Monorepo** structure. Modern hosting platforms allow you to point to specific folders.

### How to Host from 1 Repo:
1. **Frontend (Vercel)**: 
   - Connect your main repo.
   - In "Framework Preset", choose `Vite`.
   - Set **Root Directory** to `client`.
2. **Backend (Render/Railway)**: 
   - Connect your main repo.
   - Set **Root Directory** to `server`.
3. **AI Generator (Render/Railway)**: 
   - Connect your main repo.
   - Set **Root Directory** to `ai-service`.

> [!NOTE]
> This "Monorepo" approach is the easiest because you can update your frontend and backend in a single `git push`. Deployment platforms will only rebuild the folder you've specified as the root.

---

## 3. Infrastructure Setup

### Phase 1: Managed Services (External)
1. **MongoDB Atlas**:
   - Create a cluster and database named `sportssphere`.
   - **IMPORTANT**: Whitelist `0.0.0.0/0` (for initial setup) or the static IP of your host server.
2. **Cloudinary**:
   - Ensure your `CLOUDINARY_URL` is configured in the environment.

### Phase 2: Environment Variables
| Variable | Value | Description |
| :--- | :--- | :--- |
| `MONGO_URI` | `mongodb+srv://...` | Connection string for MongoDB Atlas |
| `CLOUDINARY_URL` | `cloudinary://...` | Your Cloudinary API credentials |
| `AI_SERVICE_URL` | `http://ai-service:5001` | URL of the Flask Generator service |
| `CLIENT_URL` | `https://yourdomain.com` | Production URL of your React frontend |

---

## 3. Recommended Deployment Options

### Option A: PaaS (Recommended)
- **Frontend**: [Vercel](https://vercel.com) (Point to `client/`)
- **Backend (+Chatbot)**: [Render](https://render.com) (Point to `server/`)
- **AI Generator**: [Render](https://render.com) (Point to `ai-service/`)

### Option B: Docker Compose (VPS)
```bash
docker-compose up --build -d
```

---

## 4. Operational Checklist

### Backend & Chatbot
- [x] Storage migrated to Cloudinary.
- [ ] **Knowledge Base**: Ensure `/server/chatbot/knowledge_base` is included in deployment (bundled in Docker or via Git).
- [ ] Set `NODE_ENV=production`.

### AI Generator Service
- [ ] Gunicorn is used as the production WSGI server.
- [ ] Service is accessible to the Backend API.

### Frontend
- [ ] `VITE_API_URL` points to production backend.
- [ ] Run `npm run build` before deployment.

---

## 5. Security Summary
- **SSL**: Required for all services.
- **Statelessness**: The backend remains stateless as all verification docs are in Cloudinary.
- **Secrets**: Use environment secrets, not `.env` files in production.
