import axios, { AxiosRequestConfig, ResponseType } from "axios";
import { Cookies } from "react-cookie";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://career.careerapp.xyz/",
  withCredentials: true, // REQUIRED for sessions
  timeout: 10000, // 10 second timeout
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const cookies = new Cookies();
let authToken: string | null = cookies.get("authToken") || null;

// Set up interceptors for automatic token handling
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || cookies.get("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Enhanced error logging for debugging
    console.error("API Error Details:", {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url,
      method: error.config?.method,
    });

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      cookies.remove("authToken", { path: "/" });
      // Redirect to login if needed
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

const setAuth = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem("token", token);
    cookies.set("authToken", token, {
      path: "/",
      secure: false, // Set to false to match backend session config
      sameSite: "lax",
      domain:
        window.location.hostname === "localhost" ? "localhost" : undefined,
    });
    // Set default authorization header
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    localStorage.removeItem("token");
    cookies.remove("authToken", { path: "/" });
    delete api.defaults.headers.common["Authorization"];
  }
};

const getHeaders = (isFormData?: boolean) => {
  const headers: { [key: string]: string } = {};
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  } else {
    console.warn("No authToken available for request");
  }
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};

// Enhanced error handling function
const handleApiError = (error: any) => {
  const errorData = error.response?.data;

  switch (errorData?.code) {
    case "INVALID_ASSESSMENT_SESSION":
      throw new Error(
        "Assessment session expired. Please start a new assessment."
      );
    default:
      if (error.response?.status === 401) {
        throw new Error("Authentication failed. Please login again.");
      } else if (error.response?.status === 404) {
        throw new Error("Resource not found");
      } else {
        const errorMessage =
          errorData?.error ||
          errorData?.message ||
          error.message ||
          "An unexpected error occurred";
        throw new Error(errorMessage);
      }
  }
};

export async function dataFetch(
  endpoint: string,
  method: string,
  data?: any,
  responseType?: ResponseType
) {
  try {
    const isFormData = data instanceof FormData;
    const config: AxiosRequestConfig = {
      url: `/api/${endpoint}`, // Add /api prefix for all endpoints
      method,
      data,
      headers: getHeaders(isFormData),
      responseType: responseType || "json",
      withCredentials: true,
    };
    console.log("Request Config:", JSON.stringify(config, null, 2));
    const response = await api.request(config);
    console.log("Response Data:", JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("API Error:", {
        message: error.message,
        status: error.response?.status,
        data: JSON.stringify(error.response?.data, null, 2),
        config: JSON.stringify(error.config, null, 2),
      });
      handleApiError(error);
    } else if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error("An unknown error occurred");
    }
  }
}

export async function registerUser(userData: {
  username?: string;
  email: string;
  password: string;
}) {
  try {
    const response = await dataFetch("users/register", "POST", userData);
    return response; // { message: "User registered", userId: 1 }
  } catch (error) {
    throw error;
  }
}

export async function loginUser(credentials: {
  email: string;
  password: string;
}) {
  try {
    const response = await dataFetch("users/login", "POST", credentials);
    if (response.token) {
      setAuth(response.token);
      console.log("Token set:", cookies.get("authToken"));
    } else {
      console.error("No token in login response:", response);
    }
    return response;
  } catch (error) {
    throw error;
  }
}

export async function logoutUser() {
  setAuth(null);
}

// Check for existing assessment session
export async function checkAssessmentStatus() {
  try {
    const response = await dataFetch("assessment/status", "GET"); // Reverted to original endpoint
    return response;
    /*
    Response format:
    {
      hasActiveAssessment: true/false,
      assessment_id: 1,
      currentCareer: "Software Developer",
      currentConfidence: 75,
      message: "Active assessment found"
    }
    */
  } catch (error) {
    return { hasActiveAssessment: false };
  }
}

export async function startAssessment() {
  try {
    const response = await dataFetch("assessment/start", "GET"); // Reverted to original endpoint
    // Enhanced response now includes options_descriptions for tooltips
    const enhancedResponse = {
      question_id: response.question_id,
      question_text: response.question_text,
      options_answer: response.options_answer,
      options_descriptions: response.options_descriptions || {}, // Handle null/undefined safely
      career_category: response.career_category,
      assessment_id: response.assessment_id,
    };

    // Debug logging for tooltip integration
    console.log("🚀 Start Assessment API Response:", {
      hasDescriptions: !!response.options_descriptions,
      descriptionsType: typeof response.options_descriptions,
      descriptionsCount: response.options_descriptions
        ? Object.keys(response.options_descriptions).length
        : 0,
      questionsHasOptions: !!response.options_answer,
    });

    return enhancedResponse;
  } catch (error) {
    console.error("Failed to start assessment:", error);
    throw error;
  }
}

