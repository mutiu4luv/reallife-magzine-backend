import { Request, Response } from "express";
import contactMessageModel from "../model/contactMessage.model";
import { getErrorMessage } from "../utils/imageUpload";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const getContactMessages = async (_req: Request, res: Response) => {
  try {
    const contactMessages = await contactMessageModel.find().sort({ createdAt: -1 });
    res.status(200).json(contactMessages);
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    res.status(500).json({
      message: "Error fetching contact messages",
      error: getErrorMessage(error),
    });
  }
};

export const createContactMessage = async (req: Request, res: Response) => {
  try {
    const fullName = typeof req.body.fullName === "string" ? req.body.fullName.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const message = typeof req.body.message === "string" ? req.body.message.trim() : "";

    if (!fullName || !email || !message) {
      return res.status(400).json({
        message: "Full name, email, and message are required",
      });
    }

    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: "A valid email address is required" });
    }

    const contactMessage = await contactMessageModel.create({
      fullName,
      email,
      message,
    });

    res.status(201).json({
      message: "Contact message sent successfully",
      contactMessage,
    });
  } catch (error) {
    console.error("Error creating contact message:", error);
    res.status(500).json({
      message: "Error creating contact message",
      error: getErrorMessage(error),
    });
  }
};
