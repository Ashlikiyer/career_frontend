import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Cookies } from "react-cookie";
import Navbar from "../components/Navbar";
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

// Helper function to generate progress messages
const getProgressMessage = (
  confidence: number,
  questionsAnswered: number
): string => {
  if (confidence >= 90) return "Assessment complete! High confidence achieved.";
  if (confidence >= 70)
    return "Almost there! A few more questions should do it.";
  if (confidence >= 50)
    return "Making good progress! Keep answering consistently.";
  if (questionsAnswered > 10)
    return "Taking time to find the right fit - that's okay!";
  return "Building your career profile...";
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
  const [currentCareer, setCurrentCareer] = useState<string | null>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState<number>(0);
  const [isLongAssessment, setIsLongAssessment] = useState<boolean>(false);
  const isLoadingRef = useRef(false);

  // New state for tooltip functionality
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [expandedOption, setExpandedOption] = useState<string | null>(null);

  useEffect(() => {
    if (!authToken) {
      navigate("/login");
      return;
    }

    // Check if mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

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
          } catch (retryErr) {
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

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
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
            // Reset tooltip states when moving to new question
            setHoveredOption(null);
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
      // Reset new state variables
      setConfidence(0);
      setCurrentCareer(null);
      setQuestionsAnswered(0);
      setIsLongAssessment(false);
      // Reset tooltip states
      setHoveredOption(null);
      setSelectedOption(null);
      setExpandedOption(null);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Navbar />
        <div className="flex-grow p-8 flex items-center justify-center">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 shadow-xl text-center border border-gray-100">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              Assessment Complete!
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              {feedbackMessage ||
                "Great job! Your personalized career recommendations are ready to explore."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowResults(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                View My Results
              </button>
              <button
                onClick={handleRestart}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-8 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-300"
              >
                Retake Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Navbar />
        <div className="flex-grow p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading your assessment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Navbar />
        <div className="flex-grow p-8 flex items-center justify-center">
          <div className="max-w-md mx-auto bg-white rounded-2xl p-8 shadow-xl text-center border border-gray-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Oops! Something went wrong
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleAnswerSelect(0)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
              >
                Try Again
              </button>
              <button
                onClick={handleRestart}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg border border-gray-200 transition-all duration-300"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      <div className="flex-grow p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
              📋 Career Assessment
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Question {questionsAnswered + 1}
              {confidence < 90 && (
                <span className="text-lg font-normal text-gray-600 ml-2">
                  (Continue until 90% confidence)
                </span>
              )}
            </h1>
            <p className="text-gray-600">
              Discover your perfect tech career path with our AI-powered
              assessment
            </p>
          </div>

          {/* Confidence Progress Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Confidence Level</span>
              <span>
                {confidence}% confidence in {currentCareer || "career path"}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${confidence}%`,
                }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-400">
                Questions answered: {questionsAnswered}
              </span>
              <div className="flex items-center text-xs text-gray-500">
                <span className="mr-1">Target:</span>
                <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                <span>90%</span>
              </div>
            </div>
          </div>

          {/* Main Question Card */}
          <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 shadow-xl border border-gray-100 mb-6">
            {/* Dynamic Progress Message */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                {getProgressMessage(confidence, questionsAnswered)}
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center leading-relaxed">
              {currentQuestion?.question_text}
            </h2>

            {/* Encouraging Message for Long Assessments */}
            {isLongAssessment && (
              <div className="mb-6">
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      🎯
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-purple-800 mb-1">
                        Taking your time to find the perfect career match!
                      </h3>
                      <p className="text-sm text-purple-700">
                        Your thoroughness will lead to better recommendations.
                        The assessment continues until we reach 90% confidence.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Feedback Message - Always visible between question and choices */}
            {feedbackMessage && (
              <div className="mb-8">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <svg
                        className="w-3 h-3 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-green-800 mb-1">
                        Great choice!
                      </h3>
                      <p className="text-sm text-green-700">
                        {feedbackMessage}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Help Section */}
            {currentQuestion?.options_descriptions &&
            Object.keys(currentQuestion.options_descriptions).length > 0 ? (
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-center gap-2 text-blue-700">
                    <div className="text-lg">💡</div>
                    <span className="text-sm font-medium">
                      {isMobile
                        ? "Tap any option to see detailed explanations, tap again to select"
                        : "Hover over options to see detailed explanations"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <div className="text-lg">📝</div>
                    <span className="text-sm font-medium">
                      Choose the option that best describes your preferences
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Answer Options with Tooltips */}
            <div className="space-y-4">
              {currentQuestion?.options?.map(
                (option: string, index: number) => {
                  const trimmedOption = option.trim();
                  const hasDescription =
                    currentQuestion?.options_descriptions?.[trimmedOption];
                  const isExpanded = expandedOption === trimmedOption;
                  const isSelected = selectedOption === trimmedOption;
                  const isHovered = hoveredOption === trimmedOption;

                  const handleOptionClick = () => {
                    if (isMobile && hasDescription) {
                      if (isExpanded) {
                        // Second tap - select the option
                        setSelectedOption(trimmedOption);
                        setTimeout(() => handleAnswerSelect(index), 300);
                      } else {
                        // First tap - show description
                        setExpandedOption(trimmedOption);
                      }
                    } else {
                      // Desktop or no description - direct selection
                      handleAnswerSelect(index);
                    }
                  };

                  return (
                    <div key={index} className="relative">
                      <button
                        onClick={handleOptionClick}
                        onMouseEnter={() =>
                          !isMobile && setHoveredOption(trimmedOption)
                        }
                        onMouseLeave={() => !isMobile && setHoveredOption(null)}
                        onFocus={() => setHoveredOption(trimmedOption)}
                        onBlur={() => setHoveredOption(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleOptionClick();
                          }
                          if (e.key === "Escape") {
                            setHoveredOption(null);
                            setExpandedOption(null);
                          }
                        }}
                        aria-describedby={
                          hasDescription ? `tooltip-${index}` : undefined
                        }
                        aria-expanded={isMobile ? isExpanded : undefined}
                        role="option"
                        tabIndex={0}
                        className={`w-full text-left p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-md relative ${
                          answers[currentQuestion?.question_id] === option ||
                          isSelected
                            ? "border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]"
                            : isHovered || isExpanded
                            ? "border-blue-300 bg-blue-50/50 shadow-md"
                            : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1">
                            <div
                              className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center flex-shrink-0 ${
                                answers[currentQuestion?.question_id] ===
                                  option || isSelected
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {(answers[currentQuestion?.question_id] ===
                                option ||
                                isSelected) && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                            <span className="text-lg text-gray-700 font-medium">
                              {trimmedOption}
                            </span>
                          </div>

                          {/* Tooltip Icon */}
                          {hasDescription && (
                            <div className="ml-4 flex-shrink-0">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                                  isHovered || isExpanded
                                    ? "text-blue-600 bg-blue-100"
                                    : "text-gray-400 bg-gray-100"
                                }`}
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
                                </svg>
                              </div>
                              {isMobile && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {isExpanded ? "▼" : "▶️"}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Mobile Expanded Description */}
                        {isMobile && isExpanded && hasDescription && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed">
                              <div className="font-semibold text-blue-700 mb-2">
                                {trimmedOption}
                              </div>
                              <div>
                                {
                                  currentQuestion.options_descriptions![
                                    trimmedOption
                                  ]
                                }
                              </div>
                              <div className="mt-3 text-center">
                                <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                  👆 Tap again to select this option
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </button>

                      {/* Desktop Tooltip */}
                      {!isMobile && hasDescription && isHovered && (
                        <div
                          id={`tooltip-${index}`}
                          role="tooltip"
                          aria-hidden={!isHovered}
                          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 z-50 opacity-100 transition-opacity duration-300"
                        >
                          <div className="bg-gray-900 text-white p-4 rounded-xl shadow-2xl max-w-80 text-sm">
                            <div className="font-semibold text-blue-300 mb-2">
                              {trimmedOption}
                            </div>
                            <div className="text-gray-200 leading-relaxed">
                              {
                                currentQuestion.options_descriptions![
                                  trimmedOption
                                ]
                              }
                            </div>
                          </div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                            <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Bottom Stats and Information */}
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
              <span className="text-sm text-gray-600">
                <span className="font-semibold text-blue-600">
                  {questionsAnswered}
                </span>{" "}
                questions answered •{" "}
                <span className="font-semibold text-purple-600">
                  {confidence}%
                </span>{" "}
                confidence
              </span>
            </div>

            {/* Enhanced Assessment Information with Tooltip Help */}
            <div className="bg-gray-50 rounded-xl p-4 text-left">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                💡 Assessment Guide:
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>
                  • {isMobile ? "Tap" : "Hover over"} options with info icons to
                  see detailed explanations
                </li>
                <li>• Answer questions to build confidence in career paths</li>
                <li>• Assessment completes when you reach 90% confidence</li>
                <li>
                  • Consistent answers = faster completion (5-6 questions)
                </li>
                <li>
                  • Mixed answers = more questions for accurate results (10-20
                  questions)
                </li>
              </ul>

              {/* Tooltip Status Indicator */}
              {currentQuestion?.options_descriptions &&
              Object.keys(currentQuestion.options_descriptions).length > 0 ? (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center text-xs text-green-600 font-medium">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Educational tooltips active - hover for explanations!
                  </div>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center text-xs text-gray-500 font-medium">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Basic assessment mode - answer based on your preferences
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Chatbot */}
      <FloatingChatbot position="bottom-right" />
    </div>
  );
};

export default Assessment;
