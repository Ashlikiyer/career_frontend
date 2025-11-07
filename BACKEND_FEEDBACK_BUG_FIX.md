# 🚨 CRITICAL BUG: Roadmap Feedback Detection Not Working

## Issue Summary

The `GET /roadmaps/:saved_career_id` endpoint is returning `feedback_submitted: false` even AFTER users have successfully submitted feedback. This causes the rating popup to appear every time the user reopens a roadmap they've already rated.

---

## Evidence from Production Testing

### Test Scenario

- **User ID**: 2
- **Saved Career ID**: 2
- **Roadmap ID**: 17
- **Feedback ID**: 3 (confirmed submitted successfully)

### Step 1: Feedback Submission ✅ (Working)

```http
POST /api/feedback
Authorization: Bearer <token>

Request Body:
{
  "rating": 5,
  "feedback_text": "sdasda",
  "roadmap_id": 17,
  "feedback_type": "roadmap"
}

Response:
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": {
    "id": 3,
    "feedback_type": "roadmap",
    "rating": 5,
    "feedback_text": "sdasda",
    "roadmap_id": 17,  ← Feedback linked to roadmap_id 17
    "created_at": "2025-11-06T14:23:26.425Z"
  }
}
```

**Result**: ✅ Feedback successfully saved to database

---

### Step 2: Fetch Roadmap After Feedback ❌ (BROKEN)

```http
GET /api/roadmaps/2
Authorization: Bearer <token>

Response:
{
  "career_name": "QA Tester",
  "roadmap_id": 17,
  "total_steps": 10,
  "completed_steps": 10,
  "is_completed": true,
  "feedback_submitted": false,  ← ❌ WRONG! Should be true
  "can_submit_feedback": true   ← ❌ WRONG! Should be false
}
```

**Result**: ❌ Backend fails to detect that feedback was submitted

---

## Root Cause Analysis

The backend is NOT correctly querying the feedback table when building the roadmap response. The query is failing to find the feedback record even though it exists in the database.

### Possible Issues:

1. **Wrong ID Being Used in Query**

   - Are you querying by `roadmap_id` (correct) or `saved_career_id` (incorrect)?
   - The feedback table has `roadmap_id`, not `saved_career_id`

2. **User ID Extraction Problem**

   - Is the `user_id` being correctly extracted from the JWT token?
   - Verify the user_id from the token matches the user_id in the feedback table

3. **Query Not Being Executed**

   - The feedback check query might not be running at all
   - Check if there's an error being silently caught

4. **JOIN or Relationship Issue**
   - If using a JOIN, the relationship might be broken
   - Check foreign key relationships

---

## Required Fix

### Current Code (Broken)

Your `getRoadmapBySavedCareerId` function is likely doing something like this:

```javascript
// ❌ WRONG - This won't find the feedback
const feedbackQuery = `
  SELECT * FROM feedback 
  WHERE roadmap_id = ? 
  AND user_id = ?
  AND feedback_type = 'roadmap'
`;

// But you're probably passing the wrong IDs or not executing it correctly
```

### Correct Implementation

```javascript
async getRoadmapBySavedCareerId(req, res) {
  try {
    const { saved_career_id } = req.params;
    const userId = req.user.id; // Extract from JWT token

    // 1. Get the roadmap data
    const roadmapQuery = `
      SELECT r.*, sc.career_name
      FROM roadmaps r
      JOIN saved_careers sc ON r.saved_career_id = sc.saved_career_id
      WHERE r.saved_career_id = ?
    `;
    const roadmapData = await db.query(roadmapQuery, [saved_career_id]);

    if (!roadmapData || roadmapData.length === 0) {
      return res.status(404).json({ message: "Roadmap not found" });
    }

    const roadmap = roadmapData[0];
    const roadmapId = roadmap.roadmap_id; // ← Get the actual roadmap_id

    // 2. Check if feedback exists - USE roadmap_id, NOT saved_career_id
    const feedbackQuery = `
      SELECT COUNT(*) as count
      FROM feedback
      WHERE roadmap_id = ?     ← Use roadmap_id from roadmap table
      AND user_id = ?          ← Use user_id from JWT token
      AND feedback_type = 'roadmap'
    `;

    console.log('🔍 Checking feedback for:', { roadmapId, userId }); // DEBUG LOG

    const feedbackResult = await db.query(feedbackQuery, [roadmapId, userId]);
    const feedbackSubmitted = feedbackResult[0].count > 0;

    console.log('🔍 Feedback found:', feedbackSubmitted); // DEBUG LOG

    // 3. Get roadmap steps and calculate completion
    const stepsQuery = `
      SELECT * FROM roadmap_steps
      WHERE roadmap_id = ?
      ORDER BY step_number
    `;
    const steps = await db.query(stepsQuery, [roadmapId]);

    const totalSteps = steps.length;
    const completedSteps = steps.filter(step => step.is_done).length;
    const isCompleted = totalSteps > 0 && completedSteps === totalSteps;

    // 4. Build response with correct feedback status
    const response = {
      career_name: roadmap.career_name,
      roadmap_id: roadmapId,
      roadmap: steps,
      total_steps: totalSteps,
      completed_steps: completedSteps,
      is_completed: isCompleted,
      feedback_submitted: feedbackSubmitted,        // ← MUST be correct
      can_submit_feedback: isCompleted && !feedbackSubmitted // ← Depends on feedback_submitted
    };

    return res.json(response);

  } catch (error) {
    console.error('Error fetching roadmap:', error);
    res.status(500).json({ message: "Server error" });
  }
}
```

