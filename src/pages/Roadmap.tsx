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
import { CheckCircle2Icon } from "lucide-react";
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
  const [roadmap, setRoadmap] = useState<RoadmapStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roadmapData, setRoadmapData] = useState<RoadmapResponse | null>(null);
  const [updatingStep, setUpdatingStep] = useState<number | null>(null);

  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackDismissed, setFeedbackDismissed] = useState(false); // Track if user dismissed the modal
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

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

  // Time tracking state
  const [activeStepId, setActiveStepId] = useState<number | null>(null); // Currently active step being tracked
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null); // When current session started
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState<number>(0); // Live counter for display
  const [pausedElapsedSeconds, setPausedElapsedSeconds] = useState<number>(0); // Preserved time when paused
  const [isPaused, setIsPaused] = useState(false); // Pause state
  const timeTrackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
          setError(
            "You must pass the assessment before marking this step as done. Click 'Take Assessment' to get started!"
          );
          setUpdatingStep(null);

          // Clear error after 5 seconds
          setTimeout(() => setError(null), 5000);
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
        setError(
          err.response.data.message ||
            "You must pass the assessment before marking this step as done"
        );
      } else {
        setError((err as Error).message || "Failed to update step progress.");
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
      setFeedbackSuccess(
        "Thank you for your feedback! Your input helps us improve our roadmap content."
      );
      setTimeout(() => setFeedbackSuccess(null), 4000);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to submit feedback.");
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
      alert(`This step is locked. Complete Step ${stepNumber - 1} first.`);
      return;
    }

    setCurrentStepNumber(stepNumber);
    setLoadingAssessment(true);
    setShowAssessment(true);
    setAssessmentAnswers(new Map());
    setAssessmentResult(null);
    setShowResults(false);

    try {
      const assessment = await getStepAssessment(savedCareerId, stepNumber);
      setCurrentAssessment(assessment);
      setAssessmentStartTime(Date.now());
      console.log("📝 Assessment loaded for Step", stepNumber, assessment);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError(err.response.data.message);
        setShowAssessment(false);
      } else {
        setError("Failed to load assessment. Please try again.");
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
  };

  const handleSubmitAssessment = async () => {
    if (!currentAssessment || !currentStepNumber) return;

    if (assessmentAnswers.size !== currentAssessment.total_questions) {
      alert("Please answer all questions before submitting.");
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
      setError("Failed to submit assessment. Please try again.");
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
          {error && (
            <Alert variant="destructive" className="error-alert">
              <AlertTitle>Notice</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {feedbackSuccess && (
            <Alert variant="success" className="success-alert">
              <CheckCircle2Icon className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>{feedbackSuccess}</AlertDescription>
            </Alert>
          )}

          <div className="roadmap-header">
            <div className="roadmap-icon-wrapper">
              <svg
                className="roadmap-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <h1 className="roadmap-title">
              {roadmapData?.career_name || careerName} Learning Path
            </h1>
            <div className="roadmap-stats">
              <div className="stat-badge">
                📚 {roadmapData?.total_steps || roadmap.length} learning steps
              </div>
            </div>
            <p className="roadmap-subtitle">
              Track your progress as you master each skill
            </p>

            {/* Progress Bar */}
            <div className="progress-container">
              <div className="progress-header">
                <span>Progress</span>
                <span>
                  {roadmapData?.completed_steps || 0} of{" "}
                  {roadmapData?.total_steps || roadmap.length} completed
                </span>
              </div>
              <div className="progress-bar-wrapper">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${
                      roadmapData?.total_steps
                        ? (roadmapData.completed_steps /
                            roadmapData.total_steps) *
                          100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
              <div className="progress-percentage">
                {roadmapData?.total_steps
                  ? Math.round(
                      (roadmapData.completed_steps / roadmapData.total_steps) *
                        100
                    )
                  : 0}
                % complete
              </div>
            </div>

            {/* Time Tracking Summary */}
            {roadmapData?.total_time_minutes !== undefined &&
              roadmapData.total_time_minutes > 0 && (
                <div className="time-tracking-summary">
                  <div className="time-summary-header">
                    <svg
                      className="time-summary-icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Learning Time</span>
                  </div>
                  <div className="time-summary-stats">
                    <div className="time-stat">
                      <span className="time-stat-value">
                        {roadmapData.total_time_formatted ||
                          formatTime(roadmapData.total_time_minutes)}
                      </span>
                      <span className="time-stat-label">
                        Total Time Invested
                      </span>
                    </div>
                    <div className="time-stat">
                      <span className="time-stat-value">
                        {roadmapData.steps_in_progress || 0}
                      </span>
                      <span className="time-stat-label">Steps In Progress</span>
                    </div>
                    {activeStepId && (
                      <div className="time-stat active">
                        <span className="time-stat-value">
                          <span className="pulse-dot"></span> Active
                        </span>
                        <span className="time-stat-label">
                          Currently Tracking
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Difficulty Level Legend */}
            <div className="difficulty-legend">
              <h3 className="difficulty-legend-title">
                <svg
                  className="legend-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Difficulty Levels
              </h3>
              <div className="difficulty-legend-items">
                {(
                  Object.entries(DIFFICULTY_INFO) as [
                    DifficultyLevel,
                    DifficultyInfo
                  ][]
                ).map(([level, info]) => (
                  <div key={level} className="difficulty-legend-item">
                    <div
                      className={`difficulty-legend-badge difficulty-${level}`}
                      style={{
                        backgroundColor: info.bgColor,
                        color: info.color,
                        borderColor: info.borderColor,
                      }}
                    >
                      <span className="difficulty-icon">{info.icon}</span>
                      <span className="difficulty-label">{info.label}</span>
                    </div>
                    <div className="difficulty-legend-info">
                      <span className="difficulty-legend-desc">
                        {info.description}
                      </span>
                      <span className="difficulty-legend-effort">
                        {info.expectedEffort}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                        }`}
                      >
                        <div className="step-card-header">
                          <div className="step-title-row">
                            <h2 className="step-title">{step.title}</h2>
                            {step.is_done && (
                              <span className="completed-badge">
                                ✓ Completed
                              </span>
                            )}
                          </div>

                          {/* Difficulty Badge */}
                          {(() => {
                            const difficulty =
                              step.difficulty_level || "beginner";
                            const info = DIFFICULTY_INFO[difficulty];
                            return (
                              <div
                                className={`difficulty-badge difficulty-${difficulty}`}
                                style={{
                                  backgroundColor: info.bgColor,
                                  color: info.color,
                                  borderColor: info.borderColor,
                                }}
                                title={`${info.description}\n${info.expectedEffort}\nPrerequisites: ${info.prerequisites}`}
                              >
                                <span className="difficulty-icon">
                                  {info.icon}
                                </span>
                                <span className="difficulty-label">
                                  {info.label}
                                </span>
                                <span className="difficulty-tag">
                                  {info.badge}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                        <p className="step-description">{step.description}</p>

                        {/* Step Info Badges */}
                        <div className="step-info-badges">
                          <div className="duration-badge">
                            <svg
                              className="duration-icon"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="duration-text">
                              Duration: {step.duration}
                            </span>
                          </div>

                          {/* Prerequisites hint based on difficulty */}
                          {step.difficulty_level &&
                            step.difficulty_level !== "beginner" && (
                              <div className="prerequisites-badge">
                                <svg
                                  className="prerequisites-icon"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                  />
                                </svg>
                                <span className="prerequisites-text">
                                  {step.difficulty_level === "intermediate"
                                    ? "Prerequisites: Complete Beginner steps"
                                    : "Prerequisites: Complete Intermediate steps"}
                                </span>
                              </div>
                            )}

                          {/* Time Tracking Badge */}
                          {step.started_at && (
                            <div
                              className={`time-tracking-badge ${
                                activeStepId === step.step_id && !isPaused
                                  ? "active"
                                  : ""
                              } ${
                                activeStepId === step.step_id && isPaused
                                  ? "paused"
                                  : ""
                              }`}
                            >
                              <svg
                                className="time-tracking-icon"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="time-tracking-text">
                                Time spent:{" "}
                                {activeStepId === step.step_id
                                  ? formatLiveTime(
                                      (step.time_spent_minutes || 0) * 60 +
                                        liveElapsedSeconds
                                    )
                                  : step.time_spent_formatted ||
                                    formatTime(step.time_spent_minutes || 0)}
                              </span>
                              {activeStepId === step.step_id && !isPaused && (
                                <span className="tracking-active-indicator">
                                  ● Live
                                </span>
                              )}
                              {activeStepId === step.step_id && isPaused && (
                                <span className="tracking-paused-indicator">
                                  ⏸ Paused
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Start Learning Button - Shows when step not started */}
                        {!step.is_done && !step.started_at && (
                          <button
                            className="btn-start-learning"
                            onClick={() => handleStartStep(step)}
                          >
                            <svg
                              className="start-icon"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Start Learning
                          </button>
                        )}

                        {/* Continue Learning Button - Shows when step started but not done */}
                        {!step.is_done &&
                          step.started_at &&
                          activeStepId !== step.step_id && (
                            <button
                              className="btn-continue-learning"
                              onClick={() => handleStartStep(step)}
                            >
                              <svg
                                className="continue-icon"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Continue Learning
                            </button>
                          )}

                        {/* Currently Learning Indicator with Live Timer */}
                        {activeStepId === step.step_id && !step.is_done && (
                          <div className="time-tracking-controls">
                            <div className="currently-learning-indicator">
                              <span className="pulse-dot"></span>
                              <span>Currently Learning</span>
                              <span className="live-timer">
                                {formatLiveTime(liveElapsedSeconds)}
                              </span>
                            </div>
                            <div className="tracking-buttons">
                              {!isPaused ? (
                                <button
                                  className="btn-pause-tracking"
                                  onClick={handlePauseTracking}
                                  title="Pause tracking"
                                >
                                  <svg
                                    className="pause-icon"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  Pause
                                </button>
                              ) : (
                                <button
                                  className="btn-resume-tracking"
                                  onClick={() => handleStartStep(step)}
                                  title="Resume tracking"
                                >
                                  <svg
                                    className="resume-icon"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  Resume
                                </button>
                              )}
                            </div>
                            <div className="tracking-info-hint">
                              <svg
                                className="hint-icon"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span>
                                Time is saved on pause and when you pass the
                                assessment
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Assessment Button */}
                        {assessmentProgress &&
                          (() => {
                            const stepInfo = assessmentProgress.steps.find(
                              (s) => s.step_number === step.step_number
                            );

                            return (
                              <div className="assessment-section">
                                {stepInfo?.is_locked ? (
                                  <div className="assessment-locked">
                                    <div className="locked-icon">🔒</div>
                                    <div className="locked-text">
                                      <strong>Step Locked</strong>
                                      <p>
                                        Complete Step {step.step_number - 1}{" "}
                                        first
                                      </p>
                                    </div>
                                  </div>
                                ) : stepInfo?.is_completed &&
                                  stepInfo?.assessment_passed ? (
                                  <div className="assessment-completed">
                                    <div className="completed-icon">✅</div>
                                    <div className="completed-text">
                                      <strong>Assessment Passed</strong>
                                      <p>
                                        Completed on{" "}
                                        {stepInfo.completed_at
                                          ? new Date(
                                              stepInfo.completed_at
                                            ).toLocaleDateString()
                                          : "N/A"}
                                      </p>
                                    </div>
                                    <button
                                      className="btn-retake-assessment"
                                      onClick={() =>
                                        handleTakeAssessment(step.step_number)
                                      }
                                    >
                                      Retake
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    className="btn-take-assessment"
                                    onClick={() =>
                                      handleTakeAssessment(step.step_number)
                                    }
                                  >
                                    <svg
                                      className="assessment-icon"
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
                                              } catch (e) {
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
        <div className="modal-overlay">
          <div className="assessment-modal">
            {loadingAssessment ? (
              <div className="assessment-loading">
                <div className="loading-spinner-large"></div>
                <p>Loading assessment...</p>
                <p className="loading-note">
                  First time may take ~5 seconds (AI generation)
                </p>
              </div>
            ) : showResults && assessmentResult ? (
              // Results View
              <div className="assessment-results">
                <div
                  className={`results-header ${
                    assessmentResult.passed ? "passed" : "failed"
                  }`}
                >
                  <button
                    onClick={handleCloseAssessment}
                    className="close-results-btn"
                  >
                    ×
                  </button>
                  <div className="score-circle">
                    <span className="score-value">
                      {assessmentResult.score}%
                    </span>
                    <span className="score-label">Your Score</span>
                  </div>
                  <h2>
                    {assessmentResult.passed
                      ? "🎉 Congratulations!"
                      : "📚 Keep Learning!"}
                  </h2>
                  <p className="message">{assessmentResult.message}</p>
                  <div className="score-breakdown">
                    <div className="stat">
                      <span className="stat-value">
                        {assessmentResult.correct_answers}
                      </span>
                      <span className="stat-label">Correct</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">
                        {assessmentResult.total_questions -
                          assessmentResult.correct_answers}
                      </span>
                      <span className="stat-label">Incorrect</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">
                        {assessmentResult.attempt_number}
                      </span>
                      <span className="stat-label">Attempt</span>
                    </div>
                  </div>
                </div>

                <div className="detailed-results">
                  <h3>Review Your Answers</h3>
                  {assessmentResult.detailed_results.map((detail, index) => (
                    <div
                      key={detail.question_id}
                      className={`result-card ${
                        detail.is_correct ? "correct" : "incorrect"
                      }`}
                    >
                      <div className="result-header">
                        <span className="question-number">
                          Question {index + 1}
                        </span>
                        <span
                          className={`result-badge ${
                            detail.is_correct ? "correct" : "incorrect"
                          }`}
                        >
                          {detail.is_correct ? "✓ Correct" : "✗ Incorrect"}
                        </span>
                      </div>
                      <p className="question-text">{detail.question}</p>
                      <div className="answer-comparison">
                        <div className="your-answer">
                          <strong>Your Answer:</strong>{" "}
                          <span
                            className={
                              detail.is_correct ? "correct" : "incorrect"
                            }
                          >
                            {String.fromCharCode(65 + detail.your_answer)}
                          </span>
                        </div>
                        {!detail.is_correct && (
                          <div className="correct-answer">
                            <strong>Correct Answer:</strong>{" "}
                            <span className="correct">
                              {String.fromCharCode(65 + detail.correct_answer)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="explanation">
                        <strong>Explanation:</strong>
                        <p>{detail.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="results-actions">
                  {assessmentResult.passed ? (
                    <>
                      {assessmentResult.step_completed && (
                        <div className="completion-notice">
                          ✅ Step marked as complete! You can now proceed to the
                          next step.
                        </div>
                      )}
                      <button
                        onClick={handleContinueAfterAssessment}
                        className="btn-primary"
                      >
                        Continue to Next Step
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="retry-notice">
                        Review the material and try again. You need{" "}
                        {assessmentResult.passing_score}% to pass.
                      </div>
                      <button
                        onClick={handleRetryAssessment}
                        className="btn-primary"
                      >
                        Retry Assessment
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : currentAssessment ? (
              // Assessment Taking View
              <div className="assessment-taker">
                <div className="assessment-header">
                  <button
                    onClick={handleCloseAssessment}
                    className="close-assessment-btn"
                  >
                    ×
                  </button>
                  <h2>{currentAssessment.title}</h2>
                  <p>{currentAssessment.description}</p>
                  <div className="assessment-info">
                    <span>Questions: {currentAssessment.total_questions}</span>
                    <span>
                      Passing Score: {currentAssessment.passing_score}%
                    </span>
                    <span>
                      Time Remaining:{" "}
                      {timeRemaining
                        ? Math.floor(timeRemaining / 60)
                        : currentAssessment.time_limit_minutes}
                      :
                      {timeRemaining
                        ? String(timeRemaining % 60).padStart(2, "0")
                        : "00"}
                    </span>
                  </div>
                  {currentAssessment.attempt_count > 0 && (
                    <div className="previous-attempts">
                      <p>
                        Previous Attempts: {currentAssessment.attempt_count}
                      </p>
                      {currentAssessment.best_score && (
                        <p>Best Score: {currentAssessment.best_score}%</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="questions-container">
                  {currentAssessment.questions.map((question, index) => (
                    <div key={question.question_id} className="question-card">
                      <div className="question-header">
                        <span className="question-number">
                          Question {index + 1}
                        </span>
                        <span
                          className={`answer-status ${
                            assessmentAnswers.has(question.question_id)
                              ? "answered"
                              : "unanswered"
                          }`}
                        >
                          {assessmentAnswers.has(question.question_id)
                            ? "✓"
                            : "○"}
                        </span>
                      </div>
                      <h3 className="question-text">{question.question}</h3>
                      <div className="options">
                        {question.options.map((option, optionIndex) => (
                          <label
                            key={optionIndex}
                            className={`option ${
                              assessmentAnswers.get(question.question_id) ===
                              optionIndex
                                ? "selected"
                                : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${question.question_id}`}
                              value={optionIndex}
                              checked={
                                assessmentAnswers.get(question.question_id) ===
                                optionIndex
                              }
                              onChange={() =>
                                handleAnswerSelect(
                                  question.question_id,
                                  optionIndex
                                )
                              }
                            />
                            <span className="option-letter">
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>
                            <span className="option-text">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="assessment-footer">
                  <div className="progress-indicator">
                    {assessmentAnswers.size} /{" "}
                    {currentAssessment.total_questions} answered
                  </div>
                  <div className="actions">
                    <button
                      onClick={handleCloseAssessment}
                      disabled={submittingAssessment}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitAssessment}
                      disabled={
                        submittingAssessment ||
                        assessmentAnswers.size !==
                          currentAssessment.total_questions
                      }
                      className="btn-primary"
                    >
                      {submittingAssessment
                        ? "Submitting..."
                        : "Submit Assessment"}
                    </button>
                  </div>
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
