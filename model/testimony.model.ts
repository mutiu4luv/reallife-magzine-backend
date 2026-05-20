import { Schema, model } from "mongoose";

const testimonySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model("Testimony", testimonySchema);
