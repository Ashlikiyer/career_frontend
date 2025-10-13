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
  const [warning, setWarning] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState(false);
  const [generatedRoadmaps, setGeneratedRoadmaps] = useState<
    { savedCareerId: number; careerName: string }[]
  >(() => JSON.parse(localStorage.getItem("generatedRoadmaps") || "[]"));
  const [selectedCareer, setSelectedCareer] = useState<{
    savedCareerId: number;
    careerName: string;
  } | null>(null);
  const [careerToDelete, setCareerToDelete] = useState<{
    savedCareerId: number;
    careerName: string;
  } | null>(null);
  const [roadmapToDelete, setRoadmapToDelete] = useState<{
    savedCareerId: number;
    careerName: string;
  } | null>(null);

  useEffect(() => {
    localStorage.setItem(
      "generatedRoadmaps",
      JSON.stringify(generatedRoadmaps)
    );
    console.log(
      "Saved to localStorage:",
      JSON.stringify(generatedRoadmaps, null, 2)
    );
  }, [generatedRoadmaps]);

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

        // Sync generatedRoadmaps with savedCareers after fetch
        const validRoadmaps = generatedRoadmaps.filter((item) =>
          fetchedCareers.some(
            (career) => career.saved_career_id === item.savedCareerId
          )
        );
        if (
          JSON.stringify(validRoadmaps) !== JSON.stringify(generatedRoadmaps)
        ) {
          setGeneratedRoadmaps(validRoadmaps);
          console.log(
            "Synced generatedRoadmaps:",
            JSON.stringify(validRoadmaps, null, 2)
          );
        }

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
      await deleteCareer(savedCareerId);
      setSavedCareers(
        savedCareers.filter(
          (career) => career.saved_career_id !== savedCareerId
        )
      );
      setGeneratedRoadmaps(
        generatedRoadmaps.filter((item) => item.savedCareerId !== savedCareerId)
      );
      setSuccess(`Career "${careerName}" deleted successfully!`);
      setMenuOpenId(null);
      setCareerToDelete(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMessage = (err as Error).message || "Failed to delete career.";
      setError(errorMessage);
      console.error("Delete Career Error:", err);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteRoadmap = () => {
    if (!roadmapToDelete) return;

    const { savedCareerId, careerName } = roadmapToDelete;
    setGeneratedRoadmaps(
      generatedRoadmaps.filter((item) => item.savedCareerId !== savedCareerId)
    );
    setSuccess(`Roadmap for "${careerName}" deleted successfully!`);
    setRoadmapToDelete(null);
    setTimeout(() => setSuccess(null), 3000);
  };

  const toggleMenu = (savedCareerId: number) => {
    setMenuOpenId(menuOpenId === savedCareerId ? null : savedCareerId);
  };

  const handleViewRoadmap = (savedCareerId: number, careerName: string) => {
    if (
      generatedRoadmaps.some((item) => item.savedCareerId === savedCareerId)
    ) {
      setSelectedCareer({ savedCareerId, careerName });
    } else {
      // Show a warning alert instead of error
      setWarning(
        `Please generate a roadmap for "${careerName}" first by clicking the "Generate Roadmap" button.`
      );
      setTimeout(() => setWarning(null), 4000);
    }
  };

  const handleGenerateRoadmap = (savedCareerId: number) => {
    const career = savedCareers.find(
      (c) => c.saved_career_id === savedCareerId
    );
    if (
      career &&
      !generatedRoadmaps.some((item) => item.savedCareerId === savedCareerId)
    ) {
      setGeneratedRoadmaps((prev) => [
        ...prev,
        { savedCareerId, careerName: career.career_name },
      ]);
      setSuccess(`Roadmap generated for ${career.career_name}!`);
      setTimeout(() => setSuccess(null), 3000);
    } else if (career) {
      setError("Roadmap for this career already generated.");
      setTimeout(() => setError(null), 3000);
    }
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
                View your saved career paths or generate a roadmap to plan your
                journey.
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
          {warning && (
            <Alert
              variant="warning"
              className="fixed top-4 right-4 z-50 max-w-sm animate-slide-in"
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <AlertTitle>Roadmap Not Generated</AlertTitle>
              <AlertDescription>{warning}</AlertDescription>
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
              Your Career Dashboard
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              View your saved career paths or generate a roadmap to plan your
              journey.
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
                    className="relative p-6 bg-white rounded-xl shadow-lg border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-xl"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center flex-wrap gap-2 mb-3">
                          <h3 className="text-xl font-bold text-gray-800">
                            {career.career_name}
                          </h3>
                          {generatedRoadmaps.some(
                            (item) =>
                              item.savedCareerId === career.saved_career_id
                          ) && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm">
                              ✓ Roadmap Ready
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed mb-3">
                          {careerDescriptions[career.career_name] ||
                            "No description available."}
                        </p>
                        <p className="text-xs text-gray-500">
                          Saved on{" "}
                          {new Date(career.saved_at).toLocaleDateString()}
                        </p>
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
                            <button
                              onClick={() => {
                                setIsRoadmapModalOpen(true);
                                setMenuOpenId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-b-xl transition-colors"
                            >
                              Generate Roadmap
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <button
                        onClick={() =>
                          handleViewRoadmap(
                            career.saved_career_id,
                            career.career_name
                          )
                        }
                        className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
                      >
                        View Roadmap
                      </button>
                      <button
                        onClick={() =>
                          handleGenerateRoadmap(career.saved_career_id)
                        }
                        className="w-full bg-white border-2 border-blue-300 hover:border-blue-400 text-blue-700 hover:text-blue-800 font-bold py-2 px-4 rounded-lg transition-all duration-300 hover:bg-blue-50"
                      >
                        Generate Roadmap
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {generatedRoadmaps.length > 0 && (
                <div className="mb-12 bg-white rounded-xl shadow-lg p-8 border border-gray-200">
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
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      Your Generated Roadmaps
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Quick access to all your generated roadmaps:
                  </p>
                  <div className="space-y-3">
                    {generatedRoadmaps.map((roadmap) => (
                      <div
                        key={roadmap.savedCareerId}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <span className="text-gray-800 font-medium">
                          {roadmap.careerName}
                        </span>
                        <div className="flex space-x-3">
                          <button
                            onClick={() =>
                              handleViewRoadmap(
                                roadmap.savedCareerId,
                                roadmap.careerName
                              )
                            }
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm underline decoration-2 underline-offset-2"
                          >
                            View Roadmap
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                onClick={() =>
                                  setRoadmapToDelete({
                                    savedCareerId: roadmap.savedCareerId,
                                    careerName: roadmap.careerName,
                                  })
                                }
                                className="text-red-600 hover:text-red-700 font-medium text-sm underline decoration-2 underline-offset-2"
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
                                  This will permanently delete the roadmap for "
                                  {roadmapToDelete?.careerName}". This action
                                  cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeleteRoadmap}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
              onGenerateRoadmap={handleGenerateRoadmap}
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
