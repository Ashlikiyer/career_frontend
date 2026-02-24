import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FloatingChatbot from "../components/FloatingChatbot";
import FeedbackModal from "../components/ui/FeedbackModal";
import { saveCareer } from "../../services/dataService";
import { useToast } from "@/components/ui/Toast";
import { BookOpen, Play, Code, Users, CheckCircle2 } from "lucide-react";

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

// Career images mapping
const careerImages: { [key: string]: string } = {
  "UX/UI Designer": "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=600&h=400&fit=crop",
  "Frontend Developer": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop",
  "Backend Developer": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop",
  "Full Stack Developer": "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=600&h=400&fit=crop",
  "Data Scientist": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
  "Product Manager": "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=400&fit=crop",
  "Game Developer": "https://images.unsplash.com/photo-1556438064-2d7646166914?w=600&h=400&fit=crop",
  "Mobile Developer": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=400&fit=crop",
  "DevOps Engineer": "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=600&h=400&fit=crop",
  "QA Engineer": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop",
  "default": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop"
};

// Get skills based on career
const getCareerSkills = (careerName: string): string[] => {
  const skillsMap: { [key: string]: string[] } = {
    "UX/UI Designer": ["Wireframing", "Prototyping", "Figma Mastery", "User Research"],
    "Frontend Developer": ["React/Vue", "TypeScript", "CSS/Tailwind", "Responsive Design"],
    "Backend Developer": ["Node.js/Python", "Databases", "API Design", "Server Management"],
    "Full Stack Developer": ["Frontend", "Backend", "DevOps", "System Design"],
    "Data Scientist": ["Python", "Machine Learning", "Statistics", "Data Visualization"],
    "Product Manager": ["Strategy", "User Stories", "Analytics", "Communication"],
    "Game Developer": ["Unity/Unreal", "C#/C++", "3D Math", "Game Design"],
    "Mobile Developer": ["React Native", "Swift/Kotlin", "UI/UX", "App Store"],
    "DevOps Engineer": ["CI/CD", "Docker/K8s", "Cloud", "Monitoring"],
    "QA Engineer": ["Testing", "Automation", "Performance", "Documentation"]
  };
  return skillsMap[careerName] || ["Problem Solving", "Communication", "Learning", "Teamwork"];
};

// Get career icon color
const getCareerIconColor = (index: number): string => {
  const colors = ["text-blue-500", "text-red-500", "text-cyan-500", "text-purple-500", "text-green-500"];
  return colors[index % colors.length];
};

const getCareerBgColor = (index: number): string => {
  const colors = ["bg-blue-100", "bg-red-100", "bg-cyan-100", "bg-purple-100", "bg-green-100"];
  return colors[index % colors.length];
};

