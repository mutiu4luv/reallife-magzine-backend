"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNews = exports.createNews = exports.getNewsById = exports.getNews = void 0;
const news_model_1 = __importDefault(require("../model/news.model"));
const databaseStatus_1 = require("../utils/databaseStatus");
const imageUpload_1 = require("../utils/imageUpload");
const getNews = async (_, res) => {
    try {
        if (!(0, databaseStatus_1.isDatabaseConnected)()) {
            (0, databaseStatus_1.sendEmptyListWhenDatabaseUnavailable)(res);
            return;
        }
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
        if (!(0, databaseStatus_1.isDatabaseConnected)()) {
            (0, databaseStatus_1.sendDatabaseUnavailable)(res);
            return;
        }
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
        if (!(0, databaseStatus_1.isDatabaseConnected)()) {
            (0, databaseStatus_1.sendDatabaseUnavailable)(res);
            return;
        }
        const { title, description, imageUrl, image } = req.body;
        const file = req.file;
        const imageSource = imageUrl || image;
        if (!title?.trim() || !description?.trim()) {
            return res.status(400).json({ message: "Title and description are required" });
        }
        const uploadedImageUrl = await (0, imageUpload_1.uploadImage)("reality_life_news", file, imageSource);
        if (!uploadedImageUrl) {
            return res.status(400).json({
                message: "Image is required. Upload a file named 'image' or provide an imageUrl.",
            });
        }
        const news = await news_model_1.default.create({
            title: title.trim(),
            description: description.trim(),
            image: uploadedImageUrl,
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
const deleteNews = async (req, res) => {
    try {
        if (!(0, databaseStatus_1.isDatabaseConnected)()) {
            (0, databaseStatus_1.sendDatabaseUnavailable)(res);
            return;
        }
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
