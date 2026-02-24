import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  fetchRoadmap,
  updateRoadmapStepProgress,
  submitRoadmapFeedback,
  startRoadmapStep,
  recordTimeOnStep,
} from "../../services/dataService";
import {
  getRoadmapProgress,
  getStepAssessment,
  submitAssessment,
} from "../services/assessmentService";
import {
  Assessment,
  AssessmentAnswer,
  AssessmentResult,
  RoadmapProgress as AssessmentRoadmapProgress,
} from "../types/assessment";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/Toast";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  TrendingUp,
  CheckCircle,
  Lock,
  PlayCircle,
  BookOpen,
  Target,
  Zap,
  X,
  AlertCircle
} from "lucide-react";
import "./Roadmap.css";

interface Resource {
  title: string;
  url: string;
  type: string;
  platform: string;
  duration?: string;
  topics?: string;
}

interface WeekSection {
  week?: string; // e.g., "1-3", "4-6"
  weekNumber?: number; // Some careers use weekNumber instead
  topic: string;
  subtopics: string[];
  resources: (Resource | string)[]; // Can be Resource objects OR strings (for backward compatibility)
  estimatedHours: string;
  practiceExercises?: string[];
}

interface MilestoneProject {
  title: string;
  description: string;
  requirements?: string[];
  tasks?: string[]; // Some careers use tasks instead of requirements
  estimatedTime: string;
}

// Difficulty level type and metadata
type DifficultyLevel = "beginner" | "intermediate" | "advanced";

interface DifficultyInfo {
  label: string;
  badge: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  description: string;
  expectedEffort: string;
  prerequisites: string;
}

const DIFFICULTY_INFO: Record<DifficultyLevel, DifficultyInfo> = {
  beginner: {
    label: "Beginner",
    badge: "Easy",
    color: "#16a34a",
    bgColor: "#dcfce7",
    borderColor: "#86efac",
    icon: "🌱",
    description: "Foundational skills and introductory concepts",
    expectedEffort: "Comfortable learning pace",
    prerequisites: "No prior experience required",
  },
  intermediate: {
    label: "Intermediate",
    badge: "Medium",
    color: "#ca8a04",
    bgColor: "#fef9c3",
    borderColor: "#fde047",
    icon: "📚",
    description: "Applied knowledge and problem-solving skills",
    expectedEffort: "Moderate effort required",
    prerequisites: "Complete all Beginner steps first",
  },
  advanced: {
    label: "Advanced",
    badge: "Hard",
    color: "#dc2626",
    bgColor: "#fee2e2",
    borderColor: "#fca5a5",
    icon: "🚀",
    description: "Industry-level and career-ready competencies",
    expectedEffort: "Significant time investment",
    prerequisites: "Complete all Intermediate steps first",
  },
};

interface RoadmapStep {
  step_id: number;
  roadmap_id: number;
  step_number: number;
  title: string;
  description: string;
  duration: string;
  resources: string[]; // Legacy - kept for backward compatibility
  weeks?: WeekSection[]; // NEW: Detailed week-by-week breakdown
  milestone_project?: MilestoneProject; // NEW: Milestone project for each step (backend uses snake_case)
  difficulty_level?: DifficultyLevel; // NEW: Difficulty classification
  is_done: boolean;
  completed_at: string | null;
  // Time tracking fields
  started_at?: string | null; // When user started this step
  time_spent_minutes?: number; // Total time spent on this step
  time_spent_formatted?: string; // Human-readable time (e.g., "2h 30m")
}

interface RoadmapResponse {
  career_name: string;
  roadmap_id: number;
  roadmap: RoadmapStep[];
  total_steps: number;
  completed_steps: number;
  is_completed?: boolean; // NEW: All steps completed
  feedback_submitted?: boolean; // NEW: User already submitted feedback
  can_submit_feedback?: boolean; // NEW: Show feedback prompt
  // Time tracking analytics
  total_time_minutes?: number; // Total time spent on all steps
  total_time_formatted?: string; // Human-readable total time
  steps_in_progress?: number; // Number of steps that have been started
}

interface RoadmapPageProps {
  savedCareerId: number;
  careerName: string;
  onBack: () => void;
  onProgressUpdate?: () => void;
}

