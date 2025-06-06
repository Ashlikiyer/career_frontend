import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cookies } from "react-cookie";
import Navbar from "../components/Navbar";
import { fetchSavedCareers, deleteCareer } from "../../services/dataService";
import RoadmapModal from "@/components/modal/RoadmapModal";
import RoadmapPage from "../pages/Roadmap";
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
  "Software Engineer": "Develop applications and systems with cutting-edge technologies.",
  "Data Scientist": "Analyze data and develop models for data-driven decisions.",
  "Graphic Designer": "Create visually stunning graphics and layouts.",
  "Software Tester/Quality Assurance": "Ensure software quality through rigorous testing.",
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
  const [generatedRoadmaps, setGeneratedRoadmaps] = useState<{ savedCareerId: number; careerName: string }[]>(() => {
    const saved = localStorage.getItem("generatedRoadmaps");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedCareer, setSelectedCareer] = useState<{ savedCareerId: number; careerName: string } | null>(null);
  const [careerToDelete, setCareerToDelete] = useState<{ savedCareerId: number; careerName: string } | null>(null);

  useEffect(() => {
    localStorage.setItem("generatedRoadmaps", JSON.stringify(generatedRoadmaps));
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
        setSavedCareers(Array.isArray(data) ? data : [data].filter(Boolean));

        const elapsedTime = Date.now() - startTime;
        const minimumLoadingTime = 2000; // 2 seconds in milliseconds
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
      setSavedCareers(savedCareers.filter((career) => career.saved_career_id !== savedCareerId));
      setGeneratedRoadmaps(generatedRoadmaps.filter((item) => item.savedCareerId !== savedCareerId));
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

  const toggleMenu = (savedCareerId: number) => {
    setMenuOpenId(menuOpenId === savedCareerId ? null : savedCareerId);
  };

  const handleViewRoadmap = (savedCareerId: number, careerName: string) => {
    if (generatedRoadmaps.some((item) => item.savedCareerId === savedCareerId)) {
      setSelectedCareer({ savedCareerId, careerName });
    } else {
      setError("Please generate a roadmap for this career first.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleGenerateRoadmap = (savedCareerId: number) => {
    const career = savedCareers.find((c) => c.saved_career_id === savedCareerId);
    if (career) {
      setGeneratedRoadmaps((prev) => [
        ...prev.filter((item) => item.savedCareerId !== savedCareerId),
        { savedCareerId, careerName: career.career_name },
      ]);
      setSuccess(`Roadmap generated for ${career.career_name}!`);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111827] text-gray-200 flex flex-col">
        <Navbar />
        <div className="flex-grow p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Your Career Dashboard</h2>
              <p className="text-lg text-gray-400">
                View your saved career paths or generate a roadmap to plan your journey.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="relative p-6 bg-gradient-to-br from-[#1F2937] to-[#2D3748] rounded-lg border border-gray-700"
                >
                  <div className="flex flex-col space-y-3">
                    <Skeleton className="h-6 w-3/4 rounded-md" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full rounded-md" />
                      <Skeleton className="h-4 w-1/2 rounded-md" />
                    </div>
                    <Skeleton className="h-10 w-full rounded-lg" />
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
      <div className="min-h-screen bg-[#111827] text-gray-200 flex flex-col">
        <Navbar />
        <div className="flex-grow p-8 flex items-center justify-center">
          <p className="text-red-400 bg-gray-700 p-4 rounded-lg">{error}</p>
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
    <div className="min-h-screen bg-[#111827] text-gray-200 flex flex-col">
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
            <Alert className="fixed top-4 right-4 z-50 max-w-sm bg-white border border-gray-300 text-black shadow-lg rounded-lg animate-slide-in">
              <CheckCircle2Icon className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Your Career Dashboard</h2>
            <p className="text-lg text-gray-400">
              View your saved career paths or generate a roadmap to plan your journey.
            </p>
          </div>

          {savedCareers.length === 0 ? (
            <div className="text-center p-6 bg-[#1F2937] rounded-lg">
              <p className="text-gray-400">No saved careers yet. Take the assessment to discover your path!</p>
              <button
                onClick={() => navigate("/assessment")}
                className="mt-4 bg-[#4C4C86] hover:bg-[#5D5DA3] text-white font-bold py-2 px-6 rounded-lg transition duration-300"
              >
                Take Assessment
              </button>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {savedCareers.map((career) => (
                  <div
                    key={career.saved_career_id}
                    className="relative p-6 bg-gradient-to-br from-[#1F2937] to-[#2D3748] rounded-lg border border-gray-700 hover:border-blue-400 transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <h3 className="text-xl font-semibold mb-3">{career.career_name}</h3>
                          {generatedRoadmaps.some((item) => item.savedCareerId === career.saved_career_id) && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white">
                              Roadmap Generated
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">
                          {careerDescriptions[career.career_name] || "No description available."}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Saved on {new Date(career.saved_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => toggleMenu(career.saved_career_id)}
                          className="p-2 text-gray-400 hover:text-gray-200 focus:outline-none"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        {menuOpenId === career.saved_career_id && (
                          <div className="absolute right-0 mt-2 w-48 bg-[#1F2937] border border-gray-700 rounded-lg shadow-lg z-10">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button
                                  onClick={() =>
                                    setCareerToDelete({
                                      savedCareerId: career.saved_career_id,
                                      careerName: career.career_name,
                                    })
                                  }
                                  className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700 rounded-t-lg"
                                >
                                  Delete
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-[#1F2937] border-gray-700 text-gray-200">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-400">
                                    This action cannot be undone. This will permanently delete the career "
                                    {careerToDelete?.careerName}" from your saved careers.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-gray-600 text-gray-200 hover:bg-gray-500">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleDeleteCareer}
                                    className="bg-red-600 hover:bg-red-500 text-white"
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
                              className="w-full text-left px-4 py-2 text-gray-200 hover:bg-gray-700 rounded-b-lg"
                            >
                              Generate Roadmap
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewRoadmap(career.saved_career_id, career.career_name)}
                      className="mt-4 w-full bg-[#4C4C86] hover:bg-[#5D5DA3] text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                    >
                      View Roadmap
                    </button>
                  </div>
                ))}
              </div>

              {generatedRoadmaps.length > 0 && (
                <div className="mb-12 bg-[#1F2937] rounded-lg p-8 border border-gray-700">
                  <h3 className="text-xl font-semibold mb-4">Your Generated Roadmaps</h3>
                  <p className="text-gray-400 mb-4">Quick access to all your generated roadmaps:</p>
                  <ul className="space-y-2">
                    {generatedRoadmaps.map((roadmap) => (
                      <li key={roadmap.savedCareerId} className="flex items-center justify-between">
                        <span className="text-gray-200">{roadmap.careerName}</span>
                        <button
                          onClick={() => handleViewRoadmap(roadmap.savedCareerId, roadmap.careerName)}
                          className="text-blue-400 hover:underline text-sm"
                        >
                          View Roadmap
                        </button>
                      </li>
                    ))}
                  </ul>
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

          {savedCareers.length > 0 && (
            <div className="text-center mb-12">
              <button
                onClick={() => setIsRoadmapModalOpen(true)}
                className="bg-[#4C4C86] hover:bg-[#5D5DA3] text-white font-bold py-2 px-6 rounded-lg transition duration-300"
              >
                Generate Roadmap
              </button>
            </div>
          )}

          <div className="bg-[#1F2937] rounded-lg p-8 border border-gray-700">
            <h3 className="text-xl font-semibold mb-4">Where to Learn?</h3>
            <p className="text-gray-400 mb-4">Enhance your skills with these recommended platforms:</p>
            <ul className="space-y-4 text-left">
              <li className="text-base">
                <span className="font-medium">Coursera</span> - Courses in programming, data science, and design.{" "}
                <a
                  href="https://www.coursera.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Visit Coursera
                </a>
              </li>
              <li className="text-base">
                <span className="font-medium">Codecademy</span> - Interactive coding lessons for all levels.{" "}
                <a
                  href="https://www.codecademy.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Visit Codecademy
                </a>
              </li>
              <li className="text-base">
                <span className="font-medium">AWS Skill Builder</span> - Cloud computing and technical training.{" "}
                <a
                  href="https://skillbuilder.aws"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Visit AWS Skill Builder
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;