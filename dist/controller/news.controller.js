"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.undoLastNewsEdit = exports.permanentDeleteNews = exports.restoreNews = exports.getDeletedNews = exports.deleteNews = exports.updateNews = exports.createNews = exports.getNewsById = exports.getNews = void 0;
const news_model_1 = __importDefault(require("../model/news.model"));
const imageUpload_1 = require("../utils/imageUpload");
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
const getUploadedFiles = (req) => {
    const requestWithFiles = req;
    return requestWithFiles.files?.length
        ? requestWithFiles.files
        : requestWithFiles.file
            ? [requestWithFiles.file]
            : [];
};
const uploadNewsImages = async (files, imageSources) => {
    const fileUrls = (await Promise.all(files.map((file) => (0, imageUpload_1.uploadImage)("reality_life_news", file)))).filter((image) => Boolean(image));
    const sourceUrls = (await Promise.all(imageSources.map((imageSource) => (0, imageUpload_1.uploadImage)("reality_life_news", undefined, imageSource)))).filter((image) => Boolean(image));
    return [...fileUrls, ...sourceUrls];
};
const getEditorMeta = (req) => ({
    id: String(req.user?._id || ""),
    name: req.user?.name || "",
    email: req.user?.email || "",
    role: req.user?.role || "",
});
const getNews = async (_, res) => {
    try {
        const news = await news_model_1.default.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
        res.status(200).json(news);
    }
    catch (error) {
        console.error("Error fetching news:", error);
        res.status(500).json({ message: "Error fetching news", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.getNews = getNews;
const getNewsById = async (req, res) => {
    try {
        const news = await news_model_1.default.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
        if (!news) {
            return res.status(404).json({ message: "News item not found" });
        }
        res.status(200).json(news);
    }
    catch (error) {
        console.error("Error fetching news item:", error);
        res.status(500).json({ message: "Error fetching news item", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.getNewsById = getNewsById;
const createNews = async (req, res) => {
    try {
        const { title, description, imageUrl, image, imageUrls, images } = req.body;
        const files = getUploadedFiles(req);
        const imageSources = [
            ...parseImageList(imageUrls || images),
            ...parseImageList(imageUrl || image),
        ];
        if (!title?.trim() || !description?.trim()) {
            return res.status(400).json({ message: "Title and description are required" });
        }
        const uploadedImages = await uploadNewsImages(files, imageSources);
        if (!uploadedImages.length) {
            return res.status(400).json({
                message: "Image is required. Upload files named 'images' or provide imageUrls.",
            });
        }
        const authReq = req;
        const news = await news_model_1.default.create({
            title: title.trim(),
            description: description.trim(),
            image: uploadedImages[0],
            images: uploadedImages,
            createdBy: getEditorMeta(authReq),
        });
        res.status(201).json(news);
    }
    catch (error) {
        console.error("Error creating news:", error);
        const errorMessage = (0, imageUpload_1.getErrorMessage)(error);
        const statusCode = errorMessage.toLowerCase().includes("timeout") ? 504 : 500;
        res.status(statusCode).json({ message: "Error creating news", error: errorMessage });
    }
};
exports.createNews = createNews;
const updateNews = async (req, res) => {
    try {
        const existingNews = await news_model_1.default.findById(req.params.id);
        if (!existingNews) {
            return res.status(404).json({ message: "News item not found" });
        }
        if (req.user?.role === "blogger") {
            const ownerId = String(existingNews.createdBy?.id || "");
            if (!ownerId || ownerId !== String(req.user?._id || "")) {
                return res.status(403).json({ message: "You can only edit news you created." });
            }
        }
        const { title, description, imageUrl, image, imageUrls, images } = req.body;
        const files = getUploadedFiles(req);
        const imageSources = [
            ...parseImageList(imageUrls || images),
            ...parseImageList(imageUrl || image),
        ];
        if (title !== undefined && !title?.trim()) {
            return res.status(400).json({ message: "Title cannot be empty" });
        }
        if (description !== undefined && !description?.trim()) {
            return res.status(400).json({ message: "Description cannot be empty" });
        }
        const uploadedImages = await uploadNewsImages(files, imageSources);
        const shouldUpdateImages = uploadedImages.length > 0;
        const currentImages = Array.isArray(existingNews.images) && existingNews.images.length
            ? existingNews.images
            : existingNews.image
                ? [existingNews.image]
                : [];
        const nextImages = shouldUpdateImages ? uploadedImages : currentImages;
        const previousVersion = {
            title: existingNews.title,
            description: existingNews.description,
            image: existingNews.image,
            images: Array.isArray(existingNews.images) ? existingNews.images : [],
            editedAt: new Date(),
            editedBy: getEditorMeta(req),
        };
        existingNews.set({
            title: title === undefined ? existingNews.title : title.trim(),
            description: description === undefined ? existingNews.description : description.trim(),
            image: nextImages[0] || existingNews.image,
            images: nextImages,
            editHistory: [...(existingNews.editHistory || []), previousVersion],
        });
        const updatedNews = await existingNews.save();
        res.status(200).json(updatedNews);
    }
    catch (error) {
        console.error("Error updating news:", error);
        const errorMessage = (0, imageUpload_1.getErrorMessage)(error);
        const statusCode = errorMessage.toLowerCase().includes("timeout") ? 504 : 500;
        res.status(statusCode).json({ message: "Error updating news", error: errorMessage });
    }
};
exports.updateNews = updateNews;
const deleteNews = async (req, res) => {
    try {
        const news = await news_model_1.default.findById(req.params.id);
        if (!news) {
            return res.status(404).json({ message: "News item not found" });
        }
        if (req.user?.role === "admin") {
            const deletedNews = await news_model_1.default.findByIdAndDelete(req.params.id);
            return res.status(200).json({ message: "News deleted permanently", news: deletedNews });
        }
        news.set({
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: getEditorMeta(req),
        });
        await news.save();
        res.status(200).json({ message: "News moved to deleted review.", news });
    }
    catch (error) {
        console.error("Error deleting news:", error);
        res.status(500).json({ message: "Error deleting news", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.deleteNews = deleteNews;
const getDeletedNews = async (_req, res) => {
    try {
        const items = await news_model_1.default.find({ isDeleted: true }).sort({ deletedAt: -1, updatedAt: -1 });
        res.status(200).json(items);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching deleted news", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.getDeletedNews = getDeletedNews;
const restoreNews = async (req, res) => {
    try {
        const item = await news_model_1.default.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "News item not found" });
        }
        item.set({
            isDeleted: false,
            deletedAt: null,
            deletedBy: { id: "", name: "", email: "", role: "" },
        });
        const restored = await item.save();
        res.status(200).json({ message: "News restored successfully", news: restored });
    }
    catch (error) {
        res.status(500).json({ message: "Error restoring news", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.restoreNews = restoreNews;
const permanentDeleteNews = async (req, res) => {
    try {
        const item = await news_model_1.default.findByIdAndDelete(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "News item not found" });
        }
        res.status(200).json({ message: "News permanently deleted", news: item });
    }
    catch (error) {
        res.status(500).json({ message: "Error permanently deleting news", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.permanentDeleteNews = permanentDeleteNews;
const undoLastNewsEdit = async (req, res) => {
    try {
        const item = await news_model_1.default.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "News item not found" });
        }
        const history = Array.isArray(item.editHistory) ? item.editHistory : [];
        const lastVersion = history[history.length - 1];
        if (!lastVersion) {
            return res.status(400).json({ message: "No edit history to undo." });
        }
        const currentSnapshot = {
            title: item.title,
            description: item.description,
            image: item.image,
            images: Array.isArray(item.images) ? item.images : [],
            editedAt: new Date(),
            editedBy: getEditorMeta(req),
        };
        item.set({
            title: lastVersion.title,
            description: lastVersion.description,
            image: lastVersion.image,
            images: Array.isArray(lastVersion.images) ? lastVersion.images : [],
            editHistory: [...history.slice(0, -1), currentSnapshot],
        });
        const updated = await item.save();
        res.status(200).json({ message: "News reverted to previous version", news: updated });
    }
    catch (error) {
        res.status(500).json({ message: "Error undoing news edit", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.undoLastNewsEdit = undoLastNewsEdit;
