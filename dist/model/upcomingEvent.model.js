"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const upcomingEventSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("UpcomingEvent", upcomingEventSchema);
