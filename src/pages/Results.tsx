import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FloatingChatbot from "../components/FloatingChatbot";
import FeedbackModal from "../components/ui/FeedbackModal";
import { saveCareer } from "../../services/dataService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2Icon } from "lucide-react";
import "./Results.css";

interface CareerSuggestion {
  career: string;
  compatibility: number;
  reason: string;
}

interface CareerRecommendation {
  career_name: string;
  saved_career_id: number;
  score: number;
  reason?: string;
  isPrimary?: boolean;
}

interface Recommendations {
  careers: CareerRecommendation[];
  // Enhanced fields for new format
  career_suggestions?: CareerSuggestion[];
  primary_career?: string;
  primary_score?: number;
}

interface ResultsProps {
  initialRecommendations: Recommendations;
  onRestart: () => void;
  assessmentId?: number | null;
}

const Results = ({
  initialRecommendations,
  onRestart,
  assessmentId,
}: ResultsProps) => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Recommendations>(
    initialRecommendations
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCareers, setSelectedCareers] = useState<string[]>([]);
  const [showAllCareers, setShowAllCareers] = useState(false);
  const [savingCareers, setSavingCareers] = useState<Set<string>>(new Set());

  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(true); // Auto-show after assessment
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  useEffect(() => {
    setRecommendations(initialRecommendations);
  }, [initialRecommendations]);

  const handleSaveCareer = async (careerName: string, score: number) => {
    // Add to saving state
    setSavingCareers((prev) => new Set([...prev, careerName]));

    try {
      setError(null);
      const response = await saveCareer(careerName, score);
      setSelectedCareers([...selectedCareers, careerName]);

      // Enhanced success message with roadmap info
      if (response.roadmapGenerated && response.roadmapSteps) {
        setSuccess(
          `✅ ${careerName} saved! 🗺️ ${response.roadmapSteps} learning steps ready to explore. Your roadmap is ready!`
        );
      } else {
        setSuccess(`✅ ${careerName} saved successfully!`);
      }

      setTimeout(() => setSuccess(null), 5000);
    } catch (err: unknown) {
      const error = err as any;
      let errorMessage = "Failed to save career. Please try again.";

      // Enhanced error handling
      if (
        error.response?.status === 400 &&
        error.response?.data?.message?.includes("already saved")
      ) {
        errorMessage = "This career is already in your collection.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      console.error("Save Career Error:", err);
      setTimeout(() => setError(null), 5000);
    } finally {
      // Remove from saving state
      setSavingCareers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(careerName);
        return newSet;
      });
    }
  };

  // Feedback handling functions
  const handleFeedbackSuccess = () => {
    setFeedbackSuccess(
      "Thank you for your feedback! Your input helps us improve our assessment experience."
    );
    setTimeout(() => setFeedbackSuccess(null), 5000);
  };

  if (!recommendations.careers.length) {
    return (
      <div className="results-container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-red-200 max-w-md">
            <p className="text-red-600 text-center text-lg font-medium">
              No recommendations available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="results-container">
      <div className="max-w-6xl mx-auto">
        {error && (
          <Alert
            variant="destructive"
            className="fixed top-4 right-4 z-50 max-w-sm success-alert"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert
            variant="success"
            className="fixed top-4 right-4 z-50 max-w-sm success-alert"
          >
            <CheckCircle2Icon className="h-4 w-4" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        {feedbackSuccess && (
          <Alert
            variant="success"
            className="fixed top-4 right-4 z-50 max-w-sm success-alert"
          >
            <CheckCircle2Icon className="h-4 w-4" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>{feedbackSuccess}</AlertDescription>
          </Alert>
        )}

        {/* Header Section */}
        <div className="results-header">
          <div className="results-icon-wrapper">
            <svg
              className="results-icon"
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
          <h2 className="results-title">Your Career Assessment Results</h2>
          <p className="results-subtitle">
            Based on your assessment, we've identified career paths that align
            perfectly with your skills, interests, and aspirations.
          </p>
        </div>

        {/* Primary Career */}
        {recommendations.careers.length > 0 && (
          <div className="primary-career-section">
            <h3 className="section-title">🎯 Your Best Match</h3>
            <div className="primary-career-card">
              <div className="career-card-header">
                <h4 className="career-name">
                  {recommendations.careers[0].career_name}
                </h4>
                <div className="match-badge">
                  {recommendations.careers[0].score}% Match
                </div>
              </div>
              {recommendations.careers[0].reason && (
                <p className="career-reason">
                  {recommendations.careers[0].reason}
                </p>
              )}
              <div className="career-actions">
                <button
                  onClick={() =>
                    handleSaveCareer(
                      recommendations.careers[0].career_name,
                      recommendations.careers[0].score
                    )
                  }
                  disabled={
                    selectedCareers.includes(
                      recommendations.careers[0].career_name
                    ) ||
                    savingCareers.has(recommendations.careers[0].career_name)
                  }
                  className="save-career-btn"
                >
                  {savingCareers.has(recommendations.careers[0].career_name) ? (
                    <>
                      <div className="loading-spinner"></div>
                      Saving & Generating Roadmap...
                    </>
                  ) : selectedCareers.includes(
                      recommendations.careers[0].career_name
                    ) ? (
                    "✓ Saved"
                  ) : (
                    "Save This Career"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Additional Careers */}
        {recommendations.careers.length > 1 && (
          <div className="additional-careers-section">
            <div className="section-header">
              <h3 className="section-title">🔍 Other Great Matches</h3>
              {!showAllCareers && (
                <button
                  onClick={() => setShowAllCareers(true)}
                  className="show-all-btn"
                >
                  Show All {recommendations.careers.length - 1} Options
                </button>
              )}
            </div>

            {showAllCareers && (
              <div className="careers-grid">
                {recommendations.careers.slice(1).map((career, index) => (
                  <div key={index + 1} className="career-card">
                    <div className="career-card-header">
                      <h4 className="career-name">{career.career_name}</h4>
                      <div className="match-badge secondary">
                        {career.score}% Match
                      </div>
                    </div>
                    {career.reason && (
                      <p className="career-reason">{career.reason}</p>
                    )}
                    <button
                      onClick={() =>
                        handleSaveCareer(career.career_name, career.score)
                      }
                      disabled={
                        selectedCareers.includes(career.career_name) ||
                        savingCareers.has(career.career_name)
                      }
                      className="save-career-btn secondary"
                    >
                      {savingCareers.has(career.career_name) ? (
                        <>
                          <div className="loading-spinner"></div>
                          Saving...
                        </>
                      ) : selectedCareers.includes(career.career_name) ? (
                        "✓ Saved"
                      ) : (
                        "Save This Career"
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="main-actions">
          <button
            onClick={() => navigate("/dashboard")}
            className="primary-action-btn"
          >
            View My Saved Careers ({selectedCareers.length})
          </button>
          <button onClick={onRestart} className="secondary-action-btn">
            Retake Assessment
          </button>
        </div>

        {/* Learning Resources */}
        <div className="learning-resources">
          <div className="resources-header">
            <div className="resources-icon-wrapper">
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
            </div>
            <h3 className="resources-title">Where to Learn?</h3>
          </div>
          <p className="resources-description">
            Kickstart your career journey with these FREE learning platforms
            designed to help you master new skills:
          </p>
          <div className="resources-grid">
            <div className="resource-card">
              <div className="resource-card-header">
                <div className="resource-icon-badge">💻</div>
                <h4 className="resource-name">freeCodeCamp</h4>
                <span className="resource-tag">FREE</span>
              </div>
              <p className="resource-description">
                Master web development, data science, and more with interactive
                coding challenges and certifications.
              </p>
            </div>

            <div className="resource-card">
              <div className="resource-card-header">
                <div className="resource-icon-badge">🎓</div>
                <h4 className="resource-name">Codecademy</h4>
                <span className="resource-tag">FREE</span>
              </div>
              <p className="resource-description">
                Learn programming languages through hands-on interactive lessons
                in Python, JavaScript, SQL, and more.
              </p>
            </div>

            <div className="resource-card">
              <div className="resource-card-header">
                <div className="resource-icon-badge">📚</div>
                <h4 className="resource-name">Coursera</h4>
                <span className="resource-tag">FREE</span>
              </div>
              <p className="resource-description">
                Access university-level courses from top institutions. Audit
                courses for free or pay for certificates.
              </p>
            </div>

            <div className="resource-card">
              <div className="resource-card-header">
                <div className="resource-icon-badge">🚀</div>
                <h4 className="resource-name">The Odin Project</h4>
                <span className="resource-tag">FREE</span>
              </div>
              <p className="resource-description">
                Complete full-stack web development curriculum with real
                projects and supportive community.
              </p>
            </div>

            <div className="resource-card">
              <div className="resource-card-header">
                <div className="resource-icon-badge">🌟</div>
                <h4 className="resource-name">Khan Academy</h4>
                <span className="resource-tag">FREE</span>
              </div>
              <p className="resource-description">
                Build foundational skills in math, computer science, and more
                with personalized learning paths.
              </p>
            </div>

            <div className="resource-card">
              <div className="resource-card-header">
                <div className="resource-icon-badge">📖</div>
                <h4 className="resource-name">MDN Web Docs</h4>
                <span className="resource-tag">FREE</span>
              </div>
              <p className="resource-description">
                Comprehensive documentation and tutorials for web technologies
                from Mozilla Developer Network.
              </p>
            </div>

            <div className="resource-card">
              <div className="resource-card-header">
                <div className="resource-icon-badge">☁️</div>
                <h4 className="resource-name">AWS Skill Builder</h4>
                <span className="resource-tag">FREE</span>
              </div>
              <p className="resource-description">
                Learn cloud computing with Amazon Web Services through free
                training courses and hands-on labs.
              </p>
            </div>

            <div className="resource-card">
              <div className="resource-card-header">
                <div className="resource-icon-badge">🐍</div>
                <h4 className="resource-name">Python.org</h4>
                <span className="resource-tag">FREE</span>
              </div>
              <p className="resource-description">
                Official Python documentation with beginner guides, tutorials,
                and comprehensive references.
              </p>
            </div>

            <div className="resource-card">
              <div className="resource-card-header">
                <div className="resource-icon-badge">🎯</div>
                <h4 className="resource-name">Google Digital Garage</h4>
                <span className="resource-tag">FREE</span>
              </div>
              <p className="resource-description">
                Free courses on digital marketing, data analytics, career
                development, and more from Google.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Chatbot */}
      <FloatingChatbot position="bottom-right" />

      {/* Feedback Success Alert */}
      {feedbackSuccess && (
        <div className="fixed top-4 right-4 z-50">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2Icon className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">
              Feedback Submitted!
            </AlertTitle>
            <AlertDescription className="text-green-700">
              {feedbackSuccess}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        assessmentId={assessmentId}
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSuccess={handleFeedbackSuccess}
      />
    </div>
  );
};

export default Results;
