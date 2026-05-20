import { Schema, model } from "mongoose";

const photoGallerySchema = new Schema(
  {
    title: { type: String, default: "", trim: true },
    image: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model("PhotoGallery", photoGallerySchema);
