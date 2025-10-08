# Career Assessment API Documentation

## Overview

This document provides comprehensive API endpoint documentation for the Career Assessment Frontend application. The API follows RESTful conventions and requires authentication for most endpoints. **CRITICAL**: The backend now uses session-based management alongside JWT tokens for enhanced security.

**Base URL:** `http://localhost:5000/api/`
**Authentication:** Bearer Token (JWT) + Session Cookies
**Content-Type:** `application/json`
**CORS Requirements:** `withCredentials: true` must be enabled

---

## Authentication Flow

### 1. Register User

**Endpoint:** `POST /users/register`
**Description:** Register a new user account
**Authentication:** Not required

**Request Body:**

```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "number",
    "username": "string",
    "email": "string"
  }
}
```

### 2. User Login

**Endpoint:** `POST /users/login`
**Description:** Authenticate user and receive JWT token
**Authentication:** Not required

**Request Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "success": true,
  "token": "jwt_token_string",
  "user": {
    "id": "number",
    "username": "string",
    "email": "string"
  }
}
```

---

## Assessment Management

### 3. Check Assessment Status (NEW)

**Endpoint:** `GET /assessment/status`
**Description:** Check if user has an active assessment session
**Authentication:** Required

**Response:**

```json
{
  "hasActiveAssessment": "boolean",
  "assessment_id": "number",
  "currentCareer": "string",
  "currentConfidence": "number",
  "message": "string"
}
```

### 4. Start Assessment

**Endpoint:** `GET /assessment/start`
**Description:** Initialize a new career assessment for the authenticated user
**Authentication:** Required

**Response:**

```json
{
  "assessment_id": "number",
  "question_id": "number",
  "question_text": "string",
  "options_answer": "comma-separated options string"
}
```

### 5. Get Next Question

**Endpoint:** `GET /assessment/next`
**Description:** Retrieve the next question in the assessment
**Authentication:** Required

**Query Parameters:**

- `currentQuestionId`: number (ID of the current question)
- `assessment_id`: number (ID of the assessment session)

**Response:**

```json
{
  "question_id": "number",
  "question_text": "string",
  "options_answer": "comma-separated options string",
  "assessment_id": "number"
}
```

**Error Response (No more questions):**

```json
{
  "status": 404,
  "error": "No more questions available"
}
```

### 6. Submit Answer

**Endpoint:** `POST /assessment/answer`
**Description:** Submit an answer for a specific question
**Authentication:** Required

**Request Body:**

```json
{
  "assessment_id": "number",
  "question_id": "number",
  "selected_option": "string"
}
```

**Response (Assessment Completed):**

```json
{
  "saveOption": true,
  "career_suggestion": "string",
  "score": "number",
  "feedbackMessage": "string"
}
```

**Response (Assessment Continuing):**

```json
{
  "saveOption": false,
  "career": "string",
  "confidence": "number",
  "feedbackMessage": "string",
  "nextQuestionId": "number"
}
```

**Error Response (Invalid Session):**

```json
{
  "error": "Invalid assessment session",
  "code": "INVALID_ASSESSMENT_SESSION"
}
```

### 7. Restart Assessment

**Endpoint:** `POST /assessment/restart`
**Description:** Reset and restart the current assessment
**Authentication:** Required

**Response:**

```json
{
  "message": "Assessment restarted",
  "nextQuestionId": "number",
  "assessment_id": "number"
}
```

---

## Profile Management (NEW)

### 8. Get User Profile

**Endpoint:** `GET /profiles`
**Description:** Retrieve user profile information
**Authentication:** Required

**Response:**

```json
{
  "name": "string",
  "age": "number",
  "education_level": "string",
  "interests": ["string"]
}
```

**Error Response (No profile):**

```json
{
  "status": 404,
  "error": "Profile not found"
}
```

### 9. Update User Profile

**Endpoint:** `PUT /profiles`
**Description:** Create or update user profile
**Authentication:** Required

**Request Body:**

```json
{
  "name": "string",
  "age": "number",
  "education_level": "string",
  "interests": ["string"]
}
```

**Response:**

```json
{
  "message": "Profile updated successfully",
  "profile": {
    "name": "string",
    "age": "number",
    "education_level": "string",
    "interests": ["string"]
  }
}
```

---

## Saved Careers Management

### 10. Save Career

**Endpoint:** `POST /saved-careers`
**Description:** Save a career recommendation for the user
**Authentication:** Required

**Request Body:**

```json
{
  "career_name": "string",
  "assessment_score": "number" // Optional
}
```

**Response:**

```json
{
  "success": true,
  "saved_career": {
    "id": "number",
    "career_name": "string",
    "user_id": "number",
    "assessment_score": "number",
    "created_at": "timestamp"
  }
}
```

### 11. Fetch Saved Careers

**Endpoint:** `GET /saved-careers`
**Description:** Retrieve all saved careers for the authenticated user
**Authentication:** Required

**Response:**

```json
{
  "success": true,
  "saved_careers": [
    {
      "id": "number",
      "career_name": "string",
      "user_id": "number",
      "created_at": "timestamp"
    }
  ]
}
```

### 12. Delete Career

**Endpoint:** `DELETE /saved-careers/{savedCareerId}`
**Description:** Delete a specific saved career
**Authentication:** Required

**Path Parameters:**

- `savedCareerId`: number (ID of the saved career to delete)

**Response:**

```json
{
  "success": true,
  "message": "Career deleted successfully"
}
```

---

## Roadmap Management

### 13. Fetch Roadmap

**Endpoint:** `GET /roadmaps/{savedCareerId}`
**Description:** Retrieve the career roadmap for a specific saved career
**Authentication:** Required

**Path Parameters:**

- `savedCareerId`: number (ID of the saved career)

**Response:**

```json
[
  {
    "roadmap_id": "number",
    "saved_career_id": "number",
    "step_order": "string",
    "step_description": "string",
    "duration": "string",
    "resources": ["string"]
  }
]
```

### 14. Delete Roadmap Step (NEW)

**Endpoint:** `DELETE /roadmaps/{roadmapId}`
**Description:** Delete a specific roadmap step
**Authentication:** Required

**Path Parameters:**

- `roadmapId`: number (ID of the roadmap step to delete)

**Response:**

```json
{
  "message": "Roadmap step deleted successfully"
}
```

---

## Error Handling

All endpoints return standardized error responses:

**4xx Client Errors:**

```json
{
  "success": false,
  "error": "Error description",
  "message": "Human-readable error message"
}
```

**5xx Server Errors:**

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Something went wrong on our end"
}
```

