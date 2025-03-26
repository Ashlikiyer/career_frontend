import { useState } from 'react';
import Navbar from '../components/Navbar';

const Assessment = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState(Array(10).fill(null));
  const [completed, setCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const questions = [
    "What type of tasks do you enjoy the most?",
    "Which work environment do you prefer?",
    "How do you approach problem-solving?",
    "What's your preferred way of learning new things?",
    "Which of these activities energizes you the most?",
    "How comfortable are you with mathematics and logic?",
    "Which software development role appeals to you most?",
    "How do you feel about working with data?",
    "What's your attitude toward working in teams?",
    "Which emerging technology interests you most?"
  ];

  const options = [
    [
      "Writing code & developing software",
      "Designing graphics, animations, or UI",
      "Managing networks and cybersecurity",
      "Analyzing data and creating reports"
    ],
    [
      "Quiet, independent workspace",
      "Collaborative, team-based environment",
      "Fast-paced, dynamic setting",
      "Structured, predictable office"
    ],
    [
      "Break it down logically step by step",
      "Visualize the components and connections",
      "Try different approaches experimentally",
      "Research how others have solved it"
    ],
    [
      "Hands-on practice and building projects",
      "Watching video tutorials and examples",
      "Reading documentation and books",
      "Taking structured courses with exercises"
    ],
    [
      "Debugging complex code issues",
      "Creating beautiful user interfaces",
      "Optimizing system performance",
      "Discovering patterns in large datasets"
    ],
    [
      "Very comfortable - I enjoy complex problems",
      "Somewhat comfortable - I can handle basics",
      "Not very - I prefer creative/visual tasks",
      "It depends on the application"
    ],
    [
      "Front-end developer",
      "Back-end engineer",
      "Full-stack developer",
      "DevOps specialist"
    ],
    [
      "I love working with data and statistics",
      "I'm comfortable with basic data analysis",
      "I prefer working with visual representations",
      "I avoid data-heavy tasks when possible"
    ],
    [
      "I thrive in team collaborations",
      "I prefer working alone but can team up",
      "I like pairing with one other person",
      "I work best independently"
    ],
    [
      "Artificial Intelligence/Machine Learning",
      "Blockchain and Web3 technologies",
      "Augmented/Virtual Reality",
      "Internet of Things (IoT)"
    ]
  ];

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateResults = () => {
    const counts = {
      developer: 0,
      designer: 0,
      analyst: 0,
      engineer: 0
    };

    answers.forEach((answer) => {
      if (answer === 0) counts.developer++;
      if (answer === 1) counts.designer++;
      if (answer === 2) counts.engineer++;
      if (answer === 3) counts.analyst++;
    });

    return counts;
  };

  if (completed && !showResults) {
    return (
      <div className="min-h-screen bg-[#111827] text-gray-200 flex flex-col">
        <Navbar />
        <div className="flex-grow p-8 -mt-7 flex items-center justify-center">
          <div className="max-w-2xl mx-auto bg-[#1F2937] rounded-lg p-8 shadow-lg text-center">
            <h1 className="text-3xl font-bold mb-6">Assessment Completed</h1>
            <p className="text-xl mb-8">
              Your career recommendations are ready. Click below to view them.
            </p>
            <button
              onClick={() => setShowResults(true)}
              className="bg-[#4C4C86] hover:bg-[#4C4C86] text-white font-bold py-3 px-8 rounded-lg transition delay-10 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
            >
              View Recommendations
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (completed && showResults) {
    const results = calculateResults();
    return (
      <div className="min-h-screen bg-[#111827] text-gray-200 flex flex-col">
        <Navbar />
        <div className="flex-grow  p-8">
          <div className="max-w-2xl mx-auto bg-[#1F2937] rounded-lg p-6 shadow-lg">
            <h1 className="text-3xl font-bold mb-6 text-center">Assessment Results</h1>
            <div className="space-y-4">
              <div className="bg-[#374151] p-4 rounded-lg">
                <h2 className="text-xl font-semibold">Developer Potential: {results.developer * 10}%</h2>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${results.developer * 10}%` }}
                  ></div>
                </div>
              </div>
              <div className="bg-[#374151] p-4 rounded-lg">
                <h2 className="text-xl font-semibold">Designer Potential: {results.designer * 10}%</h2>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-purple-600 h-2.5 rounded-full" 
                    style={{ width: `${results.designer * 10}%` }}
                  ></div>
                </div>
              </div>
              <div className="bg-[#374151] p-4 rounded-lg">
                <h2 className="text-xl font-semibold">Engineer Potential: {results.engineer * 10}%</h2>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-green-600 h-2.5 rounded-full" 
                    style={{ width: `${results.engineer * 10}%` }}
                  ></div>
                </div>
              </div>
              <div className="bg-[#374151] p-4 rounded-lg">
                <h2 className="text-xl font-semibold">Analyst Potential: {results.analyst * 10}%</h2>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-yellow-600 h-2.5 rounded-full" 
                    style={{ width: `${results.analyst * 10}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <button 
              onClick={() => {
                setCurrentQuestion(0);
                setAnswers(Array(10).fill(null));
                setCompleted(false);
                setShowResults(false);
              }}
              className="mt-8 bg-[#4C4C86] hover:bg-[#4C4C86] text-white font-bold py-2 px-6 rounded transition delay-10 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
            >
              Retake Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827] text-gray-200 flex flex-col">
      <Navbar />
      <div className="flex-grow  p-8">
        <div className="max-w-2xl mx-auto bg-[#1F2937] rounded-lg p-6 shadow-lg">
          <div className="mb-4">
            <span className="text-sm text-gray-400">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-6">{questions[currentQuestion]}</h1>

          <div className="space-y-3">
            {options[currentQuestion].map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full text-left p-4 rounded-lg border ${answers[currentQuestion] === index ? 'border-blue-500 bg-blue-900/20' : 'border-gray-600 hover:bg-gray-700'}`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className={`py-2 px-4 rounded ${currentQuestion === 0 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-500'}`}
            >
              Previous
            </button>
            <span className="text-sm text-gray-400 self-center">
              {answers.filter(a => a !== null).length} / {questions.length} answered
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assessment;