import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cookies } from "react-cookie";
import Navbar from "../components/Navbar";
import { fetchSavedCareers, deleteCareer } from "../../services/dataService";
import RoadmapModal from "@/components/modal/RoadmapModal";
import RoadmapPage from "../pages/Roadmap";
import FloatingChatbot from "../components/FloatingChatbot";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2Icon } from "lucide-react";

interface SavedCareer {
  saved_career_id: number;
  user_id: number;
  career_name: string;
  saved_at: string;
}

const careerDescriptions: { [key: string]: string } = {
  "Software Engineer":
    "Develop applications and systems with cutting-edge technologies.",
  "Data Scientist":
    "Analyze data and develop models for data-driven decisions.",
  "Graphic Designer": "Create visually stunning graphics and layouts.",
  "Software Tester/Quality Assurance":
    "Ensure software quality through rigorous testing.",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const cookies = new Cookies();
  const authToken = cookies.get("authToken");
  const [savedCareers, setSavedCareers] = useState<SavedCareer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState(false);
  const [selectedCareer, setSelectedCareer] = useState<{
    savedCareerId: number;
    careerName: string;
  } | null>(null);
  const [careerToDelete, setCareerToDelete] = useState<{
    savedCareerId: number;
    careerName: string;
  } | null>(null);

  useEffect(() => {
    if (!authToken) {
      navigate("/login");
      return;
    }

    const fetchCareers = async () => {
      try {
        setLoading(true);
        const startTime = Date.now();
        const data = await fetchSavedCareers();
        console.log("Saved Careers Data:", JSON.stringify(data, null, 2));
        const fetchedCareers = Array.isArray(data)
          ? data
          : [data].filter(Boolean);
        setSavedCareers(fetchedCareers);

        const elapsedTime = Date.now() - startTime;
        const minimumLoadingTime = 2000;
        const remainingTime = minimumLoadingTime - elapsedTime;

        if (remainingTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }
      } catch (err: unknown) {
        setError((err as Error).message || "Failed to load saved careers.");
        console.error("Fetch Careers Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCareers();
  }, [authToken, navigate]);

  const handleDeleteCareer = async () => {
    if (!careerToDelete) return;

    const { savedCareerId, careerName } = careerToDelete;
    try {
      setError(null);
      setSuccess(null);
      const response = await deleteCareer(savedCareerId);
      setSavedCareers(
        savedCareers.filter(
          (career) => career.saved_career_id !== savedCareerId
        )
      );

      // Enhanced success message with roadmap deletion info
      const deletedSteps = response.roadmapStepsDeleted || 0;
      if (deletedSteps > 0) {
        setSuccess(
          `${careerName} deleted successfully. ${deletedSteps} learning steps removed from your collection.`
        );
      } else {
        setSuccess(`${careerName} deleted successfully.`);
      }

      setMenuOpenId(null);
      setCareerToDelete(null);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      const error = err as any;
      let errorMessage = `Failed to delete ${careerName}. Please try again.`;

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      console.error("Delete Career Error:", err);
      setTimeout(() => setError(null), 4000);
    }
  };

  const toggleMenu = (savedCareerId: number) => {
    setMenuOpenId(menuOpenId === savedCareerId ? null : savedCareerId);
  };

  const handleViewRoadmap = (savedCareerId: number, careerName: string) => {
    // Roadmaps are now auto-generated when careers are saved, so no need to check
    setSelectedCareer({ savedCareerId, careerName });
  };

  const handleStartAssessment = () => {
    navigate("/assessment");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
        <Navbar />
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Your Career Dashboard
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                View your saved career paths with automatically generated
                learning roadmaps.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="relative p-6 bg-white rounded-xl shadow-lg border border-gray-200"
                >
                  <div className="flex flex-col space-y-3">
                    <Skeleton className="h-6 w-3/4 rounded-md bg-gray-200" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full rounded-md bg-gray-200" />
                      <Skeleton className="h-4 w-1/2 rounded-md bg-gray-200" />
                    </div>
                    <Skeleton className="h-10 w-full rounded-lg bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
        <Navbar />
        <div className="flex-grow p-8 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-red-200">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedCareer) {
    return (
      <RoadmapPage
        savedCareerId={selectedCareer.savedCareerId}
        careerName={selectedCareer.careerName}
        onBack={() => setSelectedCareer(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
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
      <div className="flex-grow p-8">
        <div className="max-w-4xl mx-auto">
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
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </div>
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Your Career Collection
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore your saved careers with automatically generated learning
              roadmaps ready to guide your journey.
            </p>
          </div>

          {savedCareers.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-100 to-green-100 rounded-full mb-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <p className="text-gray-600 text-lg mb-6">
                No saved careers yet. Take the assessment to discover your path!
              </p>
              <button
                onClick={handleStartAssessment}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Start Assessment
              </button>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {savedCareers.map((career) => (
                  <div
                    key={career.saved_career_id}
                    className="relative p-6 bg-gradient-to-br from-white to-blue-50/30 rounded-xl shadow-lg border-2 border-gray-200 hover:border-blue-400 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <div className="flex items-center flex-wrap gap-2 mb-3">
                          <h3 className="text-xl font-bold text-gray-800">
                            {career.career_name}
                          </h3>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm">
                            🗺️ Learning Path Ready
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">
                          {careerDescriptions[career.career_name] ||
                            "Explore exciting opportunities in this field with structured learning paths designed for success."}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                          <div className="flex items-center">
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Saved{" "}
                            {new Date(career.saved_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center text-green-600 font-medium">
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Auto-generated roadmap
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => toggleMenu(career.saved_career_id)}
                          className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        {menuOpenId === career.saved_career_id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button
                                  onClick={() =>
                                    setCareerToDelete({
                                      savedCareerId: career.saved_career_id,
                                      careerName: career.career_name,
                                    })
                                  }
                                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-t-xl transition-colors"
                                >
                                  Delete
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-white border-gray-200 text-gray-800">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Are you sure?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-600">
                                    This action cannot be undone. This will
                                    permanently delete the career "
                                    {careerToDelete?.careerName}" from your
                                    saved careers.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleDeleteCareer}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-6">
                      <button
                        onClick={() =>
                          handleViewRoadmap(
                            career.saved_career_id,
                            career.career_name
                          )
                        }
                        className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center group"
                      >
                        <span className="mr-2">🚀</span>
                        Start Learning Path
                        <svg
                          className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
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
                ))}
              </div>

              {savedCareers.length > 0 && (
                <div className="text-center mb-12">
                  <button
                    onClick={handleStartAssessment}
                    className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Take Another Assessment
                  </button>
                </div>
              )}
            </>
          )}

          {savedCareers.length > 0 && (
            <RoadmapModal
              isOpen={isRoadmapModalOpen}
              onClose={() => setIsRoadmapModalOpen(false)}
              savedCareers={savedCareers}
            />
          )}

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
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                <h4 className="font-bold text-blue-800 mb-2">Coursera</h4>
                <p className="text-blue-600 text-sm mb-3">
                  Courses in programming, data science, and design.
                </p>
                <a
                  href="https://www.coursera.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:text-blue-800 font-medium text-sm underline decoration-2 underline-offset-2"
                >
                  Visit Coursera →
                </a>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
                <h4 className="font-bold text-green-800 mb-2">Codecademy</h4>
                <p className="text-green-600 text-sm mb-3">
                  Interactive coding lessons for all levels.
                </p>
                <a
                  href="https://www.codecademy.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-700 hover:text-green-800 font-medium text-sm underline decoration-2 underline-offset-2"
                >
                  Visit Codecademy →
                </a>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 hover:shadow-md transition-shadow">
                <h4 className="font-bold text-purple-800 mb-2">
                  AWS Skill Builder
                </h4>
                <p className="text-purple-600 text-sm mb-3">
                  Cloud computing and technical training.
                </p>
                <a
                  href="https://skillbuilder.aws"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-700 hover:text-purple-800 font-medium text-sm underline decoration-2 underline-offset-2"
                >
                  Visit AWS Skill Builder →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Chatbot */}
      <FloatingChatbot position="bottom-right" />
    </div>
  );
};

export default Dashboard;
