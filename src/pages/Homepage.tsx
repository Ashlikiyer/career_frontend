const Homepage = () => {
  return (
    <div className="bg-[#111827] text-gray-200 min-h-screen flex flex-col">
      <nav className="bg-[#111827] p-4 flex justify-between items-center">
        <div className="flex space-x-20 flex-grow justify-center">
          <a href="#" className="hover:text-white">
            HOME
          </a>
          <a href="#" className="hover:text-white">
            ASSESSMENT
          </a>
          <a href="#" className="hover:text-white">
            DASHBOARD
          </a>
        </div>
        <div className="rounded-full bg-gray-700 w-10 h-10 flex items-center justify-center">
          <img src="" alt="Profile" className="rounded-full" />
        </div>
      </nav>

      <div className="flex-grow text-center p-25">
        <h1 className="text-4xl font-bold mb-4">
          Discover Your Future in Tech 🚀
        </h1>
        <p className="text-lg mb-8">
          Find the best career path for you using our machine learning-powered
          career assessment. Answer a few questions and get personalized
          recommendations based on your skills and interests.
        </p>
        <button className="bg-[#4C4C86] hover:bg-[#4C4C86] text-white font-bold py-3 px-6 rounded transition delay-10 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110">
          Start Assessment
        </button>
      </div>

      <div className="bg-[#D9D9D9] p-22">
        <h2 className="text-3xl text-black font-semibold mb-8 -mt-5 text-center">
          How It Works
        </h2>
        <div className="flex justify-around">
          <div className="block max-w-sm p-6 bg-[#FFFFFF] border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition duration-150 ease-in-out text-center">
            {" "}
            {/* Added text-center */}
            <div className="bg-[#4C4C86] text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2 text-black">
              Step 1: Take the Assessment
            </h3>
            <p className="text-sm text-black">
              Answer a series of career-related questions to help us understand
              your interests.
            </p>
          </div>
          <div className="block max-w-sm p-6 bg-[#FFFFFF] border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition duration-150 ease-in-out text-center">
            {" "}
            {/* Added text-center */}
            <div className="bg-[#4C4C86] text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2 text-black">
              Step 2: Get ML-Based Insights
            </h3>
            <p className="text-sm text-black">
              Our machine learning model will analyze your responses to suggest
              possible career paths.
            </p>
          </div>
          <div className="block max-w-sm p-6 bg-[#FFFFFF] border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition duration-150 ease-in-out text-center">
            {" "}
            {/* Added text-center */}
            <div className="bg-[#4C4C86] text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2 text-black">
              Step 3: Refine Your Choices
            </h3>
            <p className="text-sm text-black">
              Customize your results by adding your skills and academic
              strengths.
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
            <p>ML-Powered Career Matching</p>
          </div>
          <div className="flex items-center text-center bg-[#5D5DA3] p-4 rounded-lg text-black font-semibold">
            <img src="src/assets/check-check.svg" alt="Check" className="w-12 h-12 mr-4" />
            <p>Personalized, Data-Driven Insights</p>
          </div>
          <div className="flex items-center text-center bg-[#5D5DA3] p-4 rounded-lg text-black font-semibold">
            {/* Replace with your check icon */}
            <img src="src/assets/check-check.svg" alt="Check" className="w-12 h-12 mr-4" />
            <p>Save & Update Your Career Plan</p>
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
