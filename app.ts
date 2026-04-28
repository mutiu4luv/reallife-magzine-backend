import express from "express";
import { NextFunction, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import dns from "dns";
import { connectDB, getDatabaseStatus } from "./config/db";
import contactRoutes from "./route/contact.routes";
import postRoutes from "./route/post.routes";
import upcomingEventRoutes from "./route/upcomingEvent.routes";
import newsRoutes from "./route/news.routes";
import pastEditionRoutes from "./route/pastEdition.routes";

dns.setDefaultResultOrder("ipv4first");

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const allowedOrigins = process.env.CORS_ORIGIN?.split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);
const isLocalDevOrigin = (origin: string) => /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

app.use(
  cors({
    origin: (origin, callback) => {
      const normalizedOrigin = origin?.replace(/\/+$/, "");

      if (
        !normalizedOrigin ||
        !allowedOrigins?.length ||
        allowedOrigins.includes(normalizedOrigin) ||
        isLocalDevOrigin(normalizedOrigin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.get("/api/health", (_, res) => {
  res.json({
    status: "ok",
    database: getDatabaseStatus(),
    environment: process.env.NODE_ENV || "development",
  });
});

const requireDatabase = async (_req: Request, res: Response, next: NextFunction) => {
  const retryDelays = [500, 1200, 2500];
  let lastError: unknown;

  try {
    for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
      try {
        await connectDB();
        next();
        return;
      } catch (error) {
        lastError = error;

        if (attempt < retryDelays.length) {
          await new Promise((resolve) => {
            setTimeout(resolve, retryDelays[attempt]);
          });
        }
      }
    }

    throw lastError;
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    res.status(503).json({
      message: "Database connection is not ready. Please try again in a moment.",
    });
  }
};

app.use("/api/posts", requireDatabase, postRoutes);
app.use("/api/upcoming-events", requireDatabase, upcomingEventRoutes);
app.use("/api/events", requireDatabase, upcomingEventRoutes);
app.use("/api/news", requireDatabase, newsRoutes);
app.use("/api/past-editions", requireDatabase, pastEditionRoutes);
app.use("/api/contact", requireDatabase, contactRoutes);

app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (error instanceof SyntaxError && "body" in error) {
    res
      .status(400)
      .json({ message: "Invalid JSON body", error: error.message });
    return;
  }

  next(error);
});

export default app;
