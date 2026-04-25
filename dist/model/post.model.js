"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const postSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    type: { type: String, enum: ["Magazine", "Book"], required: true },
    desc: { type: String, required: true },
    image: { type: String, required: true },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("Post", postSchema);
