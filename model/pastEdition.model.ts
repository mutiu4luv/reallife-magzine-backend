import { Schema, model } from "mongoose";

const pastEditionSchema = new Schema(
  {
    title: { type: String, trim: true, default: "" },
    image: { type: String, required: true },
  },
  { timestamps: true }
);

export default model("PastEdition", pastEditionSchema);
