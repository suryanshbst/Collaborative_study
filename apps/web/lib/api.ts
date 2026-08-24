import axios from "axios";

export const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:8000";
};

export const getWsBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}`;
  }
  return "ws://localhost:8000";
};

export const API_BASE_URL = getApiBaseUrl();
export const WS_BASE_URL = getWsBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token automatically and ensure client baseURL
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
      config.baseURL = window.location.origin;
    }
    const token = localStorage.getItem("studysphere_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // Token expired
      localStorage.removeItem("studysphere_token");
      localStorage.removeItem("studysphere_user");
    }
    return Promise.reject(error);
  },
);
