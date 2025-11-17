import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cookies } from "react-cookie";
import {
  fetchSavedCareers,
  deleteCareer,
  getRoadmapProgress,
} from "../../services/dataService";
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
import "./Dashboard.css";

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

        // Fetch progress for each career
        const careersWithProgress = await Promise.all(
          fetchedCareers.map(async (career) => {
            try {
              const progressData = await getRoadmapProgress(
                career.saved_career_id
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
                error
              );
              return career; // Return career without progress if fetch fails
            }
          })
        );

        setSavedCareers(careersWithProgress);

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
      <div className="dashboard-container">
        <div className="flex-grow p-8">
          <div className="max-w-6xl mx-auto">
            <div className="dashboard-header">
              <div className="dashboard-icon-wrapper">
                <svg
                  className="dashboard-icon"
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
              <h2 className="dashboard-title">Your Career Dashboard</h2>
              <p className="dashboard-subtitle">
                View your saved career paths with automatically generated
                learning roadmaps.
              </p>
            </div>
            <div className="careers-grid">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="skeleton-card">
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
      <div className="dashboard-container">
        <div className="flex-grow p-8 flex items-center justify-center">
          <div className="empty-state max-w-lg">
            <div className="empty-icon-wrapper">
              <svg
                className="empty-icon"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-red-700 text-lg font-medium">{error}</p>
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
    <div className="dashboard-container">
      <div className="flex-grow p-8">
        <div className="max-w-6xl mx-auto">
          {success && (
            <Alert variant="success" className="success-alert">
              <CheckCircle2Icon className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="dashboard-header">
            <div className="dashboard-icon-wrapper">
              <svg
                className="dashboard-icon"
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
            <h2 className="dashboard-title">Your Career Collection</h2>
            <p className="dashboard-subtitle">
              Explore your saved careers with automatically generated learning
              roadmaps ready to guide your journey.
            </p>
          </div>

          {savedCareers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-wrapper">
                <svg
                  className="empty-icon"
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
              <p className="empty-text">
                No saved careers yet. Take the assessment to discover your path!
              </p>
              <button onClick={handleStartAssessment} className="action-button">
                Start Assessment
              </button>
            </div>
          ) : (
            <>
              <div className="careers-grid">
                {savedCareers.map((career) => (
                  <div key={career.saved_career_id} className="career-card">
                    <div className="career-card-header">
                      <div className="career-card-title-wrapper">
                        <h3 className="career-card-title">
                          {career.career_name}
                        </h3>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            flexWrap: "wrap",
                          }}
                        >
                          <span className="roadmap-badge">
                            🗺️ Learning Path Ready
                          </span>
                          {career.progress?.is_completed && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                padding: "0.375rem 0.75rem",
                                background:
                                  "linear-gradient(135deg, #10b981, #059669)",
                                color: "white",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                borderRadius: "8px",
                                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                              }}
                            >
                              ✓ Completed
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => toggleMenu(career.saved_career_id)}
                          className="menu-button"
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
                          <div className="menu-dropdown">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button
                                  onClick={() =>
                                    setCareerToDelete({
                                      savedCareerId: career.saved_career_id,
                                      careerName: career.career_name,
                                    })
                                  }
                                  className="menu-delete-btn"
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
                    <p className="career-card-description">
                      {careerDescriptions[career.career_name] ||
                        "Explore exciting opportunities in this field with structured learning paths designed for success."}
                    </p>
                    {career.progress && (
                      <div
                        style={{
                          marginTop: "0.75rem",
                          marginBottom: "0.5rem",
                          fontSize: "0.875rem",
                          color: "#6b7280",
                        }}
                      >
                        <div style={{ marginBottom: "0.375rem" }}>
                          Progress: {career.progress.completed_steps} /{" "}
                          {career.progress.total_steps} steps
                        </div>
                        <div
                          style={{
                            width: "100%",
                            height: "6px",
                            background: "#e5e7eb",
                            borderRadius: "9999px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${
                                career.progress.total_steps > 0
                                  ? (career.progress.completed_steps /
                                      career.progress.total_steps) *
                                    100
                                  : 0
                              }%`,
                              height: "100%",
                              background: career.progress.is_completed
                                ? "linear-gradient(135deg, #10b981, #059669)"
                                : "linear-gradient(135deg, #3b82f6, #2563eb)",
                              transition: "width 0.3s ease",
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                    <div className="career-card-meta">
                      <div className="meta-item">
                        <svg
                          className="meta-icon"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Saved {new Date(career.saved_at).toLocaleDateString()}
                      </div>
                      <div className="meta-item success">
                        <svg
                          className="meta-icon"
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
                    <button
                      onClick={() =>
                        handleViewRoadmap(
                          career.saved_career_id,
                          career.career_name
                        )
                      }
                      className="start-learning-btn"
                    >
                      <span>🚀</span>
                      Start Learning Path
                      <svg
                        className="btn-arrow"
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
                ))}
              </div>

              {savedCareers.length > 0 && (
                <div className="text-center mb-12">
                  <button
                    onClick={handleStartAssessment}
                    className="action-button"
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

          <div className="learning-resources">
            <div className="resources-header">
              <div className="resources-icon-wrapper">
                <svg
                  className="resources-icon"
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
              <h3 className="resources-title">Where to Learn?</h3>
            </div>
            <p className="resources-description">
              Start learning today with these top-rated FREE platforms trusted
              by millions of learners worldwide:
            </p>
            <div className="resources-grid">
              <div className="resource-card blue">
                <h4 className="resource-card-title">🎓 freeCodeCamp</h4>
                <p className="resource-card-description">
                  100% FREE certifications in web development, data science,
                  Python, and more. Hands-on projects with real code.
                </p>
                <a
                  href="https://www.freecodecamp.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-card-link"
                >
                  Start Learning Free →
                </a>
              </div>
              <div className="resource-card green">
                <h4 className="resource-card-title">💻 Codecademy (Free)</h4>
                <p className="resource-card-description">
                  Interactive coding lessons FREE for beginners. Learn Python,
                  JavaScript, HTML/CSS, SQL, and more.
                </p>
                <a
                  href="https://www.codecademy.com/catalog/subject/all"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-card-link"
                >
                  Browse Free Courses →
                </a>
              </div>
              <div className="resource-card purple">
                <h4 className="resource-card-title">
                  📚 Coursera (Free Audit)
                </h4>
                <p className="resource-card-description">
                  Audit courses FREE from top universities (Stanford, Yale,
                  MIT). Pay only if you want certificates.
                </p>
                <a
                  href="https://www.coursera.org/courses?query=free"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-card-link"
                >
                  Explore Free Courses →
                </a>
              </div>
              <div className="resource-card blue">
                <h4 className="resource-card-title">🌐 The Odin Project</h4>
                <p className="resource-card-description">
                  Completely FREE full-stack web development curriculum. From
                  zero to job-ready developer.
                </p>
                <a
                  href="https://www.theodinproject.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-card-link"
                >
                  Start Full Course →
                </a>
              </div>
              <div className="resource-card green">
                <h4 className="resource-card-title">🎬 Khan Academy</h4>
                <p className="resource-card-description">
                  FREE courses in computer programming, computer science, math,
                  and more. Perfect for all ages.
                </p>
                <a
                  href="https://www.khanacademy.org/computing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-card-link"
                >
                  Learn for Free →
                </a>
              </div>
              <div className="resource-card purple">
                <h4 className="resource-card-title">📖 MDN Web Docs</h4>
                <p className="resource-card-description">
                  FREE comprehensive web development documentation and
                  tutorials. The gold standard for web developers.
                </p>
                <a
                  href="https://developer.mozilla.org/en-US/docs/Learn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-card-link"
                >
                  Start Learning →
                </a>
              </div>
              <div className="resource-card blue">
                <h4 className="resource-card-title">☁️ AWS Skill Builder</h4>
                <p className="resource-card-description">
                  FREE cloud computing training from Amazon. Essential for
                  modern tech careers and DevOps.
                </p>
                <a
                  href="https://skillbuilder.aws"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-card-link"
                >
                  Start Free Training →
                </a>
              </div>
              <div className="resource-card green">
                <h4 className="resource-card-title">🐍 Python.org Tutorial</h4>
                <p className="resource-card-description">
                  Official FREE Python tutorial from the creators. Perfect
                  starting point for Python programming.
                </p>
                <a
                  href="https://docs.python.org/3/tutorial/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-card-link"
                >
                  Learn Python Free →
                </a>
              </div>
              <div className="resource-card purple">
                <h4 className="resource-card-title">
                  🎨 Google Digital Garage
                </h4>
                <p className="resource-card-description">
                  FREE courses in digital marketing, data science, and career
                  development with Google certification.
                </p>
                <a
                  href="https://learndigital.withgoogle.com/digitalgarage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-card-link"
                >
                  Get Certified Free →
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
