"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const contactMessageSchema = new mongoose_1.Schema({
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 180 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("ContactMessage", contactMessageSchema);
