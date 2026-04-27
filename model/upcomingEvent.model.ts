import { Schema, model } from "mongoose";

const upcomingEventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    images: { type: [String], required: true, default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model("UpcomingEvent", upcomingEventSchema);
