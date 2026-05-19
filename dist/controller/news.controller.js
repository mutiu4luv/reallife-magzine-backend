"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNews = exports.updateNews = exports.createNews = exports.getNewsById = exports.getNews = void 0;
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
const getNews = async (_, res) => {
    try {
        const news = await news_model_1.default.find().sort({ createdAt: -1 });
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
        const news = await news_model_1.default.findById(req.params.id);
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
        const news = await news_model_1.default.create({
            title: title.trim(),
            description: description.trim(),
            image: uploadedImages[0],
            images: uploadedImages,
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
        existingNews.set({
            title: title === undefined ? existingNews.title : title.trim(),
            description: description === undefined ? existingNews.description : description.trim(),
            image: nextImages[0] || existingNews.image,
            images: nextImages,
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
        const deletedNews = await news_model_1.default.findByIdAndDelete(req.params.id);
        if (!deletedNews) {
            return res.status(404).json({ message: "News item not found" });
        }
        res.status(200).json({ message: "News deleted successfully", news: deletedNews });
    }
    catch (error) {
        console.error("Error deleting news:", error);
        res.status(500).json({ message: "Error deleting news", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.deleteNews = deleteNews;
