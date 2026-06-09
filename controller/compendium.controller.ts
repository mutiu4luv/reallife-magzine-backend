import { Request, Response } from "express";
import compendiumSubmissionModel from "../model/compendiumSubmission.model";
import { getErrorMessage } from "../utils/imageUpload";
import { AuthenticatedRequest } from "../utils/auth";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedMessageTypes = new Set(["interview", "tribute", "goodwill", "congratulatory"]);

export const getCompendiumSubmissions = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const submissions = await compendiumSubmissionModel.find().sort({ createdAt: -1 });
    res.status(200).json(submissions);
  } catch (error) {
    console.error("Error fetching compendium submissions:", error);
    res.status(500).json({
      message: "Error fetching compendium submissions",
      error: getErrorMessage(error),
    });
  }
};

export const createCompendiumSubmission = async (req: Request, res: Response) => {
  try {
    const messageType = String(req.body.messageType || "").trim().toLowerCase();
    const fullName = String(req.body.fullName || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").trim();
    const organization = String(req.body.organization || "").trim();
    const headline = String(req.body.headline || "").trim();
    const message = String(req.body.message || "").trim();
    const advertRate = String(req.body.advertRate || "").trim();
    const responses = Array.isArray(req.body.responses)
      ? req.body.responses
          .map((response: { prompt?: unknown; answer?: unknown }) => ({
            prompt: String(response?.prompt || "").trim(),
            answer: String(response?.answer || "").trim(),
          }))
          .filter((response: { prompt: string; answer: string }) => Boolean(response.prompt || response.answer))
      : [];

    if (!allowedMessageTypes.has(messageType)) {
      return res.status(400).json({
        message: "A valid message type is required.",
      });
    }

    if (!fullName || !email || !phone) {
      return res.status(400).json({
        message: "Full name, email, and phone number are required.",
      });
    }

    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: "A valid email address is required." });
    }

    if (messageType === "interview" && responses.length === 0) {
      return res.status(400).json({
        message: "Interview submissions must include at least one answer.",
      });
    }

    const submission = await compendiumSubmissionModel.create({
      messageType,
      fullName,
      email,
      phone,
      organization,
      headline,
      message,
      advertRate,
      responses,
    });

    res.status(201).json({
      message: "Commemorative submission sent successfully",
      submission,
    });
  } catch (error) {
    console.error("Error creating compendium submission:", error);
    res.status(500).json({
      message: "Error creating compendium submission",
      error: getErrorMessage(error),
    });
  }
};
