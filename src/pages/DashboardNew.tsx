import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cookies } from "react-cookie";
import {
  fetchSavedCareers,
  deleteCareer,
  getRoadmapProgress,
} from "../../services/dataService";
import RoadmapPage from "../pages/Roadmap";
import FloatingChatbot from "../components/FloatingChatbot";
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
import { Bookmark, Puzzle, CheckCircle, Code, GraduationCap, Linkedin, Play } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface SavedCareer {
  saved_career_id: number;
  user_id: number;
  career_name: string;
  saved_at: string;
  progress?: {
    total_steps: number;
    completed_steps: number;
    is_completed: boolean;
  };
}

// Career categories mapping
const careerCategories: { [key: string]: string } = {
  "Software Engineer": "Technology",
  "Data Scientist": "Data Science",
  "Graphic Designer": "Design & Creative",
  "Software Tester/Quality Assurance": "Technology",
  "Web Developer": "Technology",
  "Frontend Developer": "Technology",
  "Backend Developer": "Technology",
  "Mobile App Developer": "Technology",
  "UX/UI Designer": "Design & Creative",
  "Machine Learning Engineer": "Data Science",
  "Database Administrator": "Technology",
  "Systems Administrator": "Technology",
  "Computer Systems Analyst": "Technology",
  "Game Developer": "Technology",
  "DevOps Engineer": "Technology",
  "Business Intelligence Analyst": "Business",
  "QA Tester": "Technology",
  "Cybersecurity Engineer": "Technology",
  "Data Analyst": "Data Science",
  "Product Manager": "Business",
};

