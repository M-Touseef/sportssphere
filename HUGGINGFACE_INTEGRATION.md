# Hugging Face RAG Integration

## Overview
The SportSphere chatbot now uses the online Hugging Face RAG service instead of local knowledge base processing for enhanced performance and scalability.

## Architecture Changes

### Before (Local RAG)
```
User Query → Local Knowledge Base → Document Retrieval → Prompt Augmentation → Flask AI → Response
```

### After (Hugging Face RAG)
```
User Query → Hugging Face RAG Service → Direct Response
```

## Updated Components

### 1. RAGEngine.js
- **Location**: `server/chatbot/engines/RAGEngine.js`
- **Changes**:
  - Removed local knowledge base dependencies
  - Removed PDF processing and document chunking
  - Added direct Hugging Face API integration
  - Simplified to single API call

### 2. aiService.js
- **Location**: `server/services/aiService.js`
- **Changes**:
  - Updated RAG response handling
  - Removed Flask dependency for RAG queries
  - Direct response return from Hugging Face

## Hugging Face Endpoint

**URL**: `https://huggingface.co/spaces/Sportssphere/chatbot`

**Request Format**:
```json
{
  "message": "User's question",
  "context": {
    "userSkillLevel": "intermediate",
    "userCity": "Karachi",
    "userId": "user_id"
  }
}
```

**Response Format**:
```json
{
  "response": "AI generated response based on RAG"
}
```

## Benefits

### ✅ **Performance**
- Faster response times (no local processing)
- Reduced server load
- No document indexing overhead

### ✅ **Scalability**
- Cloud-based processing
- Automatic knowledge base updates
- Better resource management

### ✅ **Maintenance**
- No local document management
- Centralized knowledge updates
- Easier deployment

## Error Handling

### Primary Fallback
If Hugging Face service is unavailable:
```javascript
{
  intentId: 'RAG_FALLBACK',
  response: "I can help with badminton rules, techniques, and equipment. Could you be more specific?"
}
```

### Error Types Handled
- Connection timeouts (10s)
- Service unavailable
- Invalid response format
- Network errors

## Configuration

### Timeout Settings
- **Hugging Face API**: 10 seconds
- **Retry Logic**: Built-in fallback

### Environment Variables
No additional environment variables needed - endpoint is hardcoded.

## Testing

### Test Queries
1. **Rules**: "What are the badminton scoring rules?"
2. **Techniques**: "How do I improve my smash technique?"
3. **Equipment**: "What racket should I use as a beginner?"
4. **Platform**: "How do I book a court on SportSphere?"

### Expected Behavior
- All knowledge queries route to Hugging Face
- Personal queries still use local database
- Public data queries use local database
- Rule-based queries (greetings) use local engine

## Monitoring

### Logs
- `[RAGEngine] Initialized with Hugging Face endpoint`
- `[RAGEngine] Hugging Face API Error:` (for errors)
- Console logs for response times

### Health Checks
The system gracefully degrades if Hugging Face is unavailable.

## Future Enhancements

### 1. **Multiple Endpoints**
- Add backup RAG services
- Load balancing across multiple providers

### 2. **Caching**
- Cache common responses
- Reduce API calls for frequent queries

### 3. **Analytics**
- Track query types and response quality
- Monitor Hugging Face performance

### 4. **Custom Models**
- Deploy SportSphere-specific models
- Fine-tune for badminton domain

## Deployment Notes

### Dependencies Removed
- `pdf-parse` (no longer needed)
- Local knowledge base directory
- Document processing utilities

### Dependencies Added
- `axios` (already present)

### Server Requirements
- Outbound HTTPS access to huggingface.co
- No additional CPU/memory requirements

---

**Integration Complete!** 🚀 The chatbot now uses Hugging Face RAG for intelligent responses.
