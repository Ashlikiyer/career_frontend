import Navbar from "../components/Navbar";
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Cookies } from "react-cookie";

const Homepage = () => {
  const navigate = useNavigate();
  const cookies = new Cookies();

  useEffect(() => {
    const authToken = cookies.get("authToken");
    if (!authToken) {
      navigate("/login");
    }
  }, [navigate, cookies]);

  return (
    <div className="bg-[#111827] text-gray-200 min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-grow text-center p-25">
        <h1 className="text-4xl font-bold mb-4">Discover Your Future in Tech 🚀</h1>
        <p className="text-lg mb-8">
          Find the best career path for you using our AI-powered
          career assessment. Answer a few questions and get personalized
          career recommendations based on your skills and interests.
        </p>
        <Link
          to="/assessment"
          className="bg-[#4C4C86] hover:bg-[#4C4C86] text-white font-bold py-3 px-6 rounded transition delay-10 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110 inline-block"
        >
          Start Assessment
        </Link>
      </div>

      <div className="bg-[#D9D9D9] p-22">
        <h2 className="text-3xl text-black font-semibold mb-8 -mt-5 text-center">
          How It Works
        </h2>
        <div className="flex justify-around">
          <div className="block max-w-sm p-6 bg-[#FFFFFF] border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition duration-150 ease-in-out text-center">
            <div className="bg-[#4C4C86] text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2 text-black">
              Step 1: Take the Assessment
            </h3>
            <p className="text-sm text-black">
              Answer a series of career-related questions to help us understand
              your interests and skills.
            </p>
          </div>
          <div className="block max-w-sm p-6 bg-[#FFFFFF] border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition duration-150 ease-in-out text-center">
            <div className="bg-[#4C4C86] text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2 text-black">
              Step 2: Get AI-Powered Recommendations
            </h3>
            <p className="text-sm text-black">
              Our advanced AI model analyzes your responses to suggest
              personalized career options, which you can save or retake.
            </p>
          </div>
          <div className="block max-w-sm p-6 bg-[#FFFFFF] border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition duration-150 ease-in-out text-center">
            <div className="bg-[#4C4C86] text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2 text-black">
              Step 3: Generate Your Career Path
            </h3>
            <p className="text-sm text-black">
              Save your career choice and generate a detailed career path on your
              dashboard to guide your next steps.
            </p>
          </div>
        </div>
      </div>

      <div className="p-20">
        <h2 className="text-3xl font-semibold mb-8 text-center">
          Why Use This System?
        </h2>
        <div className="flex justify-around">
          <div className="flex items-center text-center bg-[#5D5DA3] p-4 rounded-lg text-black font-semibold">
            <img
              src="src/assets/check-check.svg"
              alt="Check"
              className="w-12 h-12 mr-4 text-black"
            />
            <p>Advanced AI Career Matching</p>
          </div>
          <div className="flex items-center text-center bg-[#5D5DA3] p-4 rounded-lg text-black font-semibold">
            <img src="src/assets/check-check.svg" alt="Check" className="w-12 h-12 mr-4" />
            <p>Personalized, AI-Driven Recommendations</p>
          </div>
          <div className="flex items-center text-center bg-[#5D5DA3] p-4 rounded-lg text-black font-semibold">
            <img src="src/assets/check-check.svg" alt="Check" className="w-12 h-12 mr-4" />
            <p>Save & Explore Your Career Path</p>
          </div>
        </div>
      </div>

      <footer className="bg-[#111827] p-4 text-center">
        <p>© 2024 Career Path Recommendation System | Gordon College</p>
      </footer>
    </div>
  );
};

export default Homepage;