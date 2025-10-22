import React, { useState } from "react";
import { submitUserFeedback } from "../../../services/dataService";

interface FeedbackModalProps {
  assessmentId?: number | null;
  onClose: () => void;
  onSuccess?: () => void;
  isOpen: boolean;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  assessmentId,
  onClose,
  onSuccess,
  isOpen,
}) => {
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const submitFeedback = async () => {
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitUserFeedback({
        rating,
        feedback_text: feedbackText.trim() || undefined,
        assessment_id: assessmentId || undefined,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Feedback submission error:", error);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(0);
      setFeedbackText("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-xl max-w-md w-11/12 shadow-2xl">
        <div className="text-center">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Rate Your Assessment Experience
            </h3>
            <p className="text-gray-600">
              Your feedback helps us improve our career assessment tools
            </p>
          </div>

          {/* Star Rating Component */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`text-4xl transition-all duration-200 hover:scale-110 ${
                  star <= (hoveredStar || rating)
                    ? "text-yellow-400"
                    : "text-gray-300"
                }`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                disabled={isSubmitting}
              >
                ⭐
              </button>
            ))}
          </div>

          {/* Rating Labels */}
          {rating > 0 && (
            <div className="mb-4">
              <span className="text-lg font-medium text-gray-700">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </span>
            </div>
          )}

          {/* Optional Feedback Text */}
          <div className="mb-6">
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Tell us about your experience (optional)"
              maxLength={500}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {feedbackText.length}/500
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip
            </button>
            <button
              onClick={submitFeedback}
              disabled={isSubmitting || rating === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Submitting...
                </>
              ) : (
                "Submit Feedback"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
