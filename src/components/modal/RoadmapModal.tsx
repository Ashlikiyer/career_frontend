import React from "react";

interface RoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedCareers: { saved_career_id: number; career_name: string }[];
  onGenerateRoadmap?: (savedCareerId: number) => void; // Optional since roadmaps are now auto-generated
}

const RoadmapModal: React.FC<RoadmapModalProps> = ({
  isOpen,
  onClose,
  savedCareers,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md border border-gray-200 shadow-xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Roadmaps Auto-Generated!
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm leading-relaxed">
              <strong>Great news!</strong> Roadmaps are now automatically
              generated when you save careers. No manual generation needed
              anymore! Just click "Start Learning Path" on any saved career to
              begin.
            </p>
          </div>
          <div className="space-y-2 mb-6">
            <h3 className="font-semibold text-gray-800">Your Saved Careers:</h3>
            <div className="text-left">
              {savedCareers.map((career) => (
                <div
                  key={career.saved_career_id}
                  className="flex items-center py-2 px-3 bg-gray-50 rounded-lg mb-2"
                >
                  <svg
                    className="w-4 h-4 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">
                    {career.career_name}
                  </span>
                  <span className="ml-auto text-xs text-green-600 font-medium">
                    Roadmap Ready
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-lg transition-all duration-300"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoadmapModal;
