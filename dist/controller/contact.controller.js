"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContactMessage = exports.getContactMessages = void 0;
const contactMessage_model_1 = __importDefault(require("../model/contactMessage.model"));
const imageUpload_1 = require("../utils/imageUpload");
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const getContactMessages = async (_req, res) => {
    try {
        const contactMessages = await contactMessage_model_1.default.find().sort({ createdAt: -1 });
        res.status(200).json(contactMessages);
    }
    catch (error) {
        console.error("Error fetching contact messages:", error);
        res.status(500).json({
            message: "Error fetching contact messages",
            error: (0, imageUpload_1.getErrorMessage)(error),
        });
    }
};
exports.getContactMessages = getContactMessages;
const createContactMessage = async (req, res) => {
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
        const contactMessage = await contactMessage_model_1.default.create({
            fullName,
            email,
            message,
        });
        res.status(201).json({
            message: "Contact message sent successfully",
            contactMessage,
        });
    }
    catch (error) {
        console.error("Error creating contact message:", error);
        res.status(500).json({
            message: "Error creating contact message",
            error: (0, imageUpload_1.getErrorMessage)(error),
        });
    }
};
exports.createContactMessage = createContactMessage;
