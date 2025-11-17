import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Cookies } from "react-cookie";
import FloatingChatbot from "../components/FloatingChatbot";
import { getFeedbackAnalytics } from "../../services/dataService";
import "./Homepage.css";

const Homepage = () => {
  const navigate = useNavigate();
  const cookies = new Cookies();

  // Analytics state
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoadingAnalytics(true);
      const response = await getFeedbackAnalytics("30d");
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error("Error loading analytics for homepage:", error);
      // Don't show errors on homepage - just silently fail
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, []); // No dependencies needed for this function

  useEffect(() => {
    const authToken = cookies.get("authToken");
    if (!authToken) {
      navigate("/login");
    } else if (!analytics && !isLoadingAnalytics) {
      // Load analytics for homepage showcase only once and only if not already loaded
      loadAnalytics();
    }
  }, [navigate, loadAnalytics, analytics, isLoadingAnalytics]); // Prevent loading if already have data

  const handleStartAssessment = () => {
    navigate("/assessment");
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="homepage-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-background">
          <div className="hero-shape hero-shape-1"></div>
          <div className="hero-shape hero-shape-2"></div>
          <div className="hero-shape hero-shape-3"></div>
        </div>

        <div className="container mx-auto px-6 py-20 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <div className="badge-animated mb-6">
              <span className="badge-icon">🎓</span>
              <span className="badge-text">100% Free Career Assessment</span>
            </div>

            <h1 className="hero-title">
              AI-Powered{" "}
              <span className="hero-title-highlight">Career Guidance</span> for
              CCS Students
            </h1>

            <p className="hero-subtitle">
              A specialized career assessment system for Gordon College CCS
              students. Using GroqAI technology, we analyze your responses to
              recommend IT career paths and generate personalized learning
              roadmaps.
              <strong> Start your tech career journey today.</strong>
            </p>

            <div className="hero-cta-container">
              <button
                onClick={handleStartAssessment}
                className="cta-button cta-button-primary"
              >
                <span>Start Free Assessment</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>

              <div className="hero-features">
                <div className="hero-feature-item">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Takes only 5 minutes</span>
                </div>
                <div className="hero-feature-item">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>No credit card required</span>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="trust-indicators">
              <div className="trust-item">
                <div className="trust-number">IT</div>
                <div className="trust-label">Focused Careers</div>
              </div>
              <div className="trust-item">
                <div className="trust-number">CCS</div>
                <div className="trust-label">Gordon College</div>
              </div>
              <div className="trust-item">
                <div className="trust-number">GroqAI</div>
                <div className="trust-label">Powered</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="section-how-it-works">
        <div className="container mx-auto px-6">
          <div className="section-header">
            <div className="section-badge">
              <span className="badge-dot"></span>
              <span>Simple Process</span>
            </div>
            <h2 className="section-title">
              Your Journey in{" "}
              <span className="text-gradient">3 Easy Steps</span>
            </h2>
            <p className="section-subtitle">
              Get started with your career discovery journey today
            </p>
          </div>

          <div className="steps-container">
            {/* Step 1 */}
            <div className="step-card step-card-blue">
              <div className="step-number-badge">
                <span className="step-number">1</span>
              </div>
              <div className="step-icon">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <h3 className="step-title">Take Assessment</h3>
              <p className="step-description">
                Complete a comprehensive quiz-style assessment similar to NCAE
                career evaluation. You must reach at least 90% completion before
                receiving career recommendations.
              </p>
              <div className="step-feature-list">
                <div className="step-feature">✓ 90% completion required</div>
                <div className="step-feature">✓ 5-10 minutes to complete</div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="step-card step-card-green">
              <div className="step-number-badge">
                <span className="step-number">2</span>
              </div>
              <div className="step-icon">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="step-title">Get AI Recommendations</h3>
              <p className="step-description">
                GroqAI analyzes your assessment responses to recommend IT
                careers such as Software Developer, Cybersecurity Analyst, UI/UX
                Designer, Data Analyst, and more.
              </p>
              <div className="step-feature-list">
                <div className="step-feature">✓ GroqAI-powered analysis</div>
                <div className="step-feature">✓ IT-focused careers only</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="step-card step-card-purple">
              <div className="step-number-badge">
                <span className="step-number">3</span>
              </div>
              <div className="step-icon">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
              <h3 className="step-title">Build Your Path</h3>
              <p className="step-description">
                Save your chosen career and get an AI-generated roadmap
                outlining skills, tools, and learning steps. Track your progress
                with Done/Not Done markers and provide feedback.
              </p>
              <div className="step-feature-list">
                <div className="step-feature">✓ Auto-generated roadmaps</div>
                <div className="step-feature">✓ Progress tracking included</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="section-features">
        <div className="container mx-auto px-6">
          <div className="section-header">
            <div className="section-badge">
              <span className="badge-dot"></span>
              <span>Platform Features</span>
            </div>
            <h2 className="section-title">
              Everything You Need to{" "}
              <span className="text-gradient">Succeed</span>
            </h2>
            <p className="section-subtitle">
              Powerful features designed to guide you to your perfect tech
              career
            </p>
          </div>

          <div className="features-grid">
            {/* Feature 1 */}
            <div className="feature-card">
              <div className="feature-icon feature-icon-blue">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="feature-title">GroqAI Analysis</h3>
              <p className="feature-description">
                GroqAI API analyzes your assessment responses to provide IT
                career recommendations based on your skills, interests, and
                tendencies. No traditional ML model training involved.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="feature-card">
              <div className="feature-icon feature-icon-green">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="feature-title">IT Career Specializations</h3>
              <p className="feature-description">
                Explore IT career paths including Software Developer,
                Cybersecurity Analyst, UI/UX Designer, Data Analyst, and other
                computing disciplines with detailed insights.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="feature-card">
              <div className="feature-icon feature-icon-purple">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
              <h3 className="feature-title">AI-Generated Roadmaps</h3>
              <p className="feature-description">
                Automatically generated learning roadmaps showing recommended
                skills, tools, and steps needed to prepare for your chosen IT
                career.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="feature-card">
              <div className="feature-icon feature-icon-orange">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="feature-title">Instant Results</h3>
              <p className="feature-description">
                Get your personalized career recommendations immediately after
                completing the assessment. No waiting required.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="feature-card">
              <div className="feature-icon feature-icon-teal">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="feature-title">100% Free & Guidance-Only</h3>
              <p className="feature-description">
                Access all features completely free. Remember: AI suggestions
                serve as guidance to help you explore careers—final decisions
                depend on your personal goals and experiences.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Feedback Showcase */}
      <div className="section-testimonials">
        <div className="container mx-auto px-6">
          <div className="section-header">
            <div className="section-badge">
              <span className="badge-dot"></span>
              <span>Student Success Stories</span>
            </div>
            <h2 className="section-title">
              Loved by <span className="text-gradient">Students Worldwide</span>
            </h2>
            <p className="section-subtitle">
              Real feedback from students who found their dream career path
            </p>
          </div>

          {isLoadingAnalytics ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading student testimonials...</p>
            </div>
          ) : analytics ? (
            <div className="testimonials-content">
              {/* Stats Overview */}
              <div className="stats-grid">
                <div className="stat-card stat-card-blue">
                  <div className="stat-icon">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div className="stat-number">
                    {analytics.summary.totalFeedback}
                  </div>
                  <div className="stat-label">Happy Students</div>
                </div>

                <div className="stat-card stat-card-green">
                  <div className="stat-icon">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </div>
                  <div className="stat-number">
                    {analytics.summary.averageRating}
                  </div>
                  <div className="stat-label">Average Rating</div>
                </div>

                <div className="stat-card stat-card-purple">
                  <div className="stat-icon">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="stat-number">
                    {analytics.summary.assessmentFeedback || 0}
                  </div>
                  <div className="stat-label">Assessments Completed</div>
                </div>

                <div className="stat-card stat-card-orange">
                  <div className="stat-icon">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div className="stat-number">
                    {analytics.summary.roadmapFeedback || 0}
                  </div>
                  <div className="stat-label">Roadmaps Generated</div>
                </div>
              </div>

              {/* Testimonial Cards */}
              {analytics.recentFeedback &&
                analytics.recentFeedback.length > 0 && (
                  <div className="testimonials-grid">
                    {analytics.recentFeedback
                      .slice(0, 6)
                      .map((feedback: any, index: number) => (
                        <div
                          key={feedback.id}
                          className="testimonial-card"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="testimonial-header">
                            <div className="testimonial-avatar">
                              <div className="avatar-placeholder">
                                {feedback.user_name
                                  ? feedback.user_name.charAt(0).toUpperCase()
                                  : "U"}
                              </div>
                            </div>
                            <div className="testimonial-user-info">
                              <div className="testimonial-name">
                                {feedback.user_name || "Anonymous Student"}
                              </div>
                              <div className="testimonial-role">
                                {feedback.feedback_type === "roadmap"
                                  ? feedback.reference_name ||
                                    "Career Path Student"
                                  : "Assessment Taker"}
                              </div>
                            </div>
                          </div>

                          <div className="testimonial-rating">
                            {renderStars(feedback.rating)}
                          </div>

                          {feedback.feedback_text && (
                            <p className="testimonial-text">
                              "{feedback.feedback_text}"
                            </p>
                          )}

                          <div className="testimonial-footer">
                            <div className="testimonial-badge">
                              {feedback.feedback_type === "roadmap" ? (
                                <>
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                                    />
                                  </svg>
                                  <span>Roadmap</span>
                                </>
                              ) : (
                                <>
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <span>Assessment</span>
                                </>
                              )}
                            </div>
                            <div className="testimonial-date">
                              {new Date(feedback.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

              {/* CTA in Testimonials */}
              <div className="testimonial-cta">
                <div className="testimonial-cta-content">
                  <h3 className="testimonial-cta-title">
                    Ready to Write Your Success Story?
                  </h3>
                  <p className="testimonial-cta-text">
                    Join thousands of satisfied students who discovered their
                    perfect career path
                  </p>
                  <button
                    onClick={handleStartAssessment}
                    className="cta-button cta-button-primary"
                  >
                    <span>Start Your Free Assessment</span>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-testimonials">
              <div className="empty-icon">
                <svg
                  className="w-20 h-20"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="empty-title">Be the First to Share!</h3>
              <p className="empty-text">
                Start your career assessment journey and help future students by
                sharing your experience
              </p>
              <button
                onClick={handleStartAssessment}
                className="cta-button cta-button-secondary"
              >
                Take Assessment Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="container mx-auto px-6 py-12">
          <div className="footer-content">
            <div className="footer-section">
              <h3 className="footer-title">
                AI-Powered Career Guidance System
              </h3>
              <p className="footer-text">
                AI-Powered Career Guidance and Roadmap Generation System for CCS
                Students at Gordon College. Powered by GroqAI.
              </p>
            </div>

            <div className="footer-section">
              <h4 className="footer-heading">Resources</h4>
              <ul className="footer-links">
                <li>
                  <a href="/assessment">Take Assessment</a>
                </li>
                <li>
                  <a href="/dashboard">Dashboard</a>
                </li>
                <li>
                  <a href="/roadmap">Career Roadmaps</a>
                </li>
              </ul>
            </div>

            <div className="footer-section">
              <h4 className="footer-heading">About</h4>
              <ul className="footer-links">
                <li>Gordon College</li>
                <li>Career Development</li>
                <li>© 2025 All Rights Reserved</li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copyright">
              © 2025 Career Path Recommendation System | Made with ❤️ for
              students
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Chatbot */}
      <FloatingChatbot position="bottom-right" />
    </div>
  );
};

export default Homepage;
