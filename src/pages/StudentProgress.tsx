/**
 * Student Progress Dashboard
 *
 * Personalized learning progress dashboard for individual students.
 * Displays current learning path, step status, time tracking, and assessments.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cookies } from "react-cookie";
import {
  getStudentProgress,
  getLearningStats,
  StudentProgressData,
  LearningStats,
  CareerProgress,
} from "../../services/studentProgressService";
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  ChevronRight,
  Play,
  Lock,
  Target,
} from "lucide-react";

// Progress ring component with inline Tailwind
const ProgressRing = ({
  percent,
  size = 100,
}: {
  percent: number;
  size?: number;
}) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          className="stroke-gray-200"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="stroke-indigo-600 transition-all duration-500"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{percent}%</span>
      </div>
    </div>
  );
};

const StudentProgress = () => {
  const navigate = useNavigate();
  const cookies = new Cookies();
  const authToken = cookies.get("authToken");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<StudentProgressData | null>(
    null,
  );
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<CareerProgress | null>(
    null,
  );
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  // Check auth and load data
  useEffect(() => {
    if (!authToken) {
      navigate("/login");
      return;
    }
    loadProgress();
  }, [authToken, navigate]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      setError(null);

      const [progressRes, statsRes] = await Promise.all([
        getStudentProgress(),
        getLearningStats(),
      ]);

      if (progressRes.success) {
        setProgressData(progressRes.data);
        if (progressRes.data.careers.length > 0) {
          setSelectedCareer(progressRes.data.careers[0]);
        }
      }

      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (err: unknown) {
      console.error("Failed to load progress:", err);
      setError("Failed to load your progress data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleStepExpand = (stepId: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  // Get difficulty badge styling
  const getDifficultyBadge = (level: string) => {
    const styles: { [key: string]: string } = {
      beginner: "bg-green-100 text-green-700",
      intermediate: "bg-amber-100 text-amber-700",
      advanced: "bg-red-100 text-red-700",
    };
    const labels: { [key: string]: string } = {
      beginner: "BEGINNER",
      intermediate: "INTERMEDIATE",
      advanced: "ADVANCED",
    };
    return { style: styles[level] || "bg-gray-100 text-gray-700", label: labels[level] || level.toUpperCase() };
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Skeleton */}
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-2">
              <div className="h-9 w-40 bg-gray-200 rounded-lg animate-shimmer" />
              <div className="h-5 w-80 bg-gray-200 rounded animate-shimmer" />
            </div>
            <div className="h-10 w-24 bg-gray-200 rounded-lg animate-shimmer" />
          </div>
          
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg animate-shimmer" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-20 bg-gray-200 rounded animate-shimmer" />
                    <div className="h-6 w-16 bg-gray-200 rounded animate-shimmer" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* Hero Card Skeleton */}
              <div className="rounded-xl bg-slate-800 p-6 h-28">
                <div className="space-y-3">
                  <div className="h-7 w-48 bg-slate-700 rounded animate-shimmer" />
                  <div className="h-4 w-72 bg-slate-700 rounded animate-shimmer" />
                </div>
              </div>
              
              {/* Roadmap Skeleton */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-5 w-36 bg-gray-200 rounded animate-shimmer" />
                  <div className="h-4 w-24 bg-gray-200 rounded animate-shimmer" />
                </div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gray-200 rounded-full animate-shimmer" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 bg-gray-200 rounded animate-shimmer" />
                          <div className="h-3 w-1/2 bg-gray-200 rounded animate-shimmer" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Sidebar Skeleton */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="h-5 w-40 bg-gray-200 rounded mb-4 animate-shimmer" />
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between">
                        <div className="h-4 w-20 bg-gray-200 rounded animate-shimmer" />
                        <div className="h-4 w-16 bg-gray-200 rounded animate-shimmer" />
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded-full animate-shimmer" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Progress</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={loadProgress}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!progressData || !progressData.hasProgress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Learning Paths Yet</h2>
          <p className="text-gray-500 mb-6">
            Start your learning journey by taking the career assessment and choosing a career path!
          </p>
          <button
            onClick={() => navigate("/assessment")}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            Take Career Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-page-enter">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Progress</h1>
            <p className="text-gray-500 mt-1">Track your learning journey and skill development across recommended career paths.</p>
          </div>
          <button
            onClick={loadProgress}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Learning Paths */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 animate-card-enter animate-stagger-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Learning Paths</p>
                <p className="text-2xl font-bold text-gray-900">{progressData.summary.totalCareers} Active</p>
              </div>
            </div>
          </div>

          {/* Steps Completed */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 animate-card-enter animate-stagger-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Steps Completed</p>
                <p className="text-2xl font-bold text-gray-900">{progressData.summary.completedSteps} / {progressData.summary.totalSteps}</p>
              </div>
            </div>
          </div>

          {/* Total Time */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 animate-card-enter animate-stagger-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Time</p>
                <p className="text-2xl font-bold text-gray-900">{progressData.summary.totalTimeFormatted || "0m"}</p>
              </div>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 animate-card-enter animate-stagger-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Overall Progress</p>
                <p className="text-2xl font-bold text-gray-900">{progressData.summary.overallProgress}%</p>
              </div>
              <ProgressRing percent={progressData.summary.overallProgress} size={60} />
            </div>
          </div>
        </div>

        {/* Current Path Focus Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Current Path Focus</h2>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full uppercase">Active Journey</span>
          </div>

          {/* Career Selector Tabs (if multiple careers) */}
          {progressData.careers.length > 1 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {progressData.careers.map((career) => (
                <button
                  key={career.saved_career_id}
                  onClick={() => setSelectedCareer(career)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                    selectedCareer?.saved_career_id === career.saved_career_id
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {career.career_name} ({career.progress_percent}%)
                </button>
              ))}
            </div>
          )}

          {selectedCareer && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Hero Card + Learning Roadmap */}
              <div className="lg:col-span-2 space-y-4">
                {/* Hero Card */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full blur-3xl" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-2">{selectedCareer.career_name}</h3>
                    <p className="text-slate-300 text-sm">
                      {selectedCareer.is_completed
                        ? "Congratulations! You have completed this learning path!"
                        : "Master the core competencies of modern software development."}
                    </p>
                  </div>
                </div>

                {/* Learning Roadmap */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Learning Roadmap</h4>
                    <span className="text-sm text-gray-500">{selectedCareer.total_steps} Steps total</span>
                  </div>

                  <div className="space-y-3">
                    {selectedCareer.steps.map((step, index) => {
                      const isExpanded = expandedSteps.has(step.step_id);
                      const diffBadge = getDifficultyBadge(step.difficulty_level);
                      const isInProgress = step.status === "in-progress";
                      const isCompleted = step.status === "completed";
                      const isLocked = step.status === "locked";

                      return (
                        <div
                          key={step.step_id}
                          className={`border rounded-lg transition-all ${
                            isInProgress ? "border-indigo-200 bg-indigo-50/50" : 
                            isCompleted ? "border-green-200 bg-green-50/30" : 
                            "border-gray-200 bg-white"
                          }`}
                        >
                          <div
                            className="flex items-center gap-4 p-4 cursor-pointer"
                            onClick={() => toggleStepExpand(step.step_id)}
                          >
                            {/* Step Number/Status */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isCompleted ? "bg-green-500 text-white" :
                              isInProgress ? "bg-indigo-500 text-white" :
                              "bg-gray-200 text-gray-500"
                            }`}>
                              {isCompleted ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : isLocked ? (
                                <Lock className="w-4 h-4" />
                              ) : (
                                <span className="text-sm font-medium">{index + 1}</span>
                              )}
                            </div>

                            {/* Step Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="font-medium text-gray-900">{step.title}</h5>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${diffBadge.style}`}>
                                  {diffBadge.label}
                                </span>
                                {isInProgress && (
                                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-indigo-100 text-indigo-700">
                                    In Progress
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-0.5 truncate">{step.description}</p>
                            </div>

                            {/* Progress Bar for In Progress */}
                            {isInProgress && step.time_spent_minutes > 0 && (
                              <div className="hidden sm:block w-24">
                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: "50%" }} />
                                </div>
                              </div>
                            )}

                            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50/50">
                              <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-500">Duration</span>
                                  <p className="font-medium text-gray-900">{step.duration || "N/A"}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Time Spent</span>
                                  <p className="font-medium text-gray-900">{step.time_spent_formatted || "0m"}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Assessment</span>
                                  <p className={`font-medium ${
                                    step.assessment.passed ? "text-green-600" : 
                                    step.assessment.completed ? "text-red-600" : "text-gray-500"
                                  }`}>
                                    {step.assessment.completed
                                      ? step.assessment.passed
                                        ? `Passed (${step.assessment.score}%)`
                                        : `Failed (${step.assessment.score}%)`
                                      : "Not taken"}
                                  </p>
                                </div>
                                {step.started_at && (
                                  <div>
                                    <span className="text-gray-500">Started</span>
                                    <p className="font-medium text-gray-900">
                                      {new Date(step.started_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Resume Learning Button */}
                  {!selectedCareer.is_completed && (
                    <button
                      onClick={() => navigate("/dashboard")}
                      className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      Resume Learning
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-4">
                {/* Difficulty Distribution */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Difficulty Distribution</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">BEGINNER</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedCareer.difficulty_breakdown.beginner} Steps
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${(selectedCareer.difficulty_breakdown.beginner / selectedCareer.total_steps) * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm text-gray-600">INTERMEDIATE</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedCareer.difficulty_breakdown.intermediate} Steps
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${(selectedCareer.difficulty_breakdown.intermediate / selectedCareer.total_steps) * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm text-gray-600">ADVANCED</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedCareer.difficulty_breakdown.advanced} Steps
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full transition-all"
                        style={{ width: `${(selectedCareer.difficulty_breakdown.advanced / selectedCareer.total_steps) * 100}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-4">
                    Your progress is balanced. Focus on Intermediate modules to unlock Advanced content.
                  </p>
                </div>

                {/* Mastered Skills */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Mastered Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCareer.steps
                      .filter((s) => s.status === "completed")
                      .slice(0, 6)
                      .map((step) => (
                        <span
                          key={step.step_id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-full"
                        >
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          {step.title.split(" ").slice(0, 2).join(" ")}
                        </span>
                      ))}
                    {selectedCareer.steps.filter((s) => s.status === "completed").length === 0 && (
                      <p className="text-sm text-gray-500">Complete steps to unlock skills</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Performance Accuracy Section */}
        {stats && (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h4 className="font-semibold text-gray-900 mb-6">Performance Accuracy</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12">
                    <svg className="w-12 h-12 transform -rotate-90">
                      <circle cx="24" cy="24" r="20" fill="none" className="stroke-gray-100" strokeWidth="4" />
                      <circle
                        cx="24" cy="24" r="20" fill="none"
                        className="stroke-green-500"
                        strokeWidth="4"
                        strokeDasharray={`${(stats.difficulty.beginner.completionRate / 100) * 126} 126`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                      {stats.difficulty.beginner.completionRate}%
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Beginner</p>
                    <p className="text-sm text-gray-500">Core concepts</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12">
                    <svg className="w-12 h-12 transform -rotate-90">
                      <circle cx="24" cy="24" r="20" fill="none" className="stroke-gray-100" strokeWidth="4" />
                      <circle
                        cx="24" cy="24" r="20" fill="none"
                        className="stroke-amber-500"
                        strokeWidth="4"
                        strokeDasharray={`${(stats.difficulty.intermediate.completionRate / 100) * 126} 126`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                      {stats.difficulty.intermediate.completionRate}%
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Intermediate</p>
                    <p className="text-sm text-gray-500">Building skills</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12">
                    <svg className="w-12 h-12 transform -rotate-90">
                      <circle cx="24" cy="24" r="20" fill="none" className="stroke-gray-100" strokeWidth="4" />
                      <circle
                        cx="24" cy="24" r="20" fill="none"
                        className="stroke-red-500"
                        strokeWidth="4"
                        strokeDasharray={`${(stats.difficulty.advanced.completionRate / 100) * 126} 126`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                      {stats.difficulty.advanced.completionRate}%
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Advanced</p>
                    <p className="text-sm text-gray-500">Expert level</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-gray-200 pt-8 pb-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">© 2025 CareerAI. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">System Status</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Support Docs</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Learning Philosophy</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default StudentProgress;
