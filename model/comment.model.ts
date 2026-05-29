import { Schema, model } from "mongoose";

const commentSchema = new Schema(
  {
    contentType: {
      type: String,
      enum: ["post", "news", "event"],
      required: true,
      index: true,
    },
    contentId: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    likes: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

commentSchema.index({ contentType: 1, contentId: 1, createdAt: -1 });

export default model("Comment", commentSchema);
