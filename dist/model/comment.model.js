"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const commentSchema = new mongoose_1.Schema({
    contentType: {
        type: String,
        enum: ["post", "news", "event"],
        required: true,
        index: true,
    },
    contentId: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    likes: { type: Number, default: 0, min: 0 },
}, { timestamps: true });
commentSchema.index({ contentType: 1, contentId: 1, createdAt: -1 });
exports.default = (0, mongoose_1.model)("Comment", commentSchema);
