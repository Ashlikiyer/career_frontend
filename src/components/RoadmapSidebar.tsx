import React, { useState, useMemo } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronRight } from "lucide-react";
import "../styles/RoadmapSidebar.css";

interface RoadmapStep {
  step_id: number;
  step_number: number;
  title: string;
  is_done: boolean;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
}

interface RoadmapSidebarProps {
  steps: RoadmapStep[];
  selectedStepId: number | null;
  careerName: string;
  completedSteps: number;
  totalSteps: number;
  onStepSelect: (stepId: number) => void;
}

// Group steps by difficulty level
interface GroupedSteps {
  beginner: RoadmapStep[];
  intermediate: RoadmapStep[];
  advanced: RoadmapStep[];
}

const DIFFICULTY_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced'
};

const RoadmapSidebar: React.FC<RoadmapSidebarProps> = ({
  steps,
  selectedStepId,
  careerName,
  completedSteps,
  totalSteps,
  onStepSelect,
}) => {
  const [expandedDifficulties, setExpandedDifficulties] = useState<Set<string>>(
    new Set(['beginner', 'intermediate', 'advanced'])
  );

  const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Group steps by difficulty
  const groupedSteps = useMemo(() => {
    const grouped: GroupedSteps = {
      beginner: [],
      intermediate: [],
      advanced: []
    };

    steps.forEach(step => {
      const difficulty = step.difficulty_level || 'beginner';
      if (grouped[difficulty]) {
        grouped[difficulty].push(step);
      }
    });

    return grouped;
  }, [steps]);

  // Calculate completed steps per difficulty
  const difficultyStats = useMemo(() => ({
    beginner: groupedSteps.beginner.filter(s => s.is_done).length,
    intermediate: groupedSteps.intermediate.filter(s => s.is_done).length,
    advanced: groupedSteps.advanced.filter(s => s.is_done).length,
  }), [groupedSteps]);

  const toggleDifficultyExpansion = (difficulty: string) => {
    setExpandedDifficulties(prev => {
      const next = new Set(prev);
      if (next.has(difficulty)) {
        next.delete(difficulty);
      } else {
        next.add(difficulty);
      }
      return next;
    });
  };

  const handleStepClick = (stepId: number) => {
    onStepSelect(stepId);
  };

  const renderDifficultyGroup = (difficulty: 'beginner' | 'intermediate' | 'advanced') => {
    const groupSteps = groupedSteps[difficulty];
    if (groupSteps.length === 0) return null;

    const isExpanded = expandedDifficulties.has(difficulty);
    const completedCount = difficultyStats[difficulty];

    return (
      <div key={difficulty} className="difficulty-group">
        {/* Difficulty Header */}
        <button
          className="difficulty-header"
          onClick={() => toggleDifficultyExpansion(difficulty)}
        >
          <div className="difficulty-chevron">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </div>
          <div className="difficulty-info">
              <div className="difficulty-label-row">
                <span className={`difficulty-dot ${difficulty}`} aria-hidden="true"></span>
                <span className="difficulty-label">{DIFFICULTY_LABELS[difficulty]}</span>
              </div>
            <span className="difficulty-count">
              {completedCount}/{groupSteps.length} complete
            </span>
          </div>
        </button>

        {/* Steps List */}
        {isExpanded && (
          <div className="steps-group">
            {groupSteps.map((step) => (
              <button
                key={step.step_id}
                className={`step-item ${
                  selectedStepId === step.step_id ? "active" : ""
                } ${step.is_done ? "completed" : ""}`}
                onClick={() => handleStepClick(step.step_id)}
              >
                <span className="step-icon">
                  {step.is_done ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 fill-green-50" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-300" />
                  )}
                </span>
                <span className="step-content">
                  <span className="step-number">Step {step.step_number}</span>
                  <span className="step-title">{step.title}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className="roadmap-sidebar-inner">
      {/* Header Section */}
      <div className="roadmap-sidebar-header">
        <h2 className="roadmap-sidebar-title">{careerName}</h2>
        <p className="roadmap-sidebar-completion">{progressPercentage}% COMPLETE</p>
      </div>

      {/* Progress Bar */}
      <div className="roadmap-progress-bar-container">
        <div className="roadmap-progress-bar">
          <div
            className="roadmap-progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Difficulty Groups */}
      <nav className="roadmap-groups-list">
        {renderDifficultyGroup('beginner')}
        {renderDifficultyGroup('intermediate')}
        {renderDifficultyGroup('advanced')}
      </nav>
    </div>
  );

  return (
    <aside className="roadmap-sidebar">
      {sidebarContent}
    </aside>
  );
};

export default RoadmapSidebar;
