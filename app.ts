import express from "express";
import { NextFunction, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import dns from "dns";
import mongoose from "mongoose";
import postRoutes from "./route/post.routes";
import upcomingEventRoutes from "./route/upcomingEvent.routes";

dns.setDefaultResultOrder("ipv4first");

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const allowedOrigins = process.env.CORS_ORIGIN?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        !allowedOrigins?.length ||
        allowedOrigins.includes(origin)
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
  res.json({ status: "ok" });
});

const requireDatabase = (_req: Request, res: Response, next: NextFunction) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ message: "Database connection is not ready" });
    return;
  }

  next();
};

app.use("/api/posts", requireDatabase, postRoutes);
app.use("/api/upcoming-events", requireDatabase, upcomingEventRoutes);

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
