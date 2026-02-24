// Assessment API Service
import axios from "axios";
import {
  RoadmapProgress,
  Assessment,
  AssessmentAnswer,
  AssessmentResult,
  AssessmentHistory,
} from "../types/assessment";

const API_BASE_URL = "https://career.careerapp.xyz/api/roadmap-assessment";

// Get auth token
const getAuthToken = (): string => {
  return localStorage.getItem("token") || "";
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to all requests
axiosInstance.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Assessment API Error:", {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url,
    });

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Get roadmap progress with assessment status for all steps
 * @param savedCareerId - ID of user's saved career
 */
export const getRoadmapProgress = async (
  savedCareerId: number
): Promise<RoadmapProgress> => {
  const response = await axiosInstance.get(`/${savedCareerId}/progress`);
  return response.data;
};

/**
 * Get assessment questions for a specific step
 * First time may take ~5 seconds (AI generation)
 * @param savedCareerId - ID of user's saved career
 * @param stepNumber - Step number (1-10)
 */
export const getStepAssessment = async (
  savedCareerId: number,
  stepNumber: number
): Promise<Assessment> => {
  const response = await axiosInstance.get(
    `/${savedCareerId}/step/${stepNumber}`
  );
  return response.data;
};

/**
 * Submit assessment answers and get results
 * Auto-completes step if passed (≥70%)
 * @param savedCareerId - ID of user's saved career
 * @param stepNumber - Step number (1-10)
 * @param answers - Array of answers (must include all 10 questions)
 * @param timeTakenSeconds - Time taken to complete assessment
 */
export const submitAssessment = async (
  savedCareerId: number,
  stepNumber: number,
  answers: AssessmentAnswer[],
  timeTakenSeconds: number
): Promise<AssessmentResult> => {
  const response = await axiosInstance.post(
    `/${savedCareerId}/step/${stepNumber}/submit`,
    {
      answers,
      time_taken_seconds: timeTakenSeconds,
    }
  );
  return response.data;
};

/**
 * Get assessment history for a specific step
 * @param savedCareerId - ID of user's saved career
 * @param stepNumber - Step number (1-10)
 */
export const getAssessmentHistory = async (
  savedCareerId: number,
  stepNumber: number
): Promise<AssessmentHistory> => {
  const response = await axiosInstance.get(
    `/${savedCareerId}/step/${stepNumber}/history`
  );
  return response.data;
};
