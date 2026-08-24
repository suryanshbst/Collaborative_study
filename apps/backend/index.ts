import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import authRoutes from "./routes/auth";
import historyRoutes from "./routes/history";
import { handleConnection } from "./websocket";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = Number(process.env.PORT) || 8000;

// Parse FRONTEND_URL environment variable into allowed origin list
const configuredOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8000",
];

const allowedOrigins = [...configuredOrigins, ...defaultOrigins];

const isOriginAllowed = (origin: string): boolean => {
  // Allow all if wildcard configured or explicitly in allowed list
  if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
    return true;
  }
  // Allow AWS EC2 public DNS hostnames (e.g. http://ec2-98-82-153-41.compute-1.amazonaws.com)
  if (/^https?:\/\/ec2-[0-9-]+(\.[a-z0-9-]+)?\.amazonaws\.com(:\d+)?$/.test(origin)) {
    return true;
  }
  // Allow IPv4 address origins (e.g. http://98.82.153.41 or http://98.82.153.41:3000)
  if (/^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin)) {
    return true;
  }
  // Allow localhost / 127.0.0.1 on any port
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return true;
  }
  return false;
};

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (such as mobile apps, curl, Postman, or server-to-server)
    if (!origin || isOriginAllowed(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS] Request from origin '${origin}' blocked.`);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "StudySphere Backend",
    time: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/history", historyRoutes);

// Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("[Server Error]", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  },
);

// WebSocket connection handler
wss.on("connection", (socket, req) => {
  const url = new URL(req.url || "/", "http://localhost");
  const userId = url.searchParams.get("userId") || `guest-${Date.now()}`;
  const username = url.searchParams.get("username") || "Student";

  console.log(`[WebSocket] Client connected: ${username} (${userId})`);
  handleConnection(socket, userId, username);
});

server.listen(PORT, () => {
  console.log(`🚀 StudySphere Backend running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🌐 Configured CORS origins: ${allowedOrigins.join(", ")}`);
});