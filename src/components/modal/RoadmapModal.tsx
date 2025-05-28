import React, { useState } from 'react';
import { generateRoadmap } from '../../../services/dataService';

interface RoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedCareers: { saved_career_id: number; career_name: string }[];
  onGenerateRoadmap: (savedCareerId: number) => void;
}

const RoadmapModal: React.FC<RoadmapModalProps> = ({ isOpen, onClose, savedCareers, onGenerateRoadmap }) => {
  const [selectedCareerId, setSelectedCareerId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!selectedCareerId) return;
    setIsGenerating(true);
    setError(null);

    try {
      await generateRoadmap(selectedCareerId);
      onGenerateRoadmap(selectedCareerId);
      onClose(); // Close modal after success
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to generate roadmap.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1F2937] p-6 rounded-lg w-full max-w-md border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-200">Generate Career Roadmap</h2>
        
        {error && (
          <div className="mb-4 p-2 bg-gray-800 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="career-select" className="block text-sm font-medium text-gray-400 mb-2">
            Select a Saved Career
          </label>
          <select
            id="career-select"
            value={selectedCareerId || ''}
            onChange={(e) => setSelectedCareerId(Number(e.target.value) || null)}
            className="w-full p-2 bg-[#111827] border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-blue-400"
          >
            <option value="">Select a career</option>
            {savedCareers.map((career) => (
              <option key={career.saved_career_id} value={career.saved_career_id}>
                {career.career_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-700 transition duration-300"
            disabled={isGenerating}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-[#4C4C86] text-white rounded-lg hover:bg-[#5D5DA3] transition duration-300 flex items-center"
            disabled={!selectedCareerId || isGenerating}
          >
            {isGenerating ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate Roadmap'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoadmapModal;