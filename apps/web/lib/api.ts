import axios from "axios";

// NOTE: These NEXT_PUBLIC_* values are inlined into the client bundle at BUILD
// time (see dockerfile/Dockerfile.frontend build args). The variable names must
// match what docker-compose / the CI pipeline provide: NEXT_PUBLIC_BACKEND_URL
// and NEXT_PUBLIC_WS_URL. In production these should point at the public origin
// (e.g. http://ec2-xxx.compute-1.amazonaws.com), and Nginx proxies /api and the
// WebSocket upgrade through to the backend container.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
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
