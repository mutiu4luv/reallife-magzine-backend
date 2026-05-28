"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const auditLogSchema = new mongoose_1.Schema({
    actorId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    actorName: { type: String, default: "", trim: true },
    actorEmail: { type: String, default: "", trim: true },
    action: { type: String, required: true, trim: true },
    resource: { type: String, required: true, trim: true },
    method: { type: String, default: "", trim: true },
    path: { type: String, default: "", trim: true },
    targetId: { type: String, default: "", trim: true },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("AuditLog", auditLogSchema);
