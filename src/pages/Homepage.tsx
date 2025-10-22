import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Cookies } from "react-cookie";
import Navbar from "../components/Navbar";
import FloatingChatbot from "../components/FloatingChatbot";
import { getFeedbackAnalytics } from "../../services/dataService";

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
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
            🎓 Free Career Assessment
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Discover Your
            <span className="text-blue-600"> Future </span>
            in Tech
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
            Take our AI-powered career assessment to find your perfect tech
            career path. Get personalized recommendations based on your skills,
            interests, and goals.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleStartAssessment}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
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
            <div className="flex items-center text-gray-500 text-sm">
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Takes only 5 minutes
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get started with your career discovery in just three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100 hover:shadow-lg transition-all duration-300 text-center group">
              <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 text-xl font-bold group-hover:scale-110 transition-transform duration-300">
                1
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                Take Assessment
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Answer 10 thoughtful questions about your interests, skills, and
                career preferences to help us understand your unique profile.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border border-green-100 hover:shadow-lg transition-all duration-300 text-center group">
              <div className="bg-green-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 text-xl font-bold group-hover:scale-110 transition-transform duration-300">
                2
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                Get AI Recommendations
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Our advanced AI analyzes your responses and provides 5
                personalized career recommendations from 16+ tech
                specializations.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-8 rounded-2xl border border-purple-100 hover:shadow-lg transition-all duration-300 text-center group">
              <div className="bg-purple-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 text-xl font-bold group-hover:scale-110 transition-transform duration-300">
                3
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                Build Your Path
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Save your favorite careers and generate detailed 10-step
                learning roadmaps with curated resources and timelines.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our System?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to guide you to your perfect tech
              career
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 text-center border border-gray-100">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-blue-600"
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
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                AI-Powered Matching
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Advanced machine learning algorithms analyze your responses to
                provide highly accurate career recommendations.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 text-center border border-gray-100">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-green-600"
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
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                16+ Career Paths
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Explore diverse tech specializations from Web Development to
                Machine Learning, each with detailed insights.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 text-center border border-gray-100">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-purple-600"
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
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                Structured Roadmaps
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Get step-by-step learning paths with curated resources,
                timelines, and milestones for your chosen career.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Feedback Showcase */}
      <div className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
              ⭐ Student Feedback
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Students Are Saying
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real feedback from students who have used our career assessment
              system
            </p>
          </div>

          {isLoadingAnalytics ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading student feedback...</p>
            </div>
          ) : analytics ? (
            <div className="max-w-4xl mx-auto">
              {/* Summary Stats */}
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {analytics.summary.totalFeedback}
                  </div>
                  <p className="text-gray-600">Student Reviews</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-4xl font-bold text-green-600 mr-2">
                      {analytics.summary.averageRating}
                    </span>
                    {renderStars(
                      Math.round(parseFloat(analytics.summary.averageRating))
                    )}
                  </div>
                  <p className="text-gray-600">Average Rating</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    {analytics.summary.timeRange}
                  </div>
                  <p className="text-gray-600">Period</p>
                </div>
              </div>

              {/* Rating Distribution Chart */}
              {analytics.ratingDistribution && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-center text-gray-800 mb-6">
                    Rating Distribution
                  </h3>
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count =
                        analytics.ratingDistribution[rating.toString()] || 0;
                      const percentage =
                        analytics.summary.totalFeedback > 0
                          ? (count / analytics.summary.totalFeedback) * 100
                          : 0;

                      return (
                        <div key={rating} className="flex items-center gap-3">
                          <div className="flex items-center gap-2 min-w-[60px]">
                            {renderStars(rating)}
                            <span className="text-sm font-medium text-gray-600">
                              {rating}
                            </span>
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 min-w-[30px] text-right">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Feedback */}
              {analytics.recentFeedback &&
                analytics.recentFeedback.length > 0 && (
                  <div>
                    <h3 className="text-2xl font-bold text-center text-gray-800 mb-8">
                      Recent Student Experiences
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      {analytics.recentFeedback
                        .slice(0, 4)
                        .map((feedback: any) => (
                          <div
                            key={feedback.id}
                            className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
                          >
                            <div className="flex items-center mb-4">
                              <div className="flex items-center">
                                {renderStars(feedback.rating)}
                                <span className="ml-2 font-semibold text-gray-800">
                                  {feedback.rating}/5
                                </span>
                              </div>
                              <div className="ml-auto text-sm text-gray-500">
                                {new Date(
                                  feedback.created_at
                                ).toLocaleDateString()}
                              </div>
                            </div>
                            {feedback.feedback_text && (
                              <p className="text-gray-700 italic mb-3">
                                "{feedback.feedback_text}"
                              </p>
                            )}
                            <div className="text-sm text-gray-500">
                              - Student Assessment Feedback
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {/* Call to Action */}
              <div className="text-center mt-12">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 border border-green-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Join Our Community of Satisfied Students
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Take your career assessment and share your experience to
                    help future students
                  </p>
                  <button
                    onClick={handleStartAssessment}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    Start Your Assessment Journey
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-lg font-medium text-gray-600">
                  Be the first to share your feedback!
                </p>
                <p className="text-gray-500">
                  Take an assessment and help future students by sharing your
                  experience.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Discover Your Tech Career?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students who have found their perfect tech career
            path
          </p>
          <button
            onClick={handleStartAssessment}
            className="bg-white text-blue-600 hover:bg-gray-50 font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            Start Your Journey Today
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-400">
            © 2025 Career Path Recommendation System | Gordon College
          </p>
        </div>
      </footer>

      {/* Floating Chatbot */}
      <FloatingChatbot position="bottom-right" />
    </div>
  );
};

export default Homepage;