export async function getCurrentOrStartAssessment() {
  try {
    const response = await dataFetch("assessment/current", "GET"); // Reverted to original endpoint
    // Enhanced response now includes options_descriptions for tooltips
    const enhancedResponse = {
      question_id: response.question_id,
      question_text: response.question_text,
      options_answer: response.options_answer,
      options_descriptions: response.options_descriptions || {}, // Handle null/undefined safely
      career_category: response.career_category,
      assessment_id: response.assessment_id,
      isExisting: response.isExisting || false,
    };

    // Debug logging for tooltip integration
    console.log("📊 Assessment API Response:", {
      hasDescriptions: !!response.options_descriptions,
      descriptionsType: typeof response.options_descriptions,
      descriptionsCount: response.options_descriptions
        ? Object.keys(response.options_descriptions).length
        : 0,
      questionsHasOptions: !!response.options_answer,
      optionsCount: response.options_answer
        ? response.options_answer.split(",").length
        : 0,
    });

    return enhancedResponse;
  } catch (error) {
    // Fallback to old method if new endpoint doesn't exist
    if (error instanceof Error && error.message.includes("404")) {
      console.log("Using fallback method for assessment");
      return await startAssessment();
    }
    console.error("Failed to get/start assessment:", error);
    throw error;
  }
}

export async function fetchNextQuestion(
  currentQuestionId: number,
  assessmentId: number
) {
  try {
    const response = await dataFetch(
      `assessment/next?currentQuestionId=${currentQuestionId}&assessment_id=${assessmentId}`, // Reverted to original endpoint
      "GET"
    );
    // Enhanced response now includes options_descriptions for tooltips
    const enhancedResponse = {
      question_id: response.question_id,
      question_text: response.question_text,
      options_answer: response.options_answer,
      options_descriptions: response.options_descriptions || {}, // Handle null/undefined safely
      career_mapping: response.career_mapping || {},
      career_category: response.career_category,
      assessment_id: response.assessment_id,
      // Legacy format for backward compatibility
      options: response.options_answer
        ? response.options_answer.split(",")
        : [],
    };

    // Debug logging for tooltip integration
    console.log("➡️ Next Question API Response:", {
      questionId: response.question_id,
      hasDescriptions: !!response.options_descriptions,
      descriptionsType: typeof response.options_descriptions,
      descriptionsCount: response.options_descriptions
        ? Object.keys(response.options_descriptions).length
        : 0,
      hasCareerMapping: !!response.career_mapping,
    });

    return enhancedResponse;
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      // No more questions
      return null;
    }
    throw error;
  }
}

export async function submitAnswer(
  assessmentId: number,
  questionId: number,
  selectedOption: string
) {
  try {
    const data = {
      assessment_id: assessmentId,
      question_id: questionId,
      selected_option: selectedOption.trim(),
    };
    console.log("Submitting Answer Payload:", JSON.stringify(data, null, 2));

    const response = await dataFetch("assessment/answer", "POST", data); // Reverted to original endpoint

    // Handle different response types
    if (response.saveOption) {
      // Assessment completed - return enhanced format with backward compatibility
      return {
        completed: true,
        // New enhanced fields
        career_suggestions: response.career_suggestions,
        primary_career: response.primary_career,
        primary_score: response.primary_score,
        // Legacy fields for backward compatibility
        career_suggestion:
          response.career_suggestion || response.primary_career,
        score: response.score || response.primary_score,
        feedbackMessage: response.feedbackMessage,
        message: response.message || "Assessment completed",
        saveOption: response.saveOption,
        restartOption: response.restartOption,
      };
    } else {
      // Continue assessment
      return {
        completed: false,
        career: response.career,
        confidence: response.confidence,
        feedbackMessage: response.feedbackMessage,
        nextQuestionId: response.nextQuestionId,
      };
    }
  } catch (error: any) {
    // Handle specific error codes from backend
    if (error.response?.data?.code === "INVALID_ASSESSMENT_SESSION") {
      throw new Error(
        "Assessment session expired. Please start a new assessment."
      );
    }
    handleApiError(error);
    throw error;
  }
}

export async function restartAssessment() {
  try {
    const response = await dataFetch("assessment/restart", "POST"); // Reverted to original endpoint
    return response; // { message, nextQuestionId: 1, assessment_id }
  } catch (error) {
    throw error;
  }
}

