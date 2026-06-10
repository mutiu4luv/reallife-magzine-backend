"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const authTokenSchema = new mongoose_1.Schema({
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
}, { _id: false });
const userSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    phonenumber: { type: String, required: true, trim: true, unique: true },
    passwordHash: { type: String, required: true },
    address: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    role: { type: String, enum: ["user", "blogger", "admin"], default: "user" },
    permissions: { type: [String], default: [] },
    adminRequestStatus: {
        type: String,
        enum: ["none", "pending", "approved", "rejected"],
        default: "none",
    },
    adminRequestedAt: { type: Date },
    permissionRequestStatus: {
        type: String,
        enum: ["none", "pending", "approved", "rejected"],
        default: "none",
    },
    requestedPermissions: { type: [String], default: [] },
    permissionRequestedAt: { type: Date },
    magazineAccessStatus: {
        type: String,
        enum: ["none", "pending", "approved", "rejected"],
        default: "none",
    },
    magazineAccessReference: { type: String, default: "" },
    magazineAccessRequestedAt: { type: Date },
    magazineAccessApprovedAt: { type: Date },
    magazineAccessRejectedAt: { type: Date },
    authTokens: { type: [authTokenSchema], default: [] },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("User", userSchema);
