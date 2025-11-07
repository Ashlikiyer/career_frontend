import React, { useEffect, useState } from "react";
import {
  fetchRoadmap,
  updateRoadmapStepProgress,
  submitRoadmapFeedback,
} from "../../services/dataService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
      alert(
        "Thank you for your feedback! Your input helps us improve our roadmap content."
      );
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
        <div className="flex-grow p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full mb-4">
              <svg
                className="animate-spin w-6 h-6 text-white"
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
            <p className="text-gray-600 text-lg">
              Loading your career roadmap...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
        <div className="flex-grow p-8 flex items-center justify-center">
          <div className="max-w-md w-full">
            <Alert variant="destructive">
              <AlertTitle>Error Loading Roadmap</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="text-center mt-6">
              <button
                onClick={onBack}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
      <div className="flex-grow p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full mb-6">
              <svg
                className="w-8 h-8 text-white"
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
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              {roadmapData?.career_name || careerName} Learning Path
            </h1>
            <div className="flex justify-center items-center gap-4 mb-4">
              <div className="text-lg text-gray-600">
                {roadmapData?.total_steps || roadmap.length} learning steps
              </div>
            </div>
            <p className="text-lg text-gray-600 mb-6">
              Track your progress as you master each skill
            </p>

            {/* Progress Bar */}
            <div className="max-w-md mx-auto mb-8">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Progress</span>
                <span>
                  {roadmapData?.completed_steps || 0} of{" "}
                  {roadmapData?.total_steps || roadmap.length} completed
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 ease-out"
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
              <div className="text-center mt-2 text-sm text-gray-600">
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
          <div className="relative">
            {roadmap.length > 0 ? (
              roadmap.map((step, index) => (
                <div key={step.step_id} className="mb-10">
                  <div className="flex items-start">
                    <div className="w-1/12 text-center flex-shrink-0">
                      <button
                        onClick={() => toggleStepCompletion(step)}
                        disabled={updatingStep === step.step_id}
                        className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center font-bold shadow-lg transition-all duration-300 ${
                          step.is_done
                            ? "bg-gradient-to-br from-green-500 to-green-600 text-white"
                            : "bg-gradient-to-br from-blue-500 to-green-500 text-white hover:from-blue-600 hover:to-green-600"
                        }`}
                        title={
                          step.is_done
                            ? "Mark as incomplete"
                            : "Mark as complete"
                        }
                      >
                        {updatingStep === step.step_id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : step.is_done ? (
                          "✓"
                        ) : (
                          step.step_number
                        )}
                      </button>
                      {index < roadmap.length - 1 && (
                        <div className="w-1 h-20 bg-gradient-to-b from-blue-300 to-green-300 mx-auto mt-4 rounded-full"></div>
                      )}
                    </div>
                    <div className="w-11/12 pl-8">
                      <div
                        className={`rounded-xl shadow-lg p-6 border transition-all duration-300 ${
                          step.is_done
                            ? "bg-green-50 border-green-200 hover:shadow-xl"
                            : "bg-white border-gray-200 hover:shadow-xl"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h2
                            className={`text-2xl font-bold ${
                              step.is_done ? "text-green-800" : "text-gray-800"
                            }`}
                          >
                            {step.title}
                          </h2>
                          {step.is_done && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Completed
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-4 leading-relaxed">
                          {step.description}
                        </p>
                        <div className="flex items-center mb-4">
                          <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
                            <svg
                              className="w-4 h-4 text-blue-600 mr-2"
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
                            <span className="text-sm font-medium text-blue-800">
                              Duration: {step.duration}
                            </span>
                          </div>
                        </div>
                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                              <svg
                                className="w-5 h-5 text-green-600 mr-2"
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
                              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 shadow-md hover:shadow-lg ${
                                step.is_done
                                  ? "bg-red-100 text-red-700 hover:bg-red-200 border border-red-200"
                                  : "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"
                              }`}
                            >
                              {updatingStep === step.step_id ? (
                                <div className="flex items-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                                  Updating...
                                </div>
                              ) : step.is_done ? (
                                "Mark as Incomplete"
                              ) : (
                                "Mark as Done"
                              )}
                            </button>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {step.resources.map((resource, resIndex) => (
                              <div
                                key={resIndex}
                                className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-100"
                              >
                                <svg
                                  className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0"
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
                                    className="text-blue-600 hover:text-blue-800 font-medium underline decoration-2 underline-offset-2"
                                  >
                                    {resource.split("(")[0].trim()}
                                  </a>
                                ) : (
                                  <span className="text-gray-700">
                                    {resource}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
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
                <p className="text-gray-500 text-lg">
                  No roadmap available for this career.
                </p>
              </div>
            )}
          </div>
          <div className="text-center mt-12">
            <button
              onClick={onBack}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Roadmap Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-white"
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                🎉 Congratulations!
              </h2>
              <p className="text-gray-600">
                You've completed the{" "}
                <span className="font-semibold text-blue-600">
                  {roadmapData?.career_name}
                </span>{" "}
                learning roadmap!
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                How was your learning experience?
              </h3>

              {/* Star Rating */}
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFeedbackRating(star)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl transition-all duration-200 ${
                      star <= feedbackRating
                        ? "text-yellow-400 bg-yellow-50"
                        : "text-gray-300 hover:text-yellow-400"
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
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackDismissed(true); // Mark as dismissed for this session
                }}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={submittingFeedback}
              >
                Skip for Now
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={submittingFeedback}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {submittingFeedback ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
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
