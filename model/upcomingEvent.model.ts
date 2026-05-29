import { Schema, model } from "mongoose";

const upcomingEventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    images: { type: [String], required: true, default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: {
      id: { type: String, default: "" },
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      role: { type: String, default: "" },
    },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: {
      id: { type: String, default: "" },
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      role: { type: String, default: "" },
    },
    editHistory: {
      type: [
        {
          title: { type: String, required: true },
          description: { type: String, required: true },
          images: { type: [String], default: [] },
          isActive: { type: Boolean, default: true },
          editedAt: { type: Date, default: Date.now },
          editedBy: {
            id: { type: String, default: "" },
            name: { type: String, default: "" },
            email: { type: String, default: "" },
            role: { type: String, default: "" },
          },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export default model("UpcomingEvent", upcomingEventSchema);
