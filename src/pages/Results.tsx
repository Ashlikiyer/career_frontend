import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
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

  useEffect(() => {
    setRecommendations(initialRecommendations);
  }, [initialRecommendations]);

  const handleSaveCareer = async (careerName: string, score: number) => {
    try {
      setError(null);
      await saveCareer(careerName, score);
      setSelectedCareers([...selectedCareers, careerName]);
      setSuccess(`Career "${careerName}" saved successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMessage =
        (err as Error).message || "Failed to save career. Please try again.";
      setError(errorMessage);
      console.error("Save Career Error:", err);
      setTimeout(() => setError(null), 5000);
    }
  };





  if (!recommendations.careers.length) {
    return (
      <div className="min-h-screen bg-[#111827] text-gray-200 flex flex-col">
        <Navbar />
        <div className="flex-grow p-8 flex items-center justify-center">
          <p className="text-red-500">No recommendations available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827] text-gray-200">
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
      <div className="pt-4 p-6 max-w-3xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-gray-800 text-red-400 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <Alert className="fixed top-4 right-4 z-50 max-w-sm bg-white border border-gray-300 text-black shadow-lg rounded-lg animate-slide-in">
            <CheckCircle2Icon className="h-4 w-4" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4">Your Career Assessment Results</h2>
          <p className="text-lg text-gray-400">
            Based on your assessment, here’s the career path that matches your
            skills and interests.
          </p>
        </div>

        {/* Primary Career */}
        {recommendations.careers.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-center">🎯 Your Best Match</h3>
            <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg p-6 border-2 border-green-500/50 hover:border-green-400 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-2xl font-bold text-green-400">
                  {recommendations.careers[0].career_name}
                </h4>
                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {recommendations.careers[0].score}% Match
                </div>
              </div>
              {recommendations.careers[0].reason && (
                <p className="text-gray-300 italic mb-4">
                  {recommendations.careers[0].reason}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => handleSaveCareer(recommendations.careers[0].career_name, recommendations.careers[0].score)}
                  disabled={selectedCareers.includes(recommendations.careers[0].career_name)}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {selectedCareers.includes(recommendations.careers[0].career_name) 
                    ? "✓ Saved" 
                    : "Save This Career"
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Additional Careers */}
        {recommendations.careers.length > 1 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">🔍 Other Great Matches</h3>
              {!showAllCareers && (
                <button
                  onClick={() => setShowAllCareers(true)}
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Show All {recommendations.careers.length - 1} Options
                </button>
              )}
            </div>

            {showAllCareers && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.careers.slice(1).map((career, index) => (
                  <div
                    key={index + 1}
                    className="bg-[#1F2937] rounded-lg p-5 border border-gray-700 hover:border-blue-400 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-lg font-semibold">
                        {career.career_name}
                      </h4>
                      <div className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                        {career.score}% Match
                      </div>
                    </div>
                    {career.reason && (
                      <p className="text-gray-400 text-sm italic mb-4">
                        {career.reason}
                      </p>
                    )}
                    <button
                      onClick={() => handleSaveCareer(career.career_name, career.score)}
                      disabled={selectedCareers.includes(career.career_name)}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-2 rounded font-medium transition-colors text-sm"
                    >
                      {selectedCareers.includes(career.career_name) 
                        ? "✓ Saved" 
                        : "Save This Career"
                      }
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex space-x-4 mb-4 justify-center">
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-[#4C4C86] hover:bg-[#5D5DA3] text-white font-bold py-2 px-6 rounded-lg transition duration-300"
          >
            View My Saved Careers ({selectedCareers.length})
          </button>
          <button
            onClick={onRestart}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
          >
            Retake Assessment
          </button>
        </div>

        <div className="bg-[#1F2937] rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4">Where to Learn?</h3>
          <p className="text-gray-400 mb-4">
            Enhance your skills with these recommended platforms:
          </p>
          <ul className="space-y-2">
            <li className="text-base">
              • <span className="font-medium">Coursera</span> - Courses in
              programming, data science, and design.
            </li>
            <li className="text-base">
              • <span className="font-medium">Codecademy</span> - Interactive
              coding lessons for all levels.
            </li>
            <li className="text-base">
              • <span className="font-medium">AWS Skill Builder</span> - Cloud
              computing and technical training.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Results;
