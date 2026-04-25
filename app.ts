import express from "express";
import { NextFunction, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import dns from "dns";
import postRoutes from "./route/post.routes";
import upcomingEventRoutes from "./route/upcomingEvent.routes";

dns.setDefaultResultOrder("ipv4first");

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.get("/api/health", (_, res) => {
  res.json({ status: "ok" });
});

app.use("/api/posts", postRoutes);
app.use("/api/upcoming-events", upcomingEventRoutes);

app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ message: "Invalid JSON body", error: error.message });
    return;
  }

  next(error);
});

export default app;
