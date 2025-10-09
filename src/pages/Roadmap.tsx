import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { fetchRoadmap } from "../../services/dataService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface RoadmapStep {
  step: number;
  title: string;
  description: string;
  duration: string;
  resources: string[];
}

interface RoadmapResponse {
  career_name: string;
  roadmap: RoadmapStep[];
}

interface RoadmapPageProps {
  savedCareerId: number;
  careerName: string;
  onBack: () => void;
}

const RoadmapPage: React.FC<RoadmapPageProps> = ({
  savedCareerId,
  careerName,
  onBack,
}) => {
  const [roadmap, setRoadmap] = useState<RoadmapStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRoadmap = async () => {
      try {
        setLoading(true);
        const response: RoadmapResponse = await fetchRoadmap(savedCareerId);
        console.log("Roadmap Data:", JSON.stringify(response, null, 2));

        // Handle new backend response format
        if (response && response.roadmap && Array.isArray(response.roadmap)) {
          setRoadmap(response.roadmap);
        } else if (Array.isArray(response)) {
          // Fallback for old format - convert to new format
          const convertedSteps: RoadmapStep[] = (response as any[]).map(
            (step, index) => ({
              step: index + 1,
              title: step.step_description || `Step ${index + 1}`,
              description: step.step_description || "",
              duration: step.duration || "",
              resources: step.resources || [],
            })
          );
          setRoadmap(convertedSteps);
        } else {
          setRoadmap([]);
        }
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
        <Navbar />
        <div className="flex-grow p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full mb-4">
              <svg className="animate-spin w-6 h-6 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-gray-600 text-lg">Loading your career roadmap...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
        <Navbar />
        <div className="flex-grow p-8 flex items-center justify-center">
          <div className="max-w-md w-full">
            <Alert variant="destructive">
              <AlertTitle>Error Loading Roadmap</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="text-center mt-6">
              <button
                onClick={onBack}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
      <Navbar />
      <div className="flex-grow p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              {careerName} Roadmap
            </h1>
            <p className="text-lg text-gray-600">Your personalized learning path to success</p>
          </div>
          <div className="relative">
            {roadmap.length > 0 ? (
              roadmap.map((step, index) => (
                <div key={step.step} className="mb-10">
                  <div className="flex items-start">
                    <div className="w-1/12 text-center flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full mx-auto flex items-center justify-center text-white font-bold shadow-lg">
                        {step.step}
                      </div>
                      {index < roadmap.length - 1 && (
                        <div className="w-1 h-20 bg-gradient-to-b from-blue-300 to-green-300 mx-auto mt-4 rounded-full"></div>
                      )}
                    </div>
                    <div className="w-11/12 pl-8">
                      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                        <h2 className="text-2xl font-bold mb-3 text-gray-800">
                          {step.title}
                        </h2>
                        <p className="text-gray-600 mb-4 leading-relaxed">{step.description}</p>
                        <div className="flex items-center mb-4">
                          <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
                            <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium text-blue-800">
                              Duration: {step.duration}
                            </span>
                          </div>
                        </div>
                        <div className="border-t border-gray-200 pt-4">
                          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            Resources:
                          </h3>
                          <div className="grid grid-cols-1 gap-2">
                            {step.resources.map((resource, resIndex) => (
                              <div key={resIndex} className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <svg className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                {resource.includes("http") ? (
                                  <a
                                    href={resource.split("(")[1].slice(0, -1)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 font-medium underline decoration-2 underline-offset-2"
                                  >
                                    {resource.split("(")[0].trim()}
                                  </a>
                                ) : (
                                  <span className="text-gray-700">{resource}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">No roadmap available for this career.</p>
              </div>
            )}
          </div>
          <div className="text-center mt-12">
            <button
              onClick={onBack}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapPage;
