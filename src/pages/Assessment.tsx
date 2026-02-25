import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Cookies } from "react-cookie";
import Results from "./Results";
import FloatingChatbot from "../components/FloatingChatbot";
import {
  startAssessment,
  fetchNextQuestion,
  submitAnswer,
  restartAssessment,
  getCurrentOrStartAssessment,
  checkAssessmentStatus,
} from "../../services/dataService";

interface Question {
  question_id: number;
  question_text: string;
  options_answer: string;
  options_descriptions?: { [key: string]: string }; // New field for tooltips
  career_category?: string;
  career_mapping?: { [key: string]: string };
  options?: string[];
  assessment_id?: number;
}

// New enhanced career suggestion interface
interface CareerSuggestion {
  career: string;
  compatibility: number;
  reason: string;
}

interface Feedback {
  message?: string;
  career?: string;
  confidence?: number;
  // Legacy fields (for backward compatibility)
  career_suggestion?: string;
  score?: number;
  // New enhanced fields
  career_suggestions?: CareerSuggestion[];
  primary_career?: string;
  primary_score?: number;
  feedbackMessage?: string;
  nextQuestionId?: number;
  saveOption?: boolean;
  restartOption?: boolean;
  assessment_id?: number;
  completed?: boolean;
}

interface CareerRecommendation {
  career_name: string;
  saved_career_id: number;
  score: number;
  reason?: string; // New field for compatibility reason
  isPrimary?: boolean; // New field to identify primary career
}

interface Recommendations {
  careers: CareerRecommendation[];
  // Enhanced fields for new format
  career_suggestions?: CareerSuggestion[];
  primary_career?: string;
  primary_score?: number;
}

// Helper function to validate tooltip data quality
const validateTooltipData = (questionData: Question): boolean => {
  console.log("🧪 Validating tooltip data...");

  // Check if options_descriptions exists and is not null
  if (
    !questionData.options_descriptions ||
    questionData.options_descriptions === null
  ) {
    console.warn("⚠️ No descriptions available - tooltips disabled");
    return false;
  }

  // Validate format
  if (typeof questionData.options_descriptions !== "object") {
    console.error(
      "❌ options_descriptions should be object, got:",
      typeof questionData.options_descriptions
    );
    return false;
  }

  // Check if all options have descriptions
  const options =
    questionData.options_answer?.split(",").map((opt) => opt.trim()) || [];
  const descriptions = questionData.options_descriptions;

  let validCount = 0;

  options.forEach((option) => {
    const trimmedOption = option.trim();
    if (descriptions[trimmedOption]) {
      validCount++;
      // Check for meaningful descriptions (not just placeholder text)
      if (descriptions[trimmedOption].length < 20) {
        console.warn(
          `⚠️ Description too short for "${trimmedOption}": ${descriptions[trimmedOption]}`
        );
      }
    }
  });

  if (validCount === options.length) {
    console.log("✅ ALL TOOLTIP DESCRIPTIONS AVAILABLE! 🎉");
    console.log(`✅ ${validCount}/${options.length} options have descriptions`);
    console.log("✅ Backend integration successful - tooltips active!");
    return true;
  } else if (validCount > 0) {
    console.log(
      `⚠️ Partial descriptions: ${validCount}/${options.length} options have descriptions`
    );
    return true; // Still enable tooltips for available descriptions
  } else {
    console.log("❌ No descriptions found for any options");
    return false;
  }
};

