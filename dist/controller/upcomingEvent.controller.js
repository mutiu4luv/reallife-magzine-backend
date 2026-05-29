"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.undoLastUpcomingEventEdit = exports.permanentDeleteUpcomingEvent = exports.restoreUpcomingEvent = exports.getDeletedUpcomingEvents = exports.deleteUpcomingEvent = exports.updateUpcomingEvent = exports.createUpcomingEvent = exports.getUpcomingEventById = exports.getUpcomingEvents = void 0;
const upcomingEvent_model_1 = __importDefault(require("../model/upcomingEvent.model"));
const imageUpload_1 = require("../utils/imageUpload");
const getEditorMeta = (req) => ({
    id: String(req.user?._id || ""),
    name: req.user?.name || "",
    email: req.user?.email || "",
    role: req.user?.role || "",
});
const getUpcomingEvents = async (_, res) => {
    try {
        const events = await upcomingEvent_model_1.default.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
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
        const event = await upcomingEvent_model_1.default.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
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
        const previousVersion = {
            title: existingEvent.title,
            description: existingEvent.description,
            images: Array.isArray(existingEvent.images) ? existingEvent.images : [],
            isActive: existingEvent.isActive,
            editedAt: new Date(),
            editedBy: getEditorMeta(req),
        };
        existingEvent.set({
            title: title === undefined ? existingEvent.title : title.trim(),
            description: description === undefined ? existingEvent.description : description.trim(),
            images: shouldUpdateImages ? nextImages : existingEvent.images,
            isActive: isActive === undefined
                ? existingEvent.isActive
                : isActive === "true" || isActive === true,
            editHistory: [...(existingEvent.editHistory || []), previousVersion],
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
        const item = await upcomingEvent_model_1.default.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "Upcoming event not found" });
        }
        if (req.user?.role === "admin") {
            const deletedEvent = await upcomingEvent_model_1.default.findByIdAndDelete(req.params.id);
            return res.status(200).json({ message: "Upcoming event deleted permanently", event: deletedEvent });
        }
        item.set({
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: getEditorMeta(req),
        });
        await item.save();
        res.status(200).json({ message: "Upcoming event moved to deleted review.", event: item });
    }
    catch (error) {
        console.error("Error deleting upcoming event:", error);
        res.status(500).json({ message: "Error deleting upcoming event", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.deleteUpcomingEvent = deleteUpcomingEvent;
const getDeletedUpcomingEvents = async (_req, res) => {
    try {
        const items = await upcomingEvent_model_1.default.find({ isDeleted: true }).sort({ deletedAt: -1, updatedAt: -1 });
        res.status(200).json(items);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching deleted upcoming events", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.getDeletedUpcomingEvents = getDeletedUpcomingEvents;
const restoreUpcomingEvent = async (req, res) => {
    try {
        const item = await upcomingEvent_model_1.default.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "Upcoming event not found" });
        }
        item.set({
            isDeleted: false,
            deletedAt: null,
            deletedBy: { id: "", name: "", email: "", role: "" },
        });
        const restored = await item.save();
        res.status(200).json({ message: "Upcoming event restored successfully", event: restored });
    }
    catch (error) {
        res.status(500).json({ message: "Error restoring upcoming event", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.restoreUpcomingEvent = restoreUpcomingEvent;
const permanentDeleteUpcomingEvent = async (req, res) => {
    try {
        const item = await upcomingEvent_model_1.default.findByIdAndDelete(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "Upcoming event not found" });
        }
        res.status(200).json({ message: "Upcoming event permanently deleted", event: item });
    }
    catch (error) {
        res.status(500).json({ message: "Error permanently deleting upcoming event", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.permanentDeleteUpcomingEvent = permanentDeleteUpcomingEvent;
const undoLastUpcomingEventEdit = async (req, res) => {
    try {
        const item = await upcomingEvent_model_1.default.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "Upcoming event not found" });
        }
        const history = Array.isArray(item.editHistory) ? item.editHistory : [];
        const lastVersion = history[history.length - 1];
        if (!lastVersion) {
            return res.status(400).json({ message: "No edit history to undo." });
        }
        const currentSnapshot = {
            title: item.title,
            description: item.description,
            images: Array.isArray(item.images) ? item.images : [],
            isActive: item.isActive,
            editedAt: new Date(),
            editedBy: getEditorMeta(req),
        };
        item.set({
            title: lastVersion.title,
            description: lastVersion.description,
            images: Array.isArray(lastVersion.images) ? lastVersion.images : [],
            isActive: Boolean(lastVersion.isActive),
            editHistory: [...history.slice(0, -1), currentSnapshot],
        });
        const updated = await item.save();
        res.status(200).json({ message: "Upcoming event reverted to previous version", event: updated });
    }
    catch (error) {
        res.status(500).json({ message: "Error undoing upcoming event edit", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.undoLastUpcomingEventEdit = undoLastUpcomingEventEdit;
