"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const photoGallerySchema = new mongoose_1.Schema({
    title: { type: String, default: "", trim: true },
    image: { type: String, required: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("PhotoGallery", photoGallerySchema);
