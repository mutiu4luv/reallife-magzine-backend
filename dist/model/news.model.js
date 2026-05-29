"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const newsSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    images: { type: [String], default: [] },
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
                title: { type: String, required: true },
                description: { type: String, required: true },
                image: { type: String, required: true },
                images: { type: [String], default: [] },
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
exports.default = (0, mongoose_1.model)("News", newsSchema);
