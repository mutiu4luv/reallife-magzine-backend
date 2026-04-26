import { Response } from "express";
import mongoose from "mongoose";

export const isDatabaseConnected = () => mongoose.connection.readyState === 1;

export const sendDatabaseUnavailable = (res: Response) => {
  res.status(503).json({
    message: "Database connection is not ready",
  });
};

export const sendEmptyListWhenDatabaseUnavailable = (res: Response) => {
  res.setHeader("X-Database-Status", "not-ready");
  res.status(200).json([]);
};
