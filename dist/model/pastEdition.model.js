"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const pastEditionSchema = new mongoose_1.Schema({
    title: { type: String, trim: true, default: "" },
    image: { type: String, required: true },
    createdBy: {
        id: { type: String, default: "" },
        name: { type: String, default: "" },
        email: { type: String, default: "" },
        role: { type: String, default: "" },
    },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: {
        id: { type: String, default: "" },
        name: { type: String, default: "" },
        email: { type: String, default: "" },
        role: { type: String, default: "" },
    },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("PastEdition", pastEditionSchema);
