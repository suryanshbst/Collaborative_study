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
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(
  cors({
    origin: [FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  }),
);
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
  console.log(`🌐 Frontend allowed origins: ${FRONTEND_URL}`);
});