import React, { useEffect, useState } from "react";
import {
  fetchRoadmap,
  updateRoadmapStepProgress,
  submitRoadmapFeedback,
} from "../../services/dataService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2Icon } from "lucide-react";
import "./Roadmap.css";

interface RoadmapStep {
  step_id: number;
  roadmap_id: number;
  step_number: number;
  title: string;
  description: string;
  duration: string;
  resources: string[];
  is_done: boolean;
  completed_at: string | null;
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
}

interface RoadmapPageProps {
  savedCareerId: number;
  careerName: string;
  onBack: () => void;
}

const RoadmapPage: React.FC<RoadmapPageProps> = ({
  savedCareerId,
  careerName,
  onBack,
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

  const toggleStepCompletion = async (step: RoadmapStep) => {
    try {
      setUpdatingStep(step.step_id);
      const newIsDone = !step.is_done;

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
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to update step progress.");
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
          </div>
          <div className="roadmap-timeline">
            {roadmap.length > 0 ? (
              roadmap.map((step, index) => (
                <div key={step.step_id} className="roadmap-step">
                  <div className="step-layout">
                    <div className="step-number-column">
                      <button
                        onClick={() => toggleStepCompletion(step)}
                        disabled={updatingStep === step.step_id}
                        className={`step-checkbox ${
                          step.is_done ? "completed" : ""
                        }`}
                        title={
                          step.is_done
                            ? "Mark as incomplete"
                            : "Mark as complete"
                        }
                      >
                        {updatingStep === step.step_id ? (
                          <div className="loading-spinner"></div>
                        ) : step.is_done ? (
                          "✓"
                        ) : (
                          step.step_number
                        )}
                      </button>
                      {index < roadmap.length - 1 && (
                        <div className="step-connector"></div>
                      )}
                    </div>
                    <div
                      className={`step-card ${step.is_done ? "completed" : ""}`}
                    >
                      <div className="step-card-header">
                        <h2 className="step-title">{step.title}</h2>
                        {step.is_done && (
                          <span className="completed-badge">✓ Completed</span>
                        )}
                      </div>
                      <p className="step-description">{step.description}</p>
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
                        <button
                          onClick={() => toggleStepCompletion(step)}
                          disabled={updatingStep === step.step_id}
                          className={`mark-done-btn ${
                            step.is_done ? "incomplete-btn" : "complete-btn"
                          }`}
                        >
                          {updatingStep === step.step_id ? (
                            <div className="btn-loading">
                              <div className="loading-spinner"></div>
                              Updating...
                            </div>
                          ) : step.is_done ? (
                            "Mark as Incomplete"
                          ) : (
                            "Mark as Done"
                          )}
                        </button>
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
                              <span className="resource-text">{resource}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
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
