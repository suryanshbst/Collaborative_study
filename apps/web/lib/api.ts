import axios from "axios";

export const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    if (
      process.env.NEXT_PUBLIC_BACKEND_URL &&
      !process.env.NEXT_PUBLIC_BACKEND_URL.includes("localhost")
    ) {
      return process.env.NEXT_PUBLIC_BACKEND_URL;
    }
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
};

export const getWsBaseUrl = () => {
  if (typeof window !== "undefined") {
    if (
      process.env.NEXT_PUBLIC_WS_URL &&
      !process.env.NEXT_PUBLIC_WS_URL.includes("localhost")
    ) {
      return process.env.NEXT_PUBLIC_WS_URL;
    }
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws`;
  }
  return process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
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
