import { useState } from 'react';
import Navbar from "../components/Navbar";

const Results = () => {
  const [showRefinedResults, setShowRefinedResults] = useState(false);
  const [skills, setSkills] = useState('');
  const [preferences, setPreferences] = useState('');

  const handleUpdateMatches = () => {
    setShowRefinedResults(true);
  };

  const handleRefineAgain = () => {
    setShowRefinedResults(false);
  };

  if (showRefinedResults) {
    return (
      <div className="min-h-screen bg-[#111827] text-gray-200">
        <Navbar />
        <div className="pt-10 p-8 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">We Think You Might Be Interested In...</h1>
            <p className="text-xl text-gray-400">
              Your refined career recommendations based on your updated preferences.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-[#1F2937] rounded-lg p-6 border border-blue-500">
              <h2 className="text-2xl font-bold mb-3">Software Engineer</h2>
              <p className="text-gray-400">
                Develop applications, build systems, and work with cutting-edge technologies...
              </p>
            </div>

            <div className="bg-[#1F2937] rounded-lg p-6 border border-purple-500">
              <h2 className="text-2xl font-bold mb-3">Data Scientist</h2>
              <p className="text-gray-400">
                Analyze data, create models, and gain insights to drive decision-making...
              </p>
            </div>

            <div className="bg-[#1F2937] rounded-lg p-6 border border-green-500">
              <h2 className="text-2xl font-bold mb-3">Game Developer</h2>
              <p className="text-gray-400">
                Design and build interactive games using programming and creative skills...
              </p>
            </div>
          </div>

          <div className="flex space-x-4 mb-12 justify-center">
            <button 
              onClick={handleRefineAgain}
              className="bg-[#4C4C86] hover:bg-[#5D5DA3] text-white font-bold py-3 px-6 rounded-lg transition duration-300"
            >
              Refine Again
            </button>
            <button className="bg-[#4C4C86] hover:bg-[#5D5DA3] text-white font-bold py-3 px-6 rounded-lg transition duration-300">
              Save Career Path
            </button>
          </div>

          <div className="bg-[#1F2937] rounded-lg p-8 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6">Where to Learn?</h2>
            <p className="text-gray-400 mb-6">
              Enhance your skills with these recommended learning platforms:
            </p>
            <ul className="space-y-3">
              <li className="text-lg">• <span className="font-semibold">Coursera</span></li>
              <li className="text-lg">• <span className="font-semibold">Codecademy</span></li>
              <li className="text-lg">• <span className="font-semibold">AWS Skill Builder</span></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827] text-gray-200">
      <Navbar />
      <div className="pt-10 p-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">We Think You Might Be Interested In...</h1>
          <p className="text-xl text-gray-400">
            Based on your assessment, here are career paths that match your skills and interests.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-[#1F2937] rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors">
            <h2 className="text-2xl font-bold mb-3">Software Engineer</h2>
            <p className="text-gray-400">
              Develop applications, build systems, and work with cutting-edge technologies.
            </p>
          </div>

          <div className="bg-[#1F2937] rounded-lg p-6 border border-gray-700 hover:border-purple-500 transition-colors">
            <h2 className="text-2xl font-bold mb-3">Data Scientist</h2>
            <p className="text-gray-400">
              Analyze data, create models, and develop data-driven decision-making tools.
            </p>
          </div>

          <div className="bg-[#1F2937] rounded-lg p-6 border border-gray-700 hover:border-green-500 transition-colors">
            <h2 className="text-2xl font-bold mb-3">Game Developer</h2>
            <p className="text-gray-400">
              Design and build interactive games, creating engaging experiences and creative solutions.
            </p>
          </div>

          <div className="bg-[#1F2937] rounded-lg p-6 border border-gray-700 hover:border-yellow-500 transition-colors">
            <h2 className="text-2xl font-bold mb-3">Cybersecurity Analyst</h2>
            <p className="text-gray-400">
              Protect systems, detect threats, and ensure cybersecurity compliance.
            </p>
          </div>
        </div>

        <div className="bg-[#1F2937] rounded-lg p-8 border border-gray-700">
          <h2 className="text-2xl font-bold mb-6">Expand Your Career Matches</h2>
          <p className="text-gray-400 mb-6">
            Refine your recommendations by adjusting assessment criteria or adding preferences.
          </p>

          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-gray-400 mb-2">Enter skills (e.g., Programming, Data Analysis)</label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full bg-[#111827] border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your skills..."
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Enter preferences (e.g., remote work, high salary)</label>
              <input
                type="text"
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                className="w-full bg-[#111827] border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your preferences..."
              />
            </div>
          </div>

          <button 
            onClick={handleUpdateMatches}
            className="bg-[#4C4C86] hover:bg-[#5D5DA3] text-white font-bold py-3 px-6 rounded-lg transition duration-300"
          >
            Update Matches
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;