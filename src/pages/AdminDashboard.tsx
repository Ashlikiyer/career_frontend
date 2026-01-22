/**
 * Admin Analytics Dashboard
 *
 * Provides aggregated analytics for administrators and researchers.
 * All data is anonymized for research purposes.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cookies } from "react-cookie";
import {
  getOverviewStats,
  getTimeAnalytics,
  getAssessmentAnalytics,
  getDropoffAnalytics,
  getDifficultyAnalytics,
  getCareerAnalytics,
  OverviewStats,
  TimeAnalytics,
  AssessmentAnalytics,
  DropoffAnalytics,
  DifficultyAnalytics,
  CareerAnalytics,
} from "../../services/adminService";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import "./AdminDashboard.css";

// Color palette for charts
const COLORS = {
  primary: "#6366f1",
  secondary: "#8b5cf6",
  success: "#22c55e",
  warning: "#eab308",
  danger: "#ef4444",
  info: "#3b82f6",
  beginner: "#22c55e",
  intermediate: "#eab308",
  advanced: "#ef4444",
};

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#22c55e", "#eab308", "#ef4444"];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const cookies = new Cookies();
  const authToken = cookies.get("authToken");

  // State for all analytics data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Analytics data
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [timeAnalytics, setTimeAnalytics] = useState<TimeAnalytics | null>(
    null
  );
  const [assessmentAnalytics, setAssessmentAnalytics] =
    useState<AssessmentAnalytics | null>(null);
  const [dropoffAnalytics, setDropoffAnalytics] =
    useState<DropoffAnalytics | null>(null);
  const [difficultyAnalytics, setDifficultyAnalytics] =
    useState<DifficultyAnalytics | null>(null);
  const [careerAnalytics, setCareerAnalytics] =
    useState<CareerAnalytics | null>(null);

  // Check auth and load data
  useEffect(() => {
    if (!authToken) {
      navigate("/login");
      return;
    }
    loadAnalytics();
  }, [authToken, navigate]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all analytics data in parallel
      const [
        overviewRes,
        timeRes,
        assessmentRes,
        dropoffRes,
        difficultyRes,
        careerRes,
      ] = await Promise.all([
        getOverviewStats(),
        getTimeAnalytics(),
        getAssessmentAnalytics(),
        getDropoffAnalytics(),
        getDifficultyAnalytics(),
        getCareerAnalytics(),
      ]);

      if (overviewRes.success) setOverview(overviewRes.data);
      if (timeRes.success) setTimeAnalytics(timeRes.data);
      if (assessmentRes.success) setAssessmentAnalytics(assessmentRes.data);
      if (dropoffRes.success) setDropoffAnalytics(dropoffRes.data);
      if (difficultyRes.success) setDifficultyAnalytics(difficultyRes.data);
      if (careerRes.success) setCareerAnalytics(careerRes.data);
    } catch (err: unknown) {
      console.error("Failed to load analytics:", err);
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { status?: number } };
        if (axiosError.response?.status === 403) {
          setError(
            "Access denied. You need admin privileges to view this page."
          );
        } else {
          setError("Failed to load analytics data. Please try again.");
        }
      } else {
        setError("Failed to load analytics data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Tab navigation
  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "time", label: "Time Analytics", icon: "⏱️" },
    { id: "assessments", label: "Assessments", icon: "📝" },
    { id: "dropoff", label: "Dropoff Analysis", icon: "📉" },
    { id: "difficulty", label: "Difficulty", icon: "🎯" },
    { id: "careers", label: "Careers", icon: "💼" },
  ];

  // Render loading skeleton
  const renderSkeleton = () => (
    <div className="admin-skeleton">
      <div className="skeleton-row">
        <Skeleton className="skeleton-card" />
        <Skeleton className="skeleton-card" />
        <Skeleton className="skeleton-card" />
        <Skeleton className="skeleton-card" />
      </div>
      <Skeleton className="skeleton-chart" />
    </div>
  );

  // Render error state
  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="admin-error">
          <h2>⚠️ Access Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate("/dashboard")} className="back-btn">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render Overview Tab
  const renderOverview = () => {
    if (!overview) return renderSkeleton();

    const completionData = [
      {
        name: "Completed",
        value: overview.completedSteps,
        color: COLORS.success,
      },
      {
        name: "In Progress",
        value: overview.totalSteps - overview.completedSteps,
        color: COLORS.warning,
      },
    ];

    return (
      <div className="admin-tab-content">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>{overview.totalUsers.toLocaleString()}</h3>
              <p>Total Users</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🗺️</div>
            <div className="stat-info">
              <h3>{overview.totalRoadmapsStarted.toLocaleString()}</h3>
              <p>Roadmaps Started</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>{overview.completionRate}%</h3>
              <p>Completion Rate</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-info">
              <h3>{overview.totalTimeFormatted}</h3>
              <p>Total Time Tracked</p>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="charts-row">
          {/* Completion Pie Chart */}
          <div className="chart-card">
            <h3>Step Completion Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={completionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {completionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Additional Stats */}
          <div className="chart-card stats-list">
            <h3>Additional Metrics</h3>
            <ul>
              <li>
                <span className="label">Active Users (completed ≥1 step)</span>
                <span className="value">
                  {overview.activeUsers.toLocaleString()}
                </span>
              </li>
              <li>
                <span className="label">Completed Roadmaps</span>
                <span className="value">
                  {overview.completedRoadmaps.toLocaleString()}
                </span>
              </li>
              <li>
                <span className="label">Users with Profiles</span>
                <span className="value">
                  {overview.usersWithProfiles.toLocaleString()}
                </span>
              </li>
              <li>
                <span className="label">Total Steps</span>
                <span className="value">
                  {overview.totalSteps.toLocaleString()}
                </span>
              </li>
              <li>
                <span className="label">Completed Steps</span>
                <span className="value">
                  {overview.completedSteps.toLocaleString()}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  // Render Time Analytics Tab
  const renderTimeAnalytics = () => {
    if (!timeAnalytics) return renderSkeleton();

    const difficultyOrder = ["beginner", "intermediate", "advanced"];
    const sortedTimePerDifficulty = [
      ...(timeAnalytics.timePerDifficulty || []),
    ].sort(
      (a, b) =>
        difficultyOrder.indexOf(a.difficulty) -
        difficultyOrder.indexOf(b.difficulty)
    );

    return (
      <div className="admin-tab-content">
        {/* Time per Step Chart */}
        <div className="chart-card full-width">
          <h3>Average Time Spent per Step</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={timeAnalytics.timePerStep}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="step_number"
                label={{ value: "Step", position: "bottom" }}
              />
              <YAxis
                label={{ value: "Minutes", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                formatter={(value: number) => [`${value} min`, "Avg Time"]}
                labelFormatter={(label) => `Step ${label}`}
              />
              <Bar
                dataKey="avg_minutes"
                fill={COLORS.primary}
                name="Avg Minutes"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="charts-row">
          {/* Time per Difficulty */}
          <div className="chart-card">
            <h3>Average Time by Difficulty</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sortedTimePerDifficulty}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="difficulty" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [`${value} min`, "Avg Time"]}
                />
                <Bar dataKey="avg_minutes">
                  {sortedTimePerDifficulty.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        COLORS[entry.difficulty as keyof typeof COLORS] ||
                        COLORS.primary
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Estimated vs Actual */}
          <div className="chart-card">
            <h3>Estimated vs Actual Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeAnalytics.estimatedVsActual}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="step_number"
                  label={{ value: "Step", position: "bottom" }}
                />
                <YAxis
                  label={{
                    value: "Minutes",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="avg_estimated_minutes"
                  fill={COLORS.info}
                  name="Estimated"
                />
                <Bar
                  dataKey="avg_actual_minutes"
                  fill={COLORS.success}
                  name="Actual"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  // Render Assessment Analytics Tab
  const renderAssessmentAnalytics = () => {
    if (!assessmentAnalytics) return renderSkeleton();

    const passFailData = [
      {
        name: "Passed",
        value: assessmentAnalytics.passedAssessments,
        color: COLORS.success,
      },
      {
        name: "Failed",
        value: assessmentAnalytics.failedAssessments,
        color: COLORS.danger,
      },
    ];

    return (
      <div className="admin-tab-content">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-info">
              <h3>{assessmentAnalytics.totalAssessments.toLocaleString()}</h3>
              <p>Total Assessments</p>
            </div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>{assessmentAnalytics.passRate}%</h3>
              <p>Pass Rate</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>{assessmentAnalytics.avgScore}%</h3>
              <p>Average Score</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔄</div>
            <div className="stat-info">
              <h3>{assessmentAnalytics.retakeStats.usersWithRetakes}</h3>
              <p>Users with Retakes</p>
            </div>
          </div>
        </div>

        <div className="charts-row">
          {/* Pass/Fail Pie Chart */}
          <div className="chart-card">
            <h3>Pass vs Fail Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={passFailData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {passFailData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Score Distribution */}
          <div className="chart-card">
            <h3>Score Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={assessmentAnalytics.scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pass Rate by Step */}
        <div className="chart-card full-width">
          <h3>Pass Rate by Step</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={assessmentAnalytics.passRateByStep}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="step_number"
                label={{ value: "Step", position: "bottom" }}
              />
              <YAxis
                domain={[0, 100]}
                label={{
                  value: "Pass Rate %",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                formatter={(value: number) => [`${value}%`, "Pass Rate"]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="pass_rate"
                stroke={COLORS.success}
                strokeWidth={2}
                name="Pass Rate %"
                dot={{ fill: COLORS.success }}
              />
              <Line
                type="monotone"
                dataKey="avg_score"
                stroke={COLORS.info}
                strokeWidth={2}
                name="Avg Score %"
                dot={{ fill: COLORS.info }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render Dropoff Analytics Tab
  const renderDropoffAnalytics = () => {
    if (!dropoffAnalytics) return renderSkeleton();

    return (
      <div className="admin-tab-content">
        {/* Key Insight */}
        {dropoffAnalytics.highestDropoffStep && (
          <div className="insight-card">
            <h3>🔍 Key Insight</h3>
            <p>
              <strong>
                Step {dropoffAnalytics.highestDropoffStep.step_number}
              </strong>{" "}
              has the highest dropoff rate at{" "}
              <strong>
                {dropoffAnalytics.highestDropoffStep.dropoff_rate}%
              </strong>
              . Consider reviewing this step's content and difficulty.
            </p>
          </div>
        )}

        {/* Dropoff by Step */}
        <div className="chart-card full-width">
          <h3>Dropoff Rate by Step</h3>
          <p className="chart-subtitle">
            Percentage of users who started but abandoned each step
          </p>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={dropoffAnalytics.dropoffByStep}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="step_number"
                label={{ value: "Step", position: "bottom" }}
              />
              <YAxis
                domain={[0, 100]}
                label={{
                  value: "Dropoff Rate %",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                formatter={(value: number) => [`${value}%`, "Dropoff Rate"]}
              />
              <Area
                type="monotone"
                dataKey="dropoff_rate"
                stroke={COLORS.danger}
                fill={COLORS.danger}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="charts-row">
          {/* Stopped At Distribution */}
          <div className="chart-card">
            <h3>Where Users Stopped</h3>
            <p className="chart-subtitle">Last completed step distribution</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dropoffAnalytics.stoppedAtDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="step"
                  label={{ value: "Last Step", position: "bottom" }}
                />
                <YAxis
                  label={{ value: "Users", angle: -90, position: "insideLeft" }}
                />
                <Tooltip formatter={(value: number) => [value, "Users"]} />
                <Bar dataKey="count" fill={COLORS.warning} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stats */}
          <div className="chart-card stats-list">
            <h3>Dropoff Metrics</h3>
            <ul>
              <li>
                <span className="label">Average Last Completed Step</span>
                <span className="value">
                  {dropoffAnalytics.avgLastCompletedStep}
                </span>
              </li>
              {dropoffAnalytics.dropoffByStep.map((step) => (
                <li key={step.step_number}>
                  <span className="label">Step {step.step_number}</span>
                  <span className="value">
                    {step.completed}/{step.total_started} completed
                    <span
                      className={`rate ${
                        step.dropoff_rate > 30 ? "high" : "low"
                      }`}
                    >
                      {step.dropoff_rate}% dropoff
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  // Render Difficulty Analytics Tab
  const renderDifficultyAnalytics = () => {
    if (!difficultyAnalytics) return renderSkeleton();

    const difficultyOrder = ["beginner", "intermediate", "advanced"];
    const sortedCompletion = [
      ...(difficultyAnalytics.completionByDifficulty || []),
    ].sort(
      (a, b) =>
        difficultyOrder.indexOf(a.difficulty) -
        difficultyOrder.indexOf(b.difficulty)
    );

    return (
      <div className="admin-tab-content">
        {/* Completion by Difficulty */}
        <div className="chart-card full-width">
          <h3>Completion Rate by Difficulty</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={sortedCompletion}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="difficulty" />
              <YAxis
                domain={[0, 100]}
                label={{
                  value: "Completion Rate %",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                formatter={(value: number) => [`${value}%`, "Completion Rate"]}
              />
              <Legend />
              <Bar dataKey="completion_rate" name="Completion Rate">
                {sortedCompletion.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      COLORS[entry.difficulty as keyof typeof COLORS] ||
                      COLORS.primary
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="charts-row">
          {/* Difficulty Stats Table */}
          <div className="chart-card full-width">
            <h3>Detailed Difficulty Breakdown</h3>
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Difficulty</th>
                  <th>Total Steps</th>
                  <th>Completed</th>
                  <th>Completion Rate</th>
                  <th>Avg Time</th>
                </tr>
              </thead>
              <tbody>
                {sortedCompletion.map((item) => (
                  <tr key={item.difficulty}>
                    <td>
                      <span className={`difficulty-badge ${item.difficulty}`}>
                        {item.difficulty.charAt(0).toUpperCase() +
                          item.difficulty.slice(1)}
                      </span>
                    </td>
                    <td>{item.total_steps.toLocaleString()}</td>
                    <td>{item.completed.toLocaleString()}</td>
                    <td>
                      <div className="progress-bar-container">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${item.completion_rate}%`,
                            backgroundColor:
                              COLORS[item.difficulty as keyof typeof COLORS],
                          }}
                        />
                        <span>{item.completion_rate}%</span>
                      </div>
                    </td>
                    <td>{item.avg_time_formatted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assessment by Difficulty */}
        {difficultyAnalytics.assessmentByDifficulty &&
          difficultyAnalytics.assessmentByDifficulty.length > 0 && (
            <div className="chart-card full-width">
              <h3>Assessment Performance by Difficulty</h3>
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Difficulty</th>
                    <th>Total Assessments</th>
                    <th>Passed</th>
                    <th>Pass Rate</th>
                    <th>Avg Score</th>
                  </tr>
                </thead>
                <tbody>
                  {difficultyAnalytics.assessmentByDifficulty.map((item) => (
                    <tr key={item.difficulty}>
                      <td>
                        <span className={`difficulty-badge ${item.difficulty}`}>
                          {item.difficulty?.charAt(0).toUpperCase() +
                            item.difficulty?.slice(1)}
                        </span>
                      </td>
                      <td>{item.total_assessments.toLocaleString()}</td>
                      <td>{item.passed.toLocaleString()}</td>
                      <td>{item.pass_rate}%</td>
                      <td>{item.avg_score}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    );
  };

  // Render Career Analytics Tab
  const renderCareerAnalytics = () => {
    if (!careerAnalytics) return renderSkeleton();

    return (
      <div className="admin-tab-content">
        {/* Popular Careers Chart */}
        <div className="chart-card full-width">
          <h3>Most Popular Careers</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={careerAnalytics.popularCareers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="career_name" width={200} />
              <Tooltip formatter={(value: number) => [value, "Users"]} />
              <Bar dataKey="total_users" fill={COLORS.primary}>
                {careerAnalytics.popularCareers.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Career Completion Rates Table */}
        <div className="chart-card full-width">
          <h3>Career Completion Statistics</h3>
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Career</th>
                <th>Users</th>
                <th>Total Steps</th>
                <th>Completed Steps</th>
                <th>Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              {careerAnalytics.careerCompletionRates
                .slice(0, 10)
                .map((career) => (
                  <tr key={career.career_name}>
                    <td className="career-name">{career.career_name}</td>
                    <td>{career.users.toLocaleString()}</td>
                    <td>{career.total_steps.toLocaleString()}</td>
                    <td>{career.completed_steps.toLocaleString()}</td>
                    <td>
                      <div className="progress-bar-container">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${career.completion_rate}%`,
                            backgroundColor:
                              career.completion_rate >= 50
                                ? COLORS.success
                                : COLORS.warning,
                          }}
                        />
                        <span>{career.completion_rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "time":
        return renderTimeAnalytics();
      case "assessments":
        return renderAssessmentAnalytics();
      case "dropoff":
        return renderDropoffAnalytics();
      case "difficulty":
        return renderDifficultyAnalytics();
      case "careers":
        return renderCareerAnalytics();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="header-left">
          <button onClick={() => navigate("/dashboard")} className="back-btn">
            ← Back to Dashboard
          </button>
          <h1>📊 Analytics Dashboard</h1>
          <span className="admin-badge">Admin</span>
        </div>
        <div className="header-right">
          <button
            onClick={loadAnalytics}
            className="refresh-btn"
            disabled={loading}
          >
            🔄 Refresh Data
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="admin-content">
        {loading ? renderSkeleton() : renderTabContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;
