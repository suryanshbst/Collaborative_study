import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

// Clean any channel_binding or deprecated sslmode parameters that trigger warnings
const rawUrl = process.env.DATABASE_URL || "";

const connectionString = rawUrl
  .replace(/([?&])channel_binding=[^&]+/g, "")
  .replace(/([?&])sslmode=(require|prefer|verify-ca)/g, "$1sslmode=verify-full")
  .replace(/\?&/g, "?")
  .replace(/\?$/, "");

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  max: 10,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Handle idle connection drops from serverless databases (e.g. Neon, Supabase) gracefully
pool.on("error", (err) => {
  console.warn("[Database Pool] Idle client disconnected:", err.message);
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export { prisma };
