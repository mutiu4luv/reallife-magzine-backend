"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCompendiumSubmission = exports.getCompendiumSubmissions = void 0;
const compendiumSubmission_model_1 = __importDefault(require("../model/compendiumSubmission.model"));
const imageUpload_1 = require("../utils/imageUpload");
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedMessageTypes = new Set(["interview", "tribute", "goodwill", "congratulatory"]);
const getCompendiumSubmissions = async (_req, res) => {
    try {
        const submissions = await compendiumSubmission_model_1.default.find().sort({ createdAt: -1 });
        res.status(200).json(submissions);
    }
    catch (error) {
        console.error("Error fetching compendium submissions:", error);
        res.status(500).json({
            message: "Error fetching compendium submissions",
            error: (0, imageUpload_1.getErrorMessage)(error),
        });
    }
};
exports.getCompendiumSubmissions = getCompendiumSubmissions;
const createCompendiumSubmission = async (req, res) => {
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
                .map((response) => ({
                prompt: String(response?.prompt || "").trim(),
                answer: String(response?.answer || "").trim(),
            }))
                .filter((response) => Boolean(response.prompt || response.answer))
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
        const submission = await compendiumSubmission_model_1.default.create({
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
    }
    catch (error) {
        console.error("Error creating compendium submission:", error);
        res.status(500).json({
            message: "Error creating compendium submission",
            error: (0, imageUpload_1.getErrorMessage)(error),
        });
    }
};
exports.createCompendiumSubmission = createCompendiumSubmission;