**Common Error Codes:**

- `401 Unauthorized`: Missing or invalid authentication token
- `400 Bad Request`: Invalid request format or missing required fields
- `404 Not Found`: Resource not found
- `403 Forbidden`: Access denied
- `500 Internal Server Error`: Server-side error

**New Assessment-Specific Error Codes:**

- `INVALID_ASSESSMENT_SESSION`: Assessment session expired or invalid
- `SESSION_MISMATCH`: Assessment ID doesn't match user session

---

## Authentication & Configuration Requirements

### CRITICAL: Frontend Configuration

All API requests **MUST** include credentials for session management:

```javascript
// Axios Configuration
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true, // REQUIRED
  headers: {
    "Content-Type": "application/json",
  },
});

// Fetch Configuration
fetch(url, {
  credentials: "include", // REQUIRED
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
```

### Authentication Headers

For protected endpoints, include both JWT token and ensure credentials:

```
Authorization: Bearer <jwt_token>
```

The token is automatically managed by the frontend application using cookies with the following configuration:

- Path: `/`
- Secure: `false` (development)
- SameSite: `lax`
- **withCredentials: true** (REQUIRED for sessions)

---

## Data Types

### User Object

```typescript
interface User {
  id: number;
  username: string;
  email: string;
  created_at?: string;
}
```

### Question Object

```typescript
interface Question {
  id: number;
  question_text: string;
  options: string[];
  category?: string;
}
```

### Saved Career Object

```typescript
interface SavedCareer {
  id: number;
  career_name: string;
  user_id: number;
  created_at: string;
}
```

### Roadmap Object

```typescript
interface Roadmap {
  id: number;
  saved_career_id: number;
  career_path: string;
  milestones: Milestone[];
  resources: Resource[];
}
```

### Milestone Object

```typescript
interface Milestone {
  title: string;
  description: string;
  timeline: string;
  skills_required: string[];
}
```

### Resource Object

```typescript
interface Resource {
  type: string;
  title: string;
  url: string;
  description: string;
}
```

---

## Rate Limiting

- Authentication endpoints: 5 requests per minute per IP
- Assessment endpoints: 100 requests per minute per user
- General endpoints: 60 requests per minute per user

---

## Development Notes

- Base URL is currently set to `http://localhost:5000/api/`
- All requests include `withCredentials: true` for CORS
- FormData requests automatically exclude `Content-Type` header
- Comprehensive logging is implemented for debugging
- Error responses include detailed information for development

---

## Example Usage

### Complete Assessment Flow

1. `POST /users/register` or `POST /users/login`
2. `GET /assessment/start`
3. Loop: `POST /assessment/answer` → `GET /assessment/next`
4. `POST /saved-careers` (save preferred career)
5. `GET /roadmaps/{savedCareerId}` (get career roadmap)

### Career Management Flow

1. `GET /saved-careers` (list all saved careers)
2. `GET /roadmaps/{savedCareerId}` (view specific roadmap)
3. `DELETE /saved-careers/{savedCareerId}` (remove unwanted careers)
