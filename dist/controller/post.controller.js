"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePost = exports.createPost = exports.getPosts = void 0;
const post_model_1 = __importDefault(require("../model/post.model"));
const imageUpload_1 = require("../utils/imageUpload");
const getPosts = async (_, res) => {
    try {
        const posts = await post_model_1.default.find().sort({ createdAt: -1 });
        res.status(200).json(posts);
    }
    catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ message: "Error fetching posts", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.getPosts = getPosts;
const createPost = async (req, res) => {
    try {
        const { title, type, desc, imageUrl, image } = req.body;
        const file = req.file;
        const imageSource = imageUrl || image;
        if (!title || !type || !desc) {
            return res.status(400).json({ message: "Title, type, and description are required" });
        }
        const uploadedImageUrl = await (0, imageUpload_1.uploadImage)("reality_life_posts", file, imageSource);
        if (!uploadedImageUrl) {
            return res.status(400).json({
                message: "Image is required. Upload a file named 'image' or provide an imageUrl.",
            });
        }
        const post = await post_model_1.default.create({
            title,
            type,
            desc,
            image: uploadedImageUrl,
        });
        res.status(201).json(post);
    }
    catch (error) {
        console.error("Error creating post:", error);
        const errorMessage = (0, imageUpload_1.getErrorMessage)(error);
        const statusCode = errorMessage.toLowerCase().includes("timeout") ? 504 : 500;
        res.status(statusCode).json({ message: "Error creating post", error: errorMessage });
    }
};
exports.createPost = createPost;
const deletePost = async (req, res) => {
    try {
        const deletedPost = await post_model_1.default.findByIdAndDelete(req.params.id);
        if (!deletedPost) {
            return res.status(404).json({ message: "Post not found" });
        }
        res.status(200).json({ message: "Post deleted successfully", post: deletedPost });
    }
    catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ message: "Error deleting post", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.deletePost = deletePost;
