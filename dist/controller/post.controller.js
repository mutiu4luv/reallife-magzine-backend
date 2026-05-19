"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePost = exports.updatePost = exports.createPost = exports.getPostById = exports.getPosts = void 0;
const post_model_1 = __importDefault(require("../model/post.model"));
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
const uploadPostImages = async (files, imageSources) => {
    const fileUrls = (await Promise.all(files.map((file) => (0, imageUpload_1.uploadImage)("reality_life_posts", file)))).filter((image) => Boolean(image));
    const sourceUrls = (await Promise.all(imageSources.map((imageSource) => (0, imageUpload_1.uploadImage)("reality_life_posts", undefined, imageSource)))).filter((image) => Boolean(image));
    return [...fileUrls, ...sourceUrls];
};
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
const getPostById = async (req, res) => {
    try {
        const post = await post_model_1.default.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        res.status(200).json(post);
    }
    catch (error) {
        console.error("Error fetching post:", error);
        res.status(500).json({ message: "Error fetching post", error: (0, imageUpload_1.getErrorMessage)(error) });
    }
};
exports.getPostById = getPostById;
const createPost = async (req, res) => {
    try {
        const { title, type, desc, imageUrl, image, imageUrls, images } = req.body;
        const files = getUploadedFiles(req);
        const imageSources = [
            ...parseImageList(imageUrls || images),
            ...parseImageList(imageUrl || image),
        ];
        if (!title || !type || !desc) {
            return res.status(400).json({ message: "Title, type, and description are required" });
        }
        const uploadedImages = await uploadPostImages(files, imageSources);
        if (!uploadedImages.length) {
            return res.status(400).json({
                message: "Image is required. Upload files named 'images' or provide imageUrls.",
            });
        }
        const post = await post_model_1.default.create({
            title,
            type,
            desc,
            image: uploadedImages[0],
            images: uploadedImages,
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
const updatePost = async (req, res) => {
    try {
        const existingPost = await post_model_1.default.findById(req.params.id);
        if (!existingPost) {
            return res.status(404).json({ message: "Post not found" });
        }
        const { title, type, desc, imageUrl, image, imageUrls, images } = req.body;
        const files = getUploadedFiles(req);
        const imageSources = [
            ...parseImageList(imageUrls || images),
            ...parseImageList(imageUrl || image),
        ];
        if (title !== undefined && !title?.trim()) {
            return res.status(400).json({ message: "Title cannot be empty" });
        }
        if (desc !== undefined && !desc?.trim()) {
            return res.status(400).json({ message: "Description cannot be empty" });
        }
        if (type !== undefined && !["Magazine", "Book"].includes(type)) {
            return res.status(400).json({ message: "Type must be Magazine or Book" });
        }
        const uploadedImages = await uploadPostImages(files, imageSources);
        const shouldUpdateImages = uploadedImages.length > 0;
        const currentImages = Array.isArray(existingPost.images) && existingPost.images.length
            ? existingPost.images
            : existingPost.image
                ? [existingPost.image]
                : [];
        const nextImages = shouldUpdateImages ? uploadedImages : currentImages;
        existingPost.set({
            title: title === undefined ? existingPost.title : title.trim(),
            type: type === undefined ? existingPost.type : type,
            desc: desc === undefined ? existingPost.desc : desc.trim(),
            image: nextImages[0] || existingPost.image,
            images: nextImages,
        });
        const updatedPost = await existingPost.save();
        res.status(200).json(updatedPost);
    }
    catch (error) {
        console.error("Error updating post:", error);
        const errorMessage = (0, imageUpload_1.getErrorMessage)(error);
        const statusCode = errorMessage.toLowerCase().includes("timeout") ? 504 : 500;
        res.status(statusCode).json({ message: "Error updating post", error: errorMessage });
    }
};
exports.updatePost = updatePost;
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
