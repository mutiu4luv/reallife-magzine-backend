import { Schema, model } from "mongoose";

const readerCounterSchema = new Schema(
  {
    contentType: {
      type: String,
      enum: ["post", "news", "event"],
      required: true,
      index: true,
    },
    contentId: { type: String, required: true, trim: true, index: true },
    readers: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

readerCounterSchema.index({ contentType: 1, contentId: 1 }, { unique: true });

export default model("ReaderCounter", readerCounterSchema);
