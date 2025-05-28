import axios, { AxiosRequestConfig, ResponseType } from "axios";
import { Cookies } from "react-cookie";

const api = axios.create({
  baseURL: "http://localhost:5000/api/",
  withCredentials: true,
});

const cookies = new Cookies();
let authToken: string | null = cookies.get("authToken") || null;

const setAuth = (token: string | null) => {
  authToken = token;
  if (token) {
    cookies.set("authToken", token, { path: "/", secure: false, sameSite: "lax" });
  } else {
    cookies.remove("authToken", { path: "/" });
  }
};

const getHeaders = (isFormData?: boolean) => {
  const headers: { [key: string]: string } = {};
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  } else {
    console.warn("No authToken available for request");
  }
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};

export async function dataFetch(
  endpoint: string,
  method: string,
  data?: any,
  responseType?: ResponseType
) {
  try {
    const isFormData = data instanceof FormData;
    const config: AxiosRequestConfig = {
      url: endpoint,
      method,
      data,
      headers: getHeaders(isFormData),
      responseType: responseType || "json",
      withCredentials: true,
    };
    console.log("Request Config:", JSON.stringify(config, null, 2));
    const response = await api.request(config);
    console.log("Response Data:", JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("API Error:", {
        message: error.message,
        status: error.response?.status,
        data: JSON.stringify(error.response?.data, null, 2),
        config: JSON.stringify(error.config, null, 2),
      });
      const errorMessage = error.response?.data?.details || error.response?.data?.error || error.message;
      throw new Error(errorMessage);
    } else if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error("An unknown error occurred");
    }
  }
}

export async function registerUser(userData: { username: string; email: string; password: string }) {
  return dataFetch("users/register", "POST", userData);
}

export async function loginUser(credentials: { email: string; password: string }) {
  const response = await dataFetch("users/login", "POST", credentials);
  if (response.token) {
    setAuth(response.token);
    console.log("Token set:", cookies.get("authToken"));
  } else {
    console.error("No token in login response:", response);
  }
  return response;
}

export async function logoutUser() {
  setAuth(null);
}

export async function fetchDefaultQuestion() {
  return dataFetch("questions/default", "GET");
}

export async function fetchNextQuestion(currentQuestionId: number) {
  return dataFetch(`questions/next?currentQuestionId=${currentQuestionId}`, "GET");
}

export async function submitAnswer(assessmentId: string, questionId: number, selectedOption: string) {
  const data = {
    assessment_id: assessmentId,
    question_id: questionId,
    selected_option: selectedOption.trim(), // Normalize option
  };
  console.log("Submitting Answer Payload:", JSON.stringify(data, null, 2));
  return dataFetch("results/submit-answer", "POST", data);
}

export async function restartQuiz() {
  return dataFetch("questions/restart", "POST");
}

export async function fetchResults(assessmentId: string) {
  return dataFetch(`results/${assessmentId}`, "GET");
}

// Replace saveCareer and add fetchSavedCareers if not already present
export async function saveCareer(careerName: string) {
  const data = {
    career_name: careerName,
  };
  console.log("Saving Career Payload:", JSON.stringify(data, null, 2));
  return dataFetch("saved-careers", "POST", data);
}

export async function deleteCareer(savedCareerId: number) {
  return dataFetch(`saved-careers/${savedCareerId}`, "DELETE");
}

export async function fetchSavedCareers() {
  return dataFetch("saved-careers", "GET");
}

// Keep generateRoadmap as-is (no network request)
export async function generateRoadmap(savedCareerId: number) {
  return { success: true, saved_career_id: savedCareerId };
}

// Update fetchRoadmap to use savedCareerId
export async function fetchRoadmap(savedCareerId: number) {
  try {
    const data = await dataFetch(`roadmaps/${savedCareerId}`, "GET");
    return data;
  } catch (error) {
    console.error("Fetch Roadmap Error:", error);
    throw new Error("Failed to load roadmap from server.");
  }
}

export { setAuth };