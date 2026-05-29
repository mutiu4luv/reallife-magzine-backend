import { Schema, model } from "mongoose";

const photoGallerySchema = new Schema(
  {
    title: { type: String, default: "", trim: true },
    image: { type: String, required: true },
    isActive: { type: Boolean, default: true },
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

export default model("PhotoGallery", photoGallerySchema);
