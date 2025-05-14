import axios, { AxiosRequestConfig, ResponseType } from "axios";
import { Cookies } from "react-cookie";

const api = axios.create({
  baseURL: "http://localhost:5000/api/",
});

const cookies = new Cookies();
let authToken: string | null = cookies.get("authToken") || null;

const setAuth = (token: string | null) => {
  authToken = token;
  if (token) {
    cookies.set("authToken", token, { path: "/", secure: true, sameSite: "strict" });
  } else {
    cookies.remove("authToken", { path: "/" });
  }
};

const getHeaders = (isFormData?: boolean) => {
  const headers: { [key: string]: string } = {};

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

// Generic data fetch function
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
    };

    const response = await api.request(config);
    return response.data;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error("An unknown error occurred");
    }
  }
}

// User-related functions
export async function registerUser(userData: { username: string; email: string; password: string }) {
  return dataFetch("users/register", "POST", userData);
}

export async function loginUser(credentials: { email: string; password: string }) {
  const response = await dataFetch("users/login", "POST", credentials);
  if (response.token) {
    setAuth(response.token);
  }
  return response;
}

export async function logoutUser() {
  setAuth(null);
}

// Export setAuth for external use
export { setAuth };