"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUpcomingEvent = exports.createUpcomingEvent = exports.getUpcomingEvents = void 0;
const upcomingEvent_model_1 = __importDefault(require("../model/upcomingEvent.model"));
const databaseStatus_1 = require("../utils/databaseStatus");
const imageUpload_1 = require("../utils/imageUpload");
const getUpcomingEvents = async (_, res) => {
    try {
        if (!(0, databaseStatus_1.isDatabaseConnected)()) {
            (0, databaseStatus_1.sendEmptyListWhenDatabaseUnavailable)(res);
            return;
        }
        const events = await upcomingEvent_model_1.default.find().sort({ createdAt: -1 });
        res.status(200).json(events);
    }
    catch (error) {
        console.error("Error fetching upcoming events:", error);
        res.status(500).json({ message: "Error fetching upcoming events", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.getUpcomingEvents = getUpcomingEvents;
const createUpcomingEvent = async (req, res) => {
    try {
        if (!(0, databaseStatus_1.isDatabaseConnected)()) {
            (0, databaseStatus_1.sendDatabaseUnavailable)(res);
            return;
        }
        const { title, description, isActive } = req.body;
        const files = (req.files || []);
        if (!title?.trim() || !description?.trim()) {
            return res.status(400).json({ message: "Title and description are required" });
        }
        if (!files.length) {
            return res.status(400).json({
                message: "At least one image is required. Upload files named 'images'.",
            });
        }
        const images = await Promise.all(files.map((file) => (0, imageUpload_1.uploadImage)("reality_life_events", file)));
        const uploadedImages = images.filter((image) => Boolean(image));
        const event = await upcomingEvent_model_1.default.create({
            title: title.trim(),
            description: description.trim(),
            images: uploadedImages,
            isActive: isActive === undefined ? true : isActive === "true" || isActive === true,
        });
        res.status(201).json(event);
    }
    catch (error) {
        console.error("Error creating upcoming event:", error);
        const errorMessage = (0, imageUpload_1.getErrorMessage)(error);
        const statusCode = errorMessage.toLowerCase().includes("timeout") ? 504 : 500;
        res.status(statusCode).json({ message: "Error creating upcoming event", error: errorMessage });
    }
};
exports.createUpcomingEvent = createUpcomingEvent;
const deleteUpcomingEvent = async (req, res) => {
    try {
        if (!(0, databaseStatus_1.isDatabaseConnected)()) {
            (0, databaseStatus_1.sendDatabaseUnavailable)(res);
            return;
        }
        const deletedEvent = await upcomingEvent_model_1.default.findByIdAndDelete(req.params.id);
        if (!deletedEvent) {
            return res.status(404).json({ message: "Upcoming event not found" });
        }
        res.status(200).json({ message: "Upcoming event deleted successfully", event: deletedEvent });
    }
    catch (error) {
        console.error("Error deleting upcoming event:", error);
        res.status(500).json({ message: "Error deleting upcoming event", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.deleteUpcomingEvent = deleteUpcomingEvent;