---

## Debugging Steps

### 1. Add Console Logs

Add these logs to your backend code:

```javascript
console.log("🔍 Roadmap Feedback Check Debug:");
console.log("  - User ID from token:", userId);
console.log("  - Roadmap ID:", roadmapId);
console.log("  - Query params:", [roadmapId, userId]);
console.log("  - Feedback count:", feedbackResult[0].count);
console.log("  - Feedback submitted:", feedbackSubmitted);
```

### 2. Test Database Query Manually

Run this query directly in your database:

```sql
-- Replace with actual values from your test
SELECT * FROM feedback
WHERE roadmap_id = 17
AND user_id = 2
AND feedback_type = 'roadmap';

-- Should return the feedback record with id = 3
```

**Expected Result**: You should see the feedback record
**If no results**: The query has wrong parameters

### 3. Check JWT Token

Verify the user_id is being extracted correctly:

```javascript
console.log("JWT Token User:", req.user); // Should show { id: 2, email: '...' }
```

### 4. Check Database Schema

Verify your feedback table structure:

```sql
-- Check the feedback table
DESCRIBE feedback;

-- Should have columns:
-- - id (primary key)
-- - roadmap_id (foreign key to roadmaps.roadmap_id)
-- - user_id (foreign key to users.id)
-- - feedback_type (enum: 'assessment' or 'roadmap')
-- - rating
-- - feedback_text
-- - created_at
```

---

## Testing Checklist

After implementing the fix, test these scenarios:

### Test Case 1: Submit Feedback ✅

1. Complete all steps in a roadmap
2. Submit feedback
3. **Verify**: Feedback saved with correct `roadmap_id` and `user_id`

### Test Case 2: Fetch Roadmap After Feedback ✅

1. Fetch the same roadmap: `GET /api/roadmaps/:saved_career_id`
2. **Expected Response**:

```json
{
  "roadmap_id": 17,
  "is_completed": true,
  "feedback_submitted": true,   ← Must be true!
  "can_submit_feedback": false  ← Must be false!
}
```

### Test Case 3: Different User, Same Roadmap ✅

1. Different user completes the same roadmap
2. **Expected**: They see the rating popup (their own feedback status is independent)

### Test Case 4: Same User, Different Roadmap ✅

1. Same user completes a different roadmap
2. **Expected**: They see the rating popup (each roadmap has its own feedback status)

---

## Expected Behavior After Fix

### Scenario 1: First Time Completing Roadmap

```
User completes all steps →
Backend returns: feedback_submitted=false, can_submit_feedback=true →
Frontend shows rating popup ✅
```

### Scenario 2: After Submitting Feedback

```
User submits feedback →
Backend saves feedback with roadmap_id and user_id ✅ →
User closes modal
```

### Scenario 3: Reopening Rated Roadmap

```
User reopens same roadmap →
Backend returns: feedback_submitted=true, can_submit_feedback=false ✅ →
Frontend does NOT show popup ✅
```

---

## Summary

**Problem**: Backend not detecting submitted feedback  
**Cause**: Incorrect query or wrong IDs being used  
**Fix**: Use `roadmap_id` (not `saved_career_id`) and `user_id` from JWT token  
**Impact**: Users see rating popup every time they open a roadmap

**CRITICAL**: This must be fixed ASAP as it's creating a very poor user experience. Users are frustrated having to rate the same roadmap multiple times.

---

## Contact

If you need clarification on any of these points, please let me know. I can provide:

- Sample database queries to test
- Additional logging code
- Frontend debug information
- Live testing support

The frontend is working correctly and trusting the backend data. Once the backend returns accurate `feedback_submitted` values, the bug will be completely resolved.
