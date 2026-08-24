import axios from "axios";

/**
 * Returns the base URL for API requests.
 * In browser production environments (e.g. running on AWS EC2 behind Nginx),
 * requests use the current browser origin (or relative path "") so that they
 * automatically match whatever hostname the user navigated to (IP, EC2 DNS, or custom domain),
 * preventing CORS preflight failures and origin mismatch issues.
 * In local development, it defaults to http://localhost:8000.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    // If local dev on port 3000 or 5173, point to backend on port 8000 unless overridden
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (isLocalhost) {
      return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    }
    // In production behind Nginx, all /api requests are reverse proxied on the same origin
    return "";
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
}

/**
 * Returns the WebSocket URL.
 * Automatically selects wss: or ws: protocol and matches the host.
 */
export function getWsBaseUrl(): string {
  if (typeof window !== "undefined") {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (isLocalhost) {
      return process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
    }
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Nginx proxies /ws to the backend websocket server
    return `${wsProtocol}//${window.location.host}/ws`;
  }
  return process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
}

export const API_BASE_URL = getApiBaseUrl();
export const WS_BASE_URL = getWsBaseUrl();

export const api = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

// Dynamic baseURL and JWT token injection
api.interceptors.request.use((config) => {
  if (config.baseURL === undefined) {
    config.baseURL = getApiBaseUrl();
  }
  if (typeof window !== "undefined") {
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
