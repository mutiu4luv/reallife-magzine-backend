import { Schema, model } from "mongoose";

const newsSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    images: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default model("News", newsSchema);
