import { Schema, model } from "mongoose";

export type UserRole = "user" | "blogger" | "admin";
export type AdminRequestStatus = "none" | "pending" | "approved" | "rejected";
export type PermissionRequestStatus = "none" | "pending" | "approved" | "rejected";
export type MagazineAccessStatus = "none" | "pending" | "approved" | "rejected";

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
    magazineAccessStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    magazineAccessReference: { type: String, default: "" },
    magazineAccessRequestedAt: { type: Date },
    magazineAccessApprovedAt: { type: Date },
    magazineAccessRejectedAt: { type: Date },

magazinePurchases: {
  type: [
    {
      magazineId: { type: String, required: true },
      magazineTitle: { type: String, default: "" },
      status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
      reference: { type: String, default: "" },
      note: { type: String, default: "" },
      requestedAt: { type: Date },
      approvedAt: { type: Date },
      rejectedAt: { type: Date },
    },
  ],
  default: [],
},
    authTokens: { type: [authTokenSchema], default: [] },
  },
  { timestamps: true }
);

export default model("User", userSchema);
