# IT Career Chatbot - Chat History API Documentation

## Overview

This document outlines the backend API requirements for implementing user-specific chat history functionality for the IT Career Chatbot. The system will store and manage conversation sessions tied to authenticated users, providing features similar to ChatGPT, Claude, and other popular AI platforms.

**Base URL:** `http://localhost:5000/api/chatbot`
**Authentication:** Bearer Token (JWT) + Session Cookies Required
**Content-Type:** `application/json`

---

## Features Required

### 1. **User-Specific Chat Sessions**

- Each authenticated user has their own isolated chat history
- Sessions are tied to user accounts, not browser localStorage
- Cross-device synchronization support

### 2. **Session Management**

- Create new chat sessions
- List user's chat sessions with metadata
- Load specific chat session messages
- Delete individual chat sessions
- Update session titles

### 3. **Message Storage**

- Store both user and bot messages with timestamps
- Track message metadata (response types, career info, etc.)
- Support message search and filtering

---

## Database Schema

### Chat Sessions Table

```sql
CREATE TABLE chatbot_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_uuid VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_chatbot_sessions_user_id ON chatbot_sessions(user_id);
CREATE INDEX idx_chatbot_sessions_last_active ON chatbot_sessions(last_active);
```

### Chat Messages Table

```sql
CREATE TABLE chatbot_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  message_type ENUM('user', 'bot') NOT NULL,
  content TEXT NOT NULL,
  response_type VARCHAR(50) DEFAULT NULL, -- 'career_info', 'ai_response', 'scope_limitation', 'error'
  career VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSON DEFAULT NULL, -- Additional message metadata
  FOREIGN KEY (session_id) REFERENCES chatbot_sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_chatbot_messages_session_id ON chatbot_messages(session_id);
CREATE INDEX idx_chatbot_messages_created_at ON chatbot_messages(created_at);
```

---

## API Endpoints

### 1. List User Chat Sessions

**Endpoint:** `GET /api/chatbot/sessions`
**Description:** Get all chat sessions for the authenticated user
**Authentication:** Required

**Query Parameters:**