export async function saveCareer(careerName: string, assessmentScore?: number) {
  try {
    const data = {
      career_name: careerName,
      assessment_score: assessmentScore || 0,
    };
    console.log("Saving Career Payload:", JSON.stringify(data, null, 2));
    const response = await dataFetch("saved-careers", "POST", data);

    // Enhanced response includes:
    // - message: "Career saved and roadmap generated automatically"
    // - savedCareer: { saved_career_id, user_id, career_name, saved_at }
    // - roadmapGenerated: true/false
    // - roadmapSteps: number of steps generated

    return response;
  } catch (error) {
    throw error;
  }
}

export async function fetchSavedCareers() {
  try {
    const response = await dataFetch("saved-careers", "GET");
    return response; // Array of saved careers
  } catch (error) {
    throw error;
  }
}

export async function deleteCareer(savedCareerId: number) {
  try {
    const response = await dataFetch(
      `saved-careers/${savedCareerId}`,
      "DELETE"
    );

    // Enhanced response includes:
    // - message: "Saved career and associated roadmap deleted"
    // - roadmapStepsDeleted: number of roadmap steps deleted

    return response;
  } catch (error) {
    throw error;
  }
}

// DEPRECATED: Roadmaps are now auto-generated when careers are saved
// This function is kept for backward compatibility but is no longer needed
export async function generateRoadmap(savedCareerId: number) {
  console.warn(
    "generateRoadmap is deprecated - roadmaps are now auto-generated when careers are saved"
  );
  return { success: true, saved_career_id: savedCareerId };
}

export async function fetchRoadmap(savedCareerId: number) {
  try {
    const response = await dataFetch(`roadmaps/${savedCareerId}`, "GET");

    // Enhanced response now includes user-specific progress tracking:
    // - career_name: Name of the career
    // - roadmap_id: Unique roadmap identifier
    // - roadmap: Array of roadmap steps with is_done, completed_at fields
    // - total_steps: Total number of steps
    // - completed_steps: Number of completed steps

    return response;
  } catch (error) {
    console.error("Fetch Roadmap Error:", error);
    throw new Error("Failed to load roadmap from server.");
  }
}

/**
 * Get progress summary for a roadmap
 */
export async function getRoadmapProgress(savedCareerId: number) {
  try {
    const response = await dataFetch(
      `roadmaps/${savedCareerId}/progress`,
      "GET"
    );

    console.log("📊 Roadmap progress retrieved:", response);
    return response;
    /*
    Response format:
    {
      "career_name": "UX/UI Designer",
      "roadmap_id": 9,
      "total_steps": 10,
      "completed_steps": 2,
      "progress_percentage": 20,
      "steps": [
        {
          "step_id": 1,
          "step_number": 1,
          "title": "Design Fundamentals",
          "is_done": true,
          "completed_at": "2025-10-22T11:43:56.706Z"
        }
      ]
    }
    */
  } catch (error) {
    console.error("Error fetching roadmap progress:", error);
    throw error;
  }
}

/**
 * Update progress for a specific roadmap step
 */
export async function updateRoadmapStepProgress(
  stepId: number,
  isDone: boolean
) {
  try {
    const response = await dataFetch(
      `roadmaps/step/${stepId}/progress`,
      "PUT",
      {
        is_done: isDone,
      }
    );

    console.log("✅ Step progress updated:", response);
    return response;
    /*
    Response format:
    {
      "message": "Step marked as completed",
      "step": {
        "step_id": 1,
        "step_number": 1,
        "title": "Design Fundamentals",
        "is_done": true,
        "completed_at": "2025-10-22T11:43:56.706Z"
      }
    }
    */
  } catch (error) {
    console.error("Error updating step progress:", error);
    throw error;
  }
}

export async function deleteRoadmapStep(roadmapId: number) {
  try {
    const response = await dataFetch(`roadmaps/${roadmapId}`, "DELETE");
    return response;
  } catch (error) {
    throw error;
  }
}

// Profile Management Functions
export async function getProfile() {
  try {
    const response = await dataFetch("profiles", "GET");
    return response;
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null; // No profile exists yet
    }
    throw error;
  }
}

export async function updateProfile(profileData: any) {
  try {
    const response = await dataFetch("profiles", "PUT", profileData);
    return response;
  } catch (error) {
    throw error;
  }
}

// Session health check
export async function ensureValidSession() {
  try {
    const response = await dataFetch("../health", "GET"); // Remove /api prefix for health endpoint
    return response.session === "active";
  } catch (error) {
    return false;
  }
}

// Debug session - matches your backend debug endpoint
export async function debugSession() {
  try {
    const response = await dataFetch("debug/session", "GET");
    console.log("Session Debug Info:", response);
    return response;
  } catch (error) {
    console.error("Session debug failed:", error);
    throw error;
  }
}

