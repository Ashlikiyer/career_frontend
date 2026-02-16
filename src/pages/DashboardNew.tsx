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
import "./DashboardNew.css";

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
  const [savedCareers, setSavedCareers] = useState<SavedCareer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
      setError((err as Error).message || "Failed to load saved careers.");
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
      setError(null);
      setSuccess(null);
      const response = await deleteCareer(savedCareerId);
      setSavedCareers(
        savedCareers.filter(
          (career) => career.saved_career_id !== savedCareerId,
        ),
      );

      const deletedSteps = response.roadmapStepsDeleted || 0;
      if (deletedSteps > 0) {
        setSuccess(
          `${careerName} deleted successfully. ${deletedSteps} learning steps removed.`,
        );
      } else {
        setSuccess(`${careerName} deleted successfully.`);
      }

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
      setTimeout(() => setError(null), 4000);
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
      <div className="dashboard-new">
        <div className="dashboard-bg-gradient"></div>
        <div className="dashboard-content">
          {/* Header Skeleton */}
          <div className="dashboard-header-new">
            <Skeleton className="h-10 w-48 bg-gray-200 rounded-lg" />
            <Skeleton className="h-12 w-48 bg-gray-200 rounded-xl" />
          </div>

          {/* Stats Skeleton */}
          <div className="stats-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="stat-card">
                <Skeleton className="h-6 w-32 mb-3 bg-gray-200 rounded" />
                <Skeleton className="h-12 w-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>

          {/* Table Skeleton */}
          <div className="career-collection-card">
            <Skeleton className="h-8 w-64 mb-2 bg-gray-200 rounded" />
            <Skeleton className="h-4 w-96 mb-6 bg-gray-200 rounded" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  className="h-16 w-full bg-gray-200 rounded-lg"
                />
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
    <div className="dashboard-new">
      {/* Animated Background */}
      <div className="dashboard-bg-gradient"></div>

      <div className="dashboard-content">
        {/* Success/Error Messages */}
        {success && (
          <div className="alert-success">
            <svg
              className="alert-icon"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="alert-error">
            <svg
              className="alert-icon"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Header */}
        <div className="dashboard-header-new">
          <h1 className="dashboard-title-new">Dashboard</h1>
          <button
            onClick={handleStartAssessment}
            className="btn-take-assessment"
          >
            Take Another Assessment
          </button>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Total Saved Careers</span>
              <div className="stat-value">{totalCareers}</div>
            </div>
            <div className="stat-icon blue">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">In Progress</span>
              <div className="stat-value">{inProgressCareers}</div>
            </div>
            <div className="stat-icon yellow">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Completed</span>
              <div className="stat-value">{completedCareers}</div>
            </div>
            <div className="stat-icon green">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Career Collection */}
        <div className="career-collection-card">
          <div className="collection-header">
            <div>
              <h2 className="collection-title">
                <svg
                  className="collection-icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
                Your Career Collection
              </h2>
              <p className="collection-subtitle">
                Explore your saved careers with automatically generated learning
                roadmaps
              </p>
            </div>
          </div>

          {savedCareers.length === 0 ? (
            <div className="empty-state-new">
              <div className="empty-icon-new">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3>No saved careers yet</h3>
              <p>Take the assessment to discover your career path!</p>
              <button
                onClick={handleStartAssessment}
                className="btn-start-assessment"
              >
                Start Assessment
              </button>
            </div>
          ) : (
            <div className="career-table">
              <div className="table-header">
                <div className="th-career">Career Path</div>
                <div className="th-status">Status</div>
                <div className="th-progress">Progress</div>
                <div className="th-date">Saved Date</div>
                <div className="th-roadmap">Roadmap</div>
                <div className="th-actions">Actions</div>
              </div>

              <div className="table-body">
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
                    <div key={career.saved_career_id} className="table-row">
                      <div className="td-career">
                        <div className="career-info">
                          <span className="career-name">
                            {career.career_name}
                          </span>
                          <span className="career-category">
                            {careerCategories[career.career_name] ||
                              "Technology"}
                          </span>
                        </div>
                      </div>

                      <div className="td-status">
                        <span className={`status-badge ${status}`}>
                          {status === "completed" && (
                            <svg
                              className="status-icon"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                          {status === "in-progress" && (
                            <svg
                              className="status-icon"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                          {getStatusLabel(status)}
                        </span>
                      </div>

                      <div className="td-progress">
                        <div className="progress-wrapper">
                          <div className="progress-bar-bg">
                            <div
                              className={`progress-bar-fill ${status}`}
                              style={{ width: `${progressPercent}%` }}
                            ></div>
                          </div>
                          <span className="progress-text">
                            {career.progress?.completed_steps || 0}/
                            {career.progress?.total_steps || 10} steps
                          </span>
                        </div>
                      </div>

                      <div className="td-date">
                        <svg
                          className="date-icon"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {new Date(career.saved_at).toLocaleDateString()}
                      </div>

                      <div className="td-roadmap">
                        <span className="roadmap-tag">Auto-generated</span>
                      </div>

                      <div className="td-actions">
                        <button
                          onClick={() =>
                            handleViewRoadmap(
                              career.saved_career_id,
                              career.career_name,
                            )
                          }
                          className="btn-start-learning"
                        >
                          Start Learning
                          <svg
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
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
                              className="btn-delete"
                              title="Delete career"
                            >
                              <svg
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white border-gray-200">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-gray-900">
                                Delete Career?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-600">
                                This will permanently delete "
                                {careerToDelete?.careerName}" and all your
                                learning progress. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300">
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
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Where to Learn Section */}
        <div className="learn-section">
          <div className="learn-header">
            <div className="learn-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div>
              <h2 className="learn-title">Where to Learn?</h2>
              <p className="learn-subtitle">
                Start learning today with these top-rated FREE platforms trusted
                by millions of learners worldwide
              </p>
            </div>
          </div>

          <div className="platforms-grid">
            <div className="platform-card freecodecamp">
              <div className="platform-icon">
                <span>🔥</span>
              </div>
              <h3 className="platform-name">FreeCodeCamp</h3>
              <p className="platform-desc">
                100% FREE certifications in web development, data science,
                Python, and more.
              </p>
              <a
                href="https://www.freecodecamp.org"
                target="_blank"
                rel="noopener noreferrer"
                className="platform-link"
              >
                Start Learning Free →
              </a>
            </div>

            <div className="platform-card codecademy">
              <div className="platform-icon">
                <span>💻</span>
              </div>
              <h3 className="platform-name">Codecademy (Free)</h3>
              <p className="platform-desc">
                Interactive coding lessons FREE for beginners. Learn Python,
                JavaScript, HTML/CSS, SQL, and more.
              </p>
              <a
                href="https://www.codecademy.com/catalog/subject/all"
                target="_blank"
                rel="noopener noreferrer"
                className="platform-link"
              >
                Browse Free Courses →
              </a>
            </div>

            <div className="platform-card coursera">
              <div className="platform-icon">
                <span>📚</span>
              </div>
              <h3 className="platform-name">Coursera (Free Audit)</h3>
              <p className="platform-desc">
                Audit courses FREE from top universities (Stanford, Yale, MIT).
                Pay only if you want certificates.
              </p>
              <a
                href="https://www.coursera.org/courses?query=free"
                target="_blank"
                rel="noopener noreferrer"
                className="platform-link"
              >
                Explore Free Courses →
              </a>
            </div>

            <div className="platform-card odin">
              <div className="platform-icon">
                <span>🌐</span>
              </div>
              <h3 className="platform-name">The Odin Project</h3>
              <p className="platform-desc">
                Completely FREE full-stack web development curriculum. From zero
                to job-ready developer.
              </p>
              <a
                href="https://www.theodinproject.com"
                target="_blank"
                rel="noopener noreferrer"
                className="platform-link"
              >
                Start Full Course →
              </a>
            </div>

            <div className="platform-card khan">
              <div className="platform-icon">
                <span>🎓</span>
              </div>
              <h3 className="platform-name">Khan Academy</h3>
              <p className="platform-desc">
                FREE courses in computer programming, computer science, and
                algorithms. Perfect for all ages.
              </p>
              <a
                href="https://www.khanacademy.org/computing"
                target="_blank"
                rel="noopener noreferrer"
                className="platform-link"
              >
                Learn for Free →
              </a>
            </div>

            <div className="platform-card mdn">
              <div className="platform-icon">
                <span>📖</span>
              </div>
              <h3 className="platform-name">MDN Web Docs</h3>
              <p className="platform-desc">
                FREE comprehensive web development documentation and tutorials.
                The gold standard for web developers.
              </p>
              <a
                href="https://developer.mozilla.org/en-US/docs/Learn"
                target="_blank"
                rel="noopener noreferrer"
                className="platform-link"
              >
                Start Learning →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Chatbot */}
      <FloatingChatbot position="bottom-right" />
    </div>
  );
};

export default DashboardNew;
