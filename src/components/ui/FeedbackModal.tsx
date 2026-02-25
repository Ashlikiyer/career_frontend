import React, { useState } from "react";
import { submitUserFeedback } from "../../../services/dataService";
import { useToast } from "./Toast";
import "./FeedbackModal.css";

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
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitFeedback = async () => {
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
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(5);
      setFeedbackText("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
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
          <h2 className="modal-title">Assessment Complete!</h2>
          <p className="modal-description">Rate Your Assessment Experience</p>
          <p className="modal-subdescription">
            Your feedback helps us improve our career assessment tools
          </p>
        </div>

        <div className="modal-body">
          <h3 className="modal-body-title">
            How was your assessment experience?
          </h3>

          {/* Star Rating */}
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`star-button ${star <= rating ? "active" : ""}`}
                disabled={isSubmitting}
              >
                ★
              </button>
            ))}
          </div>

          {/* Feedback Text */}
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Tell us about your experience (optional)"
            maxLength={500}
            className="feedback-textarea"
            rows={3}
            disabled={isSubmitting}
          />
          <div className="character-count">{feedbackText.length}/500</div>
        </div>

        <div className="modal-actions">
          <button
            onClick={handleClose}
            className="modal-button skip-btn"
            disabled={isSubmitting}
          >
            Skip for Now
          </button>
          <button
            onClick={submitFeedback}
            disabled={isSubmitting}
            className="modal-button submit-btn"
          >
            {isSubmitting ? (
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
  );
};

export default FeedbackModal;
