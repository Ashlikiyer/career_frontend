import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import FloatingChatbot from "../components/FloatingChatbot";
import { saveCareer } from "../../services/dataService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2Icon } from "lucide-react";
import "../components/CareerResults.css";

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
}

const Results = ({ initialRecommendations, onRestart }: ResultsProps) => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Recommendations>(
    initialRecommendations
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCareers, setSelectedCareers] = useState<string[]>([]);
  const [showAllCareers, setShowAllCareers] = useState(false);
  const [savingCareers, setSavingCareers] = useState<Set<string>>(new Set());

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

  if (!recommendations.careers.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
        <Navbar />
        <div className="flex-grow p-8 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-red-200">
            <p className="text-red-600 text-center">
              No recommendations available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <style>
        {`
          @keyframes slideInFromRight {
            0% {
              transform: translateX(100%);
              opacity: 0;
            }
            100% {
              transform: translateX(0);
              opacity: 1;
            }
          }
          .animate-slide-in {
            animation: slideInFromRight 0.3s ease-out forwards;
          }
        `}
      </style>
      <Navbar />
      <div className="pt-8 p-6 max-w-4xl mx-auto">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert
            variant="success"
            className="fixed top-4 right-4 z-50 max-w-sm animate-slide-in"
          >
            <CheckCircle2Icon className="h-4 w-4" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Header Section */}
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Your Career Assessment Results
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Based on your assessment, we've identified career paths that align
            perfectly with your skills, interests, and aspirations.
          </p>
        </div>

        {/* Primary Career */}
        {recommendations.careers.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-6 text-center text-gray-700">
              🎯 Your Best Match
            </h3>
            <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-green-200 hover:border-green-300 transition-all duration-300 hover:shadow-xl">
              <div className="flex justify-between items-start mb-6">
                <h4 className="text-2xl font-bold text-gray-800">
                  {recommendations.careers[0].career_name}
                </h4>
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
                  {recommendations.careers[0].score}% Match
                </div>
              </div>
              {recommendations.careers[0].reason && (
                <p className="text-gray-600 italic mb-6 text-lg leading-relaxed">
                  {recommendations.careers[0].reason}
                </p>
              )}
              <div className="flex gap-3">
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
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg flex items-center"
                >
                  {savingCareers.has(recommendations.careers[0].career_name) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
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
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-700">
                🔍 Other Great Matches
              </h3>
              {!showAllCareers && (
                <button
                  onClick={() => setShowAllCareers(true)}
                  className="text-blue-600 hover:text-blue-700 underline font-medium"
                >
                  Show All {recommendations.careers.length - 1} Options
                </button>
              )}
            </div>

            {showAllCareers && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendations.careers.slice(1).map((career, index) => (
                  <div
                    key={index + 1}
                    className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-semibold text-gray-800">
                        {career.career_name}
                      </h4>
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                        {career.score}% Match
                      </div>
                    </div>
                    {career.reason && (
                      <p className="text-gray-600 text-sm italic mb-4 leading-relaxed">
                        {career.reason}
                      </p>
                    )}
                    <button
                      onClick={() =>
                        handleSaveCareer(career.career_name, career.score)
                      }
                      disabled={
                        selectedCareers.includes(career.career_name) ||
                        savingCareers.has(career.career_name)
                      }
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm shadow-md hover:shadow-lg flex items-center justify-center"
                    >
                      {savingCareers.has(career.career_name) ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div>
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
        <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center">
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            View My Saved Careers ({selectedCareers.length})
          </button>
          <button
            onClick={onRestart}
            className="bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-800 font-bold py-3 px-8 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Retake Assessment
          </button>
        </div>

        {/* Learning Resources */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center mr-3">
              <svg
                className="w-5 h-5 text-white"
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
            <h3 className="text-2xl font-bold text-gray-800">
              Where to Learn?
            </h3>
          </div>
          <p className="text-gray-600 mb-6 text-lg">
            Enhance your skills with these recommended platforms:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Coursera</h4>
              <p className="text-blue-600 text-sm">
                Courses in programming, data science, and design.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Codecademy</h4>
              <p className="text-green-600 text-sm">
                Interactive coding lessons for all levels.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2">
                AWS Skill Builder
              </h4>
              <p className="text-purple-600 text-sm">
                Cloud computing and technical training.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Chatbot */}
      <FloatingChatbot position="bottom-right" />
    </div>
  );
};

export default Results;
