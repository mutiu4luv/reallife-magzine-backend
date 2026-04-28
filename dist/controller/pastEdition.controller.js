"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePastEdition = exports.createPastEditions = exports.getPastEditions = void 0;
const pastEdition_model_1 = __importDefault(require("../model/pastEdition.model"));
const imageUpload_1 = require("../utils/imageUpload");
const getPastEditions = async (_, res) => {
    try {
        const pastEditions = await pastEdition_model_1.default.find().sort({ createdAt: -1 });
        res.status(200).json(pastEditions);
    }
    catch (error) {
        console.error("Error fetching past editions:", error);
        res.status(500).json({ message: "Error fetching past editions", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.getPastEditions = getPastEditions;
const createPastEditions = async (req, res) => {
    try {
        const { title } = req.body;
        const files = (req.files || []);
        if (!files.length) {
            return res.status(400).json({
                message: "At least one image is required. Upload files named 'images'.",
            });
        }
        const images = await Promise.all(files.map((file) => (0, imageUpload_1.uploadImage)("reality_life_past_editions", file)));
        const uploadedImages = images.filter((image) => Boolean(image));
        if (!uploadedImages.length) {
            return res.status(400).json({ message: "Unable to upload past edition images" });
        }
        const trimmedTitle = typeof title === "string" ? title.trim() : "";
        const pastEditions = await pastEdition_model_1.default.insertMany(uploadedImages.map((image) => ({
            title: trimmedTitle,
            image,
        })));
        res.status(201).json(pastEditions);
    }
    catch (error) {
        console.error("Error creating past editions:", error);
        const errorMessage = (0, imageUpload_1.getErrorMessage)(error);
        const statusCode = errorMessage.toLowerCase().includes("timeout") ? 504 : 500;
        res.status(statusCode).json({ message: "Error creating past editions", error: errorMessage });
    }
};
exports.createPastEditions = createPastEditions;
const deletePastEdition = async (req, res) => {
    try {
        const deletedPastEdition = await pastEdition_model_1.default.findByIdAndDelete(req.params.id);
        if (!deletedPastEdition) {
            return res.status(404).json({ message: "Past edition not found" });
        }
        res.status(200).json({ message: "Past edition deleted successfully", pastEdition: deletedPastEdition });
    }
    catch (error) {
        console.error("Error deleting past edition:", error);
        res.status(500).json({ message: "Error deleting past edition", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.deletePastEdition = deletePastEdition;
