"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementReaders = exports.getReaders = exports.likeComment = exports.createComment = exports.getComments = void 0;
const comment_model_1 = __importDefault(require("../model/comment.model"));
const readerCounter_model_1 = __importDefault(require("../model/readerCounter.model"));
const normalizeContentType = (value) => {
    const contentType = String(value || "").trim().toLowerCase();
    return contentType === "post" || contentType === "news" || contentType === "event" ? contentType : "";
};
const getComments = async (req, res) => {
    try {
        const contentType = normalizeContentType(req.query.contentType);
        const contentId = String(req.query.contentId || "").trim();
        if (!contentType || !contentId) {
            return res.status(400).json({ message: "contentType and contentId are required." });
        }
        const comments = await comment_model_1.default
            .find({ contentType, contentId })
            .sort({ createdAt: -1 });
        res.status(200).json(comments);
    }
    catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ message: "Error fetching comments" });
    }
};
exports.getComments = getComments;
const createComment = async (req, res) => {
    try {
        const contentType = normalizeContentType(req.body.contentType);
        const contentId = String(req.body.contentId || "").trim();
        const name = String(req.body.name || "").trim();
        const message = String(req.body.message || "").trim();
        if (!contentType || !contentId || !name || !message) {
            return res.status(400).json({ message: "contentType, contentId, name, and message are required." });
        }
        const comment = await comment_model_1.default.create({
            contentType,
            contentId,
            name,
            message,
            likes: 0,
        });
        res.status(201).json(comment);
    }
    catch (error) {
        console.error("Error creating comment:", error);
        res.status(500).json({ message: "Error creating comment" });
    }
};
exports.createComment = createComment;
const likeComment = async (req, res) => {
    try {
        const updated = await comment_model_1.default.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true });
        if (!updated) {
            return res.status(404).json({ message: "Comment not found" });
        }
        res.status(200).json(updated);
    }
    catch (error) {
        console.error("Error liking comment:", error);
        res.status(500).json({ message: "Error updating comment like" });
    }
};
exports.likeComment = likeComment;
const getReaders = async (req, res) => {
    try {
        const contentType = normalizeContentType(req.params.contentType);
        const contentId = String(req.params.contentId || "").trim();
        if (!contentType || !contentId) {
            return res.status(400).json({ message: "Valid content type and content id are required." });
        }
        const readerCounter = await readerCounter_model_1.default.findOne({ contentType, contentId });
        res.status(200).json({
            contentType,
            contentId,
            readers: Number(readerCounter?.readers || 0),
        });
    }
    catch (error) {
        console.error("Error fetching readers:", error);
        res.status(500).json({ message: "Error fetching reader count" });
    }
};
exports.getReaders = getReaders;
const incrementReaders = async (req, res) => {
    try {
        const contentType = normalizeContentType(req.params.contentType);
        const contentId = String(req.params.contentId || "").trim();
        if (!contentType || !contentId) {
            return res.status(400).json({ message: "Valid content type and content id are required." });
        }
        const updated = await readerCounter_model_1.default.findOneAndUpdate({ contentType, contentId }, { $inc: { readers: 1 } }, { new: true, upsert: true, setDefaultsOnInsert: true });
        res.status(200).json({
            contentType,
            contentId,
            readers: Number(updated?.readers || 0),
        });
    }
    catch (error) {
        console.error("Error incrementing readers:", error);
        res.status(500).json({ message: "Error updating reader count" });
    }
};
exports.incrementReaders = incrementReaders;
