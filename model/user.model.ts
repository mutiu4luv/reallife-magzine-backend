import { Schema, model } from "mongoose";

export type UserRole = "user" | "blogger" | "admin";
export type AdminRequestStatus = "none" | "pending" | "approved" | "rejected";
export type PermissionRequestStatus = "none" | "pending" | "approved" | "rejected";

const authTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
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
    authTokens: { type: [authTokenSchema], default: [] },
  },
  { timestamps: true }
);

export default model("User", userSchema);
