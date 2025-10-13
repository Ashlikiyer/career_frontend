import React, { useState } from "react";
import { generateRoadmap } from "../../../services/dataService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface RoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedCareers: { saved_career_id: number; career_name: string }[];
  onGenerateRoadmap: (savedCareerId: number) => void;
}

const RoadmapModal: React.FC<RoadmapModalProps> = ({
  isOpen,
  onClose,
  savedCareers,
  onGenerateRoadmap,
}) => {
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
      <div className="bg-white p-6 rounded-xl w-full max-w-md border border-gray-200 shadow-xl">
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center mr-3">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            Generate Career Roadmap
          </h2>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mb-6">
          <label
            htmlFor="career-select"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Select a Saved Career
          </label>
          <select
            id="career-select"
            value={selectedCareerId || ""}
            onChange={(e) =>
              setSelectedCareerId(Number(e.target.value) || null)
            }
            className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">Select a career</option>
            {savedCareers.map((career) => (
              <option
                key={career.saved_career_id}
                value={career.saved_career_id}
              >
                {career.career_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
            disabled={isGenerating}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-lg transition-all duration-300 flex items-center shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
              "Generate Roadmap"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoadmapModal;
