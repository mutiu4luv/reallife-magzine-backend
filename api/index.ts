import { Request, Response } from "express";
import app from "../app";
import { connectDB } from "../config/db";

export default async function handler(req: Request, res: Response) {
  try {
    await connectDB();
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
  }

  return app(req, res);
}