const RoadmapPage: React.FC<RoadmapPageProps> = ({
  savedCareerId,
  careerName,
  onBack,
  onProgressUpdate,
}) => {
  const toast = useToast();
  const [roadmap, setRoadmap] = useState<RoadmapStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roadmapData, setRoadmapData] = useState<RoadmapResponse | null>(null);
  const [updatingStep, setUpdatingStep] = useState<number | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set()); // Track expanded accordion steps

  // Toggle accordion expansion
  const toggleStepExpansion = (stepId: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackDismissed, setFeedbackDismissed] = useState(false); // Track if user dismissed the modal

  // Assessment state
  const [assessmentProgress, setAssessmentProgress] =
    useState<AssessmentRoadmapProgress | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(
    null
  );
  const [currentStepNumber, setCurrentStepNumber] = useState<number | null>(
    null
  );
  const [assessmentAnswers, setAssessmentAnswers] = useState<
    Map<number, number>
  >(new Map());
  const [assessmentStartTime, setAssessmentStartTime] = useState<number>(
    Date.now()
  );
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [submittingAssessment, setSubmittingAssessment] = useState(false);
  const [assessmentResult, setAssessmentResult] =
    useState<AssessmentResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [validationError, setValidationError] = useState(false);

  // Time tracking state
  const [activeStepId, setActiveStepId] = useState<number | null>(null); // Currently active step being tracked
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null); // When current session started
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState<number>(0); // Live counter for display
  const [pausedElapsedSeconds, setPausedElapsedSeconds] = useState<number>(0); // Preserved time when paused
  const [isPaused, setIsPaused] = useState(false); // Pause state
  const liveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Format minutes to human-readable string
  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Format seconds for live display
  const formatLiveTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  // Start tracking time for a step
  const handleStartStep = useCallback(
    async (step: RoadmapStep) => {
      try {
        // If already tracking this step and not paused, don't restart
        if (activeStepId === step.step_id && !isPaused) return;

        // If paused on same step, just resume from where we left off
        if (activeStepId === step.step_id && isPaused) {
          setIsPaused(false);
          setSessionStartTime(Date.now());
          // Keep the pausedElapsedSeconds - it will be added to the new elapsed time
          console.log(
            `⏱️ Resumed tracking Step ${step.step_number}: ${step.title} from ${pausedElapsedSeconds}s`
          );
          return;
        }

        // Save time for previous step if any
        if (activeStepId && sessionStartTime && !isPaused) {
          const totalSeconds =
            pausedElapsedSeconds +
            Math.floor((Date.now() - sessionStartTime) / 1000);
          const minutesSpent = Math.floor(totalSeconds / 60);
          if (minutesSpent > 0) {
            await recordTimeOnStep(activeStepId, minutesSpent);
          }
        }

        // Start tracking new step
        await startRoadmapStep(step.step_id);
        setActiveStepId(step.step_id);
        setSessionStartTime(Date.now());
        setLiveElapsedSeconds(0);
        setPausedElapsedSeconds(0); // Reset paused time for new step
        setIsPaused(false);

        // Update local state to reflect started_at
        setRoadmap((prevRoadmap) =>
          prevRoadmap.map((s) =>
            s.step_id === step.step_id
              ? { ...s, started_at: new Date().toISOString() }
              : s
          )
        );

        console.log(
          `⏱️ Started tracking Step ${step.step_number}: ${step.title}`
        );
      } catch (err) {
        console.error("Failed to start step tracking:", err);
      }
    },
    [activeStepId, sessionStartTime, isPaused, pausedElapsedSeconds]
  );

  // Pause tracking - saves time to database so it persists across page refreshes
  const handlePauseTracking = useCallback(async () => {
    if (!activeStepId || !sessionStartTime || isPaused) return;

    try {
      // Calculate total elapsed time including any previously paused time
      const currentSessionSeconds = Math.floor(
        (Date.now() - sessionStartTime) / 1000
      );
      const totalElapsedSeconds = pausedElapsedSeconds + currentSessionSeconds;

      // Save to paused state so we can resume from here
      setPausedElapsedSeconds(totalElapsedSeconds);
      setLiveElapsedSeconds(totalElapsedSeconds);
      setIsPaused(true);

      // Save current session minutes to database (so time persists across refreshes)
      const minutesToSave = Math.floor(currentSessionSeconds / 60);
      if (minutesToSave > 0) {
        await recordTimeOnStep(activeStepId, minutesToSave);

        // Update local state with saved time
        setRoadmap((prevRoadmap) =>
          prevRoadmap.map((s) =>
            s.step_id === activeStepId
              ? {
                  ...s,
                  time_spent_minutes:
                    (s.time_spent_minutes || 0) + minutesToSave,
                  time_spent_formatted: formatTime(
                    (s.time_spent_minutes || 0) + minutesToSave
                  ),
                }
              : s
          )
        );

        // Reset pausedElapsedSeconds to only keep the remaining seconds (not yet saved to DB)
        const remainingSeconds = currentSessionSeconds % 60;
        setPausedElapsedSeconds(remainingSeconds);

        console.log(
          `⏸️ Paused and saved ${minutesToSave} minutes. ${remainingSeconds}s remaining.`
        );
      } else {
        console.log(
          `⏸️ Paused tracking at ${totalElapsedSeconds}s (less than 1 minute, not saved yet).`
        );
      }
    } catch (err) {
      console.error("Failed to save time on pause:", err);
      // Still pause even if save fails
      setIsPaused(true);
    }
  }, [activeStepId, sessionStartTime, isPaused, pausedElapsedSeconds]);

  // Stop tracking and save final time (called only when assessment is passed)
  const handleStopTrackingAndSave = useCallback(async () => {
    if (!activeStepId) return;

    try {
      // Calculate total accumulated time (only unsaved portion)
      let totalSeconds = pausedElapsedSeconds;
      if (sessionStartTime && !isPaused) {
        totalSeconds += Math.floor((Date.now() - sessionStartTime) / 1000);
      }

      // Save any remaining time (that wasn't already saved on pause)
      const minutesToSave = Math.floor(totalSeconds / 60);
      if (minutesToSave > 0) {
        await recordTimeOnStep(activeStepId, minutesToSave);
        console.log(
          `💾 Saved remaining ${minutesToSave} minutes for completed step ${activeStepId}`
        );

        // Update local state with final time
        setRoadmap((prevRoadmap) =>
          prevRoadmap.map((s) =>
            s.step_id === activeStepId
              ? {
                  ...s,
                  time_spent_minutes:
                    (s.time_spent_minutes || 0) + minutesToSave,
                  time_spent_formatted: formatTime(
                    (s.time_spent_minutes || 0) + minutesToSave
                  ),
                }
              : s
          )
        );
      }

      // Reset all tracking state
      setActiveStepId(null);
      setSessionStartTime(null);
      setLiveElapsedSeconds(0);
      setPausedElapsedSeconds(0);
      setIsPaused(false);
      console.log(`⏹️ Tracking complete after assessment passed.`);
    } catch (err) {
      console.error("Failed to save final time:", err);
    }
  }, [activeStepId, sessionStartTime, isPaused, pausedElapsedSeconds]);

  // Cancel tracking without saving (for switching steps or closing)
  const handleCancelTracking = useCallback(() => {
    setActiveStepId(null);
    setSessionStartTime(null);
    setLiveElapsedSeconds(0);
    setPausedElapsedSeconds(0);
    setIsPaused(false);
    console.log(`❌ Tracking cancelled (time not saved).`);
  }, []);

  // Suppress unused variable warning - keeping for potential future use
  void handleCancelTracking;

  // Live timer update (every second) - includes paused elapsed time
  useEffect(() => {
    if (liveTimerRef.current) {
      clearInterval(liveTimerRef.current);
    }

    if (activeStepId && sessionStartTime && !isPaused) {
      liveTimerRef.current = setInterval(() => {
        const currentSessionSeconds = Math.floor(
          (Date.now() - sessionStartTime) / 1000
        );
        // Add paused time to current session time for continuous display
        setLiveElapsedSeconds(pausedElapsedSeconds + currentSessionSeconds);
      }, 1000);
    }

    return () => {
      if (liveTimerRef.current) {
        clearInterval(liveTimerRef.current);
      }
    };
  }, [activeStepId, sessionStartTime, isPaused, pausedElapsedSeconds]);

  // Note: No auto-save or beforeunload save - time is only saved when assessment is passed

  const toggleStepCompletion = async (step: RoadmapStep) => {
    try {
      setUpdatingStep(step.step_id);
      const newIsDone = !step.is_done;

      // Check if user is trying to mark as done (not undoing)
      if (newIsDone) {
        // Check if user has passed assessment
        const stepInfo = assessmentProgress?.steps.find(
          (s) => s.step_number === step.step_number
        );

        if (!stepInfo?.assessment_passed) {
          toast.warning(
            "You must pass the assessment before marking this step as done. Click 'Take Assessment' to get started!"
          );
          setUpdatingStep(null);
          return;
        }
      }

      // Update progress via API
      await updateRoadmapStepProgress(step.step_id, newIsDone);

      // Update local state optimistically
      setRoadmap((prevRoadmap) =>
        prevRoadmap.map((s) =>
          s.step_id === step.step_id
            ? {
                ...s,
                is_done: newIsDone,
                completed_at: newIsDone ? new Date().toISOString() : null,
              }
            : s
        )
      );

      // Update roadmap data summary and check for completion
      setRoadmapData((prevData) => {
        if (!prevData) return prevData;
        const completedSteps = prevData.completed_steps + (newIsDone ? 1 : -1);
        const newCompletedSteps = Math.max(0, completedSteps);
        const isCompleted = newCompletedSteps === prevData.total_steps;
        const canSubmitFeedback = isCompleted && !prevData.feedback_submitted;

        // Show feedback modal ONLY if:
        // 1. Roadmap just became complete
        // 2. Feedback hasn't been submitted yet
        // 3. Modal isn't already open
        // 4. User hasn't dismissed it in this session
        if (
          canSubmitFeedback &&
          !prevData.can_submit_feedback &&
          !showFeedbackModal &&
          !feedbackDismissed
        ) {
          setTimeout(() => setShowFeedbackModal(true), 500); // Small delay for better UX
        }

        return {
          ...prevData,
          completed_steps: newCompletedSteps,
          is_completed: isCompleted,
          can_submit_feedback: canSubmitFeedback,
        };
      });

      // Notify Dashboard to update progress
      if (onProgressUpdate) {
        onProgressUpdate();
      }
    } catch (err: any) {
      // Handle 403 error specifically for assessment requirement
      if (err.response?.status === 403) {
        toast.warning(
          err.response.data.message ||
            "You must pass the assessment before marking this step as done"
        );
      } else {
        toast.error((err as Error).message || "Failed to update step progress.");
      }
      console.error("Update Step Progress Error:", err);
    } finally {
      setUpdatingStep(null);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!roadmapData?.roadmap_id) return;

    try {
      setSubmittingFeedback(true);

      await submitRoadmapFeedback({
        rating: feedbackRating,
        feedback_text: feedbackText || undefined,
        roadmap_id: roadmapData.roadmap_id,
        feedback_type: "roadmap",
      });

      // Update roadmap data to reflect feedback submitted
      setRoadmapData((prevData) => {
        if (!prevData) return prevData;
        return {
          ...prevData,
          feedback_submitted: true,
          can_submit_feedback: false,
        };
      });

      // Close modal and reset form
      setShowFeedbackModal(false);
      setFeedbackRating(5);
      setFeedbackText("");

      // Show success message
      toast.success(
        "Thank you for your feedback! Your input helps us improve our roadmap content."
      );
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to submit feedback.");
      console.error("Submit Feedback Error:", err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Assessment Functions
  const loadAssessmentProgress = async () => {
    try {
      const progress = await getRoadmapProgress(savedCareerId);
      setAssessmentProgress(progress);
      console.log("📊 Assessment Progress loaded:", progress);
    } catch (err) {
      console.error("Failed to load assessment progress:", err);
    }
  };

  const handleTakeAssessment = async (stepNumber: number) => {
    // Check if step is locked
    const stepInfo = assessmentProgress?.steps.find(
      (s) => s.step_number === stepNumber
    );
    if (stepInfo?.is_locked) {
      toast.warning(`This step is locked. Complete Step ${stepNumber - 1} first.`);
      return;
    }

    setCurrentStepNumber(stepNumber);
    setLoadingAssessment(true);
    setShowAssessment(true);
    setAssessmentAnswers(new Map());
    setAssessmentResult(null);
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setValidationError(false);

    try {
      const assessment = await getStepAssessment(savedCareerId, stepNumber);
      setCurrentAssessment(assessment);
      setAssessmentStartTime(Date.now());
      console.log("📝 Assessment loaded for Step", stepNumber, assessment);
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.warning(err.response.data.message);
        setShowAssessment(false);
      } else {
        toast.error("Failed to load assessment. Please try again.");
      }
      console.error("Load Assessment Error:", err);
    } finally {
      setLoadingAssessment(false);
    }
  };

  const handleAnswerSelect = (questionId: number, optionIndex: number) => {
    setAssessmentAnswers(
      new Map(assessmentAnswers.set(questionId, optionIndex))
    );
    setValidationError(false);
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setValidationError(false);
    }
  };

  const goToNextQuestion = () => {
    if (!currentAssessment) return;
    
    const currentQuestion = currentAssessment.questions[currentQuestionIndex];
    const hasAnswered = assessmentAnswers.has(currentQuestion.question_id);
    
    if (!hasAnswered) {
      setValidationError(true);
      return;
    }
    
    if (currentQuestionIndex < currentAssessment.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setValidationError(false);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setValidationError(false);
  };

  const handleSubmitAssessment = async () => {
    if (!currentAssessment || !currentStepNumber) return;

    if (assessmentAnswers.size !== currentAssessment.total_questions) {
      toast.warning("Please answer all questions before submitting.");
      return;
    }

    setSubmittingAssessment(true);
    const timeTaken = Math.floor((Date.now() - assessmentStartTime) / 1000);

    const answerArray: AssessmentAnswer[] = Array.from(
      assessmentAnswers.entries()
    ).map(([question_id, selected_option]) => ({
      question_id,
      selected_option,
    }));

    try {
      const result = await submitAssessment(
        savedCareerId,
        currentStepNumber,
        answerArray,
        timeTaken
      );

      setAssessmentResult(result);
      setShowResults(true);
      console.log("✅ Assessment submitted:", result);

      // Auto-stop time tracking and SAVE time only if assessment is passed
      if (result.passed) {
        // Find the step being assessed
        const assessedStep = roadmap.find(
          (s) => s.step_number === currentStepNumber
        );
        if (assessedStep && activeStepId === assessedStep.step_id) {
          console.log(
            "🎉 Assessment passed! Saving time and stopping tracking..."
          );
          await handleStopTrackingAndSave();
        }
      }

      // Reload progress and roadmap data
      await loadAssessmentProgress();
      const response: RoadmapResponse = await fetchRoadmap(savedCareerId);
      setRoadmapData(response);
      setRoadmap(response.roadmap);

      // Notify Dashboard
      if (onProgressUpdate) {
        onProgressUpdate();
      }
    } catch (err) {
      toast.error("Failed to submit assessment. Please try again.");
      console.error("Submit Assessment Error:", err);
    } finally {
      setSubmittingAssessment(false);
    }
  };

  const handleCloseAssessment = () => {
    setShowAssessment(false);
    setCurrentAssessment(null);
    setCurrentStepNumber(null);
    setAssessmentAnswers(new Map());
    setAssessmentResult(null);
    setShowResults(false);
    setTimeRemaining(null);
  };

  const handleRetryAssessment = () => {
    if (currentStepNumber) {
      setShowResults(false);
      setAssessmentResult(null);
      handleTakeAssessment(currentStepNumber);
    }
  };

  const handleContinueAfterAssessment = () => {
    handleCloseAssessment();
    // Scroll to next step or show completion message
  };

  // Timer countdown
  useEffect(() => {
    if (!currentAssessment || !showAssessment || showResults) return;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - assessmentStartTime) / 1000);
      const remaining = currentAssessment.time_limit_minutes * 60 - elapsed;

      if (remaining <= 0) {
        handleSubmitAssessment();
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentAssessment, showAssessment, showResults, assessmentStartTime]);

  useEffect(() => {
    const loadRoadmap = async () => {
      try {
        setLoading(true);
        const response: RoadmapResponse = await fetchRoadmap(savedCareerId);

        console.log("🔍 DEBUG - Roadmap Response:", {
          roadmap_id: response.roadmap_id,
          is_completed: response.is_completed,
          feedback_submitted: response.feedback_submitted,
          can_submit_feedback: response.can_submit_feedback,
          feedbackDismissed_local: feedbackDismissed,
        });

        // Store the complete response data
        setRoadmapData(response);

        // Use the roadmap steps directly from the backend response
        if (response && response.roadmap && Array.isArray(response.roadmap)) {
          setRoadmap(response.roadmap);
        } else {
          setRoadmap([]);
        }

        // Load assessment progress
        await loadAssessmentProgress();

        // Show feedback modal ONLY if:
        // 1. Roadmap is completed (all steps done)
        // 2. Feedback has NOT been submitted yet
        // 3. User can submit feedback
        // 4. User hasn't dismissed it in this session
        const shouldShow =
          response.can_submit_feedback &&
          !response.feedback_submitted &&
          !feedbackDismissed;
        console.log("🔍 Should show modal?", shouldShow);

        if (shouldShow) {
          console.log("✅ Showing feedback modal");
          setTimeout(() => setShowFeedbackModal(true), 1000); // Small delay for better UX
        } else {
          console.log("❌ NOT showing feedback modal because:");
          if (!response.can_submit_feedback)
            console.log("  - can_submit_feedback is false");
          if (response.feedback_submitted)
            console.log("  - feedback_submitted is true");
          if (feedbackDismissed) console.log("  - feedbackDismissed is true");
        }
      } catch (err: unknown) {
        setError((err as Error).message || "Failed to load roadmap.");
        console.error("Fetch Roadmap Error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadRoadmap();
  }, [savedCareerId, feedbackDismissed]); // Added feedbackDismissed to dependencies

  if (loading) {
    return (
      <div className="roadmap-container">
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-icon-wrapper">
              <svg
                className="loading-spinner-icon"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <p className="loading-text">Loading your career roadmap...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="roadmap-container">
        <div className="flex-grow p-8 flex items-center justify-center">
          <div className="max-w-md w-full">
            <Alert variant="destructive">
              <AlertTitle>Error Loading Roadmap</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="back-button-wrapper">
              <button onClick={onBack} className="back-button">
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="roadmap-container">
      <div className="flex-grow p-8">
        <div className="max-w-5xl mx-auto">
          <div className="roadmap-header">
            {/* Modern Header with Icon and Progress Card */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              {/* Left: Icon and Title */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {roadmapData?.career_name || careerName} Learning Path
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700">
                      <Target className="w-4 h-4 mr-1" />
                      {roadmapData?.total_steps || roadmap.length} steps
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Progress Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 min-w-[200px] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Overall Progress</span>
                  <span className="text-lg font-bold text-indigo-600">
                    {roadmapData?.total_steps
                      ? Math.round((roadmapData.completed_steps / roadmapData.total_steps) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${roadmapData?.total_steps
                        ? (roadmapData.completed_steps / roadmapData.total_steps) * 100
                        : 0}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {roadmapData?.completed_steps || 0} of {roadmapData?.total_steps || roadmap.length} completed
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Learning Time Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Learning Time</p>
                  <p className="text-xl font-bold text-gray-900">
                    {roadmapData?.total_time_formatted || formatTime(roadmapData?.total_time_minutes || 0)}
                  </p>
                </div>
              </div>

              {/* Steps In Progress Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Steps In Progress</p>
                  <p className="text-xl font-bold text-gray-900">
                    {roadmapData?.steps_in_progress || 0}
                  </p>
                </div>
              </div>

              {/* Completed Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-xl font-bold text-gray-900">
                    {roadmapData?.completed_steps || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Difficulty Level Legend - Collapsible */}
            <details className="mb-6">
              <summary className="cursor-pointer text-sm text-gray-500 flex items-center gap-2 hover:text-gray-700">
                <Zap className="w-4 h-4" />
                <span>View Difficulty Levels Guide</span>
              </summary>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  Object.entries(DIFFICULTY_INFO) as [
                    DifficultyLevel,
                    DifficultyInfo
                  ][]
                ).map(([level, info]) => (
                  <div key={level} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                    <span
                      className="px-2 py-1 rounded-md text-xs font-medium"
                      style={{
                        backgroundColor: info.bgColor,
                        color: info.color,
                        borderColor: info.borderColor,
                      }}
                    >
                      {info.icon} {info.label}
                    </span>
                    <span className="text-xs text-gray-500">{info.description}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
          <div className="roadmap-timeline">
            {roadmap.length > 0 ? (
              roadmap.map((step, index) => {
                // Get assessment status for this step
                const stepInfo = assessmentProgress?.steps.find(
                  (s) => s.step_number === step.step_number
                );
                const hasPassedAssessment =
                  stepInfo?.assessment_passed || false;
                const canMarkAsDone = hasPassedAssessment || step.is_done;

                return (
                  <div key={step.step_id} className="roadmap-step">
                    <div className="step-layout">
                      <div className="step-number-column">
                        <button
                          onClick={() => toggleStepCompletion(step)}
                          disabled={
                            updatingStep === step.step_id ||
                            (!canMarkAsDone && !step.is_done)
                          }
                          className={`step-checkbox ${
                            step.is_done ? "completed" : ""
                          } ${!canMarkAsDone && !step.is_done ? "locked" : ""}`}
                          title={
                            step.is_done
                              ? "Mark as incomplete"
                              : hasPassedAssessment
                              ? "Mark as complete"
                              : "Pass assessment to unlock"
                          }
                        >
                          {updatingStep === step.step_id ? (
                            <div className="loading-spinner"></div>
                          ) : step.is_done ? (
                            "✓"
                          ) : !canMarkAsDone ? (
                            "🔒"
                          ) : (
                            step.step_number
                          )}
                        </button>
                        {index < roadmap.length - 1 && (
                          <div className="step-connector"></div>
                        )}
                      </div>
                      <div
                        className={`step-card ${
                          step.is_done ? "completed" : ""
                        } bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden`}
                      >
                        {/* Clickable Header Row */}
                        <div
                          className="step-card-header cursor-pointer hover:bg-gray-50 transition-colors p-4"
                          onClick={() => toggleStepExpansion(step.step_id)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {/* Title Row with Status */}
                              <div className="flex items-center gap-3 flex-wrap">
                                <h2 className="text-lg font-semibold text-gray-900">{step.title}</h2>
                                {step.is_done && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Completed
                                  </span>
                                )}
                                {!step.is_done && stepInfo?.is_locked && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                    <Lock className="w-3.5 h-3.5" />
                                    Locked
                                  </span>
                                )}
                                {!step.is_done && !stepInfo?.is_locked && step.started_at && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                    <PlayCircle className="w-3.5 h-3.5" />
                                    In Progress
                                  </span>
                                )}
                              </div>
                              
                              {/* Description Preview */}
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{step.description}</p>
                              
                              {/* Badges Row */}
                              <div className="flex items-center gap-3 mt-3 flex-wrap">
                                {/* Difficulty Badge */}
                                {(() => {
                                  const difficulty = step.difficulty_level || "beginner";
                                  const info = DIFFICULTY_INFO[difficulty];
                                  return (
                                    <span
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
                                      style={{
                                        backgroundColor: info.bgColor,
                                        color: info.color,
                                      }}
                                    >
                                      {info.icon} {info.label}
                                    </span>
                                  );
                                })()}
                                
                                {/* Duration Badge */}
                                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                  <Clock className="w-3.5 h-3.5" />
                                  {step.duration}
                                </span>
                                
                                {/* Time Spent Badge */}
                                {step.started_at && (
                                  <span className={`inline-flex items-center gap-1 text-xs ${
                                    activeStepId === step.step_id ? 'text-emerald-600 font-medium' : 'text-gray-500'
                                  }`}>
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    {activeStepId === step.step_id
                                      ? formatLiveTime((step.time_spent_minutes || 0) * 60 + liveElapsedSeconds)
                                      : step.time_spent_formatted || formatTime(step.time_spent_minutes || 0)}
                                    {activeStepId === step.step_id && !isPaused && (
                                      <span className="ml-1 animate-pulse text-emerald-500">● Live</span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Expand/Collapse Icon */}
                            <button className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors">
                              {expandedSteps.has(step.step_id) ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {/* Expandable Content */}
                        {expandedSteps.has(step.step_id) && (
                          <div className="border-t border-gray-100 p-4 bg-gray-50/50">

                            {/* Time Tracking Controls */}
                            {!step.is_done && !step.started_at && (
                              <div className="mb-4">
                                <button
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                  onClick={() => handleStartStep(step)}
                                >
                                  <PlayCircle className="w-4 h-4" />
                                  Start Learning
                                </button>
                              </div>
                            )}

                            {!step.is_done && step.started_at && activeStepId !== step.step_id && (
                              <div className="mb-4">
                                <button
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                  onClick={() => handleStartStep(step)}
                                >
                                  <PlayCircle className="w-4 h-4" />
                                  Continue Learning
                                </button>
                              </div>
                            )}

                            {activeStepId === step.step_id && !step.is_done && (
                              <div className="mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                    <span className="text-emerald-700 font-medium">Currently Learning</span>
                                    <span className="text-emerald-600 font-mono">
                                      {formatLiveTime(liveElapsedSeconds)}
                                    </span>
                                  </div>
                                  {!isPaused ? (
                                    <button
                                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 transition-colors text-sm"
                                      onClick={handlePauseTracking}
                                    >
                                      ⏸ Pause
                                    </button>
                                  ) : (
                                    <button
                                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition-colors text-sm"
                                      onClick={() => handleStartStep(step)}
                                    >
                                      ▶ Resume
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Assessment Section */}
                            {assessmentProgress && (() => {
                              const stepAssessmentInfo = assessmentProgress.steps.find(
                                (s) => s.step_number === step.step_number
                              );

                              return (
                                <div className="mb-4 p-3 rounded-lg border bg-white">
                                  {stepAssessmentInfo?.is_locked ? (
                                    <div className="flex items-center gap-3 text-gray-500">
                                      <Lock className="w-5 h-5" />
                                      <div>
                                        <p className="font-medium">Step Locked</p>
                                        <p className="text-sm">Complete Step {step.step_number - 1} first</p>
                                      </div>
                                    </div>
                                  ) : stepAssessmentInfo?.is_completed && stepAssessmentInfo?.assessment_passed ? (
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                      <div className="flex items-center gap-3 text-emerald-600">
                                        <CheckCircle className="w-5 h-5" />
                                        <div>
                                          <p className="font-medium">Assessment Passed</p>
                                          <p className="text-sm text-gray-500">
                                            Completed {stepAssessmentInfo.completed_at ? new Date(stepAssessmentInfo.completed_at).toLocaleDateString() : ""}
                                          </p>
                                        </div>
                                      </div>
                                      <button
                                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                        onClick={() => handleTakeAssessment(step.step_number)}
                                      >
                                        Retake
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                      onClick={() => handleTakeAssessment(step.step_number)}
                                    >
                                      <Target className="w-4 h-4" />
                                      Take Assessment
                                    </button>
                                  )}
                                </div>
                              );
                            })()}

                        {/* Week-by-Week Breakdown (New Detailed Structure) */}
                        {step.weeks && step.weeks.length > 0 ? (
                          <>
                            <hr className="resources-divider" />
                            <div className="weeks-section">
                              <h3 className="weeks-title">
                                <svg
                                  className="weeks-icon"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                Weekly Learning Path
                              </h3>
                              <div className="weeks-grid">
                                {step.weeks.map((week, weekIndex) => (
                                  <div key={weekIndex} className="week-card">
                                    <div className="week-header">
                                      <span className="week-number">
                                        {week.week
                                          ? `Week ${week.week}`
                                          : week.weekNumber
                                          ? `Week ${week.weekNumber}`
                                          : "Week"}
                                      </span>
                                      <span className="week-hours">
                                        ⏱️ {week.estimatedHours}
                                      </span>
                                    </div>
                                    <h4 className="week-topic">{week.topic}</h4>

                                    <div className="week-subtopics">
                                      <h5 className="subtopics-label">
                                        What You'll Learn:
                                      </h5>
                                      <ul className="subtopics-list">
                                        {week.subtopics.map(
                                          (subtopic, subIndex) => (
                                            <li
                                              key={subIndex}
                                              className="subtopic-item"
                                            >
                                              <span className="subtopic-bullet">
                                                ✓
                                              </span>
                                              {subtopic}
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </div>

                                    <div className="week-resources">
                                      <h5 className="week-resources-label">
                                        Learning Resources:
                                      </h5>
                                      <div className="week-resources-list">
                                        {week.resources.map(
                                          (resource, resIndex) => {
                                            // Handle both string (old format) and object (new format)
                                            const isString =
                                              typeof resource === "string";
                                            const resourceUrl = isString
                                              ? resource
                                              : resource.url;

                                            // Skip if no URL
                                            if (!resourceUrl) return null;

                                            // Extract meaningful title from URL
                                            const extractTitleFromUrl = (
                                              url: string
                                            ): string => {
                                              try {
                                                const urlObj = new URL(url);
                                                const hostname =
                                                  urlObj.hostname.replace(
                                                    "www.",
                                                    ""
                                                  );
                                                const pathParts =
                                                  urlObj.pathname
                                                    .split("/")
                                                    .filter(Boolean);

                                                // Get platform name from hostname
                                                const platformName =
                                                  hostname.split(".")[0];
                                                const capitalizedPlatform =
                                                  platformName
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                  platformName.slice(1);

                                                // Try to get meaningful path info
                                                if (pathParts.length > 0) {
                                                  const lastPart =
                                                    pathParts[
                                                      pathParts.length - 1
                                                    ];
                                                  // Remove file extensions and clean up
                                                  const cleanPart = lastPart
                                                    .replace(
                                                      /\.(html|htm|php|asp|jsp)$/i,
                                                      ""
                                                    )
                                                    .replace(/[-_]/g, " ")
                                                    .split(" ")
                                                    .map(
                                                      (word) =>
                                                        word
                                                          .charAt(0)
                                                          .toUpperCase() +
                                                        word.slice(1)
                                                    )
                                                    .join(" ");

                                                  if (cleanPart.length > 3) {
                                                    return `${capitalizedPlatform} - ${cleanPart}`;
                                                  }
                                                }

                                                return capitalizedPlatform;
                                              } catch {
                                                return "External Resource";
                                              }
                                            };

                                            const resourceTitle = isString
                                              ? extractTitleFromUrl(resourceUrl)
                                              : resource.title ||
                                                extractTitleFromUrl(
                                                  resourceUrl
                                                );
                                            const resourceType = isString
                                              ? "Link"
                                              : resource.type || "Resource";
                                            const resourcePlatform = isString
                                              ? "Web"
                                              : resource.platform || "Online";
                                            const resourceDuration = isString
                                              ? null
                                              : resource.duration;

                                            return (
                                              <a
                                                key={resIndex}
                                                href={resourceUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="week-resource-link"
                                                title={resourceTitle}
                                              >
                                                <div className="resource-card">
                                                  <span className="resource-type">
                                                    {resourceType}
                                                  </span>
                                                  <div className="resource-title">
                                                    {resourceTitle}
                                                  </div>
                                                  <div className="resource-platform">
                                                    {resourcePlatform}
                                                  </div>
                                                  {resourceDuration && (
                                                    <div className="resource-duration">
                                                      ⏱️ {resourceDuration}
                                                    </div>
                                                  )}
                                                </div>
                                                <svg
                                                  className="resource-icon"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                  />
                                                </svg>
                                              </a>
                                            );
                                          }
                                        )}
                                      </div>
                                    </div>

                                    {/* Practice Exercises */}
                                    {week.practiceExercises &&
                                      week.practiceExercises.length > 0 && (
                                        <div className="week-practice">
                                          <h5 className="practice-label">
                                            Practice Exercises:
                                          </h5>
                                          <ul className="practice-list">
                                            {week.practiceExercises.map(
                                              (exercise, exIndex) => (
                                                <li
                                                  key={exIndex}
                                                  className="practice-item"
                                                >
                                                  <span className="practice-bullet">
                                                    📝
                                                  </span>
                                                  {exercise}
                                                </li>
                                              )
                                            )}
                                          </ul>
                                        </div>
                                      )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Milestone Project */}
                            {step.milestone_project && (
                              <>
                                <hr className="resources-divider" />
                                <div className="milestone-section">
                                  <div className="milestone-header">
                                    <h3 className="milestone-title">
                                      <span className="milestone-icon">🎯</span>
                                      Milestone Project
                                    </h3>
                                    <span className="milestone-time">
                                      ⏱️ {step.milestone_project.estimatedTime}
                                    </span>
                                  </div>
                                  <h4 className="milestone-project-title">
                                    {step.milestone_project.title}
                                  </h4>
                                  <p className="milestone-description">
                                    {step.milestone_project.description}
                                  </p>

                                  <div className="milestone-requirements">
                                    <h5 className="requirements-label">
                                      Project Requirements:
                                    </h5>
                                    <ul className="requirements-list">
                                      {(
                                        step.milestone_project.requirements ||
                                        step.milestone_project.tasks ||
                                        []
                                      ).map((req, reqIndex) => (
                                        <li
                                          key={reqIndex}
                                          className="requirement-item"
                                        >
                                          <span className="requirement-checkbox">
                                            ☐
                                          </span>
                                          {req}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </>
                            )}
                          </>
                        ) : (
                          // Legacy Resources (Backward compatibility)
                          <>
                            <hr className="resources-divider" />
                            <div className="resources-header">
                              <h3 className="resources-title">
                                <svg
                                  className="resources-icon"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                  />
                                </svg>
                                Resources:
                              </h3>
                            </div>
                            <div className="resources-grid">
                              {step.resources.map((resource, resIndex) => (
                                <div key={resIndex} className="resource-item">
                                  <svg
                                    className="resource-link-icon"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                    />
                                  </svg>
                                  {resource.includes("http") ? (
                                    <a
                                      href={resource.split("(")[1].slice(0, -1)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="resource-link"
                                    >
                                      {resource.split("(")[0].trim()}
                                    </a>
                                  ) : (
                                    <span className="resource-text">
                                      {resource}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {/* Mark as Done Button */}
                        <div className="step-actions">
                          <button
                            onClick={() => toggleStepCompletion(step)}
                            disabled={
                              updatingStep === step.step_id ||
                              (!canMarkAsDone && !step.is_done)
                            }
                            className={`mark-done-btn ${
                              step.is_done ? "incomplete-btn" : "complete-btn"
                            } ${
                              !canMarkAsDone && !step.is_done
                                ? "locked-btn"
                                : ""
                            }`}
                            title={
                              step.is_done
                                ? "Mark as incomplete"
                                : hasPassedAssessment
                                ? "Mark as complete after studying"
                                : "Pass assessment first to unlock"
                            }
                          >
                            {updatingStep === step.step_id ? (
                              <div className="btn-loading">
                                <div className="loading-spinner"></div>
                                Updating...
                              </div>
                            ) : step.is_done ? (
                              "Mark as Incomplete"
                            ) : !canMarkAsDone ? (
                              "🔒 Mark as Done (Pass Assessment First)"
                            ) : (
                              "✓ Mark as Done"
                            )}
                          </button>
                          {!step.is_done && !hasPassedAssessment && (
                            <p className="assessment-required-hint">
                              📝 Pass the assessment to unlock manual marking
                            </p>
                          )}
                        </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <div className="empty-icon-wrapper">
                  <svg
                    className="empty-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="empty-text">
                  No roadmap available for this career.
                </p>
              </div>
            )}
          </div>
          <div className="back-button-wrapper">
            <button onClick={onBack} className="back-button">
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Assessment Modal */}
      {showAssessment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl">
            {loadingAssessment ? (
              <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading assessment...</h3>
                <p className="text-sm text-gray-500">
                  First time may take ~5 seconds (AI generation)
                </p>
              </div>
            ) : showResults && assessmentResult ? (
              // Results View - Redesigned
              <div className="max-h-[90vh] w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Results Header - Compact */}
                <div className={`px-6 py-4 text-white relative ${
                  assessmentResult.passed 
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500' 
                    : 'bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500'
                }`}>
                  {/* Close Button */}
                  <button
                    onClick={handleCloseAssessment}
                    className="absolute top-3 right-3 w-7 h-7 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-6">
                    {/* Score Circle - Smaller */}
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-bold">{assessmentResult.score}%</span>
                      <span className="text-[10px] text-white/80">Score</span>
                    </div>
                    
                    <div className="flex-1">
                      <h2 className="text-xl font-bold mb-1">
                        {assessmentResult.passed ? "🎉 Congratulations!" : "📚 Keep Learning!"}
                      </h2>
                      <p className="text-white/80 text-sm">{assessmentResult.message}</p>
                      
                      {/* Stats - Inline */}
                      <div className="flex gap-4 mt-2">
                        <div className="text-sm"><span className="font-bold">{assessmentResult.correct_answers}</span> <span className="text-white/70">Correct</span></div>
                        <div className="text-sm"><span className="font-bold">{assessmentResult.total_questions - assessmentResult.correct_answers}</span> <span className="text-white/70">Incorrect</span></div>
                        <div className="text-sm"><span className="font-bold">{assessmentResult.attempt_number}</span> <span className="text-white/70">Attempt</span></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Detailed Results - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Review Your Answers</h3>
                  <div className="space-y-3">
                    {assessmentResult.detailed_results.map((detail, index) => (
                      <div
                        key={detail.question_id}
                        className={`p-3 rounded-lg border ${
                          detail.is_correct 
                            ? 'border-emerald-200 bg-emerald-50/50' 
                            : 'border-rose-200 bg-rose-50/50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <span className="text-xs font-medium text-gray-500">Question {index + 1}</span>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${
                            detail.is_correct 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-rose-100 text-rose-700'
                          }`}>
                            {detail.is_correct ? (
                              <><CheckCircle className="w-3 h-3" /> Correct</>
                            ) : (
                              <><X className="w-3 h-3" /> Incorrect</>
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 font-medium mb-2">{detail.question}</p>
                        <div className="flex flex-wrap gap-2 text-xs mb-2">
                          <div className={`px-2 py-0.5 rounded ${detail.is_correct ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            <strong>Your Answer:</strong> {String.fromCharCode(65 + detail.your_answer)}
                          </div>
                          {!detail.is_correct && (
                            <div className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                              <strong>Correct:</strong> {String.fromCharCode(65 + detail.correct_answer)}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 bg-gray-100 rounded p-2">
                          <strong className="text-gray-700">Explanation:</strong> {detail.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Actions Footer - Compact */}
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                  {assessmentResult.passed ? (
                    <div className="space-y-2">
                      {assessmentResult.step_completed && (
                        <div className="flex items-center gap-2 p-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs">
                          <CheckCircle className="w-4 h-4" />
                          Step marked as complete! You can now proceed to the next step.
                        </div>
                      )}
                      <button
                        onClick={handleContinueAfterAssessment}
                        className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-semibold text-sm hover:from-emerald-600 hover:to-teal-600 transition-all"
                      >
                        Continue to Next Step
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 bg-amber-50 text-amber-700 rounded-lg text-xs">
                        <AlertCircle className="w-4 h-4" />
                        Review the material and try again. You need {assessmentResult.passing_score}% to pass.
                      </div>
                      <button
                        onClick={handleRetryAssessment}
                        className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold text-sm hover:from-indigo-700 hover:to-purple-700 transition-all"
                      >
                        Retry Assessment
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : currentAssessment ? (
              // Assessment Taking View - Redesigned
              <div className="max-h-[90vh] w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header Section - Compact */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-5 py-4 text-white relative">
                  {/* Close Button */}
                  <button
                    onClick={handleCloseAssessment}
                    className="absolute top-3 right-3 w-7 h-7 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  {/* Badge and Title - Inline */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                      <Target className="w-3 h-3" />
                      Step Assessment
                    </div>
                  </div>
                  
                  <h2 className="text-lg font-bold mb-1 pr-8">{currentAssessment.title}</h2>
                  
                  {/* Info Boxes - Compact Row */}
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
                      <BookOpen className="w-3.5 h-3.5 opacity-70" />
                      <span className="font-semibold">{currentAssessment.total_questions}</span>
                      <span className="text-white/70 text-xs">Questions</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
                      <TrendingUp className="w-3.5 h-3.5 opacity-70" />
                      <span className="font-semibold">{currentAssessment.passing_score}%</span>
                      <span className="text-white/70 text-xs">to pass</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
                      <Clock className="w-3.5 h-3.5 opacity-70" />
                      <span className="font-semibold font-mono">
                        {timeRemaining
                          ? `${Math.floor(timeRemaining / 60)}:${String(timeRemaining % 60).padStart(2, "0")}`
                          : `${currentAssessment.time_limit_minutes}:00`}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Progress Section - Compact */}
                <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600">
                      Question <span className="font-semibold text-gray-900">{currentQuestionIndex + 1}</span> of {currentAssessment.total_questions}
                    </span>
                    <span className="text-xs text-gray-500">
                      {assessmentAnswers.size} / {currentAssessment.total_questions} answered
                    </span>
                  </div>
                  
                  {/* Question Pills - Smaller */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {currentAssessment.questions.map((q, index) => {
                      const isAnswered = assessmentAnswers.has(q.question_id);
                      const isCurrent = index === currentQuestionIndex;
                      return (
                        <button
                          key={q.question_id}
                          onClick={() => goToQuestion(index)}
                          className={`w-6 h-6 rounded-full text-xs font-medium transition-all ${
                            isCurrent
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                              : isAnswered
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Question Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4">
                  {(() => {
                    const question = currentAssessment.questions[currentQuestionIndex];
                    const selectedAnswer = assessmentAnswers.get(question.question_id);
                    
                    return (
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        {/* Question Header - Compact */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {currentQuestionIndex + 1}
                          </div>
                          <div className="flex-1">
                            <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full mb-1.5">
                              Question {currentQuestionIndex + 1}
                            </span>
                            <h3 className="text-base font-semibold text-gray-900 leading-snug">
                              {question.question}
                            </h3>
                          </div>
                        </div>
                        
                        {/* Options - Compact */}
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <label
                              key={optionIndex}
                              className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedAnswer === optionIndex
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question-${question.question_id}`}
                                value={optionIndex}
                                checked={selectedAnswer === optionIndex}
                                onChange={() => handleAnswerSelect(question.question_id, optionIndex)}
                                className="sr-only"
                              />
                              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                                selectedAnswer === optionIndex
                                  ? 'bg-purple-500 text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>
                              <span className={`text-sm ${
                                selectedAnswer === optionIndex ? 'text-purple-900 font-medium' : 'text-gray-700'
                              }`}>
                                {option}
                              </span>
                            </label>
                          ))}
                        </div>
                        
                        {/* Validation Warning */}
                        {validationError && (
                          <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-amber-800">Select an answer</p>
                              <p className="text-xs text-amber-600">Choose the option that best answers the question above.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                
                {/* Footer - Compact */}
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                  <button
                    onClick={goToPreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      currentQuestionIndex === 0
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Progress</div>
                    <div className="text-sm font-bold text-indigo-600">
                      {Math.round((assessmentAnswers.size / currentAssessment.total_questions) * 100)}%
                    </div>
                  </div>
                  
                  {currentQuestionIndex < currentAssessment.questions.length - 1 ? (
                    <button
                      onClick={goToNextQuestion}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm"
                    >
                      Next Question
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitAssessment}
                      disabled={submittingAssessment || assessmentAnswers.size !== currentAssessment.total_questions}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
                        assessmentAnswers.size === currentAssessment.total_questions
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {submittingAssessment ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Submit
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Roadmap Feedback Modal */}
      {showFeedbackModal && (
        <div className="feedback-modal-overlay">
          <div className="feedback-modal">
            <div className="modal-header">
              <div className="modal-icon-wrapper">
                <svg
                  className="modal-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="modal-title">🎉 Congratulations!</h2>
              <p className="modal-description">
                You've completed the{" "}
                <span className="modal-career-name">
                  {roadmapData?.career_name}
                </span>{" "}
                learning roadmap!
              </p>
            </div>

            <div className="modal-body">
              <h3 className="modal-body-title">
                How was your learning experience?
              </h3>

              {/* Star Rating */}
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFeedbackRating(star)}
                    className={`star-button ${
                      star <= feedbackRating ? "active" : ""
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>

              {/* Feedback Text */}
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share your thoughts about this roadmap... (optional)"
                className="feedback-textarea"
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackDismissed(true);
                }}
                className="modal-button skip-btn"
                disabled={submittingFeedback}
              >
                Skip for Now
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={submittingFeedback}
                className="modal-button submit-btn"
              >
                {submittingFeedback ? (
                  <div className="btn-loading">
                    <div className="loading-spinner"></div>
                    Submitting...
                  </div>
                ) : (
                  "Submit Feedback"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapPage;
