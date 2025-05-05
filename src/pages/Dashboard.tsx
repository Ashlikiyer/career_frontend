
import Navbar from '../components/Navbar';

const Dashboard = () => {
  return (
    // Main container with light background and full height
    <div className="min-h-screen bg-white text-gray-800 flex flex-col">
      {/* Navbar component included at the top, assumed to contain HOME, ASSESSMENT, DASHBOARD links */}
      <Navbar />

      {/* Main content area with padding and centered layout */}
      <div className="flex-grow p-6 flex items-center justify-center">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header section with welcome message */}
          <h1 className="text-2xl font-bold mb-2">Welcome to Your Career Dashboard</h1>
          <p className="text-gray-600 mb-8">Here you can view your saved career paths, or retake the assessment.</p>

          {/* Career paths section with flex layout */}
          <div className="flex justify-center gap-6 mb-8">
            {/* Software Engineer card with light blue background and hover effect */}
            <div className="w-56 p-4 bg-blue-100 rounded-lg transition duration-300 ease-in-out hover:bg-blue-200 hover:shadow-md">
              <h2 className="text-lg font-semibold text-gray-800">Software Engineer</h2>
              <p className="text-gray-600 text-sm">Develop applications, build systems, and work with cutting-edge technologies.</p>
            </div>

            {/* Data Scientist card with light green background and hover effect */}
            <div className="w-56 p-4 bg-green-100 rounded-lg transition duration-300 ease-in-out hover:bg-green-200 hover:shadow-md">
              <h2 className="text-lg font-semibold text-gray-800">Data Scientist</h2>
              <p className="text-gray-600 text-sm">Analyze data, create models, and gain insights to drive decision-making.</p>
            </div>

            {/* Game Developer card with light yellow background and hover effect */}
            <div className="w-56 p-4 bg-yellow-100 rounded-lg transition duration-300 ease-in-out hover:bg-yellow-200 hover:shadow-md">
              <h2 className="text-lg font-semibold text-gray-800">Game Developer</h2>
              <p className="text-gray-600 text-sm">Design and build interactive games using programming and creative skills.</p>
            </div>
          </div>

          {/* Retake assessment button with hover animation from Assessment page */}
          <button className="mb-8 px-6 py-2 bg-gray-800 text-white rounded transition delay-10 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110">
            Retake assessment
          </button>

          {/* Learning resources section with border and hover effect */}
          <div className="max-w-lg mx-auto p-4 border border-gray-300 rounded-lg transition duration-300 ease-in-out hover:shadow-md">
            <h2 className="text-xl font-semibold mb-2">Where to Learn?</h2>
            <p className="text-gray-600 mb-2">Enhance your skills with these recommended learning platforms:</p>
            <ul className="list-none text-blue-600 text-left">
              <li className="mb-1">Coursera</li>
              <li className="mb-1">Codeacademy</li>
              <li>AWS Skill Builder</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;