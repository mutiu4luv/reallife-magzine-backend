import { Schema, model } from "mongoose";

const pastEditionSchema = new Schema(
  {
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
  },
  { timestamps: true }
);

export default model("PastEdition", pastEditionSchema);
