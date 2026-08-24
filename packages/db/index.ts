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

const isSslRequired =
  connectionString.includes("sslmode=require") ||
  connectionString.includes("sslmode=verify-full") ||
  connectionString.includes("sslmode=verify-ca") ||
  connectionString.includes("neon.tech") ||
  connectionString.includes("supabase.co") ||
  connectionString.includes("pooler.supabase.com") ||
  connectionString.includes("rds.amazonaws.com") ||
  (process.env.NODE_ENV === "production" &&
    !connectionString.includes("sslmode=disable") &&
    !connectionString.includes("localhost") &&
    !connectionString.includes("127.0.0.1"));

const pool = new Pool({
  connectionString,
  ssl: isSslRequired ? { rejectUnauthorized: false } : false,
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