const Assessment = () => {
  const navigate = useNavigate();
  const cookies = new Cookies();
  const authToken = cookies.get("authToken");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [completed, setCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendations>({
    careers: [],
  });
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  // New state for enhanced assessment system
  const [confidence, setConfidence] = useState<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_currentCareer, setCurrentCareer] = useState<string | null>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState<number>(0);
  const [isLongAssessment, setIsLongAssessment] = useState<boolean>(false);
  const isLoadingRef = useRef(false);

  // State for selected option visual feedback
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // State for expanded option description (click info icon to expand)
  const [expandedOption, setExpandedOption] = useState<string | null>(null);

  useEffect(() => {
    if (!authToken) {
      navigate("/login");
      return;
    }

    const checkExistingAssessment = async () => {
      // Prevent duplicate calls
      if (isLoadingRef.current) {
        console.log("Assessment already loading, skipping duplicate call");
        return;
      }

      try {
        isLoadingRef.current = true;
        setLoading(true);

        // First check for existing assessment status
        const status = await checkAssessmentStatus();
        console.log("Assessment Status:", status);

        if (status.hasActiveAssessment) {
          // Load existing assessment
          console.log("Found active assessment, loading...");
          setAssessmentId(status.assessment_id);
          // Continue with existing assessment flow
        }

        // Use single combined endpoint to get existing OR create new assessment
        const data: Question = await getCurrentOrStartAssessment();
        console.log("Assessment Data:", JSON.stringify(data, null, 2));

        // Validate tooltip data quality
        const hasValidTooltips = validateTooltipData(data);

        // Enhanced success logging for real backend data
        if (hasValidTooltips) {
          console.log("🎯 TOOLTIPS SUCCESSFULLY INTEGRATED! 🎯");
          console.log(
            "✨ Users will now see educational explanations for all career options"
          );
          console.log("🚀 Assessment experience enhanced - tooltips are live!");
        } else {
          console.log(
            "ℹ️ Using basic assessment interface (no tooltips available)"
          );
          console.log(
            "📝 If descriptions should be available, check backend implementation"
          );
        }

        if (typeof data.options_answer === "string") {
          data.options = data.options_answer
            .split(",")
            .map((option: string) => option.trim());
        }
        setCurrentQuestion(data);
        setAssessmentId(data.assessment_id || null);
      } catch (err: unknown) {
        const errorMessage =
          (err as Error).message ||
          "Failed to start assessment. Please try again.";
        if (errorMessage.includes("session expired")) {
          setError(
            "Your assessment session has expired. Starting a new assessment."
          );
          // Try to start a fresh assessment
          try {
            const data: Question = await startAssessment();
            if (typeof data.options_answer === "string") {
              data.options = data.options_answer
                .split(",")
                .map((option: string) => option.trim());
            }
            setCurrentQuestion(data);
            setAssessmentId(data.assessment_id || null);
            setError(null);
          } catch {
            setError("Failed to start assessment. Please try again.");
          }
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    };
    checkExistingAssessment();
  }, [authToken, navigate]);

  const handleAnswerSelect = async (optionIndex: number) => {
    if (!currentQuestion || !assessmentId) {
      setError("Assessment ID is missing. Please restart the assessment.");
      return;
    }

    const selectedOption = currentQuestion.options
      ? currentQuestion.options[optionIndex]
      : "";
    const newAnswers = {
      ...answers,
      [currentQuestion.question_id]: selectedOption,
    };
    setAnswers(newAnswers);

    try {
      setLoading(true);
      const data: Feedback = await submitAnswer(
        assessmentId,
        currentQuestion.question_id,
        selectedOption
      );
      setError(null);
      setFeedbackMessage(data.feedbackMessage || null);

      // Update questions answered count
      const newQuestionsAnswered = questionsAnswered + 1;
      setQuestionsAnswered(newQuestionsAnswered);

      // Update confidence and current career from response
      if (data.confidence !== undefined) {
        setConfidence(data.confidence);
      }
      if (data.career) {
        setCurrentCareer(data.career);
      }

      // Check for long assessment
      if (
        newQuestionsAnswered > 12 &&
        data.confidence !== undefined &&
        data.confidence < 90
      ) {
        setIsLongAssessment(true);
      }

      if (
        data.completed ||
        data.message === "Assessment completed" ||
        (data.confidence && data.confidence >= 90)
      ) {
        setCompleted(true);

        // Handle new multiple career suggestions format
        if (data.career_suggestions && data.career_suggestions.length > 0) {
          // Convert new format to existing format for compatibility
          const careerRecommendations = data.career_suggestions.map(
            (suggestion, index) => ({
              career_name: suggestion.career,
              saved_career_id: 0,
              score: suggestion.compatibility,
              reason: suggestion.reason, // Add reason for enhanced display
              isPrimary: index === 0, // Mark first as primary
            })
          );

          setRecommendations({
            careers: careerRecommendations,
            // Store raw career suggestions for enhanced UI
            career_suggestions: data.career_suggestions,
            primary_career: data.primary_career,
            primary_score: data.primary_score,
          });
        } else {
          // Fallback to legacy format
          setRecommendations({
            careers: [
              {
                career_name: data.career_suggestion || "Undecided",
                saved_career_id: 0,
                score: data.score || 0,
              },
            ],
          });
        }
        setShowResults(true);
      } else if (data.nextQuestionId) {
        try {
          const nextQuestionData = await fetchNextQuestion(
            currentQuestion.question_id,
            assessmentId
          );
          if (nextQuestionData) {
            const nextQuestion: Question = {
              question_id: nextQuestionData.question_id,
              question_text: nextQuestionData.question_text,
              options_answer:
                nextQuestionData.options_answer ||
                nextQuestionData.options.join(","),
              options_descriptions: nextQuestionData.options_descriptions || {},
              career_mapping: nextQuestionData.career_mapping || {},
              career_category: nextQuestionData.career_category,
              assessment_id: nextQuestionData.assessment_id,
              // Legacy format for backward compatibility
              options:
                nextQuestionData.options ||
                (nextQuestionData.options_answer
                  ? nextQuestionData.options_answer
                      .split(",")
                      .map((opt: string) => opt.trim())
                  : []),
            };
            console.log(
              "Next Question:",
              JSON.stringify(nextQuestion, null, 2)
            );
            setCurrentQuestion(nextQuestion);
            // Reset state when moving to new question
            setSelectedOption(null);
            setExpandedOption(null);
          } else {
            // No more questions available
            setCompleted(true);
            setShowResults(true);
          }
        } catch (err) {
          if ((err as Error).message.includes("No more questions available")) {
            setCompleted(true);
            setShowResults(true);
          } else {
            throw err;
          }
        }
      }
    } catch (err: unknown) {
      const errorMessage =
        (err as Error).message ||
        "Failed to submit answer. Please retry or restart.";
      if (errorMessage.includes("session expired")) {
        // Handle session expiry
        setCompleted(false);
        setShowResults(false);
        setAnswers({});
        setFeedbackMessage(null);
        setAssessmentId(null);
        setCurrentQuestion(null);
        // Reset new state variables
        setConfidence(0);
        setCurrentCareer(null);
        setQuestionsAnswered(0);
        setIsLongAssessment(false);
        setError(
          "Your assessment session has expired. Please start a new assessment."
        );
      } else {
        setError(errorMessage);
      }
      console.error("Submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    try {
      setLoading(true);
      const restartData = await restartAssessment();
      setCompleted(false);
      setShowResults(false);
      setAnswers({});
      setFeedbackMessage(null);
      setAssessmentId(restartData.assessment_id || null);
      // Reset state variables
      setConfidence(0);
      setCurrentCareer(null);
      setQuestionsAnswered(0);
      setIsLongAssessment(false);
      setSelectedOption(null);

      const questionData: Question = await startAssessment();
      if (typeof questionData.options_answer === "string") {
        questionData.options = questionData.options_answer
          .split(",")
          .map((option: string) => option.trim());
      }
      setCurrentQuestion(questionData);
    } catch (err: unknown) {
      setError(
        (err as Error).message ||
          "Failed to restart assessment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (completed && showResults) {
    return (
      <Results
        initialRecommendations={recommendations}
        onRestart={handleRestart}
        assessmentId={assessmentId}
      />
    );
  }

  if (completed && !showResults) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center px-4 overflow-hidden">
        <div className="max-w-lg w-full bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Assessment Complete!</h2>
          <p className="text-gray-500 mb-8">
            {feedbackMessage || "Great job! Your personalized career recommendations are ready to explore."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setShowResults(true)}
              className="bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
            >
              View My Results
            </button>
            <button
              onClick={handleRestart}
              className="text-gray-600 hover:text-gray-900 font-medium py-3 px-6 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Retake Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center px-4 overflow-hidden">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-500 mb-6 text-sm">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleAnswerSelect(0)}
              className="bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleRestart}
              className="text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total questions estimate based on confidence progress
  const totalQuestionsEstimate = confidence >= 90 ? questionsAnswered : 15;
  const currentQuestionNumber = questionsAnswered + 1;

  // Circular progress component - smaller size for compact layout
  const CircularProgress = ({ value, size = 120 }: { value: number; size?: number }) => {
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;
    
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#gradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1e40af" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{value}%</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">Target: 90%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen lg:h-screen bg-gray-50 flex flex-col lg:overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex items-start lg:items-center justify-center px-3 sm:px-4 py-3 sm:py-4 lg:px-6 overflow-auto lg:overflow-hidden">
        <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-6">
          
          {/* Main Content - Left Side */}
          <div className="flex-1 order-1">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 lg:p-6">
              {/* Question Number Badge */}
              <div className="mb-2 sm:mb-3">
                <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-red-500 text-white uppercase tracking-wide">
                  Question {currentQuestionNumber} of {totalQuestionsEstimate}
                </span>
              </div>

              {/* Question Text */}
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2 leading-tight">
                {currentQuestion?.question_text}
              </h1>
              
              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                Select the option that best resonates with your natural strengths.
              </p>

              {/* Encouraging Message for Long Assessments - Compact */}
              {isLongAssessment && (
                <div className="mb-2 sm:mb-3">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 sm:p-2.5 flex items-center gap-2">
                    <span className="text-sm">*</span>
                    <span className="text-[10px] sm:text-xs text-purple-700">Taking your time to find the perfect match!</span>
                  </div>
                </div>
              )}

              {/* Feedback Message - Compact */}
              {feedbackMessage && (
                <div className="mb-2 sm:mb-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-2.5 flex items-center gap-2">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-[10px] sm:text-xs text-green-700">{feedbackMessage}</span>
                  </div>
                </div>
              )}

              {/* Answer Options */}
              <div className="space-y-2">
                {currentQuestion?.options?.map((option: string, index: number) => {
                  const trimmedOption = option.trim();
                  const hasDescription = currentQuestion?.options_descriptions?.[trimmedOption];
                  const isSelected = answers[currentQuestion?.question_id] === option || selectedOption === trimmedOption;
                  const isExpanded = expandedOption === trimmedOption;

                  return (
                    <div key={index} className="relative">
                      <button
                        onClick={() => handleAnswerSelect(index)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleAnswerSelect(index);
                          }
                        }}
                        role="option"
                        tabIndex={0}
                        className={`w-full text-left p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-200 hover:bg-gray-50 active:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          {/* Radio Button */}
                          <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}>
                            {isSelected && (
                              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white"></div>
                            )}
                          </div>

                          {/* Option Text */}
                          <span className="text-sm sm:text-base font-semibold text-gray-900 flex-1">
                            {trimmedOption}
                          </span>

                          {/* Info Icon - Bottom Right */}
                          {hasDescription && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedOption(isExpanded ? null : trimmedOption);
                              }}
                              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-colors flex-shrink-0 self-end ${
                                isExpanded 
                                  ? "bg-blue-500 text-white" 
                                  : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                              }`}
                              aria-label={isExpanded ? "Hide description" : "Show description"}
                            >
                              <span className="text-xs sm:text-sm font-bold">i</span>
                            </button>
                          )}
                        </div>
                        {/* Description - Only show when expanded */}
                        {hasDescription && isExpanded && (
                          <div className="mt-2 ml-8 sm:ml-10 pr-8 sm:pr-10 animate-fade-in">
                            <span className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                              {currentQuestion.options_descriptions![trimmedOption]}
                            </span>
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Navigation - Back Button Only */}
              <div className="flex items-center mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-1.5 sm:gap-2 text-gray-600 hover:text-gray-900 font-medium text-xs sm:text-sm transition-colors"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar - Right Side (Shows below on mobile) */}
          <div className="w-full lg:w-72 flex flex-col sm:flex-row lg:flex-col gap-3 sm:gap-4 flex-shrink-0 order-2">
            {/* AI Confidence Card */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 flex-1 sm:flex-none lg:flex-none">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">AI Confidence</h3>
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-50 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <div className="flex justify-center mb-2 sm:mb-3">
                <CircularProgress value={confidence} size={100} />
              </div>

              {/* Stats */}
              <div className="border-t border-gray-100 pt-2 sm:pt-3">
                <h4 className="text-[9px] sm:text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 sm:mb-2">Stats</h4>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] sm:text-xs text-gray-600">Questions answered</span>
                  <span className="text-sm sm:text-base font-bold text-gray-900">{questionsAnswered}</span>
                </div>
              </div>
            </div>

            {/* Assessment Guide Card - Hidden on mobile, visible on tablet+ */}
            <div className="hidden sm:block bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 flex-1 lg:flex-none">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-slate-800 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-[10px] sm:text-xs font-semibold text-gray-900 uppercase tracking-wide">Assessment Guide</h3>
              </div>
              
              <ul className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs text-gray-600">
                <li className="flex items-start gap-1 sm:gap-1.5">
                  <span className="text-gray-400">•</span>
                  <span>Read descriptions under each option for details</span>
                </li>
                <li className="flex items-start gap-1 sm:gap-1.5">
                  <span className="text-gray-400">•</span>
                  <span>Answer to build confidence</span>
                </li>
                <li className="flex items-start gap-1 sm:gap-1.5">
                  <span className="text-gray-400">•</span>
                  <span>Completes at 90%</span>
                </li>
                <li className="flex items-start gap-1 sm:gap-1.5">
                  <span className="text-gray-400">•</span>
                  <span>Consistent answers = faster completion (5-6 questions)</span>
                </li>
                <li className="flex items-start gap-1 sm:gap-1.5">
                  <span className="text-gray-400">•</span>
                  <span>Mixed answers = more questions (10-20)</span>
                </li>
              </ul>

              {/* Description Status Indicator */}
              {currentQuestion?.options_descriptions &&
              Object.keys(currentQuestion.options_descriptions).length > 0 ? (
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-1 sm:py-1.5 bg-green-50 rounded-lg">
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[9px] sm:text-[10px] font-semibold text-green-700 uppercase tracking-wide">Option Details Visible</span>
                  </div>
                </div>
              ) : (
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-1 sm:py-1.5 bg-gray-50 rounded-lg">
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[9px] sm:text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Basic Mode</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Compact */}
      <div className="text-center py-2 text-[10px] sm:text-xs text-gray-400 flex-shrink-0">
        Powered by CareerDiscovery AI • © {new Date().getFullYear()}
      </div>

      {/* Floating Chatbot */}
      <FloatingChatbot position="bottom-right" />
    </div>
  );
};

export default Assessment;
