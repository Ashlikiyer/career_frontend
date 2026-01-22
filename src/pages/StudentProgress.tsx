/**
 * Student Progress Dashboard
 *
 * Personalized learning progress dashboard for individual students.
 * Displays current learning path, step status, time tracking, and assessments.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cookies } from "react-cookie";
import {
  getStudentProgress,
  getLearningStats,
  StudentProgressData,
  LearningStats,
  CareerProgress,
  StepProgress,
} from "../../services/studentProgressService";
import { Skeleton } from "@/components/ui/skeleton";
import "./StudentProgress.css";

// Difficulty badge component
const DifficultyBadge = ({ level }: { level: string }) => {
  const labels: { [key: string]: string } = {
    beginner: "🟢 Beginner",
    intermediate: "🟡 Intermediate",
    advanced: "🔴 Advanced",
  };
  return (
    <span className={`difficulty-badge ${level}`}>
      {labels[level] || level}
    </span>
  );
};

// Step status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const icons: { [key: string]: string } = {
    completed: "✅",
    "in-progress": "🔄",
    locked: "🔒",
  };
  const labels: { [key: string]: string } = {
    completed: "Completed",
    "in-progress": "In Progress",
    locked: "Locked",
  };
  return (
    <span className={`status-badge ${status}`}>
      {icons[status]} {labels[status]}
    </span>
  );
};

// Progress ring component
const ProgressRing = ({
  percent,
  size = 120,
}: {
  percent: number;
  size?: number;
}) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div
      className="progress-ring-container"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size}>
        <circle
          className="progress-ring-bg"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="progress-ring-fill"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
          }}
        />
      </svg>
      <div className="progress-ring-text">
        <span className="percent">{percent}%</span>
        <span className="label">Complete</span>
      </div>
    </div>
  );
};

const StudentProgress = () => {
  const navigate = useNavigate();
  const cookies = new Cookies();
  const authToken = cookies.get("authToken");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<StudentProgressData | null>(
    null,
  );
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<CareerProgress | null>(
    null,
  );
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  // Check auth and load data
  useEffect(() => {
    if (!authToken) {
      navigate("/login");
      return;
    }
    loadProgress();
  }, [authToken, navigate]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      setError(null);

      const [progressRes, statsRes] = await Promise.all([
        getStudentProgress(),
        getLearningStats(),
      ]);

      if (progressRes.success) {
        setProgressData(progressRes.data);
        if (progressRes.data.careers.length > 0) {
          setSelectedCareer(progressRes.data.careers[0]);
        }
      }

      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (err: unknown) {
      console.error("Failed to load progress:", err);
      setError("Failed to load your progress data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleStepExpand = (stepId: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  // Render loading skeleton
  const renderSkeleton = () => (
    <div className="progress-skeleton">
      <div className="skeleton-header">
        <Skeleton className="skeleton-title" />
        <Skeleton className="skeleton-subtitle" />
      </div>
      <div className="skeleton-grid">
        <Skeleton className="skeleton-card large" />
        <Skeleton className="skeleton-card" />
        <Skeleton className="skeleton-card" />
        <Skeleton className="skeleton-card" />
      </div>
      <Skeleton className="skeleton-timeline" />
    </div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <div className="empty-state">
      <div className="empty-icon">🎯</div>
      <h2>No Learning Paths Yet</h2>
      <p>
        Start your learning journey by taking the career assessment and choosing
        a career path!
      </p>
      <button onClick={() => navigate("/assessment")} className="start-btn">
        Take Career Assessment
      </button>
    </div>
  );

  // Render step card
  const renderStepCard = (step: StepProgress) => {
    const isExpanded = expandedSteps.has(step.step_id);

    return (
      <div
        key={step.step_id}
        className={`step-card ${step.status} ${isExpanded ? "expanded" : ""}`}
        onClick={() => toggleStepExpand(step.step_id)}
      >
        <div className="step-header">
          <div className="step-number">
            {step.status === "completed" ? "✓" : step.step_number}
          </div>
          <div className="step-info">
            <h4>{step.title}</h4>
            <div className="step-meta">
              <DifficultyBadge level={step.difficulty_level} />
              <StatusBadge status={step.status} />
              {step.time_spent_minutes > 0 && (
                <span className="time-badge">
                  ⏱️ {step.time_spent_formatted}
                </span>
              )}
            </div>
          </div>
          <div className="step-expand-icon">{isExpanded ? "▼" : "▶"}</div>
        </div>

        {isExpanded && (
          <div className="step-details">
            <p className="step-description">{step.description}</p>

            <div className="step-stats">
              <div className="stat">
                <span className="label">Duration</span>
                <span className="value">{step.duration || "N/A"}</span>
              </div>
              <div className="stat">
                <span className="label">Time Spent</span>
                <span className="value">
                  {step.time_spent_formatted || "0m"}
                </span>
              </div>
              <div className="stat">
                <span className="label">Assessment</span>
                <span
                  className={`value ${step.assessment.passed ? "passed" : step.assessment.completed ? "failed" : ""}`}
                >
                  {step.assessment.completed
                    ? step.assessment.passed
                      ? `✅ Passed (${step.assessment.score}%)`
                      : `❌ Failed (${step.assessment.score}%)`
                    : "⏳ Not taken"}
                </span>
              </div>
            </div>

            {step.started_at && (
              <div className="step-dates">
                <span>
                  Started: {new Date(step.started_at).toLocaleDateString()}
                </span>
                {step.completed_at && (
                  <span>
                    Completed:{" "}
                    {new Date(step.completed_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render main content
  const renderContent = () => {
    if (!progressData || !progressData.hasProgress) {
      return renderEmptyState();
    }

    return (
      <div className="progress-content">
        {/* Summary Section */}
        <section className="summary-section">
          <div className="summary-header">
            <div className="summary-left">
              <h2>Your Learning Journey</h2>
              {stats?.streak && stats.streak.current > 0 && (
                <div className="streak-badge">{stats.streak.message}</div>
              )}
            </div>
            <div className="summary-ring">
              <ProgressRing percent={progressData.summary.overallProgress} />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-content">
                <span className="stat-value">
                  {progressData.summary.totalCareers}
                </span>
                <span className="stat-label">Learning Paths</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <span className="stat-value">
                  {progressData.summary.completedSteps}/
                  {progressData.summary.totalSteps}
                </span>
                <span className="stat-label">Steps Completed</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-content">
                <span className="stat-value">
                  {progressData.summary.totalTimeFormatted}
                </span>
                <span className="stat-label">Total Time</span>
              </div>
            </div>
            {stats && (
              <div className="stat-card">
                <div className="stat-icon">📝</div>
                <div className="stat-content">
                  <span className="stat-value">
                    {stats.assessments.passRate}%
                  </span>
                  <span className="stat-label">Pass Rate</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Career Selector */}
        {progressData.careers.length > 1 && (
          <section className="career-selector">
            <h3>Select Learning Path</h3>
            <div className="career-tabs">
              {progressData.careers.map((career) => (
                <button
                  key={career.saved_career_id}
                  className={`career-tab ${selectedCareer?.saved_career_id === career.saved_career_id ? "active" : ""}`}
                  onClick={() => setSelectedCareer(career)}
                >
                  <span className="career-name">{career.career_name}</span>
                  <span className="career-progress">
                    {career.progress_percent}%
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Selected Career Progress */}
        {selectedCareer && (
          <section className="career-progress-section">
            <div className="career-header">
              <div className="career-info">
                <h3>{selectedCareer.career_name}</h3>
                <p>
                  {selectedCareer.is_completed
                    ? "🎉 Congratulations! You have completed this learning path!"
                    : selectedCareer.current_step
                      ? `Currently on: Step ${selectedCareer.current_step.step_number} - ${selectedCareer.current_step.title}`
                      : "Ready to start your journey!"}
                </p>
              </div>
              <div className="career-stats">
                <div className="progress-bar-wrapper">
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${selectedCareer.progress_percent}%` }}
                    />
                  </div>
                  <span className="progress-text">
                    {selectedCareer.completed_steps} of{" "}
                    {selectedCareer.total_steps} steps
                  </span>
                </div>
              </div>
            </div>

            {/* Difficulty Breakdown */}
            <div className="difficulty-breakdown">
              <h4>Difficulty Distribution</h4>
              <div className="difficulty-bars">
                <div className="difficulty-item beginner">
                  <span className="difficulty-label">🟢 Beginner</span>
                  <div className="difficulty-bar">
                    <div
                      className="difficulty-fill"
                      style={{
                        width: `${(selectedCareer.difficulty_breakdown.beginner / selectedCareer.total_steps) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="difficulty-count">
                    {selectedCareer.difficulty_breakdown.beginner}
                  </span>
                </div>
                <div className="difficulty-item intermediate">
                  <span className="difficulty-label">🟡 Intermediate</span>
                  <div className="difficulty-bar">
                    <div
                      className="difficulty-fill"
                      style={{
                        width: `${(selectedCareer.difficulty_breakdown.intermediate / selectedCareer.total_steps) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="difficulty-count">
                    {selectedCareer.difficulty_breakdown.intermediate}
                  </span>
                </div>
                <div className="difficulty-item advanced">
                  <span className="difficulty-label">🔴 Advanced</span>
                  <div className="difficulty-bar">
                    <div
                      className="difficulty-fill"
                      style={{
                        width: `${(selectedCareer.difficulty_breakdown.advanced / selectedCareer.total_steps) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="difficulty-count">
                    {selectedCareer.difficulty_breakdown.advanced}
                  </span>
                </div>
              </div>
            </div>

            {/* Steps Timeline */}
            <div className="steps-timeline">
              <h4>Learning Steps</h4>
              <div className="steps-list">
                {selectedCareer.steps.map((step) => renderStepCard(step))}
              </div>
            </div>

            {/* Continue Learning Button */}
            {!selectedCareer.is_completed && selectedCareer.current_step && (
              <div className="continue-section">
                <button
                  className="continue-btn"
                  onClick={() => navigate(`/dashboard`)}
                >
                  Continue Learning →
                </button>
              </div>
            )}
          </section>
        )}

        {/* Learning Stats Section */}
        {stats && (
          <section className="learning-stats-section">
            <h3>📊 Detailed Statistics</h3>
            <div className="detailed-stats-grid">
              {/* Time Stats */}
              <div className="detailed-stat-card">
                <h4>⏱️ Time Investment</h4>
                <ul>
                  <li>
                    <span>Total Learning Time</span>
                    <strong>{stats.time.totalFormatted}</strong>
                  </li>
                  <li>
                    <span>Average per Step</span>
                    <strong>{stats.time.avgPerStepFormatted}</strong>
                  </li>
                </ul>
              </div>

              {/* Difficulty Stats */}
              <div className="detailed-stat-card">
                <h4>🎯 By Difficulty</h4>
                <ul>
                  <li>
                    <span>🟢 Beginner</span>
                    <strong>
                      {stats.difficulty.beginner.completed}/
                      {stats.difficulty.beginner.total} (
                      {stats.difficulty.beginner.completionRate}%)
                    </strong>
                  </li>
                  <li>
                    <span>🟡 Intermediate</span>
                    <strong>
                      {stats.difficulty.intermediate.completed}/
                      {stats.difficulty.intermediate.total} (
                      {stats.difficulty.intermediate.completionRate}%)
                    </strong>
                  </li>
                  <li>
                    <span>🔴 Advanced</span>
                    <strong>
                      {stats.difficulty.advanced.completed}/
                      {stats.difficulty.advanced.total} (
                      {stats.difficulty.advanced.completionRate}%)
                    </strong>
                  </li>
                </ul>
              </div>

              {/* Assessment Stats */}
              <div className="detailed-stat-card">
                <h4>📝 Assessments</h4>
                <ul>
                  <li>
                    <span>Total Taken</span>
                    <strong>{stats.assessments.total}</strong>
                  </li>
                  <li>
                    <span>Passed</span>
                    <strong className="success">
                      {stats.assessments.passed}
                    </strong>
                  </li>
                  <li>
                    <span>Average Score</span>
                    <strong>{stats.assessments.avgScore}%</strong>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        )}
      </div>
    );
  };

  // Render error state
  if (error) {
    return (
      <div className="student-progress">
        <div className="progress-error">
          <h2>⚠️ Error</h2>
          <p>{error}</p>
          <button onClick={loadProgress} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-progress">
      {/* Header */}
      <header className="progress-header">
        <div className="header-left">
          <h1>📈 My Progress</h1>
          <span className="subtitle">Track your learning journey</span>
        </div>
        <div className="header-right">
          <button
            onClick={loadProgress}
            className="refresh-btn"
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="progress-main">
        {loading ? renderSkeleton() : renderContent()}
      </main>
    </div>
  );
};

export default StudentProgress;
