import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { fetchRoadmap } from '../../services/dataService';

interface RoadmapStep {
  roadmap_id: number;
  saved_career_id: number; // Changed to number to match backend response
  step_order: string;
  step_description: string;
  duration: string;
  resources: string[];
}

interface RoadmapPageProps {
  savedCareerId: number;
  careerName: string;
  onBack: () => void;
}

const RoadmapPage: React.FC<RoadmapPageProps> = ({ savedCareerId, careerName, onBack }) => {
  const [roadmap, setRoadmap] = useState<RoadmapStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRoadmap = async () => {
      try {
        setLoading(true);
        const data = await fetchRoadmap(savedCareerId); // Use savedCareerId instead of careerName
        console.log("Roadmap Data:", JSON.stringify(data, null, 2));
        setRoadmap(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        setError((err as Error).message || "Failed to load roadmap.");
        console.error("Fetch Roadmap Error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadRoadmap();
  }, [savedCareerId]); // Depend on savedCareerId

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
      <div className="flex-grow p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">{careerName} Roadmap</h1>
          <div className="relative">
            {roadmap.length > 0 ? (
              roadmap.map((step) => (
                <div key={step.roadmap_id} className="mb-12">
                  <div className="flex items-start">
                    <div className="w-1/12 text-center">
                      <div className="w-4 h-4 bg-blue-400 rounded-full mx-auto"></div>
                      {step.roadmap_id < roadmap.length && (
                        <div className="w-1 h-full bg-gray-600 mx-auto mt-2"></div>
                      )}
                    </div>
                    <div className="w-11/12 pl-6">
                      <h2 className="text-xl font-semibold mb-2">{step.step_order}</h2>
                      <p className="text-gray-300 mb-2">{step.step_description}</p>
                      <p className="text-sm text-gray-400 mb-2">Duration: {step.duration}</p>
                      <h3 className="text-sm font-medium text-gray-200 mb-1">Resources:</h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                        {step.resources.map((resource, resIndex) => (
                          <li key={resIndex}>
                            {resource.includes('http') ? (
                              <a
                                href={resource.split('(')[1].slice(0, -1)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline"
                              >
                                {resource.split('(')[0].trim()}
                              </a>
                            ) : (
                              resource
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400">No roadmap available for this career.</p>
            )}
          </div>
          <div className="text-center mt-8">
            <button
              onClick={onBack}
              className="bg-[#4C4C86] hover:bg-[#5D5DA3] text-white font-bold py-2 px-6 rounded-lg transition duration-300"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapPage;