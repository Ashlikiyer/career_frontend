import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { saveCareer } from "../../services/dataService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2Icon } from "lucide-react";

interface CareerRecommendation {
  career_name: string;
  saved_career_id: number;
  score: number;
}

interface Recommendations {
  careers: CareerRecommendation[];
}

interface ResultsProps {
  initialRecommendations: Recommendations;
  assessmentId: string;
  onRestart: () => void;
}

const Results = ({ initialRecommendations, onRestart }: ResultsProps) => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Recommendations>(initialRecommendations);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setRecommendations(initialRecommendations);
  }, [initialRecommendations]);

  const handleSave = async () => {
    if (!recommendations.careers[0]) return;

    try {
      setError(null);
      setSuccess(null);
      const careerName = recommendations.careers[0].career_name;
      const response = await saveCareer(careerName);
      console.log("Save Career Response:", response);
      setSuccess(`Career "${careerName}" saved successfully!`);
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = (err as Error).message || "Failed to save career. Please try again.";
      setError(errorMessage);
      console.error("Save Career Error:", err);
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
          <h2 className="text-3xl font-bold mb-4">Your Career Path</h2>
          <p className="text-lg text-gray-400">
            Based on your assessment, here’s the career path that matches your skills and interests.
          </p>
        </div>

        <div className="space-y-6 mb-4">
          {recommendations.careers.map((career, index) => (
            <div
              key={index}
              className="bg-[#1F2937] rounded-lg p-6 border border-gray-700 hover:border-blue-400 transition-colors"
            >
              <h3 className="text-xl font-semibold mb-2">{career.career_name}</h3>
              <p className="text-gray-400">
                {career.career_name === "Software Engineer" &&
                  "Build applications and systems with cutting-edge technologies."}
                {career.career_name === "Data Scientist" &&
                  "Analyze data and develop models for data-driven decisions."}
                {career.career_name === "Graphic Designer" &&
                  "Create visually stunning graphics and layouts."}
                {career.career_name === "Software Tester/Quality Assurance" &&
                  "Ensure software quality through rigorous testing."}
              </p>
              <p className="text-sm text-gray-500 mt-2">Confidence Score: {career.score}%</p>
            </div>
          ))}
        </div>

        <div className="flex space-x-4 mb-4 justify-center">
          <button
            onClick={handleSave}
            className="bg-[#4C4C86] hover:bg-[#5D5DA3] text-white font-bold py-2 px-6 rounded-lg transition duration-300"
          >
            Save Career Path
          </button>
          <button
            onClick={onRestart}
            className="bg-[#4C4C86] hover:bg-[#5D5DA3] text-white font-bold py-2 px-6 rounded-lg transition duration-300"
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
              • <span className="font-medium">Coursera</span> - Courses in programming, data science, and design.
            </li>
            <li className="text-base">
              • <span className="font-medium">Codecademy</span> - Interactive coding lessons for all levels.
            </li>
            <li className="text-base">
              • <span className="font-medium">AWS Skill Builder</span> - Cloud computing and technical training.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Results;