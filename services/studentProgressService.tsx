/**
 * Student Progress Service
 *
 * Service for fetching personalized student progress data
 */

import axios from "axios";
import { Cookies } from "react-cookie";

// API Configuration
const API_URL = "https://career.careerapp.xyz";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const cookies = new Cookies();

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
    console.error("Student Progress API Error:", {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url,
    });

    if (error.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Types for student progress data

export interface StepAssessment {
  completed: boolean;
  passed: boolean;
  score: number;
  attempts?: number;
}

export interface StepProgress {
  step_id: number;
  step_number: number;
  title: string;
  description: string;
  duration: string;
  difficulty_level: "beginner" | "intermediate" | "advanced";
  status: "completed" | "in-progress" | "locked";
  is_done: boolean;
  time_spent_minutes: number;
  time_spent_formatted: string;
  started_at: string | null;
  completed_at: string | null;
  resources?: string;
  assessment: StepAssessment;
}

export interface CurrentStep {
  step_number: number;
  title: string;
  difficulty_level: string;
}

export interface DifficultyBreakdown {
  beginner: number;
  intermediate: number;
  advanced: number;
}

export interface CareerProgress {
  saved_career_id: number;
  career_name: string;
  saved_at: string;
  roadmap_id: number;
  total_steps: number;
  completed_steps: number;
  remaining_steps: number;
  progress_percent: number;
  is_completed: boolean;
  total_time_minutes: number;
  total_time_formatted: string;
  current_step: CurrentStep | null;
  steps: StepProgress[];
  difficulty_breakdown: DifficultyBreakdown;
}

export interface ProgressSummary {
  totalCareers: number;
  totalSteps: number;
  completedSteps: number;
  remainingSteps: number;
  totalTimeMinutes: number;
  totalTimeFormatted: string;
  overallProgress: number;
  activeCareers: number;
  completedCareers: number;
}

export interface StudentProgressData {
  hasProgress: boolean;
  message?: string;
  careers: CareerProgress[];
  summary: ProgressSummary;
}

export interface DifficultyStats {
  total: number;
  completed: number;
  time: number;
  timeFormatted: string;
  completionRate: number;
}

export interface LearningStats {
  steps: {
    total: number;
    completed: number;
    remaining: number;
    completionRate: number;
  };
  time: {
    totalMinutes: number;
    totalFormatted: string;
    avgPerStep: number;
    avgPerStepFormatted: string;
  };
  difficulty: {
    beginner: DifficultyStats;
    intermediate: DifficultyStats;
    advanced: DifficultyStats;
  };
  assessments: {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    avgScore: number;
  };
  streak: {
    current: number;
    message: string;
  };
}

// API Functions

/**
 * Get complete student progress data (all careers)
 */
export const getStudentProgress = async (): Promise<{
  success: boolean;
  data: StudentProgressData;
}> => {
  const response = await api.get("/api/student/progress");
  return response.data;
};

/**
 * Get progress for a specific career
 */
export const getCareerProgress = async (
  savedCareerId: number,
): Promise<{ success: boolean; data: CareerProgress }> => {
  const response = await api.get(`/api/student/progress/${savedCareerId}`);
  return response.data;
};

/**
 * Get learning statistics summary
 */
export const getLearningStats = async (): Promise<{
  success: boolean;
  data: LearningStats;
}> => {
  const response = await api.get("/api/student/stats");
  return response.data;
};

export default {
  getStudentProgress,
  getCareerProgress,
  getLearningStats,
};