const DashboardNew = () => {
  const navigate = useNavigate();
  const cookies = new Cookies();
  const authToken = cookies.get("authToken");
  const toast = useToast();
  const [savedCareers, setSavedCareers] = useState<SavedCareer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCareer, setSelectedCareer] = useState<{
    savedCareerId: number;
    careerName: string;
  } | null>(null);
  const [careerToDelete, setCareerToDelete] = useState<{
    savedCareerId: number;
    careerName: string;
  } | null>(null);

  const fetchCareers = async () => {
    try {
      setLoading(true);
      const startTime = Date.now();
      const data = await fetchSavedCareers();
      const fetchedCareers = Array.isArray(data)
        ? data
        : [data].filter(Boolean);

      // Fetch progress for each career
      const careersWithProgress = await Promise.all(
        fetchedCareers.map(async (career) => {
          try {
            const progressData = await getRoadmapProgress(
              career.saved_career_id,
            );
            return {
              ...career,
              progress: {
                total_steps: progressData.total_steps || 0,
                completed_steps: progressData.completed_steps || 0,
                is_completed:
                  progressData.completed_steps === progressData.total_steps &&
                  progressData.total_steps > 0,
              },
            };
          } catch (error) {
            console.error(
              `Failed to fetch progress for career ${career.saved_career_id}:`,
              error,
            );
            return career;
          }
        }),
      );

      setSavedCareers(careersWithProgress);

      const elapsedTime = Date.now() - startTime;
      const minimumLoadingTime = 1500;
      const remainingTime = minimumLoadingTime - elapsedTime;

      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to load saved careers.");
      console.error("Fetch Careers Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authToken) {
      navigate("/login");
      return;
    }
    fetchCareers();
  }, [authToken, navigate]);

  const refreshCareerProgress = async (savedCareerId: number) => {
    try {
      const progressData = await getRoadmapProgress(savedCareerId);
      setSavedCareers((prevCareers) =>
        prevCareers.map((career) =>
          career.saved_career_id === savedCareerId
            ? {
                ...career,
                progress: {
                  total_steps: progressData.total_steps || 0,
                  completed_steps: progressData.completed_steps || 0,
                  is_completed:
                    progressData.completed_steps === progressData.total_steps &&
                    progressData.total_steps > 0,
                },
              }
            : career,
        ),
      );
    } catch (error) {
      console.error(
        `Failed to refresh progress for career ${savedCareerId}:`,
        error,
      );
    }
  };

  const handleBackFromRoadmap = () => {
    if (selectedCareer) {
      refreshCareerProgress(selectedCareer.savedCareerId);
    }
    setSelectedCareer(null);
  };

  const handleDeleteCareer = async () => {
    if (!careerToDelete) return;

    const { savedCareerId, careerName } = careerToDelete;
    try {
      const response = await deleteCareer(savedCareerId);
      setSavedCareers(
        savedCareers.filter(
          (career) => career.saved_career_id !== savedCareerId,
        ),
      );

      const deletedSteps = response.roadmapStepsDeleted || 0;
      if (deletedSteps > 0) {
        toast.success(
          'Career Deleted',
          `${careerName} deleted successfully. ${deletedSteps} learning steps removed.`
        );
      } else {
        toast.success('Career Deleted', `${careerName} deleted successfully.`);
      }

      setCareerToDelete(null);
    } catch (err: unknown) {
      const error = err as any;
      let errorMessage = `Failed to delete ${careerName}. Please try again.`;

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error('Delete Failed', errorMessage);
    }
  };

  const handleViewRoadmap = (savedCareerId: number, careerName: string) => {
    setSelectedCareer({ savedCareerId, careerName });
  };

  const handleStartAssessment = () => {
    navigate("/assessment");
  };

  // Calculate stats
  const totalCareers = savedCareers.length;
  const inProgressCareers = savedCareers.filter(
    (c) =>
      c.progress && c.progress.completed_steps > 0 && !c.progress.is_completed,
  ).length;
  const completedCareers = savedCareers.filter(
    (c) => c.progress?.is_completed,
  ).length;

  const getStatus = (career: SavedCareer) => {
    if (!career.progress) return "not-started";
    if (career.progress.is_completed) return "completed";
    if (career.progress.completed_steps > 0) return "in-progress";
    return "not-started";
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in-progress":
        return "In Progress";
      default:
        return "Not Started";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-8">
            <div className="h-9 w-40 bg-gray-200 rounded-lg animate-shimmer" />
            <div className="h-10 w-48 bg-gray-200 rounded-lg animate-shimmer" />
          </div>
          
          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-28 bg-gray-200 rounded animate-shimmer" />
                    <div className="h-8 w-16 bg-gray-200 rounded animate-shimmer" />
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-lg animate-shimmer" />
                </div>
              </div>
            ))}
          </div>
          
          {/* Table Skeleton */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="space-y-2 mb-6">
              <div className="h-6 w-52 bg-gray-200 rounded animate-shimmer" />
              <div className="h-4 w-80 bg-gray-200 rounded animate-shimmer" />
            </div>
            {/* Table Header */}
            <div className="flex gap-4 pb-4 border-b border-gray-100 mb-4">
              {[80, 60, 50, 60, 70, 50].map((w, i) => (
                <div key={i} className={`h-4 bg-gray-200 rounded animate-shimmer`} style={{ width: `${w}px` }} />
              ))}
            </div>
            {/* Table Rows */}
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 py-3" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="h-5 w-32 bg-gray-200 rounded animate-shimmer" />
                  <div className="h-5 w-24 bg-gray-200 rounded animate-shimmer" />
                  <div className="h-6 w-20 bg-gray-200 rounded-full animate-shimmer" />
                  <div className="flex-1">
                    <div className="h-2 bg-gray-200 rounded-full animate-shimmer" />
                  </div>
                  <div className="h-5 w-24 bg-gray-200 rounded animate-shimmer" />
                  <div className="flex gap-2">
                    <div className="h-9 w-24 bg-gray-200 rounded-lg animate-shimmer" />
                    <div className="h-9 w-9 bg-gray-200 rounded-lg animate-shimmer" />
                  </div>
                </div>
              ))}
            </div>
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
        onBack={handleBackFromRoadmap}
        onProgressUpdate={() =>
          refreshCareerProgress(selectedCareer.savedCareerId)
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-page-enter">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={handleStartAssessment}
            className="px-4 sm:px-5 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm sm:text-base font-medium rounded-lg transition-colors w-full sm:w-auto"
          >
            Take Another Assessment
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Saved Careers */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-card-enter animate-stagger-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Saved Careers</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalCareers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bookmark className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-card-enter animate-stagger-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{inProgressCareers}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Puzzle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          {/* Completed Assessments */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-card-enter animate-stagger-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed Assessments</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{completedCareers}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Career Collection Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 animate-card-enter animate-stagger-4">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Your Career Collection</h2>
            <p className="text-sm text-gray-500 mt-1">Explore your saved careers with automatically generated learning roadmaps</p>
          </div>

          {savedCareers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bookmark className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No saved careers yet</h3>
              <p className="text-gray-500 mb-6">Take the assessment to discover your career path!</p>
              <button
                onClick={handleStartAssessment}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                Start Assessment
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Career Path</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Progress</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Saved Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {savedCareers.map((career) => {
                    const status = getStatus(career);
                    const progressPercent = career.progress
                      ? Math.round(
                          (career.progress.completed_steps /
                            career.progress.total_steps) *
                            100,
                        ) || 0
                      : 0;

                    return (
                      <tr key={career.saved_career_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900">{career.career_name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600">{careerCategories[career.career_name] || "Technology"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            status === "completed" 
                              ? "bg-green-100 text-green-700" 
                              : status === "in-progress" 
                                ? "bg-amber-100 text-amber-700" 
                                : "bg-gray-100 text-gray-600"
                          }`}>
                            {status === "completed" && <CheckCircle className="w-3.5 h-3.5" />}
                            {status === "in-progress" && <Puzzle className="w-3.5 h-3.5" />}
                            {getStatusLabel(status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[120px]">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  status === "completed" 
                                    ? "bg-green-500" 
                                    : status === "in-progress" 
                                      ? "bg-amber-500" 
                                      : "bg-gray-400"
                                }`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 whitespace-nowrap">{progressPercent}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600">{new Date(career.saved_at).toLocaleDateString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleViewRoadmap(
                                  career.saved_career_id,
                                  career.career_name,
                                )
                              }
                              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                status === "in-progress" || status === "completed"
                                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                              }`}
                            >
                              {status === "in-progress" || status === "completed" ? "Continue Learning" : "View Roadmap"}
                            </button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button
                                  onClick={() =>
                                    setCareerToDelete({
                                      savedCareerId: career.saved_career_id,
                                      careerName: career.career_name,
                                    })
                                  }
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete career"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-white border-gray-200">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-gray-900">Delete Career?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-600">
                                    This will permanently delete "{careerToDelete?.careerName}" and all your learning progress. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300">Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDeleteCareer} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Where to Learn Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Where to Learn?</h2>
            <p className="text-sm text-gray-500 mt-1">Start learning today with these top-rated platforms</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* freeCodeCamp */}
              <a 
                href="https://www.freecodecamp.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex flex-col items-center p-6 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 group-hover:shadow-md transition-shadow">
                  <Code className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">freeCodeCamp</h3>
                <p className="text-sm text-gray-500 text-center mb-3">Free coding certifications</p>
                <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700">Start Learning →</span>
              </a>

              {/* Coursera */}
              <a 
                href="https://www.coursera.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex flex-col items-center p-6 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 group-hover:shadow-md transition-shadow">
                  <GraduationCap className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Coursera</h3>
                <p className="text-sm text-gray-500 text-center mb-3">University courses online</p>
                <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700">Start Learning →</span>
              </a>

              {/* LinkedIn Learning */}
              <a 
                href="https://www.linkedin.com/learning" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex flex-col items-center p-6 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 group-hover:shadow-md transition-shadow">
                  <Linkedin className="w-7 h-7 text-blue-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">LinkedIn Learning</h3>
                <p className="text-sm text-gray-500 text-center mb-3">Professional skill courses</p>
                <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700">Start Learning →</span>
              </a>

              {/* YouTube Edu */}
              <a 
                href="https://www.youtube.com/education" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex flex-col items-center p-6 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 group-hover:shadow-md transition-shadow">
                  <Play className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">YouTube Edu</h3>
                <p className="text-sm text-gray-500 text-center mb-3">Free video tutorials</p>
                <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700">Start Learning →</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200 pt-8 pb-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">© 2025 CareerAI. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Privacy Policy</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Terms of Service</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Help Center</a>
            </div>
          </div>
        </footer>
      </div>

      {/* Floating Chatbot */}
      <FloatingChatbot position="bottom-right" />
    </div>
  );
};

export default DashboardNew;
