import { Request, Response } from "express";
import app from "../app";

export default async function handler(req: Request, res: Response) {
  return app(req, res);
}