- `limit` (optional): Number of sessions to return (default: 20, max: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**

```json
{
  "success": true,
  "sessions": [
    {
      "id": 1,
      "session_uuid": "sess_671234abcd_1729123456789",
      "title": "How to become a Software Developer?",
      "created_at": "2025-10-13T10:30:00Z",
      "last_active": "2025-10-13T11:45:00Z",
      "message_count": 12
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

### 2. Create New Chat Session

**Endpoint:** `POST /api/chatbot/sessions`
**Description:** Create a new chat session for the user
**Authentication:** Required

**Request Body:**

```json
{
  "title": "New Chat Session" // Optional, will auto-generate if not provided
}
```

**Response:**

```json
{
  "success": true,
  "session": {
    "id": 1,
    "session_uuid": "sess_671234abcd_1729123456789",
    "title": "New Chat Session",
    "created_at": "2025-10-13T10:30:00Z",
    "last_active": "2025-10-13T10:30:00Z",
    "message_count": 0
  }
}
```

### 3. Get Chat Session Messages

**Endpoint:** `GET /api/chatbot/sessions/{session_uuid}/messages`
**Description:** Get all messages for a specific chat session
**Authentication:** Required

**Path Parameters:**

- `session_uuid`: The unique identifier for the chat session

**Query Parameters:**

- `limit` (optional): Number of messages to return (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**

```json
{
  "success": true,
  "session": {
    "id": 1,
    "session_uuid": "sess_671234abcd_1729123456789",
    "title": "How to become a Software Developer?",
    "created_at": "2025-10-13T10:30:00Z",
    "last_active": "2025-10-13T11:45:00Z"
  },
  "messages": [
    {
      "id": 1,
      "message_type": "user",
      "content": "How to become a Software Developer?",
      "created_at": "2025-10-13T10:30:15Z"
    },
    {
      "id": 2,
      "message_type": "bot",
      "content": "To become a Software Developer, you'll need to...",
      "response_type": "career_info",
      "career": "Software Developer",
      "created_at": "2025-10-13T10:30:18Z"
    }
  ],
  "pagination": {
    "total": 12,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

### 4. Add Message to Session

**Endpoint:** `POST /api/chatbot/sessions/{session_uuid}/messages`
**Description:** Add a new message to a chat session
**Authentication:** Required

**Path Parameters:**

- `session_uuid`: The unique identifier for the chat session

**Request Body:**

```json
{
  "message_type": "user", // or "bot"
  "content": "What skills do I need for web development?",
  "response_type": null, // Only for bot messages: "career_info", "ai_response", "scope_limitation"
  "career": null, // Only for career-related bot responses
  "metadata": {} // Optional additional data
}
```

**Response:**

```json
{
  "success": true,
  "message": {
    "id": 13,
    "message_type": "user",
    "content": "What skills do I need for web development?",
    "created_at": "2025-10-13T11:50:00Z"
  },
  "session_updated": true
}
```

### 5. Update Session Title

**Endpoint:** `PATCH /api/chatbot/sessions/{session_uuid}`
**Description:** Update the title of a chat session
**Authentication:** Required

**Path Parameters:**

- `session_uuid`: The unique identifier for the chat session

**Request Body:**

```json
{
  "title": "Web Development Career Path Discussion"
}
```

**Response:**

```json
{
  "success": true,
  "session": {
    "id": 1,
    "session_uuid": "sess_671234abcd_1729123456789",
    "title": "Web Development Career Path Discussion",
    "created_at": "2025-10-13T10:30:00Z",
    "last_active": "2025-10-13T11:45:00Z"
  }
}
```

### 6. Delete Chat Session

**Endpoint:** `DELETE /api/chatbot/sessions/{session_uuid}`
**Description:** Delete a chat session and all its messages
**Authentication:** Required

**Path Parameters:**

- `session_uuid`: The unique identifier for the chat session

**Response:**

```json
{
  "success": true,
  "message": "Chat session deleted successfully"
}
```

### 7. Enhanced Ask Question (Modified Existing)

**Endpoint:** `POST /api/chatbot/ask`
**Description:** Enhanced version with session support
**Authentication:** Required

**Request Body:**

```json
{
  "question": "What programming languages should I learn?",
  "session_uuid": "sess_671234abcd_1729123456789", // Optional: if provided, saves to session
  "context": {} // Optional context from previous messages
}
```

**Response:**

```json
{
  "response": "For a successful programming career, I recommend starting with...",
  "type": "ai_response",
  "career": null,
  "session_uuid": "sess_671234abcd_1729123456789", // If session was provided
  "message_saved": true, // Indicates if message was saved to session
  "user_message_id": 14,
  "bot_message_id": 15
}
```

---

## Security Requirements

### Authentication & Authorization

1. **JWT Token Validation**: All endpoints require valid JWT token
2. **User Isolation**: Users can only access their own chat sessions
3. **Session Ownership**: Validate session belongs to authenticated user
4. **Rate Limiting**: Implement rate limiting on message creation (e.g., 60 requests/minute)

### Data Protection

1. **Input Sanitization**: Clean all user inputs to prevent XSS/injection
2. **Content Filtering**: Optional profanity/inappropriate content filtering
3. **Data Retention**: Implement data retention policies (e.g., delete sessions older than 1 year)

---

## Error Responses

### Standard Error Format

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "details": {} // Optional additional error details
}
```

### Common Error Codes

- `UNAUTHORIZED` (401): Invalid or missing authentication token
- `FORBIDDEN` (403): User doesn't own the requested session
- `SESSION_NOT_FOUND` (404): Chat session doesn't exist
- `VALIDATION_ERROR` (400): Invalid request data
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error

### Example Error Responses

```json
{
  "success": false,
  "error": "SESSION_NOT_FOUND",
  "message": "The requested chat session was not found or has been deleted"
}
```

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "details": {
    "field": "message_type",
    "issue": "Must be either 'user' or 'bot'"
  }
}
```

---

## Implementation Notes

### Session UUID Generation

```javascript
// Example format: sess_{user_id}_{timestamp}_{random}
const generateSessionUUID = (userId) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `sess_${userId}_${timestamp}_${random}`;
};
```

### Auto-Title Generation

- Use first user message as title (truncated to 50 chars)
- If no user messages exist, use "New Chat {date}"
- Update title when first meaningful message is sent

### Performance Considerations

1. **Pagination**: Always paginate results for sessions and messages
2. **Indexing**: Proper database indexes on user_id, session_id, created_at
3. **Caching**: Consider caching recent sessions for active users
4. **Cleanup**: Background job to clean up old/deleted sessions

### Migration Strategy

1. **Phase 1**: Deploy new endpoints alongside existing chatbot functionality
2. **Phase 2**: Update frontend to use new session-based approach
3. **Phase 3**: Migrate existing localStorage data to backend (optional migration endpoint)

---

## Testing Requirements

### Unit Tests

- Session CRUD operations
- Message storage and retrieval
- User isolation validation
- Input sanitization

### Integration Tests

- Full conversation flow with sessions
- Authentication integration
- Error handling scenarios
- Pagination functionality

### Load Testing

- Concurrent users creating sessions
- High message volume scenarios
- Database performance under load

---

## Frontend Integration Changes Required

Once backend is implemented, the frontend will need:

1. **Remove localStorage dependency** for chat history
2. **Add session management** to chatbot service
3. **Update UI** to use backend session data
4. **Implement proper error handling** for backend failures
5. **Add loading states** for network operations

---

## Deployment Checklist

### Database Setup

- [ ] Create new tables with proper indexes
- [ ] Set up foreign key constraints
- [ ] Configure backup policies for chat data

### API Deployment

- [ ] Deploy new endpoints with proper authentication
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Test all endpoints with authentication

### Security Review

- [ ] Validate user isolation works correctly
- [ ] Test authentication and authorization
- [ ] Verify input sanitization
- [ ] Check for potential data leaks

---

## Future Enhancements

1. **Message Search**: Full-text search across user's chat history
2. **Export Functionality**: Allow users to export their chat history
3. **Session Sharing**: Optional session sharing with other users
4. **Message Reactions**: Like/dislike functionality for bot responses
5. **Analytics**: Track conversation patterns and popular topics
6. **Message Templates**: Saved/favorite questions for quick access

---

This implementation will provide a professional, secure, and scalable chat history system that matches the user experience of modern AI platforms while maintaining proper data isolation and security.
