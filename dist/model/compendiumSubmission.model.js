"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const responseSchema = new mongoose_1.Schema({
    prompt: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
}, { _id: false });
const compendiumSubmissionSchema = new mongoose_1.Schema({
    messageType: {
        type: String,
        enum: ["interview", "tribute", "goodwill", "congratulatory"],
        required: true,
        index: true,
    },
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 180 },
    phone: { type: String, required: true, trim: true, maxlength: 40 },
    organization: { type: String, default: "", trim: true, maxlength: 160 },
    headline: { type: String, default: "", trim: true, maxlength: 220 },
    message: { type: String, default: "", trim: true, maxlength: 10000 },
    advertRate: { type: String, default: "", trim: true, maxlength: 120 },
    responses: { type: [responseSchema], default: [] },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("CompendiumSubmission", compendiumSubmissionSchema);
