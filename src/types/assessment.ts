// Assessment System TypeScript Interfaces

export interface Question {
  question_id: number;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

export interface Assessment {
  assessment_id: number;
  title: string;
  description: string;
  questions: Question[];
  passing_score: number;
  time_limit_minutes: number;
  step_number: number;
  total_questions: number;
  has_passed: boolean;
  attempt_count: number;
  best_score: number | null;
  can_retake: boolean;
}

export interface AssessmentAnswer {
  question_id: number;
  selected_option: number;
}

export interface DetailedResult {
  question_id: number;
  question: string;
  your_answer: number;
  correct_answer: number;
  is_correct: boolean;
  explanation: string;
}

export interface AssessmentResult {
  result_id: number;
  score: number;
  passing_score: number;
  passed: boolean;
  correct_answers: number;
  total_questions: number;
  attempt_number: number;
  step_completed: boolean;
  message: string;
  detailed_results: DetailedResult[];
}

export interface StepProgress {
  step_number: number;
  title: string;
  is_completed: boolean;
  completed_at: string | null;
  has_assessment: boolean;
  assessment_passed: boolean;
  is_locked: boolean;
}

export interface RoadmapProgress {
  career_name: string;
  total_steps: number;
  completed_steps: number;
  progress_percentage: string;
  steps: StepProgress[];
}

export interface AssessmentAttempt {
  result_id: number;
  score: number;
  status: "pass" | "fail" | "in_progress";
  attempt_number: number;
  time_taken_seconds: number;
  completed_at: string;
}

export interface AssessmentHistory {
  step_number: number;
  assessment_title: string;
  total_attempts: number;
  has_passed: boolean;
  passing_score: number;
  best_score: number;
  attempts: AssessmentAttempt[];
}