// Test session connectivity
export async function testSessionConnectivity() {
  try {
    // Test basic connectivity
    const health = await ensureValidSession();
    console.log("Health check:", health);

    // Test session debug info
    const sessionInfo = await debugSession();
    console.log("Session info:", sessionInfo);

    return { health, sessionInfo };
  } catch (error) {
    console.error("Session connectivity test failed:", error);
    throw error;
  }
}

// New Career Suggestions API Functions
export async function getCareerSuggestions(assessmentId: number) {
  try {
    const response = await dataFetch(
      `career-suggestions/${assessmentId}`,
      "GET"
    );
    return response;
    /*
    Response format:
    {
      "assessment_id": 1,
      "career_suggestions": [...],
      "primary_career": "Web Developer",
      "primary_score": 94,
      "answers_count": 8,
      "completion_date": "2025-10-08T10:30:00.000Z"
    }
    */
  } catch (error) {
    console.error("Error getting career suggestions:", error);
    throw error;
  }
}

export async function getCareerDetails(
  assessmentId: number,
  careerName: string
) {
  try {
    const response = await dataFetch(
      `career-suggestions/${assessmentId}/career/${careerName}`,
      "GET"
    );
    return response;
    /*
    Response format:
    {
      "career": {
        "career": "Web Developer",
        "compatibility": 94,
        "reason": "Strong web development interest..."
      },
      "rank": 1,
      "total_suggestions": 5
    }
    */
  } catch (error) {
    console.error("Error getting career details:", error);
    throw error;
  }
}

// ============================================
// FEEDBACK SYSTEM API FUNCTIONS
// ============================================

/**
 * Submit user feedback for assessment experience
 */
export async function submitUserFeedback(feedbackData: {
  rating: number;
  feedback_text?: string;
  assessment_id?: number;
}) {
  try {
    console.log("Submitting feedback:", feedbackData);
    const response = await dataFetch("feedback", "POST", feedbackData);

    console.log("✅ Feedback submitted successfully:", response);
    return response;
    /*
    Response format:
    {
      "success": true,
      "message": "Feedback submitted successfully",
      "data": {
        "id": 15,
        "rating": 5,
        "feedback_text": "Great assessment experience!",
        "created_at": "2025-10-21T13:25:30.000Z"
      }
    }
    */
  } catch (error) {
    console.error("Error submitting feedback:", error);
    throw error;
  }
}

/**
 * Submit user feedback for completed roadmap
 */
export async function submitRoadmapFeedback(feedbackData: {
  rating: number;
  feedback_text?: string;
  roadmap_id: number;
  feedback_type: "roadmap";
}) {
  try {
    console.log("Submitting roadmap feedback:", feedbackData);
    const response = await dataFetch("feedback", "POST", feedbackData);

    console.log("✅ Roadmap feedback submitted successfully:", response);
    return response;
    /*
    Response format:
    {
      "success": true,
      "message": "Roadmap feedback submitted successfully",
      "data": {
        "id": 16,
        "rating": 5,
        "feedback_text": "Great roadmap experience!",
        "roadmap_id": 1,
        "feedback_type": "roadmap",
        "created_at": "2025-10-22T12:00:00.000Z"
      }
    }
    */
  } catch (error) {
    console.error("Error submitting roadmap feedback:", error);
    throw error;
  }
}

/**
 * Get feedback analytics for admin dashboard
 */
export async function getFeedbackAnalytics(timeRange: string = "30d") {
  try {
    const response = await dataFetch(
      `feedback/analytics?timeRange=${timeRange}`,
      "GET"
    );

    console.log("📊 Feedback analytics retrieved:", response);
    return response;
    /*
    Response format:
    {
      "success": true,
      "data": {
        "summary": {
          "totalFeedback": 25,
          "averageRating": "4.32",
          "timeRange": "30d"
        },
        "ratingDistribution": {
          "1": 1, "2": 2, "3": 4, "4": 8, "5": 10
        },
        "recentFeedback": [...]
      }
    }
    */
  } catch (error) {
    console.error("Error fetching feedback analytics:", error);
    throw error;
  }
}

/**
 * Get user's feedback history (requires authentication)
 */
export async function getUserFeedbackHistory() {
  try {
    const response = await dataFetch("feedback/user", "GET");

    console.log("📝 User feedback history retrieved:", response);
    return response;
    /*
    Response format:
    {
      "success": true,
      "data": [
        {
          "id": 15,
          "rating": 5,
          "feedback_text": "Great assessment experience!",
          "created_at": "2025-10-21T13:25:30.000Z",
          "assessment_name": "General Feedback"
        }
      ]
    }
    */
  } catch (error) {
    console.error("Error fetching user feedback history:", error);
    throw error;
  }
}

export { setAuth };
