"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const readerCounterSchema = new mongoose_1.Schema({
    contentType: {
        type: String,
        enum: ["post", "news", "event"],
        required: true,
        index: true,
    },
    contentId: { type: String, required: true, trim: true, index: true },
    readers: { type: Number, default: 0, min: 0 },
}, { timestamps: true });
readerCounterSchema.index({ contentType: 1, contentId: 1 }, { unique: true });
exports.default = (0, mongoose_1.model)("ReaderCounter", readerCounterSchema);
