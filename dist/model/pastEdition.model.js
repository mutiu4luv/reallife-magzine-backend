"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const pastEditionSchema = new mongoose_1.Schema({
    title: { type: String, trim: true, default: "" },
    image: { type: String, required: true },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("PastEdition", pastEditionSchema);
