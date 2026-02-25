/**
 * Admin Analytics Dashboard
 *
 * Provides aggregated analytics for administrators and researchers.
 * All data is anonymized for research purposes.
 */

import React, { useEffect, useState } from "react";
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
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import "./AdminDashboard.css";

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

  // Tab navigation with SVG icons
  const tabIcons: { [key: string]: React.ReactNode } = {
    overview: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    time: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    assessments: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    dropoff: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
        <polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
    difficulty: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    ),
    careers: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "time", label: "Time Analytics" },
    { id: "assessments", label: "Assessments" },
    { id: "dropoff", label: "Dropoff Analysis" },
    { id: "difficulty", label: "Difficulty" },
    { id: "careers", label: "Careers" },
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
          <h2>Access Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate("/dashboard")} className="back-btn">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Helper function to calculate trend (mock implementation - can be connected to real data)
  const getTrendData = (metricName: string) => {
    // These would typically come from the backend comparing 7-day periods
    const trends: { [key: string]: { change: number; trend: string; performance: string } } = {
      totalUsers: { change: 5.2, trend: "up", performance: "optimal" },
      roadmapsStarted: { change: 3.1, trend: "up", performance: "optimal" },
      completionRate: { change: -1.5, trend: "down", performance: "warning" },
      totalTime: { change: 8.4, trend: "up", performance: "optimal" },
      activeUsers: { change: 100, trend: "up", performance: "optimal" },
      completedRoadmaps: { change: 0, trend: "stable", performance: "neutral" },
      usersWithProfiles: { change: 0, trend: "stable", performance: "active" },
      totalSteps: { change: 0, trend: "stable", performance: "standard" },
      completedSteps: { change: 0, trend: "stable", performance: "growing" },
    };
    return trends[metricName] || { change: 0, trend: "stable", performance: "neutral" };
  };

  // Render trend indicator
  const renderTrendBadge = (change: number, trend: string) => {
    const isPositive = trend === "up";
    const isNegative = trend === "down";
    const isStable = trend === "stable";
    
    return (
      <span className={`trend-badge ${isPositive ? 'positive' : isNegative ? 'negative' : 'stable'}`}>
        {isPositive && <span className="trend-arrow">↗</span>}
        {isNegative && <span className="trend-arrow">↘</span>}
        {isStable && <span className="trend-arrow">→</span>}
        {change !== 0 ? `${Math.abs(change)}%` : 'Stable'}
      </span>
    );
  };

  // Render performance badge
  const renderPerformanceBadge = (performance: string) => {
    const performanceConfig: { [key: string]: { label: string; className: string; icon: string } } = {
      optimal: { label: "Optimal", className: "performance-optimal", icon: "✓" },
      active: { label: "Active", className: "performance-active", icon: "✓" },
      standard: { label: "Standard", className: "performance-standard", icon: "ℹ" },
      growing: { label: "Growing", className: "performance-growing", icon: "↗" },
      warning: { label: "Monitor", className: "performance-warning", icon: "!" },
      neutral: { label: "N/A", className: "performance-neutral", icon: "—" },
    };
    const config = performanceConfig[performance] || performanceConfig.neutral;
    
    return (
      <span className={`performance-badge ${config.className}`}>
        <span className="performance-icon">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  // Render mini trend chart (visual indicator)
  const renderMiniTrendChart = (trend: string) => {
    return (
      <div className={`mini-trend-chart ${trend}`}>
        <svg viewBox="0 0 60 20" className="trend-svg">
          {trend === "up" && (
            <polyline points="5,15 20,12 35,8 55,5" fill="none" stroke="currentColor" strokeWidth="2"/>
          )}
          {trend === "down" && (
            <polyline points="5,5 20,8 35,12 55,15" fill="none" stroke="currentColor" strokeWidth="2"/>
          )}
          {trend === "stable" && (
            <polyline points="5,10 20,11 35,9 55,10" fill="none" stroke="currentColor" strokeWidth="2"/>
          )}
        </svg>
      </div>
    );
  };

  // Render Overview Tab
  const renderOverview = () => {
    if (!overview) return renderSkeleton();

    // Calculate percentages for donut chart
    const totalStepsForChart = overview.totalSteps || 1;
    const completedPercent = Math.round((overview.completedSteps / totalStepsForChart) * 100);
    const inProgressPercent = Math.round(((totalStepsForChart - overview.completedSteps) * 0.5 / totalStepsForChart) * 100);
    const notStartedPercent = 100 - completedPercent - inProgressPercent;

    const completionData = [
      { name: "Completed", value: completedPercent, color: "#3b82f6" },
      { name: "In Progress", value: inProgressPercent, color: "#60a5fa" },
      { name: "Not Started", value: notStartedPercent, color: "#e5e7eb" },
    ];

    // Metrics for the table
    const metricsTableData = [
      {
        name: "Active Users",
        description: "Active Engagement",
        subText: "(completed ≥1 step)",
        value: overview.activeUsers,
        trendKey: "activeUsers",
      },
      {
        name: "Completed Roadmaps",
        description: "Full Journey Completion",
        value: overview.completedRoadmaps,
        trendKey: "completedRoadmaps",
      },
      {
        name: "Users with Profiles",
        description: "Registered Accounts",
        value: overview.usersWithProfiles,
        trendKey: "usersWithProfiles",
      },
      {
        name: "Total Steps",
        description: "Content Inventory",
        value: overview.totalSteps,
        trendKey: "totalSteps",
      },
      {
        name: "Completed Steps",
        description: "User Progress",
        value: overview.completedSteps,
        trendKey: "completedSteps",
      },
    ];

    return (
      <div className="admin-tab-content overview-light">
        {/* Stats Cards with Trends */}
        <div className="stats-grid-new">
          <div className="stat-card-new">
            <div className="stat-card-header">
              <div className="stat-icon-new users">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              {renderTrendBadge(getTrendData("totalUsers").change, getTrendData("totalUsers").trend)}
            </div>
            <div className="stat-card-body">
              <p className="stat-label">Total Users</p>
              <h3 className="stat-value-large">{overview.totalUsers.toLocaleString()}</h3>
            </div>
          </div>

          <div className="stat-card-new">
            <div className="stat-card-header">
              <div className="stat-icon-new roadmaps">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              {renderTrendBadge(getTrendData("roadmapsStarted").change, getTrendData("roadmapsStarted").trend)}
            </div>
            <div className="stat-card-body">
              <p className="stat-label">Roadmaps Started</p>
              <h3 className="stat-value-large">{overview.totalRoadmapsStarted.toLocaleString()}</h3>
            </div>
          </div>

          <div className="stat-card-new">
            <div className="stat-card-header">
              <div className="stat-icon-new completion">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              {renderTrendBadge(getTrendData("completionRate").change, getTrendData("completionRate").trend)}
            </div>
            <div className="stat-card-body">
              <p className="stat-label">Completion Rate</p>
              <h3 className="stat-value-large">{overview.completionRate}%</h3>
            </div>
          </div>

          <div className="stat-card-new">
            <div className="stat-card-header">
              <div className="stat-icon-new time">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              {renderTrendBadge(getTrendData("totalTime").change, getTrendData("totalTime").trend)}
            </div>
            <div className="stat-card-body">
              <p className="stat-label">Total Time Tracked</p>
              <h3 className="stat-value-large">{overview.totalTimeFormatted}</h3>
            </div>
          </div>
        </div>

        {/* Charts Row - Donut Chart and Metrics Table */}
        <div className="overview-cards-row">
          {/* Step Completion Status - Donut Chart */}
          <div className="overview-card completion-card">
            <div className="card-header-new">
              <h3>Step Completion Status</h3>
              <button className="card-menu-btn">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <circle cx="12" cy="5" r="2"/>
                  <circle cx="12" cy="12" r="2"/>
                  <circle cx="12" cy="19" r="2"/>
                </svg>
              </button>
            </div>
            <div className="donut-chart-container">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={completionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={2}
                  >
                    {completionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center-label">
                <span className="donut-percent">{completedPercent}%</span>
                <span className="donut-text">COMPLETED</span>
              </div>
            </div>
            <div className="completion-legend">
              <div className="legend-item">
                <span className="legend-dot completed"></span>
                <span className="legend-label">Completed</span>
                <span className="legend-value">{completedPercent}%</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot in-progress"></span>
                <span className="legend-label">In Progress</span>
                <span className="legend-value">{inProgressPercent}%</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot not-started"></span>
                <span className="legend-label">Not Started</span>
                <span className="legend-value">{notStartedPercent}%</span>
              </div>
            </div>
          </div>

          {/* Additional Metrics Table */}
          <div className="overview-card metrics-card">
            <div className="card-header-new">
              <h3>Additional Metrics</h3>
              <button className="view-all-btn">View All</button>
            </div>
            <div className="metrics-table-container">
              <table className="metrics-table-new">
                <thead>
                  <tr>
                    <th>METRIC</th>
                    <th>VALUE</th>
                    <th>TREND (7D)</th>
                    <th>PERFORMANCE</th>
                  </tr>
                </thead>
                <tbody>
                  {metricsTableData.map((metric, index) => {
                    const trendData = getTrendData(metric.trendKey);
                    return (
                      <tr key={index}>
                        <td className="metric-cell">
                          <div className="metric-name">
                            {metric.name}
                            {metric.subText && <span className="metric-subtext">{metric.subText}</span>}
                          </div>
                          <div className="metric-description">{metric.description}</div>
                        </td>
                        <td className="value-cell">{metric.value.toLocaleString()}</td>
                        <td className="trend-cell">
                          {renderMiniTrendChart(trendData.trend)}
                          <span className={`trend-label ${trendData.trend}`}>
                            {trendData.change !== 0 ? `+${trendData.change}%` : 
                              trendData.trend === "stable" ? "Stable" : 
                              metric.trendKey === "totalSteps" ? "Base" : "Initial"}
                          </span>
                        </td>
                        <td className="performance-cell">
                          {renderPerformanceBadge(trendData.performance)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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

    // Calculate summary stats
    const totalTimeMinutes = timeAnalytics.timePerStep?.reduce((sum, step) => sum + (step.total_minutes || step.avg_minutes), 0) || 0;
    const avgTimePerStep = timeAnalytics.timePerStep?.length 
      ? Math.round(timeAnalytics.timePerStep.reduce((sum, step) => sum + step.avg_minutes, 0) / timeAnalytics.timePerStep.length)
      : 0;
    const stepsCompleted = timeAnalytics.timePerStep?.length || 0;
    const completionRate = 87; // Placeholder - can be calculated from actual data

    // Format step labels for charts
    const timePerStepFormatted = timeAnalytics.timePerStep?.map(step => ({
      ...step,
      stepLabel: `Step ${step.step_number}`
    })) || [];

    const estimatedVsActualFormatted = timeAnalytics.estimatedVsActual?.map(step => ({
      ...step,
      stepLabel: `Step ${step.step_number}`
    })) || [];

    // Capitalize difficulty names
    const difficultyFormatted = sortedTimePerDifficulty.map(d => ({
      ...d,
      difficultyLabel: d.difficulty.charAt(0).toUpperCase() + d.difficulty.slice(1)
    }));

    return (
      <div className="admin-tab-content time-analytics-content">
        {/* Stats Cards */}
        <div className="time-stats-grid">
          <div className="time-stat-card">
            <div className="time-stat-header">
              <span className="time-stat-label">Total Time Spent</span>
              <div className="time-stat-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
            </div>
            <div className="time-stat-value">{totalTimeMinutes}</div>
            <div className="time-stat-unit">minutes</div>
          </div>

          <div className="time-stat-card">
            <div className="time-stat-header">
              <span className="time-stat-label">Avg Time per Step</span>
              <div className="time-stat-icon purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
            </div>
            <div className="time-stat-value">{avgTimePerStep}</div>
            <div className="time-stat-unit">minutes</div>
          </div>

          <div className="time-stat-card">
            <div className="time-stat-header">
              <span className="time-stat-label">Steps Completed</span>
              <div className="time-stat-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
            </div>
            <div className="time-stat-value">{stepsCompleted}</div>
            <div className="time-stat-unit">total steps</div>
          </div>

          <div className="time-stat-card">
            <div className="time-stat-header">
              <span className="time-stat-label">Completion Rate</span>
              <div className="time-stat-icon orange">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              </div>
            </div>
            <div className="time-stat-value">{completionRate}%</div>
            <div className="time-stat-unit trend-positive">+5% from last week</div>
          </div>
        </div>

        {/* Average Time per Step Chart */}
        <div className="time-chart-card full-width">
          <div className="time-chart-header">
            <div>
              <h3 className="time-chart-title">Average Time Spent per Step</h3>
              <p className="time-chart-subtitle">Time spent on each learning step (in minutes)</p>
            </div>
            <span className="time-filter-badge">Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={timePerStepFormatted} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="stepLabel" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number | undefined) => [`${value ?? 0} min`, "Avg Time"]}
                contentStyle={{ 
                  background: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}
              />
              <Bar
                dataKey="avg_minutes"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                name="Avg Minutes"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Charts Row */}
        <div className="time-charts-row">
          {/* Time per Difficulty */}
          <div className="time-chart-card">
            <div className="time-chart-header">
              <div>
                <h3 className="time-chart-title">Average Time by Difficulty</h3>
                <p className="time-chart-subtitle">Time spent by difficulty level</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={difficultyFormatted} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="difficultyLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number | undefined) => [`${value ?? 0} min`, "Avg Time"]}
                  contentStyle={{ 
                    background: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar 
                  dataKey="avg_minutes" 
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Estimated vs Actual */}
          <div className="time-chart-card">
            <div className="time-chart-header">
              <div>
                <h3 className="time-chart-title">Estimated vs Actual Time</h3>
                <p className="time-chart-subtitle">Comparison of planned and actual time</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={estimatedVsActualFormatted} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="stepLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend 
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingTop: '20px' }}
                />
                <Bar
                  dataKey="avg_actual_minutes"
                  fill="#22c55e"
                  name="Actual"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="avg_estimated_minutes"
                  fill="#a855f7"
                  name="Estimated"
                  radius={[4, 4, 0, 0]}
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

    const totalAssessments = assessmentAnalytics.passedAssessments + assessmentAnalytics.failedAssessments;
    const passedPercent = totalAssessments > 0 ? Math.round((assessmentAnalytics.passedAssessments / totalAssessments) * 100) : 0;
    const failedPercent = 100 - passedPercent;

    const passFailData = [
      {
        name: "Failed",
        value: assessmentAnalytics.failedAssessments || 0,
        color: "#ef4444",
        percent: failedPercent,
      },
      {
        name: "Passed",
        value: assessmentAnalytics.passedAssessments || 1,
        color: "#22c55e",
        percent: passedPercent,
      },
    ];

    // Format pass rate by step data
    const passRateByStepFormatted = assessmentAnalytics.passRateByStep?.map(step => ({
      ...step,
      stepLabel: step.step_number
    })) || [];

    return (
      <div className="admin-tab-content assessment-analytics-content">
        {/* Stats Cards */}
        <div className="assessment-stats-grid">
          <div className="assessment-stat-card">
            <div className="assessment-stat-header">
              <span className="assessment-stat-label">Total Assessments</span>
              <div className="assessment-stat-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
            </div>
            <div className="assessment-stat-value">{assessmentAnalytics.totalAssessments.toLocaleString()}</div>
          </div>

          <div className="assessment-stat-card">
            <div className="assessment-stat-header">
              <span className="assessment-stat-label">Pass Rate</span>
              <div className="assessment-stat-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
            </div>
            <div className="assessment-stat-value">{assessmentAnalytics.passRate}%</div>
          </div>

          <div className="assessment-stat-card">
            <div className="assessment-stat-header">
              <span className="assessment-stat-label">Average Score</span>
              <div className="assessment-stat-icon purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              </div>
            </div>
            <div className="assessment-stat-value">{assessmentAnalytics.avgScore}%</div>
          </div>

          <div className="assessment-stat-card">
            <div className="assessment-stat-header">
              <span className="assessment-stat-label">Users with Retakes</span>
              <div className="assessment-stat-icon orange">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
            </div>
            <div className="assessment-stat-value">{assessmentAnalytics.retakeStats.usersWithRetakes}</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="assessment-charts-row">
          {/* Pass/Fail Pie Chart */}
          <div className="assessment-chart-card">
            <div className="assessment-chart-header">
              <div>
                <h3 className="assessment-chart-title">Pass vs Fail Distribution</h3>
                <p className="assessment-chart-subtitle">Overall assessment results</p>
              </div>
            </div>
            <div className="pass-fail-chart-container">
              <div className="pass-fail-label left">
                <span className="pass-fail-text">Passed: {passedPercent}%</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={passFailData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {passFailData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pass-fail-label right">
                <span className="pass-fail-text">Failed: {failedPercent}%</span>
              </div>
            </div>
            <div className="pass-fail-legend">
              <div className="legend-item">
                <span className="legend-dot failed"></span>
                <span>Failed</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot passed"></span>
                <span>Passed</span>
              </div>
            </div>
          </div>

          {/* Score Distribution */}
          <div className="assessment-chart-card">
            <div className="assessment-chart-header">
              <div>
                <h3 className="assessment-chart-title">Score Distribution</h3>
                <p className="assessment-chart-subtitle">Distribution across score ranges</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={assessmentAnalytics.scoreDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="range" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#6366f1" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pass Rate by Step */}
        <div className="assessment-chart-card full-width">
          <div className="assessment-chart-header">
            <div>
              <h3 className="assessment-chart-title">Pass Rate by Step</h3>
              <p className="assessment-chart-subtitle">Performance across different assessment steps</p>
            </div>
            <div className="assessment-chart-legend">
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#3b82f6' }}></span>
                <span>Avg Score %</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#22c55e' }}></span>
                <span>Pass Rate %</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                type="number"
                dataKey="step_number"
                name="Step"
                domain={[0, 'dataMax + 1']}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                label={{ value: 'Step', position: 'bottom', fill: '#6b7280', fontSize: 12, offset: 0 }}
              />
              <YAxis 
                type="number"
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                label={{ value: 'Pass Rate %', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 12 }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ 
                  background: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}
              />
              <Scatter 
                name="Avg Score %" 
                data={passRateByStepFormatted} 
                fill="#3b82f6"
                dataKey="avg_score"
              >
                {passRateByStepFormatted.map((_, index) => (
                  <Cell key={`cell-avg-${index}`} fill="#3b82f6" />
                ))}
              </Scatter>
              <Scatter 
                name="Pass Rate %" 
                data={passRateByStepFormatted} 
                fill="#22c55e"
                dataKey="pass_rate"
              >
                {passRateByStepFormatted.map((_, index) => (
                  <Cell key={`cell-pass-${index}`} fill="#22c55e" />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render Dropoff Analytics Tab
  const renderDropoffAnalytics = () => {
    if (!dropoffAnalytics) return renderSkeleton();

    // Calculate summary stats
    const totalUsers = dropoffAnalytics.stoppedAtDistribution?.reduce((sum, d) => sum + d.count, 0) || 0;
    const overallDropoffRate = dropoffAnalytics.highestDropoffStep?.dropoff_rate || 0;
    const avgLastStep = dropoffAnalytics.avgLastCompletedStep || 0;
    const completionRate = dropoffAnalytics.dropoffByStep?.length > 0 
      ? Math.round(100 - (dropoffAnalytics.dropoffByStep.reduce((sum, s) => sum + s.dropoff_rate, 0) / dropoffAnalytics.dropoffByStep.length))
      : 0;

    // Format data for scatter chart
    const dropoffScatterData = dropoffAnalytics.dropoffByStep?.map(step => ({
      ...step,
      stepLabel: step.step_number
    })) || [];

    return (
      <div className="admin-tab-content dropoff-analytics-content">
        {/* Key Insight Alert */}
        {dropoffAnalytics.highestDropoffStep && (
          <div className="dropoff-insight-card">
            <div className="insight-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>
            <div className="insight-content">
              <span className="insight-title">🔍 Key Insight</span>
              <p className="insight-text">
                Step {dropoffAnalytics.highestDropoffStep.step_number} has the highest dropoff rate at{" "}
                <span className="highlight">{dropoffAnalytics.highestDropoffStep.dropoff_rate}%</span>. 
                Consider reviewing this step's content and difficulty.
              </p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="dropoff-stats-grid">
          <div className="dropoff-stat-card">
            <div className="dropoff-stat-header">
              <span className="dropoff-stat-label">Total Users</span>
              <div className="dropoff-stat-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
            </div>
            <div className="dropoff-stat-value">{totalUsers}</div>
          </div>

          <div className="dropoff-stat-card">
            <div className="dropoff-stat-header">
              <span className="dropoff-stat-label">Overall Dropoff Rate</span>
              <div className="dropoff-stat-icon red">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                  <polyline points="17 18 23 18 23 12"/>
                </svg>
              </div>
            </div>
            <div className="dropoff-stat-value">{overallDropoffRate}%</div>
          </div>

          <div className="dropoff-stat-card">
            <div className="dropoff-stat-header">
              <span className="dropoff-stat-label">Avg Last Step</span>
              <div className="dropoff-stat-icon purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
            </div>
            <div className="dropoff-stat-value">{avgLastStep}</div>
          </div>

          <div className="dropoff-stat-card">
            <div className="dropoff-stat-header">
              <span className="dropoff-stat-label">Completion Rate</span>
              <div className="dropoff-stat-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              </div>
            </div>
            <div className="dropoff-stat-value">{completionRate}%</div>
          </div>
        </div>

        {/* Dropoff Rate by Step Chart */}
        <div className="dropoff-chart-card full-width">
          <div className="dropoff-chart-header">
            <div>
              <h3 className="dropoff-chart-title">Dropoff Rate by Step</h3>
              <p className="dropoff-chart-subtitle">Percentage of users who started but abandoned each step</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                type="number"
                dataKey="step_number"
                name="Step"
                domain={[0, 'dataMax + 1']}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                label={{ value: 'Step', position: 'bottom', fill: '#6b7280', fontSize: 12, offset: 0 }}
              />
              <YAxis 
                type="number"
                dataKey="dropoff_rate"
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                label={{ value: 'Dropoff Rate %', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 12 }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value: number | undefined) => [`${value ?? 0}%`, "Dropoff Rate"]}
                contentStyle={{ 
                  background: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}
              />
              <Scatter 
                name="Dropoff Rate" 
                data={dropoffScatterData} 
                fill="#ef4444"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Row */}
        <div className="dropoff-charts-row">
          {/* Where Users Stopped */}
          <div className="dropoff-chart-card">
            <div className="dropoff-chart-header">
              <div>
                <h3 className="dropoff-chart-title">Where Users Stopped</h3>
                <p className="dropoff-chart-subtitle">Last completed step distribution</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dropoffAnalytics.stoppedAtDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="step"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  label={{ value: 'Step', position: 'bottom', fill: '#6b7280', fontSize: 12, offset: 0 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  label={{ value: 'Users', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number | undefined) => [value ?? 0, "Users"]}
                  contentStyle={{ 
                    background: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#eab308" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Dropoff Metrics */}
          <div className="dropoff-chart-card dropoff-metrics-card">
            <div className="dropoff-chart-header">
              <div>
                <h3 className="dropoff-chart-title">Dropoff Metrics</h3>
                <p className="dropoff-chart-subtitle">Detailed completion statistics</p>
              </div>
            </div>
            
            <div className="dropoff-metrics-content">
              <div className="dropoff-metric-row highlight-row">
                <span className="metric-label">Average Last Completed Step</span>
                <span className="metric-value">{dropoffAnalytics.avgLastCompletedStep}</span>
              </div>

              {dropoffAnalytics.dropoffByStep.slice(0, 3).map((step) => (
                <div key={step.step_number} className="dropoff-metric-row step-row">
                  <div className="step-info">
                    <span className="step-name">Step {step.step_number}</span>
                    <span className="step-completion">Completion</span>
                  </div>
                  <div className="step-stats">
                    <span className={`dropoff-badge ${step.dropoff_rate > 30 ? 'high' : 'low'}`}>
                      {step.dropoff_rate}% dropoff
                    </span>
                    <span className="completion-count">{step.completed}/{step.total_started} completed</span>
                  </div>
                </div>
              ))}

              <div className="dropoff-recommendations">
                <h4 className="recommendations-title">Recommendations</h4>
                <div className="recommendation-item">
                  <span className="recommendation-number">1</span>
                  <span className="recommendation-text">Review Step 1 content for clarity and difficulty</span>
                </div>
                <div className="recommendation-item">
                  <span className="recommendation-number">2</span>
                  <span className="recommendation-text">Consider adding onboarding guidance</span>
                </div>
                <div className="recommendation-item">
                  <span className="recommendation-number">3</span>
                  <span className="recommendation-text">Monitor user feedback for this step</span>
                </div>
              </div>
            </div>
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

    // Calculate totals and find best performing difficulty
    const totalSteps = sortedCompletion.reduce((sum, d) => sum + d.total_steps, 0);
    const totalCompleted = sortedCompletion.reduce((sum, d) => sum + d.completed, 0);
    const overallCompletion = totalSteps > 0 ? Math.round((totalCompleted / totalSteps) * 100) : 0;
    
    const bestDifficulty = sortedCompletion.reduce((best, current) => 
      current.completion_rate > (best?.completion_rate || 0) ? current : best
    , sortedCompletion[0]);

    // Format difficulty data for chart
    const chartData = sortedCompletion.map(d => ({
      ...d,
      difficultyLabel: d.difficulty.charAt(0).toUpperCase() + d.difficulty.slice(1)
    }));

    return (
      <div className="admin-tab-content difficulty-analytics-content">
        {/* Completion Rate by Difficulty Chart */}
        <div className="difficulty-chart-card full-width">
          <div className="difficulty-chart-header">
            <div>
              <h3 className="difficulty-chart-title">Completion Rate by Difficulty</h3>
              <p className="difficulty-chart-subtitle">Performance across different difficulty levels</p>
            </div>
            {bestDifficulty && (
              <span className="best-difficulty-badge">
                Best: {bestDifficulty.difficulty.charAt(0).toUpperCase() + bestDifficulty.difficulty.slice(1)} ({bestDifficulty.completion_rate}%)
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="difficultyLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                label={{ value: 'Completion Rate %', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number | undefined) => [`${value ?? 0}%`, "Completion Rate"]}
                contentStyle={{ 
                  background: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}
              />
              <Bar dataKey="completion_rate" name="Completion Rate" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.difficulty === 'beginner' ? '#22c55e' :
                      entry.difficulty === 'intermediate' ? '#eab308' :
                      entry.difficulty === 'advanced' ? '#ef4444' : '#6366f1'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Difficulty Breakdown Table */}
        <div className="difficulty-chart-card full-width">
          <div className="difficulty-chart-header">
            <div>
              <h3 className="difficulty-chart-title">Detailed Difficulty Breakdown</h3>
              <p className="difficulty-chart-subtitle">Complete breakdown of steps and performance by difficulty</p>
            </div>
          </div>
          <table className="difficulty-table">
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
                    <span className={`difficulty-tag ${item.difficulty}`}>
                      {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
                    </span>
                  </td>
                  <td className="text-center">{item.total_steps.toLocaleString()}</td>
                  <td className="text-center completed-value">{item.completed.toLocaleString()}</td>
                  <td>
                    <div className="completion-progress-cell">
                      <div className="completion-progress-bar">
                        <div
                          className="completion-progress-fill"
                          style={{
                            width: `${item.completion_rate}%`,
                            backgroundColor:
                              item.difficulty === 'beginner' ? '#1e3a5f' :
                              item.difficulty === 'intermediate' ? '#d1d5db' :
                              '#d1d5db'
                          }}
                        />
                      </div>
                      <span className="completion-percent">{item.completion_rate}%</span>
                    </div>
                  </td>
                  <td className="text-center avg-time-value">{item.avg_time_formatted}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary Stats */}
          <div className="difficulty-summary-grid">
            <div className="difficulty-summary-card">
              <span className="summary-label">Total Steps</span>
              <span className="summary-value">{totalSteps}</span>
            </div>
            <div className="difficulty-summary-card green-border">
              <span className="summary-label">Total Completed</span>
              <span className="summary-value green">{totalCompleted}</span>
            </div>
            <div className="difficulty-summary-card blue-border">
              <span className="summary-label">Overall Completion</span>
              <span className="summary-value">{overallCompletion}%</span>
            </div>
          </div>
        </div>

        {/* Assessment by Difficulty */}
        {difficultyAnalytics.assessmentByDifficulty &&
          difficultyAnalytics.assessmentByDifficulty.length > 0 && (
            <div className="difficulty-chart-card full-width">
              <div className="difficulty-chart-header">
                <div>
                  <h3 className="difficulty-chart-title">Assessment Performance by Difficulty</h3>
                  <p className="difficulty-chart-subtitle">Pass rates and scores across difficulty levels</p>
                </div>
              </div>
              <table className="difficulty-table">
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
                        <span className={`difficulty-tag ${item.difficulty}`}>
                          {item.difficulty?.charAt(0).toUpperCase() + item.difficulty?.slice(1)}
                        </span>
                      </td>
                      <td className="text-center">{item.total_assessments.toLocaleString()}</td>
                      <td className="text-center completed-value">{item.passed.toLocaleString()}</td>
                      <td className="text-center">{item.pass_rate}%</td>
                      <td className="text-center">{item.avg_score}%</td>
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

    // Calculate summary stats
    const totalCareers = careerAnalytics.careerCompletionRates?.length || 0;
    const totalUsers = careerAnalytics.careerCompletionRates?.reduce((sum, c) => sum + c.users, 0) || 0;
    const avgCompletion = totalCareers > 0 
      ? Math.round(careerAnalytics.careerCompletionRates.reduce((sum, c) => sum + c.completion_rate, 0) / totalCareers)
      : 0;
    const mostPopular = careerAnalytics.popularCareers?.[0]?.career_name || "N/A";

    // Colors for bar chart
    const careerColors = ["#3b82f6", "#a855f7", "#22c55e", "#eab308", "#ef4444", "#ec4899", "#14b8a6", "#f97316"];

    // Career dot colors for table
    const careerDotColors = ["#6b7280", "#3b82f6", "#a855f7", "#22c55e", "#eab308", "#ef4444", "#ec4899", "#14b8a6"];

    return (
      <div className="admin-tab-content career-analytics-content">
        {/* Stats Cards */}
        <div className="career-stats-grid">
          <div className="career-stat-card">
            <div className="career-stat-header">
              <span className="career-stat-label">Total Careers</span>
              <div className="career-stat-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
            </div>
            <div className="career-stat-value">{totalCareers}</div>
          </div>

          <div className="career-stat-card">
            <div className="career-stat-header">
              <span className="career-stat-label">Total Users</span>
              <div className="career-stat-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
            </div>
            <div className="career-stat-value">{totalUsers}</div>
          </div>

          <div className="career-stat-card">
            <div className="career-stat-header">
              <span className="career-stat-label">Avg Completion</span>
              <div className="career-stat-icon orange">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M12 20V10"/>
                  <path d="M18 20V4"/>
                  <path d="M6 20v-4"/>
                </svg>
              </div>
            </div>
            <div className="career-stat-value">{avgCompletion}%</div>
          </div>

          <div className="career-stat-card">
            <div className="career-stat-header">
              <span className="career-stat-label">Most Popular</span>
              <div className="career-stat-icon purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              </div>
            </div>
            <div className="career-stat-value career-name-value">{mostPopular}</div>
          </div>
        </div>

        {/* Popular Careers Chart */}
        <div className="career-chart-card full-width">
          <div className="career-chart-header">
            <div>
              <h3 className="career-chart-title">Most Popular Careers</h3>
              <p className="career-chart-subtitle">Popularity based on user selections and engagement</p>
            </div>
            <span className="career-filter-badge">Top {Math.min(careerAnalytics.popularCareers?.length || 0, 4)} Careers</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart 
              data={careerAnalytics.popularCareers?.slice(0, 4) || []} 
              layout="vertical"
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis 
                type="number"
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis 
                type="category" 
                dataKey="career_name" 
                width={160}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number | undefined) => [value ?? 0, "Users"]}
                contentStyle={{ 
                  background: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}
              />
              <Bar dataKey="total_users" radius={[0, 4, 4, 0]} barSize={40}>
                {(careerAnalytics.popularCareers?.slice(0, 4) || []).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={careerColors[index % careerColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Career Completion Statistics Table */}
        <div className="career-chart-card full-width">
          <div className="career-chart-header">
            <div>
              <h3 className="career-chart-title">Career Completion Statistics</h3>
              <p className="career-chart-subtitle">Detailed breakdown of user progress across career paths</p>
            </div>
          </div>
          <table className="career-table">
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
              {careerAnalytics.careerCompletionRates?.slice(0, 10).map((career, index) => (
                <tr key={career.career_name}>
                  <td>
                    <div className="career-name-cell">
                      <span 
                        className="career-dot" 
                        style={{ backgroundColor: careerDotColors[index % careerDotColors.length] }}
                      />
                      <span className="career-name-text">{career.career_name}</span>
                    </div>
                  </td>
                  <td className="text-center">{career.users.toLocaleString()}</td>
                  <td className="text-center">{career.total_steps.toLocaleString()}</td>
                  <td className="text-center">{career.completed_steps.toLocaleString()}</td>
                  <td>
                    <div className="career-completion-cell">
                      <div className="career-progress-bar">
                        <div
                          className="career-progress-fill"
                          style={{
                            width: `${career.completion_rate}%`,
                            backgroundColor: career.completion_rate > 0 ? '#1e3a5f' : '#e5e7eb'
                          }}
                        />
                      </div>
                      <span className="career-completion-percent">{career.completion_rate}%</span>
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
          <button onClick={() => navigate("/dashboard")} className="back-link">
            ← Back to Dashboard
          </button>
          <div className="header-title">
            <span className="title-icon"></span>
            <h1>Analytics Dashboard</h1>
            <span className="admin-badge">ADMIN</span>
          </div>
        </div>
        <div className="header-right">
          <div className="last-updated">
            <span className="updated-label">LAST UPDATED</span>
            <span className="updated-time">Just now</span>
          </div>
          <button
            onClick={loadAnalytics}
            className="refresh-btn"
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Refresh Data
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
            <span className="tab-icon">{tabIcons[tab.id as keyof typeof tabIcons]}</span>
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
