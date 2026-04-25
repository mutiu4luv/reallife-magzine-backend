import { Schema, model } from "mongoose";

const postSchema = new Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ["Magazine", "Book"], required: true },
    desc: { type: String, required: true },
    image: { type: String, required: true },
  },
  { timestamps: true }
);

export default model("Post", postSchema);
