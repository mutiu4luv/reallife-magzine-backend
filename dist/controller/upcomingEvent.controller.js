"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUpcomingEvent = exports.updateUpcomingEvent = exports.createUpcomingEvent = exports.getUpcomingEventById = exports.getUpcomingEvents = void 0;
const upcomingEvent_model_1 = __importDefault(require("../model/upcomingEvent.model"));
const imageUpload_1 = require("../utils/imageUpload");
const getUpcomingEvents = async (_, res) => {
    try {
        const events = await upcomingEvent_model_1.default.find().sort({ createdAt: -1 });
        res.status(200).json(events);
    }
    catch (error) {
        console.error("Error fetching upcoming events:", error);
        res.status(500).json({ message: "Error fetching upcoming events", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.getUpcomingEvents = getUpcomingEvents;
const getUpcomingEventById = async (req, res) => {
    try {
        const event = await upcomingEvent_model_1.default.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: "Upcoming event not found" });
        }
        res.status(200).json(event);
    }
    catch (error) {
        console.error("Error fetching upcoming event:", error);
        res.status(500).json({ message: "Error fetching upcoming event", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.getUpcomingEventById = getUpcomingEventById;
const createUpcomingEvent = async (req, res) => {
    try {
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
const updateUpcomingEvent = async (req, res) => {
    try {
        const existingEvent = await upcomingEvent_model_1.default.findById(req.params.id);
        if (!existingEvent) {
            return res.status(404).json({ message: "Upcoming event not found" });
        }
        const { title, description, isActive, imageUrls, images: bodyImages } = req.body;
        const files = (req.files || []);
        if (title !== undefined && !title?.trim()) {
            return res.status(400).json({ message: "Title cannot be empty" });
        }
        if (description !== undefined && !description?.trim()) {
            return res.status(400).json({ message: "Description cannot be empty" });
        }
        const uploadedImages = (await Promise.all(files.map((file) => (0, imageUpload_1.uploadImage)("reality_life_events", file)))).filter((image) => Boolean(image));
        const parseImageList = (value) => {
            if (Array.isArray(value)) {
                return value.filter((item) => typeof item === "string" && item.trim().length > 0);
            }
            if (typeof value === "string" && value.trim()) {
                try {
                    const parsed = JSON.parse(value);
                    if (Array.isArray(parsed)) {
                        return parsed.filter((item) => typeof item === "string" && item.trim().length > 0);
                    }
                }
                catch {
                    return [value.trim()];
                }
            }
            return [];
        };
        const existingImageUrls = parseImageList(imageUrls || bodyImages);
        const nextImages = [...existingImageUrls, ...uploadedImages];
        const shouldUpdateImages = files.length > 0 || existingImageUrls.length > 0;
        if (shouldUpdateImages && nextImages.length === 0) {
            return res.status(400).json({ message: "At least one image is required" });
        }
        existingEvent.set({
            title: title === undefined ? existingEvent.title : title.trim(),
            description: description === undefined ? existingEvent.description : description.trim(),
            images: shouldUpdateImages ? nextImages : existingEvent.images,
            isActive: isActive === undefined
                ? existingEvent.isActive
                : isActive === "true" || isActive === true,
        });
        const updatedEvent = await existingEvent.save();
        res.status(200).json(updatedEvent);
    }
    catch (error) {
        console.error("Error updating upcoming event:", error);
        const errorMessage = (0, imageUpload_1.getErrorMessage)(error);
        const statusCode = errorMessage.toLowerCase().includes("timeout") ? 504 : 500;
        res.status(statusCode).json({ message: "Error updating upcoming event", error: errorMessage });
    }
};
exports.updateUpcomingEvent = updateUpcomingEvent;
const deleteUpcomingEvent = async (req, res) => {
    try {
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
