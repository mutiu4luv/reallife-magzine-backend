"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const testimonySchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("Testimony", testimonySchema);
