"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const qaSchema = new mongoose_1.Schema({
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
}, { _id: false });
const interviewSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    message: { type: String, default: "", trim: true },
    qa: { type: [qaSchema], default: [] },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: {
        id: { type: String, default: "" },
        name: { type: String, default: "" },
        email: { type: String, default: "" },
        role: { type: String, default: "" },
    },
    editHistory: {
        type: [
            {
                name: { type: String, required: true },
                role: { type: String, required: true },
                image: { type: String, required: true },
                message: { type: String, default: "" },
                qa: { type: [qaSchema], default: [] },
                isActive: { type: Boolean, default: true },
                editedAt: { type: Date, default: Date.now },
                editedBy: {
                    id: { type: String, default: "" },
                    name: { type: String, default: "" },
                    email: { type: String, default: "" },
                    role: { type: String, default: "" },
                },
            },
        ],
        default: [],
    },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("Interview", interviewSchema);
