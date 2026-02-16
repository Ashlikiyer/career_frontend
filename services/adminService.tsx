/**
 * Admin Service
 *
 * Service for admin-only API calls (analytics dashboard)
 */

import axios from "axios";
import { Cookies } from "react-cookie";

// API Configuration
const API_URL = "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000, // 30 second timeout for analytics queries
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
    console.error("Admin API Error:", {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url,
    });

    if (error.response?.status === 401) {
      window.location.href = "/login";
    } else if (error.response?.status === 403) {
      console.error("Access denied - Admin privileges required");
    }
    return Promise.reject(error);
  }
);

// Types for analytics data
export interface OverviewStats {
  totalUsers: number;
  totalRoadmapsStarted: number;
  totalSteps: number;
  completedSteps: number;
  activeUsers: number;
  completedRoadmaps: number;
  completionRate: number;
  usersWithProfiles: number;
  totalTimeMinutes: number;
  totalTimeFormatted: string;
}

export interface TimePerStep {
  step_number: number;
  avg_minutes: number;
  total_steps: number;
  total_minutes: number;
  avg_formatted: string;
}

export interface TimePerDifficulty {
  difficulty: string;
  avg_minutes: number;
  total_steps: number;
  total_minutes: number;
  avg_formatted: string;
}

export interface EstimatedVsActual {
  step_number: number;
  difficulty: string;
  avg_estimated_minutes: number;
  avg_actual_minutes: number;
  difference_percent: number;
}

export interface TimeAnalytics {
  timePerStep: TimePerStep[];
  timePerDifficulty: TimePerDifficulty[];
  estimatedVsActual: EstimatedVsActual[];
}

export interface PassRateByStep {
  step_number: number;
  total: number;
  passed: number;
  pass_rate: number;
  avg_score: number;
}

export interface ScoreDistribution {
  range: string;
  count: number;
}

export interface AssessmentAnalytics {
  totalAssessments: number;
  passedAssessments: number;
  failedAssessments: number;
  passRate: number;
  avgScore: number;
  passRateByStep: PassRateByStep[];
  retakeStats: {
    usersWithRetakes: number;
    avgRetakesPerUser: number;
    totalRetakes: number;
  };
  scoreDistribution: ScoreDistribution[];
}

export interface DropoffByStep {
  step_number: number;
  total_started: number;
  completed: number;
  abandoned: number;
  dropoff_rate: number;
}

export interface StoppedAtDistribution {
  step: number;
  count: number;
}

export interface DropoffAnalytics {
  dropoffByStep: DropoffByStep[];
  stoppedAtDistribution: StoppedAtDistribution[];
  avgLastCompletedStep: number;
  highestDropoffStep: DropoffByStep | null;
}

export interface DifficultyCompletion {
  difficulty: string;
  total_steps: number;
  completed: number;
  completion_rate: number;
  avg_time_minutes: number;
  avg_time_formatted: string;
}

export interface DifficultyAssessment {
  difficulty: string;
  total_assessments: number;
  passed: number;
  pass_rate: number;
  avg_score: number;
}

export interface DifficultyAnalytics {
  completionByDifficulty: DifficultyCompletion[];
  assessmentByDifficulty: DifficultyAssessment[];
}

export interface PopularCareer {
  career_name: string;
  total_users: number;
}

export interface CareerCompletionRate {
  career_name: string;
  users: number;
  total_steps: number;
  completed_steps: number;
  completion_rate: number;
}

export interface CareerAnalytics {
  popularCareers: PopularCareer[];
  careerCompletionRates: CareerCompletionRate[];
}

// API Functions

/**
 * Get all analytics data (combined endpoint)
 */
export const getAllAnalytics = async () => {
  const response = await api.get("/api/admin/analytics");
  return response.data;
};

/**
 * Get overview statistics
 */
export const getOverviewStats = async (): Promise<{
  success: boolean;
  data: OverviewStats;
}> => {
  const response = await api.get("/api/admin/analytics/overview");
  return response.data;
};

/**
 * Get time analytics
 */
export const getTimeAnalytics = async (): Promise<{
  success: boolean;
  data: TimeAnalytics;
}> => {
  const response = await api.get("/api/admin/analytics/time");
  return response.data;
};

/**
 * Get assessment analytics
 */
export const getAssessmentAnalytics = async (): Promise<{
  success: boolean;
  data: AssessmentAnalytics;
}> => {
  const response = await api.get("/api/admin/analytics/assessments");
  return response.data;
};

/**
 * Get dropoff analytics
 */
export const getDropoffAnalytics = async (): Promise<{
  success: boolean;
  data: DropoffAnalytics;
}> => {
  const response = await api.get("/api/admin/analytics/dropoff");
  return response.data;
};

/**
 * Get difficulty analytics
 */
export const getDifficultyAnalytics = async (): Promise<{
  success: boolean;
  data: DifficultyAnalytics;
}> => {
  const response = await api.get("/api/admin/analytics/difficulty");
  return response.data;
};

/**
 * Get career analytics
 */
export const getCareerAnalytics = async (): Promise<{
  success: boolean;
  data: CareerAnalytics;
}> => {
  const response = await api.get("/api/admin/analytics/careers");
  return response.data;
};

export default {
  getAllAnalytics,
  getOverviewStats,
  getTimeAnalytics,
  getAssessmentAnalytics,
  getDropoffAnalytics,
  getDifficultyAnalytics,
  getCareerAnalytics,
};
