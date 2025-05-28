import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Cookies } from "react-cookie";
import Navbar from "../components/Navbar";
import Results from "./Results";
import {
  fetchDefaultQuestion,
  fetchNextQuestion,
  submitAnswer,
  restartQuiz,
} from "../../services/dataService";

interface Question {
  question_id: number;
  question_text: string;
  options_answer: string;
  career_category?: string;
  career_mapping?: { [key: string]: string };
  options?: string[];
}

interface Feedback {
  message?: string;
  career?: string;
  confidence?: number;
  career_suggestion?: string;
  score?: number;
  feedbackMessage?: string;
  nextQuestionId?: number;
  saveOption?: boolean;
  restartOption?: boolean;
}

interface CareerRecommendation {
  career_name: string;
  saved_career_id: number;
  score: number;
}

interface Recommendations {
  careers: CareerRecommendation[];
}

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
  const [recommendations, setRecommendations] = useState<Recommendations>({ careers: [] });
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [assessmentId] = useState(String(Math.floor(Math.random() * 1000))); // Persist ID

  useEffect(() => {
    if (!authToken) {
      navigate("/login");
      return;
    }

    const fetchInitialQuestion = async () => {
      try {
        setLoading(true);
        const data = await fetchDefaultQuestion();
        console.log("Default Question Data:", JSON.stringify(data, null, 2));
        if (typeof data.options_answer === "string") {
          data.options = data.options_answer.split(",").map((option: string) => option.trim());
        }
        setCurrentQuestion(data);
      } catch (err: unknown) {
        setError((err as Error).message || "Failed to load question. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialQuestion();
  }, [authToken, navigate]);

  const handleAnswerSelect = async (optionIndex: number) => {
    if (!currentQuestion) return;

    console.log("Current Question Options:", currentQuestion.options);
    const selectedOption = currentQuestion.options ? currentQuestion.options[optionIndex] : "";
    console.log("Selected Option:", selectedOption);
    const newAnswers = { ...answers, [currentQuestion.question_id]: selectedOption };
    setAnswers(newAnswers);

    console.log("Submitting:", { assessmentId, question_id: currentQuestion.question_id, selectedOption, authToken });

    try {
      setLoading(true);
      const data: Feedback = await submitAnswer(assessmentId, currentQuestion.question_id, selectedOption);
      setError(null);
      setFeedbackMessage(data.feedbackMessage || null);

      if (data.message === "Assessment completed") {
        setCompleted(true);
        setRecommendations({
          careers: [
            {
              career_name: data.career_suggestion || "Undecided",
              saved_career_id: 0,
              score: data.score || 0,
            },
          ],
        });
        setShowResults(true);
      } else if (data.nextQuestionId) {
        const nextQuestion = await fetchNextQuestion(currentQuestion.question_id);
        if (typeof nextQuestion.options_answer === "string") {
          nextQuestion.options = nextQuestion.options_answer.split(",").map((option: string) => option.trim());
        }
        console.log("Next Question:", JSON.stringify(nextQuestion, null, 2));
        setCurrentQuestion(nextQuestion);
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to submit answer.");
      console.error("Submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    try {
      await restartQuiz();
      setCompleted(false);
      setShowResults(false);
      setAnswers({});
      setFeedbackMessage(null);
      const data = await fetchDefaultQuestion();
      if (typeof data.options_answer === "string") {
        data.options = data.options_answer.split(",").map((option: string) => option.trim());
      }
      setCurrentQuestion(data);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to restart quiz. Please try again.");
    }
  };

  if (completed && showResults) {
    return <Results initialRecommendations={recommendations} assessmentId={assessmentId} onRestart={handleRestart} />;
  }

  if (completed && !showResults) {
    return (
      <div className="min-h-screen bg-[#111827] text-gray-200 flex flex-col">
        <Navbar />
        <div className="flex-grow p-8 -mt-7 flex items-center justify-center">
          <div className="max-w-2xl mx-auto bg-[#1F2937] rounded-lg p-8 shadow-lg text-center">
            <h2 className="text-3xl font-bold mb-6">Assessment Completed</h2>
            <p className="text-xl mb-8">{feedbackMessage || "Your career recommendations are ready."}</p>
            <div className="space-x-4">
              <button
                onClick={() => setShowResults(true)}
                className="bg-[#4C4C86] hover:bg-[#5D5DA3] text-white font-bold py-3 px-8 rounded-lg transition duration-300"
              >
                View Recommendations
              </button>
              <button
                onClick={handleRestart}
                className="bg-[#4C4C86] hover:bg-[#5D5DA3] text-white font-bold py-3 px-8 rounded-lg transition duration-300"
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
      <div className="min-h-screen bg-[#111827] text-gray-200 flex flex-col">
        <Navbar />
        <div className="flex-grow p-8 flex items-center justify-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#111827] text-gray-200 flex flex-col">
        <Navbar />
        <div className="flex-grow p-8 flex items-center justify-center">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827] text-gray-200 flex flex-col">
      <Navbar />
      <div className="flex-grow p-6">
        <div className="max-w-3xl mx-auto bg-[#1F2937] rounded-lg p-4">
          <div className="mb-4">
            <span className="text-sm text-gray-400">
              Question {currentQuestion?.question_id} of 10
            </span>
            <div className="w-full bg-gray-400 rounded-full h-4 mt-2">
              <div
                className="bg-blue-400 h-4 rounded-lg"
                style={{ width: `${(currentQuestion?.question_id || 0) * 10}%` }}
              ></div>
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-4">{currentQuestion?.question_text}</h2>

          {feedbackMessage && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <h3 className="text-base font-medium mb-2">Feedback:</h3>
              <p className="text-gray-400">{feedbackMessage}</p>
            </div>
          )}

          <div className="space-y-3">
            {currentQuestion?.options?.map((option: any, index: any) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full text-left p-3 rounded-lg border ${
                  answers[currentQuestion?.question_id] === option
                    ? "border-blue-400 bg-blue-900/20"
                    : "border-gray-600 hover:bg-gray-700"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="flex justify-between mt-6">
           
            <span className="text-sm text-gray-400 self-center">
              {Object.keys(answers).length} / 10 answered
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assessment;