const Results = ({
  initialRecommendations,
  onRestart,
  assessmentId,
}: ResultsProps) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [recommendations, setRecommendations] = useState<Recommendations>(
    initialRecommendations
  );
  const [selectedCareers, setSelectedCareers] = useState<string[]>([]);
  const [savingCareers, setSavingCareers] = useState<Set<string>>(new Set());

  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(true);

  useEffect(() => {
    setRecommendations(initialRecommendations);
  }, [initialRecommendations]);

  const handleSaveCareer = async (careerName: string, score: number) => {
    setSavingCareers((prev) => new Set([...prev, careerName]));

    try {
      const response = await saveCareer(careerName, score);
      setSelectedCareers([...selectedCareers, careerName]);

      if (response.roadmapGenerated && response.roadmapSteps) {
        toast.success(
          `${careerName} saved! ${response.roadmapSteps} learning steps ready to explore.`
        );
      } else {
        toast.success(`${careerName} saved successfully!`);
      }
    } catch (err: unknown) {
      const error = err as any;
      let errorMessage = "Failed to save career. Please try again.";

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

      toast.error(errorMessage);
      console.error("Save Career Error:", err);
    } finally {
      setSavingCareers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(careerName);
        return newSet;
      });
    }
  };

  const handleFeedbackSuccess = () => {
    toast.success("Thank you for your feedback! Your input helps us improve.");
  };

  const getCareerImage = (careerName: string) => {
    return careerImages[careerName] || careerImages["default"];
  };

  if (!recommendations.careers.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-red-200 max-w-md text-center">
          <p className="text-red-600 text-lg font-medium">
            No recommendations available.
          </p>
          <button
            onClick={onRestart}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retake Assessment
          </button>
        </div>
      </div>
    );
  }

  const primaryCareer = recommendations.careers[0];
  const otherCareers = recommendations.careers.slice(1, 4);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Your Career Assessment Results
          </h1>
          <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto">
            We've analyzed your skills, interests, and personality profile. Here are the
            career paths where you're most likely to thrive.
          </p>
        </div>

        {/* Best Match Hero Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg overflow-hidden mb-8 sm:mb-12">
          <div className="flex flex-col lg:flex-row">
            {/* Left - Image */}
            <div className="lg:w-2/5 relative">
              <img
                src={getCareerImage(primaryCareer.career_name)}
                alt={primaryCareer.career_name}
                className="w-full h-48 sm:h-64 lg:h-full object-cover"
              />
              <div className="absolute top-4 left-4">
                <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
                  Best Match
                </span>
              </div>
            </div>

            {/* Right - Content */}
            <div className="lg:w-3/5 p-5 sm:p-8">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  {primaryCareer.career_name}
                </h2>
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-500">
                    {primaryCareer.score}%
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide">
                    Match Score
                  </div>
                </div>
              </div>

              {primaryCareer.reason && (
                <p className="text-sm sm:text-base text-gray-600 mb-5 leading-relaxed">
                  {primaryCareer.reason}
                </p>
              )}

              {/* Core Skills */}
              <div className="mb-6">
                <h4 className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">
                  Core Skills Required
                </h4>
                <div className="flex flex-wrap gap-2">
                  {getCareerSkills(primaryCareer.career_name).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-xs sm:text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div>
                <button
                  onClick={() =>
                    handleSaveCareer(primaryCareer.career_name, primaryCareer.score)
                  }
                  disabled={
                    selectedCareers.includes(primaryCareer.career_name) ||
                    savingCareers.has(primaryCareer.career_name)
                  }
                  className={`flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg transition-colors text-sm ${
                    selectedCareers.includes(primaryCareer.career_name)
                      ? "bg-green-500 text-white"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  {savingCareers.has(primaryCareer.career_name) ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : selectedCareers.includes(primaryCareer.career_name) ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Saved
                    </>
                  ) : (
                    "Save This Career"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Other Great Matches */}
        {otherCareers.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-5">
              Other Great Matches
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherCareers.map((career, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl sm:rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  {/* Icon and Match */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${getCareerBgColor(index)} flex items-center justify-center`}>
                      <Code className={`w-5 h-5 ${getCareerIconColor(index)}`} />
                    </div>
                    <div className={`text-sm font-bold ${getCareerIconColor(index)}`}>
                      {career.score}% Match
                    </div>
                  </div>

                  {/* Career Name */}
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                    {career.career_name}
                  </h4>

                  {/* Reason */}
                  {career.reason && (
                    <p className="text-xs sm:text-sm text-gray-500 mb-4 line-clamp-2">
                      {career.reason}
                    </p>
                  )}

                  {/* Save Button */}
                  <button
                    onClick={() => handleSaveCareer(career.career_name, career.score)}
                    disabled={
                      selectedCareers.includes(career.career_name) ||
                      savingCareers.has(career.career_name)
                    }
                    className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                      selectedCareers.includes(career.career_name)
                        ? "bg-green-50 text-green-600 border border-green-200"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {savingCareers.has(career.career_name) ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                        Saving...
                      </span>
                    ) : selectedCareers.includes(career.career_name) ? (
                      "✓ Saved"
                    ) : (
                      "Save This Career"
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Where to Learn */}
        <div className="bg-gray-100 rounded-2xl sm:rounded-3xl p-5 sm:p-8 mb-8 sm:mb-12">
          <div className="text-center mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
              Where to Learn
            </h3>
            <p className="text-sm text-gray-500">
              Curated resources to help you master the skills for your best match.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Coursera */}
            <a
              href="https://www.coursera.org"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl p-4 text-center hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-bold text-gray-900 text-sm">Coursera</h4>
              <p className="text-[10px] sm:text-xs text-gray-400">Professional Certs</p>
            </a>

            {/* freeCodeCamp */}
            <a
              href="https://www.freecodecamp.org"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl p-4 text-center hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Code className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="font-bold text-gray-900 text-sm">freeCodeCamp</h4>
              <p className="text-[10px] sm:text-xs text-gray-400">Interactive Coding</p>
            </a>

            {/* Udemy */}
            <a
              href="https://www.udemy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl p-4 text-center hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Play className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="font-bold text-gray-900 text-sm">Udemy</h4>
              <p className="text-[10px] sm:text-xs text-gray-400">Practical Skills</p>
            </a>

            {/* UX Collective */}
            <a
              href="https://uxdesign.cc"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl p-4 text-center hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <h4 className="font-bold text-gray-900 text-sm">UX Collective</h4>
              <p className="text-[10px] sm:text-xs text-gray-400">Thought Leadership</p>
            </a>
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <button
            onClick={onRestart}
            className="text-gray-500 hover:text-gray-700 font-medium text-sm"
          >
            Retake Assessment
          </button>
          <span className="hidden sm:block text-gray-300">|</span>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-blue-500 hover:text-blue-600 font-medium text-sm"
          >
            View Saved Careers ({selectedCareers.length})
          </button>
        </div>
      </div>

      {/* Floating Chatbot */}
      <FloatingChatbot position="bottom-right" />

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
