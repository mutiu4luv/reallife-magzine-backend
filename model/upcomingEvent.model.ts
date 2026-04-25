import { Schema, model } from "mongoose";

const upcomingEventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model("UpcomingEvent", upcomingEventSchema);
