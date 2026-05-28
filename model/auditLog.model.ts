import { Schema, model } from "mongoose";

const auditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    actorName: { type: String, default: "", trim: true },
    actorEmail: { type: String, default: "", trim: true },
    action: { type: String, required: true, trim: true },
    resource: { type: String, required: true, trim: true },
    method: { type: String, default: "", trim: true },
    path: { type: String, default: "", trim: true },
    targetId: { type: String, default: "", trim: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default model("AuditLog", auditLogSchema);
